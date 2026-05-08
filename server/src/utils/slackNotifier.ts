import axios from 'axios';
import os from 'os';

const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const sendSlackAlert = async (error: any, req: any = null) => {
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
    if (!SLACK_WEBHOOK_URL) {
        console.warn('Slack Webhook URL is not configured. Skipping Slack alert.');
        return;
    }

    const time = new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const endpoint = req ? `${req.method} ${req.originalUrl}` : 'System / Background Task';
    
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const serverStatus = `CPU: ${(cpuUsage.user / 1000000).toFixed(2)}s | RAM: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`;

    const safeErrorMessage = error instanceof Error ? error.message : (error?.message || (typeof error === 'string' ? error : JSON.stringify(error) || 'Unknown Error'));
    const safeErrorStack = error?.stack || '';

    const message: any = {
        text: "🚨 *BACKEND ERROR ALERT*",
        blocks: [
            {
                type: "header",
                text: { type: "plain_text", text: "🚨 BACKEND ERROR ALERT", emoji: true }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*❌ Error:*\n${safeErrorMessage}` }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*📍 Endpoint:*\n${endpoint}` }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*🕒 Time:*\n${time}` }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*🌍 Environment:*\n${ENVIRONMENT.charAt(0).toUpperCase() + ENVIRONMENT.slice(1)}` }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: `*📦 Server:*\nRender Production Server (${os.hostname()})\n*Status:* ${serverStatus}` }
            }
        ]
    };

    if (safeErrorStack) {
        message.blocks.push({
            type: "section",
            text: { type: "mrkdwn", text: `*📜 Stack Trace:*\n\`\`\`${safeErrorStack.substring(0, 1000)}\`\`\`` }
        });
    }

    try {
        await axios.post(SLACK_WEBHOOK_URL, message);
    } catch (slackError: any) {
        // Use process.stderr.write to avoid infinite loops if we intercept console.error later
        process.stderr.write(`Failed to send Slack alert: ${slackError.message}\n`);
    }
};

let isSlackAlertActive = false;

export const captureConsoleError = () => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
        originalConsoleError(...args);
        
        if (!isSlackAlertActive) {
            isSlackAlertActive = true;
            
            // Extract the first Error object, or concatenate everything into a message
            const errorObj = args.find(a => a instanceof Error);
            const msg = args.map(a => {
                if (typeof a === 'string') return a;
                if (a instanceof Error) return a.message;
                try { return JSON.stringify(a); } catch { return 'Unknown object'; }
            }).join(' ');

            sendSlackAlert(errorObj || new Error(msg)).finally(() => {
                isSlackAlertActive = false;
            });
        }
    };
};

