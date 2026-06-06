import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendPasswordChangeEmail } from '../services/emailService';

const router = express.Router();

// ── GET /profile ─────────────────────────────────────────────────────────────
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Super Admin fast path — Super Admin has no firmId, stored in separate model.
        // Bypassing the tenant User model prevents "Firm not found" error on live.
        if (req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(req.user!.userId).select('-passwordHash');
            if (!admin) return res.status(404).json({ message: 'Super Admin not found' });
            return res.json({
                _id: admin._id,
                username: admin.email,
                email: admin.email,
                name: admin.name,
                role: 'SUPER_ADMIN',
                createdAt: admin.createdAt
            });
        }

        // Regular tenant user
        const { User } = (req as any).models;
        const user = await User.findOne({ _id: req.user!.userId, firmId: (req as any).firmId })
            .select('-passwordHash')
            .populate('clientId', 'name email phone');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── PUT /profile ──────────────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, username } = req.body;
        const userId = req.user!.userId;

        // Super Admin fast path
        if (req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(userId);
            if (!admin) return res.status(404).json({ message: 'Super Admin not found' });

            if (name) admin.name = name;
            if (email) admin.email = email;
            await admin.save();

            // Use global ActivityLog model (not tenant-scoped)
            const { ActivityLog } = require('../models/ActivityLog');
            await ActivityLog.create({
                userId: admin._id,
                action: 'PROFILE_UPDATE',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                details: 'Super Admin profile information updated'
            });

            return res.json({
                message: 'Profile updated successfully',
                user: { name: admin.name, email: admin.email, username: admin.email }
            });
        }

        // Regular tenant user
        const { User, Client, ActivityLog } = (req as any).models;
        let user = await User.findOne({ _id: userId, firmId: (req as any).firmId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Handle Username Update
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username;
        }

        // 2. Handle Role-Specific Updates
        if (user.role === 'CLIENT' && user.clientId) {
            const client = await Client.findOne({ _id: user.clientId, firmId: (req as any).firmId });
            if (client) {
                if (email && email !== client.email) {
                    const existingClient = await Client.findOne({ email, _id: { $ne: client._id } });
                    if (existingClient) {
                        return res.status(400).json({ message: 'Email already in use' });
                    }
                    client.email = email;
                }
                if (name) client.name = name;
                if (phone) client.phone = phone;
                await client.save();
            }
        } else {
            if (name) user.name = name;
            if (email) user.email = email;
            if (phone) user.phone = phone;
        }

        await user.save();

        await ActivityLog.create({
            userId: user._id,
            action: 'PROFILE_UPDATE',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            details: 'Profile information updated'
        });

        res.json({
            message: 'Profile updated successfully',
            user: {
                username: user.username,
                name: user.role === 'CLIENT' ? undefined : user.name,
                email: user.role === 'CLIENT' ? undefined : user.email,
                phone: user.role === 'CLIENT' ? undefined : user.phone
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── POST /change-password ─────────────────────────────────────────────────────
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Super Admin fast path
        if (req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(userId);
            if (!admin) return res.status(404).json({ message: 'Super Admin not found' });

            const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            admin.passwordHash = await bcrypt.hash(newPassword, salt);
            await admin.save();

            const { ActivityLog } = require('../models/ActivityLog');
            await ActivityLog.create({
                userId: admin._id,
                action: 'PASSWORD_CHANGE',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                details: 'Super Admin password changed successfully'
            });

            if (admin.email) {
                sendPasswordChangeEmail({
                    userEmail: admin.email,
                    userName: admin.name,
                    username: admin.email,
                    newPassword: newPassword
                }).catch(err => console.error('Background email error:', err));
            }

            return res.json({ message: 'Password changed successfully' });
        }

        // Regular tenant user
        const { User, Client, ActivityLog } = (req as any).models;
        let user = await User.findOne({ _id: userId, firmId: (req as any).firmId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        await ActivityLog.create({
            userId: user._id,
            action: 'PASSWORD_CHANGE',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            details: 'Password changed successfully'
        });

        try {
            let userEmail = user.email;
            let userName = user.name || user.username;

            if (user.role === 'CLIENT' && user.clientId) {
                const client = await Client.findOne({ _id: user.clientId, firmId: (req as any).firmId });
                if (client) {
                    userEmail = client.email;
                    userName = client.name;
                }
            }

            if (userEmail) {
                sendPasswordChangeEmail({
                    userEmail,
                    userName,
                    username: user.username,
                    newPassword: newPassword
                }).catch(err => console.error('Background email error:', err));
            }
        } catch (emailError) {
            console.error('Failed to send password change email:', emailError);
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ── GET /activity-log ─────────────────────────────────────────────────────────
router.get('/activity-log', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { ActivityLog } = (req as any).models;
        const userId = req.user!.userId;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = parseInt(req.query.skip as string) || 0;

        const activities = await ActivityLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await ActivityLog.countDocuments({ userId });

        res.json({ activities, total, limit, skip });
    } catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
