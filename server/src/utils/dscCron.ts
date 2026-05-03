/**
 * DSC Expiry Cron Job
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs daily at 08:00 IST.
 * 1. Recomputes DSC status (active / expiring_soon / expired) for ALL firms
 * 2. Sends email reminders at 30d / 7d / expiry day (avoids duplicates)
 */
import cron from 'node-cron';
import { DSC } from '../models/DSC';
import { sendEmail } from './email';

function computeStatus(expiryDate: Date): 'active' | 'expiring_soon' | 'expired' {
    const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'active';
}

async function sendExpiryReminder(dsc: any, daysLeft: number) {
    try {
        // Fetch client details via populated doc
        const populated = await DSC.findById(dsc._id)
            .populate('clientId', 'name email phone mobile altPhoneM')
            .lean() as any;

        const clientName  = populated?.clientId?.name  || dsc.holderName;
        const clientEmail = populated?.clientId?.email;
        const clientPhone = populated?.clientId?.mobile || populated?.clientId?.phone || populated?.clientId?.altPhoneM;

        let subject = '';
        let urgencyColor = '#3b82f6';
        let urgencyText = '';
        let whatsappMessage = '';

        if (daysLeft <= 0) {
            subject = `🚨 DSC EXPIRED — ${dsc.holderName}`;
            urgencyColor = '#ef4444';
            urgencyText = '<strong style="color:#ef4444">Your DSC has EXPIRED today.</strong> Renew immediately to avoid service disruption.';
            whatsappMessage = `🚨 *DSC EXPIRED*\nDear ${clientName}, your DSC (${dsc.dscNumber}) for ${dsc.holderName} has EXPIRED today. Please contact our office immediately for renewal to avoid disruption.`;
        } else if (daysLeft <= 7) {
            subject = `⚠️ DSC Expiring in ${daysLeft} Day(s) — ${dsc.holderName}`;
            urgencyColor = '#f59e0b';
            urgencyText = `Your DSC expires in <strong>${daysLeft} day(s)</strong>. Please renew urgently.`;
            whatsappMessage = `⚠️ *DSC EXPIRY ALERT*\nDear ${clientName}, your DSC (${dsc.dscNumber}) expires in ${daysLeft} day(s) on ${new Date(dsc.expiryDate).toLocaleDateString('en-IN')}. Please contact our office for renewal.`;
        } else {
            subject = `📅 DSC Expiring in 30 Days — ${dsc.holderName}`;
            urgencyColor = '#3b82f6';
            urgencyText = `Your DSC will expire in <strong>30 days</strong>. Please plan for renewal.`;
            whatsappMessage = `📅 *DSC EXPIRY REMINDER*\nDear ${clientName}, your DSC (${dsc.dscNumber}) will expire in 30 days on ${new Date(dsc.expiryDate).toLocaleDateString('en-IN')}. Please plan for renewal soon.`;
        }

        // Send Email
        if (clientEmail) {
            await sendEmail(clientEmail, subject, `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                    <div style="background:${urgencyColor};color:white;padding:24px;border-radius:8px 8px 0 0">
                        <h2 style="margin:0">DSC Expiry Reminder</h2>
                        <p style="margin:8px 0 0;opacity:0.9">Digital Signature Certificate Alert</p>
                    </div>
                    <div style="background:#fff;border:1px solid #e2e8f0;padding:24px;border-radius:0 0 8px 8px">
                        <p>Dear <strong>${clientName}</strong>,</p>
                        <p>${urgencyText}</p>
                        <table style="width:100%;border-collapse:collapse;margin:16px 0">
                            <tr style="background:#f8fafc"><td style="padding:10px;color:#64748b;font-weight:600;width:40%">DSC Holder</td><td style="padding:10px">${dsc.holderName}</td></tr>
                            <tr><td style="padding:10px;color:#64748b;font-weight:600">DSC Number</td><td style="padding:10px">${dsc.dscNumber}</td></tr>
                            <tr style="background:#f8fafc"><td style="padding:10px;color:#64748b;font-weight:600">Expiry Date</td><td style="padding:10px;color:${urgencyColor};font-weight:700">${new Date(dsc.expiryDate).toLocaleDateString('en-IN')}</td></tr>
                            <tr><td style="padding:10px;color:#64748b;font-weight:600">Days Remaining</td><td style="padding:10px;color:${urgencyColor};font-weight:700">${daysLeft <= 0 ? 'EXPIRED' : daysLeft + ' day(s)'}</td></tr>
                        </table>
                        <p>Please contact your CA office at the earliest to initiate the DSC renewal process.</p>
                        <p style="color:#94a3b8;font-size:0.8rem;margin-top:24px">This is an automated reminder from your CA's office management system.</p>
                    </div>
                </div>
            `);
            console.log(`✉️ DSC email reminder sent to ${clientEmail}`);
        }

        // Send WhatsApp
        if (clientPhone) {
            const { sendWhatsApp } = require('../services/notification.service');
            await sendWhatsApp(clientPhone, whatsappMessage);
            console.log(`📱 DSC whatsapp reminder sent to ${clientPhone}`);
        }
    } catch (err) {
        console.error('DSC reminder email failed:', err);
    }
}

export function startDSCCronJob() {
    // Run daily at 08:00 IST (02:30 UTC)
    cron.schedule('30 2 * * *', async () => {
        console.log('🕐 [DSC Cron] Running daily DSC expiry check...');

        try {
            const allDSCs = await DSC.find({}).lean() as any[];
            let updated = 0, reminded = 0;

            for (const dsc of allDSCs) {
                const expiryDate = new Date(dsc.expiryDate);
                const newStatus = computeStatus(expiryDate);
                const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                const updates: any = {};

                // Update status if changed
                if (dsc.dscStatus !== newStatus) {
                    updates.dscStatus = newStatus;
                    updated++;
                }

                // Send 30-day reminder
                if (daysLeft <= 30 && daysLeft > 7 && !dsc.reminderSent30) {
                    await sendExpiryReminder(dsc, daysLeft);
                    updates.reminderSent30 = true;
                    reminded++;
                }

                // Send 7-day reminder
                if (daysLeft <= 7 && daysLeft > 0 && !dsc.reminderSent7) {
                    await sendExpiryReminder(dsc, daysLeft);
                    updates.reminderSent7 = true;
                    reminded++;
                }

                // Send expiry-day reminder
                if (daysLeft <= 0 && !dsc.reminderSentExpiry) {
                    await sendExpiryReminder(dsc, 0);
                    updates.reminderSentExpiry = true;
                    reminded++;
                }

                if (Object.keys(updates).length > 0) {
                    await DSC.findByIdAndUpdate(dsc._id, updates);
                }
            }

            console.log(`✅ [DSC Cron] Done. Status updated: ${updated}, Reminders sent: ${reminded}`);
        } catch (err) {
            console.error('❌ [DSC Cron] Error:', err);
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ DSC expiry cron job scheduled (daily 08:00 IST)');
}
