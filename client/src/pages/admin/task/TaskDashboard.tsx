import React, { useMemo, useState } from 'react';
import {
    Box, Grid, Paper, Typography, Card, CardContent, Avatar,
    Chip, Button, LinearProgress, List, ListItem, ListItemText,
    ListItemIcon, Divider, IconButton, Tooltip, Badge,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    PendingActions as PendingIcon,
    PlayCircleOutline as ProgressIcon,
    CheckCircleOutline as DoneIcon,
    ErrorOutline as OverdueIcon,
    HourglassEmpty as ApprovalIcon,
    ArrowForward as ArrowIcon,
    Timer as TimerIcon,
    TrendingUp as TrendIcon,
    Speed as SpeedIcon,
    Groups as GroupsIcon,
    CalendarMonth as CalendarIcon,
    Cancel as OnHoldIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../../../services/taskService';
import { useNavigate } from 'react-router-dom';
import type { Task, Client, User } from '../../../types';

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#94a3b8',
    IN_PROCESS: '#3b82f6',
    PENDING_FOR_APPROVAL: '#f59e0b',
    APPROVED: '#2dd4bf',
    DONE: '#10b981',
    ON_HOLD: '#8b5cf6',
    PENDING_FROM_CLIENT: '#f97316',
    PENDING_FROM_DEPARTMENT: '#ec4899',
    CANCELLED: '#ef4444',
    REJECTED: '#dc2626',
};

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#10b981',
};

