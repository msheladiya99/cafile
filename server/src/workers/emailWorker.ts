import { Worker, Job } from 'bullmq';
import { connection, EmailJobData, USE_REDIS } from '../config/queue';
import { sendEmail } from '../services/emailService';

export const startEmailWorker = () => {
    if (!USE_REDIS || !connection) {
        console.log('[EmailWorker] Redis offline. Background queue worker physically disabled.');
        return;
    }

    const worker = new Worker<EmailJobData>(
        'emailQueue',
        async (job: Job) => {
            console.log(`[EmailWorker] Processing job ${job.id} for ${job.data.to}`);
            
            const result = await sendEmail(job.data);
            
            if (!result.success) {
                // If it failed completely (even after fallback)
                throw new Error(result.error || 'Failed to send email');
            }
            
            return result;
        },
        { connection }
    );

    worker.on('completed', (job: Job) => {
        console.log(`[EmailWorker] Job ${job.id} has completed!`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.log(`[EmailWorker] Job ${job?.id} has failed with ${err.message}`);
    });
    
    console.log('[EmailWorker] Started queue worker');
};
