import { Router, Response } from 'express';
import multer from 'multer';
import { authenticate, AuthRequest, requireRoles } from '../middleware/auth';
import { getTenantDriveService } from '../services/googleDrive';

const router = Router();

// Store files in memory to upload to Google Drive
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limit
});

// ✅ CREATE Expense
router.post('/', authenticate, upload.single('billFile'), async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const body = req.body;

        // Validation for required fields
        if (!body.amount || !body.category || !body.paidBy) {
            return res.status(400).json({ message: 'Amount, category, and paidBy are required' });
        }

        // Auto-generate expenseId if not provided
        let expenseId = body.expenseId;
        if (!expenseId) {
            const count = await Expense.countDocuments({ firmId: req.firmId });
            expenseId = `EXP-${String(count + 1).padStart(4, '0')}`;
        }

        let receiptUrl = '';

        // If file is uploaded, upload to Google Drive under 'Expenses' folder
        if (req.file) {
            try {
                const driveService = getTenantDriveService(req.firm?.googleDriveRootFolderId);
                const expensesFolderId = await driveService.ensureFolder('Expenses', req.firm?.googleDriveRootFolderId!);
                
                const uploadedFile = await driveService.uploadFile(
                    req.file.buffer,
                    req.file.originalname,
                    req.file.mimetype,
                    expensesFolderId
                );
                
                receiptUrl = uploadedFile.webViewLink;
            } catch (error: any) {
                console.error('Failed to upload bill to Google Drive:', error);
                // Continue without file if needed, or error out
            }
        }

        const subtotal = Number(body.amount);
        const tax = Number(body.taxAmount || 0);
        const totalAmount = body.totalAmount ? Number(body.totalAmount) : (subtotal + tax);

        const newExpense = new Expense({
            ...body,
            expenseId,
            amount: subtotal,
            taxAmount: tax,
            totalAmount,
            reimbursementStatus: body.reimbursementStatus || 'NOT_APPLICABLE',
            date: body.date ? new Date(body.date) : new Date(),
            receiptUrl,
            firmId: req.firmId
        });

        await newExpense.save();
        return res.status(201).json(newExpense);
    } catch (error: any) {
        console.error('Error creating expense:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

// ✅ GET All Expenses (With Filters)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const { yearWise, monthWise, paidBy, category, status, expenseType, billableStatus } = req.query;

        const query: any = { firmId: req.firmId };
        
        if (yearWise) query.yearWise = yearWise;
        if (monthWise) query.monthWise = monthWise;
        if (paidBy) query.paidBy = paidBy;
        if (category) query.category = category;
        if (status) query.status = status;
        if (expenseType) query.expenseType = expenseType;
        if (billableStatus) query.billableStatus = billableStatus;

        const expenses = await Expense.find(query)
            .populate('paidBy', 'username firstName lastName email')
            .populate('approvedBy', 'username firstName lastName')
            .populate('reimbursedBy', 'username firstName lastName')
            .sort({ date: -1 })
            .lean();

        // Calculate totals dynamically using totalAmount
        const totalAmount = expenses.reduce((sum: number, exp: any) => sum + (exp.totalAmount || exp.amount), 0);
        const approvedAmount = expenses
            .filter((e: any) => e.status === 'APPROVED')
            .reduce((sum: number, exp: any) => sum + (exp.totalAmount || exp.amount), 0);

        return res.status(200).json({
            data: expenses,
            summary: {
                totalAmount,
                approvedAmount,
                count: expenses.length
            }
        });
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ UPDATE Expense Status (Approve/Reject)
router.patch('/:id/status', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: id, firmId: req.firmId },
            { 
                status,
                remarks,
                approvedBy: ['APPROVED', 'REJECTED'].includes(status) ? req.user!._id : undefined 
            },
            { new: true }
        ).populate('paidBy', 'firstName lastName').populate('approvedBy', 'firstName lastName');

        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        return res.status(200).json(expense);
    } catch (error: any) {
        console.error('Error updating expense status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ UPDATE Reimbursement Status (Mass Reimburse)
router.patch('/reimburse', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const { expenseIds, reimbursedBy } = req.body; // Array of expense _ids and optional admin ID

        if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
            return res.status(400).json({ message: 'No expenses provided' });
        }

        await Expense.updateMany(
            { _id: { $in: expenseIds }, firmId: req.firmId, reimbursementStatus: 'PENDING' },
            { 
                $set: { 
                    reimbursementStatus: 'REIMBURSED',
                    reimbursedAt: new Date(),
                    reimbursedBy: reimbursedBy || req.user!._id
                } 
            }
        );

        return res.status(200).json({ message: 'Expenses marked as reimbursed' });
    } catch (error: any) {
        console.error('Error reimbursing expenses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ DELETE Expense
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { Expense } = (req as any).models;
        const { id } = req.params;

        const expense = await Expense.findOne({ _id: id, firmId: req.firmId });
        
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Must be admin/manager or the person who created it
        const isEligible = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(req.user!.role) || 
                          expense.paidBy.toString() === req.user!._id.toString();

        if (!isEligible) {
            return res.status(403).json({ message: 'Unauthorized to delete this expense' });
        }

        await Expense.deleteOne({ _id: id });
        return res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
