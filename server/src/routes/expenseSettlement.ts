import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';

const router = Router();

// ─── POST /expense-settlement ──────────────────────────────────────────────
// Create a new year-end settlement record (calculate shares)
router.post('/', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { ExpenseSettlement, Expense } = (req as any).models;
        const { year, partners, notes } = req.body;
        // year format: "2024-25" (financial year)
        // partners: [{ userId, name, sharePercent, amountPaid }]

        if (!year || !partners || !Array.isArray(partners) || partners.length === 0) {
            return res.status(400).json({ message: 'Year and partner details are required' });
        }

        const totalShares = partners.reduce((sum: number, p: any) => sum + Number(p.sharePercent), 0);
        if (Math.abs(totalShares - 100) > 0.01) {
            return res.status(400).json({ message: `Partner shares must sum to 100%. Currently: ${totalShares}%` });
        }

        // Derive calendar year range from financial year (e.g., 2024-25 → Apr 2024 – Mar 2025)
        const [startYr] = year.split('-');
        const startYear = parseInt(startYr);
        const startDate = new Date(`${startYear}-04-01`);
        const endDate = new Date(`${startYear + 1}-03-31T23:59:59`);

        // Sum all APPROVED expenses for this financial year
        const approvedExpenses = await Expense.find({
            firmId: req.firmId,
            status: 'APPROVED',
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        const totalExpense = approvedExpenses.reduce((sum: number, e: any) => sum + (e.totalAmount || e.amount || 0), 0);

        // Build partner breakdown
        const partnerData = partners.map((p: any) => {
            const sharePercent = Number(p.sharePercent);
            const shareAmount = parseFloat(((totalExpense * sharePercent) / 100).toFixed(2));
            const amountPaid = Number(p.amountPaid || 0);
            const balance = parseFloat((shareAmount - amountPaid).toFixed(2));
            return {
                ...(p.userId && p.userId !== '' ? { userId: p.userId } : {}), // only set if valid
                name: p.name,
                sharePercent,
                shareAmount,
                amountPaid,
                balance,
            };
        });

        // Determine status
        const totalPaid = partnerData.reduce((s: number, p: any) => s + p.amountPaid, 0);
        let status = 'OPEN';
        if (totalPaid >= totalExpense) status = 'SETTLED';
        else if (totalPaid > 0) status = 'PARTIAL';

        // Auto-generate ID
        const count = await ExpenseSettlement.countDocuments({ firmId: req.firmId });
        const settlementId = `SET-${year}-${String(count + 1).padStart(3, '0')}`;

        const settlement = new ExpenseSettlement({
            settlementId,
            year,
            totalExpense,
            partners: partnerData,
            status,
            settledOn: status === 'SETTLED' ? new Date() : undefined,
            settledBy: status === 'SETTLED' ? req.user!._id : undefined,
            notes,
            firmId: req.firmId,
        });

        await settlement.save();
        return res.status(201).json(settlement);
    } catch (error: any) {
        console.error('Settlement create error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// ─── GET /expense-settlement ───────────────────────────────────────────────
// Get all settlements for this firm
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { ExpenseSettlement } = (req as any).models;
        const { year } = req.query;
        const query: any = { firmId: req.firmId };
        if (year) query.year = year;

        const settlements = await ExpenseSettlement.find(query)
            .populate('settledBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ data: settlements });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── GET /expense-settlement/preview ──────────────────────────────────────
// Preview expense totals for a year without saving
router.get('/preview', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const { year } = req.query; // "2024-25"
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const [startYr] = (year as string).split('-');
        const startYear = parseInt(startYr);
        const startDate = new Date(`${startYear}-04-01`);
        const endDate = new Date(`${startYear + 1}-03-31T23:59:59`);

        const approvedExpenses = await Expense.find({
            firmId: req.firmId,
            status: 'APPROVED',
            date: { $gte: startDate, $lte: endDate }
        }).lean();

        const totalExpense = approvedExpenses.reduce((sum: number, e: any) => sum + (e.totalAmount || e.amount || 0), 0);
        const byCategory: Record<string, number> = {};
        const byMonth: Record<string, number> = {};

        approvedExpenses.forEach((e: any) => {
            if (e.category) byCategory[e.category] = (byCategory[e.category] || 0) + (e.totalAmount || e.amount);
            if (e.monthWise) byMonth[e.monthWise] = (byMonth[e.monthWise] || 0) + (e.totalAmount || e.amount);
        });

        return res.status(200).json({
            year,
            totalExpense,
            expenseCount: approvedExpenses.length,
            byCategory,
            byMonth,
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── PATCH /expense-settlement/:id/settle ─────────────────────────────────
// Mark a settlement as SETTLED and record payment details
router.patch('/:id/settle', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { ExpenseSettlement } = (req as any).models;
        const { paymentMode, paymentReference, partners, notes } = req.body;

        const settlement = await ExpenseSettlement.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!settlement) return res.status(404).json({ message: 'Settlement not found' });

        // Update partner payments if provided
        if (partners && Array.isArray(partners)) {
            partners.forEach((p: any) => {
                const existing = settlement.partners.find((sp: any) => sp.userId.toString() === p.userId);
                if (existing) {
                    existing.amountPaid = Number(p.amountPaid);
                    existing.balance = parseFloat((existing.shareAmount - existing.amountPaid).toFixed(2));
                }
            });
        }

        const totalPaid = settlement.partners.reduce((s: number, p: any) => s + p.amountPaid, 0);
        settlement.status = totalPaid >= settlement.totalExpense ? 'SETTLED' : 'PARTIAL';
        settlement.settledOn = new Date();
        settlement.settledBy = req.user!._id;
        settlement.paymentMode = paymentMode;
        settlement.paymentReference = paymentReference;
        if (notes) settlement.notes = notes;

        await settlement.save();
        return res.status(200).json(settlement);
    } catch (error: any) {
        console.error('Settlement update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ─── DELETE /expense-settlement/:id ───────────────────────────────────────
router.delete('/:id', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { ExpenseSettlement } = (req as any).models;
        await ExpenseSettlement.deleteOne({ _id: req.params.id, firmId: req.firmId });
        return res.status(200).json({ message: 'Settlement deleted' });
    } catch (error: any) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
