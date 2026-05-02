import { Router, Request, Response } from 'express';
import { authenticate as authMiddleware, requireRoles } from '../middleware/auth';
import {
    generateRemindersForFirm,
    processReminderFollowUps,
    recordClientAction,
    runReminderAutomation
} from '../services/reminderRuleEngine.service';
import { calculateReminderPriority } from '../services/reminderPriority.service';
import { defaultTemplates } from '../services/messageTemplate.service';

const router = Router();
const adminOnly = requireRoles(['ADMIN', 'MANAGER']);
const validRuleFilter = { ruleName: { $exists: true, $ne: '' } };

// Automation dashboard summary
router.get('/automation/summary', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { Reminder, ReminderRule, NotificationLog } = (req as any).models;
        const firmId = (req as any).firmId;
        const [rules, activeRules, automatedPending, overdue, sentToday, failedToday] = await Promise.all([
            ReminderRule.countDocuments({ firmId, ...validRuleFilter }),
            ReminderRule.countDocuments({ firmId, ...validRuleFilter, automationEnabled: true }),
            Reminder.countDocuments({ firmId, generatedBy: 'RULE_ENGINE', status: 'PENDING' }),
            Reminder.countDocuments({ firmId, status: 'OVERDUE' }),
            NotificationLog.countDocuments({ firmId, status: 'SENT', createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
            NotificationLog.countDocuments({ firmId, status: 'FAILED', createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
        ]);

        res.json({ rules, activeRules, automatedPending, overdue, sentToday, failedToday, manualWorkReductionTarget: 90 });
    } catch (error) {
        console.error('Error fetching automation summary:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Rule engine CRUD
router.get('/rules', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { ReminderRule } = (req as any).models;
        const rules = await ReminderRule.find({ firmId: (req as any).firmId, ...validRuleFilter }).sort({ createdAt: -1 });
        res.json(rules);
    } catch (error) {
        console.error('Error fetching reminder rules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/rules', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { ReminderRule } = (req as any).models;
        const rule = await ReminderRule.create({
            ...req.body,
            firmId: (req as any).firmId,
            createdBy: (req as any).user.userId,
        });
        res.status(201).json(rule);
    } catch (error: any) {
        console.error('Error creating reminder rule:', error);
        res.status(400).json({ message: error.message || 'Unable to create rule' });
    }
});

router.put('/rules/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { ReminderRule } = (req as any).models;
        const rule = await ReminderRule.findOneAndUpdate(
            { _id: req.params.id, firmId: (req as any).firmId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json(rule);
    } catch (error: any) {
        console.error('Error updating reminder rule:', error);
        res.status(400).json({ message: error.message || 'Unable to update rule' });
    }
});

router.delete('/rules/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { ReminderRule } = (req as any).models;
        const rule = await ReminderRule.findOneAndDelete({ _id: req.params.id, firmId: (req as any).firmId });
        if (!rule) return res.status(404).json({ message: 'Rule not found' });
        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting reminder rule:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/rules/seed-defaults', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { ReminderRule, MessageTemplate } = (req as any).models;
        const firmId = (req as any).firmId;
        const createdBy = (req as any).user.userId;

        const templates = [
            { name: 'Default Email Reminder', channel: 'EMAIL', tone: 'NORMAL', body: defaultTemplates.normal },
            { name: 'Default WhatsApp Reminder', channel: 'WHATSAPP', tone: 'NORMAL', body: defaultTemplates.normal },
            { name: 'Default Overdue Reminder', channel: 'EMAIL', tone: 'OVERDUE', body: defaultTemplates.overdue },
            { name: 'Default Missed Compliance Alert', channel: 'EMAIL', tone: 'MISSED', body: defaultTemplates.missed },
        ];

        for (const template of templates) {
            await MessageTemplate.updateOne(
                { firmId, name: template.name },
                {
                    $setOnInsert: {
                        ...template,
                        firmId,
                        complianceType: 'OTHER',
                        subject: 'Compliance reminder for {ClientName}',
                        isDefault: true,
                        isActive: true,
                        createdBy,
                    },
                },
                { upsert: true }
            );
        }

        const rules = [
            {
                ruleName: 'GST Return (GSTR-3B)',
                complianceType: 'GST',
                triggerCondition: 'Monthly GSTR-3B filing for clients with GSTIN',
                frequency: 'MONTHLY',
                dueDateLogic: { type: 'FIXED_DAY_OF_MONTH', dayOfMonth: 20 },
                reminderOffsets: [7, 3, 1, 0],
                applicableClientsFilter: { requiresGstin: true },
                channels: ['WHATSAPP', 'EMAIL'],
            },
            {
                ruleName: 'GST Return (GSTR-1)',
                complianceType: 'GST',
                triggerCondition: 'Monthly or quarterly outward supply return for GST clients',
                frequency: 'MONTHLY',
                dueDateLogic: { type: 'FIXED_DAY_OF_MONTH', dayOfMonth: 11 },
                reminderOffsets: [7, 3, 1, 0],
                applicableClientsFilter: { requiresGstin: true },
                channels: ['WHATSAPP', 'EMAIL'],
            },
            {
                ruleName: 'ITR Filing',
                complianceType: 'ITR',
                triggerCondition: 'Yearly income tax return filing for PAN clients',
                frequency: 'YEARLY',
                dueDateLogic: { type: 'FIXED_DATE', month: 7, day: 31 },
                reminderOffsets: [30, 15, 7, 3, 1],
                applicableClientsFilter: { requiresPan: true },
                channels: ['WHATSAPP', 'EMAIL'],
            },
            {
                ruleName: 'TDS Return',
                complianceType: 'TDS',
                triggerCondition: 'Quarterly TDS return filing',
                frequency: 'QUARTERLY',
                dueDateLogic: { type: 'FIXED_DAY_OF_MONTH', quarterDueDay: 31, quarterDueMonthOffset: 1 },
                reminderOffsets: [10, 5, 2, 0],
                applicableClientsFilter: {},
                channels: ['EMAIL'],
            },
            {
                ruleName: 'DSC Expiry',
                complianceType: 'DSC',
                triggerCondition: 'Digital Signature Certificate expiry tracked from client DSC expiry date',
                frequency: 'ONE_TIME',
                dueDateLogic: { type: 'DSC_EXPIRY_DATE' },
                reminderOffsets: [30, 7, 1, 0],
                applicableClientsFilter: {},
                channels: ['WHATSAPP', 'EMAIL'],
            },
        ];

        let upserted = 0;
        for (const rule of rules) {
            const result = await ReminderRule.updateOne(
                { firmId, ruleName: rule.ruleName },
                {
                    $setOnInsert: {
                        ...rule,
                        firmId,
                        followUpIntervalDays: 3,
                        overdueFollowUpIntervalDays: 1,
                        maxEscalationLevel: 3,
                        automationEnabled: true,
                        isSystemRule: true,
                        createdBy,
                    },
                },
                { upsert: true }
            );
            upserted += result.upsertedCount || 0;
        }

        res.json({ message: `Default automation rules ready. Added ${upserted} new rules.` });
    } catch (error: any) {
        console.error('Error seeding default rules:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// Message templates
router.get('/templates', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { MessageTemplate } = (req as any).models;
        const templates = await MessageTemplate.find({ firmId: (req as any).firmId }).sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching message templates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/templates', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { MessageTemplate } = (req as any).models;
        const template = await MessageTemplate.create({
            ...req.body,
            firmId: (req as any).firmId,
            createdBy: (req as any).user.userId,
        });
        res.status(201).json(template);
    } catch (error: any) {
        console.error('Error creating message template:', error);
        res.status(400).json({ message: error.message || 'Unable to create template' });
    }
});

router.put('/templates/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const { MessageTemplate } = (req as any).models;
        const template = await MessageTemplate.findOneAndUpdate(
            { _id: req.params.id, firmId: (req as any).firmId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (error: any) {
        console.error('Error updating message template:', error);
        res.status(400).json({ message: error.message || 'Unable to update template' });
    }
});

// Logs and client action tracking
router.get('/logs', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { NotificationLog } = (req as any).models;
        const logs = await NotificationLog.find({ firmId: (req as any).firmId })
            .populate('clientId', 'name email phone')
            .populate('reminderId', 'title dueDate status')
            .sort({ createdAt: -1 })
            .limit(200);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching reminder logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/actions', authMiddleware, async (req: Request, res: Response) => {
    try {
        const action = await recordClientAction(
            (req as any).models,
            (req as any).firmId,
            req.body,
            (req as any).user.userId
        );
        res.status(201).json(action);
    } catch (error: any) {
        console.error('Error recording client action:', error);
        res.status(400).json({ message: error.message || 'Unable to record action' });
    }
});

// Manual automation controls
router.post('/automation/run', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const result = await runReminderAutomation((req as any).models, (req as any).firmId);
        res.json(result);
    } catch (error: any) {
        console.error('Error running reminder automation:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

router.post('/automation/generate', authMiddleware, adminOnly, async (req: Request, res: Response) => {
    try {
        const result = await generateRemindersForFirm((req as any).models, (req as any).firmId);
        res.json(result);
    } catch (error: any) {
        console.error('Error generating reminders:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

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
                priority: priority || calculateReminderPriority(new Date(dueDate)),
                notifyBefore: notifyBefore || 7,
                nextReminderAt: new Date(),
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
                priority: priority || calculateReminderPriority(new Date(dueDate)),
                notifyBefore: notifyBefore || 7,
                nextReminderAt: new Date(),
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
            priority: priority || calculateReminderPriority(new Date(dueDate)),
            notifyBefore: notifyBefore || 7,
            nextReminderAt: new Date(),
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
            { status: 'COMPLETED', completedAt: new Date(), nextReminderAt: null },
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
        const result = await processReminderFollowUps((req as any).models, (req as any).firmId);
        res.json({ message: `Processed ${result.scanned} reminders. Sent ${result.sent} notifications.`, ...result });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
