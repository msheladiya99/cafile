import { Router, Response } from 'express';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { checkFeatureAccess } from '../middleware/subscriptionLimits';
import { encrypt, decrypt } from '../utils/encryption';
import { sendEmail } from '../utils/email';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate, checkFeatureAccess('dscBulk'));

// ─── Helper ──────────────────────────────────────────────────────────────────
function computeStatus(expiryDate: Date): 'active' | 'expiring_soon' | 'expired' {
    const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'expired';
    if (diffDays <= 30) return 'expiring_soon';
    return 'active';
}

// ─── GET /api/dsc/dashboard  (MUST be before /:id) ───────────────────────────
router.get('/dashboard', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;
        const firmId = req.firmId;

        const [total, active, expiringSoon, expired] = await Promise.all([
            DSC.countDocuments({ firmId }),
            DSC.countDocuments({ firmId, dscStatus: 'active' }),
            DSC.countDocuments({ firmId, dscStatus: 'expiring_soon' }),
            DSC.countDocuments({ firmId, dscStatus: 'expired' }),
        ]);

        const upcoming = await DSC.find({
            firmId,
            expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        })
            .populate('clientId', 'name email')
            .sort({ expiryDate: 1 })
            .limit(10)
            .select('-dscPasswordEncrypted');

        res.json({ total, active, expiringSoon, expired, upcoming });
    } catch (error) {
        console.error('DSC dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/dsc/export/csv  (MUST be before /:id) ──────────────────────────
router.get('/export/csv', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;
        const dscs = await DSC.find({ firmId: req.firmId })
            .populate('clientId', 'name email panNumber')
            .sort({ expiryDate: 1 })
            .select('-dscPasswordEncrypted')
            .lean();

        const now = new Date();
        const rows: string[][] = [
            ['DSC Number', 'Holder Name', 'Client Name', 'Client Email', 'PAN',
                'Issue Date', 'Expiry Date', 'Status', 'Days Remaining', 'Class', 'Type', 'Issuing Authority']
        ];

        for (const d of dscs as any[]) {
            const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            rows.push([
                d.dscNumber || '',
                d.holderName || '',
                d.clientId?.name || '',
                d.clientId?.email || '',
                d.clientId?.panNumber || '',
                new Date(d.issueDate).toLocaleDateString('en-IN'),
                new Date(d.expiryDate).toLocaleDateString('en-IN'),
                d.dscStatus || '',
                daysLeft > 0 ? String(daysLeft) : 'EXPIRED',
                d.dscClass || '',
                d.dscType || '',
                d.issuingAuthority || ''
            ]);
        }

        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="dsc-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('DSC export error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/dsc  — list ────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;
        const { status, clientId, search } = req.query;

        const filter: Record<string, unknown> = { firmId: req.firmId };
        if (status) filter.dscStatus = status;
        if (clientId) filter.clientId = clientId;
        if (search) {
            filter.$or = [
                { dscNumber: { $regex: search, $options: 'i' } },
                { holderName: { $regex: search, $options: 'i' } }
            ];
        }

        const dscs = await DSC.find(filter)
            .populate('clientId', 'name email phone panNumber')
            .populate('createdBy', 'name email')
            .sort({ expiryDate: 1 })
            .select('-dscPasswordEncrypted');

        res.json(dscs);
    } catch (error) {
        console.error('Get DSC list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /api/dsc  — create ─────────────────────────────────────────────────
router.post('/', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;

        const {
            clientId, dscNumber, holderName, issueDate, expiryDate,
            dscClass, dscType, issuingAuthority, purpose, dscPassword
        } = req.body;

        if (!clientId || !dscNumber || !holderName || !issueDate || !expiryDate) {
            return res.status(400).json({ message: 'clientId, dscNumber, holderName, issueDate, expiryDate are required' });
        }

        const expiry = new Date(expiryDate);
        const dscStatus = computeStatus(expiry);

        const dscData: Record<string, unknown> = {
            clientId,
            firmId: req.firmId,
            dscNumber: dscNumber.trim(),
            holderName: holderName.trim(),
            issueDate: new Date(issueDate),
            expiryDate: expiry,
            dscClass,
            dscType,
            issuingAuthority,
            purpose,
            dscStatus,
            createdBy: req.user!.userId,
            auditLog: [{
                accessedBy: req.user!.userId,
                action: 'CREATE',
                accessedAt: new Date(),
                ipAddress: req.ip || 'unknown'
            }]
        };

        if (dscPassword) {
            dscData.dscPasswordEncrypted = encrypt(dscPassword);
        }

        const dsc = new DSC(dscData);
        await dsc.save();

        const saved = await DSC.findById(dsc._id)
            .populate('clientId', 'name email phone panNumber')
            .select('-dscPasswordEncrypted');

        res.status(201).json(saved);
    } catch (error) {
        console.error('Create DSC error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/dsc/:id/audit-log  (before /:id to avoid conflict) ─────────────
router.get('/:id/audit-log', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;
        const dsc = await DSC.findOne({ _id: req.params.id, firmId: req.firmId })
            .populate('auditLog.accessedBy', 'name email role')
            .select('auditLog dscNumber holderName');

        if (!dsc) return res.status(404).json({ message: 'DSC not found' });
        res.json(dsc);
    } catch (error) {
        console.error('DSC audit log error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /api/dsc/:id/view-password — secure password reveal ────────────────
router.post('/:id/view-password', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;

        const dsc = await DSC.findOne({ _id: req.params.id, firmId: req.firmId })
            .select('+dscPasswordEncrypted');

        if (!dsc) return res.status(404).json({ message: 'DSC not found' });

        if (!dsc.dscPasswordEncrypted) {
            return res.status(404).json({ message: 'No password stored for this DSC' });
        }

        let plainPassword: string;
        try {
            plainPassword = decrypt(dsc.dscPasswordEncrypted);
        } catch {
            return res.status(500).json({ message: 'Failed to decrypt password' });
        }

        // Audit log
        dsc.auditLog.push({
            accessedBy: new mongoose.Types.ObjectId(req.user!.userId),
            accessedAt: new Date(),
            ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
            action: 'VIEW_PASSWORD'
        });
        await dsc.save();

        // Email alert to all admins
        try {
            const User = (req as any).models.User;
            const [adminUsers, accessingUser] = await Promise.all([
                User.find({ firmId: req.firmId, role: 'ADMIN' }).select('email name').lean(),
                User.findById(req.user!.userId).select('name email').lean()
            ]);

            for (const admin of adminUsers as { email?: string }[]) {
                if (!admin.email) continue;
                await sendEmail(
                    admin.email,
                    `⚠️ DSC Password Accessed — ${dsc.holderName}`,
                    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                        <div style="background:#ef4444;color:white;padding:20px;border-radius:8px 8px 0 0">
                            <h2 style="margin:0">🔐 DSC Password Access Alert</h2>
                        </div>
                        <div style="background:#fff;border:1px solid #e2e8f0;padding:24px;border-radius:0 0 8px 8px">
                            <p>A DSC password was accessed on your CA platform.</p>
                            <table style="width:100%;border-collapse:collapse">
                                <tr><td style="padding:8px;color:#64748b;font-weight:600">DSC Holder</td><td style="padding:8px">${dsc.holderName}</td></tr>
                                <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-weight:600">DSC Number</td><td style="padding:8px">${dsc.dscNumber}</td></tr>
                                <tr><td style="padding:8px;color:#64748b;font-weight:600">Accessed By</td><td style="padding:8px">${(accessingUser as { name?: string } | null)?.name || req.user!.userId}</td></tr>
                                <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b;font-weight:600">Time</td><td style="padding:8px">${new Date().toLocaleString('en-IN')}</td></tr>
                                <tr><td style="padding:8px;color:#64748b;font-weight:600">IP Address</td><td style="padding:8px">${req.ip || 'unknown'}</td></tr>
                            </table>
                        </div>
                    </div>`
                );
            }
        } catch (emailErr) {
            console.error('Audit email failed (non-fatal):', emailErr);
        }

        res.json({ password: plainPassword! });
    } catch (error) {
        console.error('View DSC password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PUT /api/dsc/:id  — update ──────────────────────────────────────────────
router.put('/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;

        const existing = await DSC.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!existing) return res.status(404).json({ message: 'DSC not found' });

        const { dscPassword, expiryDate, ...rest } = req.body;
        const updates: Record<string, unknown> = { ...rest };

        if (expiryDate) {
            updates.expiryDate = new Date(expiryDate);
            updates.dscStatus = computeStatus(updates.expiryDate as Date);
            updates.reminderSent30 = false;
            updates.reminderSent7 = false;
            updates.reminderSentExpiry = false;
        }

        if (dscPassword) {
            updates.dscPasswordEncrypted = encrypt(dscPassword);
        }

        updates.$push = {
            auditLog: {
                accessedBy: req.user!.userId,
                action: 'UPDATE',
                accessedAt: new Date(),
                ipAddress: req.ip || 'unknown'
            }
        };

        const updated = await DSC.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('clientId', 'name email phone panNumber')
            .select('-dscPasswordEncrypted');

        res.json(updated);
    } catch (error) {
        console.error('Update DSC error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE /api/dsc/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const DSC = (req as any).models.DSC;
        const dsc = await DSC.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        if (!dsc) return res.status(404).json({ message: 'DSC not found' });
        res.json({ message: 'DSC record deleted successfully' });
    } catch (error) {
        console.error('Delete DSC error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
