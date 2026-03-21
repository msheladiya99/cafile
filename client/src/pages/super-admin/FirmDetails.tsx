import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Chip, TextField, MenuItem, Divider, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../../services/api';

const FirmDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ 
        plan: '', 
        status: '', 
        maxAdmins: 5,
        googleDriveType: 'app' as 'app' | 'personal',
        googleDriveRootFolderId: ''
    });
    const [resetPassword, setResetPassword] = useState('');
    const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['firm', id],
        queryFn: async () => {
            const res = await api.get(`/super-admin/firms/${id}`);
            return res.data;
        }
    });

    const updateFirmMutation = useMutation({
        mutationFn: async (updatedData: { plan: string; status: string; maxAdmins: number; googleDriveType: string; googleDriveRootFolderId: string }) => {
            return api.patch(`/super-admin/firms/${id}`, updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firm', id] });
            setEditMode(false);
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            return api.post(`/super-admin/firms/${id}/reset-password`, { newPassword: password });
        },
        onSuccess: () => {
            setResetStatus({ type: 'success', msg: 'Password reset successfully!' });
            setResetPassword('');
            setTimeout(() => setResetStatus(null), 3000);
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setResetStatus({ type: 'error', msg: err.response?.data?.message || 'Reset failed' });
        }
    });

    const handleResetPassword = () => {
        if (!resetPassword) return alert('Enter a new password');
        if (window.confirm(`Are you sure you want to reset the admin password for ${data?.firm?.firmName}?`)) {
            resetPasswordMutation.mutate(resetPassword);
        }
    };

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (!data) return <Box sx={{ p: 5 }}><Typography color="error">Firm not found.</Typography></Box>;

    const { firm, users, stats } = data;

    const handleEditToggle = () => {
        if (!editMode) {
            setFormData({
                plan: firm.plan.toLowerCase(),
                status: firm.status.toLowerCase(),
                maxAdmins: firm.maxAdmins || 5,
                googleDriveType: firm.googleDriveType || 'app',
                googleDriveRootFolderId: firm.googleDriveRootFolderId || ''
            });
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
                                <Typography color="text.secondary" variant="body2">Portal URL</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontFamily: 'monospace' }}>
                                    {firm.subdomain}.mycafile.in
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
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {editMode ? (
                                    <TextField fullWidth select label="Max Admin Capacity" value={formData.maxAdmins} onChange={e => setFormData({ ...formData, maxAdmins: Number(e.target.value) })}>
                                        {[1, 2, 3, 4, 5].map(num => <MenuItem key={num} value={num}>{num} Admin{num > 1 ? 's' : ''}</MenuItem>)}
                                    </TextField>
                                ) : (
                                    <Box>
                                        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Max Admin Capacity</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>{firm.maxAdmins || 5} Admins</Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                {editMode ? (
                                    <TextField fullWidth select label="Data Storage Type" value={formData.googleDriveType} onChange={e => setFormData({ ...formData, googleDriveType: e.target.value as 'app' | 'personal' })}>
                                        <MenuItem value="app">Application Drive</MenuItem>
                                        <MenuItem value="personal">Personal Drive</MenuItem>
                                    </TextField>
                                ) : (
                                    <Box>
                                        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Storage Type</Typography>
                                        <Chip label={firm.googleDriveType === 'personal' ? 'Personal Drive' : 'App Drive'} color="info" variant="outlined" sx={{ fontWeight: 700 }} />
                                    </Box>
                                )}
                            </Grid>

                            {formData.googleDriveType === 'personal' && (
                                <Grid size={{ xs: 12 }}>
                                    {editMode ? (
                                        <>
                                            <Alert severity="info" sx={{ mb: 2 }}>
                                                Share folder with: <code>drive-bot@ca-office-portal-486705.iam.gserviceaccount.com</code>
                                            </Alert>
                                            <TextField 
                                                fullWidth 
                                                label="Google Drive Folder ID" 
                                                value={formData.googleDriveRootFolderId} 
                                                onChange={e => setFormData({ ...formData, googleDriveRootFolderId: e.target.value })}
                                                helperText="The ID from the URL of your personal Google Drive folder"
                                            />
                                        </>
                                    ) : (
                                        <Box>
                                            <Typography color="text.secondary" variant="body2">Drive Folder ID</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{firm.googleDriveRootFolderId || 'Not Configured'}</Typography>
                                        </Box>
                                    )}
                                </Grid>
                            )}
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
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Security Control</Typography>
                            <TextField
                                fullWidth
                                label="New Admin Password"
                                type="password"
                                size="small"
                                value={resetPassword}
                                onChange={e => setResetPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={handleResetPassword}
                                disabled={resetPasswordMutation.isPending}
                                sx={{ fontWeight: 700 }}
                            >
                                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                            </Button>
                            {resetStatus && (
                                <Alert severity={resetStatus.type} sx={{ mt: 2, py: 0 }}>
                                    {resetStatus.msg}
                                </Alert>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FirmDetails;
