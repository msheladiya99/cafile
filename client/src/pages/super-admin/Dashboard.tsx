import React from 'react';
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Stack
} from '@mui/material';
import {
    ArrowForward as ArrowForwardIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
    LineChart, Line, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    color: string;
    icon?: React.ReactNode;
}

interface DashboardFirm {
    _id: string;
    firmName: string;
    subdomain: string;
    plan: string;
    status: string;
    createdAt: string;
}

const ProductCard = ({ title, value, subtitle, color }: StatCardProps) => (
    <Card sx={{ 
        height: '100%', 
        borderRadius: '32px', 
        overflow: 'hidden', 
        border: 'none', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
        bgcolor: '#fff',
        transition: 'transform 0.3s ease',
        '&:hover': { transform: 'translateY(-10px)' }
    }}>
        <Box sx={{ height: '140px', bgcolor: color, position: 'relative' }}>
            <Box sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 20, 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: 'rgba(255,255,255,0.3)' 
            }} />
            <Box sx={{ 
                position: 'absolute', 
                top: 20, 
                left: 40, 
                width: 30, 
                height: 6, 
                borderRadius: '10px', 
                bgcolor: 'rgba(255,255,255,0.2)' 
            }} />
        </Box>
        <CardContent sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {subtitle} <ArrowForwardIcon sx={{ fontSize: 12 }} />
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#111', mt: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#111', mt: 1 }}>
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
        staleTime: 0,
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

    const stats = [
        { title: 'Registered Firms', value: widgets.totalFirms, subtitle: 'firms.overview', color: '#c7d2fe' },
        { title: 'Platform Clients', value: widgets.totalClients, subtitle: 'clients.list', color: '#1e293b' },
        { title: 'System Revenue', value: `₹${widgets.totalRevenue}`, subtitle: 'revenue.reports', color: '#fecaca' },
        { title: 'Platform Health', value: 'Active', subtitle: 'health.check', color: '#4f46e5' },
    ];

    const COLORS = ['#6366f1', '#fb7185', '#fbbf24', '#2dd4bf'];

    return (
        <Box>
            <Box sx={{ mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 1000, color: '#111', letterSpacing: -1.5, mb: 1 }}>
                    Hello Super Admin!
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                    Welcome to your platform overview. Everything is running smoothly.
                </Typography>
            </Box>

            <Box sx={{ mb: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#111' }}>Key Metrics</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        View All Metrics <ArrowForwardIcon sx={{ fontSize: 14 }} />
                    </Typography>
                </Box>
                <Box sx={{ 
                    overflowX: 'auto', 
                    pb: 2,
                    px: 3,
                    mx: -3,
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none'
                }}>
                    <Grid container spacing={3} wrap="nowrap">
                        {stats.map((stat, index) => (
                            <Grid key={index} sx={{ flex: '0 0 auto', width: { xs: '280px', sm: '320px', md: 'calc(25% - 18px)' } }}>
                                <ProductCard title={stat.title} value={String(stat.value)} subtitle={stat.subtitle} color={stat.color} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Box>

            <Grid container spacing={5}>
                {/* Invoicing Style Table */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#111' }}>Recent Registrations</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            View All Invoices <ArrowForwardIcon sx={{ fontSize: 14 }} />
                        </Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#fff', borderRadius: '32px', p: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={{ textAlign: 'left', padding: '20px 24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Firm Name</th>
                                        <th style={{ textAlign: 'left', padding: '20px 24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Plan</th>
                                        <th style={{ textAlign: 'left', padding: '20px 24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Created</th>
                                        <th style={{ textAlign: 'right', padding: '20px 24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentFirms.map((firm: DashboardFirm) => (
                                        <tr key={firm._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '20px 24px' }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#4f46e5', whiteSpace: 'nowrap' }}>#{firm._id.slice(-8)}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>{firm.firmName}</Typography>
                                                </Stack>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b' }}>{firm.plan.toUpperCase()}</Typography>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <Typography sx={{ 
                                                    display: 'inline-block',
                                                    px: 1.5, 
                                                    py: 0.5, 
                                                    borderRadius: '8px', 
                                                    bgcolor: '#fef2f2', 
                                                    color: '#ef4444', 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 800 
                                                }}>
                                                    {new Date(firm.createdAt).toISOString().split('T')[0]}
                                                </Typography>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <Typography variant="body2" sx={{ fontWeight: 900 }}>{firm.status === 'active' ? 'PAID' : 'PENDING'}</Typography>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                </Grid>

                {/* Right Column Charts */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#111' }}>Analytics</Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#fff', borderRadius: '32px', p: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.02)', mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Growth Trend</Typography>
                        <Box sx={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <LineChart data={charts.firmRegistrations}>
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} dot={false} />
                                    <Tooltip />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                    
                    <Box sx={{ bgcolor: '#fff', borderRadius: '32px', p: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Task Distribution</Typography>
                        <Box sx={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={charts.taskActivity}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {Array.isArray(charts.taskActivity) && charts.taskActivity.map((_: unknown, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Video Guides Style Section */}
            <Box sx={{ mt: 8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#111' }}>Platform Guide & Tips</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        View All Guides <ArrowForwardIcon sx={{ fontSize: 14 }} />
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    {[
                        "How to manage multiple firms",
                        "Setting up automated subscriptions",
                        "Understanding system health metrics"
                    ].map((guide, i) => (
                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                            <Box sx={{ 
                                bgcolor: '#fff', 
                                p: 3, 
                                borderRadius: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.01)',
                                border: '1px solid #f8fafc',
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(5px)' }
                            }}>
                                <Box sx={{ 
                                    width: 48, 
                                    height: 48, 
                                    borderRadius: '16px', 
                                    bgcolor: i === 1 ? '#fecaca' : '#c7d2fe', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                }}>
                                    <TrendingUpIcon sx={{ color: i === 1 ? '#ef4444' : '#6366f1' }} />
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{guide}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default SuperAdminDashboard;
