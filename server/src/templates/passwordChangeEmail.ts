// Password change email template
export const getPasswordChangeEmailHTML = (userName: string, username: string, newPassword: string): string => {
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

    return `
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
                .credentials-box {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border: 2px solid #28a745;
                }
                .credentials-box h3 {
                    margin-top: 0;
                    color: #28a745;
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
                .warning {
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
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
                <h1 style="margin: 0;">🔐 Password Changed Successfully</h1>
            </div>
            <div class="content">
                <p>Dear ${userName},</p>
                <p>Your password has been changed successfully. Here are your updated login credentials:</p>
                
                <div class="credentials-box">
                    <h3>✅ Your New Login Credentials</h3>
                    <div class="credential-row">
                        <span class="label">Username:</span>
                        <span class="value">${username}</span>
                    </div>
                    <div class="credential-row">
                        <span class="label">New Password:</span>
                        <span class="value">${newPassword}</span>
                    </div>
                </div>

                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul style="margin: 10px 0;">
                        <li>Please save these credentials in a secure location</li>
                        <li>If you did not make this change, contact your CA immediately</li>
                        <li>Delete this email after saving your credentials</li>
                    </ul>
                </div>

                <center>
                    <a href="${clientURL}" class="button">
                        Login to Portal
                    </a>
                </center>

                <h3>Security Tips:</h3>
                <ul>
                    <li>🔒 Keep your password secure and don't share it with anyone</li>
                    <li>🔄 Change your password regularly</li>
                    <li>💪 Use a strong password with letters, numbers, and symbols</li>
                    <li>📧 Never share your password via email with others</li>
                    <li>🗑️ Delete this email after saving your credentials</li>
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
    `;
};
