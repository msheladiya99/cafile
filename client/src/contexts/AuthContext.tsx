import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isManager: boolean;
    isStaffMember: boolean;
    isIntern: boolean;
    isStaff: boolean;
    isClient: boolean;
    remainingTime: number; // in seconds
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());

    // Initialize remaining time from storage or default to 30 mins
    const [remainingTime, setRemainingTime] = useState<number>(() => {
        const storedExpiration = localStorage.getItem('session_expiration');
        if (storedExpiration) {
            const timeLeft = Math.floor((parseInt(storedExpiration) - Date.now()) / 1000);
            return timeLeft > 0 ? timeLeft : 0;
        }
        return 30 * 60;
    });

    const login = (newToken: string, newUser: User) => {
        const expirationTime = Date.now() + 30 * 60 * 1000;
        localStorage.setItem('session_expiration', expirationTime.toString());
        authService.storeAuth(newToken, newUser);
        setToken(newToken);
        setUser(newUser);
        setRemainingTime(30 * 60);
    };

    const logout = () => {
        localStorage.removeItem('session_expiration');
        authService.logout();
        setToken(null);
        setUser(null);
        setRemainingTime(30 * 60);
    };

    // Auto logout logic
    useEffect(() => {
        if (!token || !user) return;

        // Interval for countdown and sync
        const timer = setInterval(() => {
            const storedExpiration = localStorage.getItem('session_expiration');
            if (storedExpiration) {
                const timeLeft = Math.floor((parseInt(storedExpiration) - Date.now()) / 1000);
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    logout();
                    alert('Your 30-minute session has expired.');
                    setRemainingTime(0);
                } else {
                    setRemainingTime(timeLeft);
                }
            } else {
                // If expiration is missing but token exists, set it once
                const expirationTime = Date.now() + 30 * 60 * 1000;
                localStorage.setItem('session_expiration', expirationTime.toString());
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [token, user]);

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isManager: user?.role === 'MANAGER',
        isStaffMember: user?.role === 'STAFF',
        isIntern: user?.role === 'INTERN',
        isStaff: !!user && ['ADMIN', 'MANAGER', 'STAFF', 'INTERN', 'SUPER_ADMIN'].includes(user.role),
        isClient: user?.role === 'CLIENT',
        remainingTime,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
