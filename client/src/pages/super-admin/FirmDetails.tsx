import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Chip, TextField, MenuItem, Divider } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const FirmDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ plan: '', status: '' });

    const { data, isLoading } = useQuery({
        queryKey: ['firm', id],
        queryFn: async () => {
            const res = await api.get(`/super-admin/firms/${id}`);
            return res.data;
        }
    });

    const updateFirmMutation = useMutation({
        mutationFn: async (updatedData: { plan: string; status: string }) => {
            return api.patch(`/super-admin/firms/${id}`, updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firm', id] });
            setEditMode(false);
        }
    });

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (!data) return <Box sx={{ p: 5 }}><Typography color="error">Firm not found.</Typography></Box>;

    const { firm, users, stats } = data;

    const handleEditToggle = () => {
        if (!editMode) {
            setFormData({ plan: firm.plan.toLowerCase(), status: firm.status.toLowerCase() });
            setEditMode(true);
        } else {
            setEditMode(false);
        }
    };

    const handleSave = () => {
        updateFirmMutation.mutate(formData);
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Firm Details</Typography>
                <Button variant="outlined" onClick={() => navigate('/super-admin/firms')}>Back to List</Button>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Profile Settings</Typography>
                            <Button variant="contained" color={editMode ? "success" : "primary"} onClick={editMode ? handleSave : handleEditToggle}>
                                {editMode ? 'Save Changes' : 'Edit Settings'}
                            </Button>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography color="text.secondary" variant="body2">Firm Name</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{firm.firmName}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography color="text.secondary" variant="body2">Subdomain URL</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontFamily: 'monospace' }}>
                                    {firm.subdomain}.cacloud.in
                                </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography color="text.secondary" variant="body2">Registered Email</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{firm.email}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography color="text.secondary" variant="body2">Created At</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{new Date(firm.createdAt).toLocaleDateString()}</Typography>
                            </Grid>

                            <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }} /></Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {editMode ? (
                                    <TextField fullWidth select label="Subscription Plan" value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}>
                                        {['Trial', 'Basic', 'Professional', 'Enterprise'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                                    </TextField>
                                ) : (
                                    <Box>
                                        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Plan</Typography>
                                        <Chip
                                            label={firm.plan.charAt(0).toUpperCase() + firm.plan.slice(1)}
                                            sx={{
                                                bgcolor: firm.plan?.toLowerCase() === 'enterprise' ? '#6200ea20' : '#e3f2fd',
                                                color: firm.plan?.toLowerCase() === 'enterprise' ? '#6200ea' : '#1976d2',
                                                fontWeight: 800
                                            }}
                                        />
                                    </Box>
                                )}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {editMode ? (
                                    <TextField fullWidth select label="Firm Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        {['active', 'suspended'].map(opt => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
                                    </TextField>
                                ) : (
                                    <Box>
                                        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Status</Typography>
                                        <Chip label={firm.status} color={firm.status === 'active' ? 'success' : 'error'} sx={{ fontWeight: 800, textTransform: 'uppercase' }} />
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Usage Statistics</Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography color="text.secondary" variant="body2">Admin Users</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>{users?.length || 0}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography color="text.secondary" variant="body2">Total Clients</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.clientsCount || 0}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography color="text.secondary" variant="body2">Total Tasks</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats?.tasksCount || 0}</Typography>
                        </Box>
                        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #efefef' }}>
                            <Button variant="outlined" color="warning" fullWidth sx={{ mb: 2, fontWeight: 700 }}>
                                Reset Admin Password
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FirmDetails;
