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
        const user = await User.findById(req.user!.userId)
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

// Update profile (for all users)
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, phone, username } = req.body;
        const userId = req.user!.userId;

        const user = await User.findById(userId);
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
            const client = await Client.findById(user.clientId);
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

        const user = await User.findById(userId);
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
                const client = await Client.findById(user.clientId);
                if (client) {
                    userEmail = client.email;
                    userName = client.name;
                }
            }

            if (userEmail) {
                await sendPasswordChangeEmail({
                    userEmail,
                    userName,
                    username: user.username,
                    newPassword: newPassword  // Include the new password
                });
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
