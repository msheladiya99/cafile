import { Request, Response, NextFunction } from 'express';
import { Connection } from 'mongoose';
import { Firm } from '../models/Firm';
import { requestContext } from '../utils/context';
import { getTenantConnection } from '../services/dbManager';

// ── In-memory firm cache to avoid a DB hit on every request ──────────────────
const FIRM_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
interface CachedFirm { firm: any; expiresAt: number; }
const firmCache = new Map<string, CachedFirm>();

// Evict a firm from cache (call after firm status changes)
export const evictFirmCache = (subdomain: string) => firmCache.delete(subdomain);

async function getFirmBySubdomain(subdomain: string) {
    const cached = firmCache.get(subdomain);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.firm;
    }
    const firm = await Firm.findOne({ subdomain, status: 'active' }).lean();
    if (firm) {
        firmCache.set(subdomain, { firm, expiresAt: Date.now() + FIRM_CACHE_TTL });
    }
    return firm;
}
// ─────────────────────────────────────────────────────────────────────────────

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            firmId?: string;
            firm?: any;
            db?: Connection;
        }
    }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get host from headers
    const host = req.headers.host || '';

    // 2. Extract subdomain
    let subdomain = '';

    // Check custom header first (useful for local dev and API stability)
    const headerTenant = req.headers['x-tenant-id'];
    if (headerTenant && typeof headerTenant === 'string') {
        subdomain = headerTenant.toLowerCase();
    } else {
        const hostname = host.split(':')[0].toLowerCase();

        if (!/^[\d.]+$/.test(hostname)) {
            const bases = ['mycafile.in', 'vercel.app', 'onrender.com', 'localhost'];
            let foundBase = '';
            for (const b of bases) {
                if (hostname.endsWith(b)) {
                    foundBase = b;
                    break;
                }
            }

            if (foundBase) {
                const subStr = hostname.replace(`.${foundBase}`, '').replace(foundBase, '');
                if (subStr && subStr !== 'www') {
                    subdomain = subStr;
                }
            } else {
                const parts = hostname.split('.');
                if (parts.length >= 3) {
                    subdomain = parts.slice(0, parts.length - 2).join('.');
                }
            }
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        // console.log('🔍 Tenant Subdomain:', subdomain || 'ROOT/NONE', 'Host:', host);
    }

    // Skip middleware for:
    if (
        req.path.startsWith('/super-admin') ||
        req.baseUrl.startsWith('/api/super-admin') ||
        !subdomain ||
        ['www', 'api', 'admin', 'superadmin', 'super-admin', 'localhost', 'mycafile'].includes(subdomain)
    ) {
        return next();
    }

    try {
        // 3. Find firm in master database
        const firm = await getFirmBySubdomain(subdomain);

        if (!firm) {
            console.log('❌ Firm not found for subdomain:', subdomain);
            return res.status(404).json({ message: 'Firm not found' });
        }

        // 4. BYODB: Only create a separate connection for personal DB tenants.
        //    Default tenants use the main mongoose connection (data is in ca-office DB, scoped by firmId).
        if (firm.dbType === 'personal') {
            try {
                const tenantConn = await getTenantConnection(firm);
                req.db = tenantConn;
            } catch (dbError: any) {
                console.error(`❌ Personal DB Connection Error for "${subdomain}":`, dbError.message);
                return res.status(503).json({
                    message: 'Your firm\'s personal database is unavailable. Please contact support.',
                    error: dbError.message
                });
            }
        }
        // For dbType === 'default': req.db stays undefined → routes use main User model ✅

        // 5. Attach firmId to request context
        req.firmId = (firm._id as any).toString();
        req.firm = firm;

        // Wrap the rest of the request in the context
        requestContext.run({ firmId: req.firmId, rootFolderId: firm.googleDriveRootFolderId }, () => {
            next();
        });
    } catch (error) {
        console.error('Tenant Middleware Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
