import { Request, Response, NextFunction } from 'express';
import { Firm } from '../models/Firm';
import { requestContext } from '../utils/context';

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
            const bases = ['mycafile.in', 'cacloud.in', 'vercel.app', 'onrender.com', 'localhost'];
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

    console.log('🔍 Tenant Subdomain:', subdomain || 'ROOT/NONE', 'Host:', host);

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
        subdomain === 'cacloud' ||
        subdomain === 'mycafile'
    ) {
        return next();
    }

    try {
        // 3. Find firm in database
        const firm = await Firm.findOne({ subdomain, status: 'active' });

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
