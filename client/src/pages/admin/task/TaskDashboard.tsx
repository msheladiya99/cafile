import React, { useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Tooltip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    PendingActions as PendingIcon,
    PlayCircleOutline as ProgressIcon,
    CheckCircleOutline as DoneIcon,
    ErrorOutline as ReviewIcon,
    CalendarMonth as CalendarIcon,
    ArrowForward as ArrowIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '../../../services/taskService';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../../../types';

interface StatusCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color?: string;
    gradient?: string;
}

const StatusCard = ({ title, count, icon, color, gradient }: StatusCardProps) => (
    <Card sx={{
        height: '100%',
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        background: gradient || '#fff',
        color: gradient ? '#fff' : 'inherit',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'translateY(-5px)' }
    }}>
        <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="h3" fontWeight={800} mt={1}>{count}</Typography>
                </Box>
                <Avatar sx={{
                    bgcolor: gradient ? 'rgba(255,255,255,0.2)' : `${color}15`,
                    color: gradient ? '#fff' : color,
                    width: 56,
                    height: 56
                }}>
                    {icon}
                </Avatar>
            </Box>
        </CardContent>
    </Card>
);

export const TaskDashboard: React.FC = () => {
    const navigate = useNavigate();

    // Fetch All Tasks
    const { data: tasks = [] } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: () => taskService.getTasks()
    });

    const stats = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === 'PENDING').length;
        const inProcess = tasks.filter(t => t.status === 'IN_PROCESS').length;
        const pendingApproval = tasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').length;
        const done = tasks.filter(t => t.status === 'DONE').length;
        const overdue = tasks.filter(t => t.isOverdue).length;

        return { total, pending, inProcess, pendingApproval, done, overdue };
    }, [tasks]);

    const chartData = useMemo(() => [
        { name: 'To Do', value: stats.pending, color: '#64748b' },
        { name: 'In Progress', value: stats.inProcess, color: '#3b82f6' },
        { name: 'Pending Approval', value: stats.pendingApproval, color: '#f59e0b' },
        { name: 'Completed', value: stats.done, color: '#10b981' },
    ], [stats]);

    const priorityData = useMemo(() => {
        const urgent = tasks.filter(t => t.priority === 'URGENT').length;
        const high = tasks.filter(t => t.priority === 'HIGH').length;
        const medium = tasks.filter(t => t.priority === 'MEDIUM').length;
        const low = tasks.filter(t => t.priority === 'LOW').length;

        return [
            { name: 'Urgent', count: urgent, fill: '#ef4444' },
            { name: 'High', count: high, fill: '#f59e0b' },
            { name: 'Medium', count: medium, fill: '#3b82f6' },
            { name: 'Low', count: low, fill: '#10b981' },
        ];
    }, [tasks]);

    const todayTasks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(t => t.targetDate?.startsWith(today)).slice(0, 5);
    }, [tasks]);

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #2c3e50, #3498db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Task Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive overview of your firm's workflows
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/admin/tasks/board')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        View Kanban Board
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/admin/task-master/add')}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        Create Task Master
                    </Button>
                </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <StatusCard
                        title="Total Tasks"
                        count={stats.total}
                        icon={<TaskIcon />}
                        color="#2c3e50"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <StatusCard
                        title="In Progress"
                        count={stats.inProcess}
                        icon={<ProgressIcon />}
                        color="#3b82f6"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <StatusCard
                        title="Pending"
                        count={stats.pending}
                        icon={<PendingIcon />}
                        color="#64748b"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <StatusCard
                        title="Completed"
                        count={stats.done}
                        icon={<DoneIcon />}
                        color="#10b981"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <StatusCard
                        title="Overdue"
                        count={stats.overdue}
                        icon={<ReviewIcon />}
                        color="#ef4444"
                        gradient="linear-gradient(135deg, #f85032 0%, #e73827 100%)"
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="700" mb={3}>Task Status Distribution</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Typography variant="h6" fontWeight="700" mb={3}>Priority Breakdown</Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} margin={{ top: 0, right: 30, left: 0, bottom: 20 }}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="count" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Bottom Section: Today's Tasks & Mini Calendar */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h6" fontWeight="700">Today's Deadlines</Typography>
                            <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/admin/tasks/board')}>View All</Button>
                        </Box>
                        <List disablePadding>
                            {todayTasks.length > 0 ? todayTasks.map((task) => (
                                <ListItem
                                    key={task._id}
                                    sx={{
                                        px: 2,
                                        py: 1.5,
                                        mb: 1.5,
                                        borderRadius: 3,
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                        border: '1px solid #f0f0f0',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <TaskIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography fontWeight="700">{task.title}</Typography>}
                                        secondary={
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(task.clientId as Client)?.name || 'Internal'}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <Box textAlign="right">
                                        <Typography variant="caption" display="block" color="error" fontWeight="700">
                                            DUE TODAY
                                        </Typography>
                                        <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => navigate('/admin/tasks/board')}>
                                                <ArrowIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            )) : (
                                <Box py={8} textAlign="center">
                                    <DoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5, opacity: 0.5 }} />
                                    <Typography color="text.secondary">No tasks due today. Great job!</Typography>
                                </Box>
                            )}
                        </List>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" fontWeight="700" mb={3}>Quick Navigation</Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Task Master', path: '/admin/task-master/list', icon: <TaskIcon />, color: '#667eea' },
                                { label: 'Applicability', path: '/admin/task-applicability', icon: <CalendarIcon />, color: '#764ba2' },
                                { label: 'Cycle Detail', path: '/admin/tasks/cycle-detail', icon: <TimerIcon />, color: '#764ba2' },
                                { label: 'Approvals', path: '/admin/tasks/approval', icon: <DoneIcon />, color: '#10b981' },
                            ].map((nav) => (
                                <Grid size={{ xs: 6 }} key={nav.label}>
                                    <Box
                                        onClick={() => navigate(nav.path)}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: `${nav.color}10`,
                                            color: nav.color,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: nav.color, color: '#fff', transform: 'scale(1.05)' }
                                        }}
                                    >
                                        <Box mb={1}>{nav.icon}</Box>
                                        <Typography variant="caption" fontWeight="700">{nav.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Box mt="auto" pt={3}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8fafc' }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    <CalendarIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="800">Next 7 Days</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {tasks.filter(t => {
                                            if (!t.targetDate) return false;
                                            const due = new Date(t.targetDate);
                                            const today = new Date();
                                            const nextWeek = new Date();
                                            nextWeek.setDate(today.getDate() + 7);
                                            return due > today && due <= nextWeek;
                                        }).length} tasks upcoming
                                    </Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TaskDashboard;
