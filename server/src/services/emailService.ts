import nodemailer from 'nodemailer';

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
}

export const sendFileUploadEmail = async (params: SendFileUploadEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, fileName, category, year } = params;

    const transporter = createTransporter();

    // If email not configured, just log and return
    if (!transporter) {
        console.log('Email notification skipped (not configured)');
        return false;
    }

    try {
        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'CA Office Portal',
                address: process.env.EMAIL_USER!,
            },
            to: clientEmail,
            subject: `New Document Available - ${category} FY ${year}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #f8f9fa;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .file-info {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border-left: 4px solid #667eea;
                        }
                        .file-info h3 {
                            margin-top: 0;
                            color: #667eea;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            border-bottom: 1px solid #e9ecef;
                        }
                        .info-row:last-child {
                            border-bottom: none;
                        }
                        .label {
                            font-weight: 600;
                            color: #666;
                        }
                        .value {
                            color: #333;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: 600;
                        }
                        .footer {
                            text-align: center;
                            color: #666;
                            font-size: 14px;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #e9ecef;
                        }
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
                            <div class="info-row">
                                <span class="label">File Name:</span>
                                <span class="value">${fileName}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Category:</span>
                                <span class="value">${category}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Financial Year:</span>
                                <span class="value">FY ${year}-${(parseInt(year) + 1).toString().slice(-2)}</span>
                            </div>
                        </div>

                        <p>You can download this document by logging into your portal:</p>
                        
                        <center>
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">
                                Login to Portal
                            </a>
                        </center>

                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            <strong>Note:</strong> Please use your username and password to access the portal. 
                            If you've forgotten your credentials, please contact your CA.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message from CA Office Portal.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${clientEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

// Optional: Send welcome email when client is created
interface SendWelcomeEmailParams {
    clientEmail: string;
    clientName: string;
    username: string;
    password: string;
}

export const sendWelcomeEmail = async (params: SendWelcomeEmailParams): Promise<boolean> => {
    const { clientEmail, clientName, username, password } = params;

    const transporter = createTransporter();

    if (!transporter) {
        console.log('Welcome email skipped (not configured)');
        return false;
    }

    try {
        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'CA Office Portal',
                address: process.env.EMAIL_USER!,
            },
            to: clientEmail,
            subject: 'Welcome to CA Office Portal - Your Login Credentials',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .content {
                            background: #f8f9fa;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .credentials {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border: 2px solid #667eea;
                        }
                        .credential-row {
                            padding: 15px;
                            background: #f8f9fa;
                            margin: 10px 0;
                            border-radius: 6px;
                        }
                        .label {
                            font-weight: 600;
                            color: #666;
                            display: block;
                            margin-bottom: 5px;
                        }
                        .value {
                            font-size: 18px;
                            color: #667eea;
                            font-weight: 700;
                            font-family: monospace;
                        }
                        .button {
                            display: inline-block;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 15px 40px;
                            text-decoration: none;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-weight: 600;
                        }
                        .warning {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                        .footer {
                            text-align: center;
                            color: #666;
                            font-size: 14px;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #e9ecef;
                        }
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
                            <div class="credential-row">
                                <span class="label">Username:</span>
                                <span class="value">${username}</span>
                            </div>
                            <div class="credential-row">
                                <span class="label">Password:</span>
                                <span class="value">${password}</span>
                            </div>
                        </div>

                        <div class="warning">
                            <strong>⚠️ Important:</strong> Please save these credentials securely. You will need them to access your documents.
                        </div>

                        <center>
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="button">
                                Login Now
                            </a>
                        </center>

                        <h3>What you can do:</h3>
                        <ul>
                            <li>✅ View all your uploaded documents</li>
                            <li>✅ Download ITR, GST, and Accounting files</li>
                            <li>✅ Filter by year and category</li>
                            <li>✅ Access 24/7 from anywhere</li>
                        </ul>

                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            If you have any questions or need assistance, please contact your CA.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated message from CA Office Portal.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent successfully to ${clientEmail}`);
        return true;
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
    newPassword: string;  // Added new password parameter
}

export const sendPasswordChangeEmail = async (params: SendPasswordChangeEmailParams): Promise<boolean> => {
    const { userEmail, userName, username, newPassword } = params;

    const transporter = createTransporter();

    if (!transporter) {
        console.log('Password change email skipped (not configured)');
        return false;
    }

    try {
        const mailOptions = {
            from: {
                name: process.env.EMAIL_FROM_NAME || 'CA Office Portal',
                address: process.env.EMAIL_USER!,
            },
            to: userEmail,
            subject: 'Password Changed Successfully - CA Office Portal',
            html: getPasswordChangeEmailHTML(userName, username, newPassword),  // Pass new password
        };

        await transporter.sendMail(mailOptions);
        console.log(`Password change email sent successfully to ${userEmail}`);
        return true;
    } catch (error) {
        console.error('Error sending password change email:', error);
        return false;
    }
};
