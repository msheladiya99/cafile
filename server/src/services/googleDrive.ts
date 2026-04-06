import { google } from 'googleapis';
import { Readable } from 'stream';

interface DriveConfig {
    clientEmail?: string;
    privateKey?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    rootFolderId?: string;
}

export class GoogleDriveService {
    private drive;
    private rootFolderId: string;

    constructor(config: DriveConfig) {
        let auth;

        // Check for OAuth2 credentials first (User Account with storage connection)
        if (config.clientId && config.clientSecret && config.refreshToken) {
            const oauth2Client = new google.auth.OAuth2(
                config.clientId,
                config.clientSecret,
                'https://developers.google.com/oauthplayground'
            );
            oauth2Client.setCredentials({ refresh_token: config.refreshToken });
            auth = oauth2Client;
            console.log('Google Drive Service initialized with OAuth2 (User Account)');
        }
        // Fallback to Service Account (JWT)
        else if (config.clientEmail && config.privateKey) {
            auth = new google.auth.JWT({
                email: config.clientEmail,
                key: config.privateKey.replace(/\\n/g, '\n'),
                scopes: ['https://www.googleapis.com/auth/drive'],
            });
            console.log('Google Drive Service initialized with Service Account (JWT)');
        } else {
            throw new Error('Google Drive credentials missing. Please configure .env');
        }

        this.drive = google.drive({ version: 'v3', auth });
        this.rootFolderId = config.rootFolderId || 'root';
    }

    /**
     * Set a temporary root folder for tenant isolation
     */
    setRootFolder(folderId: string) {
        this.rootFolderId = folderId;
        return this;
    }

