import { Router, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { File } from '../models/File';
import { ClientGroup } from '../models/ClientGroup';
import { ITStatus } from '../models/ITStatus';
import { SubMaster } from '../models/SubMaster';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest, authenticate, requireAdmin, requireStaff, requireRoles } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { sendFileUploadEmail, sendWelcomeEmail, sendPasswordChangeEmail } from '../services/emailService';
import { Firm } from '../models/Firm';
import { getDriveService } from '../services/googleDrive';
import fs from 'fs';
import path from 'path';
import Reminder from '../models/Reminder';

const router = Router();

// Serve Profile Image for client (Public to allow <img> tags)
router.get('/clients/:id/profile-image/view', async (req: any, res: Response) => {
    try {
        const { Client } = req.models;

        const client = await Client.findById(req.params.id);
        if (!client || !client.profileImageUrl) {
            res.status(404).send('Not found');
            return;
        }

        let driveId = client.profileImageUrl;
        // Parse ID backwards if we stored directLink
        if (driveId.includes('id=')) {
            try {
                if (driveId.startsWith('http')) {
                    driveId = new URL(driveId).searchParams.get('id') || driveId;
                }
            } catch (err) {
                console.warn('Failed to parse profile image URL, using as is:', driveId);
            }
        }

        const driveService = getDriveService();
        const buffer = await driveService.downloadFile(driveId);

        let mimeType = 'image/jpeg';
        if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            mimeType = 'image/png';
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(buffer);
    } catch (e) {
        console.error('Proxy profile image error:', e);
        res.status(500).send('Error');
    }
});

// Most admin routes require authentication and staff role (ADMIN, MANAGER, STAFF, INTERN)
router.use(authenticate, requireStaff);

