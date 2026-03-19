import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { User } from '../models/User';
import { Firm } from '../models/Firm';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { getDriveService } from '../services/googleDrive';
import { sendEmployeeWelcomeEmail, sendEmployeePasswordResetEmail } from '../services/emailService';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// All staff management routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Upload staff document to Google Drive
router.post('/upload-document', upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const { employeeName } = req.body;
        const uploadedFile = req.file;

        console.log('--- Staff Document Upload Start ---');
        console.log('Employee Name:', employeeName);
        console.log('File:', uploadedFile ? {
            name: uploadedFile.originalname,
            type: uploadedFile.mimetype,
            size: uploadedFile.size
        } : 'No File');

        if (!uploadedFile) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const driveService = getDriveService();

        // Create employee folder structure
        console.log('Ensuring folder structure for:', employeeName);
        const folderId = await driveService.createEmployeeFolderStructure(employeeName || 'Unknown Employee');
        console.log('Folder ID:', folderId);

        // Upload file
        console.log('Uploading to Drive...');
        const driveFile = await driveService.uploadFile(
            uploadedFile.buffer,
            uploadedFile.originalname,
            uploadedFile.mimetype,
            folderId
        );
        console.log('Upload success:', driveFile.fileId);

        res.json({
            message: 'File uploaded to Google Drive successfully',
            fileName: uploadedFile.originalname,
            driveFileId: driveFile.fileId,
            driveWebViewLink: driveFile.webViewLink,
        });
    } catch (error: any) {
        console.error('Staff document upload error:', error);
        res.status(500).json({
            message: 'Error uploading document to Google Drive',
            error: error.message
        });
    }
});

// Delete staff document from Google Drive
router.delete('/delete-document/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { fileId } = req.params;
        const driveService = getDriveService();
        await driveService.deleteFile(fileId as string);
        res.json({ message: 'Document deleted from Google Drive successfully' });
    } catch (error: any) {
        console.error('Staff document delete error:', error);
        res.status(500).json({
            message: 'Error deleting document from Google Drive',
            error: error.message
        });
    }
});

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