// ─── Stat Card Component ─────────────────────────────────────────────────────
interface StatCardProps {
    title: string; count: number; icon: React.ReactNode;
    color: string; gradient?: string; subtitle?: string;
    onClick?: () => void;
}
const StatCard = ({ title, count, icon, color, gradient, subtitle, onClick }: StatCardProps) => (
    <Card onClick={onClick} sx={{
        height: '100%', borderRadius: 3,
        background: gradient || `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        border: `1.5px solid ${color}25`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: `0 12px 35px ${color}30`, border: `1.5px solid ${color}60` } : {},
    }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="caption" sx={{ color: `${color}`, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                        {title}
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: gradient ? '#fff' : '#1e293b', lineHeight: 1.1, mt: 0.5 }}>
                        {count}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ color: `${color}99`, mt: 0.5, display: 'block' }}>{subtitle}</Typography>
                    )}
                </Box>
                <Avatar sx={{
                    bgcolor: gradient ? 'rgba(255,255,255,0.25)' : `${color}20`,
                    color: gradient ? '#fff' : color,
                    width: 48, height: 48,
                    boxShadow: `0 4px 14px ${color}40`,
                }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

// ─── Quick Nav Tile ──────────────────────────────────────────────────────────
const NavTile = ({ label, path, icon, color, badge }: { label: string; path: string; icon: React.ReactNode; color: string; badge?: number }) => {
    const navigate = useNavigate();
    return (
        <Box onClick={() => navigate(path)} sx={{
            p: 2, borderRadius: 3, bgcolor: `${color}10`, color,
            textAlign: 'center', cursor: 'pointer', border: `1.5px solid ${color}20`,
            transition: 'all 0.2s', position: 'relative',
            '&:hover': { bgcolor: color, color: '#fff', transform: 'scale(1.04)', boxShadow: `0 8px 24px ${color}40` }
        }}>
            {badge !== undefined && badge > 0 && (
                <Badge badgeContent={badge} color="error" sx={{ position: 'absolute', top: 10, right: 10 }}>
                    <span />
                </Badge>
            )}
            <Box mb={0.5} sx={{ fontSize: 24 }}>{icon}</Box>
            <Typography variant="caption" fontWeight={700} display="block" sx={{ fontSize: '0.72rem' }}>{label}</Typography>
        </Box>
    );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const TaskDashboard: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: () => taskService.getTasks(),
        refetchInterval: 60_000,
    });

    const handleRefresh = async () => {
        setRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['tasks'] });
        setTimeout(() => setRefreshing(false), 800);
    };

    const stats = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === 'PENDING').length;
        const inProcess = tasks.filter(t => t.status === 'IN_PROCESS').length;
        const pendingApproval = tasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').length;
        const approved = tasks.filter(t => t.status === 'APPROVED').length;
        const done = tasks.filter(t => t.status === 'DONE').length;
        const overdue = tasks.filter(t => t.isOverdue && t.status !== 'DONE').length;
        const onHold = tasks.filter(t => t.status === 'ON_HOLD').length;
        const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
        const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;
        return { total, pending, inProcess, pendingApproval, approved, done, overdue, onHold, completionRate, overdueRate };
    }, [tasks]);

    // Pie chart data
    const pieData = useMemo(() => [
        { name: 'To Do', value: stats.pending, color: STATUS_COLORS.PENDING },
        { name: 'In Process', value: stats.inProcess, color: STATUS_COLORS.IN_PROCESS },
        { name: 'Pending Approval', value: stats.pendingApproval, color: STATUS_COLORS.PENDING_FOR_APPROVAL },
        { name: 'Done', value: stats.done, color: STATUS_COLORS.DONE },
        { name: 'On Hold', value: stats.onHold, color: STATUS_COLORS.ON_HOLD },
    ].filter(d => d.value > 0), [stats]);

    // Priority bar data
    const priorityData = useMemo(() => [
        { name: 'Urgent', count: tasks.filter(t => t.priority === 'URGENT').length, fill: PRIORITY_COLORS.URGENT },
        { name: 'High', count: tasks.filter(t => t.priority === 'HIGH').length, fill: PRIORITY_COLORS.HIGH },
        { name: 'Medium', count: tasks.filter(t => t.priority === 'MEDIUM').length, fill: PRIORITY_COLORS.MEDIUM },
        { name: 'Low', count: tasks.filter(t => t.priority === 'LOW').length, fill: PRIORITY_COLORS.LOW },
    ], [tasks]);

    // Radial KPI data
    const radialData = useMemo(() => [
        { name: 'Completion', value: stats.completionRate, fill: '#10b981' },
    ], [stats]);

    // Upcoming tasks (next 7 days, not done)
    const upcomingTasks = useMemo(() => {
        const now = new Date();
        const week = new Date(); week.setDate(week.getDate() + 7);
        return tasks
            .filter(t => t.targetDate && t.status !== 'DONE' && new Date(t.targetDate) > now && new Date(t.targetDate) <= week)
            .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
            .slice(0, 6);
    }, [tasks]);

    // Overdue tasks
    const overdueTasks = useMemo(() =>
        tasks.filter(t => t.isOverdue && t.status !== 'DONE').slice(0, 5), [tasks]);

    // Pending approval tasks
    const approvalTasks = useMemo(() =>
        tasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').slice(0, 5), [tasks]);

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (isLoading) {
        return (
            <Box sx={{ p: 4 }}>
                <LinearProgress sx={{ borderRadius: 2, height: 4 }} />
                <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">Loading dashboard…</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f0f2f8', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        lineHeight: 1.2,
                    }}>
                        Task Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.25}>{today}</Typography>
                </Box>
                <Box display="flex" gap={1.5} flexWrap="wrap">
                    <Tooltip title="Refresh data">
                        <IconButton onClick={handleRefresh} sx={{
                            bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                            '&:hover': { bgcolor: '#f0f0ff' },
                            animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                            '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } }
                        }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="outlined" onClick={() => navigate('/admin/tasks/approval')} startIcon={<ApprovalIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#f59e0b', color: '#f59e0b', '&:hover': { borderColor: '#d97706', bgcolor: '#fffbeb' } }}>
                        Approvals {stats.pendingApproval > 0 && <Chip label={stats.pendingApproval} size="small" sx={{ ml: 0.5, bgcolor: '#f59e0b', color: '#fff', height: 18, '& .MuiChip-label': { px: 0.75, py: 0, fontSize: '0.7rem', fontWeight: 700 } }} />}
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/admin/tasks/ongoing')} startIcon={<ProgressIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        View Tasks
                    </Button>
                </Box>
            </Box>

            {/* ── Stats Cards ── */}
            <Grid container spacing={2.5} mb={3}>
                {[
                    { title: 'Total Tasks', count: stats.total, icon: <TaskIcon />, color: '#6366f1', onClick: () => navigate('/admin/tasks/ongoing') },
                    { title: 'In Progress', count: stats.inProcess, icon: <ProgressIcon />, color: '#3b82f6', onClick: () => navigate('/admin/tasks/ongoing') },
                    { title: 'Pending To-Do', count: stats.pending, icon: <PendingIcon />, color: '#94a3b8' },
                    { title: 'Need Approval', count: stats.pendingApproval, icon: <ApprovalIcon />, color: '#f59e0b', onClick: () => navigate('/admin/tasks/approval') },
                    { title: 'Completed', count: stats.done, icon: <DoneIcon />, color: '#10b981' },
                    { title: 'Overdue', count: stats.overdue, icon: <OverdueIcon />, color: '#ef4444' },
                ].map(card => (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={card.title}>
                        <StatCard {...card} />
                    </Grid>
                ))}
            </Grid>

            {/* ── KPI Row + Charts ── */}
            <Grid container spacing={2.5} mb={3}>
                {/* KPI Cards */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Box display="flex" flexDirection="column" gap={2} height="100%">

                        {/* Completion Rate */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, flex: 1, background: 'linear-gradient(135deg, #10b98110 0%, #059669 08 100%)', border: '1.5px solid #10b98125' }}>
                            <Typography variant="caption" fontWeight={700} color="#10b981" textTransform="uppercase" letterSpacing={0.5}>
                                Completion Rate
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Box position="relative" sx={{ width: 64, height: 64 }}>
                                    <ResponsiveContainer width={64} height={64}>
                                        <RadialBarChart innerRadius={20} outerRadius={30} barSize={8} data={radialData} startAngle={90} endAngle={-270}>
                                            <RadialBar dataKey="value" cornerRadius={4} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <Typography variant="caption" fontWeight={900} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#10b981', fontSize: '0.7rem' }}>
                                        {stats.completionRate}%
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight={900} color="#10b981">{stats.completionRate}%</Typography>
                                    <Typography variant="caption" color="text.secondary">{stats.done}/{stats.total} tasks done</Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* On Hold */}
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1.5px solid #8b5cf625' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="#8b5cf6" textTransform="uppercase" letterSpacing={0.5}>On Hold</Typography>
                                    <Typography variant="h4" fontWeight={900} color="#8b5cf6">{stats.onHold}</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', width: 40, height: 40 }}><OnHoldIcon /></Avatar>
                            </Box>
                        </Paper>

                        {/* Approved (waiting for Done) */}
                        <Paper sx={{ p: 2, borderRadius: 3, border: '1.5px solid #2dd4bf25' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" fontWeight={700} color="#2dd4bf" textTransform="uppercase" letterSpacing={0.5}>Approved</Typography>
                                    <Typography variant="h4" fontWeight={900} color="#2dd4bf">{stats.approved}</Typography>
                                    <Typography variant="caption" color="text.secondary">awaiting mark-done</Typography>
                                </Box>
                                <Avatar sx={{ bgcolor: '#2dd4bf15', color: '#2dd4bf', width: 40, height: 40 }}><SpeedIcon /></Avatar>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* Pie Chart */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', minHeight: 320 }}>
                        <Typography variant="subtitle1" fontWeight={800} mb={2}>Task Status Distribution</Typography>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={65} outerRadius={95}
                                        paddingAngle={4} dataKey="value">
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(v: any) => [`${v} tasks`, '']} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" alignItems="center" justifyContent="center" height={260}>
                                <Typography color="text.disabled">No task data yet</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Priority Chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', minHeight: 320 }}>
                        <Typography variant="subtitle1" fontWeight={800} mb={2}>Priority Breakdown</Typography>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={priorityData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {priorityData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* ── Bottom: Lists + Quick Nav ── */}
            <Grid container spacing={2.5}>

                {/* Upcoming this week */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon fontSize="small" />
                                <Typography fontWeight={700}>Upcoming (7 Days)</Typography>
                            </Box>
                            <Chip label={upcomingTasks.length} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }} />
                        </Box>
                        <List dense disablePadding>
                            {upcomingTasks.length > 0 ? upcomingTasks.map((task, i) => {
                                const daysLeft = Math.ceil((new Date(task.targetDate).getTime() - Date.now()) / 86_400_000);
                                return (
                                    <React.Fragment key={task._id}>
                                        <ListItem sx={{ px: 2, py: 1.25 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIORITY_COLORS[task.priority] || '#94a3b8' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight={600} noWrap>{task.title}</Typography>}
                                                secondary={<Typography variant="caption" color="text.secondary">{(task.clientId as Client)?.name || 'Internal'}</Typography>}
                                            />
                                            <Chip label={`${daysLeft}d`} size="small"
                                                sx={{ bgcolor: daysLeft <= 2 ? '#fee2e2' : '#f0fdf4', color: daysLeft <= 2 ? '#dc2626' : '#16a34a', fontWeight: 700, fontSize: '0.65rem' }} />
                                        </ListItem>
                                        {i < upcomingTasks.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            }) : (
                                <Box py={6} textAlign="center">
                                    <DoneIcon sx={{ fontSize: 36, color: '#10b981', opacity: 0.5, mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">All clear for the week!</Typography>
                                </Box>
                            )}
                        </List>
                        {upcomingTasks.length > 0 && (
                            <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
                                <Button fullWidth size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/admin/tasks/ongoing')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                    View All Tasks
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Overdue Tasks */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <OverdueIcon fontSize="small" />
                                <Typography fontWeight={700}>Overdue Tasks</Typography>
                            </Box>
                            <Chip label={overdueTasks.length} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }} />
                        </Box>
                        <List dense disablePadding>
                            {overdueTasks.length > 0 ? overdueTasks.map((task, i) => {
                                const daysLate = Math.ceil((Date.now() - new Date(task.targetDate).getTime()) / 86_400_000);
                                return (
                                    <React.Fragment key={task._id}>
                                        <ListItem sx={{ px: 2, py: 1.25 }}>
                                            <ListItemText
                                                primary={<Typography variant="body2" fontWeight={600} noWrap>{task.title}</Typography>}
                                                secondary={
                                                    <Box display="flex" gap={1} mt={0.25}>
                                                        <Typography variant="caption" color="text.secondary">{(task.clientId as Client)?.name || 'Internal'}</Typography>
                                                        <Typography variant="caption" color="error.main" fontWeight={700}>· {(task.assignedTo as User[])?.map(u => u.name || u.username).join(', ')}</Typography>
                                                    </Box>
                                                }
                                            />
                                            <Chip label={`${daysLate}d late`} size="small"
                                                sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.65rem' }} />
                                        </ListItem>
                                        {i < overdueTasks.length - 1 && <Divider />}
                                    </React.Fragment>
                                );
                            }) : (
                                <Box py={6} textAlign="center">
                                    <DoneIcon sx={{ fontSize: 36, color: '#10b981', opacity: 0.5, mb: 1 }} />
                                    <Typography variant="body2" color="text.secondary">No overdue tasks! 🎉</Typography>
                                </Box>
                            )}
                        </List>
                        {overdueTasks.length > 0 && (
                            <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
                                <Button fullWidth size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/admin/tasks/ongoing')} sx={{ textTransform: 'none', fontWeight: 600, color: '#ef4444' }}>
                                    View Ongoing Tasks
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Pending Approval + Quick Nav */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box display="flex" flexDirection="column" gap={2.5} height="100%">
                        {/* Pending Approval */}
                        {approvalTasks.length > 0 && (
                            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <ApprovalIcon fontSize="small" />
                                        <Typography fontWeight={700}>Awaiting Approval</Typography>
                                    </Box>
                                    <Chip label={approvalTasks.length} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', fontWeight: 700 }} />
                                </Box>
                                {approvalTasks.slice(0, 3).map((task, i) => (
                                    <React.Fragment key={task._id}>
                                        <Box sx={{ px: 2, py: 1.25 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>{task.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">{(task.clientId as Client)?.name || 'Internal'}</Typography>
                                        </Box>
                                        {i < Math.min(approvalTasks.length, 3) - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                                <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0' }}>
                                    <Button fullWidth size="small" variant="contained" endIcon={<ArrowIcon />} onClick={() => navigate('/admin/tasks/approval')}
                                        sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
                                        Go to Approvals
                                    </Button>
                                </Box>
                            </Paper>
                        )}

                        {/* Quick Navigation */}
                        <Paper sx={{ p: 2.5, borderRadius: 3, flex: 1 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <TrendIcon sx={{ color: '#667eea' }} />
                                <Typography variant="subtitle1" fontWeight={800}>Quick Navigation</Typography>
                            </Box>
                            <Grid container spacing={1.5}>
                                {[
                                    { label: 'Task Master', path: '/admin/task-master/list', icon: <TaskIcon />, color: '#6366f1' },
                                    { label: 'Applicability', path: '/admin/task-applicability', icon: <CalendarIcon />, color: '#764ba2' },
                                    { label: 'Ongoing Tasks', path: '/admin/tasks/ongoing', icon: <ProgressIcon />, color: '#3b82f6' },
                                    { label: 'Approvals', path: '/admin/tasks/approval', icon: <ApprovalIcon />, color: '#f59e0b', badge: stats.pendingApproval },
                                    { label: 'Task Cycle', path: '/admin/tasks/cycle-detail', icon: <TimerIcon />, color: '#10b981' },
                                    { label: 'Transfer', path: '/admin/tasks/transfer', icon: <GroupsIcon />, color: '#ec4899' },
                                ].map(nav => (
                                    <Grid size={{ xs: 6 }} key={nav.label}>
                                        <NavTile {...nav} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TaskDashboard;
