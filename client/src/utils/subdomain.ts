export const getSubdomain = () => {
    const hostname = window.location.hostname;

    // Check if it's localhost or an IP
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        // For local development, we can use a query param or handle custom logic
        const params = new URLSearchParams(window.location.search);
        return params.get('firm') || '';
    }

    const parts = hostname.split('.');

    // Assuming domain is cacloud.in (parts: ['abc', 'cacloud', 'in'])
    if (parts.length >= 3) {
        return parts[0];
    }

    return '';
};

export const isSuperAdminDomain = () => {
    const hostname = window.location.hostname;
    return hostname === 'cacloud.in' || hostname === 'www.cacloud.in' || (hostname === 'localhost' && !getSubdomain());
};
