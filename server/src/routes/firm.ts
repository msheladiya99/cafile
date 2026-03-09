import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { FirmMaster } from '../models/FirmMaster';
import { FirmDocument } from '../models/FirmDocument';
import { MultiFirm } from '../models/MultiFirm';
import { TaxDetail } from '../models/TaxDetail';
import { Currency } from '../models/Currency';
import { getDriveService } from '../services/googleDrive';
import { upload, uploadAny } from '../middleware/upload';
import mongoose from 'mongoose';
import fs from 'fs';

const router = Router();
router.use(authenticate);

// GET /api/firm — get firm details (single record, upserted)
router.get('/', async (_req: AuthRequest, res: Response) => {
    try {
        let firm = await FirmMaster.findOne();
        if (!firm) {
            // Auto-create a blank firm master on first access
            firm = await FirmMaster.create({ firmName: 'My CA Firm' });
        }
        res.json(firm);
    } catch (error) {
        console.error('Get firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/firm — update firm details (admin only)
router.put('/', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
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
                return p;
            });
        }

        let firm = await FirmMaster.findOne();
        if (!firm) {
            firm = await FirmMaster.create({ firmName: 'My CA Firm', ...updates });
        } else {
            Object.assign(firm, updates);
            await firm.save();
        }
        res.json(firm);
    } catch (error) {
        console.error('Update firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/firm/logo — upload firm logo
router.post('/logo', requireAdmin, upload.single('logo'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const driveService = getDriveService();
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm assets');

        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );
        fs.unlinkSync(req.file.path);

        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;
        let firm = await FirmMaster.findOne();
        if (!firm) firm = await FirmMaster.create({ firmName: 'My CA Firm' });
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
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const driveService = getDriveService();
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm assets');

        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );
        fs.unlinkSync(req.file.path);

        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;
        let firm = await FirmMaster.findOne();
        if (!firm) firm = await FirmMaster.create({ firmName: 'My CA Firm' });
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
        const driveService = getDriveService();
        const fileBuffer = fs.readFileSync(req.file.path);

        // Use a dedicated folder for branding assets
        const folderId = await driveService.ensureFolder('firm assets');

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

export default router;

// GET all firm documents
router.get('/documents', async (_req: AuthRequest, res: Response) => {
    try {
        const docs = await FirmDocument.find().sort({ createdAt: -1 }).lean();
        res.json(docs);
    } catch (error) {
        console.error('Get firm documents error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - upload a new firm document
router.post('/documents', requireAdmin, uploadAny.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const { documentName, documentNumber, description } = req.body;
        if (!documentName) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Document name is required' });
            return;
        }

        let fileUrl = '';
        let fileId = '';
        let fileName = '';
        let fileSize = 0;

        if (req.file) {
            const driveService = getDriveService();
            const fileBuffer = fs.readFileSync(req.file.path);

            // Ensure the folder "firm document" exists and get its ID
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

        const doc = await FirmDocument.create({ documentName, documentNumber, description, fileUrl, fileId, fileName, fileSize });
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
        const doc = await FirmDocument.findById(req.params.id);
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

        await FirmDocument.findByIdAndDelete(req.params.id);
        res.json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Delete firm document error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Multi Firm Routes ────────────────────────────────────────────────────────

// GET all multi-firms
router.get('/multi', async (_req: AuthRequest, res: Response) => {
    try {
        const firms = await MultiFirm.find().sort({ createdAt: -1 }).lean();
        res.json(firms);
    } catch (error) {
        console.error('Get multi firms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - create multi firm
router.post('/multi', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const firm = await MultiFirm.create(req.body);
        res.json(firm);
    } catch (error) {
        console.error('Create multi firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT - update multi firm
router.put('/multi/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const firm = await MultiFirm.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
        await MultiFirm.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Delete multi firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST - upload multi firm logo
router.post('/multi/:id/logo', requireAdmin, upload.single('logo'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) { res.status(400).json({ message: 'No file' }); return; }
        const driveService = getDriveService();
        const buf = fs.readFileSync(req.file.path);
        const folderId = await driveService.ensureFolder('firm assets');
        const result = await driveService.uploadFile(buf, req.file.originalname, req.file.mimetype, folderId);
        fs.unlinkSync(req.file.path);
        const url = `https://drive.google.com/uc?export=view&id=${result.fileId}`;
        await MultiFirm.findByIdAndUpdate(req.params.id, { logoUrl: url });
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
        if (!req.file) { res.status(400).json({ message: 'No file' }); return; }
        const driveService = getDriveService();
        const buf = fs.readFileSync(req.file.path);
        const folderId = await driveService.ensureFolder('firm assets');
        const result = await driveService.uploadFile(buf, req.file.originalname, req.file.mimetype, folderId);
        fs.unlinkSync(req.file.path);
        const url = `https://drive.google.com/uc?export=view&id=${result.fileId}`;
        await MultiFirm.findByIdAndUpdate(req.params.id, { signImageUrl: url });
        res.json({ signImageUrl: url });
    } catch (error) {
        console.error('Multi firm sign error:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Tax Detail Routes ──────────────────────────────────────────────────────

router.get('/tax', async (_req: AuthRequest, res: Response) => {
    try { res.json(await TaxDetail.find().sort({ createdAt: -1 }).lean()); }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/tax', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        // If new tax is default, unset others
        if (req.body.isDefault) await TaxDetail.updateMany({}, { isDefault: false });
        const tax = await TaxDetail.create(req.body);
        res.json(tax);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.put('/tax/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        if (req.body.isDefault) await TaxDetail.updateMany({}, { isDefault: false });
        const tax = await TaxDetail.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tax) { res.status(404).json({ message: 'Not found' }); return; }
        res.json(tax);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/tax/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try { await TaxDetail.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

// ─── Currency Routes ──────────────────────────────────────────────────────

router.get('/currency', async (_req: AuthRequest, res: Response) => {
    try { res.json(await Currency.find().sort({ isDefault: -1, currencyCode: 1 }).lean()); }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.post('/currency', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        if (req.body.isDefault) await Currency.updateMany({}, { isDefault: false });
        const currency = await Currency.create(req.body);
        res.json(currency);
    } catch (error) {
        console.error(error);
        // Duplicate key
        if ((error as NodeJS.ErrnoException).code === '11000') {
            res.status(400).json({ message: 'Currency code already exists' });
        } else {
            res.status(500).json({ message: 'Server error' });
        }
    }
});

router.put('/currency/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        if (req.body.isDefault) await Currency.updateMany({}, { isDefault: false });
        const currency = await Currency.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!currency) { res.status(404).json({ message: 'Not found' }); return; }
        res.json(currency);
    } catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

router.delete('/currency/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try { await Currency.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
    catch (error) { console.error(error); res.status(500).json({ message: 'Server error' }); }
});

