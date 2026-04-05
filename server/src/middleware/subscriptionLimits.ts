import { Request, Response, NextFunction } from 'express';
import { Firm } from '../models/Firm';
import { Plan } from '../models/Plan';
import { Addon } from '../models/Addon';

export const checkPlanLimits = (limitType: 'clients' | 'staff' | 'storageGB') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId = (req as any).tenantId;
            if (!tenantId) {
                return res.status(400).json({ message: 'Tenant context is missing.' });
            }

            const firm = await Firm.findById(tenantId).populate('subscription.planId');
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
                // Populate addons to get values
                for (const fa of firm.addons) {
                    const addon = await Addon.findById(fa.addonId);
                    if (addon) {
                        if (limitType === 'storageGB' && addon.type === 'STORAGE') {
                            addOnLimit += (addon.value || 0) * fa.quantity;
                        }
                    }
                }
            }

            const limit = plan.limits[limitType] + addOnLimit;
            if (currentUsage >= limit) {
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
            const tenantId = (req as any).tenantId;
            if (!tenantId) return res.status(400).json({ message: 'Missing tenant context' });

            const firm = await Firm.findById(tenantId).populate('subscription.planId');
            if (!firm || !firm.subscription?.planId) {
                return res.status(403).json({ message: 'No active plan.' });
            }

            // Expiry Check
            if (firm.subscription.endDate && new Date(firm.subscription.endDate) < new Date()) {
                 return res.status(403).json({ 
                    message: `Plan expired on ${firm.subscription.endDate.toDateString()}. Please upgrade.`,
                    code: 'PLAN_EXPIRED'
                 });
            }

            const plan = firm.subscription.planId as any;
            if (!plan.features[featureFlag]) {
                // Maybe it's unlocked via Addon
                let hasAddonFeature = false;
                if (featureFlag === 'cloudStorage' && firm.addons.some(a => a.addonId)) {
                   // need thorough check 
                }
                
                if (!hasAddonFeature) {
                    return res.status(403).json({
                        message: `Feature ${featureFlag} is not available in your current plan. Please upgrade.`
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Check feature error', error);
            res.status(500).json({ message: 'Internal Server Error checking feature Access' });
        }
    };
};
