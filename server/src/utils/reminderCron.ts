import cron from 'node-cron';
import Reminder from '../models/Reminder';
import ReminderRule from '../models/ReminderRule';
import MessageTemplate from '../models/MessageTemplate';
import NotificationLog from '../models/NotificationLog';
import ClientAction from '../models/ClientAction';
import { Client } from '../models/Client';
import { runReminderAutomation } from '../services/reminderRuleEngine.service';

const models = {
    Reminder,
    ReminderRule,
    MessageTemplate,
    NotificationLog,
    ClientAction,
    Client,
};

async function getFirmIds() {
    const firmIds = new Set<string>();
    const [ruleFirmIds, reminderFirmIds] = await Promise.all([
        ReminderRule.distinct('firmId', { automationEnabled: true }),
        Reminder.distinct('firmId', { status: { $in: ['PENDING', 'OVERDUE'] } }),
    ]);

    [...ruleFirmIds, ...reminderFirmIds].forEach((id: any) => id && firmIds.add(String(id)));
    return [...firmIds];
}

export async function runDailyReminderAutomation() {
    console.log('[ReminderCron] Starting intelligent reminder automation...');
    const firmIds = await getFirmIds();
    let generated = 0;
    let sent = 0;
    let alerts = 0;

    for (const firmId of firmIds) {
        try {
            const result = await runReminderAutomation(models, firmId);
            generated += result.generation.generated;
            sent += result.followUps.sent;
            alerts += result.missed.alerts;
        } catch (error) {
            console.error(`[ReminderCron] Failed for firm ${firmId}:`, error);
        }
    }

    console.log(`[ReminderCron] Done. Generated: ${generated}, sent: ${sent}, missed alerts: ${alerts}`);
}

export function startReminderCronJob() {
    cron.schedule('15 8 * * *', runDailyReminderAutomation, { timezone: 'Asia/Kolkata' });

    setTimeout(() => {
        runDailyReminderAutomation();
    }, 20000);

    console.log('[ReminderCron] Scheduled daily intelligent reminder automation at 08:15 IST.');
}