// Generate random password
const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Generate username from name
const generateUsername = (name: string): string => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${randomNum}`;
};

// Create client (Admin and Manager only)
router.post('/create-client', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;

        const {
            name, email, phone, panNumber, aadharNumber, gstNumber, username: customUsername,
            clientCode, groupName, itStatus, masterType, subMaster, birthDate,
            address, country, state, city, postalCode, currency,
            incorporationDateFrom, incorporationDateTo, licenceNo, licenceAuthority,
            trnNo, description, supportEmployee, status, financialYear,
            altAddress, altPhoneM, altPhoneL, altFax,
            extraField1, extraField2, extraField3, extraField4, extraField5, extraField6, extraField7,
            multipleContacts, legalDocuments
        } = req.body;

        if (!name || !email || !phone) {
            res.status(400).json({ message: 'Name, email, and phone are required' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context required' });

        // Check if client already exists IN THIS FIRM
        const existingClient = await Client.findOne({ email, firmId });
        if (existingClient) {
            res.status(400).json({ message: 'Client with this email already exists in your firm' });
            return;
        }

        // Check if custom username is already taken (Usernames must be globally unique for login)
        if (customUsername) {
            const existingUser = await User.findOne({ username: customUsername });
            if (existingUser) {
                res.status(400).json({ message: 'Username is already taken' });
                return;
            }
        }

        // Check if client code is already taken IN THIS FIRM
        if (clientCode) {
            const existingClientCode = await Client.findOne({ clientCode, firmId });
            if (existingClientCode) {
                res.status(400).json({ message: 'Client Code is already in use' });
                return;
            }
        }

        // Enforce client limit
        const firm = await Firm.findById(firmId);
        const { Plan } = await import('../models/Plan');
        const plan = firm?.plan ? await Plan.findOne({ name: { $regex: new RegExp(`^${firm.plan}$`, 'i') } }) : null;
        const clientLimit = plan ? plan.limits.clients : 10;
        
        if (clientLimit > 0 && clientLimit < 99999) {
            const currentClientsCount = await Client.countDocuments({ firmId });
            if (currentClientsCount >= clientLimit) {
                res.status(400).json({ message: `Client limit reached for your ${plan?.name || firm?.plan} plan. Please upgrade to add more clients.` });
                return;
            }
        }

        // Create client
        const client = new Client({
            firmId,
            name, email, phone, panNumber, aadharNumber, gstNumber,
            clientCode, groupName: groupName || undefined, itStatus: itStatus || undefined,
            masterType, subMaster: subMaster || undefined,
            birthDate: birthDate || undefined,
            address, country, state, city, postalCode, currency,
            incorporationDateFrom: incorporationDateFrom || undefined,
            incorporationDateTo: incorporationDateTo || undefined,
            licenceNo, licenceAuthority,
            trnNo, description, supportEmployee: supportEmployee || undefined, status, financialYear,
            altAddress, altPhoneM, altPhoneL, altFax,
            extraField1, extraField2, extraField3, extraField4, extraField5, extraField6, extraField7,
            multipleContacts, legalDocuments
        });
        await client.save();
 
        // Enqueue Google Drive folder structure creation
        const { enqueueDriveFolderCreation } = await import('../queues/drive.queue');
        enqueueDriveFolderCreation({
            clientId: client._id as string,
            clientName: client.name,
            panNumber: client.panNumber,
            firmId: firmId as string
        }).catch(err => console.error('Failed to enqueue drive creation:', err));

        // Generate credentials
        const username = customUsername || generateUsername(name);
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user account
        const user = new User({
            firmId,
            username,
            passwordHash,
            role: 'CLIENT',
            clientId: client._id
        });
        await user.save();

        // Send welcome email (async, don't wait for it)
        sendWelcomeEmail({
            clientEmail: client.email,
            clientName: client.name,
            username,
            password
        }).catch(err => console.error('Failed to send welcome email:', err));

        res.status(201).json({
            client,
            credentials: {
                username,
                password // Send plain password only once for admin to share with client
            }
        });
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Bulk create clients (Admin and Manager only)
router.post('/bulk-create-clients', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;

        const { clients } = req.body;
        if (!Array.isArray(clients) || clients.length === 0) {
            res.status(400).json({ message: 'No clients provided' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) {
            res.status(400).json({ message: 'Firm context required' });
            return;
        }

        const results = {
            successful: 0,
            failed: 0,
            errors: [] as string[]
        };

        const firm = await Firm.findById(firmId);
        const { Plan } = await import('../models/Plan');
        const plan = firm?.plan ? await Plan.findOne({ name: { $regex: new RegExp(`^${firm.plan}$`, 'i') } }) : null;
        const clientLimit = plan ? plan.limits.clients : 10;
        let currentClientsCount = await Client.countDocuments({ firmId });

        // Enqueue Google Drive folder structure creation
        const { enqueueDriveFolderCreation } = await import('../queues/drive.queue');

        // Process in batches of 50 to avoid overwhelming the DB/CPU while still being fast
        const BATCH_SIZE = 50;
        for (let i = 0; i < clients.length; i += BATCH_SIZE) {
            const batch = clients.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (clientData, index) => {
                const rowIndex = i + index + 1;
                try {
                    if (clientLimit > 0 && clientLimit < 99999 && currentClientsCount >= clientLimit) {
                        results.failed++;
                        results.errors.push(`Row ${rowIndex}: Client limit reached`);
                        return;
                    }

                    if (!clientData.name || !clientData.email || !clientData.phone) {
                        results.failed++;
                        results.errors.push(`Row ${rowIndex}: Name, email, and phone are required`);
                        return;
                    }

                    // Check for existing client in this batch/firm
                    const existingClient = await Client.findOne({ email: clientData.email, firmId });
                    if (existingClient) {
                        results.failed++;
                        results.errors.push(`Row ${rowIndex}: Email ${clientData.email} already exists`);
                        return;
                    }

                    let username = clientData.username;
                    if (username) {
                        const existingUser = await User.findOne({ username });
                        if (existingUser) {
                            results.failed++;
                            results.errors.push(`Row ${rowIndex}: Username ${username} taken`);
                            return;
                        }
                    } else {
                        username = generateUsername(clientData.name);
                    }

                    // 1. Create client
                    const client = new Client({ firmId, ...clientData });
                    await client.save();

                    // 2. Create user with hashed password
                    const password = generatePassword();
                    const passwordHash = await bcrypt.hash(password, 10);
                    const user = new User({
                        firmId,
                        username,
                        passwordHash,
                        role: 'CLIENT',
                        clientId: client._id
                    });
                    await user.save();

                    // 3. Enqueue Drive Task (Background)
                    enqueueDriveFolderCreation({
                        clientId: client._id as string,
                        clientName: client.name,
                        panNumber: client.panNumber,
                        firmId: firmId as string
                    }).catch(err => console.error('Drive enqueue error:', err));

                    // 4. Send Email (Background)
                    sendWelcomeEmail({
                        clientEmail: client.email,
                        clientName: client.name,
                        username,
                        password
                    }).catch(err => console.error('Email send error:', err));

                    currentClientsCount++;
                    results.successful++;
                } catch (err: any) {
                    results.failed++;
                    results.errors.push(`Row ${rowIndex}: ${err.message || 'Error'}`);
                }
            }));
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Bulk create clients error:', error);
        res.status(500).json({ message: 'Server error during bulk import' });
    }
});

// Get client count only (lightweight endpoint for dashboards)
router.get('/clients/count', async (req: AuthRequest, res: Response) => {
    try {
        const { Client } = (req as any).models;

        const count = await Client.countDocuments({ firmId: req.firmId });
        res.set('Cache-Control', 'private, max-age=60'); // cache for 1 min
        res.json({ count });
    } catch (error) {
        console.error('Get client count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Single optimized Dashboard endpoint: returns multiple stats in parallel
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
    try {
        const { Client, Reminder, File, Task, Invoice, User, DSC, NotificationLog } = (req as any).models;
        const firmId = req.firmId;
        const firmObjectId = new mongoose.Types.ObjectId(firmId);
        const isEmployeeView = req.user?.role && !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(req.user.role);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const previousMonthEnd = new Date(monthStart);
        previousMonthEnd.setMilliseconds(-1);
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
        const staffTaskScope = isEmployeeView ? { assignedTo: req.user?.userId } : {};

        const [
            clientCount,
            activeClientCount,
            upcomingReminders,
            overdueReminders,
            pendingTasks,
            tasksDueToday,
            clientsPendingDocuments,
            highPriorityTasks,
            recentFiles,
            firmDoc,
            staffCount,
            storageResult,
            invoiceSummary,
            previousInvoiceSummary,
            monthlyRevenue,
            monthlyTasks,
            clientGrowth,
            employeeWorkload,
            dscDashboard,
            reminderStatus,
            recentNotificationLogs,
        ] = await Promise.all([
            Client.countDocuments({ firmId }),
            Client.countDocuments({ firmId, status: { $ne: false } }),
            Reminder.find({
                firmId,
                dueDate: { $gte: today, $lte: next30Days },
                status: 'PENDING'
            })
            .populate('clientId', 'name email phone')
            .sort({ dueDate: 1 })
            .limit(10)
            .lean(),
            Reminder.find({ firmId, dueDate: { $lt: today }, status: { $in: ['PENDING', 'OVERDUE'] } })
                .populate('clientId', 'name email phone')
                .sort({ dueDate: 1 })
                .limit(10)
                .lean(),
            Task.countDocuments({ firmId, status: { $nin: ['DONE', 'CANCELLED'] }, ...staffTaskScope }),
            Task.find({ firmId, targetDate: { $gte: today, $lt: tomorrow }, status: { $nin: ['DONE', 'CANCELLED'] }, ...staffTaskScope })
                .populate('clientId', 'name')
                .populate('assignedTo', 'name username role')
                .sort({ priority: -1, targetDate: 1 })
                .limit(8)
                .lean(),
            Task.find({ firmId, status: 'PENDING_FROM_CLIENT', ...staffTaskScope })
                .populate('clientId', 'name email phone')
                .sort({ updatedAt: -1 })
                .limit(8)
                .lean(),
            Task.find({ firmId, priority: { $in: ['HIGH', 'URGENT'] }, status: { $nin: ['DONE', 'CANCELLED'] }, ...staffTaskScope })
                .populate('clientId', 'name')
                .populate('assignedTo', 'name username role')
                .sort({ targetDate: 1 })
                .limit(8)
                .lean(),
            File.find({ firmId })
                .populate('clientId', 'name email')
                .populate('uploadedBy', 'name username role')
                .sort({ uploadedAt: -1 })
                .limit(8)
                .lean(),
            Firm.findById(firmId).lean(),
            User.countDocuments({ firmId, role: { $ne: 'CLIENT' } }),
            File.aggregate([
                { $match: { firmId: firmObjectId } },
                { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } }
            ]),
            Invoice.aggregate([
                { $match: { firmId: firmObjectId, status: { $ne: 'CANCELLED' } } },
                {
                    $group: {
                        _id: null,
                        totalInvoiced: { $sum: '$totalAmount' },
                        totalReceived: { $sum: '$paidAmount' },
                        pendingPayments: { $sum: '$balanceAmount' },
                        overdueInvoices: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $lt: ['$dueDate', today] }, { $gt: ['$balanceAmount', 0] }] },
                                    1,
                                    0
                                ]
                            }
                        },
                        collectionPending: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $lt: ['$dueDate', today] }, { $gt: ['$balanceAmount', 0] }] },
                                    '$balanceAmount',
                                    0
                                ]
                            }
                        },
                    }
                }
            ]),
            Invoice.aggregate([
                { $match: { firmId: firmObjectId, issueDate: { $gte: previousMonthStart, $lte: previousMonthEnd }, status: { $ne: 'CANCELLED' } } },
                { $group: { _id: null, totalInvoiced: { $sum: '$totalAmount' }, totalReceived: { $sum: '$paidAmount' } } }
            ]),
            Invoice.aggregate([
                { $match: { firmId: firmObjectId, issueDate: { $gte: sixMonthsAgo }, status: { $ne: 'CANCELLED' } } },
                {
                    $group: {
                        _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
                        invoiced: { $sum: '$totalAmount' },
                        received: { $sum: '$paidAmount' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Task.aggregate([
                { $match: { firmId: firmObjectId, createdAt: { $gte: sixMonthsAgo }, ...staffTaskScope } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Client.aggregate([
                { $match: { firmId: firmObjectId, createdAt: { $gte: sixMonthsAgo } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, clients: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Task.aggregate([
                { $match: { firmId: firmObjectId, assignedTo: { $exists: true, $ne: [] } } },
                { $unwind: '$assignedTo' },
                {
                    $group: {
                        _id: '$assignedTo',
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'DONE'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $not: [{ $in: ['$status', ['DONE', 'CANCELLED']] }] }, 1, 0] } },
                    }
                },
                { $sort: { pending: -1 } },
                { $limit: 8 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                { $project: { total: 1, completed: 1, pending: 1, name: { $ifNull: ['$user.name', '$user.username'] }, role: '$user.role' } }
            ]),
            DSC.countDocuments ? Promise.all([
                DSC.countDocuments({ firmId }),
                DSC.countDocuments({ firmId, dscStatus: 'expiring_soon' }),
                DSC.countDocuments({ firmId, dscStatus: 'expired' }),
            ]) : Promise.resolve([0, 0, 0]),
            NotificationLog.aggregate([
                { $match: { firmId: firmObjectId, createdAt: { $gte: today } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            NotificationLog.find({ firmId }).sort({ createdAt: -1 }).limit(5).lean()
        ]);
        
        const storageUsedGB = storageResult.length > 0 ? (storageResult[0].totalBytes / (1024 * 1024 * 1024)) : 0;
        const billing = invoiceSummary[0] || { totalInvoiced: 0, totalReceived: 0, pendingPayments: 0, collectionPending: 0, overdueInvoices: 0 };
        const previousBilling = previousInvoiceSummary[0] || { totalInvoiced: 0, totalReceived: 0 };
        const totalCompleted = monthlyTasks.reduce((sum: number, item: any) => sum + item.completed, 0);
        const totalWork = monthlyTasks.reduce((sum: number, item: any) => sum + item.total, 0);
        const filingSuccessRate = totalWork ? Math.round((totalCompleted / totalWork) * 100) : 0;
        const reminderBuckets = reminderStatus.reduce((acc: any, item: any) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const monthLabel = (item: any) => `${item._id.month}/${String(item._id.year).slice(-2)}`;
        
        let planLimits = { clients: 500, storageGB: 0.5, staff: 5 };
        if (firmDoc?.plan) {
             const { Plan } = await import('../models/Plan');
             const planDoc = await Plan.findOne({ name: { $regex: new RegExp(`^${firmDoc.plan}$`, 'i') } }).lean();
             if (planDoc) planLimits = planDoc.limits;
        }

        res.json({
            clientCount,
            activeClientCount,
            staffCount,
            storageUsedGB,
            reminders: upcomingReminders,
            overdueReminders,
            pendingTasks,
            tasksDueToday,
            clientsPendingDocuments,
            highPriorityTasks,
            recentFiles,
            billing,
            performance: {
                monthlyRevenue: monthlyRevenue.map((item: any) => ({ month: monthLabel(item), invoiced: item.invoiced, received: item.received })),
                workCompletion: monthlyTasks.map((item: any) => ({ month: monthLabel(item), completion: item.total ? Math.round((item.completed / item.total) * 100) : 0 })),
                clientGrowth: clientGrowth.map((item: any) => ({ month: monthLabel(item), clients: item.clients })),
                filingSuccessRate,
            },
            employeeWorkload: employeeWorkload.map((item: any) => ({
                name: item.name || 'Unassigned',
                role: item.role || 'STAFF',
                total: item.total,
                completed: item.completed,
                pending: item.pending,
                completionRate: item.total ? Math.round((item.completed / item.total) * 100) : 0,
            })),
            reminderStatus: {
                sentToday: reminderBuckets.SENT || 0,
                failedToday: reminderBuckets.FAILED || 0,
                skippedToday: reminderBuckets.SKIPPED || 0,
                pendingReminders: upcomingReminders.length,
                recentNotificationLogs,
            },
            aiInsights: [
                `${overdueReminders.length} compliance item${overdueReminders.length === 1 ? '' : 's'} need immediate review.`,
                `${clientsPendingDocuments.length} client${clientsPendingDocuments.length === 1 ? '' : 's'} are pending documents.`,
                `${dscDashboard[1]} DSC${dscDashboard[1] === 1 ? '' : 's'} expiring soon.`,
                totalWork ? `Team completion is ${filingSuccessRate}% across recent work.` : 'No recent task completion data yet.',
                billing.collectionPending > 0 ? `Collection follow-up needed for ${billing.collectionPending.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}.` : 'Collections are under control today.',
            ],
            dscSummary: { total: dscDashboard[0], expiringSoon: dscDashboard[1], expired: dscDashboard[2] },
            trends: {
                revenue: previousBilling.totalInvoiced ? Math.round(((billing.totalInvoiced - previousBilling.totalInvoiced) / previousBilling.totalInvoiced) * 100) : 0,
                collection: previousBilling.totalReceived ? Math.round(((billing.totalReceived - previousBilling.totalReceived) / previousBilling.totalReceived) * 100) : 0,
            },
            firmSubscription: firmDoc?.subscription || null,
            firmPlan: firmDoc?.plan || 'Free Trial',
            planLimits
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all clients
router.get('/clients', async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;

        const clients = await Client.find({ firmId: req.firmId })
            .populate('groupName', 'groupName')
            .populate('itStatus', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Fetch usernames for these clients
        const clientIds = clients.map((c: any) => c._id);
        const users = await User.find({ clientId: { $in: clientIds }, role: 'CLIENT' }).select('clientId username').lean();


        const usernameMap = users.reduce((acc: any, u: any) => {
            if (u.clientId) {
                acc[u.clientId.toString()] = u.username;
            }
            return acc;
        }, {} as Record<string, string>);

        const clientsWithUsername = clients.map((client: any) => ({
            ...client,
            username: usernameMap[client._id.toString()] || ''
        }));


        res.set('Cache-Control', 'private, max-age=30'); // cache for 30s
        res.json(clientsWithUsername);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get single client
router.get('/clients/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;
        const client = await Client.findOne({ _id: req.params.id, firmId: req.firmId })

            .populate('groupName', 'groupName')
            .populate('itStatus', 'name')
            .lean();
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Fetch associated username
        const user = await User.findOne({ clientId: client._id, role: 'CLIENT' }).select('username').lean();

        res.json({
            ...client,
            username: user?.username || ''
        });
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update client details (Admin, Manager, and Staff)
router.patch('/clients/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client } = (req as any).models;

        const { id } = req.params;
        const updates = req.body;

        // Prevent updating sensitive fields directly
        delete updates.password;
        delete updates.createdAt;
        delete updates._id;

        const firmId = req.firmId || req.user?.firmId;

        // Check if clientCode is being updated and if it's already taken IN THIS FIRM
        if (updates.clientCode) {
            const existingClientCode = await Client.findOne({ _id: { $ne: id }, clientCode: updates.clientCode, firmId } as any);
            if (existingClientCode) {
                res.status(400).json({ message: 'Client Code is already in use' });
                return;
            }
        }

        // Fix Mongoose CastError by converting empty strings to null for ObjectId fields and Dates
        if (updates.groupName === '') updates.groupName = null;
        if (updates.itStatus === '') updates.itStatus = null;
        if (updates.supportEmployee === '') updates.supportEmployee = null;
        if (updates.subMaster === '') updates.subMaster = null;

        // Handle Date fields specifically so empty string translates to missing/unset
        if (updates.birthDate === '') updates.birthDate = null;
        if (updates.incorporationDateFrom === '') updates.incorporationDateFrom = null;
        if (updates.incorporationDateTo === '') updates.incorporationDateTo = null;

        const client = await Client.findOneAndUpdate(
            { _id: id, firmId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Profile Image for client
router.post('/clients/:id/profile-image', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('profileImage'), async (req: AuthRequest, res: Response) => {
    try {
        const { Client } = (req as any).models;

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { id } = req.params;
        const client = await Client.findOne({ _id: id, firmId: req.firmId });

        if (!client) {
            fs.unlinkSync(req.file.path);
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Upload to Google Drive under client's "Documents" folder
        const driveService = getDriveService();

        // 1. Get/Create Client Home folder
        const { documentsFolderId } = await driveService.createClientFolderStructure(client.name, client.panNumber);

        // 3. Upload file to Documents folder
        const fileBuffer = fs.readFileSync(req.file.path);
        const uploadResult = await driveService.uploadFile(
            fileBuffer,
            `profile_${client._id}_${req.file.originalname}`,
            req.file.mimetype,
            documentsFolderId
        );

        // 4. Delete local temporary file
        fs.unlinkSync(req.file.path);

        // 5. Make it shareable and get the link
        await driveService.createShareableLink(uploadResult.fileId);

        // Google Drive direct image display link
        const directLink = `https://drive.google.com/uc?export=view&id=${uploadResult.fileId}`;

        // 6. Update Database
        client.profileImageUrl = directLink;
        await client.save();

        res.json({
            message: 'Profile image uploaded successfully',
            profileImageUrl: directLink
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error' });
    }
});


