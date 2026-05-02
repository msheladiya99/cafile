import React, { useMemo, useState } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Chip,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AccountBalanceWallet,
    Add,
    Assignment,
    AutoAwesome,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CloudUpload,
    ErrorOutline,
    Groups,
    NotificationsActive,
    Paid,
    People,
    PersonAdd,
    ReceiptLong,
    Send,
    TaskAlt,
    TrendingDown,
    TrendingUp,
    WarningAmber,
} from '@mui/icons-material';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as ChartTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { reminderService } from '../../services/reminderService';
import { CommonButton } from '../../components/common/UIComponents';
import { useAuth } from '../../contexts/AuthContext';

const cardSx = {
    borderRadius: 3,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
    border: '1px solid rgba(226,232,240,0.9)',
    background: '#ffffff',
};

const money = (value = 0) => value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const formatDate = (value?: string) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : 'No date';

interface DashboardPayload {
    clientCount: number;
    activeClientCount: number;
    pendingTasks: number;
    staffCount?: number;
    reminders: any[];
    overdueReminders: any[];
    tasksDueToday: any[];
    clientsPendingDocuments: any[];
    highPriorityTasks: any[];
    recentFiles: any[];
    billing: {
        totalInvoiced: number;
        totalReceived: number;
        pendingPayments: number;
        collectionPending: number;
        overdueInvoices: number;
    };
    performance: {
        monthlyRevenue: Array<{ month: string; invoiced: number; received: number }>;
        workCompletion: Array<{ month: string; completion: number }>;
        clientGrowth: Array<{ month: string; clients: number }>;
        filingSuccessRate: number;
    };
    employeeWorkload: Array<{ name: string; role: string; total: number; completed: number; pending: number; completionRate: number }>;
    reminderStatus: {
        sentToday: number;
        failedToday: number;
        skippedToday: number;
        pendingReminders: number;
        recentNotificationLogs: any[];
    };
    aiInsights: string[];
    dscSummary: { total: number; expiringSoon: number; expired: number };
    trends: { revenue: number; collection: number };
}

const priorityColor = (priority?: string) => {
    if (priority === 'URGENT' || priority === 'HIGH') return 'error';
    if (priority === 'MEDIUM') return 'warning';
    return 'default';
};

