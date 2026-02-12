import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { File } from '../models/File';
import { Client } from '../models/Client';
import { authenticate, requireAdmin, requireRoles, AuthRequest } from '../middleware/auth';
import { getDriveService } from '../services/googleDrive';
import archiver from 'archiver';
import Invoice from '../models/Invoice';

const router = Router();

/**
 * Middleware to check if client has file access based on payment status
 */
const checkFileAccess = async (req: AuthRequest, res: Response, next: Function) => {
    try {
        // Admin, Manager, Staff, and Intern always have access
        if (req.user!.role !== 'CLIENT') {
            return next();
        }

        const clientId = req.user!.clientId;
        if (!clientId) {
            return res.status(403).json({ message: 'Client ID not found' });
        }

        // Find all invoices for this client
        const invoices = await Invoice.find({ clientId });

        // If no invoices, allow access (new client)
        if (invoices.length === 0) {
            return next();
        }

        // Check for overdue invoices
        const now = new Date();
        const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'PARTIAL');
        const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.dueDate) < now);

        // Block access if there are overdue invoices
        if (overdueInvoices.length > 0) {
            const totalOutstanding = overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
            return res.status(403).json({
                message: 'File access restricted due to pending payments',
                hasFileAccess: false,
                overdueInvoices: overdueInvoices.length,
                totalOutstanding,
                overdueDetails: overdueInvoices.map(inv => ({
                    invoiceNumber: inv.invoiceNumber,
                    dueDate: inv.dueDate,
                    balanceAmount: inv.balanceAmount,
                })),
            });
        }

        // Allow access if no overdue invoices
        next();
    } catch (error) {
        console.error('Error checking file access:', error);
        res.status(500).json({ message: 'Error verifying file access' });
    }
};

// Configure multer for memory storage (for Google Drive uploads)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});

/**
 * Upload file - supports both local and Google Drive storage
 * POST /api/files/upload
 */
