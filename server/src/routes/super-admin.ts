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
import { ActivityLog } from '../models/ActivityLog';
import { Plan } from '../models/Plan';
import { TaskCategory } from '../models/TaskCategory';
import { TaskMaster } from '../models/TaskMaster';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { getDriveService } from '../services/googleDrive';
import { encrypt } from '../utils/encryption';
import { getTenantConnection, getModelFromConnection, rawUserSchema } from '../services/dbManager';
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

        // Log login activity
        await ActivityLog.create({
            userId: admin._id,
            action: 'LOGIN',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            details: 'Super Admin logged in successfully'
        });

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
        const {
            firmName,
            adminEmail,
            adminName,
            adminPassword,
            mobileNumber,
            planType,
            maxAdmins,
            googleDriveType,
            googleDriveRootFolderId: customFolderId,
            dbType,
            mongoUri: rawMongoUri
        } = req.body;
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

        // Validate MongoDB URI if dbType is 'personal'
        if (dbType === 'personal' && !rawMongoUri) {
            return res.status(400).json({ message: 'MongoDB URI is required for personal database type' });
        }

        let encryptedMongoUri = undefined;
        if (dbType === 'personal' && rawMongoUri) {
            // Simple validation of MongoDB URI format
            if (!rawMongoUri.startsWith('mongodb://') && !rawMongoUri.startsWith('mongodb+srv://')) {
                return res.status(400).json({ message: 'Invalid MongoDB URI format' });
            }
            encryptedMongoUri = encrypt(rawMongoUri);
        }

        let googleDriveRootFolderId = customFolderId || '';
        try {
            const driveService = getDriveService();
            if (driveService) {
                if (googleDriveType === 'personal' && customFolderId) {
                    // 1. Validate the personal folder is accessible first
                    try {
                        await driveService.getFileMetadata(customFolderId);
                    } catch (e: any) {
                        return res.status(400).json({ 
                            message: `Google Drive Folder not found or inaccessible: ${customFolderId}. Please ensure you have shared it with drive-bot@ca-office-portal-486705.iam.gserviceaccount.com as an 'Editor'.` 
                        });
                    }

                    // 2. Use provided folder and ensure subfolders
                    googleDriveRootFolderId = customFolderId;
                    await driveService.ensureFolder('Clients', googleDriveRootFolderId);
                    await driveService.ensureFolder('Employees', googleDriveRootFolderId);
                    await driveService.ensureFolder('Compliance', googleDriveRootFolderId);
                    await driveService.ensureFolder('Internal Docs', googleDriveRootFolderId);
                    await driveService.ensureFolder('Reports', googleDriveRootFolderId);
                } else {
                    // Default behavior: create folder in app drive using standardized structure
                    googleDriveRootFolderId = await driveService.ensureFirmStructure(firmName);
                }
            }
        } catch (driveError) {
            console.error('Critical Google Drive error during firm creation:', driveError);
            return res.status(500).json({ message: 'Google Drive initialization failed.', error: (driveError as Error).message });
        }

        // 1. Save Firm in Master Database
        const firm = await Firm.create({
            firmName,
            subdomain: finalSubdomain,
            email: adminEmail,
            plan: planType?.toLowerCase() || 'trial',
            status: 'active',
            mobile: mobileNumber,
            googleDriveRootFolderId,
            googleDriveType: googleDriveType || 'app',
            maxAdmins: Number(maxAdmins) || 5,
            dbType: dbType || 'default',
            mongoUri: encryptedMongoUri,
            dbName: `${finalSubdomain}_db`
        });

        // 2. Create Admin User
        const bcryptLib = await import('bcryptjs');
        const passwordHash = await bcryptLib.hash(adminPassword, 10);
        
        let adminUserId: any;

        if (dbType === 'personal') {
            // ── PERSONAL DB: Create admin user INSIDE the tenant's own MongoDB cluster ──
            try {
                console.log(`🔌 [CreateFirm] Connecting to personal DB for "${finalSubdomain}"...`);
                console.log(`🔌 [CreateFirm] mongoUri encrypted? ${!!encryptedMongoUri}`);

                const tenantConn = await getTenantConnection(firm);
                console.log(`✅ [CreateFirm] Connection established. readyState=${tenantConn.readyState}`);

                // Use rawUserSchema — no tenantPlugin, no AsyncLocalStorage dependency
                const TenantUser = getModelFromConnection(tenantConn, 'User', rawUserSchema);
                console.log(`✅ [CreateFirm] TenantUser model bound to connection`);

                const saved = await TenantUser.create({
                    username: adminEmail,
                    passwordHash,
                    role: 'ADMIN',
                    firmId: firm._id,
                    email: adminEmail,
                    name: adminName || `${firmName} Admin`
                });
                adminUserId = saved._id;
                console.log(`✅ [CreateFirm] Admin user saved in personal DB. _id=${saved._id}`);
            } catch (dbError) {
                console.error('❌ [CreateFirm] Failed to initialize personal DB:', dbError);
                // ROLLBACK: Remove the firm from master DB so state stays consistent
                try { await Firm.findByIdAndDelete(firm._id); } catch (_) { /* ignore */ }
                return res.status(500).json({
                    message: 'Failed to connect to your MongoDB URI. Firm creation rolled back. Please verify the URI and ensure our server IP is whitelisted.',
                    error: (dbError as Error).message
                });
            }
        } else {
            // ── DEFAULT DB: Create admin user in the system ca-office database (original behavior) ──
            try {
                const saved = await User.create({
                    username: adminEmail,
                    passwordHash,
                    role: 'ADMIN',
                    firmId: firm._id,
                    email: adminEmail,
                    name: adminName || `${firmName} Admin`
                });
                adminUserId = saved._id;
                console.log(`✅ [CreateFirm] Default DB admin created. _id=${saved._id}`);
            } catch (userError) {
                console.error('Failed to create admin user in default DB:', userError);
                try { await Firm.findByIdAndDelete(firm._id); } catch (_) { /* ignore */ }
                return res.status(500).json({
                    message: 'Failed to create admin user. Firm creation rolled back.',
                    error: (userError as Error).message
                });
            }
        }

        // 3. Seed Default Task Categories and Task Masters
        try {
            console.log('🌱 Seeding default Task Masters into new firm...');

            // ── Hardcoded 30 default CA tasks (always seeded) ──────────────────────
            // These are seeded directly — no dependency on isDefault records in master DB.
            const DEFAULT_CATEGORIES = [
                { name: 'Income Tax', color: '#3b82f6' },
                { name: 'GST', color: '#10b981' },
                { name: 'Audit & Assurance', color: '#f59e0b' },
                { name: 'ROC / Company Law', color: '#8b5cf6' },
                { name: 'Accounting', color: '#ef4444' },
                { name: 'Payroll & HR', color: '#06b6d4' },
            ];

            // Template: { taskName, mode, category (index into above), frequency, estimatedHours, udin }
            const DEFAULT_TASKS: Array<{
                taskName: string; mode: string; categoryIdx: number;
                frequency: string; estimatedHours: number; udin: boolean;
                department?: string; dueDays?: number; recurringTask?: boolean;
            }> = [
                // Income Tax (0)
                { taskName: 'Income Tax Return Filing – Individual', mode: 'Offline', categoryIdx: 0, frequency: 'Yearly', estimatedHours: 3, udin: false, dueDays: 30 },
                { taskName: 'Income Tax Return Filing – Business (Non-Audit)', mode: 'Offline', categoryIdx: 0, frequency: 'Yearly', estimatedHours: 5, udin: false, dueDays: 30 },
                { taskName: 'Income Tax Return Filing – Business (Audit)', mode: 'Offline', categoryIdx: 0, frequency: 'Yearly', estimatedHours: 8, udin: true, dueDays: 45 },
                { taskName: 'TDS Return Filing – Quarterly', mode: 'Offline', categoryIdx: 0, frequency: 'Quarterly', estimatedHours: 3, udin: false, recurringTask: true },
                { taskName: 'Advance Tax Calculation & Payment', mode: 'Offline', categoryIdx: 0, frequency: 'Quarterly', estimatedHours: 2, udin: false, dueDays: 5 },
                { taskName: 'Form 15CA / 15CB Preparation', mode: 'Offline', categoryIdx: 0, frequency: 'One Time', estimatedHours: 2, udin: false },
                { taskName: 'Income Tax Notice Reply / Assessment', mode: 'Offline', categoryIdx: 0, frequency: 'One Time', estimatedHours: 6, udin: false },
                // GST (1)
                { taskName: 'GST Monthly Return – GSTR-1', mode: 'Offline', categoryIdx: 1, frequency: 'Monthly', estimatedHours: 2, udin: false, recurringTask: true, dueDays: 11 },
                { taskName: 'GST Monthly Return – GSTR-3B', mode: 'Offline', categoryIdx: 1, frequency: 'Monthly', estimatedHours: 2, udin: false, recurringTask: true, dueDays: 20 },
                { taskName: 'GST Annual Return – GSTR-9', mode: 'Offline', categoryIdx: 1, frequency: 'Yearly', estimatedHours: 6, udin: false, dueDays: 30 },
                { taskName: 'GST Reconciliation (2A/2B vs Books)', mode: 'Offline', categoryIdx: 1, frequency: 'Monthly', estimatedHours: 3, udin: false, recurringTask: true },
                { taskName: 'GST Registration', mode: 'Offline', categoryIdx: 1, frequency: 'One Time', estimatedHours: 3, udin: false },
                { taskName: 'GST Audit – GSTR-9C', mode: 'Offline', categoryIdx: 1, frequency: 'Yearly', estimatedHours: 8, udin: false },
                { taskName: 'GST Notice Reply / Assessment', mode: 'Offline', categoryIdx: 1, frequency: 'One Time', estimatedHours: 5, udin: false },
                // Audit & Assurance (2)
                { taskName: 'Statutory Audit', mode: 'Offline', categoryIdx: 2, frequency: 'Yearly', estimatedHours: 20, udin: true, dueDays: 60 },
                { taskName: 'Tax Audit – Form 3CB-3CD', mode: 'Offline', categoryIdx: 2, frequency: 'Yearly', estimatedHours: 12, udin: true, dueDays: 30 },
                { taskName: 'Internal Audit', mode: 'Offline', categoryIdx: 2, frequency: 'Quarterly', estimatedHours: 10, udin: false },
                { taskName: 'Concurrent Audit', mode: 'Offline', categoryIdx: 2, frequency: 'Monthly', estimatedHours: 8, udin: false, recurringTask: true },
                { taskName: 'Stock Audit', mode: 'Offline', categoryIdx: 2, frequency: 'Yearly', estimatedHours: 6, udin: false },
                // ROC / Company Law (3)
                { taskName: 'Annual Return Filing – MGT-7', mode: 'Offline', categoryIdx: 3, frequency: 'Yearly', estimatedHours: 4, udin: false, dueDays: 60 },
                { taskName: 'Financial Statements Filing – AOC-4', mode: 'Offline', categoryIdx: 3, frequency: 'Yearly', estimatedHours: 4, udin: false, dueDays: 30 },
                { taskName: 'Company Incorporation', mode: 'Offline', categoryIdx: 3, frequency: 'One Time', estimatedHours: 8, udin: false },
                { taskName: 'DIN / DSC / Director KYC', mode: 'Offline', categoryIdx: 3, frequency: 'Yearly', estimatedHours: 2, udin: false },
                { taskName: 'LLP Annual Filing – Form 11 & Form 8', mode: 'Offline', categoryIdx: 3, frequency: 'Yearly', estimatedHours: 4, udin: false },
                // Accounting (4)
                { taskName: 'Monthly Bookkeeping / Accounting', mode: 'Offline', categoryIdx: 4, frequency: 'Monthly', estimatedHours: 5, udin: false, recurringTask: true },
                { taskName: 'Bank Reconciliation', mode: 'Offline', categoryIdx: 4, frequency: 'Monthly', estimatedHours: 2, udin: false, recurringTask: true },
                { taskName: 'Finalization of Accounts', mode: 'Offline', categoryIdx: 4, frequency: 'Yearly', estimatedHours: 10, udin: false, dueDays: 45 },
                { taskName: 'MIS Report Preparation', mode: 'Offline', categoryIdx: 4, frequency: 'Monthly', estimatedHours: 3, udin: false, recurringTask: true },
                // Payroll & HR (5)
                { taskName: 'Monthly Payroll Processing', mode: 'Offline', categoryIdx: 5, frequency: 'Monthly', estimatedHours: 3, udin: false, recurringTask: true },
                { taskName: 'PF / ESI Return Filing', mode: 'Offline', categoryIdx: 5, frequency: 'Monthly', estimatedHours: 2, udin: false, recurringTask: true },
            ];

            // Bind models to the correct connection
            let TargetCategoryModel: any = TaskCategory;
            let TargetMasterModel: any = TaskMaster;

            if (dbType === 'personal') {
                const tenantConn = await getTenantConnection(firm);
                TargetCategoryModel = getModelFromConnection(tenantConn, 'TaskCategory', TaskCategory.schema);
                TargetMasterModel = getModelFromConnection(tenantConn, 'TaskMaster', TaskMaster.schema);
                console.log('🔗 [Seed] Models bound to personal MongoDB cluster.');
            }

            // Step A: Create categories and build index → ObjectId map
            const categoryIdByIndex = new Map<number, mongoose.Types.ObjectId>();
            for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
                const cat = DEFAULT_CATEGORIES[i];
                const saved = await new TargetCategoryModel({
                    name: cat.name,
                    color: cat.color,
                    description: '',
                    status: 'Active',
                    firmId: firm._id,
                    createdBy: adminUserId,
                }).save();
                categoryIdByIndex.set(i, saved._id as mongoose.Types.ObjectId);
            }

            // Step B: Create task masters
            for (const tmpl of DEFAULT_TASKS) {
                await new TargetMasterModel({
                    taskName: tmpl.taskName,
                    mode: tmpl.mode,
                    category: categoryIdByIndex.get(tmpl.categoryIdx) || null,
                    department: tmpl.department || '',
                    description: '',
                    status: 'Active',
                    udin: tmpl.udin,
                    billingAmount: 0,
                    estimatedHours: tmpl.estimatedHours,
                    frequency: tmpl.frequency,
                    dueDays: tmpl.dueDays,
                    recurringTask: tmpl.recurringTask || false,
                    tags: [],
                    firmId: firm._id,
                    createdBy: adminUserId,
                    isDefault: false,
                    subtasks: [],
                }).save();
            }

            console.log(`✅ Seeded ${DEFAULT_TASKS.length} default tasks + ${DEFAULT_CATEGORIES.length} categories into: ${firm.firmName}`);
        } catch (seedError) {
            // Task seeding is non-fatal. Firm and admin already created successfully.
            console.error('\u274c Non-fatal error during task seeding (firm still created):', seedError);
        }

        res.status(201).json({ 
            message: "Tenant created successfully",
            firm,
            dbType: firm.dbType,
            loginUrl: `https://${firm.subdomain}.mycafile.in`
        });
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
        const { googleDriveRootFolderId, googleDriveType } = req.body;
        let updates = { ...req.body };

        if (updates.plan) updates.plan = updates.plan.toLowerCase();

        // Validation if drive settings are changing
        if (googleDriveRootFolderId !== undefined || googleDriveType !== undefined) {
            const currentFirm = await Firm.findById(req.params.id);
            if (!currentFirm) return res.status(404).json({ message: 'Firm not found' });

            const targetDriveType = googleDriveType || currentFirm.googleDriveType;
            let targetRootId = googleDriveRootFolderId !== undefined ? googleDriveRootFolderId : currentFirm.googleDriveRootFolderId;

            if (targetDriveType === 'personal' && targetRootId) {
                try {
                    const driveService = getDriveService();
                    await driveService.getFileMetadata(targetRootId);
                    
                    // Also ensure basic folders exist if possible
                    await driveService.ensureFolder('Clients', targetRootId);
                    await driveService.ensureFolder('Employees', targetRootId);
                } catch (e: any) {
                    return res.status(400).json({ 
                        message: `Google Drive Folder not found or inaccessible: ${targetRootId}. Please share it with drive-bot@ca-office-portal-486705.iam.gserviceaccount.com as an 'Editor' before saving.` 
                    });
                }
            } else if (targetDriveType === 'app' && currentFirm.googleDriveType === 'personal') {
                try {
                    const driveService = getDriveService();
                    const caFilesRootId = await driveService.ensureFolder('MyCAFile');
                    targetRootId = await driveService.createFolder(currentFirm.firmName, caFilesRootId);
                    
                    await driveService.ensureFolder('Clients', targetRootId);
                    await driveService.ensureFolder('Employees', targetRootId);
                    await driveService.ensureFolder('Compliance', targetRootId);
                    await driveService.ensureFolder('Internal Docs', targetRootId);
                    await driveService.ensureFolder('Reports', targetRootId);

                    updates.googleDriveRootFolderId = targetRootId;
                } catch (e: any) {
                    return res.status(500).json({ message: 'Failed to initialize Application Drive folder' });
                }
            } else if (targetDriveType === 'app' && targetRootId) {
                // If it's already an app drive and they try to pass a static ID, ignore the custom ID
                delete updates.googleDriveRootFolderId;
            }
        }

        const firm = await Firm.findByIdAndUpdate(req.params.id, updates, { new: true });
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

