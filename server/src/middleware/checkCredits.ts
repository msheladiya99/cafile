import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { CreditLedger, PLAN_LIMITS } from '../models/CreditLedger';

// ─── Check & Deduct Credits Middleware ───────────────────────────────────────
// Usage:
//   router.post('/upload-process', authenticate, checkCredits(1), ...)
//   router.post('/bulk/upload',    authenticate, checkCredits('bulk'), ...)

export function checkCredits(cost: number | 'bulk' = 1) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const firmId = req.firmId;
            if (!firmId) return res.status(401).json({ message: 'Firm context missing' });

            // Count files for bulk uploads
            const actualCost = cost === 'bulk'
                ? (Array.isArray(req.files) ? req.files.length : 1)
                : cost;

            // Find or create ledger
            let ledger = await CreditLedger.findOne({ firmId });
            if (!ledger) {
                ledger = await CreditLedger.create({
                    firmId,
                    planType:     'free',
                    monthlyLimit: PLAN_LIMITS.free,
                    usedThisMonth: 0,
                    totalAllotted:  PLAN_LIMITS.free,
                });
            }

            // Auto-reset monthly credits if past reset date
            const now = new Date();
            if (now >= ledger.resetDate) {
                ledger.usedThisMonth = 0;
                ledger.resetDate     = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                await ledger.save();
            }

            // Unlimited plan — skip all checks
            if (ledger.monthlyLimit === -1) {
                (req as any).creditLedger = ledger;
                (req as any).creditCost   = actualCost;
                return next();
            }

            // Check limit
            const remaining = ledger.monthlyLimit - ledger.usedThisMonth;
            if (remaining < actualCost) {
                return res.status(402).json({
                    message:      `Monthly credit limit reached. You have ${remaining} credit(s) remaining this month.`,
                    used:         ledger.usedThisMonth,
                    limit:        ledger.monthlyLimit,
                    planType:     ledger.planType,
                    upgradeUrl:   '/admin/billing',
                    resetsOn:     ledger.resetDate,
                });
            }

            // Attach ledger to request for post-processing deduction
            (req as any).creditLedger = ledger;
            (req as any).creditCost   = actualCost;
            next();

        } catch (err: any) {
            console.error('[Credits] Middleware error:', err.message);
            // Don't block on credit errors — log and continue
            next();
        }
    };
}

// ─── Helper: Deduct credits after successful processing ───────────────────────

export async function deductCredits(
    req: AuthRequest,
    statementId: string,
    type: 'statement' | 'bulk' | 'reprocess' = 'statement'
): Promise<void> {
    try {
        const ledger = (req as any).creditLedger;
        const cost   = (req as any).creditCost || 1;
        if (!ledger) return;

        ledger.usedThisMonth = (ledger.usedThisMonth || 0) + cost;
        ledger.totalUsed     = (ledger.totalUsed || 0)     + cost;
        ledger.transactions.push({
            statementId: statementId as any,
            creditsUsed: cost,
            type,
            description: `${type} processing`,
            timestamp:   new Date(),
        });

        await ledger.save();
    } catch (err: any) {
        console.error('[Credits] Deduction failed:', err.message);
    }
}
