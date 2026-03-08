import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isStaffMember: boolean;
    isIntern: boolean;
    isStaff: boolean;
    isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());

    const login = (newToken: string, newUser: User) => {
        authService.storeAuth(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER',
        isStaffMember: user?.role === 'STAFF',
        isIntern: user?.role === 'INTERN',
        isStaff: !!user && ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(user.role),
        isClient: user?.role === 'CLIENT',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
