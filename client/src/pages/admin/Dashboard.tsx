import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, List, ListItem, ListItemText, ListItemIcon, 
    Chip, Grid, Tooltip, IconButton, TextField, Avatar, Skeleton
} from '@mui/material';
import {
    People as PeopleIcon,
    CloudUpload as UploadIcon,
    TrendingUp,
    Event as EventIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Assignment as AssignmentIcon,
    PieChart as PieChartIcon
} from '@mui/icons-material';

import { CommonButton } from '../../components/common/UIComponents';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminService } from '../../services/adminService';

interface ToDoItem {
    id: number;
    text: string;
    completed: boolean;
}

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [viewDate, setViewDate] = useState(new Date());

    const [tasks, setTasks] = useState<ToDoItem[]>(() => {
        try {
            const saved = localStorage.getItem('adminToDos');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: 'Review pending GST filings', completed: false },
                { id: 2, text: 'Send invoice reminders', completed: true },
            ];
        } catch (error) {
            console.error('Failed to parse tasks from local storage', error);
            return [
                { id: 1, text: 'Review pending GST filings', completed: false },
                { id: 2, text: 'Send invoice reminders', completed: true },
            ];
        }
    });
    const [newTask, setNewTask] = useState('');

    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: adminService.getDashboardStats,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const clientCount = dashboardData?.clientCount || 0;
    const reminders = dashboardData?.reminders || [];
    const isLoadingClients = isDashboardLoading;
    const isLoadingReminders = isDashboardLoading;



    // Save tasks to LocalStorage whenever they change
    useEffect(() => {
        localStorage.setItem('adminToDos', JSON.stringify(tasks));
    }, [tasks]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([{ id: Date.now(), text: newTask, completed: false }, ...tasks]);
        setNewTask('');
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    // Helper function to get deadline info
    const getDeadlineInfo = (date: number) => {
        // GST Deadlines
        if (date === 11) return { type: 'GSTR-1', period: 'Monthly', color: '#667eea' };
        if (date === 13) return { type: 'GSTR-1', period: 'Quarterly', color: '#764ba2' };
        if (date === 20) return { type: 'GSTR-3B', period: 'Monthly', color: '#f093fb' };
        if (date === 22) return { type: 'GSTR-3B', period: 'Quarterly (22nd)', color: '#f5576c' };
        if (date === 24) return { type: 'GSTR-3B', period: 'Quarterly (24th)', color: '#f5576c' };

        // TDS/TCS Deadlines
        if (date === 7) return { type: 'TDS/TCS', period: 'Payment (Monthly)', color: '#10b981' };
        if (date === 30) return { type: 'TDS Return', period: 'Quarterly Filing', color: '#059669' };

        return null;
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setViewDate(new Date());
    };

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5 }}>
            <Helmet>
                <title>Admin Dashboard | MyCAFile - CA Office Portal</title>
                <link rel="canonical" href="https://mycafile.in/admin/dashboard" />
                <meta name="description" content="View firm statistics, management tasks, and filing deadlines on your MyCAFile dashboard." />
            </Helmet>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #2c3e50, #3498db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome to your CA Admin Panel
                    </Typography>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                    <CommonButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/clients')}
                        sx={{
                            background: 'linear-gradient(45deg, #4c51bf, #667eea)',
                            color: '#ffffff',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            px: 3,
                            py: 1,
                            boxShadow: '0 4px 14px 0 rgba(76, 81, 191, 0.39)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #434190, #5a67d8)',
                                boxShadow: '0 6px 20px rgba(76, 81, 191, 0.23)',
                            },
                        }}
                    >
                        Add New Client
                    </CommonButton>
                    <Chip
                        label="FY 2025-26"
                        sx={{
                            fontWeight: 'bold',
                            bgcolor: '#1e3a5f',
                            color: '#ffffff',
                            '& .MuiChip-label': { color: '#ffffff' }
                        }}
                    />
                </Box>
            </Box>

            {/* Top Stats Row */}
            <Grid container spacing={2} mb={4}>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 600 }}>Total Clients</Typography>
                            {isLoadingClients ? (
                                <Skeleton width={60} height={40} />
                            ) : (
                                <Typography variant="h3" component="p" fontWeight={800} sx={{ color: '#1a2e44' }}>{clientCount}</Typography>
                            )}
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(52, 152, 219, 0.1)', color: '#3498db', width: 56, height: 56 }}>
                            <PeopleIcon />
                        </Avatar>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 600 }}>Pending Tasks</Typography>
                            {isLoadingReminders ? (
                                <Skeleton width={60} height={40} />
                            ) : (
                                <Typography variant="h3" component="p" fontWeight={800} sx={{ color: '#b45309' }}>{reminders.length}</Typography>
                            )}
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', width: 56, height: 56 }}>
                            <AssignmentIcon />
                        </Avatar>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" sx={{ color: '#4a5568', fontWeight: 600 }}>Filings Done</Typography>
                            <Typography variant="h3" component="p" fontWeight={800} sx={{ color: '#166534' }}>85%</Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', width: 56, height: 56 }}>
                            <PieChartIcon />
                        </Avatar>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Content Grid: Calendar + Quick Actions + To-Do List (Equal Heights) */}
            <Grid container spacing={3} mb={6}>

                {/* 1. Mini GST Compliance Calendar */}
                <Grid size={{ xs: 12, md: 6, lg: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2.5} display="flex" alignItems="center" justifyContent="space-between">
                            <IconButton onClick={handlePrevMonth} size="small" aria-label="View previous month">
                                <ChevronLeftIcon />
                            </IconButton>
                            <Box textAlign="center" onClick={handleToday} sx={{ cursor: 'pointer' }} role="button" aria-label="Reset calendar to today" tabIndex={0}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        mb: 0.5
                                    }}
                                >
                                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ fontSize: '0.7rem' }}
                                >
                                    GST Filing Deadlines
                                </Typography>
                            </Box>
                            <IconButton onClick={handleNextMonth} size="small" aria-label="View next month">
                                <ChevronRightIcon />
                            </IconButton>
                        </Box>

                        <Box>
                            {/* Day Headers */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 0.5,
                                mb: 1
                            }}>
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                    <Box
                                        key={day}
                                        sx={{
                                            textAlign: 'center',
                                            py: 0.75,
                                            fontWeight: 700,
                                            fontSize: '0.7rem',
                                            color: '#64748b',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {day}
                                    </Box>
                                ))}
                            </Box>

                            {/* Calendar Dates */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 0.5
                            }}>
                                {(() => {
                                    const today = new Date();
                                    const year = viewDate.getFullYear();
                                    const month = viewDate.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const todayDate = today.getDate();
                                    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

                                    const dates = [];

                                    for (let i = 0; i < firstDay; i++) {
                                        dates.push(
                                            <Box key={`empty-${i}`} sx={{ aspectRatio: '1', minHeight: 36 }} />
                                        );
                                    }

                                    for (let date = 1; date <= daysInMonth; date++) {
                                        const isToday = isCurrentMonth && date === todayDate;
                                        const deadlineInfo = getDeadlineInfo(date);
                                        const isGSTDeadline = deadlineInfo !== null;

                                        let bgColor = 'transparent';
                                        let textColor = 'text.primary';
                                        let hoverBg = 'rgba(0,0,0,0.04)';

                                        if (isToday) {
                                            bgColor = '#334155'; // Dark Navy for maximum contrast with white text
                                            textColor = '#ffffff';
                                            hoverBg = '#1e293b';
                                        } else if (isGSTDeadline) {
                                            bgColor = `${deadlineInfo.color}15`;
                                            hoverBg = `${deadlineInfo.color}30`;
                                        }

                                        const dateCell = (
                                            <Box
                                                key={date}
                                                sx={{
                                                    aspectRatio: '1',
                                                    minHeight: 36,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: isToday ? '50%' : 1.5,
                                                    bgcolor: bgColor,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        bgcolor: hoverBg,
                                                        transform: isGSTDeadline ? 'scale(1.15)' : 'scale(1.05)',
                                                        boxShadow: isGSTDeadline ? `0 4px 12px ${deadlineInfo.color}40` : 'none',
                                                        zIndex: 10
                                                    },
                                                    position: 'relative'
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={isToday ? 700 : isGSTDeadline ? 600 : 400}
                                                    color={textColor}
                                                    sx={{
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    {date}
                                                </Typography>
                                                {isGSTDeadline && !isToday && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 4,
                                                            width: 3,
                                                            height: 3,
                                                            borderRadius: '50%',
                                                            bgcolor: deadlineInfo.color
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        );

                                        if (isGSTDeadline) {
                                            dates.push(
                                                <Tooltip
                                                    key={date}
                                                    enterTouchDelay={0}
                                                    disableInteractive
                                                    title={
                                                        <Box sx={{ p: 0.5 }}>
                                                            <Typography variant="caption" fontWeight={700} display="block">
                                                                {deadlineInfo.type}
                                                            </Typography>
                                                            <Typography variant="caption" fontSize="0.65rem" display="block">
                                                                {deadlineInfo.period} Filing
                                                            </Typography>
                                                            <Typography variant="caption" fontSize="0.65rem" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                                                                Due: {date} {viewDate.toLocaleDateString('en-US', { month: 'short' })}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    arrow
                                                    placement="top"
                                                    componentsProps={{
                                                        tooltip: {
                                                            sx: {
                                                                bgcolor: deadlineInfo.color,
                                                                '& .MuiTooltip-arrow': {
                                                                    color: deadlineInfo.color,
                                                                },
                                                                boxShadow: `0 4px 12px ${deadlineInfo.color}60`,
                                                                borderRadius: '12px'
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {dateCell}
                                                </Tooltip>
                                            );
                                        } else {
                                            dates.push(dateCell);
                                        }
                                    }

                                    return dates;
                                })()}
                            </Box>
                        </Box>

                        <Box sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75
                        }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FF6B35' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Today</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    {new Date().getDate()}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">GSTR-1</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    11th, 13th
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f093fb' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">GSTR-3B</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    20th, 22nd, 24th
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">TDS/TCS</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    7th, 30th
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 2. Quick Actions Panel */}
                <Grid size={{ xs: 12, md: 6, lg: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" component="h2" fontWeight="700" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Common tasks for your CA office
                        </Typography>

                        {/* Always 2 Columns for Better Grid */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: { xs: 2, md: 2 }
                        }}>
                             <Box
                                onClick={() => navigate('/admin/clients')}
                                role="button"
                                tabIndex={0}
                                aria-label="Add a new client"
                                onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/clients')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 3.5,
                                    bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '12px',
                                    bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <PeopleIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Add Client
                                    </Typography>
                                </Box>
                            </Box>

                             <Box
                                onClick={() => navigate('/admin/reminders')}
                                role="button"
                                tabIndex={0}
                                aria-label="Go to reminders"
                                onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/reminders')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 3.5,
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(250, 112, 154, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '12px',
                                    bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <EventIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Reminder
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Upload Action */}
                             <Box
                                onClick={() => navigate('/admin/upload')}
                                role="button"
                                tabIndex={0}
                                aria-label="Upload files"
                                onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/upload')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 3.5,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '12px',
                                    bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <UploadIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Upload
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Invoice Action */}
                             <Box
                                onClick={() => navigate('/admin/billing')}
                                role="button"
                                tabIndex={0}
                                aria-label="Go to billing"
                                onKeyDown={(e) => e.key === 'Enter' && navigate('/admin/billing')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 3.5,
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: '12px',
                                    bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <TrendingUp sx={{ fontSize: { xs: 24, md: 28 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Invoice
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 3. Smart To-Do List Section */}
                <Grid size={{ xs: 12, md: 12, lg: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2}>
                            <Typography variant="h6" component="h2" fontWeight="700" gutterBottom>
                                Smart To-Do
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Daily admin tasks
                            </Typography>
                        </Box>

                        <form onSubmit={handleAddTask}>
                            <Box display="flex" gap={1} mb={2}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Add task..."
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        sx: { borderRadius: '12px', fontSize: '0.9rem' }
                                    }}
                                />
                                <CommonButton
                                    variant="contained"
                                    type="submit"
                                    aria-label="Add task"
                                    sx={{
                                        borderRadius: '12px',
                                        minWidth: 'auto',
                                        px: 2,
                                        background: 'linear-gradient(45deg, #11998e 30%, #38ef7d 90%)',
                                    }}
                                >
                                    <AddIcon />
                                </CommonButton>
                            </Box>
                        </form>

                        <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '100%' }}>
                            {tasks.length === 0 ? (
                                <Box py={4} textAlign="center" color="text.secondary">
                                    <Typography variant="caption">No tasks yet.</Typography>
                                </Box>
                            ) : (
                                tasks.map((task) => (
                                    <ListItem
                                        key={task.id}
                                        sx={{
                                            px: 1.5,
                                            py: 0.5,
                                            mb: 1,
                                            borderRadius: '12px',
                                            bgcolor: task.completed ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,1)',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'background-color 0.2s, transform 0.2s',
                                            animation: 'fadeSlideIn 0.25s ease-out',
                                            '@keyframes fadeSlideIn': {
                                                from: { opacity: 0, transform: 'translateY(-6px)' },
                                                to: { opacity: 1, transform: 'translateY(0)' },
                                            },
                                            '&:hover': {
                                                bgcolor: 'rgba(0,0,0,0.04)',
                                                transform: 'translateX(3px)'
                                            }
                                        }}
                                        secondaryAction={
                                            <IconButton edge="end" aria-label={`Delete task: ${task.text}`} onClick={() => deleteTask(task.id)} size="small" color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemIcon sx={{ minWidth: 30 }} onClick={() => toggleTask(task.id)}>
                                            <IconButton size="small" color={task.completed ? "success" : "default"} aria-label={task.completed ? `Mark "${task.text}" as incomplete` : `Mark "${task.text}" as complete`}>
                                                {task.completed ? <CheckCircleIcon fontSize="small" /> : <UncheckedIcon fontSize="small" />}
                                            </IconButton>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        textDecoration: task.completed ? 'line-through' : 'none',
                                                        color: task.completed ? 'text.secondary' : 'text.primary',
                                                        fontWeight: task.completed ? 400 : 500,
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    {task.text}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};





