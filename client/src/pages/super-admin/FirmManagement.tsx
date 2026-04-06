import React, { useState } from 'react';
import {
    Box, Typography, Avatar, Chip, CircularProgress,
    IconButton, TextField, MenuItem, InputAdornment, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Block as BlockIcon,
    CheckCircle as CheckIcon,
    Search as SearchIcon,
    Delete as DeleteIcon,
    Business as BusinessIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
    trial:        { bg: '#f1f5f9', text: '#64748b' },
    basic:        { bg: '#eff6ff', text: '#2563eb' },
    professional: { bg: '#f5f3ff', text: '#7c3aed' },
    enterprise:   { bg: '#fef3c7', text: '#d97706' },
};

const FirmManagement: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState<IFirm | null>(null);

    const { data: firms, isLoading } = useQuery<IFirm[]>({
        queryKey: ['sa-firms'],
        queryFn: async () => {
            const res = await api.get('/super-admin/firms');
            return res.data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.patch(`/super-admin/firms/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-firms'] });
            toast.success('Firm status updated');
        },
        onError: () => toast.error('Failed to update status'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/super-admin/firms/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-firms'] });
            queryClient.invalidateQueries({ queryKey: ['super-admin-dashboard'] });
            setDeleteTarget(null);
            toast.success('Firm deleted successfully');
        },
        onError: () => toast.error('Failed to delete firm'),
    });

    const filtered = firms?.filter(f => {
        const q = search.toLowerCase();
        const matchSearch = !q || f.firmName?.toLowerCase().includes(q) || f.subdomain?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q);
        const matchPlan = planFilter === 'all' || f.plan?.toLowerCase() === planFilter;
        const matchStatus = statusFilter === 'all' || f.status === statusFilter;
        return matchSearch && matchPlan && matchStatus;
    });

    return (
        <Box className="sa-page">
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                        Firm Management
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.875rem', mt: 0.25 }}>
                        {isLoading ? '—' : `${firms?.length || 0} firms registered`} on the platform
                    </Typography>
                </Box>
                <Box
                    onClick={() => navigate('/super-admin/create-firm')}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: '#6366f1', color: '#fff', px: 2.5, py: 1.25,
                        borderRadius: '14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                        transition: 'all 0.18s ease',
                        '&:hover': { bgcolor: '#4f46e5', transform: 'translateY(-1px)', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' },
                    }}
                >
                    <AddIcon sx={{ fontSize: 18 }} />
                    Add New Firm
                </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search firms, subdomains, emails..."
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                        sx: { borderRadius: '12px', bgcolor: '#fff', border: '1px solid #f1f5f9', '& fieldset': { border: 'none' }, fontSize: '0.875rem' }
                    }}
                    sx={{ flex: 1, minWidth: 220 }}
                />
                <TextField
                    select size="small" value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                    sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff', border: '1px solid #f1f5f9', '& fieldset': { border: 'none' }, fontSize: '0.875rem' } }}
                >
                    <MenuItem value="all">All Plans</MenuItem>
                    {['trial', 'basic', 'professional', 'enterprise'].map(p => (
                        <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select size="small" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff', border: '1px solid #f1f5f9', '& fieldset': { border: 'none' }, fontSize: '0.875rem' } }}
                >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
            </Box>

            {/* Table */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                    </Box>
                ) : filtered?.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <BusinessIcon sx={{ fontSize: 44, color: '#e2e8f0', mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 700, color: '#64748b' }}>No firms found</Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mt: 0.5 }}>Try adjusting your search filters</Typography>
                    </Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                                    {['Firm', 'Subdomain', 'Plan', 'Status', 'Clients / Users', 'Joined', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            textAlign: h === 'Actions' ? 'right' : 'left',
                                            padding: '12px 20px',
                                            color: '#94a3b8', fontSize: '0.7rem',
                                            fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered?.map((firm, i) => {
                                    const planStyle = PLAN_COLORS[firm.plan?.toLowerCase()] || PLAN_COLORS.trial;
                                    const isLast = i === (filtered?.length ?? 0) - 1;
                                    return (
                                        <tr key={firm._id} style={{ borderBottom: isLast ? 'none' : '1px solid #f8fafc', transition: 'background 0.12s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                                            {/* Firm */}
                                            <td style={{ padding: '14px 20px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 800, fontSize: '0.875rem' }}>
                                                        {firm.firmName?.charAt(0) || 'F'}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{firm.firmName}</Typography>
                                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>{firm.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </td>
                                            {/* Subdomain */}
                                            <td style={{ padding: '14px 20px' }}>
                                                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', px: 1, py: 0.3, borderRadius: '6px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                                    {firm.subdomain}.mycafile.in
                                                </Typography>
                                            </td>
                                            {/* Plan */}
                                            <td style={{ padding: '14px 20px' }}>
                                                <Chip label={firm.plan?.toUpperCase()} size="small"
                                                    sx={{ bgcolor: planStyle.bg, color: planStyle.text, fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                                            </td>
                                            {/* Status */}
                                            <td style={{ padding: '14px 20px' }}>
                                                <Box sx={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                                    bgcolor: firm.status === 'active' ? '#ecfdf5' : '#fff1f2',
                                                    color: firm.status === 'active' ? '#10b981' : '#f43f5e',
                                                    px: 1.25, py: 0.35, borderRadius: '8px',
                                                }}>
                                                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                        {firm.status === 'active' ? 'Live' : 'Suspended'}
                                                    </Typography>
                                                </Box>
                                            </td>
                                            {/* Metrics */}
                                            <td style={{ padding: '14px 20px' }}>
                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                                                    {firm.clientsCount || 0}C · {firm.usersCount || 0}U
                                                </Typography>
                                            </td>
                                            {/* Date */}
                                            <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                                                    {new Date(firm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </Typography>
                                            </td>
                                            {/* Actions */}
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end' }}>
                                                    <Tooltip title="View details">
                                                        <IconButton size="small" onClick={() => navigate(`/super-admin/firms/${firm._id}`)}
                                                            sx={{ bgcolor: '#f8fafc', color: '#475569', borderRadius: '8px', '&:hover': { bgcolor: '#eef2ff', color: '#6366f1' } }}>
                                                            <ViewIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={firm.status === 'active' ? 'Suspend' : 'Activate'}>
                                                        <IconButton size="small"
                                                            disabled={updateMutation.isPending}
                                                            onClick={() => updateMutation.mutate({ id: firm._id, status: firm.status === 'active' ? 'suspended' : 'active' })}
                                                            sx={{
                                                                bgcolor: firm.status === 'active' ? '#fff1f2' : '#ecfdf5',
                                                                color: firm.status === 'active' ? '#f43f5e' : '#10b981',
                                                                borderRadius: '8px', '&:hover': { opacity: 0.8 }
                                                            }}>
                                                            {firm.status === 'active' ? <BlockIcon sx={{ fontSize: 16 }} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete firm">
                                                        <IconButton size="small" onClick={() => setDeleteTarget(firm)}
                                                            sx={{ bgcolor: '#fdf2f2', color: '#e11d48', borderRadius: '8px', '&:hover': { bgcolor: '#fee2e2' } }}>
                                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Box>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: '#1e293b' }}>Delete Firm?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#64748b' }}>
                        You are about to permanently delete <strong>{deleteTarget?.firmName}</strong> and all its data.<br />
                        This action <strong>cannot be undone</strong>.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setDeleteTarget(null)} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained" color="error"
                        onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
                        disabled={deleteMutation.isPending}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Firm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FirmManagement;
