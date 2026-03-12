import React from 'react';
import { Box, Typography, Paper, Grid, Card, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Analytics: React.FC = () => {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['super-admin-analytics'],
        queryFn: async () => {
            const res = await api.get('/super-admin/analytics');
            return res.data;
        }
    });

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;

    const metrics = analytics?.metrics || {};

    const mockGrowthData = [
        { month: 'Jan', clients: 50, revenue: 10000 },
        { month: 'Feb', clients: 80, revenue: 15000 },
        { month: 'Mar', clients: 120, revenue: 20000 },
        { month: 'Apr', clients: 190, revenue: 32000 },
        { month: 'May', clients: 250, revenue: 45000 },
        { month: 'Jun', clients: Math.max(0, metrics.totalClients) || 300, revenue: Math.max(0, metrics.totalRevenue) || 60000 },
    ];

    const mockUploads = [
        { name: 'Week 1', files: 120 },
        { name: 'Week 2', files: 210 },
        { name: 'Week 3', files: 180 },
        { name: 'Week 4', files: metrics.totalFiles || 320 }
    ];

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Global Analytics</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#f1f8ff' }}>
                        <Typography color="text.secondary" variant="body2">Total Clients Growth</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2' }}>{metrics.totalClients || 0}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#e8f5e9' }}>
                        <Typography color="text.secondary" variant="body2">Task Completion Rate</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2e7d32' }}>{metrics.taskCompletionRate || '0%'}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#fff8e1' }}>
                        <Typography color="text.secondary" variant="body2">Estimated Revenue (MRR)</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#f57f17' }}>₹{metrics.totalRevenue || 0}</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', bgcolor: '#f3e5f5' }}>
                        <Typography color="text.secondary" variant="body2">Global File Uploads</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#7b1fa2' }}>{metrics.totalFiles || 0}</Typography>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Platform Client & Revenue Trends</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mockGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="clients" stroke="#8884d8" name="Total Clients" strokeWidth={3} />
                                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (₹)" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: 400 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>File Uploads This Month</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mockUploads}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="files" fill="#ffc658" name="Files Stored" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Analytics;
