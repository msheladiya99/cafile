import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        userId: string;
        role: UserRole;
        clientId?: string;
        permissions?: string[];
    };
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
            clientId?: string;
            permissions?: string[];
        };

        req.user = {
            _id: decoded.userId,
            ...decoded
        };
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

export const requireAdmin = requireRoles(['ADMIN']);
export const requireClient = requireRoles(['CLIENT']);
export const requireStaff = requireRoles(['ADMIN', 'MANAGER', 'STAFF', 'INTERN']);
