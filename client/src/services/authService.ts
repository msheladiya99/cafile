import api from './api';
import type { LoginData, LoginResponse, User } from '../types';

export type LoginCredentials = LoginData;

const sanitizeUser = (user: User): User => {
    if (user && user.name === 'Super Admin') {
        return { ...user, name: 'Super Admin' };
    }
    return user;
};

export const authService = {
    login: async (credentials: LoginData): Promise<LoginResponse> => {
        const response = await api.post('/auth/login', credentials);
        const data = response.data;
        if (data && data.user) {
            data.user = sanitizeUser(data.user);
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getStoredUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const user = JSON.parse(userStr);
            return sanitizeUser(user);
        } catch {
            return null;
        }
    },

    getStoredToken: () => {
        return localStorage.getItem('token');
    },

    storeAuth: (token: string, user: User) => {
        const sanitizedUser = sanitizeUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(sanitizedUser));
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return sanitizeUser(response.data);
    },
};
