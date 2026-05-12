import { Router, Response } from 'express';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { TDS_SECTIONS } from '../models/TDSEntry';

const router = Router();
router.use(authenticate);

// ─── Helper: Get current FY ──────────────────────────────────────────────────
function getCurrentFY(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 4) return `${year}-${(year + 1).toString().slice(2)}`;
    return `${year - 1}-${year.toString().slice(2)}`;
}

// ─── Helper: Get quarter from month ──────────────────────────────────────────
function getQuarter(month: number): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    if (month >= 4 && month <= 6)   return 'Q1';
    if (month >= 7 && month <= 9)   return 'Q2';
    if (month >= 10 && month <= 12) return 'Q3';
    return 'Q4'; // Jan-Mar
}

// ─── Helper: Get TDS return due date ─────────────────────────────────────────
function getReturnDueDate(fy: string, quarter: string): Date {
    const startYear = parseInt(fy.split('-')[0]);
    switch (quarter) {
        case 'Q1': return new Date(startYear, 6, 31);     // 31 Jul
        case 'Q2': return new Date(startYear, 9, 31);     // 31 Oct
        case 'Q3': return new Date(startYear + 1, 0, 31); // 31 Jan
        case 'Q4': return new Date(startYear + 1, 4, 31); // 31 May
        default:   return new Date();
    }
}

