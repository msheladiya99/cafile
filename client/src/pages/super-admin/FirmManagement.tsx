import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, TextField, MenuItem, Grid, InputAdornment, Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as CheckIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface IFirm {
    _id: string;
    firmName: string;
    subdomain: string;
    email: string;
    mobile?: string;
    plan: string;
    status: string;
    usersCount: number;
    clientsCount: number;
    createdAt: string;
}

const FirmManagement: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('All Plans');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const { data: firms, isLoading } = useQuery<IFirm[]>({
        queryKey: ['firms'],
        queryFn: async () => {
            const res = await api.get('/super-admin/firms');
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return api.patch(`/super-admin/firms/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firms'] });
        }
    });

    const deleteFirmMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/super-admin/firms/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firms'] });
        }
    });

    const handleToggleStatus = (firm: IFirm) => {
        const newStatus = firm.status === 'active' ? 'suspended' : 'active';
        updateStatusMutation.mutate({ id: firm._id, status: newStatus });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to completely delete this firm and all its data? This cannot be undone.')) {
            deleteFirmMutation.mutate(id);
        }
    };

    const filteredFirms = firms?.filter(firm => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
            firm.firmName?.toLowerCase().includes(query) ||
            firm.subdomain?.toLowerCase().includes(query) ||
            firm.email?.toLowerCase().includes(query) ||
            firm.mobile?.includes(searchTerm);

        const matchesPlan = planFilter === 'All Plans' || firm.plan?.toLowerCase() === planFilter.toLowerCase();
        const matchesStatus = statusFilter === 'All Status' || firm.status === statusFilter;
        return matchesSearch && matchesPlan && matchesStatus;
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Firm Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/super-admin/create-firm')} sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 700 }}>
                    Create Firm
                </Button>
            </Box>

            <Paper sx={{ mb: 4, p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth placeholder="Search by Firm or Subdomain..." size="small"
                            variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                        <TextField select fullWidth size="small" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                            {['All Plans', 'Trial', 'Basic', 'Professional', 'Enterprise'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, md: 4 }}>
                        <TextField select fullWidth size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            {['All Status', 'active', 'suspended'].map(opt => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Firm Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Subdomain</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Users</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Clients</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
                            ) : filteredFirms?.length === 0 ? (
                                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>No firms found</TableCell></TableRow>
                            ) : (
                                filteredFirms?.map((firm) => (
                                    <TableRow key={firm._id} hover>
                                        <TableCell sx={{ fontWeight: 700 }}>{firm.firmName}</TableCell>
                                        <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#666' }}>{firm.subdomain}.mycafile.in</Typography></TableCell>
                                        <TableCell>{firm.mobile || '-'}</TableCell>
                                        <TableCell>
                                            <Chip label={firm.plan.charAt(0).toUpperCase() + firm.plan.slice(1)} size="small" sx={{
                                                bgcolor: firm.plan?.toLowerCase() === 'enterprise' ? '#6200ea15' : '#e3f2fd',
                                                color: firm.plan?.toLowerCase() === 'enterprise' ? '#6200ea' : '#1976d2',
                                                fontWeight: 800
                                            }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={firm.status}
                                                size="small"
                                                color={firm.status === 'active' ? 'success' : 'error'}
                                                sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}
                                            />
                                        </TableCell>
                                        <TableCell>{firm.usersCount || 0}</TableCell>
                                        <TableCell>{firm.clientsCount || 0}</TableCell>
                                        <TableCell>{new Date(firm.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Details">
                                                <IconButton color="primary" onClick={() => navigate(`/super-admin/firms/${firm._id}`)}>
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit firm (Mocked for Details Page)">
                                                <IconButton sx={{ color: '#ff9800' }} onClick={() => navigate(`/super-admin/firms/${firm._id}`)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={firm.status === 'active' ? 'Suspend Firm' : 'Activate Firm'}>
                                                <IconButton
                                                    color={firm.status === 'active' ? 'error' : 'success'}
                                                    onClick={() => handleToggleStatus(firm)}
                                                >
                                                    {firm.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Firm">
                                                <IconButton color="error" onClick={() => handleDelete(firm._id)}>
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
            </Paper>
        </Box>
    );
};

export default FirmManagement;
