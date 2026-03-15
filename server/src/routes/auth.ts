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

        // Find user by email (case-insensitive) OR username
        const normalizedUsername = username.trim();
        const query = {
            $or: [
                { username: normalizedUsername },
                { email: normalizedUsername.toLowerCase() }
            ]
        };

        // 1. First, check if it's a global user (SUPER_ADMIN)
        let user = await User.findOne({ ...query, firmId: null });

        // 2. If not found, and we are on a firm subdomain, look for user in that firm
        if (!user && req.firmId) {
            user = await User.findOne({ ...query, firmId: req.firmId });

            // Critical check: If user belongs to a firm, we MUST verify the firm is active
            if (user && req.firm) {
                if (req.firm.status !== 'active') {
                    res.status(403).json({ message: 'Firm account is suspended. Please contact support.' });
                    return;
                }
            }
        }

        // 3. Removed global fallback to enforce that firm users must login via their specific subdomains.
        // This ensures mycafile.in/login is only accessible to users with firmId: null (Super Admins).

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
            firmId: user.firmId,
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
                firmId: user.firmId?.toString(),
                clientId: user.clientId?.toString(),
                permissions: user.permissions
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        // Get user name and details
        let name = user.name || user.username;
        if (user.clientId && !user.name) {
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
