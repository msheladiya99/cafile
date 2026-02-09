import express, { Request, Response } from 'express';
import Settings from '../models/Settings';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET Settings (Authenticated)
// Anyone authenticated can read settings (e.g. client viewing invoice)
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({
                companyName: 'CA OFFICE PORTAL',
                address: '123 Business Street, Tech City, India',
                email: 'contact@caoffice.com',
                phone: '+91 98765 43210'
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// UPDATE Settings (Admin Only)
router.put('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { companyName, address, email, phone, logoUrl } = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }

        if (companyName) settings.companyName = companyName;
        if (address) settings.address = address;
        if (email) settings.email = email;
        if (phone) settings.phone = phone;
        if (logoUrl !== undefined) settings.logoUrl = logoUrl;

        settings.updatedAt = new Date();
        await settings.save();

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
});

export default router;
