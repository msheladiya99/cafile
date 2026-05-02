import mongoose from 'mongoose';
import { addDays, calculateReminderPriority, diffDays, startOfDay } from './reminderPriority.service';
import { sendReminderNotifications } from './notification.service';

const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000000');

function endOfMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function fixedDayDate(year: number, monthIndex: number, day: number) {
    return startOfDay(new Date(year, monthIndex, Math.min(day, endOfMonth(year, monthIndex))));
}

function quarterEndMonthsFor(date: Date) {
    const year = date.getFullYear();
    return [
        { year, monthIndex: 5 },
        { year, monthIndex: 8 },
        { year, monthIndex: 11 },
        { year: year + 1, monthIndex: 2 },
    ];
}

function cycleKeyFor(rule: any, dueDate: Date, client?: any) {
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dueDate.getDate()).padStart(2, '0');

    if (rule.frequency === 'MONTHLY') return `${yyyy}-${mm}`;
    if (rule.frequency === 'QUARTERLY') return `${yyyy}-Q${Math.floor(dueDate.getMonth() / 3) + 1}`;
    if (rule.frequency === 'YEARLY') return `${yyyy}`;
    if (rule.dueDateLogic?.type === 'DSC_EXPIRY_DATE') return `DSC-${client?._id || 'client'}-${yyyy}${mm}${dd}`;
    return `${yyyy}-${mm}-${dd}`;
}

export function calculateDueDates(rule: any, today = new Date(), client?: any): Date[] {
    const base = startOfDay(today);
    const year = base.getFullYear();
    const monthIndex = base.getMonth();
    const logic = rule.dueDateLogic || {};

    if (logic.type === 'FIXED_DAY_OF_MONTH') {
        if (rule.frequency === 'MONTHLY') {
            return [fixedDayDate(year, monthIndex, logic.dayOfMonth || 20)];
        }

        if (rule.frequency === 'QUARTERLY') {
            const dates = quarterEndMonthsFor(base).map((quarter) => {
                const dueMonthIndex = quarter.monthIndex + (logic.quarterDueMonthOffset || 1);
                return fixedDayDate(quarter.year, dueMonthIndex, logic.quarterDueDay || logic.dayOfMonth || 31);
            });
            return dates.filter((date) => Math.abs(diffDays(date, base)) <= 45 || diffDays(date, base) >= 0);
        }
    }

    if (logic.type === 'FIXED_DATE') {
        return [fixedDayDate(year, (logic.month || 7) - 1, logic.day || 31)];
    }

    if (logic.type === 'DSC_EXPIRY_DATE') {
        const expiry = client?.dscExpiry || client?.expiryDate;
        return expiry ? [startOfDay(new Date(expiry))] : [];
    }

    if (logic.type === 'RELATIVE_TO_CLIENT_DATE' && logic.clientDateField && client?.[logic.clientDateField]) {
        return [startOfDay(new Date(client[logic.clientDateField]))];
    }

    return [];
}

export function shouldGenerateReminder(rule: any, dueDate: Date, today = new Date()) {
    const daysUntilDue = diffDays(dueDate, today);
    const offsets = (rule.reminderOffsets || [7, 3, 1, 0]).map(Number);
    return offsets.some((offset: number) => daysUntilDue <= offset && daysUntilDue >= -7);
}

function buildClientQuery(rule: any, firmId: string) {
    const filter = rule.applicableClientsFilter || {};
    const query: any = { firmId, status: { $ne: false } };

    if (filter.requiresGstin) query.gstNumber = { $exists: true, $nin: ['', null] };
    if (filter.requiresPan) query.panNumber = { $exists: true, $nin: ['', null] };
    if (filter.clientTypes?.length) query.clientType = { $in: filter.clientTypes };
    if (filter.clientGroupIds?.length) query.groupName = { $in: filter.clientGroupIds };
    if (filter.includeClientIds?.length) query._id = { $in: filter.includeClientIds };
    if (filter.excludeClientIds?.length) {
        query._id = query._id || {};
        query._id.$nin = filter.excludeClientIds;
    }
    if (filter.complianceFlags?.length) query.complianceFlags = { $all: filter.complianceFlags };

    return query;
}