router.post('/upload', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const { clientId, year, category, fileName, month } = req.body;
        const uploadedFile = req.file;

        if (!uploadedFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!clientId || !category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Year is required for all categories except USER_DOCS
        if (category !== 'USER_DOCS' && !year) {
            return res.status(400).json({ message: 'Year is required for this category' });
        }

        // Verify client exists
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const originalFileName = uploadedFile.originalname;
        let customFileName = fileName || originalFileName;

        // If GST and month is provided, prepend month to filename for better organization
        if (category === 'GST' && month) {
            // check if filename already starts with month to avoid double prefix
            if (!customFileName.toLowerCase().startsWith(month.toLowerCase())) {
                customFileName = `${month} - ${customFileName}`;
            }
        }

        // Force Google Drive Upload
        try {
            const driveService = getDriveService();

            // Create client folder structure if not exists
            if (!client.driveFolderId) {
                const folderStructure = await driveService.createClientFolderStructure(client.name);
                client.driveFolderId = folderStructure.clientFolderId;
                client.driveItrFolderId = folderStructure.itrFolderId;
                client.driveGstFolderId = folderStructure.gstFolderId;
                client.driveAccountingFolderId = folderStructure.accountingFolderId;
                await client.save();
            }

            // For USER_DOCS, upload directly to client root folder without year organization
            if (category === 'USER_DOCS') {
                // Create or get USER_DOCS folder in client root
                let userDocsFolderId: string | undefined;

                try {
                    const clientFolders = await driveService.listFiles(client.driveFolderId!);
                    userDocsFolderId = clientFolders.find(f => f.name === 'USER_DOCS' && f.mimeType === 'application/vnd.google-apps.folder')?.id;

                    if (!userDocsFolderId) {
                        userDocsFolderId = await driveService.createFolder('USER_DOCS', client.driveFolderId!);
                    }
                } catch (error) {
                    console.error('Error creating USER_DOCS folder:', error);
                    return res.status(500).json({ message: 'Failed to create USER_DOCS folder' });
                }

                // Upload file directly to USER_DOCS folder
                const driveFile = await driveService.uploadFile(
                    uploadedFile.buffer,
                    customFileName,
                    uploadedFile.mimetype,
                    userDocsFolderId
                );

                // Create file record in database
                const fileRecord = new File({
                    clientId,
                    category,
                    fileName: customFileName,
                    originalFileName,
                    filePath: driveFile.webViewLink,
                    fileSize: uploadedFile.size,
                    uploadedBy: req.user!._id,
                    driveFileId: driveFile.fileId,
                    driveWebViewLink: driveFile.webViewLink,
                    storedIn: 'drive',
                });

                await fileRecord.save();

                return res.status(201).json({
                    message: 'File uploaded to Google Drive successfully',
                    file: fileRecord,
                    driveLink: driveFile.webViewLink,
                });
            }

            // Get the appropriate category folder for ITR, GST, ACCOUNTING
            let categoryFolderId: string;
            switch (category) {
                case 'ITR':
                    categoryFolderId = client.driveItrFolderId!;
                    break;
                case 'GST':
                    categoryFolderId = client.driveGstFolderId!;
                    break;
                case 'ACCOUNTING':
                    categoryFolderId = client.driveAccountingFolderId!;
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid category' });
            }

            // Create or get year folder
            const yearFolderName = `FY ${year}`;
            let existingFolders: any[] = [];
            try {
                existingFolders = await driveService.listFiles(categoryFolderId);
            } catch (error) {
                console.warn(`Could not list files for folder ${categoryFolderId}, it might be missing.`);
            }

            let yearFolderId = existingFolders.find(f => f.name === yearFolderName)?.id;

            if (!yearFolderId) {
                try {
                    yearFolderId = await driveService.createYearFolder(categoryFolderId, year);
                } catch (error: any) {
                    console.log('Error creating year folder, checking for missing parent...', error.message);

                    // Check if error is due to missing parent folder (404)
                    if (error.message.includes('File not found') || error.code === 404 || (error.response && error.response.status === 404)) {
                        console.log('Category folder missing, attempting to repair folder structure...');

                        // Check if main client folder exists
                        let clientFolderId = client.driveFolderId;
                        let clientFolderExists = false;

                        if (clientFolderId) {
                            try {
                                await driveService.getFileMetadata(clientFolderId);
                                clientFolderExists = true;
                            } catch (e) {
                                console.log('Client root folder also missing');
                            }
                        }

                        if (!clientFolderExists) {
                            // Recreate entire structure
                            const folderStructure = await driveService.createClientFolderStructure(client.name);
                            client.driveFolderId = folderStructure.clientFolderId;
                            client.driveItrFolderId = folderStructure.itrFolderId;
                            client.driveGstFolderId = folderStructure.gstFolderId;
                            client.driveAccountingFolderId = folderStructure.accountingFolderId;
                            await client.save();

                            // Update category folder ID
                            switch (category) {
                                case 'ITR': categoryFolderId = client.driveItrFolderId!; break;
                                case 'GST': categoryFolderId = client.driveGstFolderId!; break;
                                case 'ACCOUNTING': categoryFolderId = client.driveAccountingFolderId!; break;
                            }
                        } else {
                            // Client root exists, re-create specific category folder
                            console.log(`Recreating missing category folder: ${category}`);

                            const newCategoryFolderId = await driveService.createFolder(category, clientFolderId!);
                            switch (category) {
                                case 'ITR': client.driveItrFolderId = newCategoryFolderId; break;
                                case 'GST': client.driveGstFolderId = newCategoryFolderId; break;
                                case 'ACCOUNTING': client.driveAccountingFolderId = newCategoryFolderId; break;
                            }
                            await client.save();
                            categoryFolderId = newCategoryFolderId;
                        }

                        // Retry creating year folder with new parent ID
                        yearFolderId = await driveService.createYearFolder(categoryFolderId, year);
                    } else {
                        throw error;
                    }
                }
            }

            let targetFolderId = yearFolderId;

            // Handle Month and DocType Folders for GST
            if (category === 'GST' && month) {
                try {
                    // 1. Handle Month Folder
                    const monthFolders = await driveService.listFiles(yearFolderId);
                    const monthFolderName = month;
                    let monthFolderId = monthFolders.find(f => f.name === monthFolderName && f.mimeType === 'application/vnd.google-apps.folder')?.id;

                    if (!monthFolderId) {
                        monthFolderId = await driveService.createFolder(monthFolderName, yearFolderId);
                    }
                    targetFolderId = monthFolderId;

                    // 2. Handle DocType Folder (if provided)
                    if (req.body.docType) {
                        const docType = req.body.docType;
                        const docTypeFolders = await driveService.listFiles(monthFolderId);
                        let docTypeFolderId = docTypeFolders.find(f => f.name === docType && f.mimeType === 'application/vnd.google-apps.folder')?.id;

                        if (!docTypeFolderId) {
                            docTypeFolderId = await driveService.createFolder(docType, monthFolderId);
                        }
                        targetFolderId = docTypeFolderId;
                    }

                } catch (error) {
                    console.error('Error handling GST folders:', error);
                    // Fallback to year folder if folder creation fails
                    targetFolderId = yearFolderId;
                }
            }

            // Upload file to Google Drive
            const driveFile = await driveService.uploadFile(
                uploadedFile.buffer,
                customFileName,
                uploadedFile.mimetype,
                targetFolderId
            );

            // Create file record in database
            const fileRecord = new File({
                clientId,
                year,
                category,
                month,
                docType: req.body.docType,
                fileName: customFileName,
                originalFileName,
                filePath: driveFile.webViewLink,
                fileSize: uploadedFile.size,
                uploadedBy: req.user!._id,
                driveFileId: driveFile.fileId,
                driveWebViewLink: driveFile.webViewLink,
                storedIn: 'drive',
            });

            await fileRecord.save();

            return res.status(201).json({
                message: 'File uploaded to Google Drive successfully',
                file: fileRecord,
                driveLink: driveFile.webViewLink,
            });

        } catch (error) {
            console.error('Google Drive upload error:', error);
            return res.status(500).json({
                message: 'Failed to upload to Google Drive. Please check your credentials and storage quota.',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('File upload validation error:', error);
        res.status(500).json({ message: 'Error processing upload request' });
    }
});

/**
 * Download file - supports both local and Google Drive
 * GET /api/files/:id/download
 */
router.get('/:id/download', authenticate, checkFileAccess, async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if user has access to this file
        if (req.user!.role === 'CLIENT' && file.clientId.toString() !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (file.storedIn === 'drive' && file.driveFileId) {
            // Download from Google Drive
            try {
                const driveService = getDriveService();
                const fileBuffer = await driveService.downloadFile(file.driveFileId);

                res.setHeader('Content-Type', 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
                res.send(fileBuffer);
            } catch (error) {
                console.error('Google Drive download error:', error);
                res.status(500).json({ message: 'Failed to download file from Google Drive' });
            }
        } else {
            // Download from local storage
            try {
                const absolutePath = path.resolve(file.filePath);
                res.download(absolutePath, file.fileName);
            } catch (error) {
                console.error('Local file download error:', error);
                res.status(500).json({ message: 'Failed to download file from local storage' });
            }
        }
    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
});

/**
 * Preview file - supports local files (inline display)
 * GET /api/files/:id/preview
 */
router.get('/:id/preview', authenticate, checkFileAccess, async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if user has access to this file
        if (req.user!.role === 'CLIENT' && file.clientId.toString() !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (file.storedIn === 'drive') {
            if (!file.driveFileId) {
                return res.status(404).json({ message: 'Drive file ID missing' });
            }

            try {
                const driveService = getDriveService();

                // Fetch metadata to get correct MIME type
                const metadata = await driveService.getFileMetadata(file.driveFileId);
                const mimeType = metadata.mimeType || 'application/octet-stream';

                // Download file buffer
                const fileBuffer = await driveService.downloadFile(file.driveFileId);

                res.setHeader('Content-Type', mimeType);
                res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
                res.send(fileBuffer);
            } catch (error) {
                console.error('Drive preview error:', error);
                return res.status(500).json({ message: 'Failed to preview file from Drive' });
            }
        } else {
            // Serve local file inline
            try {
                const absolutePath = path.resolve(file.filePath);

                // Determine content type based on extension (basic support)
                const ext = path.extname(file.fileName).toLowerCase();
                let contentType = 'application/octet-stream';
                if (ext === '.pdf') contentType = 'application/pdf';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                else if (ext === '.png') contentType = 'image/png';
                else if (ext === '.txt') contentType = 'text/plain';

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
                res.sendFile(absolutePath);
            } catch (error) {
                console.error('Local file preview error:', error);
                res.status(500).json({ message: 'Failed to preview file from local storage' });
            }
        }
    } catch (error) {
        console.error('File preview error:', error);
        res.status(500).json({ message: 'Error previewing file' });
    }
});

/**
 * Bulk Download Files as ZIP
 * POST /api/files/download-zip
 */
router.post('/download-zip', authenticate, checkFileAccess, async (req: AuthRequest, res: Response) => {
    try {
        const { fileIds } = req.body;

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ message: 'No files selected' });
        }

        const files = await File.find({ _id: { $in: fileIds } });

        if (files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }

        // Security check: Ensure user has access to ALL requested files
        if (req.user!.role === 'CLIENT') {
            const unauthorized = files.some(f => f.clientId.toString() !== req.user!.clientId?.toString());
            if (unauthorized) {
                return res.status(403).json({ message: 'Access denied to one or more files' });
            }
        }

        // Initialize archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="files.zip"');

        // Pipe archive data to the response
        archive.pipe(res);

        for (const file of files) {
            if (file.storedIn === 'drive' && file.driveFileId) {
                try {
                    const driveService = getDriveService();
                    const fileBuffer = await driveService.downloadFile(file.driveFileId);
                    archive.append(fileBuffer, { name: file.fileName });
                } catch (err) {
                    console.error(`Failed to add Drive file ${file.fileName} to zip:`, err);
                    archive.append(Buffer.from(`Error downloading file: ${file.fileName}`), { name: `ERROR_${file.fileName}.txt` });
                }
            } else {
                try {
                    const absolutePath = path.resolve(file.filePath);
                    archive.file(absolutePath, { name: file.fileName });
                } catch (err) {
                    console.error(`Failed to add local file ${file.fileName} to zip:`, err);
                    archive.append(Buffer.from(`Error reading file: ${file.fileName}`), { name: `ERROR_${file.fileName}.txt` });
                }
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('Bulk download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating zip file' });
        }
    }
});