    /**
     * Create a folder in Google Drive
     */
    async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
        try {
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId || this.rootFolderId],
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
                supportsAllDrives: true,
            });

            return response.data.id!;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    /**
     * Upload a file to Google Drive
     */
    async uploadFile(
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
        folderId?: string
    ): Promise<{ fileId: string; webViewLink: string }> {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [folderId || this.rootFolderId],
            };

            const media = {
                mimeType: mimeType,
                body: Readable.from(fileBuffer),
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
                supportsAllDrives: true,
            });

            return {
                fileId: response.data.id!,
                webViewLink: response.data.webViewLink!,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            throw error;
        }
    }

    /**
     * Download a file from Google Drive
     */
    async downloadFile(fileId: string): Promise<Buffer> {
        try {
            const response = await this.drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            );

            return Buffer.from(response.data as ArrayBuffer);
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error('Failed to download file from Google Drive');
        }
    }

    /**
     * Delete a file from Google Drive
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            await this.drive.files.delete({
                fileId: fileId,
                supportsAllDrives: true,
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file from Google Drive');
        }
    }

    async findFolder(folderName: string, parentId?: string): Promise<string | undefined> {
        try {
            // Escape single quotes in folder name for the query
            const sanitizedName = folderName.replace(/'/g, "\\'");
            const query = `name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId || this.rootFolderId}' in parents and trashed=false`;

            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id)',
                orderBy: 'modifiedTime desc', // Get the most recently modified usage if duplicates exist
                pageSize: 1,
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            const files = response.data.files;
            if (files && files.length > 0) {
                return files[0].id!;
            }
            return undefined;
        } catch (error) {
            console.error('Error finding folder:', error);
            return undefined;
        }
    }

    async ensureFolder(folderName: string, parentId?: string): Promise<string> {
        // 1. Check if folder exists using fast search
        const existingId = await this.findFolder(folderName, parentId);
        if (existingId) return existingId;

        // 2. Create if not exists
        try {
            return await this.createFolder(folderName, parentId);
        } catch (error) {
            // Handle race conditions where folder might have been created by another request concurrently
            const retryId = await this.findFolder(folderName, parentId);
            if (retryId) return retryId;
            throw error;
        }
    }

    /**
     * List files in a folder
     */
    async listFiles(folderId?: string): Promise<any[]> {
        try {
            const response = await this.drive.files.list({
                q: `'${folderId || this.rootFolderId}' in parents and trashed=false`,
                fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
                orderBy: 'modifiedTime desc',
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    /**
     * Get file metadata
     */
    async getFileMetadata(fileId: string): Promise<any> {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents',
                supportsAllDrives: true,
            });

            return response.data;
        } catch (error) {
            console.error('Error getting file metadata:', error);
            throw error;
        }
    }

    /**
     * Create shareable link for a file
     */
    async createShareableLink(fileId: string): Promise<string> {
        try {
            // Make file accessible to anyone with the link
            await this.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            // Get the webViewLink
            const file = await this.drive.files.get({
                fileId: fileId,
                fields: 'webViewLink',
            });

            return file.data.webViewLink!;
        } catch (error) {
            console.error('Error creating shareable link:', error);
            throw new Error('Failed to create shareable link');
        }
    }

    /**
     * Search files by name
     */
    async searchFiles(fileName: string, folderId?: string): Promise<any[]> {
        try {
            let query = `name contains '${fileName}' and trashed=false`;
            if (folderId) {
                query += ` and '${folderId}' in parents`;
            }

            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
                orderBy: 'modifiedTime desc',
                includeItemsFromAllDrives: true,
                supportsAllDrives: true,
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Error searching files:', error);
            throw new Error('Failed to search files in Google Drive');
        }
    }

    /**
     * Create client folder structure
     * Returns the client's root folder ID
     */
    async createClientFolderStructure(clientName: string, panNumber?: string): Promise<{
        clientFolderId: string;
        itrFolderId: string;
        gstFolderId: string;
        accountingFolderId: string;
        documentsFolderId: string;
        noticesFolderId: string;
    }> {
        try {
            // Create or get 'Clients' root folder to keep the firm's root clean
            const clientsRootId = await this.ensureFolder('Clients');

            // Format client folder name: "Name" or "Name (PAN)"
            const folderName = panNumber ? `${clientName} (${panNumber})` : clientName;

            // Create or get main client folder safely inside 'Clients'
            const clientFolderId = await this.ensureFolder(folderName, clientsRootId);

            // Create or get category folders
            const itrFolderId = await this.ensureFolder('Income Tax', clientFolderId);
            const gstFolderId = await this.ensureFolder('GST', clientFolderId);
            const accountingFolderId = await this.ensureFolder('Audit', clientFolderId);
            const documentsFolderId = await this.ensureFolder('Documents', clientFolderId);
            const noticesFolderId = await this.ensureFolder('Notices', clientFolderId);

            return {
                clientFolderId,
                itrFolderId,
                gstFolderId,
                accountingFolderId,
                documentsFolderId,
                noticesFolderId,
            };
        } catch (error) {
            console.error('Error creating client folder structure:', error);
            throw error;
        }
    }

    /**
     * Create year folder within a category folder
     */
    async createYearFolder(categoryFolderId: string, year: string): Promise<string> {
        try {
            return await this.ensureFolder(`FY ${year}`, categoryFolderId);
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    }

    /**
     * Create employee folder structure
     * Returns the employee's folder ID
     */
    async createEmployeeFolderStructure(employeeName: string): Promise<{ documentFolderId: string; profileFolderId: string }> {
        try {
            // Create or get 'Employees' root folder
            const employeesRootId = await this.ensureFolder('Employees');

            // Create or get subfolder for the employee
            const employeeFolderId = await this.ensureFolder(employeeName, employeesRootId);

            // Create or get subfolders
            const documentFolderId = await this.ensureFolder('Documents', employeeFolderId);
            const profileFolderId = await this.ensureFolder('Profile', employeeFolderId);

            return { documentFolderId, profileFolderId };
        } catch (error) {
            console.error('Error creating employee folder structure:', error);
            throw error;
        }
    }

    /**
     * Ensure all top-level firm folders exist
     * MyCAFile -> Firm_Name -> [Clients, Employees, Compliance, Internal Docs, Reports]
     */
    async ensureFirmStructure(firmName: string): Promise<string> {
        try {
            // 1. Ensure MyCAFile root exists (under the configured root folder ID or absolute root)
            const globalRootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'root';
            const rootId = await this.ensureFolder('MyCAFile', globalRootId);

            // 2. Ensure Firm folder exists within root
            const firmFolderId = await this.ensureFolder(firmName, rootId);

            // 3. Ensure sub-categories exist
            await this.ensureFolder('Clients', firmFolderId);
            await this.ensureFolder('Employees', firmFolderId);
            await this.ensureFolder('Compliance', firmFolderId);
            await this.ensureFolder('Internal Docs', firmFolderId);
            await this.ensureFolder('Reports', firmFolderId);

            return firmFolderId;
        } catch (error) {
            console.error('Error ensuring firm structure:', error);
            throw error;
        }
    }
}

// Singleton instance
let driveServiceInstance: GoogleDriveService | null = null;

export const initializeDriveService = (): GoogleDriveService => {
    if (!driveServiceInstance) {
        const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
        const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

        if ((clientId && clientSecret && refreshToken) || (clientEmail && privateKey)) {
            driveServiceInstance = new GoogleDriveService({
                clientEmail,
                privateKey,
                clientId,
                clientSecret,
                refreshToken,
                rootFolderId,
            });
        } else {
            console.warn('Google Drive credentials not fully configured. Some features may not work.');
            // throw new Error('Google Drive credentials not configured...'); 
        }
    }

    if (!driveServiceInstance) {
        throw new Error('Google Drive Service not initialized');
    }

    return driveServiceInstance;
};

import { getRootFolderId } from '../utils/context';

export const getDriveService = (): GoogleDriveService => {
    const rootFolderId = getRootFolderId();
    if (rootFolderId) {
        return getTenantDriveService(rootFolderId);
    }

    if (!driveServiceInstance) {
        return initializeDriveService();
    }
    return driveServiceInstance;
};

export const getTenantDriveService = (rootFolderId?: string): GoogleDriveService => {
    if (!rootFolderId) {
        if (!driveServiceInstance) {
            return initializeDriveService();
        }
        return driveServiceInstance;
    }

    // Return a new instance using the same credentials but a different rootFolderId
    const config = {
        clientEmail: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        rootFolderId: rootFolderId
    };

    return new GoogleDriveService(config);
};

/**
 * Always returns a Drive service authenticated as the SERVICE ACCOUNT (JWT).
 * Use this when validating personal Drive folders shared with the service account email.
 * OAuth2 (user account) cannot access files shared with the service account.
 */
export const getServiceAccountDriveService = (): GoogleDriveService => {
    const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        throw new Error(
            'Service Account credentials (GOOGLE_DRIVE_CLIENT_EMAIL / GOOGLE_DRIVE_PRIVATE_KEY) are not configured.'
        );
    }

    return new GoogleDriveService({ clientEmail, privateKey });
};
