import React, { useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid, MenuItem, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

const CreateFirm: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firmName: '',
        subdomain: '',
        email: '',
        adminUsername: '',
        adminPassword: '',
        plan: 'Trial'
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            return api.post('/super-admin/firms', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firms'] });
            navigate('/super-admin/firms');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to create firm and provision workspace.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.firmName || !formData.subdomain || !formData.email || !formData.adminUsername || !formData.adminPassword) {
            setError('All fields are required.');
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                    Create New Firm Account
                </Typography>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Firm Name" variant="outlined"
                                value={formData.firmName} onChange={e => setFormData({ ...formData, firmName: e.target.value })}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Subdomain" variant="outlined"
                                value={formData.subdomain} onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                helperText={`Portal URL: ${formData.subdomain || '...'}.cacloud.in`} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Firm Email" type="email" variant="outlined"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth select label="Subscription Plan"
                                value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}>
                                {['Trial', 'Basic', 'Professional', 'Enterprise'].map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}><Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>Admin Setup</Typography></Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Admin Username" variant="outlined"
                                value={formData.adminUsername} onChange={e => setFormData({ ...formData, adminUsername: e.target.value })}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Admin Password" type="password" variant="outlined"
                                value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })}
                                required />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending} sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                            {createMutation.isPending ? 'Provisioning Workspace...' : 'Create Firm'}
                        </Button>
                        <Button variant="outlined" onClick={() => navigate('/super-admin/firms')} sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default CreateFirm;
