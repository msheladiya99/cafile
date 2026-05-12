import React, { useMemo, useState } from 'react';
import {
    Avatar,
    Box,
    Chip,
    Grid,
    IconButton,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
    Alert,
} from '@mui/material';
import {
    AccountBalance,
    Assignment,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Paid,
    ReceiptLong,
    TrendingUp,
    Folder as FolderIcon,
    History as HistoryIcon,
    NotificationImportant,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import { CommonButton } from '../../components/common/UIComponents';
import { format, isPast, parseISO } from 'date-fns';

const cardSx = {
    borderRadius: 3,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
    border: '1px solid rgba(226,232,240,0.9)',
    background: '#ffffff',
};

const formatDate = (value?: string) => value
    ? format(parseISO(value), 'dd MMM')
    : 'No date';

const ComplianceCalendar: React.FC = () => {
    const [viewDate, setViewDate] = useState(new Date());
    
    // In a real app, we'd fetch client-specific compliance dates
    const calendarEvents = useMemo(() => [
        { day: 7, type: 'TDS', label: 'TDS Payment Due', color: '#0f766e' },
        { day: 11, type: 'GST', label: 'GSTR-1 Filing', color: '#4f46e5' },
        { day: 20, type: 'GST', label: 'GSTR-3B Filing', color: '#dc2626' },
        { day: 31, type: 'TDS', label: 'TDS Return Due', color: '#d97706' },
    ], []);

    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Compliance Calendar</Typography>
                    <Typography variant="body2" color="text.secondary">Upcoming tax & filing deadlines</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => setViewDate(new Date(year, month - 1, 1))}><ChevronLeft /></IconButton>
                    <IconButton size="small" onClick={() => setViewDate(new Date(year, month + 1, 1))}><ChevronRight /></IconButton>
                </Stack>
            </Stack>
            <Typography variant="subtitle2" fontWeight={800} mb={1}>
                {viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Typography key={`${day}-${index}`} variant="caption" fontWeight={800} color="text.secondary" textAlign="center">{day}</Typography>
                ))}
                {Array.from({ length: firstDay }).map((_, index) => <Box key={`empty-${index}`} sx={{ minHeight: 42 }} />)}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const events = calendarEvents.filter((event) => event.day === day);
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    return (
                        <Tooltip key={day} title={events.map((event) => event.label).join(', ') || 'No deadlines'}>
                            <Box
                                sx={{
                                    minHeight: 46,
                                    borderRadius: 2,
                                    border: isToday ? '2px solid #111827' : '1px solid #e5e7eb',
                                    p: 0.75,
                                    bgcolor: events.length ? '#f8fafc' : '#fff',
                                }}
                            >
                                <Typography variant="caption" fontWeight={isToday ? 900 : 700}>{day}</Typography>
                                <Stack direction="row" spacing={0.35} mt={0.4}>
                                    {events.map((event, eventIndex) => (
                                        <Box key={eventIndex} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: event.color }} />
                                    ))}
                                </Stack>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>
        </Paper>
    );
};

