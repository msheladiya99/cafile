import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All staff management routes require authentication and admin role
router.use(authenticate, requireAdmin);

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
        const { firstName, lastName, email, phone, role, permissions } = req.body;

        if (!firstName || !lastName || !email || !phone || !role) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const validStaffRoles = ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'];
        if (!validStaffRoles.includes(role)) {
            res.status(400).json({ message: 'Invalid staff role' });
            return;
        }

        // Check availability
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            res.status(400).json({ message: 'Email already exists' });
            return;
        }

        // Generate credentials
        const name = `${firstName} ${lastName}`.trim();
        const username = generateUsername(firstName); // using firstName for username base
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const user = new User({
            username,
            name,
            email,
            phone,
            passwordHash,
            role: role,
            permissions: permissions || []
        });
        await user.save();

        res.status(201).json({
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt
            },
            credentials: {
                username,
                password
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
            role: { $in: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'] }
        }).select('-passwordHash').sort({ createdAt: -1 });

        res.json(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset staff password
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role === 'CLIENT' || user.role === 'ADMIN') {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }

        const newPassword = generatePassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        user.passwordHash = passwordHash;
        await user.save();

        res.json({
            username: user.username,
            password: newPassword,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset staff password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update staff member
router.patch('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { role, permissions } = req.body;

        const user = await User.findById(req.params.id);
        if (!user || user.role === 'CLIENT' || user.role === 'ADMIN') {
            res.status(404).json({ message: 'Staff member not found' });
            return;
        }

        if (role) {
            const validStaffRoles = ['MANAGER', 'STAFF', 'INTERN'];
            if (!validStaffRoles.includes(role)) {
                res.status(400).json({ message: 'Invalid staff role' });
                return;
            }
            user.role = role;
        }

        if (permissions && Array.isArray(permissions)) {
            user.permissions = permissions;
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
        if (!user || user.role === 'CLIENT' || user.role === 'ADMIN') {
            res.status(404).json({ message: 'Staff member not found' });
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
