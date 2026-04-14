import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { storageService } from '../services/storage.service';
import { ocrService } from '../services/ocr.service';
import { TaxNotice, TaxNoticeTemplate } from '../models/TaxNotice';
import { taxNoticeAIService } from '../services/taxNoticeAI.service';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
        if (allowed) cb(null, true);
        else cb(new Error('Only PDF/JPG/PNG/WEBP notices are allowed.'));
    },
});

async function extractOCRText(buffer: Buffer, mimeType: string): Promise<string> {
    const result = await ocrService.extractText(buffer, mimeType);
    return result.text || '';
}

router.post(
    '/upload-analyze',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
        try {
            if (!req.file) return res.status(400).json({ message: 'No notice file uploaded.' });
            if (!req.firmId) return res.status(400).json({ message: 'Firm context missing.' });

            const replyStyle = req.body.replyStyle === 'Strong Legal Reply' ? 'Strong Legal Reply' : 'Auto Reply';
            const includeSimpleExplanation = String(req.body.includeSimpleExplanation || 'true') === 'true';
            const clientId = req.body.clientId ? String(req.body.clientId) : '';

            const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
            const duplicate = await TaxNotice.findOne({ firmId: req.firmId, fileHash }).lean();
            if (duplicate) {
                return res.status(200).json({
                    message: 'Duplicate notice detected. Returning existing analysis.',
                    duplicate: true,
                    notice: duplicate,
                });
            }

            const models = (req as any).models || {};
            let clientData: any = null;
            if (clientId && models.Client) {
                clientData = await models.Client.findOne({ _id: clientId, firmId: req.firmId }).lean();
            }

            const uploaded = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                clientData?.panNumber,
                clientData?.name
            );

            const ocrText = await extractOCRText(req.file.buffer, req.file.mimetype);
            if (!ocrText || ocrText.trim().length < 40) {
                return res.status(400).json({ message: 'Unable to extract sufficient notice text from file.' });
            }

            const ai = await taxNoticeAIService.analyzeNotice(ocrText, {
                replyStyle,
                includeSimpleExplanation,
            });

            const notice = await TaxNotice.create({
                firmId: req.firmId,
                clientId: clientId || undefined,
                uploadedBy: req.user?._id,
                originalFileName: req.file.originalname,
                mimeType: req.file.mimetype,
                fileHash,
                fileUrl: uploaded.url,
                driveFileId: uploaded.fileId,
                ocrText,
                noticeClassification: ai.parsed.notice_classification,
                issueAnalysis: ai.parsed.issue_analysis,
                replyDraft: ai.parsed.reply_draft,
                supportingDocuments: ai.parsed.supporting_documents,
                complianceStrategy: ai.parsed.compliance_strategy,
                riskAssessment: ai.parsed.risk_assessment,
                deadlineManagement: ai.parsed.deadline_management,
                aiConfidenceScore: ai.parsed.ai_confidence_score,
                aiRawResponse: ai.raw,
                explanationSimple: ai.simpleExplanation,
                replyStyle,
                status: 'draft',
            });

            const similarCases = await TaxNotice.find({
                firmId: req.firmId,
                _id: { $ne: notice._id },
                $or: [
                    { 'noticeClassification.section_or_act': ai.parsed.notice_classification.section_or_act },
                    { 'noticeClassification.type': ai.parsed.notice_classification.type },
                ],
            })
                .sort({ createdAt: -1 })
                .select('_id originalFileName noticeClassification replyDraft.subject createdAt')
                .limit(5)
                .lean();

            return res.status(201).json({
                message: 'Notice analyzed successfully.',
                duplicate: false,
                notice,
                similarCases,
            });
        } catch (err: any) {
            console.error('[tax-notice] upload-analyze error:', err);
            return res.status(500).json({ message: err.message || 'Failed to analyze tax notice.' });
        }
    }
);

router.get(
    '/history',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const list = await TaxNotice.find({ firmId: req.firmId })
                .sort({ createdAt: -1 })
                .limit(200)
                .select('_id originalFileName noticeClassification riskAssessment deadlineManagement aiConfidenceScore status createdAt')
                .lean();
            return res.json({ data: list });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to fetch notice history.' });
        }
    }
);

