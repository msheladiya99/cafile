import { Queue } from 'bullmq';
import { redisConnection } from './parse.queue';

export const driveQueue = new Queue('drive-operations', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
    },
});

export const enqueueDriveFolderCreation = async (data: {
    clientId: string;
    clientName: string;
    panNumber?: string;
    firmId: string;
}) => {
    return await driveQueue.add('create-client-folders', data, {
        jobId: `drive_folders_${data.clientId}`,
    });
};