// ─── Helper: Derive form type from section ───────────────────────────────────
function deriveFormType(section: string, nature: string): '24Q' | '26Q' | '27Q' | '27EQ' {
    if (section === '192' || nature === 'salary') return '24Q';
    if (section === '195') return '27Q';
    if (nature === 'tcs' || section === '206C') return '27EQ';
    return '26Q';
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/dashboard', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry  = (req as any).models.TDSEntry;
        const TDSReturn = (req as any).models.TDSReturn;
        const firmId = req.firmId;
        const fy = (req.query.fy as string) || getCurrentFY();

        const [
            totalEntries,
            totalPendingChallans,
            totalPaidChallans,
            totalOverdueChallans,
            totalReturnsNotFiled,
            totalReturnsFiled,
        ] = await Promise.all([
            TDSEntry.countDocuments({ firmId, financialYear: fy }),
            TDSEntry.countDocuments({ firmId, financialYear: fy, challanStatus: 'pending' }),
            TDSEntry.countDocuments({ firmId, financialYear: fy, challanStatus: 'paid' }),
            TDSEntry.countDocuments({ firmId, financialYear: fy, challanStatus: 'overdue' }),
            TDSReturn.countDocuments({ firmId, financialYear: fy, status: 'not_filed' }),
            TDSReturn.countDocuments({ firmId, financialYear: fy, status: { $in: ['filed', 'revised', 'processed', 'correction_filed'] } }),
        ]);

        // Aggregate totals
        const amountAgg = await TDSEntry.aggregate([
            { $match: { firmId: (req as any).firmObjectId || firmId, financialYear: fy } },
            { $group: {
                _id: null,
                totalTDS: { $sum: '$totalTax' },
                totalGross: { $sum: '$grossAmount' },
                totalPaidChallan: {
                    $sum: { $cond: [{ $eq: ['$challanStatus', 'paid'] }, '$totalTax', 0] }
                },
                totalPendingChallan: {
                    $sum: { $cond: [{ $ne: ['$challanStatus', 'paid'] }, '$totalTax', 0] }
                }
            }}
        ]);

        const amounts = amountAgg[0] || { totalTDS: 0, totalGross: 0, totalPaidChallan: 0, totalPendingChallan: 0 };

        // Section-wise breakdown
        const sectionBreakdown = await TDSEntry.aggregate([
            { $match: { firmId: (req as any).firmObjectId || firmId, financialYear: fy } },
            { $group: {
                _id: '$section',
                count: { $sum: 1 },
                totalTDS: { $sum: '$totalTax' },
                totalGross: { $sum: '$grossAmount' }
            }},
            { $sort: { totalTDS: -1 } },
            { $limit: 10 }
        ]);

        // Upcoming due dates (returns not filed with due date approaching)
        const upcomingReturns = await TDSReturn.find({
            firmId,
            status: 'not_filed',
            dueDate: { $gte: new Date() }
        })
            .populate('clientId', 'name email panNumber')
            .sort({ dueDate: 1 })
            .limit(10)
            .lean();

        // Overdue returns
        const overdueReturns = await TDSReturn.find({
            firmId,
            status: 'not_filed',
            dueDate: { $lt: new Date() }
        })
            .populate('clientId', 'name email panNumber')
            .sort({ dueDate: 1 })
            .lean();

        // Recent entries
        const recentEntries = await TDSEntry.find({ firmId, financialYear: fy })
            .populate('clientId', 'name email panNumber')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            financialYear: fy,
            counts: {
                totalEntries,
                pendingChallans: totalPendingChallans,
                paidChallans: totalPaidChallans,
                overdueChallans: totalOverdueChallans,
                returnsNotFiled: totalReturnsNotFiled,
                returnsFiled: totalReturnsFiled,
            },
            amounts,
            sectionBreakdown: sectionBreakdown.map((s: any) => ({
                ...s,
                sectionLabel: TDS_SECTIONS[s._id] || s._id
            })),
            upcomingReturns,
            overdueReturns,
            recentEntries,
        });
    } catch (error) {
        console.error('TDS dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TDS ENTRIES — CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/tds/entries — list with filters ────────────────────────────────
router.get('/entries', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry = (req as any).models.TDSEntry;
        const { fy, quarter, clientId, section, challanStatus, search, formType } = req.query;

        const filter: Record<string, unknown> = { firmId: req.firmId };
        if (fy)            filter.financialYear = fy;
        if (quarter)       filter.quarter = quarter;
        if (clientId)      filter.clientId = clientId;
        if (section)       filter.section = section;
        if (challanStatus) filter.challanStatus = challanStatus;
        if (formType)      filter.formType = formType;
        if (search) {
            filter.$or = [
                { deducteeName: { $regex: search, $options: 'i' } },
                { deducteePAN:  { $regex: search, $options: 'i' } },
                { challanNo:    { $regex: search, $options: 'i' } },
            ];
        }

        const entries = await TDSEntry.find(filter)
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .sort({ deductionDate: -1 })
            .lean();

        res.json(entries);
    } catch (error) {
        console.error('Get TDS entries error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /api/tds/entries — create ─────────────────────────────────────────
router.post('/entries', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry = (req as any).models.TDSEntry;

        const {
            clientId, deducteeName, deducteePAN, deducteeType,
            section, nature, grossAmount, tdsRate, tdsAmount,
            surcharge, educationCess, deductionDate, paymentDate,
            challanNo, bsrCode, challanDate, challanStatus,
            financialYear, month, remarks,
            certificateNo, certificateDate, certificateIssued
        } = req.body;

        if (!clientId || !deducteeName || !deducteePAN || !section || !grossAmount || !deductionDate) {
            return res.status(400).json({
                message: 'clientId, deducteeName, deducteePAN, section, grossAmount, and deductionDate are required'
            });
        }

        const sectionLabel = TDS_SECTIONS[section] || section;
        const entryNature = nature || (section === '192' ? 'salary' : section === '206C' ? 'tcs' : 'non_salary');
        const formType = deriveFormType(section, entryNature);
        const fy = financialYear || getCurrentFY();
        const entryMonth = month || (new Date(deductionDate).getMonth() + 1);
        const quarter = getQuarter(entryMonth);
        const startYear = parseInt(fy.split('-')[0]);
        const assessmentYear = `${startYear + 1}-${(startYear + 2).toString().slice(2)}`;

        const computedTdsAmount = tdsAmount || (grossAmount * (tdsRate || 0) / 100);
        const computedSurcharge = surcharge || 0;
        const computedCess = educationCess || (computedTdsAmount * 0.04); // 4% cess
        const totalTax = computedTdsAmount + computedSurcharge + computedCess;

        const entry = new TDSEntry({
            firmId: req.firmId,
            clientId,
            deducteeName: deducteeName.trim(),
            deducteePAN: deducteePAN.trim().toUpperCase(),
            deducteeType: deducteeType || 'individual',
            section,
            sectionLabel,
            nature: entryNature,
            formType,
            grossAmount,
            tdsRate: tdsRate || 0,
            tdsAmount: computedTdsAmount,
            surcharge: computedSurcharge,
            educationCess: computedCess,
            totalTax,
            deductionDate: new Date(deductionDate),
            paymentDate: paymentDate ? new Date(paymentDate) : undefined,
            challanNo,
            bsrCode,
            challanDate: challanDate ? new Date(challanDate) : undefined,
            challanStatus: challanStatus || 'pending',
            financialYear: fy,
            assessmentYear,
            quarter,
            month: entryMonth,
            certificateNo,
            certificateDate: certificateDate ? new Date(certificateDate) : undefined,
            certificateIssued: certificateIssued || false,
            remarks,
            createdBy: req.user!.userId,
        });

        await entry.save();

        const saved = await TDSEntry.findById(entry._id)
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .lean();

        res.status(201).json(saved);
    } catch (error) {
        console.error('Create TDS entry error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PUT /api/tds/entries/:id — update ──────────────────────────────────────
router.put('/entries/:id', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry = (req as any).models.TDSEntry;

        const existing = await TDSEntry.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!existing) return res.status(404).json({ message: 'TDS entry not found' });

        const updates = { ...req.body };

        // Recompute section label if section changed
        if (updates.section) {
            updates.sectionLabel = TDS_SECTIONS[updates.section] || updates.section;
            updates.formType = deriveFormType(
                updates.section,
                updates.nature || existing.nature
            );
        }

        // Recompute totals if amounts changed
        if (updates.grossAmount !== undefined || updates.tdsRate !== undefined || updates.tdsAmount !== undefined) {
            const gross  = updates.grossAmount ?? existing.grossAmount;
            const rate   = updates.tdsRate     ?? existing.tdsRate;
            const tds    = updates.tdsAmount   ?? (gross * rate / 100);
            const sur    = updates.surcharge   ?? existing.surcharge;
            const cess   = updates.educationCess ?? (tds * 0.04);
            updates.tdsAmount     = tds;
            updates.surcharge     = sur;
            updates.educationCess = cess;
            updates.totalTax      = tds + sur + cess;
        }

        // Recompute quarter if month changed
        if (updates.month) {
            updates.quarter = getQuarter(updates.month);
        }

        // Convert dates
        if (updates.deductionDate)   updates.deductionDate = new Date(updates.deductionDate);
        if (updates.paymentDate)     updates.paymentDate   = new Date(updates.paymentDate);
        if (updates.challanDate)     updates.challanDate   = new Date(updates.challanDate);
        if (updates.certificateDate) updates.certificateDate = new Date(updates.certificateDate);

        const updated = await TDSEntry.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .lean();

        res.json(updated);
    } catch (error) {
        console.error('Update TDS entry error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE /api/tds/entries/:id ─────────────────────────────────────────────
router.delete('/entries/:id', requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry = (req as any).models.TDSEntry;
        const entry = await TDSEntry.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        if (!entry) return res.status(404).json({ message: 'TDS entry not found' });
        res.json({ message: 'TDS entry deleted successfully' });
    } catch (error) {
        console.error('Delete TDS entry error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TDS RETURNS — CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /api/tds/returns — list ─────────────────────────────────────────────
router.get('/returns', requireRoles(['ADMIN', 'MANAGER', 'STAFF']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSReturn = (req as any).models.TDSReturn;
        const { fy, quarter, clientId, status, formType } = req.query;

        const filter: Record<string, unknown> = { firmId: req.firmId };
        if (fy)       filter.financialYear = fy;
        if (quarter)  filter.quarter = quarter;
        if (clientId) filter.clientId = clientId;
        if (status)   filter.status = status;
        if (formType) filter.formType = formType;

        const returns = await TDSReturn.find(filter)
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .sort({ dueDate: -1 })
            .lean();

        // Update overdue status
        const now = new Date();
        for (const r of returns) {
            if (r.status === 'not_filed' && new Date(r.dueDate) < now) {
                (r as any).isOverdue = true;
            }
        }

        res.json(returns);
    } catch (error) {
        console.error('Get TDS returns error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── POST /api/tds/returns — create ─────────────────────────────────────────
router.post('/returns', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSReturn = (req as any).models.TDSReturn;
        const TDSEntry  = (req as any).models.TDSEntry;

        const {
            clientId, formType, financialYear, quarter,
            status, filingDate, acknowledgementNo, tokenNo,
            provisionalReceiptNo, remarks, lateFilingFee, interest234A
        } = req.body;

        if (!clientId || !formType || !financialYear || !quarter) {
            return res.status(400).json({
                message: 'clientId, formType, financialYear, and quarter are required'
            });
        }

        // Check if already exists
        const existing = await TDSReturn.findOne({
            firmId: req.firmId, clientId, formType, financialYear, quarter, isRevised: false
        });
        if (existing) {
            return res.status(409).json({
                message: `TDS Return for ${formType} ${quarter} ${financialYear} already exists for this client. Use update instead.`,
                existingId: existing._id
            });
        }

        const startYear = parseInt(financialYear.split('-')[0]);
        const assessmentYear = `${startYear + 1}-${(startYear + 2).toString().slice(2)}`;
        const dueDate = getReturnDueDate(financialYear, quarter);

        // Compute totals from entries
        const entryAgg = await TDSEntry.aggregate([
            {
                $match: {
                    firmId: (req as any).firmObjectId || req.firmId,
                    clientId: clientId,
                    financialYear,
                    quarter,
                    formType
                }
            },
            {
                $group: {
                    _id: null,
                    totalDeductions: { $sum: 1 },
                    totalTDSAmount: { $sum: '$totalTax' },
                    totalChallanAmount: { $sum: { $cond: [{ $eq: ['$challanStatus', 'paid'] }, '$totalTax', 0] } }
                }
            }
        ]);

        const totals = entryAgg[0] || { totalDeductions: 0, totalTDSAmount: 0, totalChallanAmount: 0 };

        const tdsReturn = new TDSReturn({
            firmId: req.firmId,
            clientId,
            formType,
            financialYear,
            assessmentYear,
            quarter,
            status: status || 'not_filed',
            filingDate: filingDate ? new Date(filingDate) : undefined,
            acknowledgementNo,
            tokenNo,
            provisionalReceiptNo,
            dueDate,
            isOverdue: new Date() > dueDate && (status || 'not_filed') === 'not_filed',
            totalDeductions: totals.totalDeductions,
            totalTDSAmount: totals.totalTDSAmount,
            totalChallanAmount: totals.totalChallanAmount,
            totalEntries: totals.totalDeductions,
            lateFilingFee: lateFilingFee || 0,
            interest234A: interest234A || 0,
            remarks,
            createdBy: req.user!.userId,
        });

        await tdsReturn.save();

        const saved = await TDSReturn.findById(tdsReturn._id)
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .lean();

        res.status(201).json(saved);
    } catch (error) {
        console.error('Create TDS return error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── PUT /api/tds/returns/:id — update ──────────────────────────────────────
router.put('/returns/:id', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSReturn = (req as any).models.TDSReturn;

        const existing = await TDSReturn.findOne({ _id: req.params.id, firmId: req.firmId });
        if (!existing) return res.status(404).json({ message: 'TDS return not found' });

        const updates = { ...req.body };
        if (updates.filingDate)   updates.filingDate = new Date(updates.filingDate);

        // Auto-mark overdue
        if (updates.status === 'not_filed' && new Date(existing.dueDate) < new Date()) {
            updates.isOverdue = true;
        } else if (updates.status && updates.status !== 'not_filed') {
            updates.isOverdue = false;
        }

        const updated = await TDSReturn.findByIdAndUpdate(req.params.id, updates, { new: true })
            .populate('clientId', 'name email panNumber')
            .populate('createdBy', 'name email')
            .lean();

        res.json(updated);
    } catch (error) {
        console.error('Update TDS return error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── DELETE /api/tds/returns/:id ─────────────────────────────────────────────
router.delete('/returns/:id', requireRoles(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSReturn = (req as any).models.TDSReturn;
        const ret = await TDSReturn.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
        if (!ret) return res.status(404).json({ message: 'TDS return not found' });
        res.json({ message: 'TDS return deleted successfully' });
    } catch (error) {
        console.error('Delete TDS return error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORT CSV
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/export/csv', requireRoles(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const TDSEntry = (req as any).models.TDSEntry;
        const fy = (req.query.fy as string) || getCurrentFY();

        const entries = await TDSEntry.find({ firmId: req.firmId, financialYear: fy })
            .populate('clientId', 'name email panNumber')
            .sort({ deductionDate: 1 })
            .lean();

        const rows: string[][] = [
            ['Deductee Name', 'Deductee PAN', 'Section', 'Section Description', 'Form Type',
             'Gross Amount', 'TDS Rate (%)', 'TDS Amount', 'Surcharge', 'Cess', 'Total Tax',
             'Deduction Date', 'Challan No', 'BSR Code', 'Challan Date', 'Challan Status',
             'Quarter', 'Month', 'Financial Year', 'Client (Deductor)', 'Client PAN']
        ];

        for (const e of entries as any[]) {
            rows.push([
                e.deducteeName || '',
                e.deducteePAN || '',
                e.section || '',
                e.sectionLabel || '',
                e.formType || '',
                String(e.grossAmount || 0),
                String(e.tdsRate || 0),
                String(e.tdsAmount || 0),
                String(e.surcharge || 0),
                String(e.educationCess || 0),
                String(e.totalTax || 0),
                e.deductionDate ? new Date(e.deductionDate).toLocaleDateString('en-IN') : '',
                e.challanNo || '',
                e.bsrCode || '',
                e.challanDate ? new Date(e.challanDate).toLocaleDateString('en-IN') : '',
                e.challanStatus || '',
                e.quarter || '',
                String(e.month || ''),
                e.financialYear || '',
                e.clientId?.name || '',
                e.clientId?.panNumber || '',
            ]);
        }

        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tds-report-${fy}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('TDS export error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GET /api/tds/sections — list all TDS sections ──────────────────────────
router.get('/sections', async (_req: AuthRequest, res: Response) => {
    res.json(TDS_SECTIONS);
});

export default router;
