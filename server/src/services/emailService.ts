import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { Firm } from '../models/Firm';
import { EmailLog } from '../models/EmailLog';
import { decrypt } from '../utils/encryption';

// const resend = new Resend(process.env.RESEND_API_KEY || 're_default');

// Email configuration
const createTransporter = () => {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

interface SendFileUploadEmailParams {
    clientEmail: string;
    clientName: string;
    fileName: string;
    category: string;
    year: string;
    firmId?: string;
}

export const sendFileUploadEmail = async (params: SendFileUploadEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, fileName, category, year, firmId } = params;

    try {
        const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .file-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .file-info h3 { margin-top: 0; color: #667eea; }
                        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
                        .info-row:last-child { border-bottom: none; }
                        .label { font-weight: 600; color: #666; }
                        .value { color: #333; }
                        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0;">📄 New Document Available</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${clientName},</p>
                        <p>A new document has been uploaded to your CA Office Portal account.</p>
                        
                        <div class="file-info">
                            <h3>📋 Document Details</h3>
                            <div class="info-row"><span class="label">File Name:</span><span class="value">${fileName}</span></div>
                            <div class="info-row"><span class="label">Category:</span><span class="value">${category}</span></div>
                            <div class="info-row"><span class="label">Financial Year:</span><span class="value">FY ${year}-${(parseInt(year) + 1).toString().slice(-2)}</span></div>
                        </div>

                        <p>You can download this document by logging into your portal:</p>
                        <center><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Login to Portal</a></center>
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            <strong>Note:</strong> Please use your username and password to access the portal. 
                        </p>
                    </div>
                    <div class="footer"><p>This is an automated message. Please do not reply.</p></div>
                </body>
                </html>
            `;

        const result = await sendEmail({
            to: clientEmail,
            subject: `New Document Available - ${category} FY ${year}`,
            html,
            firmId
        });
        return result.success;
    } catch (error) {
        console.error('Error sending file upload email:', error);
        return false;
    }
};

// Optional: Send welcome email when client is created
interface SendWelcomeEmailParams {
    clientEmail: string;
    clientName: string;
    username: string;
    password: string;
    firmId?: string;
}

export const sendWelcomeEmail = async (params: SendWelcomeEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, username, password, firmId } = params;

    try {
        const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea; }
                        .credential-row { padding: 15px; background: #f8f9fa; margin: 10px 0; border-radius: 6px; }
                        .label { font-weight: 600; color: #666; display: block; margin-bottom: 5px; }
                        .value { font-size: 18px; color: #667eea; font-weight: 700; font-family: monospace; }
                        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0;">🎉 Welcome to CA Office Portal</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${clientName},</p>
                        <p>Your account has been created successfully! You can now access your documents anytime through our secure portal.</p>
                        
                        <div class="credentials">
                            <h3 style="margin-top: 0; color: #667eea;">🔐 Your Login Credentials</h3>
                            <div class="credential-row"><span class="label">Username:</span><span class="value">${username}</span></div>
                            <div class="credential-row"><span class="label">Password:</span><span class="value">${password}</span></div>
                        </div>

                        <div class="warning"><strong>⚠️ Important:</strong> Please save these credentials securely.</div>

                        <center><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">Login Now</a></center>
                    </div>
                    <div class="footer"><p>This is an automated message. Please do not reply.</p></div>
                </body>
                </html>
            `;

        const result = await sendEmail({
            to: clientEmail,
            subject: 'Welcome to CA Office Portal - Your Login Credentials',
            html,
            firmId
        });
        return result.success;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};


// Send password change confirmation email
import { getPasswordChangeEmailHTML } from '../templates/passwordChangeEmail';

interface SendPasswordChangeEmailParams {
    userEmail: string;
    userName: string;
    username: string;
    newPassword: string;
    firmId?: string;
}

export const sendPasswordChangeEmail = async (params: SendPasswordChangeEmailParams): Promise<boolean> => {
    const { userEmail, userName, username, newPassword, firmId } = params;

    try {
        const result = await sendEmail({
            to: userEmail,
            subject: 'Password Changed Successfully - CA Office Portal',
            html: getPasswordChangeEmailHTML(userName, username, newPassword),
            firmId
        });
        return result.success;
    } catch (error) {
        console.error('Error sending password change email:', error);
        return false;
    }
};

const emailBrand = process.env.EMAIL_FROM_NAME || 'CA Office Portal';
const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// ─────────────────────────────────────────────
// Employee / Staff account created
// ─────────────────────────────────────────────
interface SendEmployeeWelcomeEmailParams {
    employeeEmail: string;
    employeeName: string;
    username: string;
    password: string;
    role: string;
    portalUrl?: string;
    firmId?: string;
}

export const sendEmployeeWelcomeEmail = async (params: SendEmployeeWelcomeEmailParams): Promise<boolean> => {
    const { employeeEmail, employeeName, username, password, role, portalUrl: firmPortalUrl, firmId } = params;
    const loginUrl = firmPortalUrl || portalUrl;
    
    try {
        const result = await sendEmail({
            to: employeeEmail,
            subject: `Welcome to the Team – Your Employee Account`,
            html: `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}
  .content{background:#f8f9fa;padding:30px;border-radius:0 0 10px 10px}
  .credentials{background:white;padding:20px;border-radius:8px;margin:20px 0;border:2px solid #667eea}
  .credential-row{padding:12px 15px;background:#f0f4ff;margin:8px 0;border-radius:6px}
  .label{font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px}
  .value{font-size:18px;color:#667eea;font-weight:800;font-family:monospace}
  .role-badge{display:inline-block;background:#667eea;color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700;margin-bottom:10px}
  .btn{display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white!important;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:700;margin:20px 0;font-size:15px}
  .warning{background:#fff3cd;border-left:4px solid #ffc107;padding:14px;margin:18px 0;border-radius:4px}
  .footer{text-align:center;color:#999;font-size:13px;margin-top:24px;padding-top:18px;border-top:1px solid #e9ecef}
</style></head>
<body>
<div class="header">
  <h1 style="margin:0;font-size:26px">👋 Welcome to the Team!</h1>
</div>
<div class="content">
  <p>Hi <strong>${employeeName}</strong>,</p>
  <p>Your employee account has been set up. Log in to the portal to view and manage your assigned tasks.</p>
  <div class="credentials">
    <h3 style="margin-top:0;color:#667eea">🔐 Your Login Credentials</h3>
    <span class="role-badge">${role}</span>
    <div class="credential-row"><span class="label">Username</span><span class="value">${username}</span></div>
    <div class="credential-row"><span class="label">Password (Temporary)</span><span class="value">${password}</span></div>
  </div>
  <div class="warning">⚠️ <strong>Important:</strong> Keep these credentials confidential. Change your password after first login.</div>
  <center><a href="${loginUrl}" class="btn">Login to Portal →</a></center>
</div>
<div class="footer"><p>This is an automated message. Do not reply.</p></div>
</body></html>`,
            firmId
        });
        return result.success;
    } catch (error) {
        console.error('Error sending employee welcome email:', error);
        return false;
    }
};

// ─────────────────────────────────────────────
// Employee / Staff password reset
// ─────────────────────────────────────────────
interface SendEmployeePasswordResetEmailParams {
    employeeEmail: string;
    employeeName: string;
    username: string;
    newPassword: string;
    portalUrl?: string;
    firmId?: string;
}

export const sendEmployeePasswordResetEmail = async (params: SendEmployeePasswordResetEmailParams): Promise<boolean> => {
    const { employeeEmail, employeeName, username, newPassword, portalUrl: firmPortalUrl, firmId } = params;
    const loginUrl = firmPortalUrl || portalUrl;
    
    try {
        const result = await sendEmail({
            to: employeeEmail,
            subject: `Password Reset Confirmation`,
            html: `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center}
  .content{background:#f8f9fa;padding:30px;border-radius:0 0 10px 10px}
  .credentials{background:white;padding:20px;border-radius:8px;margin:20px 0;border:2px solid #f59e0b}
  .credential-row{padding:12px 15px;background:#fffbeb;margin:8px 0;border-radius:6px}
  .label{font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px}
  .value{font-size:18px;color:#d97706;font-weight:800;font-family:monospace}
  .btn{display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white!important;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:700;margin:20px 0;font-size:15px}
  .alert{background:#fee2e2;border-left:4px solid #ef4444;padding:14px;margin:18px 0;border-radius:4px}
  .footer{text-align:center;color:#999;font-size:13px;margin-top:24px;padding-top:18px;border-top:1px solid #e9ecef}
</style></head>
<body>
<div class="header">
  <h1 style="margin:0;font-size:26px">🔑 Password Reset</h1>
</div>
<div class="content">
  <p>Hi <strong>${employeeName}</strong>,</p>
  <p>Your portal password has been reset. Use the credentials below to log in.</p>
  <div class="credentials">
    <h3 style="margin-top:0;color:#d97706">🔐 New Login Credentials</h3>
    <div class="credential-row"><span class="label">Username</span><span class="value">${username}</span></div>
    <div class="credential-row"><span class="label">New Password</span><span class="value">${newPassword}</span></div>
  </div>
  <center><a href="${loginUrl}" class="btn">Login Now →</a></center>
</div>
<div class="footer"><p>This is an automated message. Do not reply.</p></div>
</body></html>`,
            firmId
        });
        return result.success;
    } catch (error) {
        console.error('Error sending employee password reset email:', error);
        return false;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIRM-LEVEL SMTP (uses firm's own SMTP settings, not global env)
// ─────────────────────────────────────────────────────────────────────────────

export interface FirmSmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
}

/**
 * Replace {{variable}} placeholders in a template string.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/**
 * Send email via the firm's own SMTP config.
 */
export async function sendFirmMail(
    smtp: FirmSmtpConfig,
    to: string | string[],
    subject: string,
    html: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: { user: smtp.user, pass: smtp.password },
            tls: { rejectUnauthorized: false },
        });
        await transporter.sendMail({
            from: `"${smtp.fromName}" <${smtp.user}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        });
        return { success: true };
    } catch (err: any) {
        console.error('[FirmMail] Error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Verify firm SMTP connection (for "Send Test Email" button).
 */
export async function verifyFirmSmtp(smtp: FirmSmtpConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: { user: smtp.user, pass: smtp.password },
            tls: { rejectUnauthorized: false },
        });
        await transporter.verify();
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW HYBRID SEND EMAIL LOGIC + QUEUE HOOK
// ─────────────────────────────────────────────────────────────────────────────

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    firmId?: string;
}

export const sendEmail = async ({ to, subject, html, firmId }: SendEmailParams) => {
    let usedProvider: 'firm_smtp' | 'system_smtp' = 'system_smtp';
    let status: 'success' | 'failed' | 'fallback' = 'failed';
    let errorMessage = '';

    try {
        let firm = null;
        if (firmId) {
            firm = await Firm.findById(firmId).lean();
        }

        // 1. Try Firm Specific SMTP
        if (firm && firm.smtpEnabled && firm.smtpHost && firm.smtpUser) {
            try {
                const decryptedPass = decrypt(firm.smtpPass || '') || firm.smtpPass;
                const transporter = nodemailer.createTransport({
                    host: firm.smtpHost,
                    port: firm.smtpPort,
                    secure: firm.smtpSecure,
                    auth: { user: firm.smtpUser, pass: decryptedPass },
                    tls: { rejectUnauthorized: false },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 10000
                });

                const displayFromName = firm.smtpFromName || firm.firmName || 'CA Office Portal';

                await transporter.sendMail({
                    from: `"${displayFromName}" <${firm.smtpUser}>`,
                    to,
                    subject,
                    html
                });

                status = 'success';
                usedProvider = 'firm_smtp';

                await logEmail(firmId, to, subject, status, usedProvider);
                return { success: true, provider: usedProvider };
            } catch (smtpError: any) {
                console.error('[Firm SMTP Error] Falling back to System SMTP:', smtpError.message);
                status = 'fallback';
                errorMessage = smtpError.message;
            }
        }

        // 2. Fallback or Default: System SMTP (createTransporter)
        const systemTransporter = createTransporter();
        if (systemTransporter) {
            const displayFromName = firm ? (firm.smtpFromName || firm.firmName || 'CA Office Portal') : 'CA Office Portal';
            
            await systemTransporter.sendMail({
                from: `"${displayFromName}" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html
            });

            status = status === 'fallback' ? 'fallback' : 'success';
            usedProvider = 'system_smtp';

            await logEmail(firmId, to, subject, status, usedProvider, errorMessage);
            return { success: true, provider: usedProvider, status };
        } else {
            throw new Error('No email provider available (Firm SMTP failed and System SMTP not configured)');
        }

    } catch (error: any) {
        status = 'failed';
        await logEmail(firmId, to, subject, status, usedProvider, error.message);
        return { success: false, error: error.message };
    }
};

const logEmail = async (firmId: string | undefined, to: string, subject: string, status: string, provider: string, errorMessage?: string) => {
    try {
        await EmailLog.create({
            firmId,
            to,
            subject,
            status,
            provider,
            errorMessage
        });
    } catch (e) {
        console.error('Failed to log email:', e);
    }
};

