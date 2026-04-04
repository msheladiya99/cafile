import { Router, Request, Response } from 'express';
import { authenticate as authMiddleware } from '../middleware/auth';
import { sendEmail } from '../utils/email';

const router = Router();

// Get all reminders (Admin only)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const { status, clientId, reminderType } = req.query;

        const user = (req as any).user;
        const filter: any = { firmId: (req as any).firmId };

        if (user.role === 'CLIENT') {
            filter.clientId = user.clientId;
        }

        if (status) filter.status = status;
        if (clientId && user.role !== 'CLIENT') filter.clientId = clientId;
        if (reminderType) filter.reminderType = reminderType;

        const reminders = await Reminder.find(filter)
            .populate('clientId', 'name email')
            .sort({ dueDate: 1 });

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get upcoming reminders (next 30 days)
router.get('/upcoming', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const user = (req as any).user;
        const query: any = {
            firmId: (req as any).firmId,  // ← FIXED: scope to current firm
            dueDate: { $gte: today, $lte: next30Days },
            status: 'PENDING',
        };

        if (user.role === 'CLIENT') {
            query.clientId = user.clientId;
        }

        const reminders = await Reminder.find(query)
            .populate('clientId', 'name email')
            .sort({ dueDate: 1 })
            .limit(50);  // never return unbounded results

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get overdue reminders
router.get('/overdue', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const today = new Date();

        const user = (req as any).user;
        const query: any = {
            firmId: (req as any).firmId,
            dueDate: { $lt: today },
            status: 'PENDING',
        };

        if (user.role === 'CLIENT') {
            query.clientId = user.clientId;
        }

        const reminders = await Reminder.find(query)
            .populate('clientId', 'name email')
            .sort({ dueDate: 1 });

        // Update status to OVERDUE for this firm's reminders
        const updateFilter: any = { firmId: (req as any).firmId, dueDate: { $lt: today }, status: 'PENDING' };
        if (user.role === 'CLIENT') {
            updateFilter.clientId = user.clientId;
        }

        await Reminder.updateMany(
            updateFilter,
            { status: 'OVERDUE' }
        );

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching overdue reminders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get reminders for a specific client
router.get('/client/:clientId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const { clientId } = req.params;
        const user = (req as any).user;

        if (user.role === 'CLIENT' && user.clientId !== clientId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const reminders = await Reminder.find({ clientId, firmId: (req as any).firmId })
            .sort({ dueDate: 1 });

        res.json(reminders);
    } catch (error) {
        console.error('Error fetching client reminders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new reminder
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder, Client } = (req as any).models;
        const {
            clientId,
            title,
            description,
            dueDate,
            reminderType,
            priority,
            notifyBefore,
        } = req.body;

        if (clientId === 'ALL') {
            const clients = await Client.find({ firmId: (req as any).firmId });
            const remindersToCreate = clients.map((c: any) => ({
                clientId: c._id,
                title,
                description,
                dueDate: new Date(dueDate),
                reminderType,
                priority,
                notifyBefore: notifyBefore || 7,
                createdBy: (req as any).user.userId,
                firmId: (req as any).firmId,
            }));
            await Reminder.insertMany(remindersToCreate);
            return res.status(201).json({ message: 'Reminders created for all clients' });
        }
        
        if (typeof clientId === 'string' && clientId.startsWith('GROUP_')) {
            const groupId = clientId.replace('GROUP_', '');
            const clients = await Client.find({ groupName: groupId, firmId: (req as any).firmId });
            
            if (!clients.length) {
                return res.status(404).json({ message: 'No clients found in this group' });
            }

            const remindersToCreate = clients.map((c: any) => ({
                clientId: c._id,
                title,
                description,
                dueDate: new Date(dueDate),
                reminderType,
                priority,
                notifyBefore: notifyBefore || 7,
                createdBy: (req as any).user.userId,
                firmId: (req as any).firmId,
            }));
            await Reminder.insertMany(remindersToCreate);
            return res.status(201).json({ message: `Reminders created for ${clients.length} clients in the group` });
        }

        const reminder = new Reminder({
            clientId,
            title,
            description,
            dueDate: new Date(dueDate),
            reminderType,
            priority,
            notifyBefore: notifyBefore || 7,
            createdBy: (req as any).user.userId,
            firmId: (req as any).firmId,
        });

        await reminder.save();
        await reminder.populate('clientId', 'name email');

        res.status(201).json(reminder);
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a reminder
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const { id } = req.params;
        const updates = req.body;

        const reminder = await Reminder.findOneAndUpdate(
            { _id: id, firmId: (req as any).firmId },
            updates,
            { new: true }
        ).populate('clientId', 'name email');

        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        res.json(reminder);
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark reminder as completed
router.patch('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const { id } = req.params;

        const reminder = await Reminder.findOneAndUpdate(
            { _id: id, firmId: (req as any).firmId },
            { status: 'COMPLETED' },
            { new: true }
        ).populate('clientId', 'name email');

        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        res.json(reminder);
    } catch (error) {
        console.error('Error completing reminder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a reminder
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const { id } = req.params;

        const reminder = await Reminder.findOneAndDelete({ _id: id, firmId: (req as any).firmId });

        if (!reminder) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send reminder notifications (called by cron job)
router.post('/send-notifications', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder } = (req as any).models;
        const today = new Date();

        // Find reminders that need notification
        const query: any = {
            status: 'PENDING',
            notificationSent: false,
        };
        // If not super admin root execution, scope to firm
        if ((req as any).firmId !== 'ROOT' && (req as any).firmId) {
            query.firmId = (req as any).firmId;
        }

        const reminders = await Reminder.find(query).populate('clientId', 'name email');

        let sentCount = 0;

        for (const reminder of reminders) {
            const dueDate = new Date(reminder.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // Send notification if due date is within notifyBefore days
            if (daysUntilDue <= reminder.notifyBefore && daysUntilDue >= 0) {
                const client = reminder.clientId as any;

                // Send email notification
                try {
                    await sendEmail(
                        client.email,
                        `Reminder: ${reminder.title}`,
                        `
                        <h2>Filing Deadline Reminder</h2>
                        <p>Dear ${client.name},</p>
                        <p>This is a reminder that you have an upcoming deadline:</p>
                        <ul>
                            <li><strong>Title:</strong> ${reminder.title}</li>
                            <li><strong>Type:</strong> ${reminder.reminderType}</li>
                            <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
                            <li><strong>Days Remaining:</strong> ${daysUntilDue}</li>
                            <li><strong>Priority:</strong> ${reminder.priority}</li>
                        </ul>
                        ${reminder.description ? `<p><strong>Details:</strong> ${reminder.description}</p>` : ''}
                        <p>Please ensure all required documents are submitted before the deadline.</p>
                        <p>Best regards,<br>Your CA Office</p>
                        `
                    );

                    // Mark notification as sent
                    reminder.notificationSent = true;
                    await reminder.save();
                    sentCount++;
                } catch (emailError) {
                    console.error('Error sending reminder email:', emailError);
                }
            }
        }

        res.json({ message: `Sent ${sentCount} reminder notifications` });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
