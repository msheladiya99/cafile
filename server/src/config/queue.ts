import { Queue } from 'bullmq';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Shared Redis connection
export const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

// Create Email Queue
export const emailQueue = new Queue('emailQueue', { connection });

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
    firmId?: string;
}

export const queueEmail = async (data: EmailJobData, delay = 0) => {
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
};
