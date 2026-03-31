import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest, authenticate, requireRoles } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

// Get applied tasks - FIXED FILTER ISOLATION
router.get('/', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { TaskApplicability } = (req as any).models;
        const { taskMasterId, clientId, clientGroupId } = req.query;
        
        if (!req.firmId) {
            res.status(401).json({ message: 'No firm context' });
            return;
        }

        // Build a flexible filter
        const filter: any = { firmId: new mongoose.Types.ObjectId(req.firmId) };

        if (taskMasterId && mongoose.Types.ObjectId.isValid(taskMasterId as string)) {
            filter.taskMasterId = new mongoose.Types.ObjectId(taskMasterId as string);
        }
        if (clientId && mongoose.Types.ObjectId.isValid(clientId as string)) {
            filter.clientId = new mongoose.Types.ObjectId(clientId as string);
        }
        if (clientGroupId && mongoose.Types.ObjectId.isValid(clientGroupId as string)) {
            filter.clientGroupId = new mongoose.Types.ObjectId(clientGroupId as string);
        }

        // Search the DB
        const applications = await TaskApplicability.find(filter)
            .populate('taskMasterId')
            .populate('clientId', 'name email groupName')
            .populate('clientGroupId', 'groupName')
            .sort({ createdAt: -1 });

        console.log(`[GET /task-applicability] Resolved firmId: ${req.firmId}, found: ${applications.length} total for taskMasterId: ${taskMasterId}`);
        
        res.json(applications);
    } catch (error) {
        console.error('Get task applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Apply task route (already robust, but ensuring 201 response has correct data)
router.post('/apply', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { TaskApplicability, TaskMaster, Task } = (req as any).models;
        const { taskMasterId, clientIds, groupIds, startDate, infinite, department, assignedTo } = req.body;

        if (!taskMasterId) return res.status(400).json({ message: 'Task required' });
        
        const firmId = new mongoose.Types.ObjectId(req.firmId);
        const tmId = new mongoose.Types.ObjectId(taskMasterId);
        const taskMaster = await TaskMaster.findOne({ _id: tmId, firmId });
        
        if (!taskMaster) return res.status(404).json({ message: 'Task Master not found' });

        const createdBy = new mongoose.Types.ObjectId(req.user!.userId);
        const targetDate = startDate ? new Date(startDate) : new Date();
        const year = targetDate.getFullYear().toString();

        const results: any[] = [];
        
        // Clients
        if (Array.isArray(clientIds)) {
            for (const cId of clientIds) {
                if (!mongoose.Types.ObjectId.isValid(cId)) continue;
                const cid = new mongoose.Types.ObjectId(cId);

                let app = await TaskApplicability.findOneAndUpdate(
                    { taskMasterId: tmId, clientId: cid, firmId },
                    { 
                        $set: { 
                            status: 'Active', 
                            startDate: targetDate, 
                            infinite: infinite ?? true,
                            createdBy,
                            frequency: taskMaster.frequency || 'One Time',
                            department: department || taskMaster.department
                        } 
                    },
                    { upsert: true, new: true }
                );

                // Create Task only if no active exists
                const existingTask = await Task.findOne({ clientId: cid, taskMasterId: tmId, firmId, status: { $nin: ['DONE', 'CANCELLED'] } });
                if (!existingTask) {
                    await new Task({
                        title: taskMaster.taskName,
                        category: 'CLIENT_WORK',
                        createdBy,
                        assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
                        clientId: cid,
                        firmId,
                        taskMasterId: tmId,
                        targetDate,
                        year,
                        checklist: (taskMaster.subtasks || []).map((s: any) => ({ id: uuidv4(), text: s.name, completed: false }))
                    }).save();
                }
                results.push(app);
            }
        }

        // Groups
        if (Array.isArray(groupIds)) {
            for (const cgId of groupIds) {
                if (!mongoose.Types.ObjectId.isValid(cgId)) continue;
                const cgid = new mongoose.Types.ObjectId(cgId);

                let app = await TaskApplicability.findOneAndUpdate(
                    { taskMasterId: tmId, clientGroupId: cgid, firmId },
                    { 
                        $set: { 
                            status: 'Active', 
                            startDate: targetDate, 
                            infinite: infinite ?? true,
                            createdBy,
                            frequency: taskMaster.frequency || 'One Time',
                            department: department || taskMaster.department
                        } 
                    },
                    { upsert: true, new: true }
                );

                const existingGroupTask = await Task.findOne({ clientGroupId: cgid, taskMasterId: tmId, firmId, status: { $nin: ['DONE', 'CANCELLED'] } });
                if (!existingGroupTask) {
                    await new Task({
                        title: taskMaster.taskName,
                        category: 'CLIENT_WORK',
                        createdBy,
                        assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
                        clientGroupId: cgid,
                        firmId,
                        taskMasterId: tmId,
                        targetDate,
                        year
                    }).save();
                }
                results.push(app);
            }
        }

        res.status(201).json({ message: `Success. ${results.length} items applied.`, count: results.length });
    } catch (error: any) {
        console.error('Apply error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
