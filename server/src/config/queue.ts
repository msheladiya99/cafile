import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { sendEmail } from '../services/emailService';

const REDIS_URL = process.env.REDIS_URL;
export const USE_REDIS = !!REDIS_URL;

// Shared Redis connection
export const connection = USE_REDIS ? new Redis(REDIS_URL as string, {
    maxRetriesPerRequest: null,
}) : null as any;

// Create Email Queue
export const emailQueue = USE_REDIS ? new Queue('emailQueue', { connection }) : null;

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    firmId?: string;
}

export const queueEmail = async (data: EmailJobData, delay = 0) => {
    if (USE_REDIS && emailQueue) {
        return await emailQueue.add('sendEmail', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            delay, // In ms
            removeOnComplete: true,
            removeOnFail: false
        });
    } else {
        // Graceful fallback to node's event loop
        console.log('[Queue Fallback] Redis not configured, firing email via setTimeout');
        setTimeout(() => {
            sendEmail(data).catch(err => console.error('[Fallback Send] Error:', err));
        }, delay || 0);
        return { id: 'fallback-' + Date.now() };
    }
};