export const ClientDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['client-stats'],
        queryFn: clientService.getStats,
    });

    const { data: tasks, isLoading: isLoadingTasks } = useQuery({
        queryKey: ['client-tasks'],
        queryFn: clientService.getTasks,
    });

    const stats = useMemo(() => {
        const defaultStats = { ITR: 0, GST: 0, ACCOUNTING: 0 };
        if (!statsData) return defaultStats;
        statsData.forEach((s) => {
            if (s._id in defaultStats) defaultStats[s._id as keyof typeof defaultStats] = s.count;
        });
        return defaultStats;
    }, [statsData]);

    const urgentTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks
            .filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')
            .filter(t => t.priority === 'URGENT' || t.priority === 'HIGH' || (t.targetDate && isPast(parseISO(t.targetDate))))
            .slice(0, 5);
    }, [tasks]);

    const kpis = [
        { label: 'ITR Records', value: stats.ITR, icon: <ReceiptLong />, color: '#4f46e5', bg: '#eef2ff', path: '/client/files' },
        { label: 'GST Filings', value: stats.GST, icon: <TrendingUp />, color: '#059669', bg: '#ecfdf5', path: '/client/files' },
        { label: 'Account Docs', value: stats.ACCOUNTING, icon: <AccountBalance />, color: '#d97706', bg: '#fffbeb', path: '/client/files' },
        { label: 'Pending Tasks', value: tasks?.filter(t => t.status !== 'DONE').length || 0, icon: <Assignment />, color: '#dc2626', bg: '#fef2f2', path: '/client/tasks' },
    ];

    const quickActions = [
        { label: 'View Documents', icon: <FolderIcon />, path: '/client/files' },
        { label: 'My Tasks', icon: <Assignment />, path: '/client/tasks' },
        { label: 'Invoices & Payments', icon: <Paid />, path: '/client/invoices' },
        { label: 'My Profile', icon: <HistoryIcon />, path: '/client/profile' },
    ];

    return (
        <Box sx={{ pt: 1, pb: 4 }}>
            <Helmet>
                <title>Client Dashboard | MyCAFile</title>
            </Helmet>

            {/* Header Section */}
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={4}>
                <Box>
                    <Typography variant="body2" fontWeight={700} color="primary" mb={0.5}>
                        {format(new Date(), 'EEEE, dd MMMM yyyy')}
                    </Typography>
                    <Typography variant="h4" fontWeight={900}>
                        Welcome, {user?.name || 'Valued Client'} 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Stay on top of your compliance and documents.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <CommonButton variant="outlined" startIcon={<FolderIcon />} onClick={() => navigate('/client/files')}>My Files</CommonButton>
                    <CommonButton variant="contained" startIcon={<Assignment />} onClick={() => navigate('/client/tasks')}>Track Work</CommonButton>
                </Stack>
            </Stack>

            {/* KPI Section */}
            <Grid container spacing={2.5} mb={4}>
                {kpis.map((kpi) => (
                    <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper 
                            onClick={() => navigate(kpi.path)}
                            sx={{ 
                                ...cardSx, 
                                p: 2.5, 
                                cursor: 'pointer', 
                                transition: '0.2s ease', 
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' } 
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color, width: 48, height: 48 }}>{kpi.icon}</Avatar>
                                <Typography variant="h4" fontWeight={900}>{isLoadingStats ? <Skeleton width={40} /> : kpi.value}</Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" fontWeight={700} mt={2}>{kpi.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Urgent Action Center */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Paper sx={{ ...cardSx, p: 3, height: '100%' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Action Center</Typography>
                                <Typography variant="body2" color="text.secondary">Pending items requiring your attention</Typography>
                            </Box>
                            <Chip label={`${urgentTasks.length} urgent`} color={urgentTasks.length ? 'error' : 'success'} sx={{ fontWeight: 800 }} />
                        </Stack>
                        <Stack spacing={1.5}>
                            {isLoadingTasks ? [1, 2, 3].map(i => <Skeleton key={i} height={70} sx={{ borderRadius: 2 }} />) : 
                             urgentTasks.length ? urgentTasks.map((task) => (
                                <Box key={task._id} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: task.priority === 'URGENT' ? '#fff1f2' : '#fffaf0' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: task.priority === 'URGENT' ? '#fee2e2' : '#fef3c7', color: task.priority === 'URGENT' ? '#dc2626' : '#b45309' }}>
                                                <NotificationImportant />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={900}>{task.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">Target Date: {formatDate(task.targetDate)}</Typography>
                                            </Box>
                                        </Stack>
                                        <CommonButton size="small" variant="text" onClick={() => navigate('/client/tasks')}>View</CommonButton>
                                    </Stack>
                                </Box>
                            )) : (
                                <Alert severity="success" sx={{ borderRadius: 2 }}>All clear! You have no urgent pending actions.</Alert>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Quick Actions Panel */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Paper sx={{ ...cardSx, p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Shortcuts</Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>Quick access to your portal features</Typography>
                        <Grid container spacing={2}>
                            {quickActions.map((action) => (
                                <Grid key={action.label} size={{ xs: 12, sm: 6 }}>
                                    <Box 
                                        onClick={() => navigate(action.path)} 
                                        sx={{ 
                                            p: 2.5, 
                                            borderRadius: 2, 
                                            border: '1px solid #e5e7eb', 
                                            bgcolor: '#f8fafc', 
                                            cursor: 'pointer', 
                                            textAlign: 'center',
                                            '&:hover': { bgcolor: '#eef2ff', borderColor: '#4f46e5' } 
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: '#fff', color: '#4f46e5', mx: 'auto', mb: 1.5, border: '1px solid #e5e7eb' }}>{action.icon}</Avatar>
                                        <Typography variant="body2" fontWeight={800}>{action.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 8 }}>
                    <ComplianceCalendar />
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...cardSx, p: 3, height: '100%' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: '#ecfdf5', color: '#059669' }}><CheckCircle /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Status Brief</Typography>
                                <Typography variant="body2" color="text.secondary">Summary of your active engagement</Typography>
                            </Box>
                        </Stack>
                        <Stack spacing={2} mt={3}>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.5}>COMPLETED WORK</Typography>
                                <Typography variant="h5" fontWeight={900} color="success.main">
                                    {tasks?.filter(t => t.status === 'DONE').length || 0} Tasks
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.5}>ONGOING COMPLIANCE</Typography>
                                <Typography variant="h5" fontWeight={900} color="primary.main">
                                    {tasks?.filter(t => t.status === 'IN_PROCESS' || t.status === 'PENDING').length || 0} Active
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
