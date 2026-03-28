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
        const { taskMasterId, clientId, clientGroupId } = req.query;
        const filter: any = { firmId: req.firmId };

        if (taskMasterId) {
            // When fetching by task, return ALL applicabilities (client + group)
            filter.taskMasterId = taskMasterId;
        } else {
            // When fetching by client or group specifically
            if (clientId) filter.clientId = clientId;
            if (clientGroupId) filter.clientGroupId = clientGroupId;
        }

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

        const taskMaster = await TaskMaster.findOne({ _id: taskMasterId, firmId: req.firmId });
        if (!taskMaster) {
            res.status(404).json({ message: 'Task Master not found' });
            return;
        }

        const firmId = req.firmId;
        const createdBy = req.user!.userId;

        const results = [];
        const errors: { id: string; error: string }[] = [];

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
                            itStatus: req.body.itStatus,
                            subMaster: req.body.subMaster,
                            status: 'Active'
                        },
                        { upsert: true, new: true }
                    );

                    const firstTask = new Task({
                        title: taskMaster.taskName,
                        description: taskMaster.description,
                        category: 'CLIENT_WORK',  // valid enum — department stored in TaskApplicability
                        createdBy,
                        assignedTo: [],
                        reportingManager: taskMaster.reportingManager,
                        clientId,
                        firmId,
                        multiFirmId: taskMaster.multiFirmId || undefined,
                        taskMasterId: taskMaster._id,
                        frequency: taskMaster.frequency || 'One Time',
                        billingAmount: taskMaster.billingAmount || 0,
                        billingType: 'SINGLE_CLIENT',
                        targetDate: new Date(startDate),
                        estimatedHours: taskMaster.estimatedHours || 1,
                        checklist: taskMaster.subtasks.map(s => ({
                            id: uuidv4(),
                            text: s.name,
                            completed: false
                        }))
                    });
                    await firstTask.save();

                    results.push(applicability);
                } catch (e: any) {
                    const msg = e?.code === 11000
                        ? 'Already applied to this client'
                        : (e?.message || 'Unknown error');
                    errors.push({ id: clientId, error: msg });
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

                    const groupTask = new Task({
                        title: taskMaster.taskName,
                        description: taskMaster.description,
                        category: 'CLIENT_WORK',  // valid enum — department stored in TaskApplicability
                        createdBy,
                        assignedTo: [],
                        reportingManager: taskMaster.reportingManager,
                        clientGroupId,
                        firmId,
                        multiFirmId: taskMaster.multiFirmId || undefined,
                        taskMasterId: taskMaster._id,
                        frequency: taskMaster.frequency || 'One Time',
                        billingAmount: taskMaster.billingAmount || 0,
                        billingType: 'GROUP',
                        targetDate: new Date(startDate),
                        estimatedHours: taskMaster.estimatedHours || 1,
                        checklist: taskMaster.subtasks.map(s => ({
                            id: uuidv4(),
                            text: s.name,
                            completed: false
                        }))
                    });
                    await groupTask.save();

                    results.push(applicability);
                } catch (e: any) {
                    const msg = e?.code === 11000
                        ? 'Already applied to this group'
                        : (e?.message || 'Unknown error');
                    errors.push({ id: clientGroupId, error: msg });
                    console.error(`Error applying to group ${clientGroupId}:`, e);
                }
            }
        }

        res.status(201).json({
            message: `Task applied successfully to ${results.length} client(s)/group(s)`,
            count: results.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Apply task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove task applicability
router.delete('/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const applicability = await TaskApplicability.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!applicability) {
            res.status(404).json({ message: 'Applicability record not found' });
            return;
        }
        await TaskApplicability.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        res.json({ message: 'Task applicability removed successfully' });
    } catch (error) {
        console.error('Remove applicability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
