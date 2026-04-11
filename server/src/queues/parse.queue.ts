import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const parseQueue = new Queue('bank-statement-parsing', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const enqueueParsingTask = async (data: {
    statementId: string;
    firmId: string;
    clientId: string;
    fileBufferBase64: string;
    fileName: string;
    mimeType: string;
}) => {
    await parseQueue.add('process-statement', data);
};
