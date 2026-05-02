import { sendEmail as sendFirmAwareEmail } from './emailService';
import { renderReminderTemplate } from './messageTemplate.service';

type Channel = 'WHATSAPP' | 'EMAIL' | 'SMS';

interface SendReminderNotificationParams {
    NotificationLog: any;
    MessageTemplate: any;
    reminder: any;
    client: any;
    rule?: any;
    firmId: string;
    tone?: 'NORMAL' | 'OVERDUE' | 'MISSED';
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function resolveRecipient(channel: Channel, client: any) {
    if (channel === 'EMAIL') return client.email;
    return client.phone || client.mobile || client.altPhoneM;
}

async function sendWhatsApp(to: string, message: string) {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
        return { success: false, skipped: true, provider: 'whatsapp', error: 'WhatsApp provider not configured' };
    }

    const response = await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
        return { success: false, provider: 'whatsapp', error: await response.text() };
    }

    return { success: true, provider: 'whatsapp' };
}

async function sendSms(to: string, message: string) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        return { success: false, skipped: true, provider: 'sms', error: 'SMS provider not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to });
    return { success: true, provider: 'twilio' };
}

export async function sendReminderNotifications(params: SendReminderNotificationParams) {
    const { NotificationLog, MessageTemplate, reminder, client, rule, firmId, tone = 'NORMAL' } = params;
    const channels: Channel[] = rule?.channels?.length ? rule.channels : ['EMAIL'];
    const dueDate = formatDate(reminder.dueDate);
    const variables = {
        ClientName: client.name,
        DueDate: dueDate,
        ComplianceType: reminder.reminderType,
        FirmName: '',
        DaysRemaining: Math.max(0, Math.ceil((new Date(reminder.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
    };

    const results = [];

    for (const channel of channels) {
        const recipient = resolveRecipient(channel, client);
        if (!recipient) {
            results.push({ channel, success: false, skipped: true, error: 'Recipient missing' });
            continue;
        }

        const templateId = tone === 'OVERDUE' ? rule?.templateIds?.overdue : tone === 'MISSED' ? rule?.templateIds?.missed : rule?.templateIds?.normal;
        const template = templateId
            ? await MessageTemplate.findOne({ _id: templateId, firmId, channel, isActive: true })
            : await MessageTemplate.findOne({ firmId, complianceType: reminder.reminderType, channel, tone, isActive: true }).sort({ isDefault: -1, createdAt: -1 });

        const fallbackBody = tone === 'OVERDUE'
            ? 'Urgent: Dear {ClientName}, your {ComplianceType} due on {DueDate} is overdue. Please respond immediately.'
            : tone === 'MISSED'
                ? 'Alert: You may have missed your {ComplianceType} filing due on {DueDate}. Please contact our office urgently.'
                : 'Dear {ClientName}, your {ComplianceType} is due on {DueDate}. Please share documents.';

        const subject = renderReminderTemplate(template?.subject || `Reminder: ${reminder.title}`, variables);
        const message = renderReminderTemplate(template?.body || fallbackBody, variables);
        const log = new NotificationLog({
            firmId,
            reminderId: reminder._id,
            clientId: client._id,
            ruleId: reminder.ruleId,
            channel,
            recipient,
            subject,
            message,
            status: 'QUEUED',
        });

        try {
            let result: any;
            if (channel === 'EMAIL') {
                result = await sendFirmAwareEmail({
                    to: recipient,
                    subject,
                    html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
                    firmId,
                });
            } else if (channel === 'WHATSAPP') {
                result = await sendWhatsApp(recipient, message);
            } else {
                result = await sendSms(recipient, message);
            }

            log.status = result.success ? 'SENT' : result.skipped ? 'SKIPPED' : 'FAILED';
            log.provider = result.provider || channel.toLowerCase();
            log.error = result.error;
            log.sentAt = result.success ? new Date() : undefined;
            await log.save();
            results.push({ channel, ...result });
        } catch (error: any) {
            log.status = 'FAILED';
            log.error = error.message;
            await log.save();
            results.push({ channel, success: false, error: error.message });
        }
    }

    return results;
}