/**
 * Delete file - supports both local and Google Drive
 * DELETE /api/files/:id
 */
router.delete('/:id', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.storedIn === 'drive' && file.driveFileId) {
            // Delete from Google Drive
            try {
                const driveService = getDriveService();
                await driveService.deleteFile(file.driveFileId);
            } catch (error) {
                console.error('Google Drive delete error:', error);
                // Continue to delete database record even if Drive deletion fails
            }
        } else {
            // Delete from local storage
            try {
                await fs.unlink(file.filePath);
            } catch (error) {
                console.error('Local file delete error:', error);
                // Continue to delete database record even if file deletion fails
            }
        }

        await file.deleteOne();
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

/**
 * Bulk Delete files
 * POST /api/files/bulk-delete
 */
router.post('/bulk-delete', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { fileIds } = req.body;

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ message: 'No files selected' });
        }

        const files = await File.find({ _id: { $in: fileIds } });

        if (files.length === 0) {
            return res.status(404).json({ message: 'No files found' });
        }

        let deletedCount = 0;
        const errors: string[] = [];

        for (const file of files) {
            try {
                if (file.storedIn === 'drive' && file.driveFileId) {
                    // Delete from Google Drive
                    try {
                        const driveService = getDriveService();
                        await driveService.deleteFile(file.driveFileId);
                    } catch (error) {
                        console.error(`Google Drive delete error for ${file.fileName}:`, error);
                        // Continue to delete from DB
                    }
                } else {
                    // Delete from local storage
                    try {
                        await fs.unlink(file.filePath);
                    } catch (error) {
                        console.error(`Local file delete error for ${file.fileName}:`, error);
                        // Continue to delete from DB
                    }
                }

                await file.deleteOne();
                deletedCount++;
            } catch (err) {
                console.error(`Error deleting file ${file._id}:`, err);
                errors.push(file.fileName);
            }
        }

        res.json({
            message: `Successfully deleted ${deletedCount} files`,
            deletedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ message: 'Error processing bulk delete' });
    }
});