// Create staff member
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const {
            firstName, lastName, email, phone, role, permissions,
            employeeCode, address, country, state, city, postalCode,
            mobileNumber, birthDate, designation, joiningDate, monthlySalary,
            ratePerHours, leavingDate, reference, description, status,
            emergencyFirstName, emergencyLastName, emergencyRelationship, emergencyPhone,
            field1, field2, field3, field4, field5, field6, field7,
            documents, username: reqUsername, password: reqPassword,
            pfNumber, esiNumber, aadharNumber, drivingLicenceNo,
            passport, passportNo, passportAuthority, passportDateFrom, passportDateTo,
            visa, visaNo, visaAuthority, visaDateFrom, visaDateTo,
            eid, eidNo, eidAuthority, eidDateFrom, eidDateTo,
            bankName, bankBranch, accountNo, accountHolderName, ifscCode, bankAddress
        } = req.body;

        if (!firstName || !lastName || !email) {
            res.status(400).json({ message: 'First Name, Last Name, and Email are required' });
            return;
        }

        const validStaffRoles = ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'];
        const actualRole = role || 'STAFF';
        if (!validStaffRoles.includes(actualRole)) {
            res.status(400).json({ message: 'Invalid staff role' });
            return;
        }

        // Check availability
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }

        // Enforce maxAdmins limit if creating an ADMIN
        if (actualRole === 'ADMIN') {
            const firm = await Firm.findById(req.firmId);
            if (!firm) {
                res.status(404).json({ message: 'Firm not found' });
                return;
            }

            const currentAdminsCount = await User.countDocuments({
                firmId: req.firmId,
                role: 'ADMIN'
            });

            if (currentAdminsCount >= (firm.maxAdmins || 5)) {
                res.status(400).json({
                    message: `Cannot create more admins. This firm is limited to ${firm.maxAdmins || 5} admins.`
                });
                return;
            }
        }

        // Generate credentials if not provided
        const name = `${firstName} ${lastName}`.trim();
        const finalUsername = reqUsername || generateUsername(firstName);
        const finalPassword = reqPassword || generatePassword();
        const passwordHash = await bcrypt.hash(finalPassword, 10);

        // Create user account
        const user = new User({
            username: finalUsername,
            name,
            email,
            phone: phone || mobileNumber,
            passwordHash,
            role: actualRole,
            permissions: permissions || [],
            status: status !== undefined ? status : true,
            // Employee profile fields
            firstName, lastName,
            employeeCode, address, country, state, city, postalCode,
            mobileNumber, birthDate, designation, joiningDate, monthlySalary,
            ratePerHours, leavingDate, reference, description,
            emergencyFirstName, emergencyLastName, emergencyRelationship, emergencyPhone,
            field1, field2, field3, field4, field5, field6, field7, documents,
            pfNumber, esiNumber, aadharNumber, drivingLicenceNo,
            passport, passportNo, passportAuthority, passportDateFrom, passportDateTo,
            visa, visaNo, visaAuthority, visaDateFrom, visaDateTo,
            eid, eidNo, eidAuthority, eidDateFrom, eidDateTo,
            bankName, bankBranch, accountNo, accountHolderName, ifscCode, bankAddress,
            firmId: req.firmId
        });
        await user.save();

        // Send welcome email with credentials (async, non-blocking)
        if (email) {
            sendEmployeeWelcomeEmail({
                employeeEmail: email,
                employeeName: name,
                username: finalUsername,
                password: finalPassword,
                role: actualRole,
            }).catch(err => console.error('Failed to send employee welcome email:', err));
        }

        res.status(201).json({
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt
            },
            credentials: {
                username: finalUsername,
                password: finalPassword
            }
        });
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all staff members
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const staff = await User.find({
            firmId: req.firmId,
            role: { $in: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'] }
        }).select('-passwordHash').sort({ createdAt: -1 }).lean();

        res.json(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get staff member by id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const staff = await User.findById(req.params.id).select('-passwordHash').lean();
        if (!staff) {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }
        res.json(staff);
    } catch (error) {
        console.error('Get staff by id error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset staff password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }

        // Prevent password reset for CLIENT and ADMIN users
        if (user.role === 'CLIENT') {
            res.status(400).json({ message: 'Cannot reset password for client users from staff management' });
            return;
        }

        if (user.role === 'ADMIN') {
            res.status(403).json({ message: 'Cannot reset admin password for security reasons' });
            return;
        }

        const newPassword = generatePassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = passwordHash;
        await user.save();

        // Send password reset email (async, non-blocking)
        if (user.email) {
            sendEmployeePasswordResetEmail({
                employeeEmail: user.email,
                employeeName: user.name || user.username,
                username: user.username,
                newPassword,
            }).catch(err => console.error('Failed to send employee password reset email:', err));
        }

        res.json({
            username: user.username,
            password: newPassword,
            message: 'Password reset successfully. Email sent to employee.'
        });
    } catch (error) {
        console.error('Reset staff password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update staff member
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const {
            firstName, lastName, email, phone, role, permissions,
            employeeCode, address, country, state, city, postalCode,
            mobileNumber, birthDate, designation, joiningDate, monthlySalary,
            ratePerHours, leavingDate, reference, description, status,
            emergencyFirstName, emergencyLastName, emergencyRelationship, emergencyPhone,
            field1, field2, field3, field4, field5, field6, field7,
            documents, username: reqUsername, password: reqPassword,
            pfNumber, esiNumber, aadharNumber, drivingLicenceNo,
            passport, passportNo, passportAuthority, passportDateFrom, passportDateTo,
            visa, visaNo, visaAuthority, visaDateFrom, visaDateTo,
            eid, eidNo, eidAuthority, eidDateFrom, eidDateTo,
            bankName, bankBranch, accountNo, accountHolderName, ifscCode, bankAddress
        } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }

        // Prevent updating CLIENT users from staff management
        if (user.role === 'CLIENT') {
            res.status(400).json({ message: 'Cannot update client users from staff management' });
            return;
        }

        if (role) {
            const validStaffRoles = ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'];
            if (!validStaffRoles.includes(role)) {
                res.status(400).json({ message: 'Invalid staff role' });
                return;
            }
            user.role = role;
        }

        if (permissions && Array.isArray(permissions)) {
            user.permissions = permissions;
        }

        if (firstName || lastName) {
            user.firstName = firstName !== undefined ? firstName : user.firstName;
            user.lastName = lastName !== undefined ? lastName : user.lastName;
            user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }

        if (email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id as any } });
            if (existingEmail) {
                res.status(400).json({ message: 'Email already exists' });
                return;
            }
            user.email = email;
        }

        const updatableFields = [
            'employeeCode', 'address', 'country', 'state', 'city', 'postalCode',
            'phone', 'mobileNumber', 'birthDate', 'designation', 'joiningDate', 'monthlySalary',
            'ratePerHours', 'leavingDate', 'reference', 'description', 'status',
            'emergencyFirstName', 'emergencyLastName', 'emergencyRelationship', 'emergencyPhone',
            'field1', 'field2', 'field3', 'field4', 'field5', 'field6', 'field7', 'documents',
            'pfNumber', 'esiNumber', 'aadharNumber', 'drivingLicenceNo',
            'passport', 'passportNo', 'passportAuthority', 'passportDateFrom', 'passportDateTo',
            'visa', 'visaNo', 'visaAuthority', 'visaDateFrom', 'visaDateTo',
            'eid', 'eidNo', 'eidAuthority', 'eidDateFrom', 'eidDateTo',
            'bankName', 'bankBranch', 'accountNo', 'accountHolderName', 'ifscCode', 'bankAddress'
        ];

        for (const field of updatableFields) {
            if (req.body[field] !== undefined) {
                (user as any)[field] = req.body[field];
            }
        }

        if (reqUsername) user.username = reqUsername;
        // Only update password if provided manually through UI
        if (reqPassword) {
            const bcrypt = require('bcryptjs');
            user.passwordHash = await bcrypt.hash(reqPassword, 10);
        }

        await user.save();

        res.json({
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                permissions: user.permissions,
                createdAt: user.createdAt
            },
            message: 'Staff updated successfully'
        });
    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete staff member
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }

        // Prevent deletion of CLIENT and ADMIN users
        if (user.role === 'CLIENT') {
            res.status(400).json({ message: 'Cannot delete client users from staff management' });
            return;
        }

        if (user.role === 'ADMIN') {
            res.status(403).json({ message: 'Cannot delete admin users for security reasons' });
            return;
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