// Security Logs
router.get('/security-logs', async (req, res: Response) => {
    try {
        const logs = await ActivityLog.find({ _id: { $exists: true } })
        .sort({ timestamp: -1 })
        .limit(100)
        .populate({
            path: 'userId',
            select: 'name email username',
            model: 'User'
        })
        .populate('firmId', 'firmName subdomain')
        .lean();

        console.log(`FETCHED_SECURITY_LOGS: count=${logs.length}`);
        if(logs.length > 0) console.log('Sample Log Action:', logs[0].action);

        const formattedLogs = logs.map((log: any) => ({
            id: log._id,
            user: log.userId?.name || log.userId?.email || log.userId?.username || 'Unknown',
            firm: log.firmId ? `${log.firmId.firmName} (${log.firmId.subdomain})` : 'PORTAL',
            ip: log.ipAddress || 'Unknown',
            status: log.action === 'LOGIN' ? 'Success' : (log.action === 'LOGIN_FAILURE' ? 'Failed' : log.action),
            details: log.details,
            date: log.timestamp
        }));

        res.json(formattedLogs);
    } catch (error) {
        console.error('Get security logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Plans
router.get('/plans', authenticate, requireSuperAdmin, async (req: any, res: Response) => {
    try {
        let plans = await Plan.find().sort({ createdAt: 1 });
        if (plans.length === 0) {
            const defaultPlans = [
                { name: 'trial', displayName: 'Trial', price: 'Free', staffLimit: 3, clientLimit: 10, storageGB: 1, tasks: 'Unlimited', isActive: true },
                { name: 'basic', displayName: 'Basic', price: '₹999/mo', staffLimit: 5, clientLimit: 100, storageGB: 10, tasks: 'Unlimited', isActive: true },
                { name: 'professional', displayName: 'Professional', price: '₹2,999/mo', staffLimit: 20, clientLimit: 500, storageGB: 100, tasks: 'Unlimited', isActive: true },
                { name: 'enterprise', displayName: 'Enterprise', price: 'Custom', staffLimit: 99999, clientLimit: 99999, storageGB: 1024, tasks: 'Unlimited', isActive: true }
            ];
            await Plan.insertMany(defaultPlans);
            plans = await Plan.find().sort({ createdAt: 1 });
        }
        res.json(plans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/plans/:id', authenticate, requireSuperAdmin, async (req: any, res: Response) => {
    try {
        const { displayName, price, staffLimit, clientLimit, storageGB, tasks } = req.body;
        const plan = await Plan.findByIdAndUpdate(req.params.id, {
            displayName, price, staffLimit, clientLimit, storageGB, tasks
        }, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
