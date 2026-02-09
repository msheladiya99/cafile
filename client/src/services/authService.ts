import api from './api';
import type { LoginData, LoginResponse, User } from '../types';

export type LoginCredentials = LoginData;

export const authService = {
    login: async (credentials: LoginData): Promise<LoginResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getStoredUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getStoredToken: () => {
        return localStorage.getItem('token');
    },

    storeAuth: (token: string, user: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
};