router.get(
    '/detail/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const notice = await TaxNotice.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!notice) return res.status(404).json({ message: 'Notice not found.' });
            return res.json(notice);
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to fetch notice.' });
        }
    }
);

router.patch(
    '/draft/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const payload = req.body || {};
            const update: Record<string, any> = {
                status: payload.status === 'reviewed' ? 'reviewed' : 'draft',
            };

            if (payload.replyDraft) {
                update.replyDraft = {
                    subject: String(payload.replyDraft.subject || ''),
                    letter_body: String(payload.replyDraft.letter_body || ''),
                    legal_references: Array.isArray(payload.replyDraft.legal_references)
                        ? payload.replyDraft.legal_references.map((x: any) => String(x))
                        : [],
                };
            }

            if (payload.supportingDocuments) {
                update.supportingDocuments = Array.isArray(payload.supportingDocuments)
                    ? payload.supportingDocuments.map((x: any) => String(x))
                    : [];
            }

            if (payload.complianceStrategy) {
                update.complianceStrategy = {
                    step_by_step: Array.isArray(payload.complianceStrategy.step_by_step)
                        ? payload.complianceStrategy.step_by_step.map((x: any) => String(x))
                        : [],
                    portal_action: String(payload.complianceStrategy.portal_action || ''),
                };
            }

            const notice = await TaxNotice.findOneAndUpdate(
                { _id: req.params.id, firmId: req.firmId },
                { $set: update },
                { new: true }
            );
            if (!notice) return res.status(404).json({ message: 'Notice not found.' });
            return res.json({ message: 'Draft saved.', notice });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to save draft.' });
        }
    }
);

router.get(
    '/templates/list',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const templates = await TaxNoticeTemplate.find({ firmId: req.firmId })
                .sort({ createdAt: -1 })
                .limit(100)
                .lean();
            return res.json({ data: templates });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to fetch templates.' });
        }
    }
);

router.post(
    '/templates',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { noticeId, name } = req.body || {};
            if (!noticeId || !name) {
                return res.status(400).json({ message: 'noticeId and name are required.' });
            }

            const notice = await TaxNotice.findOne({ _id: noticeId, firmId: req.firmId });
            if (!notice) return res.status(404).json({ message: 'Notice not found.' });

            const existing = await TaxNoticeTemplate.findOne({ firmId: req.firmId, name: String(name).trim() });
            if (existing) return res.status(409).json({ message: 'Template name already exists.' });

            const template = await TaxNoticeTemplate.create({
                firmId: req.firmId,
                name: String(name).trim(),
                noticeType: notice.noticeClassification.type,
                sectionOrAct: notice.noticeClassification.section_or_act,
                subject: notice.replyDraft.subject,
                letterBody: notice.replyDraft.letter_body,
                legalReferences: notice.replyDraft.legal_references,
                createdBy: req.user?._id,
            });

            return res.status(201).json({ message: 'Template saved.', template });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to create template.' });
        }
    }
);

router.get(
    '/compare/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const id = String(req.params.id || '');
            const notice = await TaxNotice.findOne({ _id: id, firmId: req.firmId }).lean();
            if (!notice) return res.status(404).json({ message: 'Notice not found.' });

            const section = notice.noticeClassification?.section_or_act || '';
            const type = notice.noticeClassification?.type || 'Other';

            const firmObjectId = new mongoose.Types.ObjectId(req.firmId);
            const similar = await TaxNotice.aggregate([
                {
                    $match: {
                        firmId: firmObjectId,
                        _id: { $ne: new mongoose.Types.ObjectId(id) },
                        $or: [
                            { 'noticeClassification.section_or_act': section },
                            { 'noticeClassification.type': type },
                        ],
                    },
                },
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        originalFileName: 1,
                        noticeClassification: 1,
                        'replyDraft.subject': 1,
                        riskAssessment: 1,
                        createdAt: 1,
                    },
                },
            ]);

            return res.json({ data: similar });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Failed to compare previous cases.' });
        }
    }
);

export default router;
