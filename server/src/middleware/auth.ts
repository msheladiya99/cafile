import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requestContext } from '../utils/context';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        userId: string;
        role: UserRole;
        firmId?: string;
        clientId?: string;
        permissions?: string[];
    };
    firmId?: string; // from tenantMiddleware
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token = req.headers.authorization?.split(' ')[1];

        if (!token && req.query.token) {
            token = req.query.token as string;
        }

        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            role: UserRole;
            firmId?: string;
            clientId?: string;
            permissions?: string[];
        };

        // Strict Tenant Isolation Check
        // If the request has a firmId from subdomain, but the user belongs to another firm
        if (req.firmId && decoded.firmId && req.firmId !== decoded.firmId && decoded.role !== 'SUPER_ADMIN') {
            res.status(403).json({ message: 'Access denied. You do not belong to this firm.' });
            return;
        }

        // Check if firm is active (if it's a firm user)
        if (decoded.firmId && decoded.role !== 'SUPER_ADMIN') {
            // Re-use firm object from tenantMiddleware if it perfectly matches the user's firmId
            if ((req as any).firm && (req as any).firmId === decoded.firmId) {
                if ((req as any).firm.status !== 'active') {
                    res.status(403).json({ message: 'Access denied. This workspace is suspended or inactive.' });
                    return;
                }
            } else {
                // Fallback db lookup if firm wasn't loaded by tenant middleware
                const { Firm } = require('../models/Firm');
                const firm = await Firm.findById(decoded.firmId).lean();
                if (!firm || firm.status !== 'active') {
                    res.status(403).json({ message: 'Access denied. This workspace is suspended or inactive.' });
                    return;
                }
            }
        }

        req.user = {
            _id: decoded.userId,
            ...decoded
        };

        // If it's a Super Admin, we run in a special 'ROOT' context to allow 
        // access to global records (where firmId is null)
        if (decoded.role === 'SUPER_ADMIN') {
            requestContext.run({ firmId: 'ROOT' }, () => {
                next();
            });
            return;
        }

        // If tenantMiddleware didn't set firmId (e.g. main domain login),
        // but the user belongs to a firm, set it now to ensure isolation.
        if (!req.firmId && decoded.firmId) {
            req.firmId = decoded.firmId;
            requestContext.run({ firmId: req.firmId }, () => {
                next();
            });
            return;
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const requireRoles = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: `Access denied. Requires one of the following roles: ${roles.join(', ')}` });
            return;
        }
        next();
    };
};

export const requireSuperAdmin = requireRoles(['SUPER_ADMIN']);
export const requireAdmin = requireRoles(['ADMIN']);
export const requireClient = requireRoles(['CLIENT']);
export const requireStaff = requireRoles(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'INTERN']);
