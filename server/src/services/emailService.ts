import nodemailer from 'nodemailer';
import dns from 'dns';
import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import { getPasswordChangeEmailHTML } from '../templates/passwordChangeEmail';

// Critical fix for Render/Node 18+: forces IPv4 instead of IPv6 for DNS resolution
// Render's network cannot route outgoing IPv6 which causes silent connection timeouts on smtp.gmail.com
dns.setDefaultResultOrder('ipv4first');

// Global constants for branding
const emailBrand = process.env.EMAIL_FROM_NAME || 'CA Office Portal';
const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Fallback SMTP Transporter configuration (used locally or if API fails)
 */
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return null;
    }
    const host = process.env.SMTP_HOST || 'smtp.googlemail.com';
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    });
};

/**
 * Sends an email using the Gmail REST API (bypasses Render SMTP port blocking)
 */
const sendViaGmailApi = async (mailOptions: any): Promise<boolean> => {
    try {
        const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            return false;
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Build raw MIME message using nodemailer
        const mail = new MailComposer(mailOptions);
        const message = await mail.compile().build();
        
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encodedMessage },
        });

        console.log('Email delivery: SUCCESS (Gmail API)');
        return true;
    } catch (error: any) {
        console.error('Email delivery: FAILED (Gmail API):', error.message);
        return false;
    }
};

/**
 * Shared internal delivery function with fallbacks
 */
const sendEmail = async (mailOptions: any): Promise<boolean> => {
    // Ensure "from" is always present
    if (!mailOptions.from) {
        mailOptions.from = {
            name: emailBrand,
            address: process.env.EMAIL_USER || ''
        };
    }

    // 1. Try Gmail API (HTTP 443) - Bypasses Render port blocking
    const apiResult = await sendViaGmailApi(mailOptions);
    if (apiResult) return true;

    // 2. Fallback to Transporter (SMTP) - For local dev
    const transporter = createTransporter();
    if (!transporter) {
        console.warn('Email skipped: No valid credentials/transporter.');
        return false;
    }

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email delivery: SUCCESS (SMTP Fallback)');
        return true;
    } catch (error: any) {
        console.error('Email delivery: FINAL FAILURE:', error.message);
        return false;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface SendFileUploadEmailParams {
    clientEmail: string;
    clientName: string;
    fileName: string;
    category: string;
    year: string;
}

export const sendFileUploadEmail = async (params: SendFileUploadEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, fileName, category, year } = params;
    
    const mailOptions = {
        to: clientEmail,
        subject: `New Document Available - ${category} FY ${year}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .file-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
                    .label { font-weight: 600; color: #666; }
                    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
                </style>
            </head>
            <body>
                <div class="header"><h1 style="margin: 0;">📄 New Document</h1></div>
                <div class="content">
                    <p>Dear ${clientName},</p>
                    <p>A new document has been uploaded to your ${emailBrand} account.</p>
                    <div class="file-info">
                        <div class="info-row"><span class="label">File:</span><span>${fileName}</span></div>
                        <div class="info-row"><span class="label">Category:</span><span>${category}</span></div>
                        <div class="info-row"><span class="label">Year:</span><span>FY ${year}</span></div>
                    </div>
                    <center><a href="${portalUrl}" class="button">Login to Portal</a></center>
                </div>
                <div class="footer"><p>This is an automated message from ${emailBrand}.</p></div>
            </body></html>`
    };

    return await sendEmail(mailOptions);
};

interface SendWelcomeEmailParams {
    clientEmail: string; clientName: string; username: string; password: string;
}

export const sendWelcomeEmail = async (params: SendWelcomeEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, username, password } = params;
    
    const mailOptions = {
        to: clientEmail,
        subject: `Welcome to ${emailBrand} - Login Credentials`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea; }
                    .credential-row { padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 6px; }
                    .label { font-weight: 600; color: #666; }
                    .value { font-size: 18px; color: #667eea; font-weight: 700; font-family: monospace; }
                    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header"><h1>🎉 Welcome</h1></div>
                <div class="content">
                    <p>Dear ${clientName},</p>
                    <p>Your account has been created. Use the credentials below to log in:</p>
                    <div class="credentials">
                        <div class="credential-row"><span class="label">Username:</span> <span class="value">${username}</span></div>
                        <div class="credential-row"><span class="label">Password:</span> <span class="value">${password}</span></div>
                    </div>
                    <center><a href="${portalUrl}" class="button">Login Now</a></center>
                </div>
                <div class="footer"><p>Automated message from ${emailBrand}.</p></div>
            </body></html>`
    };

    return await sendEmail(mailOptions);
};

interface SendPasswordChangeEmailParams {
    userEmail: string; userName: string; username: string; newPassword: string;
}

export const sendPasswordChangeEmail = async (params: SendPasswordChangeEmailParams): Promise<boolean> => {
    const { userEmail, userName, username, newPassword } = params;
    const mailOptions = {
        to: userEmail,
        subject: `Password Changed - ${emailBrand}`,
        html: getPasswordChangeEmailHTML(userName, username, newPassword),
    };
    return await sendEmail(mailOptions);
};

interface SendEmployeeWelcomeEmailParams {
    employeeEmail: string; employeeName: string; username: string; password: string; role: string;
}

export const sendEmployeeWelcomeEmail = async (params: SendEmployeeWelcomeEmailParams): Promise<boolean> => {
    const { employeeEmail, employeeName, username, password, role } = params;
    const mailOptions = {
        to: employeeEmail,
        subject: `Welcome to ${emailBrand} – Staff Account`,
        html: `<!DOCTYPE html>
<html><body>
<div style="font-family: sans-serif; padding: 20px;">
  <h2>👋 Welcome to the Team!</h2>
  <p>Hi ${employeeName}, your account is ready.</p>
  <div style="background: #f0f4ff; padding: 15px; border-radius: 8px;">
    <strong>Role:</strong> ${role}<br>
    <strong>Username:</strong> ${username}<br>
    <strong>Password:</strong> ${password}
  </div>
  <p><a href="${portalUrl}">Login to Portal →</a></p>
</div>
</body></html>`
    };
    return await sendEmail(mailOptions);
};

interface SendEmployeePasswordResetEmailParams {
    employeeEmail: string; employeeName: string; username: string; newPassword: string;
}

export const sendEmployeePasswordResetEmail = async (params: SendEmployeePasswordResetEmailParams): Promise<boolean> => {
    const { employeeEmail, employeeName, username, newPassword } = params;
    const mailOptions = {
        to: employeeEmail,
        subject: `Password Reset – ${emailBrand}`,
        html: `<!DOCTYPE html>
<html><body>
<div style="font-family: sans-serif; padding: 20px;">
  <h2>🔑 Password Reset</h2>
  <p>Hi ${employeeName}, your password has been reset.</p>
  <div style="background: #fffbeb; padding: 15px; border-radius: 8px;">
    <strong>Username:</strong> ${username}<br>
    <strong>New Password:</strong> ${newPassword}
  </div>
  <p><a href="${portalUrl}">Login Now →</a></p>
</div>
</body></html>`
    };
    return await sendEmail(mailOptions);
};
