import { Router, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, userSchema } from '../models/User';
import { Client } from '../models/Client';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest, authenticate } from '../middleware/auth';
import { getModelFromConnection, rawUserSchema } from '../services/dbManager';

const router = Router();

// Login endpoint
router.post('/login', async (req, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        const { User: UserModel, Client, ActivityLog } = (req as any).models;


        // Find user by email (case-insensitive) OR username
        const normalizedUsername = username.trim();
        const query = {
            $or: [
                { username: normalizedUsername },
                { email: normalizedUsername.toLowerCase() }
            ]
        };

        // 1. First, check if it's a global user (SUPER_ADMIN)
        //    If on a firm subdomain, also resolve firm-scoped user in PARALLEL
        let user;
        if (req.firmId) {
            const [globalUser, firmUser] = await Promise.all([
                User.findOne({ ...query, firmId: null }).select('+passwordHash').lean(),
                UserModel.findOne({ ...query, firmId: req.firmId }).select('+passwordHash').lean()
            ]);
            user = globalUser || firmUser;

            // Critical check: If user belongs to a firm, verify the firm is active
            if (user && !globalUser && req.firm) {
                if (req.firm.status !== 'active') {
                    res.status(403).json({ message: 'Firm account is suspended. Please contact support.' });
                    return;
                }
            }
        } else {
            user = await User.findOne({ ...query, firmId: null }).select('+passwordHash').lean();
        }

        if (!user) {
            // Log failed login attempt (fire-and-forget)
            ActivityLog.create({
                userId: new mongoose.Types.ObjectId(),
                firmId: req.firmId,
                action: 'LOGIN_FAILURE',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                details: `Failed login attempt: Unknown username/email: ${normalizedUsername}`
            }).catch(() => {});
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            // Log failed login attempt (fire-and-forget)
            ActivityLog.create({
                userId: user._id,
                firmId: user.firmId,
                action: 'LOGIN_FAILURE',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                details: 'Failed login attempt: Incorrect password'
            }).catch(() => {});
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
                firmId: user.firmId?.toString(),
                clientId: user.clientId?.toString(),
                permissions: user.permissions
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Run lastLogin update, activity log, and client name fetch all in PARALLEL
        const [, , clientDoc] = await Promise.all([
            UserModel.updateOne({ _id: user._id }, { lastLogin: new Date() }),
            ActivityLog.create({
                userId: user._id,
                firmId: user.firmId,
                action: 'LOGIN',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                details: 'User logged in successfully'
            }),
            user.clientId ? Client.findById(user.clientId).select('name').lean() : Promise.resolve(null)
        ]);

        const name = clientDoc?.name || user.name || user.username;

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                firmId: user.firmId,
                clientId: user.clientId,
                permissions: user.permissions,
                name: name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user info (requires authentication)
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { User: UserModel, Client } = (req as any).models;

        const user = await UserModel.findById(req.user?.userId).select('-passwordHash').lean();
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let name = user.name || user.username;

        if (user.clientId) {
            const client = await Client.findById(user.clientId).select('name').lean();
            if (client) {
                name = client.name;
            }
        }

        res.json({
            ...user,
            _id: user._id.toString(),
            name,
            permissions: user.permissions || [],
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
