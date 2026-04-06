import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Stack, Chip, CircularProgress,
    MenuItem, IconButton, Tooltip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    Extension as AddonIcon,
    Bolt as BoltIcon, Shield as ShieldIcon, BarChart as ChartIcon,
    Storage as StorageIcon, WhatsApp as WhatsAppIcon,
    Support as SupportIcon, Cloud as CloudIcon,
    AccountBalance as AccountIcon, Notifications as NotifyIcon,
    Smartphone as MobileIcon, Lock as LockIcon, Backup as BackupIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_OPTIONS: Record<string, React.ReactNode> = {
    Bolt: <BoltIcon />, Shield: <ShieldIcon />, BarChart: <ChartIcon />,
    Storage: <StorageIcon />, WhatsApp: <WhatsAppIcon />, Support: <SupportIcon />,
    Cloud: <CloudIcon />, Account: <AccountIcon />, Notifications: <NotifyIcon />,
    Mobile: <MobileIcon />, Lock: <LockIcon />, Backup: <BackupIcon />,
};

// ── Color map ──────────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
    { label: 'Indigo',  bg: 'rgba(99,102,241,0.08)',  text: '#6366f1',  border: 'rgba(99,102,241,0.18)',  hover: 'rgba(99,102,241,0.35)' },
    { label: 'Emerald', bg: 'rgba(16,185,129,0.08)',  text: '#10b981',  border: 'rgba(16,185,129,0.18)',  hover: 'rgba(16,185,129,0.35)' },
    { label: 'Violet',  bg: 'rgba(139,92,246,0.08)',  text: '#8b5cf6',  border: 'rgba(139,92,246,0.18)',  hover: 'rgba(139,92,246,0.35)' },
    { label: 'Amber',   bg: 'rgba(245,158,11,0.08)',  text: '#f59e0b',  border: 'rgba(245,158,11,0.18)',  hover: 'rgba(245,158,11,0.35)' },
    { label: 'Rose',    bg: 'rgba(244,63,94,0.08)',   text: '#f43f5e',  border: 'rgba(244,63,94,0.18)',   hover: 'rgba(244,63,94,0.35)' },
    { label: 'Cyan',    bg: 'rgba(6,182,212,0.08)',   text: '#06b6d4',  border: 'rgba(6,182,212,0.18)',   hover: 'rgba(6,182,212,0.35)' },
];

interface Addon {
    _id?: string;
    name: string;
    description: string;
    price: number;
    yearlyPrice?: number; // Legacy support
    type: 'STORAGE' | 'DATABASE' | 'WHATSAPP' | 'REPORTS' | 'DSC';
    icon: string;
    color: string; // COLOR_PRESETS label
    isActive: boolean;
}

// ── Addon Card ────────────────────────────────────────────────────────────────
function AddonCard({ addon, onEdit, onDelete }: {
    addon: Addon; onEdit: () => void; onDelete: () => void;
}) {
    const preset = COLOR_PRESETS.find(c => c.label === addon.color) || COLOR_PRESETS[0];
    const [hovered, setHovered] = useState(false);
    
    // Safely handle legacy or missing fields
    const displayPrice = addon.price ?? addon.yearlyPrice ?? 0;

    return (
        <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{
                bgcolor: '#fff', borderRadius: '20px',
                border: `1px solid ${hovered ? preset.hover : preset.border}`,
                p: 3, cursor: 'default', position: 'relative',
                transition: 'all 0.22s ease',
                transform: hovered ? 'translateY(-4px)' : 'none',
                boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                opacity: addon.isActive ? 1 : 0.55,
            }}
        >
            {/* Action buttons - appear on hover */}
            <Box sx={{
                position: 'absolute', top: 12, right: 12,
                display: 'flex', gap: 0.5,
                opacity: hovered ? 1 : 0, transition: 'opacity 0.18s',
            }}>
                <Tooltip title="Edit">
                    <IconButton size="small" onClick={onEdit}
                        sx={{ width: 28, height: 28, bgcolor: '#f8fafc', '&:hover': { bgcolor: '#eef2ff', color: '#6366f1' } }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton size="small" onClick={onDelete}
                        sx={{ width: 28, height: 28, bgcolor: '#f8fafc', '&:hover': { bgcolor: '#fff1f2', color: '#f43f5e' } }}>
                        <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Header: icon + price */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{
                    width: 44, height: 44, borderRadius: '12px',
                    bgcolor: preset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.22s ease',
                    transform: hovered ? 'scale(1.1)' : 'scale(1)',
                    '& svg': { fontSize: 22, color: preset.text },
                }}>
                    {ICON_OPTIONS[addon.icon] || <AddonIcon />}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: preset.text, lineHeight: 1 }}>
                        ₹{displayPrice.toLocaleString('en-IN')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>/yr</Typography>
                </Box>
            </Box>

            {/* Name */}
            <Typography sx={{ fontWeight: 800, color: '#10293b', fontSize: '0.95rem', mb: 0.75 }}>
                {addon.name || 'Untitled Add-on'}
            </Typography>

            {/* Description */}
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, minHeight: 48 }}>
                {addon.description}
            </Typography>

            {/* Footer: status + hover CTA */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1.5, borderTop: `1px solid ${preset.border}` }}>
                <Chip
                    label={addon.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                        bgcolor: addon.isActive ? '#ecfdf5' : '#f8fafc',
                        color: addon.isActive ? '#10b981' : '#94a3b8',
                        fontWeight: 700, fontSize: '0.67rem',
                    }}
                />
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color: preset.text, fontSize: '0.75rem', fontWeight: 700,
                    opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'all 0.2s ease',
                }}>
                    <AddIcon sx={{ fontSize: 14 }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: preset.text }}>Add to plan</Typography>
                </Box>
            </Box>
        </Box>
    );
}

