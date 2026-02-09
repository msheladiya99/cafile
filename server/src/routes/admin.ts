import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { File } from '../models/File';
import { AuthRequest, authenticate, requireAdmin, requireStaff, requireRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { sendFileUploadEmail, sendWelcomeEmail } from '../services/emailService';
import fs from 'fs';
import path from 'path';

const router = Router();

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
        const { name, email, phone, panNumber, aadharNumber, gstNumber, username: customUsername } = req.body;

        if (!name || !email || !phone) {
            res.status(400).json({ message: 'Name, email, and phone are required' });
            return;
        }

        // Check if client already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            res.status(400).json({ message: 'Client with this email already exists' });
            return;
        }

        // Check if custom username is already taken
        if (customUsername) {
            const existingUser = await User.findOne({ username: customUsername });
            if (existingUser) {
                res.status(400).json({ message: 'Username is already taken' });
                return;
            }
        }

        // Create client
        const client = new Client({
            name,
            email,
            phone,
            panNumber,
            aadharNumber,
            gstNumber
        });
        await client.save();

        // Generate credentials
        const username = customUsername || generateUsername(name);
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const user = new User({
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

// Get all clients
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single client
router.get('/clients/:id', async (req: AuthRequest, res: Response) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }
        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
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
        const client = await Client.findById(clientId);
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
            uploadedBy: req.user!.userId
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
            .sort({ uploadedAt: -1 });

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

        const file = await File.findByIdAndUpdate(
            fileId,
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

        const file = await File.findById(fileId);
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete physical file
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // Delete database record
        await File.findByIdAndDelete(fileId);

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

        const file = await File.findById(fileId);
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

// Reset client password (Admin and Manager only)
router.post('/clients/:clientId/reset-password', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { clientId } = req.params;

        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) {
            res.status(404).json({ message: 'Client user not found' });
            return;
        }

        // Generate new password
        const newPassword = generatePassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.passwordHash = passwordHash;
        await user.save();

        res.json({
            username: user.username,
            password: newPassword,
            message: 'Password reset successfully'
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

        const client = await Client.findById(id);
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
        await Client.findByIdAndDelete(id);

        res.json({ message: 'Client and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
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

export default router;