/**
 * Get files for a client with filters and search
 * GET /api/files/client/:clientId
 */
router.get('/client/:clientId', authenticate, checkFileAccess, async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;
        const { year, category, search, favorites } = req.query;

        // Check if user has access
        // MANAGER can access all files, CLIENT can only access their own
        if (req.user!.role === 'CLIENT' && clientId !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const query: any = { clientId, isArchived: false }; // Default: don't show archived

        if (year) query.year = year;
        if (category) query.category = category;
        if (favorites === 'true') query.isStarred = true;

        if (search) {
            query.fileName = { $regex: search, $options: 'i' };
        }

        const files = await File.find(query)
            .sort({ uploadedAt: -1 })
            .populate('uploadedBy', 'username');

        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Error fetching files' });
    }
});

/**
 * Create shareable link for a file (Google Drive only)
 * POST /api/files/:id/share
 */
router.post('/:id/share', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (file.storedIn !== 'drive' || !file.driveFileId) {
            return res.status(400).json({ message: 'File is not stored in Google Drive' });
        }

        const driveService = getDriveService();
        const shareableLink = await driveService.createShareableLink(file.driveFileId);

        // Update file record with shareable link
        file.driveWebViewLink = shareableLink;
        await file.save();

        res.json({
            message: 'Shareable link created successfully',
            link: shareableLink
        });
    } catch (error) {
        console.error('Error creating shareable link:', error);
        res.status(500).json({ message: 'Error creating shareable link' });
    }
});