// ── Addon Form Dialog ─────────────────────────────────────────────────────────
const EMPTY_ADDON: Addon = {
    name: '', description: '', price: 0, type: 'STORAGE',
    icon: 'Bolt', color: 'Indigo', isActive: true,
};

function AddonDialog({ open, addon, onClose, onSave, loading }: {
    open: boolean; addon: Addon; onClose: () => void;
    onSave: (a: Addon) => void; loading: boolean;
}) {
    const [form, setForm] = useState<Addon>(addon);
    React.useEffect(() => {
        setForm({
            ...addon,
            price: addon.price ?? addon.yearlyPrice ?? 0,
            type:  addon.type || 'STORAGE'
        });
    }, [addon]);

    const preset = COLOR_PRESETS.find(c => c.label === form.color) || COLOR_PRESETS[0];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: '20px', p: 0.5 } }}>
            <DialogTitle sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem', pb: 1 }}>
                {addon._id ? 'Edit Add-on' : 'New Add-on'}
            </DialogTitle>
            <DialogContent>
                {/* Live Preview */}
                <Box sx={{
                    mt: 1, mb: 2.5, p: 2.5, borderRadius: '16px',
                    bgcolor: preset.bg, border: `1px solid ${preset.border}`,
                    display: 'flex', alignItems: 'center', gap: 2,
                }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 20, color: preset.text } }}>
                        {ICON_OPTIONS[form.icon] || <AddonIcon />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: preset.text, fontSize: '0.9rem' }}>{form.name || 'Add-on Name'}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{form.description || 'Description...'}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: preset.text }}>₹{(form.price || 0).toLocaleString('en-IN')}/yr</Typography>
                </Box>

                <Stack spacing={2}>
                    <TextField fullWidth size="small" label="Add-on Name"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth size="small" label="Description" multiline rows={2}
                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <TextField fullWidth size="small" label="Yearly Price (₹)" type="number"
                        value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField select fullWidth size="small" label="Add-on Type"
                            value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Addon['type'] })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                            <MenuItem value="STORAGE">Cloud Storage</MenuItem>
                            <MenuItem value="DATABASE">Personal Database</MenuItem>
                            <MenuItem value="WHATSAPP">WhatsApp AI</MenuItem>
                            <MenuItem value="REPORTS">Advanced Reports</MenuItem>
                            <MenuItem value="DSC">Bulk DSC Management</MenuItem>
                        </TextField>
                        <TextField select fullWidth size="small" label="Icon"
                            value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                            {Object.keys(ICON_OPTIONS).map(k => (
                                <MenuItem key={k} value={k}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, '& svg': { fontSize: 16 } }}>
                                        {ICON_OPTIONS[k]} {k}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <TextField select fullWidth size="small" label="Color"
                        value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                        {COLOR_PRESETS.map(c => (
                            <MenuItem key={c.label} value={c.label}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: c.text, flexShrink: 0 }} />
                                    {c.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField select fullWidth size="small" label="Status"
                        value={form.isActive ? 'active' : 'inactive'}
                        onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                        <MenuItem value="active">Active — visible to customers</MenuItem>
                        <MenuItem value="inactive">Inactive — hidden</MenuItem>
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                <Button onClick={onClose} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => onSave(form)} disabled={loading || !form.name.trim()}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, px: 3.5, bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none' }}>
                    {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : (addon._id ? 'Save Changes' : 'Create Add-on')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const AddonsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Addon>(EMPTY_ADDON);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data: addons = [], isLoading } = useQuery<Addon[]>({
        queryKey: ['sa-addons'],
        queryFn: async () => {
            const res = await api.get('/super-admin/addons');
            return res.data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    const saveMutation = useMutation({
        mutationFn: async (addon: Addon) => {
            if (addon._id) return api.put(`/super-admin/addons/${addon._id}`, addon);
            return api.post('/super-admin/addons', addon);
        },
        onSuccess: (_, addon) => {
            queryClient.invalidateQueries({ queryKey: ['sa-addons'] });
            setDialogOpen(false);
            toast.success(addon._id ? 'Add-on updated!' : 'Add-on created!');
        },
        onError: () => toast.error('Failed to save add-on'),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/super-admin/addons/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-addons'] });
            setDeleteId(null);
            toast.success('Add-on deleted!');
        },
        onError: () => toast.error('Failed to delete'),
    });

    const openCreate = () => { setEditing(EMPTY_ADDON); setDialogOpen(true); };
    const openEdit = (addon: Addon) => { setEditing(addon); setDialogOpen(true); };

    const activeCount = addons.filter(a => a.isActive).length;

    return (
        <Box className="sa-page">
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#f5f3ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AddonIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                        </Box>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                            Add-ons
                        </Typography>
                    </Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, ml: '47px' }}>
                        Manage optional features available to CA firms on the platform.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                    sx={{
                        borderRadius: '14px', textTransform: 'none', fontWeight: 800, fontSize: '0.875rem',
                        bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none', px: 2.5, py: 1.25,
                    }}
                >
                    New Add-on
                </Button>
            </Box>

            {/* ── Summary strip ── */}
            {!isLoading && (
                <Box sx={{ display: 'flex', gap: 3, bgcolor: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', p: 2.5, mb: 3, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Add-ons', value: addons.length, color: '#1e293b' },
                        { label: 'Active', value: activeCount, color: '#10b981' },
                        { label: 'Inactive', value: addons.length - activeCount, color: '#94a3b8' },
                        { label: 'Avg Price', value: addons.length > 0 ? `₹${Math.round(addons.reduce((s, a) => s + a.price, 0) / addons.length).toLocaleString('en-IN')}` : '—', color: '#f59e0b' },
                    ].map(stat => (
                        <Box key={stat.label}>
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>{stat.label}</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: stat.color }}>{stat.value}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {/* ── Cards Grid ── */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={28} sx={{ color: '#8b5cf6' }} />
                </Box>
            ) : addons.length === 0 ? (
                <Box sx={{
                    textAlign: 'center', py: 12, bgcolor: '#fff',
                    borderRadius: '20px', border: '1px dashed #e2e8f0',
                }}>
                    <Box sx={{ width: 56, height: 56, bgcolor: '#f5f3ff', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <AddonIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', mb: 0.5 }}>No add-ons yet</Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 2.5 }}>Create your first add-on to show it on the pricing page.</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, bgcolor: '#1e293b', boxShadow: 'none', '&:hover': { bgcolor: '#0f172a' } }}>
                        Create Add-on
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                    {addons.map(addon => (
                        <AddonCard
                            key={addon._id}
                            addon={addon}
                            onEdit={() => openEdit(addon)}
                            onDelete={() => setDeleteId(addon._id!)}
                        />
                    ))}
                    {/* Add new slot */}
                    <Box
                        onClick={openCreate}
                        sx={{
                            borderRadius: '20px', border: '2px dashed #e2e8f0', p: 3,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', gap: 1, minHeight: 180,
                            transition: 'all 0.18s ease',
                            '&:hover': { borderColor: '#8b5cf6', bgcolor: '#faf5ff' },
                        }}
                    >
                        <Box sx={{ width: 40, height: 40, bgcolor: '#f5f3ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AddIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem' }}>Add New</Typography>
                    </Box>
                </Box>
            )}

            {/* ── Form Dialog ── */}
            <AddonDialog
                open={dialogOpen}
                addon={editing}
                onClose={() => setDialogOpen(false)}
                onSave={saveMutation.mutate}
                loading={saveMutation.isPending}
            />

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '20px', p: 0.5 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>Delete Add-on?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                        This will remove the add-on from the platform and pricing page. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}>Cancel</Button>
                    <Button variant="contained" onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                        disabled={deleteMutation.isPending}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, bgcolor: '#f43f5e', '&:hover': { bgcolor: '#e11d48' }, boxShadow: 'none' }}>
                        {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddonsPage;
