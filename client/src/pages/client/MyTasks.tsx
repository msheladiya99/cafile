import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Stack,
    LinearProgress,
    alpha,
    Divider,
    Skeleton,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    PriorityHigh as PriorityIcon,
    CheckCircle as DoneIcon,
    Pending as PendingIcon,
    PlayArrow as ProgressIcon,
    Error as OverdueIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { clientService, type ClientTask } from '../../services/clientService';
import { format, isPast, parseISO } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pending', color: '#64748b', icon: <PendingIcon fontSize="small" /> },
    IN_PROCESS: { label: 'In Progress', color: '#3b82f6', icon: <ProgressIcon fontSize="small" /> },
    PENDING_FROM_CLIENT: { label: 'Action Required', color: '#f59e0b', icon: <PriorityIcon fontSize="small" /> },
    DONE: { label: 'Completed', color: '#10b981', icon: <DoneIcon fontSize="small" /> },
    APPROVED: { label: 'Approved', color: '#06b6d4', icon: <DoneIcon fontSize="small" /> },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: <DoneIcon fontSize="small" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: 'Low', color: '#94a3b8' },
    MEDIUM: { label: 'Medium', color: '#3b82f6' },
    HIGH: { label: 'High', color: '#f59e0b' },
    URGENT: { label: 'Urgent', color: '#ef4444' },
};

export const MyTasks: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const { data: tasks, isLoading: loadingTasks } = useQuery({
        queryKey: ['client-tasks'],
        queryFn: clientService.getTasks,
    });

    const filteredTasks = tasks?.filter((task) => {
        if (activeTab === 0) return task.status !== 'DONE' && task.status !== 'CANCELLED';
        if (activeTab === 1) return task.status === 'DONE';
        return true;
    }) || [];

    const stats = tasks?.reduce((acc, curr) => {
        if (curr.status === 'DONE') acc.completed++;
        else if (curr.status !== 'CANCELLED') {
            acc.active++;
            if (curr.targetDate && isPast(parseISO(curr.targetDate))) acc.overdue++;
        }
        return acc;
    }, { active: 0, completed: 0, overdue: 0 }) || { active: 0, completed: 0, overdue: 0 };

    return (
        <Box sx={{ pt: 1, pb: 4 }}>
            {/* Header Section */}
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-end">
                <Box>
                    <Typography 
                        variant="h4" 
                        fontWeight="800" 
                        sx={{ 
                            background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        My Tasks
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track the progress of your ongoing work and compliance.
                    </Typography>
                </Box>
            </Box>

            {/* Quick Stats Grid */}
            <Grid container spacing={3} mb={5}>
                {[
                    { label: 'Active Tasks', value: stats.active, color: '#3b82f6', icon: <TaskIcon /> },
                    { label: 'Overdue', value: stats.overdue, color: '#ef4444', icon: <OverdueIcon /> },
                    { label: 'Completed', value: stats.completed, color: '#10b981', icon: <DoneIcon /> },
                ].map((stat, idx) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: stat.color,
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 12px 24px ${alpha(stat.color, 0.1)}`,
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    width: 100,
                                    height: '100%',
                                    background: `linear-gradient(90deg, transparent, ${alpha(stat.color, 0.05)})`,
                                }
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box 
                                    sx={{ 
                                        p: 1.5, 
                                        borderRadius: 3, 
                                        bgcolor: alpha(stat.color, 0.1),
                                        color: stat.color,
                                        display: 'flex'
                                    }}
                                >
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight="800" color="text.primary">
                                        {stat.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Tasks List Section */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1 }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 700,
                                textTransform: 'none',
                                minHeight: 64,
                                fontSize: '0.95rem',
                            }
                        }}
                    >
                        <Tab label="Active Tasks" />
                        <Tab label="History" />
                    </Tabs>
                </Box>

                {/* Task List */}
                <Box sx={{ p: { xs: 1, md: 0 } }}>
                    {loadingTasks ? (
                        <Box p={4}>
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height={80} sx={{ mb: 1, borderRadius: 2 }} />
                            ))}
                        </Box>
                    ) : filteredTasks.length === 0 ? (
                        <Box py={8} textAlign="center">
                            <TaskIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight="600">
                                No tasks found
                            </Typography>
                            <Typography variant="body2" color="text.disabled" mt={1}>
                                {activeTab === 0 
                                    ? "Your CA firm hasn't assigned any tasks yet." 
                                    : "No tasks match this filter."}
                            </Typography>
                        </Box>
                    ) : (
                        <Stack divider={<Divider />}>
                            {filteredTasks.map((task: ClientTask) => {
                                const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                                const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                                const isOverdue = task.targetDate && isPast(parseISO(task.targetDate)) && task.status !== 'DONE' && task.status !== 'CANCELLED';

                                return (
                                    <Box 
                                        key={task._id} 
                                        sx={{ 
                                            p: { xs: 2, md: 3 },
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: '#f8fafc',
                                            }
                                        }}
                                    >
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Box display="flex" gap={2}>
                                                    <Box sx={{ pt: 0.5 }}>
                                                        <Box 
                                                            sx={{ 
                                                                width: 12, 
                                                                height: 12, 
                                                                borderRadius: '50%', 
                                                                bgcolor: isOverdue ? '#ef4444' : statusConfig.color,
                                                                mt: 0.5,
                                                                boxShadow: `0 0 0 4px ${alpha(isOverdue ? '#ef4444' : statusConfig.color, 0.1)}`
                                                            }} 
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                                                            {task.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            {task.description}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} mt={1.5} alignItems="center">
                                                            <Chip 
                                                                label={statusConfig.label} 
                                                                size="small" 
                                                                icon={statusConfig.icon as React.ReactElement}
                                                                sx={{ 
                                                                    bgcolor: alpha(statusConfig.color, 0.1), 
                                                                    color: statusConfig.color,
                                                                    fontWeight: 700,
                                                                    border: 'none'
                                                                }} 
                                                            />
                                                            <Chip 
                                                                label={`${priorityConfig.label} Priority`} 
                                                                size="small"
                                                                sx={{ 
                                                                    bgcolor: '#f1f5f9', 
                                                                    color: '#475569',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.7rem'
                                                                }} 
                                                            />
                                                            {isOverdue && (
                                                                <Chip 
                                                                    label="Overdue" 
                                                                    size="small"
                                                                    color="error"
                                                                    sx={{ fontWeight: 700, height: 24 }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <Box sx={{ px: { md: 4 } }}>
                                                    <Box display="flex" justifyContent="space-between" mb={1}>
                                                        <Typography variant="caption" fontWeight="700" color="text.secondary">
                                                            Progress
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="700" color="primary">
                                                            {task.progressPercentage}%
                                                        </Typography>
                                                    </Box>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={task.progressPercentage} 
                                                        sx={{ 
                                                            height: 6, 
                                                            borderRadius: 3,
                                                            bgcolor: '#f1f5f9',
                                                            '& .MuiLinearProgress-bar': {
                                                                borderRadius: 3,
                                                                bgcolor: statusConfig.color
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>

                                            <Grid size={{ xs: 12, md: 2 }}>
                                                <Box textAlign={{ md: 'right' }}>
                                                    <Typography variant="caption" color="text.disabled" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                        Target Date
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="700" color={isOverdue ? 'error.main' : 'text.primary'} mt={0.5}>
                                                        {task.targetDate ? format(parseISO(task.targetDate), 'dd MMM, yyyy') : 'No Date'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};
