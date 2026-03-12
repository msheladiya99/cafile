import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Divider, Button } from '@mui/material';

const plans = [
    { name: 'Trial', price: 'Free', staff: 3, clients: 10, storage: '1 GB', tasks: 'Unlimited' },
    { name: 'Basic', price: '₹999/mo', staff: 5, clients: 100, storage: '10 GB', tasks: 'Unlimited' },
    { name: 'Professional', price: '₹2,999/mo', staff: 20, clients: 500, storage: '100 GB', tasks: 'Unlimited' },
    { name: 'Enterprise', price: 'Custom', staff: 'Unlimited', clients: 'Unlimited', storage: '1 TB', tasks: 'Unlimited' }
];

const Subscriptions: React.FC = () => {
    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Subscription Management</Typography>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                {plans.map((plan) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.name}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 3, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>{plan.name}</Typography>
                                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 800, mt: 1 }}>{plan.price}</Typography>
                            </Box>
                            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography color="text.secondary">Staff Limit</Typography>
                                    <Typography fontWeight="700">{plan.staff}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography color="text.secondary">Client Limit</Typography>
                                    <Typography fontWeight="700">{plan.clients}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography color="text.secondary">Storage</Typography>
                                    <Typography fontWeight="700">{plan.storage}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography color="text.secondary">Task Limit</Typography>
                                    <Typography fontWeight="700">{plan.tasks}</Typography>
                                </Box>
                                <Box sx={{ mt: 4 }}>
                                    <Button variant="contained" fullWidth sx={{ fontWeight: 700 }}>Edit Plan</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Subscription Usage Analytics</Typography>
                <Typography color="text.secondary">
                    Feature under development. This section will display MRR (Monthly Recurring Revenue), Churn Rate, and Active Plan distributions across all firms.
                </Typography>
            </Paper>
        </Box>
    );
};

export default Subscriptions;
