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
import { getDriveService, getServiceAccountDriveService } from '../services/googleDrive';
import { encrypt } from '../utils/encryption';
import { getTenantConnection, getModelFromConnection, rawUserSchema } from '../services/dbManager';
import mongoose from 'mongoose';
import { DEFAULT_TASKS, DEFAULT_TASK_CATEGORIES } from '../utils/defaultTasks';
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
                    // 1. Validate using SERVICE ACCOUNT — users share with the service account email,
                    //    not the OAuth2 user. Using getDriveService() (OAuth2) would always return 404.
                    const saService = getServiceAccountDriveService();
                    try {
                        await saService.getFileMetadata(customFolderId);
                    } catch (e: any) {
                        return res.status(400).json({ 
                            message: `Google Drive Folder not found or inaccessible: ${customFolderId}. Please ensure you have shared it with drive-bot@ca-office-portal-486705.iam.gserviceaccount.com as an 'Editor'.` 
                        });
                    }

                    // 2. Use provided folder and ensure subfolders (also via service account)
                    googleDriveRootFolderId = customFolderId;
                    await saService.ensureFolder('Clients', googleDriveRootFolderId);
                    await saService.ensureFolder('Employees', googleDriveRootFolderId);
                    await saService.ensureFolder('Compliance', googleDriveRootFolderId);
                    await saService.ensureFolder('Internal Docs', googleDriveRootFolderId);
                    await saService.ensureFolder('Reports', googleDriveRootFolderId);
                } else {
                    // Default behavior: create folder in app drive using standardized structure
                    googleDriveRootFolderId = await driveService.ensureFirmStructure(firmName);
                }
            }
        } catch (driveError) {
            console.error('Critical Google Drive error during firm creation:', driveError);
            return res.status(500).json({ message: 'Google Drive initialization failed.', error: (driveError as Error).message });
        }

        let selectedPlan = await Plan.findOne({ name: planType });
        if (!selectedPlan) {
             selectedPlan = await Plan.findOne({ name: 'Free' }); 
        }

        // 1. Save Firm in Master Database
        const firm = await Firm.create({
            firmName,
            subdomain: finalSubdomain,
            email: adminEmail,
            subscription: {
                planId: selectedPlan?._id,
                status: 'active',
                startDate: new Date(),
                // Super admin creation gives 1 year by default
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            },
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

        // 3. Seed Default Task Categories and Task Masters (hardcoded 30 CA defaults)
        try {
            console.log(`🌱 [CreateFirm] Seeding 30 default CA tasks into "${firm.firmName}"...`);

            let TargetCategoryModel: any = TaskCategory;
            let TargetMasterModel: any = TaskMaster;

            if (dbType === 'personal') {
                // For personal DB — bind models to the tenant's own cluster
                const tenantConn = await getTenantConnection(firm);
                TargetCategoryModel = getModelFromConnection(tenantConn, 'TaskCategory', TaskCategory.schema);
                TargetMasterModel = getModelFromConnection(tenantConn, 'TaskMaster', TaskMaster.schema);
            }

            // Step A: Create categories and build name → _id map
            const categoryIdMap = new Map<string, mongoose.Types.ObjectId>();
            for (const cat of DEFAULT_TASK_CATEGORIES) {
                const saved = await new TargetCategoryModel({
                    name: cat.name,
                    color: cat.color,
                    description: '',
                    status: 'Active',
                    firmId: firm._id,
                    createdBy: adminUserId
                }).save();
                categoryIdMap.set(cat.name, saved._id as mongoose.Types.ObjectId);
            }

            // Step B: Seed all 30 default tasks
            for (const task of DEFAULT_TASKS) {
                const categoryId = categoryIdMap.get(task.category) || null;
                await new TargetMasterModel({
                    taskName: task.taskName,
                    mode: task.mode,
                    category: categoryId,
                    description: task.description || '',
                    status: 'Active',
                    udin: task.udin,
                    billingAmount: 0,
                    estimatedHours: task.estimatedHours,
                    frequency: task.frequency,
                    typeOfClient: task.typeOfClient,
                    dueDays: task.dueDays,
                    recurringTask: task.recurringTask,
                    tags: [],
                    subtasks: [],
                    firmId: firm._id,
                    createdBy: adminUserId,
                    isDefault: false
                }).save();
            }

            console.log(`✅ [CreateFirm] Seeded ${DEFAULT_TASKS.length} default tasks into: ${firm.firmName}`);
        } catch (seedError) {
            // Task seeding is non-fatal — firm and admin are already created.
            console.error('❌ [CreateFirm] Non-fatal error during task seeding (firm still created):', seedError);
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
                    // Use SERVICE ACCOUNT for validation — personal folders are shared with
                    // the service account email, not the OAuth2 user account.
                    const saService = getServiceAccountDriveService();
                    await saService.getFileMetadata(targetRootId);
                    
                    // Also ensure basic folders exist via service account
                    await saService.ensureFolder('Clients', targetRootId);
                    await saService.ensureFolder('Employees', targetRootId);
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
        const plans = await Plan.find().sort({ createdAt: 1 });
        res.json(plans);
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/plans/:id', authenticate, requireSuperAdmin, async (req: any, res: Response) => {
    try {
        const { yearlyPrice, limits, features } = req.body;
        const plan = await Plan.findByIdAndUpdate(req.params.id, {
            yearlyPrice, limits, features
        }, { new: true });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
