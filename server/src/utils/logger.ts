import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const formatMessage = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${meta ? JSON.stringify(meta) : ''}\n`;
};

const writeLog = (filename: string, message: string) => {
    fs.appendFile(path.join(logDir, filename), message, (err) => {
        if (err) console.error('Failed to write log', err);
    });
};

export const logger = {
    info: (message: string, meta?: any) => {
        const log = formatMessage('info', message, meta);
        console.log(log.trim());
        writeLog('combined.log', log);
    },
    error: (message: string, meta?: any) => {
        const log = formatMessage('error', message, meta);
        console.error(log.trim());
        writeLog('error.log', log);
        writeLog('combined.log', log);
    },
    warn: (message: string, meta?: any) => {
        const log = formatMessage('warn', message, meta);
        console.warn(log.trim());
        writeLog('combined.log', log);
    }
};
