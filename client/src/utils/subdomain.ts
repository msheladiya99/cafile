export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Check if it's localhost or an IP
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // For local development, we can use a query param or handle custom logic
        const params = new URLSearchParams(window.location.search);
        return params.get('firm') || '';
    }

    // For local development with .localhost subdomains
    if (hostname.endsWith('.localhost')) {
        const parts = hostname.split('.');
        if (parts.length >= 2 && parts[0] !== 'localhost') {
            return parts[0].toLowerCase();
        }
    }

    const parts = hostname.split('.');

    // Handle Vercel deployments
    if (hostname.endsWith('.vercel.app')) {
        const isBranchPreview = hostname.includes('vercel.app') && parts.length > 3;
        return parts.length > (isBranchPreview ? 3 : 2) ? parts[0] : '';
    }

    // Assuming domain is something like abc.mycafile.in or abc.cacloud.in
    // If it has at least one dot (parts.length >= 2) and ends with our production domains
    const isProdDomain = hostname.endsWith('.mycafile.in') || hostname.endsWith('.cacloud.in');

    if (isProdDomain && parts.length >= 3) {
        const subdomain = parts[0].toLowerCase();
        if (['www', 'superadmin', 'super-admin', 'admin'].includes(subdomain)) return '';
        return subdomain;
    }

    return '';
};

export const isSuperAdminDomain = () => {
    const hostname = window.location.hostname;
    const subdomain = getSubdomain();

    return (
        hostname === 'mycafile.in' ||
        hostname === 'www.mycafile.in' ||
        hostname === 'cacloud.in' ||
        hostname === 'www.cacloud.in' ||
        hostname === 'localhost' ||
        (hostname.endsWith('.localhost') && !subdomain) ||
        (hostname.endsWith('.vercel.app') && !subdomain)
    );
};
