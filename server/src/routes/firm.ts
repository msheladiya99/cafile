import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireAdmin, requireStaff } from '../middleware/auth';
import { getDriveService, getTenantDriveService } from '../services/googleDrive';
import { upload, uploadAny } from '../middleware/upload';
import mongoose from 'mongoose';
import fs from 'fs';
import { getFirmId } from '../utils/context';

const router = Router();

// GET /api/firm/public — get basic firm info (branding, etc.) without auth
// This is used by the login page to show firm name/logo
router.get('/public', async (req, res: Response) => {
    try {
        // Subdomain is already resolved by tenantMiddleware (req.firmId)
        if (!req.firm) {
            return res.status(404).json({ message: 'Firm not found' });
        }
        const { firmName, logo, plan, status } = req.firm;
        res.json({ firmName, logo, plan, status });
    } catch (error) {
        console.error('Public firm info error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.use(authenticate);

// GET /api/firm — get firm details (single record, upserted)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { FirmMaster } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) {
            return res.status(400).json({ message: 'Firm context required' });
        }

        let firm = await FirmMaster.findOne({ firmId });
        if (!firm) {
            // Auto-create a blank firm master for this specific firm
            firm = await FirmMaster.create({
                firmId,
                firmName: req.firm?.firmName || 'My CA Firm'
            });
        }
        res.json(firm);
    } catch (error) {
        console.error('Get firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/firm — update firm details (admin or super-admin only)
router.put('/', requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const { FirmMaster } = (req as any).models;
        console.log('UPDATE_FIRM_START', 'REQ_FID:', req.firmId, 'CTX_FID:', getFirmId(), 'USER_FID:', req.user?.firmId);
        const updates = req.body;
        delete updates._id;
        delete updates.__v;
        delete updates.createdAt;
        // Allow clearing the logo/signature via main update if passed as empty string
        if (updates.logoUrl === '') {
            updates.logoUrl = '';
        } else {
            delete updates.logoUrl;           // use dedicated endpoints for upload
        }

        if (updates.signatureImageUrl === '') {
            updates.signatureImageUrl = '';
        } else {
            delete updates.signatureImageUrl; // use dedicated endpoints for upload
        }

        // Sanitize empty strings for Date fields to prevent Mongoose CastError
        if (updates.membershipDate === '') updates.membershipDate = null;
        if (updates.frnDate === '') updates.frnDate = null;

        if (updates.partners) {
            updates.partners = updates.partners.map((p: any) => {
                if (p.joiningDate === '') p.joiningDate = null;
                if (p.retirementDate === '') p.retirementDate = null;
                if (p.dob === '') p.dob = null;
                if (p.enrollDate === '') p.enrollDate = null;
                return p;
            });
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        let firm = await FirmMaster.findOne({ firmId });
        if (!firm) {
            firm = await FirmMaster.create({ firmId, firmName: req.firm?.firmName || 'My CA Firm', ...updates });
        } else {
            Object.assign(firm, updates);
            await firm.save();
        }
        res.json(firm);
    } catch (error: any) {
        const errMsg = 'Update firm error details: ' + (error as Error).stack;
        console.error(errMsg);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error: ' + Object.values(error.errors).map((e: any) => e.message).join(', ') });
        }
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// POST /api/firm/logo — upload firm logo
router.post('/logo', requireAdmin, upload.single('logo'), async (req: AuthRequest, res: Response) => {
    try {
        const { FirmMaster } = (req as any).models;
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm document');

        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );
        fs.unlinkSync(req.file.path);

        const firmId = req.firmId || req.user?.firmId;
        const directLink = `https://lh3.googleusercontent.com/d/${uploadResult.fileId}`;
        let firm = await FirmMaster.findOne({ firmId });
        if (!firm) firm = await FirmMaster.create({ firmId, firmName: req.firm?.firmName || 'My CA Firm' });
        firm.logoUrl = directLink;
        await firm.save();

        res.json({ message: 'Logo uploaded', logoUrl: directLink });
    } catch (error) {
        console.error('Upload logo error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/firm/stamp — upload firm stamp
router.post('/stamp', requireAdmin, upload.single('stamp'), async (req: AuthRequest, res: Response) => {
    try {
        const { FirmMaster } = (req as any).models;
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm document');

        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );
        fs.unlinkSync(req.file.path);

        const firmId = req.firmId || req.user?.firmId;
        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;
        let firm = await FirmMaster.findOne({ firmId });
        if (!firm) firm = await FirmMaster.create({ firmId, firmName: req.firm?.firmName || 'My CA Firm' });
        firm.signatureImageUrl = directLink;
        await firm.save();

        res.json({ message: 'Stamp uploaded', stampImageUrl: directLink });
    } catch (error) {
        console.error('Upload stamp error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/firm/upload — generic upload (returns link without updating firm record)
router.post('/upload', requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm document');

        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );
        fs.unlinkSync(req.file.path);

        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;
        res.json({ url: directLink });
    } catch (error) {
        console.error('Generic upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET all firm documents
router.get('/documents', async (req: AuthRequest, res: Response) => {
    try {
        const { FirmDocument } = (req as any).models;
        const branchFirmId = (req.query.branchFirmId as string) || 'primary';
        const docs = await FirmDocument.find({ firmId: req.firmId, branchFirmId }).sort({ createdAt: -1 }).lean();
        res.json(docs);
    } catch (error) {
        console.error('Get firm documents error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - upload a new firm document
router.post('/documents', requireAdmin, uploadAny.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const { FirmDocument } = (req as any).models;
        const { documentName, documentNumber, description, branchFirmId } = req.body;
        if (!documentName) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Document name is required' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Firm context missing' });
            return;
        }

        const activeBranchId = branchFirmId || 'primary';

        let fileUrl = '';
        let fileId = '';
        let fileName = '';
        let fileSize = 0;

        if (req.file) {
            const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
            const fileBuffer = fs.readFileSync(req.file.path);

            // Ensure firm document folder exists
            const folderId = await driveService.ensureFolder('firm document');

            const uploadResult = await driveService.uploadFile(
                fileBuffer,
                req.file.originalname,
                req.file.mimetype,
                folderId
            );
            fs.unlinkSync(req.file.path);
            fileUrl = uploadResult.webViewLink || `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;
            fileId = uploadResult.fileId;
            fileName = req.file.originalname;
            fileSize = req.file.size;
        }

        const doc = await FirmDocument.create({ firmId, branchFirmId: activeBranchId, documentName, documentNumber, description, fileUrl, fileId, fileName, fileSize });
        res.json(doc);
    } catch (error) {
        console.error('Add firm document error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a firm document
router.delete('/documents/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { FirmDocument } = (req as any).models;
        const doc = await FirmDocument.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!doc) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }

        if (doc.fileId) {
            const driveService = getDriveService();
            try {
                await driveService.deleteFile(doc.fileId);
            } catch (driveError) {
                console.error('Failed to delete firm document from Google Drive:', driveError);
                // Continue with DB deletion even if drive deletion fails (might already be deleted)
            }
        }

        await FirmDocument.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete firm document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Multi Firm Routes ────────────────────────────────────────────────────────

// GET all multi-firms
router.get('/multi', async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        const firms = await MultiFirm.find({ firmId: req.firmId }).sort({ createdAt: -1 }).lean();
        res.json(firms);
    } catch (error) {
        console.error('Get multi firms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - create multi firm
router.post('/multi', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        const payload = { ...req.body };
        if (payload.partners) {
            payload.partners = payload.partners.map((p: any) => {
                if (p.joiningDate === '') p.joiningDate = null;
                if (p.retirementDate === '') p.retirementDate = null;
                if (p.dob === '') p.dob = null;
                if (p.enrollDate === '') p.enrollDate = null;
                return p;
            });
        }

        const firm = await MultiFirm.create({ ...payload, firmId });
        res.json(firm);
    } catch (error) {
        console.error('Create multi firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT - update multi firm
router.put('/multi/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;

        const payload = { ...req.body };
        if (payload.partners) {
            payload.partners = payload.partners.map((p: any) => {
                if (p.joiningDate === '') p.joiningDate = null;
                if (p.retirementDate === '') p.retirementDate = null;
                if (p.dob === '') p.dob = null;
                if (p.enrollDate === '') p.enrollDate = null;
                return p;
            });
        }

        const firm = await MultiFirm.findOneAndUpdate({ _id: req.params.id, firmId }, payload, { new: true });
        if (!firm) { res.status(404).json({ message: 'Not found' }); return; }
        res.json(firm);
    } catch (error) {
        console.error('Update multi firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE multi firm
router.delete('/multi/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const result = await MultiFirm.findOneAndDelete({ _id: req.params.id, firmId });
        if (!result) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Delete multi firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - upload multi firm logo
router.post('/multi/:id/logo', requireAdmin, upload.single('logo'), async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        if (!req.file) { res.status(400).json({ message: 'No file' }); return; }
        const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
        const buf = fs.readFileSync(req.file.path);
        const folderId = await driveService.ensureFolder('firm document');
        const result = await driveService.uploadFile(buf, req.file.originalname, req.file.mimetype, folderId);
        fs.unlinkSync(req.file.path);
        const url = `https://drive.google.com/uc?export=view&id=${result.fileId}`;
        await MultiFirm.findOneAndUpdate({ _id: req.params.id, firmId: req.firmId }, { logoUrl: url });
        res.json({ logoUrl: url });
    } catch (error) {
        console.error('Multi firm logo error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - upload multi firm sign
router.post('/multi/:id/sign', requireAdmin, upload.single('sign'), async (req: AuthRequest, res: Response) => {
    try {
        const { MultiFirm } = (req as any).models;
        if (!req.file) { res.status(400).json({ message: 'No file' }); return; }
        const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
        const buf = fs.readFileSync(req.file.path);
        const folderId = await driveService.ensureFolder('firm document');
        const result = await driveService.uploadFile(buf, req.file.originalname, req.file.mimetype, folderId);
        fs.unlinkSync(req.file.path);
        const url = `https://drive.google.com/uc?export=view&id=${result.fileId}`;
        await MultiFirm.findOneAndUpdate({ _id: req.params.id, firmId: req.firmId }, { signImageUrl: url });
        res.json({ signImageUrl: url });
    } catch (error) {
        console.error('Multi firm sign error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Tax Detail Routes ──────────────────────────────────────────────────────

router.get('/tax', async (req: AuthRequest, res: Response) => {
    try {
        const { TaxDetail } = (req as any).models;
        const branchFirmId = (req.query.branchFirmId as string) || 'primary';
        res.json(await TaxDetail.find({ firmId: req.firmId, branchFirmId }).sort({ createdAt: -1 }).lean());
    }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/tax', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { TaxDetail } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });
        const branchFirmId = req.body.branchFirmId || 'primary';

        // If new tax is default, unset others for THIS firm and branch only
        if (req.body.isDefault) await TaxDetail.updateMany({ firmId, branchFirmId }, { isDefault: false });
        const tax = await TaxDetail.create({ ...req.body, firmId, branchFirmId });
        res.json(tax);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/tax/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { TaxDetail } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const branchFirmId = req.body.branchFirmId || 'primary';
        if (req.body.isDefault) await TaxDetail.updateMany({ firmId, branchFirmId }, { isDefault: false });
        const tax = await TaxDetail.findOneAndUpdate({ _id: req.params.id, firmId }, req.body, { new: true });
        if (!tax) { res.status(404).json({ message: 'Not found' }); return; }
        res.json(tax);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/tax/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { TaxDetail } = (req as any).models;
        await TaxDetail.findOneAndDelete({ _id: req.params.id, firmId: req.firmId }); res.json({ message: 'Deleted' });
    }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

// ─── Currency Routes ──────────────────────────────────────────────────────

router.get('/currency', async (req: AuthRequest, res: Response) => {
    try {
        const { Currency } = (req as any).models;
        const branchFirmId = (req.query.branchFirmId as string) || 'primary';
        res.json(await Currency.find({ firmId: req.firmId, branchFirmId }).sort({ isDefault: -1, currencyCode: 1 }).lean());
    }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/currency', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Currency } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });
        const branchFirmId = req.body.branchFirmId || 'primary';

        if (req.body.isDefault) await Currency.updateMany({ firmId, branchFirmId }, { isDefault: false });
        const currency = await Currency.create({ ...req.body, firmId, branchFirmId });
        res.json(currency);
    } catch (error) {
        console.error(error);
        // Duplicate key
        if ((error as any).code === '11000' || (error as any).code === 11000) {
            res.status(400).json({ message: 'Currency code already exists' });
        } else {
            res.status(500).json({ message: 'Server error' });
        }
    }
});

router.put('/currency/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Currency } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const branchFirmId = req.body.branchFirmId || 'primary';
        if (req.body.isDefault) await Currency.updateMany({ firmId, branchFirmId }, { isDefault: false });
        const currency = await Currency.findOneAndUpdate({ _id: req.params.id, firmId }, req.body, { new: true });
        if (!currency) { res.status(404).json({ message: 'Not found' }); return; }
        res.json(currency);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/currency/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Currency } = (req as any).models;
        await Currency.findOneAndDelete({ _id: req.params.id, firmId: req.firmId }); res.json({ message: 'Deleted' });
    }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

export default router;
