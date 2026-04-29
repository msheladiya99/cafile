import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types';
import { useNavigate } from 'react-router-dom';
import SessionExpiredModal from '../components/common/SessionExpiredModal';

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
    userPermissions: string[]; // the logged-in user's permission keys
    hasPermission: (key: string) => boolean; // check a single permission
    hasAnyPermission: (keys: string[]) => boolean; // check if user has ANY of the listed permissions
    refreshUser: () => Promise<void>; // re-fetch user from server
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
    const [showExpiredModal, setShowExpiredModal] = useState(false);
    const navigate = useNavigate();

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
                    setShowExpiredModal(true);
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

    // On startup: silently refresh user data from server to pick up latest permissions
    // This ensures permissions updated by admin are reflected without requiring re-login
    useEffect(() => {
        if (!token) return;
        authService.getCurrentUser()
            .then(freshUser => {
                setUser(freshUser);
                // Update localStorage so next hard refresh also has fresh data
                authService.storeAuth(token, freshUser);
            })
            .catch((err) => {
                // Log for debugging — but don't crash or force logout
                // (auto-logout timer handles truly expired tokens)
                console.warn('[AuthContext] Could not refresh user from server:', err?.response?.status, err?.message);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount only

    // Manual refresh — call this if you need to immediately sync updated permissions
    const refreshUser = async (): Promise<void> => {
        if (!token) return;
        try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
            authService.storeAuth(token, freshUser);
        } catch {
            // silently ignore
        }
    };
    // Only ADMIN and SUPER_ADMIN bypass all permission checks
    // MANAGER, STAFF, and INTERN are subject to their assigned permissions
    const isPermissionBypassed = !!user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const userPermissions = isPermissionBypassed ? ['*'] : (user?.permissions || []);

    const hasPermission = (key: string): boolean => {
        if (!user) return false;
        if (isPermissionBypassed) return true;
        return userPermissions.includes(key);
    };

    const hasAnyPermission = (keys: string[]): boolean => {
        if (!user) return false;
        if (isPermissionBypassed) return true;
        return keys.some(k => userPermissions.includes(k));
    };

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
        userPermissions,
        hasPermission,
        hasAnyPermission,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            <SessionExpiredModal 
                open={showExpiredModal} 
                onClose={() => setShowExpiredModal(false)}
                onLogin={() => {
                    setShowExpiredModal(false);
                    navigate('/login');
                }}
                onHome={() => {
                    setShowExpiredModal(false);
                    navigate('/');
                }}
            />
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
