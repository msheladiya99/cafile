import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Firm } from '../models/Firm';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Task } from '../models/Task';
import Invoice from '../models/Invoice';
import { File } from '../models/File';
import { SuperAdmin } from '../models/SuperAdmin';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { getDriveService } from '../services/googleDrive';
import mongoose from 'mongoose';
import os from 'os';

const router = Router();

// Super Admin Login
router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        const admin = await SuperAdmin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: admin._id, role: 'SUPER_ADMIN' },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: 'SUPER_ADMIN'
            }
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Dashboard Summary & Charts
router.get('/dashboard', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const totalFirms = await Firm.countDocuments();
        const activeFirms = await Firm.countDocuments({ status: 'active' });
        const suspendedFirms = await Firm.countDocuments({ status: 'suspended' });
        const totalUsers = await User.countDocuments();
        const totalClients = await Client.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'DONE' });
        const totalInvoices = await Invoice.countDocuments();
        const totalFiles = await File.countDocuments();
        const totalStaff = await User.countDocuments({ role: { $ne: 'CLIENT' } });
        const storageUsage = `${(totalFiles * 0.5).toFixed(1)} MB`;

        console.log('SUPER_ADMIN_DASHBOARD', { totalFirms, totalUsers, totalClients });

        // Calculate actual revenue based on plans
        const firms = await Firm.find();
        const planPricing: Record<string, number> = {
            trial: 0,
            basic: 2000,
            professional: 5000,
            enterprise: 10000
        };
        const totalRevenue = firms.reduce((acc, f) => acc + (planPricing[f.plan] || 0), 0);

        // Firm Registrations Last 6 Months (Properly Grouped)
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                count: 0,
                revenue: 0,
                fullMonth: d.getMonth(),
                fullYear: d.getFullYear()
            };
        }).reverse();

        firms.forEach(firm => {
            if (!firm.createdAt) return;
            const firmDate = new Date(firm.createdAt);
            const item = last6Months.find(m =>
                m.fullMonth === firmDate.getMonth() &&
                m.fullYear === firmDate.getFullYear()
            );
            if (item) {
                item.count++;
                item.revenue += planPricing[firm.plan] || 0;
            }
        });

        const recentFirms = await Firm.find().sort({ createdAt: -1 }).limit(5).lean();

        res.json({
            widgets: {
                totalFirms, activeFirms, suspendedFirms, totalUsers, totalStaff, totalClients, totalTasks, totalInvoices, totalRevenue, storageUsage
            },
            recentFirms,
            charts: {
                firmRegistrations: last6Months,
                platformUsage: {
                    clients: totalClients,
                    files: totalFiles,
                    tasks: totalTasks
                },
                taskActivity: [
                    { name: 'Pending', value: totalTasks - completedTasks },
                    { name: 'Completed', value: completedTasks }
                ],
                plansDistribution: [
                    { name: 'Trial', value: await Firm.countDocuments({ plan: 'trial' }) },
                    { name: 'Basic', value: await Firm.countDocuments({ plan: 'basic' }) },
                    { name: 'Professional', value: await Firm.countDocuments({ plan: 'professional' }) },
                    { name: 'Enterprise', value: await Firm.countDocuments({ plan: 'enterprise' }) }
                ]
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all firms
router.get('/firms', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        console.log('GET_ALL_FIRMS_REQUEST');
        const firms = await Firm.find().sort({ createdAt: -1 }).lean();
        console.log(`Found ${firms.length} firms`);
        const enrichedFirms = await Promise.all(firms.map(async (f) => {
            const usersCount = await User.countDocuments({ firmId: f._id });
            const clientsCount = await Client.countDocuments({ firmId: f._id });
            return { ...f, usersCount, clientsCount };
        }));
        res.json(enrichedFirms);
    } catch (error) {
        console.error('Get firms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single firm
router.get('/firms/:id', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const firm = await Firm.findById(req.params.id);
        if (!firm) return res.status(404).json({ message: 'Firm not found' });
        const users = await User.find({ firmId: firm._id }).select('-passwordHash');
        const clientsCount = await Client.countDocuments({ firmId: firm._id });
        const tasksCount = await Task.countDocuments({ firmId: firm._id });
        res.json({ firm, users, stats: { clientsCount, tasksCount } });
    } catch (error) {
        console.error('Get firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/firms', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const { firmName, adminEmail, adminName, adminPassword, mobileNumber, planType } = req.body;
        let { subdomain } = req.body;

        // Auto-generate subdomain if not provided
        if (!subdomain) {
            const { slugify } = await import('../utils/slugify');
            subdomain = slugify(firmName);
        }

        // Ensure unique subdomain
        let finalSubdomain = subdomain;
        let counter = 1;
        while (await Firm.findOne({ subdomain: finalSubdomain })) {
            finalSubdomain = `${subdomain}${counter}`;
            counter++;
        }

        let googleDriveRootFolderId = '';
        try {
            const driveService = getDriveService();
            if (driveService) {
                // Requirement 6: Root folder CAFILES, firm inside it
                const caFilesRootId = await driveService.ensureFolder('CAFILES');
                googleDriveRootFolderId = await driveService.createFolder(firmName, caFilesRootId);
            }
        } catch (driveError) {
            console.warn('Skipping Google Drive folder creation:', (driveError as Error).message);
        }

        const firm = await Firm.create({
            firmName,
            subdomain: finalSubdomain,
            email: adminEmail,
            plan: planType?.toLowerCase() || 'trial',
            status: 'active',
            mobile: mobileNumber,
            googleDriveRootFolderId
        });

        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const user = await User.create({
            username: adminEmail,
            passwordHash,
            role: 'ADMIN',
            firmId: firm._id,
            email: adminEmail,
            name: adminName || `${firmName} Admin`
        });

        res.status(201).json({ firm, user });
    } catch (error) {
        console.error('Create firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Firm Admin Password
router.post('/firms/:id/reset-password', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: 'New password is required' });

        const firm = await Firm.findById(req.params.id);
        if (!firm) return res.status(404).json({ message: 'Firm not found' });

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update all ADMIN users for this firm
        await User.updateMany(
            { firmId: firm._id, role: 'ADMIN' },
            { passwordHash: hashedPassword }
        );

        res.json({ message: 'Firm admin password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Suspend/Activate/Update firm
router.patch('/firms/:id', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        if (req.body.plan) req.body.plan = req.body.plan.toLowerCase();
        const firm = await Firm.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!firm) return res.status(404).json({ message: 'Firm not found' });
        res.json(firm);
    } catch (error) {
        console.error('Update firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete firm
router.delete('/firms/:id', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const firm = await Firm.findByIdAndDelete(req.params.id);
        if (!firm) return res.status(404).json({ message: 'Firm not found' });
        res.json({ message: 'Firm deleted successfully' });
    } catch (error) {
        console.error('Delete firm error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Global Analytics
router.get('/analytics', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const totalClients = await Client.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'DONE' });
        const totalFiles = await File.countDocuments();

        const firms = await Firm.find();
        const planPricing: Record<string, number> = { trial: 0, basic: 2000, professional: 5000, enterprise: 10000 };
        const totalRevenue = firms.reduce((acc, f) => acc + (planPricing[f.plan] || 0), 0);

        // Historical Data (Last 6 Months)
        const history = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                fullMonth: d.getMonth(),
                fullYear: d.getFullYear(),
                clients: 0,
                revenue: 0,
                files: 0
            };
        }).reverse();

        // Clients per month
        const clients = await Client.find();
        clients.forEach(c => {
            if (!c.createdAt) return;
            const cDate = new Date(c.createdAt);
            const h = history.find(m => m.fullMonth === cDate.getMonth() && m.fullYear === cDate.getFullYear());
            if (h) h.clients++;
        });

        // Revenue per month
        firms.forEach(f => {
            if (!f.createdAt) return;
            const fDate = new Date(f.createdAt);
            const h = history.find(m => m.fullMonth === fDate.getMonth() && m.fullYear === fDate.getFullYear());
            if (h) h.revenue += (planPricing[f.plan] || 0);
        });

        // Files per month
        const files = await File.find();
        files.forEach((f: any) => {
            const date = f.createdAt || f.uploadedAt;
            if (!date) return;
            const fDate = new Date(date);
            const h = history.find(m => m.fullMonth === fDate.getMonth() && m.fullYear === fDate.getFullYear());
            if (h) h.files++;
        });

        res.json({
            metrics: {
                totalClients: clients.length,
                taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) + '%' : '0%',
                totalRevenue,
                totalFiles: files.length
            },
            history
        });
    } catch (error) {
        console.error('Get global analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// System Health
router.get('/system-health', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        const memoryUsage = process.memoryUsage();
        res.json({
            database: dbStatus,
            storageUsage: 'Dynamic',
            apiDelay: Math.floor(Math.random() * 50) + 10 + 'ms',
            memory: {
                rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                systemTotal: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                systemFree: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB'
            },
            uptime: process.uptime().toFixed(0) + 's',
            totalRequests: 'Tracked'
        });
    } catch (error) {
        console.error('System health error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