/**
 * Toggle star status for a file
 * PATCH /api/files/:id/star
 */
router.patch('/:id/star', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check access
        if (req.user!.role === 'CLIENT' && file.clientId.toString() !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        file.isStarred = !file.isStarred;
        file.lastModified = new Date();
        await file.save();

        res.json({
            message: file.isStarred ? 'File starred' : 'File unstarred',
            isStarred: file.isStarred
        });
    } catch (error) {
        console.error('Error toggling star:', error);
        res.status(500).json({ message: 'Error updating file' });
    }
});

/**
 * Toggle archive status for a file
 * PATCH /api/files/:id/archive
 */
router.patch('/:id/archive', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.isArchived = !file.isArchived;
        file.lastModified = new Date();
        await file.save();

        res.json({
            message: file.isArchived ? 'File archived' : 'File unarchived',
            isArchived: file.isArchived
        });
    } catch (error) {
        console.error('Error toggling archive:', error);
        res.status(500).json({ message: 'Error updating file' });
    }
});

/**
 * Update file tags
 * PATCH /api/files/:id/tags
 */
router.patch('/:id/tags', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).json({ message: 'Tags must be an array' });
        }

        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        file.tags = tags;
        file.lastModified = new Date();
        await file.save();

        res.json({
            message: 'Tags updated successfully',
            tags: file.tags
        });
    } catch (error) {
        console.error('Error updating tags:', error);
        res.status(500).json({ message: 'Error updating tags' });
    }
});

/**
 * Update file notes
 * PATCH /api/files/:id/notes
 */
router.patch('/:id/notes', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { notes } = req.body;

        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Allow Admin OR Client (if owner)
        if (req.user!.role === 'CLIENT' && file.clientId.toString() !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        file.notes = notes || '';
        file.lastModified = new Date();
        await file.save();

        res.json({
            message: 'Notes updated successfully',
            notes: file.notes
        });
    } catch (error) {
        console.error('Error updating notes:', error);
        res.status(500).json({ message: 'Error updating notes' });
    }
});

/**
 * Check for duplicate files
 * POST /api/files/check-duplicate
 */
router.post('/check-duplicate', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { clientId, fileName, year, category } = req.body;

        const existingFile = await File.findOne({
            clientId,
            fileName,
            year,
            category,
            isArchived: false
        });

        if (existingFile) {
            return res.json({
                isDuplicate: true,
                existingFile: {
                    _id: existingFile._id,
                    fileName: existingFile.fileName,
                    uploadedAt: existingFile.uploadedAt
                }
            });
        }

        res.json({ isDuplicate: false });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({ message: 'Error checking duplicate' });
    }
});

/**
 * Get all unique tags for a client
 * GET /api/files/client/:clientId/tags
 */
router.get('/client/:clientId/tags', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;

        // Check access
        if (req.user!.role === 'CLIENT' && clientId !== req.user!.clientId?.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const files = await File.find({ clientId, isArchived: false });
        const allTags = files.flatMap(file => file.tags || []);
        const uniqueTags = [...new Set(allTags)].sort();

        res.json(uniqueTags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ message: 'Error fetching tags' });
    }
});

export default router;

