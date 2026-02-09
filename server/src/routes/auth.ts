import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post('/login', async (req, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Log login activity
        await ActivityLog.create({
            userId: user._id,
            action: 'LOGIN',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            details: 'User logged in successfully'
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
                clientId: user.clientId?.toString(),
                permissions: user.permissions
            },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        // Get user name (from Client if applicable, otherwise username)
        let name = user.username;
        if (user.clientId) {
            const client = await Client.findById(user.clientId);
            if (client) {
                name = client.name;
            }
        }

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name,
                role: user.role,
                clientId: user.clientId,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user info
router.get('/me', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.userId).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userObj = user.toObject();
        let name = user.username;

        if (user.clientId) {
            const client = await Client.findById(user.clientId);
            if (client) {
                name = client.name;
            }
        }

        res.json({ ...userObj, name });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
