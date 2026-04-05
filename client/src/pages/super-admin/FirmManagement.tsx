import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, TextField, MenuItem, InputAdornment, Tooltip,
    Avatar,
    Stack,
    CircularProgress
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as CheckIcon,
    Search as SearchIcon,
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
    maxAdmins: number;
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 1000, color: '#111', letterSpacing: -1.5, mb: 1 }}>
                        Firm Management
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        Oversee all accounting firms registered on the platform.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/super-admin/create-firm')} 
                    sx={{ 
                        px: 4, 
                        py: 1.8, 
                        borderRadius: '20px', 
                        fontWeight: 900, 
                        bgcolor: '#6366f1', 
                        textTransform: 'none',
                        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
                        '&:hover': { bgcolor: '#4f46e5', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.3)' }
                    }}
                >
                    + Add new firm
                </Button>
            </Box>

            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField 
                    placeholder="Search by Firm or Subdomain..." 
                    size="small"
                    variant="outlined" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ 
                        flexGrow: 1,
                        bgcolor: '#f8fafc',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            fontWeight: 600,
                            '& fieldset': { border: 'none' },
                            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                        }
                    }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
                />
                <TextField 
                    select 
                    size="small" 
                    value={planFilter} 
                    onChange={(e) => setPlanFilter(e.target.value)}
                    sx={{ 
                        minWidth: 150,
                        bgcolor: '#f8fafc',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            fontWeight: 600,
                            '& fieldset': { border: 'none' }
                        }
                    }}
                >
                    {['All Plans', 'Trial', 'Basic', 'Professional', 'Enterprise'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                </TextField>
                <TextField 
                    select 
                    size="small" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ 
                        minWidth: 150,
                        bgcolor: '#f8fafc',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '16px',
                            fontWeight: 600,
                            '& fieldset': { border: 'none' }
                        }
                    }}
                >
                    {['All Status', 'active', 'suspended'].map(opt => <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>)}
                </TextField>
            </Box>

            <Paper sx={{ borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.02)', overflow: 'hidden', border: '1px solid #f8fafc' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ textAlign: 'left', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Account / Firm</th>
                                <th style={{ textAlign: 'left', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Subdomain</th>
                                <th style={{ textAlign: 'left', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Service Package</th>
                                <th style={{ textAlign: 'left', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Metrics</th>
                                <th style={{ textAlign: 'right', padding: '24px', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Actions</th>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
                            ) : filteredFirms?.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary', fontWeight: 700 }}>No registrations found</TableCell></TableRow>
                            ) : (
                                filteredFirms?.map((firm) => (
                                    <TableRow key={firm._id} sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'all 0.2s ease', borderBottom: '1px solid #f8fafc' }}>
                                        <TableCell sx={{ py: 3, px: 3 }}>
                                            <Stack direction="row" spacing={2} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
                                                <Avatar sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 900, borderRadius: '12px', width: 32, height: 32, fontSize: '0.875rem' }}>{firm.firmName ? firm.firmName.charAt(0) : 'F'}</Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>{firm.firmName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>• {firm.email}</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, px: 1.5, py: 0.5, bgcolor: '#f1f5f9', borderRadius: '8px', display: 'inline-block' }}>
                                                {firm.subdomain}.mycafile.in
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" sx={{ 
                                                fontWeight: 900, 
                                                px: 1.5, 
                                                py: 0.5, 
                                                borderRadius: '8px', 
                                                bgcolor: firm.plan?.toLowerCase() === 'enterprise' ? '#f5f3ff' : '#eff6ff', 
                                                color: firm.plan?.toLowerCase() === 'enterprise' ? '#7c3aed' : '#2563eb',
                                                letterSpacing: 0.5
                                            }}>
                                                {firm.plan?.toUpperCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                             <Box sx={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: '8px',
                                                bgcolor: firm.status === 'active' ? '#ecfdf5' : '#fff1f2',
                                                color: firm.status === 'active' ? '#10b981' : '#f43f5e'
                                            }}>
                                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase' }}>
                                                    {firm.status === 'active' ? 'LIVE' : 'SUSPENDED'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Clients">
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>C:{firm.clientsCount || 0}</Typography>
                                                </Tooltip>
                                                <Tooltip title="Users">
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>U:{firm.usersCount || 0}</Typography>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => navigate(`/super-admin/firms/${firm._id}`)}
                                                    sx={{ bgcolor: '#f1f5f9', color: '#1e293b', '&:hover': { bgcolor: '#e2e8f0' } }}
                                                    aria-label="View firm details"
                                                    title="View firm details"
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleToggleStatus(firm)}
                                                    sx={{ 
                                                        bgcolor: firm.status === 'active' ? '#fff1f2' : '#ecfdf5', 
                                                        color: firm.status === 'active' ? '#f43f5e' : '#10b981',
                                                        '&:hover': { opacity: 0.8 }
                                                    }}
                                                    aria-label={firm.status === 'active' ? 'Suspend firm' : 'Activate firm'}
                                                    title={firm.status === 'active' ? 'Suspend firm' : 'Activate firm'}
                                                >
                                                    {firm.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDelete(firm._id)}
                                                    sx={{ bgcolor: '#fdf2f2', color: '#e11d48', '&:hover': { bgcolor: '#fee2e2' } }}
                                                    aria-label="Delete firm"
                                                    title="Delete firm"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
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
