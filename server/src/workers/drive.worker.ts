import { Worker, Job } from 'bullmq';
import { redisConnection } from '../queues/parse.queue';
import { getDriveService } from '../services/googleDrive';
import { Client } from '../models/Client';
import { Firm } from '../models/Firm';

console.log('🚀 Starting Google Drive Background Worker...');

export const driveWorker = new Worker('drive-operations', async (job: Job) => {
    const { clientId, clientName, panNumber, firmId } = job.data;
    
    console.log(`📂 Creating Drive folders for client: ${clientName} (${clientId})`);

    try {
        const driveService = getDriveService();
        const client = await Client.findById(clientId);
        if (!client) {
            console.error(`Client ${clientId} not found for Drive folder creation`);
            return;
        }

        // Create folders
        try {
            const folderStructure = await driveService.createClientFolderStructure(clientName, panNumber);
            
            await Client.findByIdAndUpdate(clientId, {
                driveFolderId: folderStructure.clientFolderId,
                driveItrFolderId: folderStructure.itrFolderId,
                driveGstFolderId: folderStructure.gstFolderId,
                driveAccountingFolderId: folderStructure.accountingFolderId,
                driveDocumentsFolderId: folderStructure.documentsFolderId,
                driveNoticesFolderId: folderStructure.noticesFolderId,
            });

            console.log(`✅ Drive folders created for ${clientName}`);
        } catch (driveErr: any) {
            // Handle Firm root repair (same logic as in routes)
            const firmDoc = await Firm.findById(firmId);
            if (driveErr.response?.status === 404 && firmDoc?.googleDriveType === 'app') {
                console.log(`Firm root missing for firm ${firmId}, repairing...`);
                const newFirmRootId = await driveService.ensureFirmStructure(firmDoc.firmName);
                
                firmDoc.googleDriveRootFolderId = newFirmRootId;
                await firmDoc.save();
                
                driveService.setRootFolder(newFirmRootId);
                const folderStructure = await driveService.createClientFolderStructure(clientName, panNumber);
                
                await Client.findByIdAndUpdate(clientId, {
                    driveFolderId: folderStructure.clientFolderId,
                    driveItrFolderId: folderStructure.itrFolderId,
                    driveGstFolderId: folderStructure.gstFolderId,
                    driveAccountingFolderId: folderStructure.accountingFolderId,
                    driveDocumentsFolderId: folderStructure.documentsFolderId,
                    driveNoticesFolderId: folderStructure.noticesFolderId,
                });
            } else {
                throw driveErr;
            }
        }
    } catch (error) {
        console.error(`❌ Failed to create Drive folders for ${clientName}:`, error);
        throw error; // Rethrow to let BullMQ retry
    }
}, { 
    connection: redisConnection,
    concurrency: 2 // Keep it low to avoid Google Drive rate limits
});

driveWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});