const ComplianceCalendar: React.FC<{ reminders: any[]; overdue: any[] }> = ({ reminders, overdue }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [filter, setFilter] = useState('ALL');

    const calendarEvents = useMemo(() => {
        const staticEvents = [
            { day: 7, type: 'TDS', label: 'TDS Payment', color: '#0f766e' },
            { day: 11, type: 'GST', label: 'GSTR-1', color: '#4f46e5' },
            { day: 20, type: 'GST', label: 'GSTR-3B', color: '#dc2626' },
            { day: 31, type: 'TDS', label: 'TDS Return', color: '#d97706' },
        ];
        const dynamic = [...reminders, ...overdue].map((item) => ({
            day: new Date(item.dueDate).getDate(),
            type: item.reminderType || 'CUSTOM',
            label: item.title,
            color: item.status === 'OVERDUE' ? '#dc2626' : '#2563eb',
        }));
        return [...staticEvents, ...dynamic].filter((item) => filter === 'ALL' || item.type === filter);
    }, [filter, overdue, reminders]);

    const today = new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Smart Compliance Calendar</Typography>
                    <Typography variant="body2" color="text.secondary">GST, TDS, ITR and custom reminders</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => setViewDate(new Date(year, month - 1, 1))}><ChevronLeft /></IconButton>
                    <IconButton size="small" onClick={() => setViewDate(new Date(year, month + 1, 1))}><ChevronRight /></IconButton>
                </Stack>
            </Stack>
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                {['ALL', 'GST', 'TDS', 'ITR', 'CUSTOM'].map((item) => (
                    <Chip key={item} label={item} size="small" onClick={() => setFilter(item)} color={filter === item ? 'primary' : 'default'} />
                ))}
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
                    const events = calendarEvents.filter((event) => event.day === day).slice(0, 3);
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    return (
                        <Tooltip key={day} title={events.map((event) => event.label).join(', ') || 'No compliance event'}>
                            <Box
                                sx={{
                                    minHeight: 46,
                                    borderRadius: 2,
                                    border: isToday ? '2px solid #111827' : '1px solid #e5e7eb',
                                    p: 0.75,
                                    bgcolor: events.length ? '#f8fafc' : '#fff',
                                    cursor: events.length ? 'pointer' : 'default',
                                }}
                            >
                                <Typography variant="caption" fontWeight={isToday ? 900 : 700}>{day}</Typography>
                                <Stack direction="row" spacing={0.35} mt={0.4}>
                                    {events.map((event, eventIndex) => (
                                        <Box key={`${event.label}-${eventIndex}`} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: event.color }} />
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

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isManager } = useAuth();
    const { data, isLoading } = useQuery<DashboardPayload>({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => (await adminService.getDashboardStats()) as unknown as DashboardPayload,
        refetchInterval: 15000,
    });

    const { data: automationSummary } = useQuery({
        queryKey: ['reminderAutomationSummary'],
        queryFn: reminderService.getAutomationSummary,
        refetchInterval: 15000,
    });

    const pendingTasks = Number(data?.pendingTasks || 0);
    const overdueCompliance = Number(data?.overdueReminders?.length || 0);
    const billing = data?.billing;
    const performance = data?.performance;
    const reminderStatus = data?.reminderStatus;
    const dscSummary = data?.dscSummary;

    const kpis = [
        { label: 'Total Clients', value: data?.clientCount || 0, icon: <People />, color: '#2563eb', bg: '#eff6ff', trend: '+8%', path: '/admin/client/list' },
        { label: 'Active Clients', value: data?.activeClientCount || 0, icon: <Groups />, color: '#059669', bg: '#ecfdf5', trend: '+5%', path: '/admin/client/list' },
        { label: 'Pending Tasks', value: pendingTasks, icon: <Assignment />, color: '#d97706', bg: '#fffbeb', trend: '+12%', path: '/admin/tasks' },
        { label: 'Overdue Compliance', value: overdueCompliance, icon: <WarningAmber />, color: '#dc2626', bg: '#fef2f2', trend: overdueCompliance ? '+urgent' : '0', path: '/admin/reminders' },
        { label: 'Revenue This Month', value: money(billing?.totalInvoiced || 0), icon: <Paid />, color: '#7c3aed', bg: '#f5f3ff', trend: `${data?.trends?.revenue || 0}%`, path: '/admin/billing' },
        { label: 'Collection Pending', value: money(billing?.collectionPending || billing?.pendingPayments || 0), icon: <AccountBalanceWallet />, color: '#be123c', bg: '#fff1f2', trend: `${data?.trends?.collection || 0}%`, path: '/admin/client-ledger' },
    ];

    const urgentActions = [
        ...(data?.tasksDueToday || []).map((task: any) => ({ type: 'Due Today', title: task.title, meta: task.clientId?.name || 'Internal task', priority: task.priority, path: '/admin/tasks' })),
        ...(data?.overdueReminders || []).map((reminder: any) => ({ type: 'Overdue Filing', title: reminder.title, meta: reminder.clientId?.name || 'Client', priority: 'URGENT', path: '/admin/reminders' })),
        ...(data?.clientsPendingDocuments || []).map((task: any) => ({ type: 'Documents Pending', title: task.title, meta: task.clientId?.name || 'Client response needed', priority: 'HIGH', path: '/admin/tasks' })),
        ...(data?.highPriorityTasks || []).map((task: any) => ({ type: 'High Priority', title: task.title, meta: formatDate(task.targetDate), priority: task.priority, path: '/admin/tasks' })),
    ].slice(0, 8);

    const quickActions = [
        { label: 'Add Client', icon: <PersonAdd />, path: '/admin/client/master' },
        { label: 'Create Task', icon: <TaskAlt />, path: '/admin/task-applicability?single=true' },
        { label: 'Upload Document', icon: <CloudUpload />, path: '/admin/upload' },
        { label: 'Generate Invoice', icon: <ReceiptLong />, path: '/admin/billing' },
        { label: 'Send Reminder', icon: <Send />, path: '/admin/reminders' },
    ];

    const workloadPie = (data?.employeeWorkload || []).slice(0, 5).map((item: any) => ({ name: item.name, value: item.pending }));
    const pieColors = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626'];

    return (
        <Box sx={{ px: { xs: 1, md: 2 }, pb: 5 }}>
            <Helmet>
                <title>Command Center | MyCAFile</title>
                <meta name="description" content="Modern CA practice dashboard for compliance, billing, client activity and team workload." />
            </Helmet>

            <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} spacing={2.5} mb={3}>
                <Box>
                    <Chip label={isAdmin || isManager ? 'Firm Command Center' : 'My Work Dashboard'} size="small" sx={{ mb: 1, fontWeight: 800, bgcolor: '#e0f2fe', color: '#075985' }} />
                    <Typography variant="h4" fontWeight={900} letterSpacing={0}>
                        Good day, {user?.name || user?.username || 'Team'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Urgent compliance, client activity, billing and workload in one operational view.
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <CommonButton variant="outlined" startIcon={<NotificationsActive />} onClick={() => navigate('/admin/reminders')}>Reminder Center</CommonButton>
                    <CommonButton variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/client/master')}>New Client</CommonButton>
                </Stack>
            </Stack>

            <Grid container spacing={2.5} mb={2.5}>
                {kpis.map((kpi) => (
                    <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 2 }}>
                        <Paper onClick={() => navigate(kpi.path)} sx={{ ...cardSx, p: 2, height: '100%', cursor: 'pointer', transition: '0.2s ease', '&:hover': { transform: 'translateY(-3px)' } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color, width: 42, height: 42 }}>{kpi.icon}</Avatar>
                                <Chip
                                    size="small"
                                    icon={String(kpi.trend).startsWith('-') ? <TrendingDown /> : <TrendingUp />}
                                    label={kpi.trend}
                                    sx={{ height: 24, fontWeight: 800, bgcolor: '#f8fafc' }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" fontWeight={700} mt={2}>{kpi.label}</Typography>
                            {isLoading ? <Skeleton height={42} /> : <Typography variant="h5" fontWeight={900}>{kpi.value}</Typography>}
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, xl: 7 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Urgent Action Center</Typography>
                                <Typography variant="body2" color="text.secondary">Today’s highest-impact work queue</Typography>
                            </Box>
                            <Chip label={`${urgentActions.length} actions`} color={urgentActions.length ? 'error' : 'success'} sx={{ fontWeight: 800 }} />
                        </Stack>
                        <Stack spacing={1.25}>
                            {isLoading ? [1, 2, 3].map((item) => <Skeleton key={item} height={68} sx={{ borderRadius: 2 }} />) : urgentActions.length ? urgentActions.map((item, index) => (
                                <Box key={`${item.type}-${index}`} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: item.priority === 'URGENT' ? '#fff1f2' : '#fffaf0' }}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1.5}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Avatar sx={{ bgcolor: item.priority === 'URGENT' ? '#fee2e2' : '#fef3c7', color: item.priority === 'URGENT' ? '#dc2626' : '#b45309' }}>
                                                {item.priority === 'URGENT' ? <ErrorOutline /> : <WarningAmber />}
                                            </Avatar>
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                    <Typography variant="subtitle2" fontWeight={900}>{item.title}</Typography>
                                                    <Chip size="small" label={item.type} color={priorityColor(item.priority) as any} sx={{ fontWeight: 800 }} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">{item.meta}</Typography>
                                            </Box>
                                        </Stack>
                                        <CommonButton size="small" variant="contained" onClick={() => navigate(item.path)}>Take Action</CommonButton>
                                    </Stack>
                                </Box>
                            )) : (
                                <Alert severity="success" sx={{ borderRadius: 2 }}>No urgent action pending. The desk is clear.</Alert>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, xl: 5 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Quick Action Panel</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>One-click paths for daily CA workflows</Typography>
                        <Grid container spacing={1.5}>
                            {quickActions.map((action) => (
                                <Grid key={action.label} size={{ xs: 12, sm: action.label === 'Send Reminder' ? 12 : 6 }}>
                                    <Box onClick={() => navigate(action.path)} sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', bgcolor: '#f8fafc', cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' } }}>
                                        <Stack direction="row" spacing={1.25} alignItems="center">
                                            <Avatar sx={{ bgcolor: '#fff', color: '#4f46e5' }}>{action.icon}</Avatar>
                                            <Typography variant="body2" fontWeight={900}>{action.label}</Typography>
                                        </Stack>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                    <ComplianceCalendar reminders={data?.reminders || []} overdue={data?.overdueReminders || []} />
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: '#eef2ff', color: '#4f46e5' }}><AutoAwesome /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>AI Insights</Typography>
                                <Typography variant="body2" color="text.secondary">Smart exceptions and workload signals</Typography>
                            </Box>
                        </Stack>
                        <Stack spacing={1.25}>
                            {(data?.aiInsights || []).map((insight: string, index: number) => (
                                <Alert key={index} icon={index < 2 ? <WarningAmber /> : <AutoAwesome />} severity={index < 2 ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
                                    {insight}
                                </Alert>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ ...cardSx, p: 2.5 }}>
                        <Typography variant="h6" fontWeight={900}>Firm Performance Analytics</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Revenue, work completion and client growth</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Box sx={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performance?.monthlyRevenue || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <ChartTooltip formatter={(value) => money(Number(value || 0))} />
                                            <Area type="monotone" dataKey="invoiced" stroke="#4f46e5" fill="#c7d2fe" name="Invoiced" />
                                            <Area type="monotone" dataKey="received" stroke="#059669" fill="#bbf7d0" name="Received" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box sx={{ height: 120, mb: 2 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={performance?.workCompletion || []}>
                                            <XAxis dataKey="month" hide />
                                            <YAxis hide domain={[0, 100]} />
                                            <ChartTooltip />
                                            <Line type="monotone" dataKey="completion" stroke="#0f766e" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ height: 120 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performance?.clientGrowth || []}>
                                            <XAxis dataKey="month" hide />
                                            <YAxis hide />
                                            <ChartTooltip />
                                            <Bar dataKey="clients" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Auto Reminder Status</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Notification automation health</Typography>
                        <Grid container spacing={1.5}>
                            {[
                                ['Sent Today', reminderStatus?.sentToday ?? automationSummary?.sentToday ?? 0, '#059669'],
                                ['Failed', reminderStatus?.failedToday ?? automationSummary?.failedToday ?? 0, '#dc2626'],
                                ['Pending', reminderStatus?.pendingReminders ?? automationSummary?.automatedPending ?? 0, '#d97706'],
                                ['DSC Soon', dscSummary?.expiringSoon ?? 0, '#7c3aed'],
                            ].map(([label, value, color]) => (
                                <Grid key={label as string} size={{ xs: 6 }}>
                                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
                                        <Typography variant="h5" fontWeight={900} sx={{ color }}>{value}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Client Activity Panel</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Recent uploads and responses</Typography>
                        <Stack spacing={1.25}>
                            {(data?.recentFiles || []).slice(0, 6).map((file: any) => (
                                <Stack key={file._id} direction="row" spacing={1.25} alignItems="center">
                                    <Avatar sx={{ bgcolor: '#ecfeff', color: '#0891b2' }}><CloudUpload /></Avatar>
                                    <Box minWidth={0}>
                                        <Typography variant="body2" fontWeight={800} noWrap>{file.originalFileName || file.fileName}</Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap display="block">{file.clientId?.name || 'Client'} · {formatDate(file.uploadedAt)}</Typography>
                                    </Box>
                                </Stack>
                            ))}
                            {!(data?.recentFiles || []).length && <Typography variant="body2" color="text.secondary">No recent client activity yet.</Typography>}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Billing & Collection Summary</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Invoice movement and pending money</Typography>
                        {[
                            ['Total Invoiced', money(billing?.totalInvoiced || 0), '#4f46e5'],
                            ['Amount Received', money(billing?.totalReceived || 0), '#059669'],
                            ['Pending Payments', money(billing?.pendingPayments || 0), '#d97706'],
                            ['Overdue Invoices', billing?.overdueInvoices || 0, '#dc2626'],
                        ].map(([label, value, color]) => (
                            <Box key={label as string} mb={1.6}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                                    <Typography variant="body2" fontWeight={900} sx={{ color }}>{value}</Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ ...cardSx, p: 2.5, height: '100%' }}>
                        <Typography variant="h6" fontWeight={900}>Employee Task Tracking</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>Assigned tasks and workload distribution</Typography>
                        <Box sx={{ height: 150, mb: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={workloadPie} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68}>
                                        {workloadPie.map((_: any, index: number) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}
                                    </Pie>
                                    <ChartTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                        <Stack spacing={1}>
                            {(data?.employeeWorkload || []).slice(0, 5).map((employee: any) => (
                                <Box key={employee.name}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" fontWeight={800}>{employee.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{employee.pending} pending · {employee.completionRate}%</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate" value={employee.completionRate} sx={{ height: 7, borderRadius: 10 }} />
                                </Box>
                            ))}
                            {!(data?.employeeWorkload || []).length && <Typography variant="body2" color="text.secondary">No employee workload yet.</Typography>}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ ...cardSx, p: 2.5 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" mb={1}>
                            <Avatar sx={{ bgcolor: '#ecfdf5', color: '#059669' }}><CheckCircle /></Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Operating Rhythm</Typography>
                                <Typography variant="body2" color="text.secondary">Real-time dashboard refreshes every 15 seconds with cached API queries for smooth performance.</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
