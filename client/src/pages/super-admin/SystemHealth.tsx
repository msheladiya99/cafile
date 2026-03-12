import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { Storage as DatabaseIcon, Memory as MemoryIcon, AccessTime as TimeIcon, CloudQueue as CloudIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const SystemHealth: React.FC = () => {
    const { data: health, isLoading, error } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const res = await api.get('/super-admin/system-health');
            return res.data;
        },
        refetchInterval: 15000 // refresh every 15s
    });

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Error loading system health.</Typography>;

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>System Health Monitor</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 2, mr: 3 }}>
                                <DatabaseIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" variant="body2">Database Status</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: health?.database === 'Connected' ? '#4CAF50' : '#F44336' }}>
                                    {health?.database || 'Unknown'}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: '#fff3e0', color: '#f57c00', borderRadius: 2, mr: 3 }}>
                                <TimeIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" variant="body2">API Gateway Latency</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{health?.apiDelay || '--'}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: '#fce4ec', color: '#e91e63', borderRadius: 2, mr: 3 }}>
                                <MemoryIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" variant="body2">Server Memory Usage</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{health?.memory?.rss || '--'}</Typography>
                                <Typography variant="body2" color="text.secondary">Total App Heap: {health?.memory?.heapTotal}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ p: 2, bgcolor: '#e8f5e9', color: '#4caf50', borderRadius: 2, mr: 3 }}>
                                <CloudIcon fontSize="large" />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" variant="body2">Cloud Storage API</Typography>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>Online</Typography>
                                <Typography variant="body2" color="text.secondary">Google Drive Configured</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ p: 4, mt: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>System Details</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6, md: 3 }}><Typography color="text.secondary">System Total RAM:</Typography><Typography fontWeight="700">{health?.memory?.systemTotal}</Typography></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><Typography color="text.secondary">System Free RAM:</Typography><Typography fontWeight="700">{health?.memory?.systemFree}</Typography></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><Typography color="text.secondary">Process Uptime:</Typography><Typography fontWeight="700">{health?.uptime}</Typography></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><Typography color="text.secondary">Total Requests:</Typography><Typography fontWeight="700">{health?.totalRequests}</Typography></Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SystemHealth;
