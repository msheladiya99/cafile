export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Check if it's localhost or an IP
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // For local development, we can use a query param or handle custom logic
        const params = new URLSearchParams(window.location.search);
        return params.get('firm') || '';
    }

    const parts = hostname.split('.');

    // Handle Vercel deployments (e.g., project.vercel.app)
    if (hostname.endsWith('.vercel.app')) {
        return parts.length > 3 ? parts[0] : '';
    }

    // Assuming domain is something like abc.cacloud.in (parts: ['abc', 'cacloud', 'in'])
    if (parts.length >= 3) {
        return parts[0];
    }

    return '';
};

export const isSuperAdminDomain = () => {
    const hostname = window.location.hostname;
    const subdomain = getSubdomain();

    return (
        hostname === 'cacloud.in' ||
        hostname === 'www.cacloud.in' ||
        (hostname === 'localhost' && !subdomain) ||
        (hostname.endsWith('.vercel.app') && !subdomain)
    );
};
