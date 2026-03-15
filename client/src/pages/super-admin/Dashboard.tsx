import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import {
    Business as BusinessIcon,
    People as PeopleIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon,
    AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

interface DashboardFirm {
    _id: string;
    firmName: string;
    subdomain: string;
    plan: string;
    status: string;
    createdAt: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: `${color}15`,
                    color: color,
                    display: 'flex'
                }}>
                    {icon}
                </Box>
                <Typography variant="h6" sx={{ ml: 2, fontWeight: 700, color: 'text.secondary', fontSize: '1rem' }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const SuperAdminDashboard: React.FC = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['super-admin-dashboard'],
        queryFn: async () => {
            const res = await api.get('/super-admin/dashboard');
            return res.data;
        },
        staleTime: 0, // Ensure we always get fresh data for Super Admin
    });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    interface DashboardResponse {
        widgets: Record<string, number | string>;
        charts: {
            firmRegistrations?: { month: string; count: number; revenue?: number }[];
            taskActivity?: { name: string; value: number }[];
            platformUsage?: { clients?: number; files?: number; tasks?: number };
        };
        recentFirms: DashboardFirm[];
    }
    const { widgets = {}, charts = {}, recentFirms = [] } = (data as DashboardResponse) || {};

    // Formatting numbers for display
    const formatCount = (n: number) => n || 0;

    const stats = [
        { title: 'Total Firms', value: formatCount(widgets.totalFirms as number), icon: <BusinessIcon />, color: '#FF4B2B' },
        { title: 'Total Clients', value: formatCount(widgets.totalClients as number), icon: <PeopleIcon />, color: '#2196F3' },
        { title: 'Total Staff', value: formatCount(widgets.totalStaff as number), icon: <AccountCircleIcon />, color: '#9C27B0' },
        { title: 'Total Documents', value: formatCount((widgets.totalInvoices as number || 0) + (widgets.totalFiles as number || 0)), icon: <AssignmentIcon />, color: '#00BCD4' },
        { title: 'Storage Usage', value: (widgets.storageUsage as string) || '0 MB', icon: <TrendingUpIcon />, color: '#FF9800' },
        { title: 'Total Revenue', value: `₹${formatCount(widgets.totalRevenue as number)}`, icon: <TrendingUpIcon />, color: '#3F51B5' },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
                Platform Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                        <StatCard {...stat} />
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row 1 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Firm Registrations (Last 6 Months)
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <LineChart data={charts.firmRegistrations} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#FF4B2B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="New Firms" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Task Activity
                        </Typography>
                        <Box sx={{ width: '100%', height: 320, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={charts.taskActivity}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {Array.isArray(charts.taskActivity) && charts.taskActivity.map((_: unknown, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts Row 2 */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Platform Usage Metrics
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <BarChart data={[charts.platformUsage]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="clients" fill="#8884d8" name="Total Clients" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="files" fill="#82ca9d" name="Files Uploaded" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="tasks" fill="#ffc658" name="Total Tasks" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Monthly Revenue
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <LineChart data={charts.firmRegistrations} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (₹)" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            {/* Recent Firms Section */}
            <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 700 }}>
                Recent Firm Registrations
            </Typography>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 4, bgcolor: 'white' }}>
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontWeight: 600 }}>Firm Name</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontWeight: 600 }}>Subdomain</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontWeight: 600 }}>Plan</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontWeight: 600 }}>Created Date</th>
                                <th style={{ textAlign: 'left', padding: '16px 24px', color: '#64748b', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentFirms.map((firm: DashboardFirm) => (
                                <tr key={firm._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 24px', fontWeight: 700, color: '#1e293b' }}>{firm.firmName}</td>
                                    <td style={{ padding: '16px 24px', color: '#64748b', fontFamily: 'monospace' }}>{firm.subdomain}.mycafile.in</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            bgcolor: firm.plan === 'enterprise' ? '#f5f3ff' : '#eff6ff',
                                            color: firm.plan === 'enterprise' ? '#7c3aed' : '#2563eb',
                                            textTransform: 'uppercase'
                                        }}>
                                            {firm.plan}
                                        </Box>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#64748b' }}>
                                        {new Date(firm.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            color: firm.status === 'active' ? '#10b981' : '#f59e0b',
                                            fontWeight: 700,
                                            fontSize: '0.85rem'
                                        }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                            {firm.status.charAt(0).toUpperCase() + firm.status.slice(1)}
                                        </Box>
                                    </td>
                                </tr>
                            ))}
                            {(!recentFirms.length) && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                                        No recent registrations found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Box>
            </Paper>
        </Box>
    );
};

export default SuperAdminDashboard;
