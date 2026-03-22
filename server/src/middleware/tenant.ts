import { Request, Response, NextFunction } from 'express';
import { Firm } from '../models/Firm';
import { requestContext } from '../utils/context';

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
        }
    }
}

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get host from headers
    const host = req.headers.host || '';

    // 2. Extract subdomain
    // Example: abc.cacloud.in -> abc
    // Example: localhost:5000 -> no subdomain or 'localhost'
    const parts = host.split('.');

    // For local development, we might use subdomains like abc.localhost:5000
    // If it's just localhost:5000, we might want to skip or handle super admin

    let subdomain = '';

    // Check custom header first (useful for local dev and API stability)
    const headerTenant = req.headers['x-tenant-id'];
    if (headerTenant && typeof headerTenant === 'string') {
        subdomain = headerTenant.toLowerCase();
    } else {
        // Robust subdomain extraction
        // Detect current base domain (e.g., mycafile.in)
        const hostParts = host.split(':'); // remove port
        const hostname = hostParts[0].toLowerCase();

        // Skip for bare IP addresses
        if (/^[\d.]+$/.test(hostname)) {
            subdomain = '';
        } else {
            // Check for known base domains
            const bases = ['mycafile.in', 'vercel.app', 'onrender.com', 'localhost'];
            let foundBase = '';
            for (const b of bases) {
                if (hostname.endsWith(b)) {
                    foundBase = b;
                    break;
                }
            }

            if (foundBase) {
                // If hostname is 'paresh.co.mycafile.in' and base is 'mycafile.in'
                // Subdomain is 'paresh.co'
                const subStr = hostname.replace(`.${foundBase}`, '').replace(foundBase, '');
                if (subStr && subStr !== 'www') {
                    subdomain = subStr;
                }
            } else if (parts.length >= 3) {
                // Fallback for unknown domains
                subdomain = parts.slice(0, parts.length - 2).join('.');
            }
        }
    }

    // Only log in development for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Tenant Subdomain:', subdomain || 'ROOT/NONE', 'Host:', host);
    }

    // Skip middleware for:
    // 1. Super admin base path
    // 2. Main domain (no subdomain or 'www' or matches base domain)
    // 3. Localhost base
    if (
        req.path.startsWith('/super-admin') ||
        req.baseUrl.startsWith('/api/super-admin') ||
        !subdomain ||
        subdomain === 'www' ||
        subdomain === 'api' ||
        subdomain === 'admin' ||
        subdomain === 'superadmin' ||
        subdomain === 'super-admin' ||
        subdomain === 'localhost' ||
        subdomain === 'mycafile'
    ) {
        return next();
    }

    try {
        // 3. Find firm in database (uses in-memory cache, 5-min TTL)
        const firm = await getFirmBySubdomain(subdomain);

        if (!firm) {
            console.log('❌ Firm not found for subdomain:', subdomain);
            return res.status(404).json({ message: 'Firm not found' });
        }

        // 4. Attach firmId to request context
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
