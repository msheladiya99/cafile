import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

        req.user = {
            _id: decoded.userId,
            ...decoded
        };

        // If tenantMiddleware didn't set firmId (e.g. main domain login),
        // but the user belongs to a firm, set it now to ensure isolation.
        if (!req.firmId && decoded.firmId) {
            req.firmId = decoded.firmId;
            const { requestContext } = require('../utils/context');
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
