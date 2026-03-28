import { Router, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { File } from '../models/File';
import { ClientGroup } from '../models/ClientGroup';
import { ITStatus } from '../models/ITStatus';
import { SubMaster } from '../models/SubMaster';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest, authenticate, requireAdmin, requireStaff, requireRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { sendFileUploadEmail, sendWelcomeEmail, sendPasswordChangeEmail } from '../services/emailService';
import { Firm } from '../models/Firm';
import { getDriveService } from '../services/googleDrive';
import fs from 'fs';
import path from 'path';
import Reminder from '../models/Reminder';

const router = Router();

// Serve Profile Image for client (Public to allow <img> tags)
router.get('/clients/:id/profile-image/view', async (req: any, res: Response) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client || !client.profileImageUrl) {
            res.status(404).send('Not found');
            return;
        }

        let driveId = client.profileImageUrl;
        // Parse ID backwards if we stored directLink
        if (driveId.includes('id=')) {
            try {
                if (driveId.startsWith('http')) {
                    driveId = new URL(driveId).searchParams.get('id') || driveId;
                }
            } catch (err) {
                console.warn('Failed to parse profile image URL, using as is:', driveId);
            }
        }

        const driveService = getDriveService();
        const buffer = await driveService.downloadFile(driveId);

        let mimeType = 'image/jpeg';
        if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            mimeType = 'image/png';
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(buffer);
    } catch (e) {
        console.error('Proxy profile image error:', e);
        res.status(500).send('Error');
    }
});

// Most admin routes require authentication and staff role (ADMIN, MANAGER, STAFF, INTERN)
router.use(authenticate, requireStaff);

// Generate random password
const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Generate username from name
const generateUsername = (name: string): string => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
};

