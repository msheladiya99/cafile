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
    Skeleton,
    useMediaQuery,
    useTheme,
    Stack,
    Tooltip
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
    ContactPage as AadharIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CalendarToday as DateIcon,
    Group as ClientsIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { Client, CreateClientResponse } from '../../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

export const Clients: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);

    const filteredClients = clients.filter((client: Client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery))
    );
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
        if (!window.confirm(`Are you sure you want to delete client "${clientName}"?\n\nThis will PERMANENTLY DELETE account, files, and all data.`)) {
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
        if (!window.confirm('Reset this client\'s password? Old password will no longer work.')) {
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
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 8 }}>
            {/* Header Section */}
            {!isMobile ? (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ pt: 2 }}>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight="800"
                            sx={{
                                background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1,
                                letterSpacing: '-1px'
                            }}
                        >
                            Clients
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight="500">
                            Manage your client accounts and access permissions
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 8px 16px -4px #534bae60',
                            '&:hover': {
                                boxShadow: '0 12px 20px -4px #534bae80',
                                transform: 'translateY(-1px)'
                            },
                        }}
                    >
                        Add New Client
                    </Button>
                </Box>
            ) : (
                <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #f1f3f4', mb: 2 }}>
                    <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="500" sx={{ color: '#202124', letterSpacing: '-0.5px' }}>
                            Clients
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1.5 }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: '1.5px solid #dadce0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f8fafc'
                        }}>
                            <ClientsIcon sx={{ color: '#5f6368', fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" sx={{ color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>
                                Client Directory
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                                {clients.length} active clients
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2
                            }}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Search Bar */}
            <Box sx={{ px: isMobile ? 2 : 0, mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Search by name, email or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <SearchIcon sx={{ color: 'text.secondary', mr: 1.5 }} />
                        ),
                        sx: {
                            borderRadius: 3,
                            bgcolor: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#e2e8f0',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#cbd5e1',
                            },
                        }
                    }}
                />
            </Box>

            {/* Content Section */}
            {!isMobile ? (
                <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2.5 }}>NAME</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CONTACT</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>IDENTITY / GST</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>REGISTERED</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton height={60} /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <ClientsIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                                        <Typography color="text.secondary" fontWeight="500">
                                            {searchQuery ? `No clients matching "${searchQuery}"` : 'No clients found. Add your first client!'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client: Client) => (
                                    <TableRow key={client._id} hover sx={{ transition: 'background-color 0.2s' }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Box sx={{
                                                    width: 40, height: 40, borderRadius: '50%',
                                                    bgcolor: '#e8eaf6', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    color: '#1a237e', fontWeight: 700
                                                }}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </Box>
                                                <Typography fontWeight="700" color="#1e293b">{client.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack spacing={0.2}>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                                                    <EmailIcon sx={{ fontSize: 16 }} /> {client.email}
                                                </Typography>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569' }}>
                                                    <PhoneIcon sx={{ fontSize: 16 }} /> {client.phone}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" flexDirection="column" gap={0.5}>
                                                {client.panNumber && (
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                                        <IdentityIcon sx={{ fontSize: 14, color: '#3f51b5' }} /> <strong>PAN:</strong> {client.panNumber}
                                                    </Typography>
                                                )}
                                                {client.aadharNumber && (
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                                        <AadharIcon sx={{ fontSize: 14, color: '#9c27b0' }} /> <strong>AADHAR:</strong> {client.aadharNumber}
                                                    </Typography>
                                                )}
                                                {client.gstNumber && (
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                                        <GstIcon sx={{ fontSize: 14, color: '#2e7d32' }} /> <strong>GST:</strong> {client.gstNumber}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="#64748b">
                                                {format(parseISO(client.createdAt), 'dd MMM yyyy')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Credentials">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewCredentials(client._id)}
                                                    sx={{ color: '#1a73e8', bgcolor: '#e8f0fe', mr: 1 }}
                                                >
                                                    <KeyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reset Password">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleResetPassword(client._id)}
                                                    sx={{ color: '#f57c00', bgcolor: '#fff3e0', mr: 1 }}
                                                >
                                                    <ResetIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Client">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteClient(client._id, client.name)}
                                                    sx={{ color: '#d32f2f', bgcolor: '#ffebee' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                /* Mobile Card View */
                <Stack spacing={2} sx={{ px: 2 }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: 3 }} />)
                    ) : (
                        filteredClients.map((client: Client) => (
                            <Paper
                                key={client._id}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'none',
                                    '&:active': { bgcolor: '#f8fafc' }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        bgcolor: '#e8eaf6', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: '#1a237e', fontWeight: 800, fontSize: '1.2rem'
                                    }}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="700" color="#1e293b" lineHeight={1.2}>
                                            {client.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <DateIcon sx={{ fontSize: 12 }} /> Reg: {format(parseISO(client.createdAt), 'dd MMM yyyy')}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Stack spacing={1} mb={2.5}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" color="#475569">{client.email}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                        <Typography variant="body2" color="#475569">{client.phone}</Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                <Box display="flex" gap={1} mb={2.5} flexWrap="wrap">
                                    {client.panNumber && (
                                        <Chip
                                            icon={<IdentityIcon fontSize="small" />}
                                            label={`PAN: ${client.panNumber}`}
                                            size="small"
                                            sx={{ borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700 }}
                                        />
                                    )}
                                    {client.gstNumber && (
                                        <Chip
                                            icon={<GstIcon fontSize="small" />}
                                            label={`GST: ${client.gstNumber}`}
                                            size="small"
                                            sx={{ borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }}
                                        />
                                    )}
                                </Box>

                                <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleViewCredentials(client._id)}
                                        sx={{ borderRadius: 1.5, py: 1, textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#1a73e8' }}
                                    >
                                        Details
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleResetPassword(client._id)}
                                        sx={{ borderRadius: 1.5, py: 1, textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#f57c00' }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClient(client._id, client.name)}
                                        sx={{ borderRadius: 1.5, py: 1, textTransform: 'none', fontWeight: 700, borderColor: '#fee2e2' }}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Stack>
            )}

            {/* Add Client Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
            >
                <DialogTitle>
                    <Typography variant="h5" fontWeight="800" sx={{ color: '#1a237e' }}>
                        Add New Client
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Enter primary contact and tax details
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                    {success && credentials && (
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            <Typography variant="body2" fontWeight="700" gutterBottom>
                                Client Created Successfully!
                            </Typography>
                            <Box sx={{ mt: 2, p: 2, background: 'rgba(0,0,0,0.04)', borderRadius: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2"><strong>Username:</strong> {credentials.username}</Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(credentials.username)}><CopyIcon fontSize="small" /></IconButton>
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2"><strong>Password:</strong> {credentials.password}</Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(credentials.password)}><CopyIcon fontSize="small" /></IconButton>
                                </Box>
                            </Box>
                        </Alert>
                    )}
                    <Box component="form" sx={{ mt: 1 }}>
                        <TextField
                            fullWidth label="Client Name" margin="dense"
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            fullWidth label="Email" type="email" margin="dense"
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                            fullWidth label="Phone" margin="dense"
                            value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="800" mb={1}>
                            Tax & Compliance
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="PAN" fullWidth
                                value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                inputProps={{ maxLength: 10 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                            <TextField
                                label="Aadhar" fullWidth
                                value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                inputProps={{ maxLength: 12 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Stack>
                        <TextField
                            fullWidth label="GSTIN" margin="normal"
                            value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                            inputProps={{ maxLength: 15 }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog} sx={{ fontWeight: 600, color: 'text.secondary' }}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                            borderRadius: 2, px: 4, textTransform: 'none', fontWeight: 700
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
                PaperProps={{ sx: { borderRadius: 4 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#1a237e' }}>Access Credentials</DialogTitle>
                <DialogContent>
                    {viewingCredentials && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="700">USERNAME</Typography>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight="700">{viewingCredentials.username}</Typography>
                                    <IconButton size="small" onClick={() => copyToClipboard(viewingCredentials.username)}><CopyIcon fontSize="small" /></IconButton>
                                </Box>
                            </Paper>

                            {viewingCredentials.password ? (
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', borderColor: '#bcf0da' }}>
                                    <Typography variant="caption" color="#15803d" fontWeight="700">NEW PASSWORD</Typography>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight="700" color="#166534">{viewingCredentials.password}</Typography>
                                        <IconButton size="small" onClick={() => copyToClipboard(viewingCredentials.password!)}><CopyIcon fontSize="small" /></IconButton>
                                    </Box>
                                    <Alert severity="info" color="success" sx={{ mt: 1, borderRadius: 1.5, py: 0 }}>
                                        Provide this to the client immediately.
                                    </Alert>
                                </Paper>
                            ) : (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                    {viewingCredentials.note}
                                </Alert>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenCredentialsDialog(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
