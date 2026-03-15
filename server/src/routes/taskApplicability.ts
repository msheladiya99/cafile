import { Router, Response } from 'express';
import { TaskApplicability } from '../models/TaskApplicability';
import { TaskMaster } from '../models/TaskMaster';
import { Task } from '../models/Task';
import { AuthRequest, authenticate, requireRoles } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate);

// Get applied tasks
router.get('/', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { taskMasterId, clientId } = req.query;
        const filter: any = { firmId: req.firmId };

        if (taskMasterId) filter.taskMasterId = taskMasterId;
        if (clientId) filter.clientId = clientId;

        const applications = await TaskApplicability.find(filter)
            .populate('taskMasterId')
            .populate('clientId', 'name email')
            .populate('clientGroupId', 'groupName');

        res.json(applications);
    } catch (error) {
        console.error('Get task applications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Apply task to multiple clients
router.post('/apply', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { taskMasterId, clientIds, groupIds, startDate, infinite, department } = req.body;

        if (!taskMasterId || (!clientIds?.length && !groupIds?.length)) {
            res.status(400).json({ message: 'Task and at least one Client/Group are required' });
            return;
        }

        const taskMaster = await TaskMaster.findById(taskMasterId);
        if (!taskMaster) {
            res.status(404).json({ message: 'Task Master not found' });
            return;
        }

        const firmId = req.firmId;
        const createdBy = req.user!.userId;

        const results = [];

        // Apply to individual clients
        if (clientIds?.length) {
            for (const clientId of clientIds) {
                try {
                    const applicability = await TaskApplicability.findOneAndUpdate(
                        { taskMasterId, clientId, firmId },
                        {
                            startDate: new Date(startDate),
                            infinite,
                            frequency: taskMaster.frequency || 'One Time',
                            createdBy,
                            department: department || taskMaster.department,
                            status: 'Active'
                        },
                        { upsert: true, new: true }
                    );

                    // Create the first instance of the task
                    const firstTask = new Task({
                        title: taskMaster.taskName,
                        description: taskMaster.description,
                        category: 'CLIENT_WORK',
                        createdBy,
                        assignedTo: taskMaster.reportingManager ? [taskMaster.reportingManager] : [],
                        clientId,
                        firmId,
                        billingAmount: taskMaster.billingAmount || 0,
                        targetDate: new Date(startDate),
                        estimatedHours: 1,
                        checklist: taskMaster.subtasks.map(s => ({
                            id: uuidv4(),
                            text: s.name,
                            completed: false
                        }))
                    });
                    await firstTask.save();

                    results.push(applicability);
                } catch (e) {
                    console.error(`Error applying to client ${clientId}:`, e);
                }
            }
        }

        // Apply to groups
        if (groupIds?.length) {
            for (const clientGroupId of groupIds) {
                try {
                    const applicability = await TaskApplicability.findOneAndUpdate(
                        { taskMasterId, clientGroupId, firmId },
                        {
                            startDate: new Date(startDate),
                            infinite,
                            frequency: taskMaster.frequency || 'One Time',
                            createdBy,
                            department: department || taskMaster.department,
                            status: 'Active'
                        },
                        { upsert: true, new: true }
                    );
                    results.push(applicability);
                } catch (e) {
                    console.error(`Error applying to group ${clientGroupId}:`, e);
                }
            }
        }

        res.status(201).json({
            message: 'Task applied successfully',
            count: results.length
        });
    } catch (error) {
        console.error('Apply task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
