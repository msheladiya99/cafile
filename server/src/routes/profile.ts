import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { ActivityLog } from '../models/ActivityLog';
import { sendPasswordChangeEmail } from '../services/emailService';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        let user: any = await User.findOne({ _id: req.user!.userId, firmId: (req as any).firmId })
            .select('-passwordHash')
            .populate('clientId', 'name email phone');

        // Fallback for SuperAdmin model if not found in User collection
        if (!user && req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(req.user!.userId).select('-passwordHash');
            if (admin) {
                // Map to a common format
                user = {
                    _id: admin._id,
                    username: admin.email, // Use email as username for SuperAdmin model
                    email: admin.email,
                    name: admin.name,
                    role: 'SUPER_ADMIN',
                    createdAt: admin.createdAt
                };
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile (for all users)
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, username } = req.body;
        const userId = req.user!.userId;

        let user = await User.findOne({ _id: userId, firmId: (req as any).firmId });
        
        // Handle SuperAdmin model update if not found in User collection
        if (!user && req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(userId);
            if (admin) {
                if (name) admin.name = name;
                if (email) admin.email = email;
                await admin.save();

                await ActivityLog.create({
                    userId: admin._id,
                    action: 'PROFILE_UPDATE',
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    details: 'Super Admin profile information updated'
                });

                return res.json({
                    message: 'Profile updated successfully',
                    user: {
                        name: admin.name,
                        email: admin.email,
                        username: admin.email
                    }
                });
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Handle Username Update (Common for all)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            user.username = username;
        }

        // 2. Handle Role-Specific Updates
        if (user.role === 'CLIENT' && user.clientId) {
            // Update Client model for clients
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
            // Update User model for Admins/Staff
            if (name) user.name = name;
            if (email) user.email = email;
            if (phone) user.phone = phone;
        }

        await user.save();

        // Log activity
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

// Change password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.userId;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        let user = await User.findOne({ _id: userId, firmId: (req as any).firmId });

        // Fallback for SuperAdmin model
        if (!user && req.user!.role === 'SUPER_ADMIN') {
            const { SuperAdmin } = require('../models/SuperAdmin');
            const admin = await SuperAdmin.findById(userId);
            if (admin) {
                // Verify current password
                const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
                if (!isValidPassword) {
                    return res.status(401).json({ message: 'Current password is incorrect' });
                }

                // Hash new password
                const salt = await bcrypt.genSalt(10);
                const newPasswordHash = await bcrypt.hash(newPassword, salt);

                admin.passwordHash = newPasswordHash;
                await admin.save();

                // Log activity
                await ActivityLog.create({
                    userId: admin._id,
                    action: 'PASSWORD_CHANGE',
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    details: 'Super Admin password changed successfully'
                });

                // Send email
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
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        user.passwordHash = newPasswordHash;
        await user.save();

        // Log activity
        await ActivityLog.create({
            userId: user._id,
            action: 'PASSWORD_CHANGE',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            details: 'Password changed successfully'
        });

        // Send password change confirmation email
        try {
            let userEmail = user.email;
            let userName = user.name || user.username;

            // For CLIENT role, get email from Client model
            if (user.role === 'CLIENT' && user.clientId) {
                const client = await Client.findOne({ _id: user.clientId, firmId: (req as any).firmId });
                if (client) {
                    userEmail = client.email;
                    userName = client.name;
                }
            }

            if (userEmail) {
                // Send email in background without blocking the response
                sendPasswordChangeEmail({
                    userEmail,
                    userName,
                    username: user.username,
                    newPassword: newPassword
                }).catch(err => console.error('Background email error:', err));
            }
        } catch (emailError) {
            console.error('Failed to send password change email:', emailError);
            // Don't fail the password change if email fails
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get activity log
router.get('/activity-log', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = parseInt(req.query.skip as string) || 0;

        const activities = await ActivityLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await ActivityLog.countDocuments({ userId });

        res.json({
            activities,
            total,
            limit,
            skip
        });
    } catch (error) {
        console.error('Get activity log error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
