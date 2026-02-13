import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Notice } from '../models/Notice';

const router = express.Router();

// Get active notices (For Clients/Staff)
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const notices = await Notice.find({
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } }, // No expiry
                { expiresAt: { $gt: now } }        // Not yet expired
            ]
        }).sort({ createdAt: -1 }).lean();

        res.json(notices);
    } catch (error) {
        console.error('Error fetching active notices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all notices (Admin only)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Access check
        if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const notices = await Notice.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username')
            .lean();

        res.json(notices);
    } catch (error) {
        console.error('Error fetching all notices:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notice (Admin only)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, message, type, expiresAt } = req.body;

        const notice = new Notice({
            title,
            message,
            type: type || 'INFO',
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            createdBy: req.user!.userId,
            isActive: true
        });

        await notice.save();
        res.status(201).json(notice);

    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update notice (Admin only)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const updates = req.body;

        const notice = await Notice.findByIdAndUpdate(id, updates, { new: true });

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        res.json(notice);

    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete notice (Admin only)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user!.role !== 'ADMIN' && req.user!.role !== 'MANAGER') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        await Notice.findByIdAndDelete(id);

        res.json({ message: 'Notice deleted' });

    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
