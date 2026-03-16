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
        adminEmail: '',
        adminName: '',
        adminPassword: '',
        mobileNumber: '',
        planType: 'Trial',
        maxAdmins: 5
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
            setError(err.response?.data?.message || 'Failed to create firm.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.firmName || !formData.subdomain || !formData.adminEmail || !formData.adminPassword || !formData.mobileNumber) {
            setError('Please fill in all required fields.');
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
                                value={formData.firmName}
                                onChange={e => {
                                    const name = e.target.value;
                                    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                                    setFormData({ ...formData, firmName: name, subdomain: slug });
                                }}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Subdomain" variant="outlined"
                                value={formData.subdomain} onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                helperText={`Portal URL: ${formData.subdomain || '...'}.mycafile.in`} required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Admin Name" variant="outlined"
                                value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })}
                                placeholder="e.g. John Doe" required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Admin Email" type="email" variant="outlined"
                                value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth label="Mobile Number" variant="outlined"
                                value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                                required />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth select label="Subscription Plan"
                                value={formData.planType} onChange={e => setFormData({ ...formData, planType: e.target.value })}>
                                {['Trial', 'Basic', 'Professional', 'Enterprise'].map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField fullWidth select label="Max Admin Capacity"
                                value={formData.maxAdmins} onChange={e => setFormData({ ...formData, maxAdmins: Number(e.target.value) })}>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <MenuItem key={num} value={num}>{num} Admin{num > 1 ? 's' : ''}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}><Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>Security</Typography></Grid>

                        <Grid size={{ xs: 12, md: 12 }}>
                            <TextField fullWidth label="Set Admin Password" type="password" variant="outlined"
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
