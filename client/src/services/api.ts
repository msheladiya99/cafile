import axios, { AxiosError } from 'axios';
import { getSubdomain } from '../utils/subdomain';

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycafile.in/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {},
});

// Add token and tenant info to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const subdomain = getSubdomain();
        if (subdomain) {
            config.headers['X-Tenant-Id'] = subdomain;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const isLoginEndpoint = error.config?.url?.includes('/auth/login');
        const isRefreshEndpoint = error.config?.url?.includes('/auth/me');
        if (error.response?.status === 401 && !isLoginEndpoint && !isRefreshEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
