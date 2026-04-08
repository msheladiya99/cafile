import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Chip,
    Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';

export const SubscriptionDetails: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Fetch dashboard stats to get actual active client count
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => adminService.getDashboardStats()
    });

    const activeClientsCount = stats?.clientCount || 0;
    const activeStaffCount = stats?.staffCount || 0;
    const storageUsedGB = stats?.storageUsedGB || 0;
    const planLimits = stats?.planLimits || { clients: 50, storageGB: 0.5, staff: 5 };
    const firmPlan = stats?.firmPlan || 'Free Trial';
    const firmSub = stats?.firmSubscription;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '-');
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Subscription Details
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/admin/billing')}>
                    Manage Billing & Invoices
                </Button>
            </Box>

            {firmSub?.status === 'inactive' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Your subscription is currently inactive or past due. Please update your billing to restore services.
                </Alert>
            )}

            {/* Current Subscription Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 4 }}>
                <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700}>Current Subscription</Typography>
                        <Typography variant="body2" color="text.secondary">Shows your current subscriptions constraints</Typography>
                    </Box>
                    <Chip label={firmSub?.status || 'Active'} color={firmSub?.status === 'inactive' ? 'error' : 'success'} size="small" />
                </Box>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 4 }}><Typography color="text.secondary" fontWeight={600}>Current Firm</Typography></Grid>
                        <Grid size={{ xs: 12, sm: 8 }}><Typography>{(user as any)?.firm?.firmName || 'My CA Firm'}</Typography></Grid>

                        <Grid size={{ xs: 12, sm: 4 }}><Typography color="text.secondary" fontWeight={600}>Current Plan</Typography></Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography fontWeight={600} color="primary.main">{firmPlan}</Typography>
                                <Button size="small" variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Change Plan</Button>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}><Typography color="text.secondary" fontWeight={600}>Plan Start Date</Typography></Grid>
                        <Grid size={{ xs: 12, sm: 8 }}><Typography>{formatDate(firmSub?.startDate)}</Typography></Grid>

                        <Grid size={{ xs: 12, sm: 4 }}><Typography color="text.secondary" fontWeight={600}>Plan Expiry Date</Typography></Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Typography>{formatDate(firmSub?.endDate)}</Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}><Typography color="text.secondary" fontWeight={600}>Document Storage Limit</Typography></Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography>{planLimits.storageGB.toFixed(2)} GB ({storageUsedGB.toFixed(2)} GB used)</Typography>
                                <Button size="small" variant="text" sx={{ textTransform: 'none', fontWeight: 600 }}>+ Add Storage</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Client Limits Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Resource Limits</Typography>
                </Box>
                <CardContent sx={{ p: 0 }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { fontSize: '0.8rem', color: 'text.secondary', fontWeight: 700 } }}>
                                    <TableCell>PARTICULARS</TableCell>
                                    <TableCell align="right">CLIENTS</TableCell>
                                    <TableCell align="right">STAFF</TableCell>
                                    <TableCell align="right">STORAGE</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Limit as per your Plan</TableCell>
                                    <TableCell align="right">{planLimits.clients}</TableCell>
                                    <TableCell align="right">{planLimits.staff}</TableCell>
                                    <TableCell align="right">{planLimits.storageGB} GB</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Currently Used (Active)</TableCell>
                                    <TableCell align="right">{activeClientsCount}</TableCell>
                                    <TableCell align="right">{activeStaffCount}</TableCell>
                                    <TableCell align="right">{storageUsedGB.toFixed(2)} GB</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 800 }}>Available Limit</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>{Math.max(0, planLimits.clients - activeClientsCount)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>{Math.max(0, planLimits.staff - activeStaffCount)}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800 }}>{Math.max(0, planLimits.storageGB - storageUsedGB).toFixed(2)} GB</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SubscriptionDetails;