// Create client (Admin and Manager only)
router.post('/create-client', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const {
            name, email, phone, panNumber, aadharNumber, gstNumber, username: customUsername,
            clientCode, groupName, itStatus, masterType, subMaster, birthDate,
            address, country, state, city, postalCode, currency,
            incorporationDateFrom, incorporationDateTo, licenceNo, licenceAuthority,
            trnNo, description, supportEmployee, status, financialYear,
            altAddress, altPhoneM, altPhoneL, altFax,
            extraField1, extraField2, extraField3, extraField4, extraField5, extraField6, extraField7,
            multipleContacts, legalDocuments
        } = req.body;

        if (!name || !email || !phone) {
            res.status(400).json({ message: 'Name, email, and phone are required' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context required' });

        // Check if client already exists IN THIS FIRM
        const existingClient = await Client.findOne({ email, firmId });
        if (existingClient) {
            res.status(400).json({ message: 'Client with this email already exists in your firm' });
            return;
        }

        // Check if custom username is already taken (Usernames must be globally unique for login)
        if (customUsername) {
            const existingUser = await User.findOne({ username: customUsername });
            if (existingUser) {
                res.status(400).json({ message: 'Username is already taken' });
                return;
            }
        }

        // Check if client code is already taken IN THIS FIRM
        if (clientCode) {
            const existingClientCode = await Client.findOne({ clientCode, firmId });
            if (existingClientCode) {
                res.status(400).json({ message: 'Client Code is already in use' });
                return;
            }
        }

        // Enforce client limit
        const firm = await Firm.findById(firmId);
        const { Plan } = await import('../models/Plan');
        const plan = await Plan.findOne({ name: firm?.plan });
        const clientLimit = plan ? plan.clientLimit : 10;
        
        if (clientLimit > 0 && clientLimit < 99999) {
            const currentClientsCount = await Client.countDocuments({ firmId });
            if (currentClientsCount >= clientLimit) {
                res.status(400).json({ message: `Client limit reached for your ${plan?.displayName || firm?.plan} plan. Please upgrade to add more clients.` });
                return;
            }
        }

        // Create client
        const client = new Client({
            firmId,
            name, email, phone, panNumber, aadharNumber, gstNumber,
            clientCode, groupName: groupName || undefined, itStatus: itStatus || undefined,
            masterType, subMaster: subMaster || undefined,
            birthDate: birthDate || undefined,
            address, country, state, city, postalCode, currency,
            incorporationDateFrom: incorporationDateFrom || undefined,
            incorporationDateTo: incorporationDateTo || undefined,
            licenceNo, licenceAuthority,
            trnNo, description, supportEmployee: supportEmployee || undefined, status, financialYear,
            altAddress, altPhoneM, altPhoneL, altFax,
            extraField1, extraField2, extraField3, extraField4, extraField5, extraField6, extraField7,
            multipleContacts, legalDocuments
        });
        await client.save();
 
        // Create Google Drive folder structure immediately
        try {
            const driveService = getDriveService();
            try {
                const folderStructure = await driveService.createClientFolderStructure(client.name, client.panNumber);
                client.driveFolderId = folderStructure.clientFolderId;
                client.driveItrFolderId = folderStructure.itrFolderId;
                client.driveGstFolderId = folderStructure.gstFolderId;
                client.driveAccountingFolderId = folderStructure.accountingFolderId;
                client.driveDocumentsFolderId = folderStructure.documentsFolderId;
                client.driveNoticesFolderId = folderStructure.noticesFolderId;
                await client.save();
            } catch (driveErr: any) {
                // Handle Firm root repair
                const firmDoc = await Firm.findById(req.firmId);
                if (driveErr.response?.status === 404 && firmDoc?.googleDriveType === 'app') {
                    console.log('Firm root missing during client creation, repairing...');
                    const newFirmRootId = await driveService.ensureFirmStructure(firmDoc.firmName);
                    
                    firmDoc.googleDriveRootFolderId = newFirmRootId;
                    await firmDoc.save();
                    
                    driveService.setRootFolder(newFirmRootId);
                    const folderStructure = await driveService.createClientFolderStructure(client.name, client.panNumber);
                    client.driveFolderId = folderStructure.clientFolderId;
                    client.driveItrFolderId = folderStructure.itrFolderId;
                    client.driveGstFolderId = folderStructure.gstFolderId;
                    client.driveAccountingFolderId = folderStructure.accountingFolderId;
                    client.driveDocumentsFolderId = folderStructure.documentsFolderId;
                    client.driveNoticesFolderId = folderStructure.noticesFolderId;
                    await client.save();
                } else {
                    throw driveErr;
                }
            }
        } catch (finalErr) {
            console.error('Failed to create drive folders for new client:', finalErr);
        }

        // Generate credentials
        const username = customUsername || generateUsername(name);
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const user = new User({
            firmId,
            username,
            passwordHash,
            role: 'CLIENT',
            clientId: client._id
        });
        await user.save();

        // Send welcome email (async, don't wait for it)
        sendWelcomeEmail({
            clientEmail: client.email,
            clientName: client.name,
            username,
            password
        }).catch(err => console.error('Failed to send welcome email:', err));

        res.status(201).json({
            client,
            credentials: {
                username,
                password // Send plain password only once for admin to share with client
            }
        });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Bulk create clients (Admin and Manager only)
router.post('/bulk-create-clients', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { clients } = req.body;
        if (!Array.isArray(clients) || clients.length === 0) {
            res.status(400).json({ message: 'No clients provided' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) {
            res.status(400).json({ message: 'Firm context required' });
            return;
        }

        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        const firm = await Firm.findById(firmId);
        const { Plan } = await import('../models/Plan');
        const plan = await Plan.findOne({ name: firm?.plan });
        const clientLimit = plan ? plan.clientLimit : 10;
        let currentClientsCount = await Client.countDocuments({ firmId });

        for (let i = 0; i < clients.length; i++) {
            const clientData = clients[i];

            if (clientLimit > 0 && clientLimit < 99999 && currentClientsCount >= clientLimit) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Client limit reached for your ${plan?.displayName || firm?.plan} plan`);
                continue;
            }

            try {
                if (!clientData.name || !clientData.email || !clientData.phone) {
                    throw new Error(`Row ${i + 1}: Name, email, and phone are required for ${clientData.name || 'Unknown'}`);
                }

                const existingClient = await Client.findOne({ email: clientData.email, firmId });
                if (existingClient) {
                    throw new Error(`Row ${i + 1}: Client with email ${clientData.email} already exists`);
                }

                if (clientData.panNumber) {
                     const existingPan = await Client.findOne({ panNumber: clientData.panNumber, firmId });
                     if (existingPan) {
                          throw new Error(`Row ${i + 1}: Client with PAN ${clientData.panNumber} already exists`);
                     }
                }

                if (clientData.clientCode) {
                    const existingCode = await Client.findOne({ clientCode: clientData.clientCode, firmId });
                    if (existingCode) {
                        throw new Error(`Row ${i + 1}: Client Code ${clientData.clientCode} is already taken`);
                    }
                }

                let username = clientData.username;
                if (username) {
                    const existingUser = await User.findOne({ username });
                    if (existingUser) {
                        throw new Error(`Row ${i + 1}: Username ${username} is already taken`);
                    }
                } else {
                    username = generateUsername(clientData.name);
                }

                const client = new Client({
                    firmId,
                    ...clientData
                });
                await client.save();

                const password = generatePassword();
                const passwordHash = await bcrypt.hash(password, 10);

                const user = new User({
                    firmId,
                    username,
                    passwordHash,
                    role: 'CLIENT',
                    clientId: client._id
                });
                await user.save();

                // Create Google Drive folder structure
                try {
                    const driveService = getDriveService();
                    try {
                        const folderStructure = await driveService.createClientFolderStructure(client.name, client.panNumber);
                        client.driveFolderId = folderStructure.clientFolderId;
                        client.driveItrFolderId = folderStructure.itrFolderId;
                        client.driveGstFolderId = folderStructure.gstFolderId;
                        client.driveAccountingFolderId = folderStructure.accountingFolderId;
                        client.driveDocumentsFolderId = folderStructure.documentsFolderId;
                        client.driveNoticesFolderId = folderStructure.noticesFolderId;
                        await client.save();
                    } catch (driveErr: any) {
                        // Handle Firm root repair
                        const firmDoc = await Firm.findById(req.firmId);
                        if (driveErr.response?.status === 404 && firmDoc?.googleDriveType === 'app') {
                            const newFirmRootId = await driveService.ensureFirmStructure(firmDoc.firmName);
                            firmDoc.googleDriveRootFolderId = newFirmRootId;
                            await firmDoc.save();
                            
                            driveService.setRootFolder(newFirmRootId);
                            const folderStructure = await driveService.createClientFolderStructure(client.name, client.panNumber);
                            client.driveFolderId = folderStructure.clientFolderId;
                            client.driveItrFolderId = folderStructure.itrFolderId;
                            client.driveGstFolderId = folderStructure.gstFolderId;
                            client.driveAccountingFolderId = folderStructure.accountingFolderId;
                            client.driveDocumentsFolderId = folderStructure.documentsFolderId;
                            client.driveNoticesFolderId = folderStructure.noticesFolderId;
                            await client.save();
                        } else {
                            throw driveErr;
                        }
                    }
                } catch (finalErr) {
                    console.error('Failed to create drive folders for imported client:', finalErr);
                }

                // Send welcome email async
                sendWelcomeEmail({
                    clientEmail: client.email,
                    clientName: client.name,
                    username,
                    password
                }).catch(err => console.error('Failed to send welcome email in bulk:', err));

                currentClientsCount++;
                results.successful++;
            } catch (err: any) {
                results.failed++;
                results.errors.push(err.message || `Row ${i + 1}: Failed to import client ${clientData.name}`);
            }
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Bulk create clients error:', error);
        res.status(500).json({ message: 'Server error during bulk import' });
    }
});

// Get client count only (lightweight endpoint for dashboards)
router.get('/clients/count', async (req: AuthRequest, res: Response) => {
    try {
        const count = await Client.countDocuments({ firmId: req.firmId });
        res.set('Cache-Control', 'private, max-age=60'); // cache for 1 min
        res.json({ count });
    } catch (error) {
        console.error('Get client count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Single optimized Dashboard endpoint: returns multiple stats in parallel
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
    try {
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        const [clientCount, upcomingReminders] = await Promise.all([
            Client.countDocuments({ firmId: req.firmId }),
            Reminder.find({
                firmId: req.firmId,
                dueDate: { $gte: today, $lte: next30Days },
                status: 'PENDING'
            })
            .sort({ dueDate: 1 })
            .limit(10)
            .lean()
        ]);

        res.json({
            clientCount,
            reminders: upcomingReminders
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all clients
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        const clients = await Client.find({ firmId: req.firmId })
            .populate('groupName', 'groupName')
            .populate('itStatus', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Fetch usernames for these clients
        const clientIds = clients.map(c => c._id);
        const users = await User.find({ clientId: { $in: clientIds }, role: 'CLIENT' }).select('clientId username').lean();

        const usernameMap = users.reduce((acc: any, u: any) => {
            if (u.clientId) {
                acc[u.clientId.toString()] = u.username;
            }
            return acc;
        }, {} as Record<string, string>);

        const clientsWithUsername = clients.map(client => ({
            ...client,
            username: usernameMap[client._id.toString()] || ''
        }));

        res.set('Cache-Control', 'private, max-age=30'); // cache for 30s
        res.json(clientsWithUsername);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get single client
router.get('/clients/:id', async (req: AuthRequest, res: Response) => {
    try {
        const client = await Client.findOne({ _id: req.params.id, firmId: req.firmId })
            .populate('groupName', 'groupName')
            .populate('itStatus', 'name')
            .lean();
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Fetch associated username
        const user = await User.findOne({ clientId: client._id, role: 'CLIENT' }).select('username').lean();

        res.json({
            ...client,
            username: user?.username || ''
        });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client details (Admin, Manager, and Staff)
router.patch('/clients/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent updating sensitive fields directly
        delete updates.password;
        delete updates.createdAt;
        delete updates._id;

        const firmId = req.firmId || req.user?.firmId;

        // Check if clientCode is being updated and if it's already taken IN THIS FIRM
        if (updates.clientCode) {
            const existingClientCode = await Client.findOne({ _id: { $ne: id }, clientCode: updates.clientCode, firmId } as any);
            if (existingClientCode) {
                res.status(400).json({ message: 'Client Code is already in use' });
                return;
            }
        }

        // Fix Mongoose CastError by converting empty strings to null for ObjectId fields and Dates
        if (updates.groupName === '') updates.groupName = null;
        if (updates.itStatus === '') updates.itStatus = null;
        if (updates.supportEmployee === '') updates.supportEmployee = null;
        if (updates.subMaster === '') updates.subMaster = null;

        // Handle Date fields specifically so empty string translates to missing/unset
        if (updates.birthDate === '') updates.birthDate = null;
        if (updates.incorporationDateFrom === '') updates.incorporationDateFrom = null;
        if (updates.incorporationDateTo === '') updates.incorporationDateTo = null;

        const client = await Client.findOneAndUpdate(
            { _id: id, firmId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Profile Image for client
router.post('/clients/:id/profile-image', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('profileImage'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { id } = req.params;
        const client = await Client.findOne({ _id: id, firmId: req.firmId });

        if (!client) {
            fs.unlinkSync(req.file.path);
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Upload to Google Drive under client's "Documents" folder
        const driveService = getDriveService();

        // 1. Get/Create Client Home folder
        const { documentsFolderId } = await driveService.createClientFolderStructure(client.name, client.panNumber);

        // 3. Upload file to Documents folder
        const fileBuffer = fs.readFileSync(req.file.path);
        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            `profile_${client._id}_${req.file.originalname}`,
            req.file.mimetype,
            documentsFolderId
        );

        // 4. Delete local temporary file
        fs.unlinkSync(req.file.path);

        // 5. Make it shareable and get the link
        await driveService.createShareableLink(uploadResult.fileId);

        // Google Drive direct image display link
        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;

        // 6. Update Database
        client.profileImageUrl = directLink;
        await client.save();

        res.json({
            message: 'Profile image uploaded successfully',
            profileImageUrl: directLink
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error' });
    }
});


// Delete Profile Image for client
router.delete('/clients/:id/profile-image', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const client = await Client.findOne({ _id: id, firmId: req.firmId });

        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        if (client.profileImageUrl) {
            // Attempt to delete from Drive if we can extract ID
            try {
                const driveService = getDriveService();
                // Extract ID from https://drive.google.com/uc?export=view&id=ID
                const url = new URL(client.profileImageUrl);
                const fileId = url.searchParams.get('id');
                if (fileId) {
                    await driveService.deleteFile(fileId);
                }
            } catch (err) {
                console.error('Failed to delete profile image from drive:', err);
                // Continue anyway to clear DB
            }
        }

        client.profileImageUrl = undefined;
        await client.save();

        res.json({ message: 'Profile image removed successfully' });
    } catch (error) {
        console.error('Remove profile image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload file for client
router.post('/upload-file', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { clientId, year, category, fileName } = req.body;

        // Validate required fields (year is optional for USER_DOCS)
        if (!clientId || !category) {
            // Delete uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Client ID and category are required' });
            return;
        }

        // Year is required for all categories except USER_DOCS
        if (category !== 'USER_DOCS' && !year) {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Year is required for this category' });
            return;
        }

        // Verify client exists
        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) {
            fs.unlinkSync(req.file.path);
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Create file record
        const file = new File({
            clientId,
            year,
            category,
            fileName: fileName || req.file.originalname,
            originalFileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            uploadedBy: req.user!.userId,
            firmId: req.firmId || req.user?.firmId
        });
        await file.save();

        // Send email notification (async, don't wait for it)
        sendFileUploadEmail({
            clientEmail: client.email,
            clientName: client.name,
            fileName: fileName || req.file.originalname,
            category,
            year
        }).catch(err => console.error('Failed to send email notification:', err));

        res.status(201).json(file);
    } catch (error) {
        console.error('Upload file error:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Get files for a client
router.get('/files/:clientId', async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;
        const { year, category } = req.query;

        const query: any = { clientId };
        if (year) query.year = year;
        if (category) query.category = category;

        const files = await File.find(query)
            .populate('uploadedBy', 'username')
            .sort({ uploadedAt: -1 })
            .lean();

        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update file name
router.patch('/files/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { fileId } = req.params;
        const { fileName } = req.body;

        if (!fileName) {
            res.status(400).json({ message: 'File name is required' });
            return;
        }

        const file = await File.findOneAndUpdate(
            { _id: fileId, firmId: req.firmId },
            { fileName },
            { new: true }
        );

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.json(file);
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete file (Admin, Manager, and Staff only - No Interns)
router.delete('/files/:fileId', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { fileId } = req.params;

        const file = await File.findOne({ _id: fileId, firmId: req.firmId });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete physical file
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // Delete database record
        await File.findOneAndDelete({ _id: fileId, firmId: req.firmId });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all years for a client
router.get('/clients/:clientId/years', async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;

        const years = await File.distinct('year', { clientId });
        res.json(years.sort().reverse());
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file (for preview and download)
router.get('/download/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { fileId } = req.params;

        const file = await File.findOne({ _id: fileId, firmId: req.firmId });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Check if file exists
        if (!fs.existsSync(file.filePath)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }

        // Get file extension
        const ext = path.extname(file.originalFileName).toLowerCase();

        // Set content type based on file extension
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') {
            contentType = 'application/pdf';
        } else if (ext === '.xlsx' || ext === '.xls') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (ext === '.docx' || ext === '.doc') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        // Set headers for proper download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

        // Send file
        res.sendFile(path.resolve(file.filePath));
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client credentials (username only, password cannot be retrieved)
router.get('/clients/:clientId/credentials', async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;

        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) {
            res.status(404).json({ message: 'Client user not found' });
            return;
        }

        res.json({
            username: user.username,
            note: 'Password is encrypted and cannot be retrieved. Use reset password to generate a new one.'
        });
    } catch (error) {
        console.error('Get credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send credentials via email
router.post('/clients/:clientId/send-credentials', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;
        const { password } = req.body; // Admin provides the password (from reset or recent creation)

        if (!password) {
            return res.status(400).json({ message: 'Password is required to send credentials email' });
        }

        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) return res.status(404).json({ message: 'Client not found' });

        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) return res.status(404).json({ message: 'Client user not found' });

        await sendWelcomeEmail({
            clientEmail: client.email,
            clientName: client.name,
            username: user.username,
            password: password
        });

        res.json({ message: 'Credentials sent successfully' });
    } catch (error) {
        console.error('Send credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset client password (Admin and Manager only)
router.post('/clients/:clientId/reset-password', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;

        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) {
            res.status(404).json({ message: 'Client user not found' });
            return;
        }

        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Generate new password
        const newPassword = generatePassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.passwordHash = passwordHash;
        await user.save();

        // Send email with new password
        await sendPasswordChangeEmail({
            userEmail: client.email,
            userName: client.name,
            username: user.username,
            newPassword: newPassword
        });

        res.json({
            username: user.username,
            password: newPassword,
            message: 'Password reset and email sent successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client (Admin only)
router.delete('/clients/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const client = await Client.findOne({ _id: id, firmId: req.firmId });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Delete client's user account
        await User.findOneAndDelete({ clientId: id });

        // Get all client files
        const files = await File.find({ clientId: id });

        // Delete physical local files
        for (const file of files) {
            if (file.storedIn === 'local' && file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (e) {
                    console.error(`Failed to delete file ${file.filePath}:`, e);
                }
            }
        }

        // Delete file records from database
        await File.deleteMany({ clientId: id });

        // Delete client record
        await Client.findOneAndDelete({ _id: id, firmId: req.firmId });

        res.json({ message: 'Client and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk Delete clients (Admin only)
router.post('/clients/bulk-delete', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { clientIds } = req.body;
        if (!Array.isArray(clientIds) || clientIds.length === 0) {
            res.status(400).json({ message: 'No clients selected' });
            return;
        }

        // Delete users
        await User.deleteMany({ clientId: { $in: clientIds } });

        // Get all files for these clients
        const files = await File.find({ clientId: { $in: clientIds } });
        
        // Delete physical local files
        for (const file of files) {
            if (file.storedIn === 'local' && file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (e) {
                    console.error(`Failed to delete file ${file.filePath}:`, e);
                }
            }
        }

        // Delete file records
        await File.deleteMany({ clientId: { $in: clientIds } });

        // Delete client records
        await Client.deleteMany({ _id: { $in: clientIds } });

        res.json({ message: `${clientIds.length} clients deleted successfully` });
    } catch (error) {
        console.error('Bulk delete clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Migration: Update lastLogin for all users (Admin only)
router.post('/migrate-lastlogin', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const result = await User.updateMany(
            { lastLogin: null },
            { $set: { lastLogin: new Date() } }
        );

        res.json({
            message: 'Migration completed',
            updated: result.modifiedCount
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all staff users (Admin and Manager only)
router.get('/users', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;
        const users = await User.find({ role: { $ne: 'CLIENT' }, firmId })
            .select('_id username name email role')
            .sort({ name: 1 })
            .lean();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee login logs
router.get('/employee/login-logs', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId, startDate, endDate } = req.query;

        // Find staff members (non-clients)
        const query: any = { role: { $ne: 'CLIENT' } };
        if (userId) {
            query._id = userId;
        }

        const staffUsers = await User.find(query).select('_id name username role').lean();
        const staffIds = staffUsers.map(u => u._id);

        const filter: any = {
            action: 'LOGIN',
            userId: { $in: staffIds },
            firmId: req.firmId
        };

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                const sDate = new Date(startDate as string);
                sDate.setHours(0, 0, 0, 0);
                filter.timestamp.$gte = sDate;
            }
            if (endDate) {
                const eDate = new Date(endDate as string);
                eDate.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = eDate;
            }
        }
        const logs = await ActivityLog.find(filter)
            .populate('userId', 'name username role')
            .sort({ timestamp: -1 })
            .lean();

        res.json(logs);
    } catch (error) {
        console.error('Fetch login logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get free employee list
router.get('/employee/free-list', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        // Find tasks that are not DONE or CANCELLED
        const { Task } = await import('../models/Task');
        const activeTasks = await Task.find({ status: { $in: ['PENDING', 'STARTED', 'UNDER_REVIEW'] }, firmId: req.firmId });

        let busyUserIds: any[] = [];
        activeTasks.forEach(task => {
            if (task.assignedTo && Array.isArray(task.assignedTo)) {
                busyUserIds.push(...task.assignedTo);
            }
        });

        // Find users that are not busy
        const freeEmployees = await User.find({
            _id: { $nin: busyUserIds },
            firmId: req.firmId,
            role: { $in: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'] }
        }).select('_id name username role email phone').lean();

        res.json(freeEmployees);
    } catch (error) {
        console.error('Fetch free employee list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// -- Client Group Routes --

// Create Client Group (Admin and Manager only)
router.post('/client-groups', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { groupName, address, description, status, email, mobileNumber, gstin } = req.body;

        if (!groupName || !email || !mobileNumber) {
            res.status(400).json({ message: 'Group Name, Email, and Mobile Number are required.' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        const existingGroup = await ClientGroup.findOne({ groupName, firmId });
        if (existingGroup) {
            res.status(400).json({ message: 'Group with this name already exists' });
            return;
        }

        const newGroup = new ClientGroup({
            groupName,
            address,
            description,
            status,
            email,
            mobileNumber,
            gstin,
            firmId
        });
        await newGroup.save();

        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Create client group error:', error);
        res.status(500).json({ message: 'Server error during client group creation', error: error instanceof Error ? error.message : String(error) });
    }
});

// Get all Client Groups
router.get('/client-groups', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;
        const groups = await ClientGroup.find({ firmId })
            .sort({ createdAt: -1 })
            .lean();
        res.json(groups);
    } catch (error) {
        console.error('Get client groups error:', error);
        res.status(500).json({ message: 'Server error fetching client groups' });
    }
});

// Delete Client Group (Admin and Manager only)
router.delete('/client-groups/:id', authenticate, requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const firmId = req.firmId || req.user?.firmId;

        const group = await ClientGroup.findOne({ _id: id, firmId });
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        // Check if group is being used by any clients
        const clientCount = await Client.countDocuments({ groupName: id });
        if (clientCount > 0) {
            res.status(400).json({ message: `Cannot delete group: ${clientCount} clients belong to this group.` });
            return;
        }

        await ClientGroup.findOneAndDelete({ _id: id, firmId });
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete client group error:', error);
        res.status(500).json({ message: 'Server error during client group deletion' });
    }
});

// Update Client Group (Admin, Manager, and Staff)
router.patch('/client-groups/:id', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const firmId = req.firmId || req.user?.firmId;

        // Prevent updating firmId
        delete updates.firmId;
        delete updates._id;

        const group = await ClientGroup.findOneAndUpdate(
            { _id: id, firmId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        res.json(group);
    } catch (error) {
        console.error('Update client group error:', error);
        res.status(500).json({ message: 'Server error during client group update' });
    }
});

router.post('/it-status', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, status } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const queryFirmId = new mongoose.Types.ObjectId(firmId);

        const existing = await ITStatus.findOne({ name, firmId: queryFirmId });
        if (existing) return res.status(400).json({ message: 'IT Status with this name already exists' });

        const item = new ITStatus({
            name,
            description,
            status,
            firmId: queryFirmId
        });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Create IT Status error:', error);
        res.status(500).json({
            message: 'Server error during IT Status creation',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Update IT Status
router.patch('/it-status/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;
        const firmId = req.firmId || req.user?.firmId;

        const item = await ITStatus.findOneAndUpdate(
            { _id: id, firmId },
            { $set: { name, description, status } },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: 'IT Status not found' });
        res.json(item);
    } catch (error) {
        console.error('Update IT Status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete IT Status
router.delete('/it-status/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const firmId = req.firmId || req.user?.firmId;

        const item = await ITStatus.findOneAndDelete({ _id: id, firmId });
        if (!item) return res.status(404).json({ message: 'IT Status not found' });
        res.json({ message: 'IT Status deleted successfully' });
    } catch (error) {
        console.error('Delete IT Status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/it-status', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const items = await ITStatus.find({ firmId: new mongoose.Types.ObjectId(firmId) }).sort({ name: 1 }).lean();
        res.json(items);
    } catch (error) {
        console.error('Get IT Status error:', error);
        res.status(500).json({
            message: 'Server error fetching IT Status',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// -- Sub Master Routes --
router.post('/sub-master', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, status } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const queryFirmId = new mongoose.Types.ObjectId(firmId);

        const existing = await SubMaster.findOne({ name, firmId: queryFirmId });
        if (existing) return res.status(400).json({ message: 'Sub Master with this name already exists' });

        const item = new SubMaster({
            name,
            description,
            status,
            firmId: queryFirmId
        });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Create Sub Master error:', error);
        res.status(500).json({
            message: 'Server error during Sub Master creation',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Update Sub Master
router.patch('/sub-master/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;
        const firmId = req.firmId || req.user?.firmId;

        const item = await SubMaster.findOneAndUpdate(
            { _id: id, firmId },
            { $set: { name, description, status } },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: 'Sub Master not found' });
        res.json(item);
    } catch (error) {
        console.error('Update Sub Master error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Sub Master
router.delete('/sub-master/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const firmId = req.firmId || req.user?.firmId;

        const item = await SubMaster.findOneAndDelete({ _id: id, firmId });
        if (!item) return res.status(404).json({ message: 'Sub Master not found' });
        res.json({ message: 'Sub Master deleted successfully' });
    } catch (error) {
        console.error('Delete Sub Master error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/sub-master', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const items = await SubMaster.find({ firmId: new mongoose.Types.ObjectId(firmId) }).sort({ name: 1 }).lean();
        res.json(items);
    } catch (error) {
        console.error('Get Sub Master error:', error);
        res.status(500).json({
            message: 'Server error fetching Sub Master',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;
