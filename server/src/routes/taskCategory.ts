import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireRoles } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate);

// GET all categories for this firm
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { TaskCategory } = (req as any).models;
        const categories = await TaskCategory.find({ firmId: req.firmId })
            .sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST create category
router.post('/', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { TaskCategory } = (req as any).models;
        const { name, color, description } = req.body;
        if (!name) { res.status(400).json({ message: 'Category name is required' }); return; }

        const existing = await TaskCategory.findOne({ name: name.trim(), firmId: req.firmId });
        if (existing) { res.status(409).json({ message: 'Category with this name already exists' }); return; }

        const cat = new TaskCategory({
            name: name.trim(),
            color: color || '#667eea',
            description: description || '',
            firmId: new mongoose.Types.ObjectId(req.firmId),
            createdBy: new mongoose.Types.ObjectId(req.user!.userId),
            status: 'Active'
        });
        await cat.save();
        res.status(201).json(cat);
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Server error' });
    }
});

// PUT update category
router.put('/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { TaskCategory } = (req as any).models;
        const cat = await TaskCategory.findOneAndUpdate(
            { _id: req.params.id, firmId: req.firmId },
            { $set: { name: req.body.name, color: req.body.color, description: req.body.description, status: req.body.status } },
            { new: true }
        );
        if (!cat) { res.status(404).json({ message: 'Category found' }); return; }
        res.json(cat);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE category
router.delete('/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { TaskCategory } = (req as any).models;
        const cat = await TaskCategory.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        if (!cat) { res.status(404).json({ message: 'Category not found' }); return; }
        res.json({ message: 'Category deleted' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
