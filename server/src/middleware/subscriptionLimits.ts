import { Request, Response, NextFunction } from 'express';
import { Firm } from '../models/Firm';
import { Plan } from '../models/Plan';
import { Addon } from '../models/Addon';

export const checkPlanLimits = (limitType: 'clients' | 'staff' | 'storageGB') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const firmId = (req as any).firmId || (req as any).user?.firmId || (require('../utils/context').getFirmId)();
            console.log(`🔍 [checkPlanLimits] firmId: ${firmId}, userFirmId: ${(req as any).user?.firmId}, reqFirmId: ${(req as any).firmId}`);
            if (!firmId) {
                return res.status(400).json({ message: `!!! Tenant context missing (Plan Check) !!! firmId: ${firmId}` });
            }

            const firm = await Firm.findById(firmId).populate('subscription.planId');
            if (!firm) {
                return res.status(404).json({ message: 'Firm not found.' });
            }

            if (!firm.subscription?.planId) {
                // Return a generic fallback error or continue
                return res.status(403).json({ message: 'No active plan. Please subscribe.' });
            }

            // Expiry Check
            if (firm.subscription.endDate && new Date(firm.subscription.endDate) < new Date()) {
                 return res.status(403).json({ 
                    message: `Plan expired on ${firm.subscription.endDate.toDateString()}. Please upgrade.`,
                    code: 'PLAN_EXPIRED'
                 });
            }

            const plan = firm.subscription.planId as any;
            let currentUsage = 0;
            const models = (req as any).tenantModels;

            if (limitType === 'clients' && models && models.Client) {
                currentUsage = await models.Client.countDocuments();
            } else if (limitType === 'staff' && models && models.User) {
                currentUsage = await models.User.countDocuments({ role: { $ne: 'CLIENT' } });
            } else if (limitType === 'storageGB' && models && models.File) {
                // Example of calculating storage logic
                // For simplicity, just skip actual GB calculate if files length / something
                currentUsage = 0; 
            }

            // Add-ons value
            let addOnLimit = 0;
            if (firm.addons && firm.addons.length > 0) {
                for (const fa of firm.addons) {
                    // Check if addon is expired
                    if (fa.expiryDate && new Date(fa.expiryDate) < new Date()) continue;

                    const addon = await Addon.findById(fa.addonId);
                    if (addon) {
                        if (limitType === 'storageGB' && (addon.type === 'STORAGE' || addon.type === 'DATABASE')) {
                            addOnLimit += (addon.value || 0) * fa.quantity;
                        }
                    }
                }
            }

            const limit = (plan.limits?.[limitType] || 0) + addOnLimit;
            if (limit > 0 && currentUsage >= limit) {
                return res.status(403).json({
                    message: `Limit reached for ${limitType}. Up to ${limit} allowed. Upgrade your plan.`
                });
            }

            next();
        } catch (error) {
            console.error('Check plan limits error', error);
            res.status(500).json({ message: 'Internal Server Error validating limits' });
        }
    };
};

export const checkFeatureAccess = (featureFlag: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const firmId = (req as any).firmId || (req as any).user?.firmId || (require('../utils/context').getFirmId)();
            if (!firmId) return res.status(400).json({ 
                message: `!!! Missing tenant context (DSC Access) !!! Detected firmId: ${firmId}. Path: ${req.originalUrl}` 
            });

            const firm = await Firm.findById(firmId).populate('subscription.planId');
            if (!firm) return res.status(404).json({ message: 'Firm not found' });

            // Super Admin bypass
            if (firm.plan === 'enterprise') return next();

            // Check Plan Features
            const plan = firm.subscription?.planId as any;
            if (plan && plan.features?.[featureFlag]) return next();

            // ── Check Add-ons for Feature Unlocking ──
            if (firm.addons && firm.addons.length > 0) {
                // Populate or find relevant addons
                for (const fa of firm.addons) {
                    // Expiry Check
                    if (fa.expiryDate && new Date(fa.expiryDate) < new Date()) continue;

                    const addon = await Addon.findById(fa.addonId);
                    if (!addon || !addon.isActive) continue;

                    // Mapping Addon types to feature flags
                    const typeToFeature: Record<string, string> = {
                        'STORAGE':  'cloudStorage',
                        'DATABASE': 'personalDrive',
                        'WHATSAPP': 'whatsappAI',
                        'REPORTS':  'advancedReports',
                        'DSC':      'dscBulk',
                    };

                    if (typeToFeature[addon.type || ''] === featureFlag) {
                        return next(); // Unlocked via Addon!
                    }
                }
            }

            return res.status(403).json({
                message: `Feature ${featureFlag} is not available in your current plan. Please upgrade or purchase the relevant add-on.`
            });
        } catch (error) {
            console.error('Check feature error', error);
            res.status(500).json({ message: 'Internal Server Error checking feature Access' });
        }
    };
};