// Delete Profile Image for client
router.delete('/clients/:id/profile-image', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client } = (req as any).models;
        const { id } = req.params;

        const client = await Client.findOne({ _id: id, firmId: req.firmId });

        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        if (client.profileImageUrl) {
            // Attempt to delete from Drive if we can extract ID
            try {
                const driveService = getDriveService();
                // Extract ID from https://drive.google.com/uc?export=view&id=ID
                const url = new URL(client.profileImageUrl);
                const fileId = url.searchParams.get('id');
                if (fileId) {
                    await driveService.deleteFile(fileId);
                }
            } catch (err) {
                console.error('Failed to delete profile image from drive:', err);
                // Continue anyway to clear DB
            }
        }

        client.profileImageUrl = undefined;
        await client.save();

        res.json({ message: 'Profile image removed successfully' });
    } catch (error) {
        console.error('Remove profile image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload file for client
router.post('/upload-file', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
        const { Client, File } = (req as any).models;

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { clientId, year, category, fileName } = req.body;

        // Validate required fields (year is optional for USER_DOCS)
        if (!clientId || !category) {
            // Delete uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Client ID and category are required' });
            return;
        }

        // Year is required for all categories except USER_DOCS
        if (category !== 'USER_DOCS' && !year) {
            fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Year is required for this category' });
            return;
        }

        // Verify client exists
        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) {
            fs.unlinkSync(req.file.path);
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Create file record
        const file = new File({
            clientId,
            year,
            category,
            fileName: fileName || req.file.originalname,
            originalFileName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            uploadedBy: req.user!.userId,
            firmId: req.firmId || req.user?.firmId
        });
        await file.save();

        // Send email notification (async, don't wait for it)
        sendFileUploadEmail({
            clientEmail: client.email,
            clientName: client.name,
            fileName: fileName || req.file.originalname,
            category,
            year
        }).catch(err => console.error('Failed to send email notification:', err));

        res.status(201).json(file);
    } catch (error) {
        console.error('Upload file error:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Get files for a client
router.get('/files/:clientId', async (req: AuthRequest, res: Response) => {
    try {
        const { File } = (req as any).models;

        const { clientId } = req.params;
        const { year, category } = req.query;

        const query: any = { clientId };
        if (year) query.year = year;
        if (category) query.category = category;

        const files = await File.find(query)
            .populate('uploadedBy', 'username')
            .sort({ uploadedAt: -1 })
            .lean();

        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update file name
router.patch('/files/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { File } = (req as any).models;
        const { fileId } = req.params;

        const { fileName } = req.body;

        if (!fileName) {
            res.status(400).json({ message: 'File name is required' });
            return;
        }

        const file = await File.findOneAndUpdate(
            { _id: fileId, firmId: req.firmId },
            { fileName },
            { new: true }
        );

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        res.json(file);
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete file (Admin, Manager, and Staff only - No Interns)
router.delete('/files/:fileId', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { File } = (req as any).models;
        const { fileId } = req.params;


        const file = await File.findOne({ _id: fileId, firmId: req.firmId });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete physical file
        if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // Delete database record
        await File.findOneAndDelete({ _id: fileId, firmId: req.firmId });

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all years for a client
router.get('/clients/:clientId/years', async (req: AuthRequest, res: Response) => {
    try {
        const { File } = (req as any).models;
        const { clientId } = req.params;

        const years = await File.distinct('year', { clientId });
        res.json(years.sort().reverse());
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download file (for preview and download)
router.get('/download/:fileId', async (req: AuthRequest, res: Response) => {
    try {
        const { File } = (req as any).models;
        const { fileId } = req.params;

        const file = await File.findOne({ _id: fileId, firmId: req.firmId });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Check if file exists
        if (!fs.existsSync(file.filePath)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }

        // Get file extension
        const ext = path.extname(file.originalFileName).toLowerCase();

        // Set content type based on file extension
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') {
            contentType = 'application/pdf';
        } else if (ext === '.xlsx' || ext === '.xls') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (ext === '.docx' || ext === '.doc') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        // Set headers for proper download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

        // Send file
        res.sendFile(path.resolve(file.filePath));
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get client credentials (username only, password cannot be retrieved)
router.get('/clients/:clientId/credentials', async (req: AuthRequest, res: Response) => {
    try {
        const { User } = (req as any).models;
        const { clientId } = req.params;


        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) {
            res.status(404).json({ message: 'Client user not found' });
            return;
        }

        res.json({
            username: user.username,
            note: 'Password is encrypted and cannot be retrieved. Use reset password to generate a new one.'
        });
    } catch (error) {
        console.error('Get credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send credentials via email
router.post('/clients/:clientId/send-credentials', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;
        const { clientId } = req.params;

        const { password } = req.body; // Admin provides the password (from reset or recent creation)

        if (!password) {
            return res.status(400).json({ message: 'Password is required to send credentials email' });
        }

        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) return res.status(404).json({ message: 'Client not found' });

        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) return res.status(404).json({ message: 'Client user not found' });

        await sendWelcomeEmail({
            clientEmail: client.email,
            clientName: client.name,
            username: user.username,
            password: password
        });

        res.json({ message: 'Credentials sent successfully' });
    } catch (error) {
        console.error('Send credentials error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset client password (Admin and Manager only)
router.post('/clients/:clientId/reset-password', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User } = (req as any).models;
        const { clientId } = req.params;


        const user = await User.findOne({ clientId, role: 'CLIENT' });
        if (!user) {
            res.status(404).json({ message: 'Client user not found' });
            return;
        }

        const client = await Client.findOne({ _id: clientId, firmId: req.firmId });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Generate new password
        const newPassword = generatePassword();
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        user.passwordHash = passwordHash;
        await user.save();

        // Send email with new password
        await sendPasswordChangeEmail({
            userEmail: client.email,
            userName: client.name,
            username: user.username,
            newPassword: newPassword
        });

        res.json({
            username: user.username,
            password: newPassword,
            message: 'Password reset and email sent successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete client (Admin only)
router.delete('/clients/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User, File } = (req as any).models;
        const { id } = req.params;


        const client = await Client.findOne({ _id: id, firmId: req.firmId });
        if (!client) {
            res.status(404).json({ message: 'Client not found' });
            return;
        }

        // Delete client's user account
        await User.findOneAndDelete({ clientId: id });

        // Get all client files
        const files = await File.find({ clientId: id });

        // Delete physical local files
        for (const file of files) {
            if (file.storedIn === 'local' && file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (e) {
                    console.error(`Failed to delete file ${file.filePath}:`, e);
                }
            }
        }

        // Delete file records from database
        await File.deleteMany({ clientId: id });

        // Delete client record
        await Client.findOneAndDelete({ _id: id, firmId: req.firmId });

        res.json({ message: 'Client and all associated data deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Bulk Delete clients (Admin only)
router.post('/clients/bulk-delete', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Client, User, File } = (req as any).models;
        const { clientIds } = req.body;

        if (!Array.isArray(clientIds) || clientIds.length === 0) {
            res.status(400).json({ message: 'No clients selected' });
            return;
        }

        // Delete users
        await User.deleteMany({ clientId: { $in: clientIds } });

        // Get all files for these clients
        const files = await File.find({ clientId: { $in: clientIds } });
        
        // Delete physical local files
        for (const file of files) {
            if (file.storedIn === 'local' && file.filePath && fs.existsSync(file.filePath)) {
                try {
                    fs.unlinkSync(file.filePath);
                } catch (e) {
                    console.error(`Failed to delete file ${file.filePath}:`, e);
                }
            }
        }

        // Delete file records
        await File.deleteMany({ clientId: { $in: clientIds } });

        // Delete client records
        await Client.deleteMany({ _id: { $in: clientIds } });

        res.json({ message: `${clientIds.length} clients deleted successfully` });
    } catch (error) {
        console.error('Bulk delete clients error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Migration: Update lastLogin for all users (Admin only)
router.post('/migrate-lastlogin', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const result = await User.updateMany(
            { lastLogin: null },
            { $set: { lastLogin: new Date() } }
        );

        res.json({
            message: 'Migration completed',
            updated: result.modifiedCount
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all staff users (Admin and Manager only)
router.get('/users', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { User } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;

        const users = await User.find({ role: { $ne: 'CLIENT' }, firmId })
            .select('_id username name firstName lastName email role')
            .sort({ name: 1 })
            .lean();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get employee login logs
router.get('/employee/login-logs', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { User, ActivityLog } = (req as any).models;
        const { userId, startDate, endDate } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        // Find staff members (non-clients)
        const query: any = { role: { $ne: 'CLIENT' } };
        if (userId) {
            query._id = userId;
        }

        const staffUsers = await User.find(query).select('_id name username role').lean();
        const staffIds = staffUsers.map((u: any) => u._id);

        const filter: any = {
            action: 'LOGIN',
            userId: { $in: staffIds },
            firmId: req.firmId
        };

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                const sDate = new Date(startDate as string);
                sDate.setHours(0, 0, 0, 0);
                filter.timestamp.$gte = sDate;
            }
            if (endDate) {
                const eDate = new Date(endDate as string);
                eDate.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = eDate;
            }
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('userId', 'name username role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter)
        ]);

        res.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Fetch login logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get free employee list
router.get('/employee/free-list', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        // Find tasks that are not DONE or CANCELLED
        const { Task, User } = (req as any).models;
        const activeTasks = await Task.find({ status: { $in: ['PENDING', 'STARTED', 'UNDER_REVIEW'] }, firmId: req.firmId });


        let busyUserIds: any[] = [];
        activeTasks.forEach((task: any) => {
            if (task.assignedTo && Array.isArray(task.assignedTo)) {
                busyUserIds.push(...task.assignedTo);
            }
        });


        // Find users that are not busy
        const freeEmployees = await User.find({
            _id: { $nin: busyUserIds },
            firmId: req.firmId,
            role: { $in: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'] }
        }).select('_id name username role email phone').lean();

        res.json(freeEmployees);
    } catch (error) {
        console.error('Fetch free employee list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// -- Client Group Routes --

// Create Client Group (Admin and Manager only)
router.post('/client-groups', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { ClientGroup } = (req as any).models;
        const { groupName, address, description, status, email, mobileNumber, gstin } = req.body;


        if (!groupName || !email || !mobileNumber) {
            res.status(400).json({ message: 'Group Name, Email, and Mobile Number are required.' });
            return;
        }

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        const existingGroup = await ClientGroup.findOne({ groupName, firmId });
        if (existingGroup) {
            res.status(400).json({ message: 'Group with this name already exists' });
            return;
        }

        const newGroup = new ClientGroup({
            groupName,
            address,
            description,
            status,
            email,
            mobileNumber,
            gstin,
            firmId
        });
        await newGroup.save();

        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Create client group error:', error);
        res.status(500).json({ message: 'Server error during client group creation', error: error instanceof Error ? error.message : String(error) });
    }
});

// Get all Client Groups
router.get('/client-groups', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { ClientGroup } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const groups = await ClientGroup.find({ firmId })

            .sort({ createdAt: -1 })
            .lean();
        res.json(groups);
    } catch (error) {
        console.error('Get client groups error:', error);
        res.status(500).json({ message: 'Server error fetching client groups' });
    }
});

// Delete Client Group (Admin and Manager only)
router.delete('/client-groups/:id', authenticate, requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { ClientGroup, Client } = (req as any).models;
        const { id } = req.params;

        const firmId = req.firmId || req.user?.firmId;

        const group = await ClientGroup.findOne({ _id: id, firmId });
        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        // Check if group is being used by any clients
        const clientCount = await Client.countDocuments({ groupName: id });
        if (clientCount > 0) {
            res.status(400).json({ message: `Cannot delete group: ${clientCount} clients belong to this group.` });
            return;
        }

        await ClientGroup.findOneAndDelete({ _id: id, firmId });
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete client group error:', error);
        res.status(500).json({ message: 'Server error during client group deletion' });
    }
});

// Update Client Group (Admin, Manager, and Staff)
router.patch('/client-groups/:id', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { ClientGroup } = (req as any).models;
        const { id } = req.params;

        const updates = req.body;
        const firmId = req.firmId || req.user?.firmId;

        // Prevent updating firmId
        delete updates.firmId;
        delete updates._id;

        const group = await ClientGroup.findOneAndUpdate(
            { _id: id, firmId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        res.json(group);
    } catch (error) {
        console.error('Update client group error:', error);
        res.status(500).json({ message: 'Server error during client group update' });
    }
});

router.post('/it-status', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { ITStatus } = (req as any).models;
        const { name, description, status } = req.body;

        if (!name) return res.status(400).json({ message: 'Name is required' });

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const queryFirmId = new mongoose.Types.ObjectId(firmId);

        const existing = await ITStatus.findOne({ name, firmId: queryFirmId });
        if (existing) return res.status(400).json({ message: 'IT Status with this name already exists' });

        const item = new ITStatus({
            name,
            description,
            status,
            firmId: queryFirmId
        });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Create IT Status error:', error);
        res.status(500).json({
            message: 'Server error during IT Status creation',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Update IT Status
router.patch('/it-status/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { ITStatus } = (req as any).models;
        const { id } = req.params;
        const { name, description, status } = req.body;
        const firmId = req.firmId || req.user?.firmId;

        const item = await ITStatus.findOneAndUpdate(
            { _id: id, firmId },
            { $set: { name, description, status } },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: 'IT Status not found' });
        res.json(item);
    } catch (error) {
        console.error('Update IT Status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete IT Status
router.delete('/it-status/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { ITStatus } = (req as any).models;
        const { id } = req.params;
        const firmId = req.firmId || req.user?.firmId;

        const item = await ITStatus.findOneAndDelete({ _id: id, firmId });
        if (!item) return res.status(404).json({ message: 'IT Status not found' });
        res.json({ message: 'IT Status deleted successfully' });
    } catch (error) {
        console.error('Delete IT Status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/it-status', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { ITStatus } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const items = await ITStatus.find({ firmId: new mongoose.Types.ObjectId(firmId) }).sort({ name: 1 }).lean();
        res.json(items);
    } catch (error) {
        console.error('Get IT Status error:', error);
        res.status(500).json({
            message: 'Server error fetching IT Status',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// -- Sub Master Routes --
router.post('/sub-master', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { SubMaster } = (req as any).models;
        const { name, description, status } = req.body;

        if (!name) return res.status(400).json({ message: 'Name is required' });

        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const queryFirmId = new mongoose.Types.ObjectId(firmId);

        const existing = await SubMaster.findOne({ name, firmId: queryFirmId });
        if (existing) return res.status(400).json({ message: 'Sub Master with this name already exists' });

        const item = new SubMaster({
            name,
            description,
            status,
            firmId: queryFirmId
        });
        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Create Sub Master error:', error);
        res.status(500).json({
            message: 'Server error during Sub Master creation',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Update Sub Master
router.patch('/sub-master/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { SubMaster } = (req as any).models;
        const { id } = req.params;
        const { name, description, status } = req.body;
        const firmId = req.firmId || req.user?.firmId;

        const item = await SubMaster.findOneAndUpdate(
            { _id: id, firmId },
            { $set: { name, description, status } },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: 'Sub Master not found' });
        res.json(item);
    } catch (error) {
        console.error('Update Sub Master error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Sub Master
router.delete('/sub-master/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { SubMaster } = (req as any).models;
        const { id } = req.params;
        const firmId = req.firmId || req.user?.firmId;

        const item = await SubMaster.findOneAndDelete({ _id: id, firmId });
        if (!item) return res.status(404).json({ message: 'Sub Master not found' });
        res.json({ message: 'Sub Master deleted successfully' });
    } catch (error) {
        console.error('Delete Sub Master error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/sub-master', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { SubMaster } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        if (!firmId) return res.status(400).json({ message: 'Firm context missing' });

        if (!mongoose.isValidObjectId(firmId)) {
            return res.status(400).json({ message: 'Invalid firm context' });
        }

        const items = await SubMaster.find({ firmId: new mongoose.Types.ObjectId(firmId) }).sort({ name: 1 }).lean();
        res.json(items);
    } catch (error) {
        console.error('Get Sub Master error:', error);
        res.status(500).json({
            message: 'Server error fetching Sub Master',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;
