import { getDriveService } from './googleDrive';

/**
 * Storage Abstraction Layer (Currently using Google Drive)
 */
export class StorageService {
    /**
     * Uploads a file and returns the drive ID and web link
     */
    async uploadFile(buffer: Buffer, fileName: string, mimeType: string, panNumber?: string, clientName?: string) {
        const drive = getDriveService();
        
        // Use client-specific folder if provided
        let folderId;
        if (clientName) {
            const structure = await drive.createClientFolderStructure(clientName, panNumber);
            folderId = structure.bankStatementsFolderId;
        }

        const result = await drive.uploadFile(buffer, fileName, mimeType, folderId);
        return {
            fileId: result.fileId,
            url: result.webViewLink
        };
    }

    /**
     * Downloads a file as a Buffer
     */
    async downloadFile(fileId: string): Promise<Buffer> {
        const drive = getDriveService();
        return await drive.downloadFile(fileId);
    }

    /**
     * Deletes a file
     */
    async deleteFile(fileId: string): Promise<void> {
        const drive = getDriveService();
        await drive.deleteFile(fileId);
    }
}

export const storageService = new StorageService();
