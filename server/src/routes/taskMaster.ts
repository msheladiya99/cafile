import { Router, Response } from 'express';
import { TaskMaster } from '../models/TaskMaster';
import { authenticate, requireStaff, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Get all task masters for a firm
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const query: any = { firmId: req.user?.firmId };
        const taskMasters = await TaskMaster.find(query).populate('reportingManager', 'name email').sort({ createdAt: -1 });
        res.json(taskMasters);
    } catch (error) {
        console.error('Error fetching task masters:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create task master
router.post('/', requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const taskMaster = new TaskMaster({
            ...req.body,
            firmId: req.user?.firmId,
            createdBy: req.user?._id
        });
        await taskMaster.save();
        res.status(201).json(taskMaster);
    } catch (error) {
        console.error('Error creating task master:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task master
router.put('/:id', requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const taskMaster = await TaskMaster.findOneAndUpdate(
            { _id: req.params.id, firmId: req.user?.firmId },
            { $set: req.body },
            { new: true }
        );
        if (!taskMaster) return res.status(404).json({ message: 'Task master not found' });
        res.json(taskMaster);
    } catch (error) {
        console.error('Error updating task master:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task master
router.delete('/:id', requireStaff, async (req: AuthRequest, res: Response) => {
    try {
        const taskMaster = await TaskMaster.findOneAndDelete({ _id: req.params.id, firmId: req.user?.firmId });
        if (!taskMaster) return res.status(404).json({ message: 'Task master not found' });
        res.json({ message: 'Task master deleted' });
    } catch (error) {
        console.error('Error deleting task master:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
