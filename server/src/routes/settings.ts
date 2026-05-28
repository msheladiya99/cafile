import express, { Response } from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET Settings (Authenticated)
// Anyone authenticated can read settings (e.g. client viewing invoice)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { Settings } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context required' });

        let settings = await Settings.findOne({ firmId });
        if (!settings) {
            settings = await Settings.create({
                firmId,
                companyName: 'CA OFFICE PORTAL',
                address: '',
                email: '',
                phone: ''
            });
        }
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// UPDATE Settings (Admin Only)
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Settings } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context required' });

        const { companyName, address, email, phone, logoUrl, employeeExtraFields, clientExtraFields } = req.body;

        let settings = await Settings.findOne({ firmId });
        if (!settings) {
            settings = await Settings.create({ firmId });
        }

        if (companyName !== undefined) settings.companyName = companyName;
        if (address !== undefined) settings.address = address;
        if (email !== undefined) settings.email = email;
        if (phone !== undefined) settings.phone = phone;
        if (logoUrl !== undefined) settings.logoUrl = logoUrl;

        if (employeeExtraFields) {
            settings.employeeExtraFields = {
                ...settings.employeeExtraFields,
                ...employeeExtraFields
            };
        }

        if (clientExtraFields) {
            settings.clientExtraFields = {
                ...settings.clientExtraFields,
                ...clientExtraFields
            };
        }

        settings.updatedAt = new Date();
        await settings.save();

        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Error updating settings' });
    }
});

export default router;
