import React, { useState } from 'react';
import {
    Box, Paper, Typography, TextField, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Chip,
    CircularProgress, InputAdornment
} from '@mui/material';
import { CommonButton } from '../../../components/common/UIComponents';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Category as CategoryIcon, Search as SearchIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { AxiosError } from 'axios';

interface TaskCategoryData {
    _id: string;
    name: string;
    color: string;
    description: string;
    status: 'Active' | 'Inactive';
}

const PRESET_COLORS = [
    '#667eea', '#10b981', '#c026d3', '#ef4444', '#8b5cf6',
    '#3b82f6', '#ec4899', '#14b8a6', '#7e22ce', '#6b7280'
];

export const TaskCategoryPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [editItem, setEditItem] = useState<Partial<TaskCategoryData> | null>(null);
    const [form, setForm] = useState({ name: '', color: '#667eea', description: '' });

    const { data: categories = [], isLoading } = useQuery<TaskCategoryData[]>({
        queryKey: ['taskCategories'],
        queryFn: async () => {
            const res = await api.get('/task-category');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof form) => {
            const res = await api.post('/task-category', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Category created!');
            queryClient.invalidateQueries({ queryKey: ['taskCategories'] });
            handleClose();
        },
        onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof form }) => {
            const res = await api.put(`/task-category/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Category updated!');
            queryClient.invalidateQueries({ queryKey: ['taskCategories'] });
            handleClose();
        },
        onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/task-category/${id}`),
        onSuccess: () => {
            toast.success('Category deleted');
            queryClient.invalidateQueries({ queryKey: ['taskCategories'] });
        },
        onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message || 'Failed')
    });

    const handleOpen = (item?: TaskCategoryData) => {
        if (item) {
            setEditItem(item);
            setForm({ name: item.name, color: item.color, description: item.description });
        } else {
            setEditItem(null);
            setForm({ name: '', color: '#667eea', description: '' });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditItem(null);
        setForm({ name: '', color: '#667eea', description: '' });
    };

    const handleSubmit = () => {
        if (!form.name.trim()) { toast.error('Category name is required'); return; }
        if (editItem?._id) {
            updateMutation.mutate({ id: editItem._id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', mb: 3 }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', p: 2.5, color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <CategoryIcon />
                        <Typography variant="h5" fontWeight={700}>Task Categories</Typography>
                    </Box>
                    <CommonButton
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Add Category
                    </CommonButton>
                </Box>
            </Paper>

            {/* Search */}
            <Box mb={2}>
                <TextField
                    size="small"
                    placeholder="Search categories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    sx={{ minWidth: 280 }}
                />
            </Box>

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Category Name</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Color</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                        {search ? 'No categories match your search' : 'No categories yet. Click "Add Category" to get started.'}
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(cat => (
                                <TableRow key={cat._id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
                                            <Typography fontWeight={600}>{cat.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={cat.color}
                                            sx={{ bgcolor: cat.color, color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cat.description || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={cat.status}
                                            color={cat.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleOpen(cat)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => {
                                            if (window.confirm(`Delete category "${cat.name}"?`)) {
                                                deleteMutation.mutate(cat._id);
                                            }
                                        }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', py: 2 }}>
                    {editItem ? 'Edit Category' : 'Add Task Category'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, pb: 1 }}>
                    <Box display="flex" flexDirection="column" gap={2.5} mt={1}>
                        <TextField
                            label="Category Name *"
                            size="small"
                            fullWidth
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. GST, Income Tax, Audit, MCA..."
                            autoFocus
                        />
                        <TextField
                            label="Description"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Optional description..."
                        />
                        <Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>Color</Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                                {PRESET_COLORS.map(c => (
                                    <Box
                                        key={c}
                                        onClick={() => setForm({ ...form, color: c })}
                                        sx={{
                                            width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                                            border: form.color === c ? '3px solid #333' : '2px solid transparent',
                                            transition: 'transform 0.15s',
                                            '&:hover': { transform: 'scale(1.2)' }
                                        }}
                                    />
                                ))}
                                <TextField
                                    size="small"
                                    type="color"
                                    value={form.color}
                                    onChange={e => setForm({ ...form, color: e.target.value })}
                                    sx={{ width: 60, ml: 1 }}
                                    inputProps={{ style: { padding: 2, cursor: 'pointer' } }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <CommonButton onClick={handleClose} variant="outlined">Cancel</CommonButton>
                    <CommonButton
                        onClick={handleSubmit}
                        loading={createMutation.isPending || updateMutation.isPending}
                    >
                        {editItem ? 'Update' : 'Create Category'}
                    </CommonButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};





