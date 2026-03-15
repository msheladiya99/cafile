export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Check if it's localhost or an IP
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // For local development, we can use a query param or handle custom logic
        const params = new URLSearchParams(window.location.search);
        return params.get('firm') || '';
    }

    const parts = hostname.split('.');

    // Handle Vercel deployments
    if (hostname.endsWith('.vercel.app')) {
        return parts.length > (hostname.includes('vercel.app') && parts[parts.length - 3] === 'vercel' ? 3 : 2) ? parts[0] : '';
    }

    // Assuming domain is something like abc.mycafile.in or abc.cacloud.in
    if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain.toLowerCase() === 'www') return '';
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
        (hostname === 'localhost' && !subdomain) ||
        (hostname.endsWith('.vercel.app') && !subdomain)
    );
};
