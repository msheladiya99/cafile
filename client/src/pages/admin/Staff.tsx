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
    MenuItem,
    useTheme,
    useMediaQuery,
    Stack,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    ContentCopy as CopyIcon,
    LockReset as ResetIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CalendarToday as DateIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { staffService } from '../../services/staffService';
import type { User, UserRole } from '../../types';
import { AxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@mui/material';

export const Staff: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const queryClient = useQueryClient();

    const { data: staff = [], isLoading } = useQuery<User[]>({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [openCredentialsDialog, setOpenCredentialsDialog] = useState(false);
    const [credentials, setCredentials] = useState<{ username: string; password?: string } | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'STAFF' as UserRole,
        permissions: [] as string[],
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await staffService.createStaff(formData);
            setCredentials(response.credentials);
            setSuccess('Staff member created successfully!');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: 'STAFF',
                permissions: []
            });
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || 'Failed to create staff member');
        }
    };

    const handleDeleteStaff = async (staffId: string, username: string) => {
        if (!window.confirm(`Are you sure you want to delete staff member "${username}"?`)) {
            return;
        }

        try {
            await staffService.deleteStaff(staffId);
            setSuccess(`Staff member "${username}" deleted successfully`);
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || 'Failed to delete staff member');
        }
    };

    const handleResetPassword = async (staffId: string) => {
        if (!window.confirm('Are you sure you want to reset this staff member\'s password?')) {
            return;
        }

        try {
            const response = await staffService.resetPassword(staffId);
            setCredentials({
                username: response.username,
                password: response.password
            });
            setOpenCredentialsDialog(true);
            setSuccess('Password reset successfully!');
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || 'Failed to reset password');
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

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'error';
            case 'MANAGER': return 'primary';
            case 'STAFF': return 'success';
            case 'INTERN': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ bgcolor: isMobile ? '#f8fafc' : 'transparent', minHeight: '100vh', pb: 8 }}>
            {/* Header Section */}
            {!isMobile ? (
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4" fontWeight="700" gutterBottom>
                            Staff Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage your team members and their roles
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
                        Add Staff Member
                    </Button>
                </Box>
            ) : (
                <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #f1f3f4', mb: 2 }}>
                    <Box sx={{ pt: 3, pb: 1, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="700" sx={{ color: '#1e293b' }}>
                            Staff
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1.5 }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: '1.5px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#f8fafc'
                        }}>
                            <BadgeIcon sx={{ color: '#64748b', fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
                                Staff Directory
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {staff.length} active members
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2,
                                minWidth: 'auto'
                            }}
                        >
                            Add
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Content Section */}
            {!isMobile ? (
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
                                <TableCell sx={{ fontWeight: 700 }}>Name / Username</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}><Skeleton height={40} /></TableCell>
                                    </TableRow>
                                ))
                            ) : staff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No staff members found.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staff.map((member) => (
                                    <TableRow key={member._id} hover>
                                        <TableCell>
                                            <Typography fontWeight="600">{member.name || member.username}</Typography>
                                            {member.name && (
                                                <Typography variant="caption" color="text.secondary">
                                                    @{member.username}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{member.email || '-'}</Typography>
                                            <Typography variant="caption" color="text.secondary">{member.phone || '-'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={member.role}
                                                color={getRoleColor(member.role)}
                                                size="small"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                color="warning"
                                                onClick={() => handleResetPassword(member._id)}
                                                title="Reset Password"
                                            >
                                                <ResetIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteStaff(member._id, member.username)}
                                                title="Delete Staff"
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
            ) : (
                /* Mobile Card View */
                <Stack spacing={2} sx={{ px: 2 }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={160} sx={{ borderRadius: 3 }} />)
                    ) : staff.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <Typography color="text.secondary">No staff members found.</Typography>
                        </Box>
                    ) : (
                        staff.map((member) => (
                            <Paper
                                key={member._id}
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
                                        bgcolor: '#f1f5f9', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        color: '#475569', fontWeight: 700, fontSize: '1.2rem'
                                    }}>
                                        {(member.name || member.username).charAt(0).toUpperCase()}
                                    </Box>
                                    <Box flex={1}>
                                        <Typography variant="h6" fontWeight="700" color="#1e293b" lineHeight={1.2}>
                                            {member.name || member.username}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            @{member.username}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={member.role}
                                        color={getRoleColor(member.role)}
                                        size="small"
                                        sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                </Box>

                                <Stack spacing={1} mb={2.5}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <EmailIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <Typography variant="body2" color="#475569">{member.email}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <PhoneIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <Typography variant="body2" color="#475569">{member.phone}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <DateIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <Typography variant="body2" color="#475569">
                                            Joined {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleResetPassword(member._id)}
                                        startIcon={<ResetIcon />}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderColor: '#e2e8f0',
                                            color: '#f59e0b',
                                            '&:hover': { borderColor: '#fcd34d', bgcolor: '#fffbeb' }
                                        }}
                                    >
                                        Reset Pass
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteStaff(member._id, member.username)}
                                        startIcon={<DeleteIcon />}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderColor: '#fee2e2',
                                            '&:hover': { borderColor: '#fecaca', bgcolor: '#fef2f2' }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </Paper>
                        ))
                    )}
                </Stack>
            )}

            {/* Add Staff Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" fontWeight="700">
                        Add New Staff Member
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && credentials && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2" fontWeight="600" gutterBottom>
                                Staff created successfully! Share these credentials:
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
                                    <IconButton size="small" onClick={() => copyToClipboard(credentials.password!)}>
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Alert>
                    )}
                    {!success && (
                        <Box component="form" sx={{ mt: 1 }}>
                            <Box display="flex" gap={2}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    margin="normal"
                                    required
                                />
                            </Box>
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
                            <TextField
                                fullWidth
                                select
                                label="Role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                margin="normal"
                                required
                            >
                                <MenuItem value="ADMIN">Admin</MenuItem>
                                <MenuItem value="MANAGER">Manager</MenuItem>
                                <MenuItem value="STAFF">Staff</MenuItem>
                                <MenuItem value="INTERN">Intern</MenuItem>
                            </TextField>

                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    {!success && (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                            }}
                        >
                            Create Staff
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* View Credentials Dialog (for Password Reset) */}
            <Dialog
                open={openCredentialsDialog}
                onClose={() => setOpenCredentialsDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Staff Credentials</DialogTitle>
                <DialogContent>
                    {credentials && (
                        <Box sx={{ mt: 2 }}>
                            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        Username
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => copyToClipboard(credentials.username)}
                                        title="Copy Username"
                                    >
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="h6" fontWeight="600">
                                    {credentials.username}
                                </Typography>
                            </Paper>

                            <Paper sx={{ p: 3, bgcolor: 'success.50', mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        New Password
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => copyToClipboard(credentials.password!)}
                                        title="Copy Password"
                                    >
                                        <CopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Typography variant="h6" fontWeight="600">
                                    {credentials.password}
                                </Typography>
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Save this password! It cannot be retrieved later.
                                </Alert>
                            </Paper>
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
