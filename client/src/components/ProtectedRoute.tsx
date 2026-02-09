import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireStaff?: boolean;
    requireClient?: boolean;
    requirePermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAdmin,
    requireStaff,
    requireClient,
    requirePermission,
}) => {
    const { isAuthenticated, isAdmin, isStaff, isClient, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to={isClient ? "/client/dashboard" : "/admin/dashboard"} replace />;
    }

    if (requireStaff && !isStaff) {
        return <Navigate to="/client/dashboard" replace />;
    }

    if (requireClient && !isClient) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (requirePermission && !isAdmin && !user?.permissions?.includes(requirePermission)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (!user) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return <>{children}</>;
};
