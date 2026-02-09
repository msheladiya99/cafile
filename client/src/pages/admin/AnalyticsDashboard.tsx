import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    People as PeopleIcon,
    Folder as FolderIcon,
    TrendingUp as TrendingUpIcon,
    CloudUpload as UploadIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';
import type { DashboardAnalytics } from '../../services/analyticsService';
import { ChartCard } from '../../components/ChartCard';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

export const AnalyticsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await analyticsService.getDashboardAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !analytics) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    // Prepare data for charts
    const categoryData = analytics.categoryDistribution.map(item => ({
        name: item.category,
        value: item.count,
    }));

    const uploadTrendsData = analytics.uploadTrends.map(item => ({
        name: `${item.year}-${String(item.month).padStart(2, '0')}`,
        uploads: item.count,
    }));

    const storageData = analytics.storageByClient.slice(0, 5).map(item => ({
        name: item.clientName.length > 20 ? item.clientName.substring(0, 20) + '...' : item.clientName,
        size: (item.totalSize / (1024 * 1024)).toFixed(2), // Convert to MB
        files: item.fileCount,
    }));

    const statCards = [
        {
            title: 'Total Clients',
            value: analytics.summary.totalClients,
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            color: '#667eea',
            bgColor: 'rgba(102, 126, 234, 0.1)',
            change: '+12%',
        },
        {
            title: 'Total Files',
            value: analytics.summary.totalFiles,
            icon: <FolderIcon sx={{ fontSize: 40 }} />,
            color: '#f093fb',
            bgColor: 'rgba(240, 147, 251, 0.1)',
            change: '+8%',
        },
        {
            title: 'Recent Uploads',
            value: analytics.summary.recentFiles,
            icon: <UploadIcon sx={{ fontSize: 40 }} />,
            color: '#4facfe',
            bgColor: 'rgba(79, 172, 254, 0.1)',
            subtitle: 'Last 30 days',
        },
        {
            title: 'Active Users',
            value: analytics.summary.totalUsers,
            icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
            color: '#00f2fe',
            bgColor: 'rgba(0, 242, 254, 0.1)',
        },
    ];

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, pb: 5, maxWidth: '100%', width: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                        Analytics Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comprehensive insights into your CA practice
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<EventIcon />}
                    onClick={() => navigate('/admin/reports')}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                    }}
                >
                    Monthly Reports
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
                {statCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                transition: 'all 0.2s',
                                height: '100%',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                                },
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box flex={1}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h4" fontWeight="700" mb={0.5}>
                                            {card.value.toLocaleString()}
                                        </Typography>
                                        {card.subtitle && (
                                            <Typography variant="caption" color="text.secondary">
                                                {card.subtitle}
                                            </Typography>
                                        )}
                                        {card.change && (
                                            <Chip
                                                label={card.change}
                                                size="small"
                                                sx={{
                                                    mt: 1,
                                                    height: 20,
                                                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                                                    color: '#4caf50',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            bgcolor: card.bgColor,
                                            color: card.color,
                                            p: 1.5,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row 1 */}
            <Grid container spacing={2} mb={2}>
                {/* Upload Trends */}
                <Grid item xs={12} md={8}>
                    <ChartCard
                        title="File Upload Trends"
                        subtitle="Last 6 months"
                        height={320}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={uploadTrendsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="uploads"
                                    stroke="#667eea"
                                    strokeWidth={3}
                                    dot={{ fill: '#667eea', r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Grid>

                {/* Category Distribution */}
                <Grid item xs={12} md={4}>
                    <ChartCard
                        title="Category Distribution"
                        subtitle="File types breakdown"
                        height={320}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Grid>
            </Grid>

            {/* Charts Row 2 */}
            <Grid container spacing={2} mb={3}>
                {/* Storage Usage */}
                <Grid item xs={12} md={6}>
                    <ChartCard
                        title="Storage Usage by Client"
                        subtitle="Top 5 clients by storage"
                        height={320}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#666" />
                                <YAxis stroke="#666" label={{ value: 'MB', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="size" fill="#764ba2" name="Storage (MB)" />
                                <Bar dataKey="files" fill="#4facfe" name="File Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </Grid>

                {/* Most Active Clients */}
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 2,
                            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                            height: '100%',
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Most Active Clients
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Top uploaders (last 30 days)
                        </Typography>
                        <List>
                            {analytics.mostActiveClients.map((client, index) => (
                                <React.Fragment key={client.clientId}>
                                    <ListItem
                                        sx={{
                                            borderRadius: 2,
                                            mb: 1,
                                            '&:hover': {
                                                bgcolor: 'rgba(102, 126, 234, 0.05)',
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]} 0%, ${COLORS[(index + 1) % COLORS.length]} 100%)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                mr: 2,
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <ListItemText
                                            primary={client.clientName}
                                            secondary={`${client.uploadCount} uploads`}
                                            primaryTypographyProps={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            label={`${client.uploadCount}`}
                                            size="small"
                                            sx={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </ListItem>
                                    {index < analytics.mostActiveClients.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>

            {/* Client Activity Table */}
            <Paper
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                }}
            >
                <Typography variant="h6" fontWeight="700" gutterBottom>
                    Recent Client Activity
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Last login times for all clients
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Client Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {analytics.clientActivity.slice(0, 10).map((activity) => {
                                const lastLogin = activity.lastLogin ? new Date(activity.lastLogin) : null;
                                const now = Date.now();
                                const timeSinceLogin = lastLogin ? now - lastLogin.getTime() : null;

                                // Calculate time differences
                                const minutesSince = timeSinceLogin ? Math.floor(timeSinceLogin / (1000 * 60)) : null;
                                const hoursSince = timeSinceLogin ? Math.floor(timeSinceLogin / (1000 * 60 * 60)) : null;
                                const daysSince = timeSinceLogin ? Math.floor(timeSinceLogin / (1000 * 60 * 60 * 24)) : null;

                                // Format last login display
                                let lastLoginDisplay = 'Never';
                                if (lastLogin) {
                                    if (minutesSince !== null && minutesSince < 60) {
                                        lastLoginDisplay = `${minutesSince} min${minutesSince !== 1 ? 's' : ''} ago`;
                                    } else if (hoursSince !== null && hoursSince < 24) {
                                        lastLoginDisplay = `${hoursSince} hour${hoursSince !== 1 ? 's' : ''} ago`;
                                    } else {
                                        lastLoginDisplay = lastLogin.toLocaleDateString();
                                    }
                                }

                                // Determine status
                                let statusLabel = 'Never logged in';
                                let statusColor = '#666';
                                let statusBgColor = '#e0e0e0';

                                if (daysSince !== null) {
                                    if (daysSince === 0) {
                                        statusLabel = 'Active today';
                                        statusColor = '#4caf50';
                                        statusBgColor = 'rgba(76, 175, 80, 0.1)';
                                    } else if (daysSince <= 7) {
                                        statusLabel = 'Active';
                                        statusColor = '#4caf50';
                                        statusBgColor = 'rgba(76, 175, 80, 0.1)';
                                    } else if (daysSince <= 30) {
                                        statusLabel = 'Inactive';
                                        statusColor = '#ff9800';
                                        statusBgColor = 'rgba(255, 152, 0, 0.1)';
                                    } else {
                                        statusLabel = 'Very Inactive';
                                        statusColor = '#f44336';
                                        statusBgColor = 'rgba(244, 67, 54, 0.1)';
                                    }
                                }

                                return (
                                    <TableRow key={activity.userId} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>{activity.clientName}</TableCell>
                                        <TableCell>{activity.username}</TableCell>
                                        <TableCell>{activity.email}</TableCell>
                                        <TableCell>{lastLoginDisplay}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={statusLabel}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusBgColor,
                                                    color: statusColor,
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};