function reminderTitle(rule: any, dueDate: Date) {
    return `${rule.ruleName} - ${dueDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

export async function generateRemindersForFirm(models: any, firmId: string, today = new Date()) {
    const { ReminderRule, Reminder, Client } = models;
    const rules = await ReminderRule.find({ firmId, automationEnabled: true }).lean();
    let generated = 0;
    let skipped = 0;

    for (const rule of rules) {
        const clients = await Client.find(buildClientQuery(rule, firmId)).select('_id name email phone gstNumber panNumber clientType complianceFlags dscExpiry').lean();

        for (const client of clients) {
            const dueDates = calculateDueDates(rule, today, client);

            for (const dueDate of dueDates) {
                if (!shouldGenerateReminder(rule, dueDate, today)) {
                    skipped++;
                    continue;
                }

                const cycleKey = cycleKeyFor(rule, dueDate, client);
                const firstOffset = Math.max(...(rule.reminderOffsets?.length ? rule.reminderOffsets : [7]));
                const nextReminderAt = addDays(dueDate, -firstOffset);

                const result = await Reminder.updateOne(
                    { firmId, clientId: client._id, ruleId: rule._id, cycleKey },
                    {
                        $setOnInsert: {
                            firmId,
                            clientId: client._id,
                            ruleId: rule._id,
                            cycleKey,
                            title: reminderTitle(rule, dueDate),
                            description: rule.triggerCondition,
                            dueDate,
                            reminderType: rule.complianceType,
                            priority: calculateReminderPriority(dueDate, today),
                            status: diffDays(dueDate, today) < 0 ? 'OVERDUE' : 'PENDING',
                            notifyBefore: firstOffset,
                            notificationSent: false,
                            nextReminderAt: nextReminderAt < startOfDay(today) ? startOfDay(today) : nextReminderAt,
                            escalationLevel: 0,
                            generatedBy: 'RULE_ENGINE',
                            createdBy: rule.createdBy || SYSTEM_USER_ID,
                        },
                    },
                    { upsert: true }
                );

                if (result.upsertedCount) generated++;
                else skipped++;
            }
        }
    }

    return { generated, skipped, rules: rules.length };
}

export async function processReminderFollowUps(models: any, firmId: string, today = new Date()) {
    const { Reminder, ReminderRule, Client, NotificationLog, MessageTemplate } = models;
    const now = new Date();
    const dueReminders = await Reminder.find({
        firmId,
        status: { $in: ['PENDING', 'OVERDUE'] },
        nextReminderAt: { $lte: now },
    }).limit(500).populate('clientId', 'name email phone mobile altPhoneM').lean();

    let sent = 0;
    let skipped = 0;

    for (const reminder of dueReminders) {
        const client = reminder.clientId;
        if (!client) {
            skipped++;
            continue;
        }

        const overdue = diffDays(reminder.dueDate, today) < 0;
        const rule = reminder.ruleId ? await ReminderRule.findOne({ _id: reminder.ruleId, firmId }).lean() : null;
        const interval = overdue ? (rule?.overdueFollowUpIntervalDays || 1) : (rule?.followUpIntervalDays || 3);
        const nextEscalationLevel = overdue ? Math.min((reminder.escalationLevel || 0) + 1, rule?.maxEscalationLevel ?? 3) : reminder.escalationLevel || 0;

        const results = await sendReminderNotifications({
            NotificationLog,
            MessageTemplate,
            reminder,
            client,
            rule,
            firmId,
            tone: overdue ? 'OVERDUE' : 'NORMAL',
        });

        if (results.some((result) => result.success)) sent++;
        else skipped++;

        await Reminder.updateOne(
            { _id: reminder._id, firmId },
            {
                $set: {
                    status: overdue ? 'OVERDUE' : reminder.status,
                    priority: calculateReminderPriority(reminder.dueDate, today),
                    notificationSent: true,
                    lastSentAt: now,
                    nextReminderAt: addDays(now, interval),
                    escalationLevel: nextEscalationLevel,
                },
            }
        );
    }

    await Reminder.updateMany(
        { firmId, status: 'PENDING', dueDate: { $lt: startOfDay(today) } },
        { $set: { status: 'OVERDUE', priority: 'HIGH' } }
    );

    return { sent, skipped, scanned: dueReminders.length };
}

export async function detectMissedCompliance(models: any, firmId: string, today = new Date()) {
    const { Reminder, ReminderRule, Client, NotificationLog, MessageTemplate } = models;
    const thresholdDate = addDays(startOfDay(today), -2);
    const reminders = await Reminder.find({
        firmId,
        status: 'OVERDUE',
        dueDate: { $lte: thresholdDate },
        escalationLevel: { $gte: 2 },
    }).limit(200).populate('clientId', 'name email phone mobile altPhoneM').lean();

    let alerts = 0;
    for (const reminder of reminders) {
        const rule = reminder.ruleId ? await ReminderRule.findOne({ _id: reminder.ruleId, firmId }).lean() : null;
        const client = reminder.clientId;
        if (!client) continue;

        await sendReminderNotifications({
            NotificationLog,
            MessageTemplate,
            reminder,
            client,
            rule,
            firmId,
            tone: 'MISSED',
        });
        alerts++;
    }

    return { alerts };
}

export async function recordClientAction(models: any, firmId: string, payload: any, userId?: string) {
    const { ClientAction, Reminder } = models;
    const action = await ClientAction.create({
        firmId,
        clientId: payload.clientId,
        reminderId: payload.reminderId,
        ruleId: payload.ruleId,
        actionType: payload.actionType,
        source: payload.source || 'ADMIN',
        notes: payload.notes,
        metadata: payload.metadata,
        createdBy: userId,
    });

    if (payload.reminderId && ['DOCUMENT_UPLOADED', 'TASK_COMPLETED', 'CLIENT_RESPONDED'].includes(payload.actionType)) {
        await Reminder.updateOne(
            { _id: payload.reminderId, firmId },
            {
                $set: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    completedByActionId: action._id,
                    nextReminderAt: null,
                },
            }
        );
    }

    return action;
}

export async function runReminderAutomation(models: any, firmId: string, today = new Date()) {
    const generation = await generateRemindersForFirm(models, firmId, today);
    const followUps = await processReminderFollowUps(models, firmId, today);
    const missed = await detectMissedCompliance(models, firmId, today);
    return { generation, followUps, missed };
}
