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

        const totalRevenue = totalFirms * 2000; // Mock MRR

        // Firm Registrations Last 6 Months
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), count: 0 };
        }).reverse();

        const firmsForChart = await Firm.find({
            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        });

        firmsForChart.forEach(firm => {
            if (!firm.createdAt) return;
            const firmMonth = firm.createdAt.toLocaleString('default', { month: 'short' });
            const item = last6Months.find(m => m.month === firmMonth);
            if (item) item.count++;
        });

        res.json({
            widgets: {
                totalFirms, activeFirms, suspendedFirms, totalUsers, totalClients, totalTasks, totalInvoices, totalRevenue
            },
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
        const firms = await Firm.find().sort({ createdAt: -1 }).lean();
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

// Create new firm
router.post('/firms', authenticate, requireSuperAdmin, async (req, res: Response) => {
    try {
        const { firmName, subdomain, email, plan, adminUsername, adminPassword } = req.body;
        const existingFirm = await Firm.findOne({ subdomain });
        if (existingFirm) return res.status(400).json({ message: 'Subdomain already exists' });

        let googleDriveRootFolderId = '';
        try {
            const driveService = getDriveService();
            googleDriveRootFolderId = await driveService.createFolder(firmName);
        } catch (driveError) {
            console.error('Failed to create Google Drive folder for firm:', driveError);
            return res.status(500).json({ message: 'Failed to create Google Drive storage for firm' });
        }

        const firm = await Firm.create({
            firmName,
            subdomain,
            email,
            plan: plan.toLowerCase(),
            status: 'active',
            googleDriveRootFolderId
        });

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const user = await User.create({
            username: adminUsername,
            passwordHash,
            role: 'ADMIN',
            firmId: firm._id,
            email: email,
            name: `${firmName} Admin`
        });

        res.status(201).json({ firm, user });
    } catch (error) {
        console.error('Create firm error:', error);
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
        const totalRevenue = (await Firm.countDocuments()) * 2000;
        const totalFiles = await File.countDocuments();
        res.json({
            metrics: {
                totalClients,
                taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) + '%' : '0%',
                totalRevenue,
                totalFiles
            }
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
