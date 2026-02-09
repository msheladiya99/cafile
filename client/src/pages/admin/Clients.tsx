import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert,
    Divider,
    Grid,
    Skeleton,
    Fade
} from '@mui/material';
import { AxiosError } from 'axios';
import {
    Add as AddIcon,
    ContentCopy as CopyIcon,
    Key as KeyIcon,
    LockReset as ResetIcon,
    Delete as DeleteIcon,
    Badge as IdentityIcon,
    HistoryEdu as GstIcon,
    ContactPage as AadharIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { Client, CreateClientResponse } from '../../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const Clients: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);
    const [credentials, setCredentials] = useState<CreateClientResponse['credentials'] | null>(null);
    const [viewingCredentials, setViewingCredentials] = useState<{ username: string; password?: string; note?: string } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        panNumber: '',
        aadharNumber: '',
        gstNumber: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await adminService.createClient(formData);
            setCredentials(response.credentials);
            setSuccess('Client created successfully!');
            setFormData({ name: '', email: '', phone: '', panNumber: '', aadharNumber: '', gstNumber: '' });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to create client');
        }
    };

    const handleDeleteClient = async (clientId: string, clientName: string) => {
        if (!window.confirm(`Are you sure you want to delete client "${clientName}"?\n\nThis will PERMANENTLY DELETE:\n- The client account\n- All uploaded files\n- All associated data\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            await adminService.deleteClient(clientId);
            setSuccess(`Client "${clientName}" deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to delete client');
        }
    };

    const handleViewCredentials = async (clientId: string) => {
        try {
            const creds = await adminService.getClientCredentials(clientId);
            setViewingCredentials(creds);
            setOpenCredentialsDialog(true);
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to get credentials');
        }
    };

    const handleResetPassword = async (clientId: string) => {
        if (!window.confirm('Are you sure you want to reset this client\'s password? The old password will no longer work.')) {
            return;
        }

        try {
            const response = await adminService.resetClientPassword(clientId);
            setViewingCredentials({
                username: response.username,
                password: response.password
            });
            setOpenCredentialsDialog(true);
            setSuccess('Password reset successfully!');
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string }>;
            setError(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCredentials(null);
        setError('');
        setSuccess('');
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                        Clients
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your client accounts
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                        },
                    }}
                >
                    Add New Client
                </Button>
            </Box>

            <TableContainer
                component={Paper}
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Identity/GST</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton width="60%" /></TableCell>
                                    <TableCell><Skeleton width="80%" /></TableCell>
                                    <TableCell><Skeleton width="70%" /></TableCell>
                                    <TableCell><Skeleton width="50%" /></TableCell>
                                    <TableCell><Skeleton width="40%" /></TableCell>
                                    <TableCell><Skeleton width="30%" /></TableCell>
                                </TableRow>
                            ))
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No clients found. Add your first client!</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client: Client) => (
                                <TableRow key={client._id} hover>
                                    <TableCell>
                                        <Typography fontWeight="600">{client.name}</Typography>
                                    </TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                            {client.panNumber && (
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <IdentityIcon fontSize="inherit" color="primary" /> <strong>PAN:</strong> {client.panNumber}
                                                </Typography>
                                            )}
                                            {client.aadharNumber && (
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AadharIcon fontSize="inherit" color="secondary" /> <strong>Aadhar:</strong> {client.aadharNumber}
                                                </Typography>
                                            )}
                                            {client.gstNumber && (
                                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <GstIcon fontSize="inherit" color="success" /> <strong>GST:</strong> {client.gstNumber}
                                                </Typography>
                                            )}
                                            {!client.panNumber && !client.aadharNumber && !client.gstNumber && (
                                                <Typography variant="caption" color="text.disabled">Not provided</Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={new Date(client.createdAt).toLocaleDateString()}
                                            size="small"
                                            sx={{ borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleViewCredentials(client._id)}
                                            title="View Credentials"
                                        >
                                            <KeyIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="warning"
                                            onClick={() => handleResetPassword(client._id)}
                                            title="Reset Password"
                                        >
                                            <ResetIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDeleteClient(client._id, client.name)}
                                            title="Delete Client"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Client Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" fontWeight="700">
                        Add New Client
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && credentials && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="600" gutterBottom>
                                Client created successfully! Share these credentials:
                            </Typography>
                            <Box sx={{ mt: 2, p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2">
                                        <strong>Username:</strong> {credentials.username}
                                    </Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(credentials.username)}>
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2">
                                        <strong>Password:</strong> {credentials.password}
                                    </Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(credentials.password)}>
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Client Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            margin="normal"
                            required
                        />
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="700" mb={1}>
                            Identity & Compliance (Optional)
                        </Typography>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <TextField
                                label="PAN Number"
                                value={formData.panNumber}
                                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                placeholder="ABCDE1234F"
                                inputProps={{ maxLength: 10 }}
                                margin="normal"
                            />
                            <TextField
                                label="Aadhar Number"
                                value={formData.aadharNumber}
                                onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                placeholder="XXXX XXXX XXXX"
                                inputProps={{ maxLength: 12 }}
                                margin="normal"
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="GST Number"
                            value={formData.gstNumber}
                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                            placeholder="27ABCDE1234F1Z5"
                            inputProps={{ maxLength: 15 }}
                            margin="normal"
                        />
                    </form>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                        }}
                    >
                        Create Client
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Credentials Dialog */}
            <Dialog
                open={openCredentialsDialog}
                onClose={() => setOpenCredentialsDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Client Credentials</DialogTitle>
                <DialogContent>
                    {viewingCredentials && (
                        <Box sx={{ mt: 2 }}>
                            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        Username
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => copyToClipboard(viewingCredentials.username)}
                                        title="Copy Username"
                                    >
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="h6" fontWeight="600">
                                    {viewingCredentials.username}
                                </Typography>
                            </Paper>

                            {viewingCredentials.password ? (
                                <Paper sx={{ p: 3, bgcolor: 'success.50', mb: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            New Password
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => copyToClipboard(viewingCredentials.password!)}
                                            title="Copy Password"
                                        >
                                            <CopyIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="h6" fontWeight="600">
                                        {viewingCredentials.password}
                                    </Typography>
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Save this password! It cannot be retrieved later.
                                    </Alert>
                                </Paper>
                            ) : (
                                <Alert severity="info">
                                    {viewingCredentials.note}
                                </Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCredentialsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
