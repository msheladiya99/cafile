import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Typography,
    Pagination,
} from '@mui/material';
import {
    Login as LoginIcon,
    Logout as LogoutIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    CloudUpload as UploadIcon,
    CloudDownload as DownloadIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { profileService, type ActivityLogEntry } from '../services/profileService';

const getActionIcon = (action: string) => {
    switch (action) {
        case 'LOGIN':
            return <LoginIcon fontSize="small" />;
        case 'LOGOUT':
            return <LogoutIcon fontSize="small" />;
        case 'PASSWORD_CHANGE':
            return <LockIcon fontSize="small" />;
        case 'PROFILE_UPDATE':
            return <PersonIcon fontSize="small" />;
        case 'FILE_UPLOAD':
            return <UploadIcon fontSize="small" />;
        case 'FILE_DOWNLOAD':
            return <DownloadIcon fontSize="small" />;
        case 'FILE_DELETE':
            return <DeleteIcon fontSize="small" />;
        default:
            return null;
    }
};

const getActionColor = (action: string) => {
    switch (action) {
        case 'LOGIN':
            return 'success';
        case 'LOGOUT':
            return 'default';
        case 'PASSWORD_CHANGE':
        case 'PROFILE_UPDATE':
            return 'info';
        case 'FILE_UPLOAD':
            return 'primary';
        case 'FILE_DOWNLOAD':
            return 'secondary';
        case 'FILE_DELETE':
            return 'error';
        default:
            return 'default';
    }
};

const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const ActivityLog: React.FC = () => {
    const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const loadActivities = useCallback(async () => {
        try {
            setLoading(true);
            const skip = (page - 1) * limit;
            const data = await profileService.getActivityLog(limit, skip);
            setActivities(data.activities);
            setTotal(data.total);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getBrowserInfo = (userAgent?: string) => {
        if (!userAgent) return 'Unknown';

        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Other';
    };

    if (loading && activities.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (activities.length === 0) {
        return (
            <Box textAlign="center" py={5}>
                <Typography variant="body1" color="text.secondary">
                    No activity recorded yet
                </Typography>
            </Box>
        );
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Browser</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {activities.map((activity) => (
                            <TableRow key={activity._id} hover>
                                <TableCell>
                                    <Chip
                                        icon={getActionIcon(activity.action) || undefined}
                                        label={formatAction(activity.action)}
                                        size="small"
                                        color={getActionColor(activity.action) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{formatDate(activity.timestamp)}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">
                                        {activity.ipAddress || 'N/A'}
                                    </Typography>
                                </TableCell>
                                <TableCell>{getBrowserInfo(activity.userAgent)}</TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {activity.details || '-'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
};
