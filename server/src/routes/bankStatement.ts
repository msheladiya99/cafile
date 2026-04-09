import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { BankStatement, ITransactionRow } from '../models/BankStatement';
import { parsePDF, parseCSV, computeTotals } from '../services/bankStatementParser';
import { generateExcel } from '../services/bankStatementExcel';

const router = Router();

// ─── Multer Config ────────────────────────────────────────────────────────────

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'text/csv', 'image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, CSV, JPG, PNG files are allowed'));
        }
    },
});

// ─── Ensure temp dir ──────────────────────────────────────────────────────────

const EXCEL_DIR = path.join(process.cwd(), 'tmp', 'bank-excel');
fs.mkdir(EXCEL_DIR, { recursive: true }).catch(() => {});

// ─── Helper: get models ───────────────────────────────────────────────────────

function getModels(req: AuthRequest) {
    return (req as any).models || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bank-statement/upload
// Upload a bank statement file and register it in DB (status = 'uploaded')
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/upload',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
        try {
            const { clientId } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            if (!clientId) {
                return res.status(400).json({ message: 'clientId is required' });
            }

            const { Client } = getModels(req);
            if (Client) {
                const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
                if (!client) {
                    return res.status(404).json({ message: 'Client not found' });
                }
            }

            // Create DB record
            const statement = new BankStatement({
                firmId: req.firmId,
                clientId,
                uploadedBy: req.user!._id,
                originalFileName: req.file.originalname,
                status: 'uploaded',
            });

            await statement.save();

            return res.status(201).json({
                message: 'File uploaded. Use /process/:id to extract transactions.',
                id: statement._id,
                fileName: req.file.originalname,
                status: 'uploaded',
            });
        } catch (err: any) {
            console.error('Bank statement upload error:', err);
            res.status(500).json({ message: err.message || 'Upload failed' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bank-statement/upload-process
// Upload AND process in one step (preferred for UI)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/upload-process',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
        let statementId: string | undefined;

        try {
            const { clientId } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            if (!clientId) {
                return res.status(400).json({ message: 'clientId is required' });
            }

            // Create record
            const statement = new BankStatement({
                firmId: req.firmId,
                clientId,
                uploadedBy: req.user!._id,
                originalFileName: req.file.originalname,
                status: 'processing',
            });

            await statement.save();
            statementId = (statement._id as any).toString();

            // Parse
            const mimeType = req.file.mimetype;
            let result;

            if (mimeType === 'application/pdf') {
                result = await parsePDF(req.file.buffer);
            } else if (mimeType === 'text/csv' || req.file.originalname.endsWith('.csv')) {
                result = await parseCSV(req.file.buffer);
            } else {
                // Image: mark for future OCR integration
                result = {
                    rows: [] as ITransactionRow[],
                    bankName: '',
                    accountNumber: '',
                    statementPeriod: '',
                    errors: ['Image files require OCR processing. Please convert to PDF first, or enter data manually.'],
                    warnings: [],
                    processingMethod: 'ocr' as const,
                };
            }

            const { totalDebit, totalCredit } = computeTotals(result.rows);

            // Update record
            statement.extractedRows = result.rows;
            statement.bankName = result.bankName;
            statement.accountNumber = result.accountNumber;
            statement.statementPeriod = result.statementPeriod;
            statement.processingErrors = result.errors;
            statement.processingWarnings = result.warnings;
            statement.totalDebit = totalDebit;
            statement.totalCredit = totalCredit;
            statement.transactionCount = result.rows.length;
            statement.processingMethod = result.processingMethod;
            statement.status = result.errors.length > 0 && result.rows.length === 0 ? 'failed' : 'completed';

            await statement.save();

            return res.status(200).json({
                message: 'Bank statement processed successfully',
                id: statementId,
                bankName: result.bankName,
                accountNumber: result.accountNumber,
                statementPeriod: result.statementPeriod,
                transactionCount: result.rows.length,
                totalDebit,
                totalCredit,
                rows: result.rows,
                processingErrors: result.errors,
                processingWarnings: result.warnings,
                status: statement.status,
            });
        } catch (err: any) {
            console.error('Bank statement process error:', err);

            // Mark as failed
            if (statementId) {
                await BankStatement.findByIdAndUpdate(statementId, {
                    status: 'failed',
                    processingErrors: [err.message],
                }).catch(() => {});
            }

            res.status(500).json({ message: err.message || 'Processing failed' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank-statement/:id
// Get a single bank statement record
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOne({
                _id: req.params.id,
                firmId: req.firmId,
            });

            if (!statement) {
                return res.status(404).json({ message: 'Bank statement not found' });
            }

            return res.json(statement);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank-statement/client/:clientId
// List all bank statements for a client
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/client/:clientId',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statements = await BankStatement.find({
                clientId: req.params.clientId,
                firmId: req.firmId,
            })
                .sort({ createdAt: -1 })
                .select('-extractedRows')
                .lean();

            return res.json(statements);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/bank-statement/:id/rows
// Update rows (manual correction from UI)
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
    '/:id/rows',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { rows } = req.body;
            if (!Array.isArray(rows)) {
                return res.status(400).json({ message: 'rows must be an array' });
            }

            const statement = await BankStatement.findOne({
                _id: req.params.id,
                firmId: req.firmId,
            });

            if (!statement) {
                return res.status(404).json({ message: 'Bank statement not found' });
            }

            const { totalDebit, totalCredit } = computeTotals(rows);
            statement.extractedRows = rows;
            statement.totalDebit = totalDebit;
            statement.totalCredit = totalCredit;
            statement.transactionCount = rows.length;
            statement.status = 'completed';

            await statement.save();

            return res.json({ message: 'Rows updated', totalDebit, totalCredit, transactionCount: rows.length });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bank-statement/:id/download-excel
// Generate & download Excel
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/:id/download-excel',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOne({
                _id: req.params.id,
                firmId: req.firmId,
            });

            if (!statement) {
                return res.status(404).json({ message: 'Bank statement not found' });
            }

            if (statement.extractedRows.length === 0) {
                return res.status(400).json({ message: 'No extracted rows to export' });
            }

            // Get client name
            const { Client } = getModels(req);
            let clientName = 'Client';
            if (Client) {
                const client = await Client.findById(statement.clientId).lean();
                if (client) clientName = (client as any).name || 'Client';
            }

            const excelBuffer = await generateExcel(statement.extractedRows, {
                clientName,
                bankName: statement.bankName || 'Bank',
                accountNumber: statement.accountNumber,
                statementPeriod: statement.statementPeriod,
                totalDebit: statement.totalDebit,
                totalCredit: statement.totalCredit,
            });

            const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeClientName}_bank_statement.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', excelBuffer.length);

            return res.send(excelBuffer);
        } catch (err: any) {
            console.error('Excel generation error:', err);
            res.status(500).json({ message: err.message || 'Excel generation failed' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/bank-statement/:id
// Delete a bank statement record
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOneAndDelete({
                _id: req.params.id,
                firmId: req.firmId,
            });

            if (!statement) {
                return res.status(404).json({ message: 'Bank statement not found' });
            }

            return res.json({ message: 'Bank statement deleted' });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
