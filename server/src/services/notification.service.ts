import { sendEmail as sendFirmAwareEmail } from './emailService';
import { renderReminderTemplate } from './messageTemplate.service';
import https from 'https';
import { Firm } from '../models/Firm';

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
    // Check all possible phone fields
    return client.phone || client.altPhoneM || client.mobile;
}

export async function sendWhatsApp(to: string, message: string) {
    const url = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;

    if (!url || !token) {
        return { 
            success: false, 
            skipped: true, 
            provider: 'whatsapp', 
            error: `WhatsApp not configured. Missing: ${!url ? 'URL ' : ''}${!token ? 'TOKEN' : ''}` 
        };
    }

    try {
        // Simple implementation assuming a standard JSON POST API
        const data = JSON.stringify({
            messaging_product: "whatsapp",
            to: to.replace(/\D/g, ''),
            type: "text",
            text: { body: message }
        });

        // Use native https for zero-dependency reliability
        return new Promise((resolve) => {
            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, provider: 'whatsapp' });
                    } else {
                        resolve({ success: false, provider: 'whatsapp', error: `API Error (${res.statusCode}): ${body}` });
                    }
                });
            });

            req.on('error', (e) => {
                resolve({ success: false, provider: 'whatsapp', error: e.message });
            });

            req.write(data);
            req.end();
        }) as Promise<any>;
    } catch (error: any) {
        return { success: false, provider: 'whatsapp', error: error.message };
    }
}

export async function sendSms(to: string, message: string) {
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
    const channels: Channel[] = rule?.channels?.length ? rule.channels : ['EMAIL', 'WHATSAPP'];
    const dueDate = formatDate(reminder.dueDate);
    const firm = await Firm.findById(firmId).lean();
    const firmName = firm?.smtpFromName || firm?.firmName || process.env.FIRM_NAME || 'CA Office Portal';

    const variables = {
        ClientName: client.name,
        DueDate: dueDate,
        ComplianceType: reminder.reminderType,
        FirmName: firmName,
        DaysRemaining: Math.max(0, Math.ceil((new Date(reminder.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
    };

    console.log(`[Notification] Dispatching for Reminder: ${reminder.title}, Client: ${client.name}, Channels: ${channels.join(', ')}`);

    const results = [];

    for (const channel of channels) {
        const recipient = resolveRecipient(channel, client)?.trim();
        
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
            recipient: recipient || 'N/A',
            subject,
            message,
            status: 'QUEUED',
        });

        if (!recipient) {
            log.status = 'SKIPPED';
            log.error = 'Recipient missing (No phone/email found on client profile)';
            await log.save();
            results.push({ channel, success: false, skipped: true, error: 'Recipient missing' });
            continue;
        }

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

            log.status = result?.success ? 'SENT' : result?.skipped ? 'SKIPPED' : 'FAILED';
            log.provider = result?.provider || channel.toLowerCase();
            log.error = result?.error;
            log.sentAt = result?.success ? new Date() : undefined;
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
