import { Router, Response } from 'express';
import { File } from '../models/File';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Get dashboard analytics
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

        // Total counts
        const [totalClients, totalFiles, totalUsers] = await Promise.all([
            Client.countDocuments(),
            File.countDocuments({ isArchived: false }),
            User.countDocuments({ role: 'CLIENT' })
        ]);

        // Recent activity (last 30 days)
        const recentFiles = await File.countDocuments({
            uploadedAt: { $gte: thirtyDaysAgo }
        });

        // Category distribution
        const categoryDistribution = await File.aggregate([
            { $match: { isArchived: false } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Storage usage per client
        const storageByClient = await File.aggregate([
            { $match: { isArchived: false } },
            {
                $group: {
                    _id: '$clientId',
                    totalSize: { $sum: '$fileSize' },
                    fileCount: { $sum: 1 }
                }
            },
            { $sort: { totalSize: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $unwind: '$client' }
        ]);

        // File upload trends (last 6 months, grouped by month)
        const uploadTrends = await File.aggregate([
            { $match: { uploadedAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$uploadedAt' },
                        month: { $month: '$uploadedAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Client activity (last login)
        const clientActivity = await User.aggregate([
            { $match: { role: 'CLIENT' } },
            { $sort: { lastLogin: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'clients',
                    localField: 'clientId',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } }
        ]);

        // Most active clients (by file uploads in last 30 days)
        const mostActiveClients = await File.aggregate([
            { $match: { uploadedAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$clientId',
                    uploadCount: { $sum: 1 }
                }
            },
            { $sort: { uploadCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'clients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $unwind: '$client' }
        ]);

        res.json({
            summary: {
                totalClients,
                totalFiles,
                totalUsers,
                recentFiles
            },
            categoryDistribution: categoryDistribution.map(item => ({
                category: item._id,
                count: item.count
            })),
            storageByClient: storageByClient.map(item => ({
                clientId: item._id,
                clientName: item.client.name,
                totalSize: item.totalSize,
                fileCount: item.fileCount
            })),
            uploadTrends: uploadTrends.map(item => ({
                year: item._id.year,
                month: item._id.month,
                count: item.count
            })),
            clientActivity: clientActivity.map(user => ({
                userId: user._id,
                username: user.username,
                clientName: user.client?.name || 'Unknown',
                lastLogin: user.lastLogin,
                email: user.email
            })),
            mostActiveClients: mostActiveClients.map(item => ({
                clientId: item._id,
                clientName: item.client.name,
                uploadCount: item.uploadCount
            }))
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
});

/**
 * Get monthly report
 * GET /api/analytics/monthly-report
 */
router.get('/monthly-report', authenticate, requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const { year, month } = req.query;
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Files uploaded this month
        const filesUploaded = await File.countDocuments({
            uploadedAt: { $gte: startDate, $lte: endDate }
        });

        // New clients this month
        const newClients = await Client.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        res.json({
            period: {
                year: targetYear,
                month: targetMonth,
                monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
            },
            summary: {
                filesUploaded,
                newClients
            }
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ message: 'Error generating monthly report' });
    }
});

export default router;
