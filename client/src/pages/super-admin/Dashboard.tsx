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
    Receipt as ReceiptIcon,
    TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon,
    StopCircle as StopCircleIcon,
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
        }
    });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    const { widgets, charts } = data || { widgets: {}, charts: {} };

    // Formatting numbers for display
    const formatCount = (n: number) => n || 0;

    const stats = [
        { title: 'Total Firms', value: formatCount(widgets.totalFirms), icon: <BusinessIcon />, color: '#FF4B2B' },
        { title: 'Active Firms', value: formatCount(widgets.activeFirms), icon: <TrendingUpIcon />, color: '#4CAF50' },
        { title: 'Suspended Firms', value: formatCount(widgets.suspendedFirms), icon: <StopCircleIcon />, color: '#F44336' },
        { title: 'Total Users', value: formatCount(widgets.totalUsers), icon: <AccountCircleIcon />, color: '#9C27B0' },
        { title: 'Total Clients', value: formatCount(widgets.totalClients), icon: <PeopleIcon />, color: '#2196F3' },
        { title: 'Total Tasks', value: formatCount(widgets.totalTasks), icon: <AssignmentIcon />, color: '#FF9800' },
        { title: 'Total Invoices', value: formatCount(widgets.totalInvoices), icon: <ReceiptIcon />, color: '#795548' },
        { title: 'Total Revenue', value: `₹${formatCount(widgets.totalRevenue)}`, icon: <TrendingUpIcon />, color: '#3F51B5' },
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
                                        {charts.taskActivity?.map((_: unknown, index: number) => (
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
        </Box>
    );
};

export default SuperAdminDashboard;
