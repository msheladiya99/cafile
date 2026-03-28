import { Router, Response } from 'express';
import { Task, TaskStatus } from '../models/Task';
import { User } from '../models/User';
import { AuthRequest, authenticate, requireRoles } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import Invoice from '../models/Invoice';
import { MultiFirm } from '../models/MultiFirm';
import mongoose from 'mongoose';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// ADMIN FEATURES - Task Creation & Oversight
// ============================================

// Create a new task (Admin, Manager, Staff)
router.post('/', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const {
            title,
            description,
            category,
            assignedTo,
            clientId,
            clientGroupId,
            billingType,
            priority,
            targetDate,
            estimatedHours,
            tags,
            checklist,
            firmId,
            billingAmount,
            reportingManager,
            frequency,
            taskMasterId,
            year,
            department
        } = req.body;

        if (!title || !targetDate || !estimatedHours) {
            res.status(400).json({ message: 'Title, target date, and estimated hours are required' });
            return;
        }

        // Validate assigned users exist
        if (assignedTo && assignedTo.length > 0) {
            const users = await User.find({ _id: { $in: assignedTo } });
            if (users.length !== assignedTo.length) {
                res.status(400).json({ message: 'One or more assigned users not found' });
                return;
            }
        }

        const task = new Task({
            title,
            description,
            category,
            createdBy: req.user!.userId,
            assignedTo: assignedTo || [],
            clientId,
            clientGroupId,
            billingType: billingType || 'SINGLE_CLIENT',
            priority: priority || 'MEDIUM',
            targetDate: new Date(targetDate),
            estimatedHours,
            tags: tags || [],
            firmId: firmId || req.firmId || req.user?.firmId,
            billingAmount: billingAmount || 0,
            reportingManager,
            frequency,
            taskMasterId,
            year,
            department,
            checklist: checklist ? checklist.map((item: string) => ({
                id: uuidv4(),
                text: item,
                completed: false
            })) : []
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('createdBy', 'username name email')
            .populate('assignedTo', 'username name email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName')
            .populate('reportingManager', 'username name email')
            .populate('taskMasterId', 'taskName frequency');

        res.status(201).json({
            task: populatedTask,
            message: 'Task created successfully'
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tasks with filters (Admin Dashboard)
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status, priority, assignedTo, clientId, clientGroupId, overdue, myTasks, taskMasterId, frequency, reportingManager, year, department } = req.query;

        const filter: any = { firmId: req.firmId };

        // Role-based filtering (STRICT ISOLATION with Approval Support)
        if (req.user!.role === 'STAFF' || req.user!.role === 'INTERN') {
            // Staff/Interns see tasks assigned to them OR tasks they need to approve
            filter.$or = [
                { assignedTo: req.user!.userId },
                { reportingManager: req.user!.userId }
            ];
        } else {
            // Admin/Manager can override with specific filters
            if (myTasks === 'true') {
                filter.$or = [
                    { assignedTo: req.user!.userId },
                    { reportingManager: req.user!.userId }
                ];
            } else {
                if (assignedTo) {
                    filter.assignedTo = assignedTo;
                }
                if (reportingManager) {
                    filter.reportingManager = reportingManager;
                }
            }
        }

        // Apply shared filters
        if (status) {
            filter.status = status;
        }
        if (priority) {
            filter.priority = priority;
        }
        if (clientId) {
            filter.clientId = clientId;
        }
        if (clientGroupId) {
            filter.clientGroupId = clientGroupId;
        }
        if (taskMasterId) {
            filter.taskMasterId = taskMasterId;
        }
        if (frequency) {
            filter.frequency = frequency;
        }
        if (reportingManager) {
            filter.reportingManager = reportingManager;
        }
        if (overdue === 'true') {
            filter.targetDate = { $lt: new Date() };
            filter.status = { $nin: ['DONE', 'CANCELLED'] };
        }
        if (year) {
            filter.year = year;
        }
        if (department) {
            filter.department = department;
        }

        const tasks = await Task.find(filter)
            .populate('createdBy', 'username name email')
            .populate('assignedTo', 'username name email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName')
            .populate('reportingManager', 'username name email')
            .sort({ priority: -1, targetDate: 1 })
            .lean();

        // Dynamically calculate overdue status for each task
        const now = new Date();
        const tasksWithOverdue = tasks.map(task => ({
            ...task,
            isOverdue: task.status !== 'DONE' && task.status !== 'CANCELLED' && task.targetDate && new Date(task.targetDate) < now
        }));

        res.json(tasksWithOverdue);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// TRANSFER TASK  — registered BEFORE /:id
// ============================================

// Get tasks for transfer preview
router.get('/transfer/preview', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { fromUserId, clientId, taskMasterId, frequency } = req.query;
        if (!fromUserId) {
            res.status(400).json({ message: 'fromUserId is required' });
            return;
        }
        const filter: any = {
            firmId: req.firmId,
            assignedTo: fromUserId,
            status: { $nin: ['DONE', 'CANCELLED'] }
        };
        if (clientId) filter.clientId = clientId;
        if (taskMasterId) filter.taskMasterId = taskMasterId;
        if (frequency) filter.frequency = frequency;

        const now = new Date();
        const tasks = await Task.find(filter)
            .populate('clientId', 'name email')
            .populate('assignedTo', 'name username')
            .populate('taskMasterId', 'taskName frequency')
            .sort({ targetDate: 1 })
            .lean();

        const tasksWithOverdue = tasks.map(t => ({
            ...t,
            isOverdue: t.status !== 'DONE' && t.status !== 'CANCELLED' && t.targetDate && new Date(t.targetDate) < now
        }));
        res.json(tasksWithOverdue);
    } catch (error) {
        console.error('Transfer preview error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Transfer tasks from one employee to another
router.post('/transfer', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { fromUserId, toUserId, clientId, taskMasterId, frequency, removeFromCurrent } = req.body;
        if (!fromUserId || !toUserId) {
            res.status(400).json({ message: 'fromUserId and toUserId are required' });
            return;
        }
        if (fromUserId === toUserId) {
            res.status(400).json({ message: 'Transfer From and Transfer To cannot be the same employee' });
            return;
        }
        const filter: any = {
            firmId: req.firmId,
            assignedTo: fromUserId,
            status: { $nin: ['DONE', 'CANCELLED'] }
        };
        if (clientId) filter.clientId = clientId;
        if (taskMasterId) filter.taskMasterId = taskMasterId;
        if (frequency) filter.frequency = frequency;

        const tasks = await Task.find(filter);
        if (tasks.length === 0) {
            res.status(404).json({ message: 'No eligible tasks found for transfer' });
            return;
        }
        for (const task of tasks) {
            if (removeFromCurrent) {
                task.assignedTo = task.assignedTo.filter((id: any) => id.toString() !== fromUserId) as any;
            }
            const alreadyAssigned = task.assignedTo.some((id: any) => id.toString() === toUserId);
            if (!alreadyAssigned) {
                (task.assignedTo as any).push(toUserId);
            }
            await task.save();
        }
        res.json({ message: `${tasks.length} task(s) transferred successfully`, transferredCount: tasks.length });
    } catch (error) {
        console.error('Transfer task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get staff-wise task history (Ledger style)
router.get('/staff-history', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { staffId, startDate, endDate, status } = req.query;

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            const sDate = new Date(startDate as string);
            if (!isNaN(sDate.getTime())) {
                dateFilter.createdAt = { $gte: sDate };
            }
        }
        if (endDate) {
            const eDate = new Date(endDate as string);
            if (!isNaN(eDate.getTime())) {
                dateFilter.createdAt = { ...dateFilter.createdAt, $lte: eDate };
            }
        }

        // Get all staff members (anyone who is not a client)
        const staffFilter: any = { role: { $ne: 'CLIENT' } };
        if (staffId) {
            staffFilter._id = staffId;
        }

        console.log('Staff History Request:', {
            query: req.query,
            staffFilter,
            dateFilter
        });

        const staffMembers = await User.find(staffFilter).select('_id username name email role').lean();
        console.log(`Found ${staffMembers.length} staff members for history ledger`);

        // [PERFORMANCE] Pre-fetch all tasks for these staff members
        const allTasksFilter: any = {
            assignedTo: { $in: staffMembers.map(s => s._id) },
            ...dateFilter
        };
        if (status) {
            allTasksFilter.status = status;
        }

        const allTasks = await Task.find(allTasksFilter)
            .populate('createdBy', 'username name')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName')
            .sort({ createdAt: -1 })
            .lean();

        // [PERFORMANCE] Group tasks by staff ID
        const tasksByStaff = new Map<string, any[]>();
        allTasks.forEach(task => {
            task.assignedTo.forEach((assignedUserId: any) => {
                const uid = assignedUserId.toString();
                if (!tasksByStaff.has(uid)) {
                    tasksByStaff.set(uid, []);
                }
                tasksByStaff.get(uid)!.push(task);
            });
        });

        // Get tasks for each staff member
        const staffHistory = staffMembers.map((staff) => {
            try {
                const tasks: any[] = tasksByStaff.get(staff._id.toString()) || [];

                // Calculate staff metrics
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.status === 'DONE').length;
                const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
                const inProgressTasks = tasks.filter(t => t.status === 'IN_PROCESS').length;
                const underReviewTasks = tasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').length;
                const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'DONE').length;

                // Time tracking metrics
                const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
                const totalActualMinutes = tasks.reduce((sum, t) => sum + (t.actualTimeSpent || 0), 0);
                const totalActualHours = Math.round((totalActualMinutes / 60) * 100) / 100;

                // Efficiency calculation
                const completedTasksWithTime = tasks.filter(t => t.status === 'DONE' && (t.actualTimeSpent || 0) > 0);
                const avgEfficiency = completedTasksWithTime.length > 0
                    ? Math.round(
                        completedTasksWithTime.reduce((acc, task) => {
                            const estimated = (task.estimatedHours || 0) * 60;
                            const actual = task.actualTimeSpent || 0;
                            return acc + (estimated / actual) * 100;
                        }, 0) / completedTasksWithTime.length
                    )
                    : 0;

                // On-time completion rate
                const completedOnTime = tasks.filter(t =>
                    t.status === 'DONE' &&
                    t.completedAt &&
                    new Date(t.completedAt) <= new Date(t.targetDate)
                ).length;
                const onTimeRate = completedTasks > 0
                    ? Math.round((completedOnTime / completedTasks) * 100)
                    : 0;

                // Average revision count
                const avgRevisions = completedTasks > 0
                    ? Math.round((tasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.revisionCount || 0), 0) / completedTasks) * 100) / 100
                    : 0;

                return {
                    staff: {
                        _id: staff._id,
                        username: staff.username,
                        name: staff.name,
                        email: staff.email,
                        role: staff.role
                    },
                    summary: {
                        totalTasks,
                        completedTasks,
                        pendingTasks,
                        inProgressTasks,
                        underReviewTasks,
                        overdueTasks,
                        totalEstimatedHours,
                        totalActualHours,
                        avgEfficiency,
                        onTimeRate,
                        avgRevisions,
                        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
                    },
                    tasks: tasks.map(task => ({
                        _id: task._id,
                        title: task.title,
                        description: task.description,
                        category: task.category,
                        status: task.status,
                        priority: task.priority,
                        createdBy: task.createdBy,
                        client: task.clientId,
                        clientGroup: task.clientGroupId,
                        billingType: task.billingType,
                        firmId: task.firmId,
                        billingAmount: task.billingAmount || 0,
                        targetDate: task.targetDate,
                        startDate: task.startDate,
                        completedAt: task.completedAt,
                        estimatedHours: task.estimatedHours || 0,
                        actualTimeSpent: task.actualTimeSpent || 0,
                        actualHours: Math.round(((task.actualTimeSpent || 0) / 60) * 100) / 100,
                        progressPercentage: task.progressPercentage || 0,
                        revisionCount: task.revisionCount || 0,
                        isOverdue: !!task.isOverdue,
                        tags: task.tags || [],
                        commentsCount: (task.comments || []).length,
                        checklistProgress: (task.checklist || []).length > 0
                            ? `${(task.checklist || []).filter((c: any) => c.completed).length}/${(task.checklist || []).length}`
                            : '0/0',
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt
                    }))
                };
            } catch (staffError) {
                console.error(`Error processing history for staff ${staff.username}:`, staffError);
                // Return basic info so other staff members' data can still load
                return {
                    staff: {
                        _id: staff._id,
                        username: staff.username,
                        role: staff.role
                    },
                    summary: { totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, underReviewTasks: 0, overdueTasks: 0, totalEstimatedHours: 0, totalActualHours: 0, avgEfficiency: 0, onTimeRate: 0, avgRevisions: 0, completionRate: 0 },
                    tasks: [],
                    error: 'Failed to load details for this staff member'
                };
            }
        }
        );

        // Sort by total tasks (descending)
        staffHistory.sort((a, b) => b.summary.totalTasks - a.summary.totalTasks);

        res.json({
            staffHistory,
            totalStaff: staffHistory.length,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error('Get staff history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// TIMESHEET — Entry / Task / Subtask wise
// ============================================
router.get('/timesheet', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const {
            clientGroupId, clientId, taskMasterId, frequency,
            assignedTo, reportingManager,
            year, status,
            dateFrom, dateTo,
            view // 'entry' | 'task' | 'subtask'
        } = req.query;

        // Build base filter
        const filter: any = { firmId: req.firmId };

        // Role isolation — staff only see their own data
        if (req.user!.role === 'STAFF' || req.user!.role === 'INTERN') {
            filter.$or = [
                { assignedTo: req.user!.userId },
                { reportingManager: req.user!.userId }
            ];
        } else {
            if (assignedTo) filter.assignedTo = assignedTo;
            if (reportingManager) filter.reportingManager = reportingManager;
        }

        if (clientGroupId) filter.clientGroupId = clientGroupId;
        if (clientId) filter.clientId = clientId;
        if (taskMasterId) filter.taskMasterId = taskMasterId;
        if (frequency) filter.frequency = frequency;
        if (status) filter.status = status;

        // Date filter on timeEntries.startTime (for entry-wise) or createdAt (general)
        const entryDateFilter: any = {};
        if (dateFrom) {
            const df = new Date(dateFrom as string);
            if (!isNaN(df.getTime())) entryDateFilter.$gte = df;
        }
        if (dateTo) {
            const dt = new Date(dateTo as string);
            if (!isNaN(dt.getTime())) {
                dt.setHours(23, 59, 59, 999);
                entryDateFilter.$lte = dt;
            }
        }

        // Year filter: map e.g. "2025-2026" to Apr 2025 – Mar 2026
        if (year) {
            const parts = (year as string).split('-');
            if (parts.length === 2) {
                const startYr = parseInt(parts[0]);
                const endYr = parseInt(parts[1]);
                if (!isNaN(startYr) && !isNaN(endYr)) {
                    filter.createdAt = {
                        $gte: new Date(`${startYr}-04-01`),
                        $lte: new Date(`${endYr}-03-31T23:59:59.999Z`)
                    };
                }
            }
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name username email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('taskMasterId', 'taskName frequency')
            .populate('reportingManager', 'name username email')
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 })
            .lean();

        const now = new Date();

        if (view === 'entry') {
            // ── Entry Wise: one row per time-entry ──
            const rows: any[] = [];
            for (const task of tasks) {
                const entries: any[] = (task.timeEntries || []);
                const filtered = Object.keys(entryDateFilter).length > 0
                    ? entries.filter(e => {
                        const st = new Date(e.startTime);
                        if (entryDateFilter.$gte && st < entryDateFilter.$gte) return false;
                        if (entryDateFilter.$lte && st > entryDateFilter.$lte) return false;
                        return true;
                    })
                    : entries;

                for (const entry of filtered) {
                    rows.push({
                        entryId: entry._id,
                        taskId: task._id,
                        taskTitle: task.title,
                        taskStatus: task.status,
                        taskPriority: task.priority,
                        client: task.clientId,
                        clientGroup: task.clientGroupId,
                        assignedTo: task.assignedTo,
                        frequency: task.frequency,
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        durationMinutes: entry.duration || 0,
                        targetDate: task.targetDate,
                        isOverdue: task.status !== 'DONE' && task.status !== 'CANCELLED' && task.targetDate && new Date(task.targetDate) < now,
                        estimatedHours: task.estimatedHours,
                        createdAt: task.createdAt
                    });
                }
                // Also include tasks with NO entries but actualTimeSpent > 0 (manually set)
                if (filtered.length === 0 && (task.actualTimeSpent || 0) > 0) {
                    rows.push({
                        taskId: task._id,
                        taskTitle: task.title,
                        taskStatus: task.status,
                        taskPriority: task.priority,
                        client: task.clientId,
                        clientGroup: task.clientGroupId,
                        assignedTo: task.assignedTo,
                        frequency: task.frequency,
                        startTime: task.startDate || task.createdAt,
                        endTime: task.completedAt,
                        durationMinutes: task.actualTimeSpent || 0,
                        targetDate: task.targetDate,
                        isOverdue: task.status !== 'DONE' && task.status !== 'CANCELLED' && task.targetDate && new Date(task.targetDate) < now,
                        estimatedHours: task.estimatedHours,
                        createdAt: task.createdAt
                    });
                }
            }
            rows.sort((a, b) => new Date(b.startTime || b.createdAt).getTime() - new Date(a.startTime || a.createdAt).getTime());
            return res.json({ view: 'entry', rows, total: rows.length });
        }

        // ── Task Wise & Subtask Wise: one row per task ──
        const rows = tasks.map(task => {
            const totalMinutes = (task.actualTimeSpent || 0);
            // If timer is running, add live elapsed
            const liveMinutes = task.currentTimerStart
                ? Math.floor((now.getTime() - new Date(task.currentTimerStart).getTime()) / 60000)
                : 0;
            const totalWithLive = totalMinutes + liveMinutes;

            return {
                taskId: task._id,
                taskTitle: task.title,
                description: task.description,
                taskStatus: task.status,
                taskPriority: task.priority,
                category: task.category,
                client: task.clientId,
                clientGroup: task.clientGroupId,
                taskMaster: task.taskMasterId,
                assignedTo: task.assignedTo,
                reportingManager: task.reportingManager,
                createdBy: task.createdBy,
                frequency: task.frequency,
                estimatedHours: task.estimatedHours || 0,
                actualMinutes: totalMinutes,
                liveMinutes,
                totalMinutes: totalWithLive,
                totalHours: Math.round((totalWithLive / 60) * 100) / 100,
                efficiency: task.estimatedHours && totalWithLive > 0
                    ? Math.round(((task.estimatedHours * 60) / totalWithLive) * 100)
                    : null,
                timerRunning: !!task.currentTimerStart,
                progressPercentage: task.progressPercentage || 0,
                revisionCount: task.revisionCount || 0,
                timeEntriesCount: (task.timeEntries || []).length,
                targetDate: task.targetDate,
                startDate: task.startDate,
                completedAt: task.completedAt,
                isOverdue: task.status !== 'DONE' && task.status !== 'CANCELLED' && task.targetDate && new Date(task.targetDate) < now,
                billingAmount: task.billingAmount || 0,
                checklist: task.checklist || [],
                tags: task.tags || [],
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            };
        });

        // Summary totals
        const summary = {
            totalTasks: rows.length,
            totalEstimatedHours: Math.round(rows.reduce((s, r) => s + r.estimatedHours, 0) * 100) / 100,
            totalActualHours: Math.round(rows.reduce((s, r) => s + r.totalHours, 0) * 100) / 100,
            totalMinutes: rows.reduce((s, r) => s + r.totalMinutes, 0),
            byStatus: rows.reduce((acc: any, r) => {
                acc[r.taskStatus] = (acc[r.taskStatus] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({ view: view || 'task', rows, summary, total: rows.length });

    } catch (error) {
        console.error('Timesheet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single task by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId })
            .populate('createdBy', 'username name email')
            .populate('assignedTo', 'username name email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName')
            .populate('comments.userId', 'username name');

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check permissions
        const isAssigned = task.assignedTo.some((user: any) => user._id.toString() === req.user!.userId);
        const isCreator = task.createdBy._id.toString() === req.user!.userId;
        const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user!.role);

        if (!isAssigned && !isCreator && !isAdminOrManager) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================
// STAFF FEATURES - Execution & Progress
// ============================================

// Update task status (Staff Workflow: PENDING → STARTED → UNDER_REVIEW → DONE)
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const validStatuses: TaskStatus[] = ['PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED', 'DONE', 'CANCELLED', 'ON_HOLD', 'PENDING_FROM_CLIENT', 'PENDING_FROM_DEPARTMENT', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }

        // Role-based status guard: only ADMIN/MANAGER can approve, mark done, cancel, or reject
        const isAdminOrManager = ['ADMIN', 'MANAGER'].includes(req.user!.role);
        const adminOnlyStatuses: TaskStatus[] = ['APPROVED', 'DONE', 'CANCELLED', 'REJECTED'];
        if (!isAdminOrManager && adminOnlyStatuses.includes(status)) {
            res.status(403).json({ message: `Only Admin/Manager can set status to "${status}". Please submit for approval instead.` });
            return;
        }

        const previousStatus = task.status;
        task.status = status;

        // Track revision count (quality metric)
        if (previousStatus === 'PENDING_FOR_APPROVAL' && status === 'IN_PROCESS') {
            task.revisionCount += 1;
        }

        // Set start date when task is started
        if (status === 'IN_PROCESS' && !task.startDate) {
            task.startDate = new Date();
        }

        // Set completion date when task is done
        if (status === 'DONE' && !task.completedAt) {
            task.completedAt = new Date();
            task.progressPercentage = 100;

            // Stop timer if running
            if (task.currentTimerStart) {
                const duration = Math.floor((new Date().getTime() - task.currentTimerStart.getTime()) / 60000);
                task.timeEntries.push({
                    startTime: task.currentTimerStart,
                    endTime: new Date(),
                    duration
                });
                task.actualTimeSpent += duration;
                task.currentTimerStart = undefined;
            }

            // ── Auto-generate Bill on task DONE ───────────────────────────
            if (task.clientId || task.clientGroupId) {
                try {
                    const existingInvoice = await Invoice.findOne({
                        notes: `auto:task:${task._id.toString()}`
                    });
                    if (!existingInvoice) {
                        // ── Resolve billing firm & invoice prefix ───────────────
                        let invoicePrefix = 'INV-';
                        let billingFirmId: mongoose.Types.ObjectId | undefined = undefined;

                        if (task.multiFirmId) {
                            // Task was linked to a specific billing firm (multiFirm branch)
                            const mf = await MultiFirm.findById(task.multiFirmId).lean();
                            if (mf) {
                                invoicePrefix = mf.invoicePrefix || 'INV-';
                                billingFirmId = task.multiFirmId as mongoose.Types.ObjectId;
                            }
                        } else {
                            // Fall back to main firm's FirmMaster prefix
                            const FirmMaster = mongoose.model('FirmMaster');
                            const fm = await FirmMaster.findOne({ firmId: task.firmId }).lean();
                            if (fm && (fm as any).invoicePrefix) invoicePrefix = (fm as any).invoicePrefix;
                        }

                        // ── Firm-scoped unique invoice number ───────────────────
                        const firmInvCount = await Invoice.countDocuments({ firmId: task.firmId });
                        const invoiceNumber = `${invoicePrefix}${new Date().getFullYear()}-${String(firmInvCount + 1).padStart(4, '0')}`;

                        const billingAmt = task.billingAmount && task.billingAmount > 0 ? task.billingAmount : 0;

                        const newInvoice = new Invoice({
                            invoiceNumber,
                            billingType: task.billingType === 'GROUP' ? 'CLIENT_GROUP' : (task.billingType || 'SINGLE_CLIENT'),
                            clientId: task.clientId,
                            clientGroupId: task.clientGroupId,
                            firmId: task.firmId,
                            multiFirmId: billingFirmId,  // ← billing firm for letterhead
                            items: [{
                                name: `Task Completion: ${task.title}`,
                                description: task.description || '',
                                quantity: 1,
                                unitPrice: billingAmt,
                                amount: billingAmt
                            }],
                            subtotal: billingAmt,
                            tax: 0,
                            totalAmount: billingAmt,
                            paidAmount: 0,
                            balanceAmount: billingAmt,
                            status: billingAmt > 0 ? 'PENDING' : 'PAID',
                            dueDate: new Date(Date.now() + 30 * 86400000), // 30 days
                            notes: `auto:task:${task._id.toString()}`,  // unique marker
                            createdBy: req.user!.userId
                        });
                        await newInvoice.save();
                        console.log(`[AutoBill] Invoice ${invoiceNumber} created for task ${task.title} → firm ${invoicePrefix}`);
                    }
                } catch (invoiceErr) {
                    console.error('[AutoBill] Failed to auto-generate invoice:', invoiceErr);
                }
            }
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('createdBy', 'username name email')
            .populate('assignedTo', 'username name email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName')
            .populate('reportingManager', 'username name email');

        res.json({
            task: updatedTask,
            message: 'Task status updated successfully'
        });
    } catch (error) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start/Stop Timer for time tracking
router.post('/:id/timer/:action', async (req: AuthRequest, res: Response) => {
    try {
        const { action } = req.params; // 'start' or 'stop'
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check if user is assigned to this task
        const isAssigned = task.assignedTo.some(userId => userId.toString() === req.user!.userId);
        if (!isAssigned && !['ADMIN', 'MANAGER'].includes(req.user!.role)) {
            res.status(403).json({ message: 'You are not assigned to this task' });
            return;
        }

        if (action === 'start') {
            if (task.currentTimerStart) {
                res.status(400).json({ message: 'Timer is already running' });
                return;
            }

            // Important Check: Stop any other running timers for this user first
            const otherTasks = await Task.find({
                firmId: req.firmId,
                assignedTo: req.user!.userId,
                currentTimerStart: { $exists: true },
                _id: { $ne: task._id }
            });

            for (const other of otherTasks) {
                const duration = Math.floor((new Date().getTime() - other.currentTimerStart!.getTime()) / 60000);
                other.timeEntries.push({
                    startTime: other.currentTimerStart!,
                    endTime: new Date(),
                    duration
                });
                other.actualTimeSpent += duration;
                other.currentTimerStart = undefined;
                await other.save();
            }

            task.currentTimerStart = new Date();

            // Auto-update status to IN_PROCESS if it's PENDING
            if (task.status === 'PENDING') {
                task.status = 'IN_PROCESS';
                if (!task.startDate) {
                    task.startDate = new Date();
                }
            }
        } else if (action === 'stop') {
            if (!task.currentTimerStart) {
                res.status(400).json({ message: 'Timer is not running' });
                return;
            }

            const duration = Math.floor((new Date().getTime() - task.currentTimerStart.getTime()) / 60000);
            task.timeEntries.push({
                startTime: task.currentTimerStart,
                endTime: new Date(),
                duration
            });
            task.actualTimeSpent += duration;
            task.currentTimerStart = undefined;
        } else {
            res.status(400).json({ message: 'Invalid action. Use "start" or "stop"' });
            return;
        }

        await task.save();

        res.json({
            task: {
                _id: task._id,
                currentTimerStart: task.currentTimerStart,
                actualTimeSpent: task.actualTimeSpent,
                status: task.status
            },
            message: `Timer ${action}ed successfully`
        });
    } catch (error) {
        console.error('Timer action error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update progress percentage (0-100%)
router.patch('/:id/progress', async (req: AuthRequest, res: Response) => {
    try {
        const { progressPercentage } = req.body;
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        if (progressPercentage < 0 || progressPercentage > 100) {
            res.status(400).json({ message: 'Progress must be between 0 and 100' });
            return;
        }

        task.progressPercentage = progressPercentage;

        // Auto-update status based on progress
        if (progressPercentage === 100 && task.status !== 'DONE') {
            task.status = 'PENDING_FOR_APPROVAL';
        } else if (progressPercentage > 0 && task.status === 'PENDING') {
            task.status = 'IN_PROCESS';
            if (!task.startDate) {
                task.startDate = new Date();
            }
        }

        await task.save();

        res.json({
            task: {
                _id: task._id,
                progressPercentage: task.progressPercentage,
                status: task.status
            },
            message: 'Progress updated successfully'
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to task
router.post('/:id/comments', async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        if (!text || text.trim().length === 0) {
            res.status(400).json({ message: 'Comment text is required' });
            return;
        }

        const user = await User.findById(req.user!.userId);

        task.comments.push({
            id: uuidv4(),
            userId: req.user!.userId as any,
            userName: user?.name || user?.username || 'Unknown',
            text: text.trim(),
            createdAt: new Date()
        });

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('comments.userId', 'username name');

        res.json({
            task: updatedTask,
            message: 'Comment added successfully'
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update checklist item
router.patch('/:id/checklist/:itemId', async (req: AuthRequest, res: Response) => {
    try {
        const { completed } = req.body;
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        const item = task.checklist.find(i => i.id === req.params.itemId);
        if (!item) {
            res.status(404).json({ message: 'Checklist item not found' });
            return;
        }

        item.completed = completed;
        if (completed) {
            item.completedBy = req.user!.userId as any;
            item.completedAt = new Date();
        } else {
            item.completedBy = undefined;
            item.completedAt = undefined;
        }

        // Auto-calculate progress based on checklist
        const completedItems = task.checklist.filter(i => i.completed).length;
        const totalItems = task.checklist.length;
        if (totalItems > 0) {
            task.progressPercentage = Math.round((completedItems / totalItems) * 100);
        }

        await task.save();

        res.json({
            task: {
                _id: task._id,
                checklist: task.checklist,
                progressPercentage: task.progressPercentage
            },
            message: 'Checklist updated successfully'
        });
    } catch (error) {
        console.error('Update checklist error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update task (Admin/Manager only)
router.patch('/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const updates = req.body;
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Update allowed fields
        const allowedUpdates = [
            'title', 'description', 'category', 'assignedTo', 'clientId',
            'clientGroupId', 'billingType',
            'priority', 'targetDate', 'estimatedHours', 'tags', 'firmId', 'billingAmount'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                (task as any)[field] = updates[field];
            }
        });

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('createdBy', 'username name email')
            .populate('assignedTo', 'username name email role')
            .populate('clientId', 'name email phone')
            .populate('clientGroupId', 'groupName')
            .populate('firmId', 'firmName');

        res.json({
            task: updatedTask,
            message: 'Task updated successfully'
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete task (Admin/Manager only)
router.delete('/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, firmId: req.firmId });

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        await Task.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Analytics dashboard
router.get('/analytics/dashboard', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
        const { startDate, endDate } = req.query;

        const dateFilter: any = {};
        if (startDate) {
            dateFilter.createdAt = { $gte: new Date(startDate as string) };
        }
        if (endDate) {
            dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate as string) };
        }

        try {
        // Total tasks by status
        const tasksByStatus = await Task.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            ...dateFilter,
            isOverdue: true,
            status: { $nin: ['DONE', 'CANCELLED'] }
        });

        // Completion rate (tasks finished before deadline)
        const completedTasks = await Task.find({
            ...dateFilter,
            status: 'DONE',
            completedAt: { $exists: true }
        });

        const onTimeCompletions = completedTasks.filter(task =>
            task.completedAt! <= task.targetDate
        ).length;

        const completionRate = completedTasks.length > 0
            ? Math.round((onTimeCompletions / completedTasks.length) * 100)
            : 0;

        // Efficiency metric (estimated vs actual time)
        const tasksWithTime = await Task.find({
            ...dateFilter,
            status: 'DONE',
            actualTimeSpent: { $gt: 0 }
        });

        const avgEfficiency = tasksWithTime.length > 0
            ? tasksWithTime.reduce((acc, task) => {
                const estimated = task.estimatedHours * 60;
                const actual = task.actualTimeSpent;
                const efficiency = (estimated / actual) * 100;
                return acc + efficiency;
            }, 0) / tasksWithTime.length
            : 100;

        // Staff workload distribution
        const workloadByStaff = await Task.aggregate([
            { $match: { status: { $nin: ['DONE', 'CANCELLED'] } } },
            { $unwind: '$assignedTo' },
            {
                $group: {
                    _id: '$assignedTo',
                    taskCount: { $sum: 1 },
                    totalEstimatedHours: { $sum: '$estimatedHours' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    userId: '$_id',
                    userName: '$user.name',
                    username: '$user.username',
                    taskCount: 1,
                    totalEstimatedHours: 1
                }
            }
        ]);

        // Average revision count
        const avgRevisions = await Task.aggregate([
            { $match: { ...dateFilter, status: 'DONE' } },
            { $group: { _id: null, avgRevisions: { $avg: '$revisionCount' } } }
        ]);

        res.json({
            tasksByStatus,
            overdueTasks,
            completionRate,
            avgEfficiency: Math.round(avgEfficiency),
            workloadByStaff,
            avgRevisions: avgRevisions[0]?.avgRevisions || 0,
            totalTasks: await Task.countDocuments(dateFilter)
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



export default router;
