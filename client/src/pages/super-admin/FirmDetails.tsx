import React, { useState } from 'react';
import {
    Box, Typography, Button, CircularProgress, Chip, TextField,
    MenuItem, Alert, Stack, Dialog, IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../../services/api';
import {
    ArrowBack as BackIcon,
    Business as FirmIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    People as UsersIcon,
    PersonAdd as ClientsIcon,
    Assignment as TasksIcon,
    Language as UrlIcon,
    Email as EmailIcon,
    CalendarToday as DateIcon,
    CloudQueue as DriveIcon,
    Lock as LockIcon,
    AdminPanelSettings as AdminIcon,
    CheckCircle as ActiveIcon,
    Cancel as SuspendedIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Extension as AddonIcon,
    Bolt as BoltIcon,
    Shield as ShieldIcon,
    BarChart as ChartIcon,
    Storage as StorageIcon,
    WhatsApp as WhatsAppIcon,
    Support as SupportIcon,
    Cloud as CloudIcon,
    AccountBalance as AccountIcon,
    Notifications as NotifyIcon,
    Smartphone as MobileIcon,
    Backup as BackupIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// ── Helper components ────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value, mono = false }: {
    icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean;
}) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5, borderBottom: '1px solid #f8fafc' }}>
        <Box sx={{ color: '#94a3b8', mt: 0.15, flexShrink: 0, '& svg': { fontSize: 18 } }}>{icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.25 }}>
                {label}
            </Typography>
            <Typography sx={{
                fontWeight: 700, color: '#1e293b', fontSize: '0.9rem',
                fontFamily: mono ? 'monospace' : undefined,
                wordBreak: 'break-all',
            }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

const StatBlock = ({ icon, label, value, accent, bg }: {
    icon: React.ReactNode; label: string; value: number; accent: string; bg: string;
}) => (
    <Box sx={{
        bgcolor: bg, borderRadius: '16px', p: 2.5,
        display: 'flex', alignItems: 'center', gap: 2,
        border: `1px solid ${accent}18`,
    }}>
        <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            bgcolor: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            '& svg': { fontSize: 20, color: accent },
        }}>
            {icon}
        </Box>
        <Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography sx={{ fontWeight: 900, color: '#1e293b', fontSize: '1.5rem', lineHeight: 1.2 }}>
                {value}
            </Typography>
        </Box>
    </Box>
);

// ── Plan color helper ─────────────────────────────────────────────────────────
const planStyle = (plan: string) => {
    const p = (plan || '').toLowerCase();
    if (p === 'enterprise') return { bg: '#f5f3ff', text: '#7c3aed' };
    if (p === 'professional') return { bg: '#eff6ff', text: '#2563eb' };
    if (p === 'basic') return { bg: '#ecfdf5', text: '#059669' };
    return { bg: '#f8fafc', text: '#64748b' };
};

const COLOR_PRESETS: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    Indigo:  { bg: 'rgba(99,102,241,0.08)',  text: '#6366f1',  border: 'rgba(99,102,241,0.18)',  hover: 'rgba(99,102,241,0.35)' },
    Emerald: { bg: 'rgba(16,185,129,0.08)',  text: '#10b981',  border: 'rgba(16,185,129,0.18)',  hover: 'rgba(16,185,129,0.35)' },
    Violet:  { bg: 'rgba(139,92,246,0.08)',  text: '#8b5cf6',  border: 'rgba(139,92,246,0.18)',  hover: 'rgba(139,92,246,0.35)' },
    Amber:   { bg: 'rgba(245,158,11,0.08)',  text: '#f59e0b',  border: 'rgba(245,158,11,0.18)',  hover: 'rgba(245,158,11,0.35)' },
    Rose:    { bg: 'rgba(244,63,94,0.08)',   text: '#f43f5e',  border: 'rgba(244,63,94,0.18)',   hover: 'rgba(244,63,94,0.35)' },
    Cyan:    { bg: 'rgba(6,182,212,0.08)',   text: '#06b6d4',  border: 'rgba(6,182,212,0.18)',   hover: 'rgba(6,182,212,0.35)' },
};

const ICON_OPTIONS: Record<string, React.ReactNode> = {
    Bolt: <BoltIcon />, Shield: <ShieldIcon />, BarChart: <ChartIcon />,
    Storage: <StorageIcon />, WhatsApp: <WhatsAppIcon />, Support: <SupportIcon />,
    Cloud: <CloudIcon />, Account: <AccountIcon />, Notifications: <NotifyIcon />,
    Mobile: <MobileIcon />, Lock: <LockIcon />, Backup: <BackupIcon />,
};

// ─────────────────────────────────────────────────────────────────────────────
const FirmDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        plan: '', status: '', maxAdmins: 5,
        googleDriveType: 'app' as 'app' | 'personal',
        googleDriveRootFolderId: ''
    });
    const [resetPassword, setResetPassword] = useState('');
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['sa-firm', id],
        queryFn: async () => {
            const res = await api.get(`/super-admin/firms/${id}`);
            return res.data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    const updateFirmMutation = useMutation({
        mutationFn: async (d: typeof formData) => api.patch(`/super-admin/firms/${id}`, d),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-firm', id] });
            queryClient.invalidateQueries({ queryKey: ['sa-firms'] });
            setEditMode(false);
            toast.success('Firm settings saved!');
        },
        onError: () => toast.error('Failed to save changes'),
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async (password: string) =>
            api.post(`/super-admin/firms/${id}/reset-password`, { newPassword: password }),
        onSuccess: () => {
            toast.success('Password reset successfully!');
            setResetPassword('');
        },
        onError: (err: AxiosError<{ message: string }>) =>
            toast.error(err.response?.data?.message || 'Reset failed'),
    });

    const { data: plans } = useQuery({
        queryKey: ['superadmin_plans'],
        queryFn: async () => {
            const res = await api.get('/super-admin/plans');
            return res.data;
        },
    });

    const { data: catalogAddons = [], isLoading: loadingCatalog } = useQuery({
        queryKey: ['sa-addons'],
        queryFn: async () => {
            const res = await api.get('/super-admin/addons');
            return res.data;
        },
        enabled: purchaseDialogOpen,
    });

    const addAddonMutation = useMutation({
        mutationFn: async (addonId: string) => api.post(`/super-admin/firms/${id}/addons`, { addonId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-firm', id] });
            setPurchaseDialogOpen(false);
            toast.success('Add-on assigned successfully!');
        },
    });

    const removeAddonMutation = useMutation({
        mutationFn: async (addonId: string) => api.delete(`/super-admin/firms/${id}/addons/${addonId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sa-firm', id] });
            toast.success('Add-on removed.');
        },
    });

    const handleEditToggle = () => {
        if (!editMode) {
            setFormData({
                plan: firm.plan,
                status: firm.status.toLowerCase(),
                maxAdmins: firm.maxAdmins || 5,
                googleDriveType: firm.googleDriveType || 'app',
                googleDriveRootFolderId: firm.googleDriveRootFolderId || ''
            });
        }
        setEditMode(!editMode);
    };

    const handleResetPassword = () => {
        if (!resetPassword.trim()) return toast.error('Enter a new password');
        resetPasswordMutation.mutate(resetPassword);
    };

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
            <CircularProgress size={28} sx={{ color: '#6366f1' }} />
        </Box>
    );
    if (!data) return (
        <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="error" fontWeight={700}>Firm not found.</Typography>
        </Box>
    );

    const { firm, users, stats } = data;
    const ps = planStyle(firm.plan);
    const isActive = firm.status?.toLowerCase() === 'active';

    return (
        <Box className="sa-page">
            {/* ── Top Bar ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box
                    onClick={() => navigate('/super-admin/firms')}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                        color: '#94a3b8', '&:hover': { color: '#6366f1' }, transition: 'color 0.15s',
                    }}
                >
                    <BackIcon sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Firms</Typography>
                </Box>
                <Typography sx={{ color: '#e2e8f0' }}>/</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 36, height: 36, bgcolor: '#eef2ff', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FirmIcon sx={{ fontSize: 20, color: '#6366f1' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5, lineHeight: 1.2 }}>
                            {firm.firmName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                            {firm.subdomain}.mycafile.in
                        </Typography>
                    </Box>
                </Box>

                {/* Status + Plan badges */}
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
                    <Chip
                        icon={isActive ? <ActiveIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} /> : <SuspendedIcon sx={{ fontSize: '14px !important', color: '#f43f5e !important' }} />}
                        label={firm.status.toUpperCase()}
                        size="small"
                        sx={{
                            bgcolor: isActive ? '#ecfdf5' : '#fff1f2',
                            color: isActive ? '#10b981' : '#f43f5e',
                            fontWeight: 800, fontSize: '0.7rem', letterSpacing: 0.5,
                        }}
                    />
                    <Chip
                        label={firm.plan.charAt(0).toUpperCase() + firm.plan.slice(1)}
                        size="small"
                        sx={{ bgcolor: ps.bg, color: ps.text, fontWeight: 800, fontSize: '0.7rem' }}
                    />
                </Box>
            </Box>

            {/* ── Main Grid ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 2.5 }}>

                {/* ── LEFT: Profile Card ── */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Profile Info */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                        {/* Card Header */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 3, py: 2.5, borderBottom: '1px solid #f8fafc',
                        }}>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>
                                Profile Settings
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {editMode && (
                                    <Button
                                        size="small" onClick={() => setEditMode(false)} startIcon={<CloseIcon />}
                                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    size="small"
                                    variant={editMode ? 'contained' : 'outlined'}
                                    onClick={editMode ? () => updateFirmMutation.mutate(formData) : handleEditToggle}
                                    disabled={updateFirmMutation.isPending}
                                    startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                                    sx={{
                                        borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem',
                                        ...(editMode
                                            ? { bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none' }
                                            : { borderColor: '#e2e8f0', color: '#475569', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }
                                        ),
                                    }}
                                >
                                    {editMode ? (updateFirmMutation.isPending ? 'Saving…' : 'Save Changes') : 'Edit Settings'}
                                </Button>
                            </Box>
                        </Box>

                        {/* Info rows */}
                        <Box sx={{ px: 3, pb: 1 }}>
                            <InfoRow icon={<FirmIcon />} label="Firm Name" value={firm.firmName} />
                            <InfoRow icon={<UrlIcon />} label="Portal URL"
                                value={
                                    <Box component="a" href={`https://${firm.subdomain}.mycafile.in`} target="_blank"
                                        sx={{ color: '#6366f1', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                        {firm.subdomain}.mycafile.in
                                    </Box>
                                }
                            />
                            <InfoRow icon={<EmailIcon />} label="Registered Email" value={firm.email} />
                            <InfoRow icon={<DateIcon />} label="Created At" value={new Date(firm.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                        </Box>

                        {/* Divider */}
                        <Box sx={{ mx: 3, borderTop: '1px dashed #f1f5f9', my: 1 }} />

                        {/* Editable fields */}
                        <Box sx={{ px: 3, pb: 3 }}>
                            {editMode ? (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
                                    <TextField select fullWidth label="Subscription Plan" size="small" value={formData.plan}
                                        onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                        {plans ? plans.map((p: { _id: string; name: string }) => (
                                            <MenuItem key={p._id} value={p.name}>{p.name}</MenuItem>
                                        )) : ['Starter', 'Professional', 'Enterprise', 'Pro Cloud', 'Enterprise Cloud', 'Custom'].map(opt =>
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        )}
                                    </TextField>
                                    <TextField select fullWidth label="Firm Status" size="small" value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                        {['active', 'suspended'].map(opt =>
                                            <MenuItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</MenuItem>
                                        )}
                                    </TextField>
                                    <TextField select fullWidth label="Max Admin Capacity" size="small" value={formData.maxAdmins}
                                        onChange={e => setFormData({ ...formData, maxAdmins: Number(e.target.value) })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                        {[1, 2, 3, 4, 5, 10].map(num =>
                                            <MenuItem key={num} value={num}>{num} Admin{num > 1 ? 's' : ''}</MenuItem>
                                        )}
                                    </TextField>
                                    <TextField select fullWidth label="Storage Type" size="small" value={formData.googleDriveType}
                                        onChange={e => setFormData({ ...formData, googleDriveType: e.target.value as 'app' | 'personal' })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                                        <MenuItem value="app">Application Drive</MenuItem>
                                        <MenuItem value="personal">Personal Drive</MenuItem>
                                    </TextField>
                                    {formData.googleDriveType === 'personal' && (
                                        <Box sx={{ gridColumn: '1 / -1' }}>
                                            <Alert severity="info" sx={{ mb: 1.5, borderRadius: '12px', py: 0.5 }}>
                                                Share folder with: <code>drive-bot@ca-office-portal-486705.iam.gserviceaccount.com</code>
                                            </Alert>
                                            <TextField fullWidth size="small" label="Google Drive Folder ID"
                                                value={formData.googleDriveRootFolderId}
                                                onChange={e => setFormData({ ...formData, googleDriveRootFolderId: e.target.value })}
                                                helperText="Copy the folder ID from its Google Drive URL"
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mt: 1.5 }}>
                                    {[
                                        { label: 'Plan', value: <Chip label={firm.plan.charAt(0).toUpperCase() + firm.plan.slice(1)} size="small" sx={{ bgcolor: ps.bg, color: ps.text, fontWeight: 800, fontSize: '0.75rem' }} /> },
                                        { label: 'Status', value: <Chip label={firm.status.toUpperCase()} size="small" sx={{ bgcolor: isActive ? '#ecfdf5' : '#fff1f2', color: isActive ? '#10b981' : '#f43f5e', fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5 }} /> },
                                        { label: 'Max Admins', value: <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>{firm.maxAdmins || 5}</Typography> },
                                        { label: 'Storage', value: <Chip label={firm.googleDriveType === 'personal' ? 'Personal' : 'App Drive'} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.72rem', borderColor: '#e2e8f0', color: '#475569' }} /> },
                                    ].map(item => (
                                        <Box key={item.label}>
                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.4, textTransform: 'uppercase', mb: 0.75 }}>{item.label}</Typography>
                                            {item.value}
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Drive folder ID (read-only when not editing) */}
                            {!editMode && firm.googleDriveType === 'personal' && firm.googleDriveRootFolderId && (
                                <InfoRow icon={<DriveIcon />} label="Drive Folder ID" value={firm.googleDriveRootFolderId} mono />
                            )}
                        </Box>
                    </Box>

                    {/* ── Firm Add-ons ── */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AddonIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>Firm Add-ons</Typography>
                            </Box>
                            <Button
                                size="small" variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setPurchaseDialogOpen(true)}
                                sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, borderRadius: '10px', textTransform: 'none', fontWeight: 800, px: 2, boxShadow: 'none' }}
                            >
                                Assign Add-on
                            </Button>
                        </Box>
                        <Box sx={{ px: 3, py: 2 }}>
                            {!firm.addons || firm.addons.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>No add-ons currently active for this firm.</Typography>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                                    {firm.addons.map((a: { _id: string; addonId: { _id: string; name: string; icon: string; color: string }; expiryDate: string }) => {
                                        const ad = a.addonId;
                                        if (!ad) return null;
                                        const preset = COLOR_PRESETS[ad.color] || COLOR_PRESETS.Indigo;
                                        return (
                                            <Box key={a._id || ad._id} sx={{
                                                bgcolor: preset.bg, borderRadius: '16px', border: `1px solid ${preset.border}`,
                                                px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5
                                            }}>
                                                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { color: preset.text, fontSize: 18 } }}>
                                                    {ICON_OPTIONS[ad.icon] || <AddonIcon />}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: preset.text }}>{ad.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>Expires: {new Date(a.expiryDate).toLocaleDateString()}</Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeAddonMutation.mutate(ad._id)}
                                                    sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244,63,94,0.1)' } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* ── Users Table ── */}
                    {users && users.length > 0 && (
                        <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UsersIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>Admin Users ({users.length})</Typography>
                            </Box>
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            {['Name', 'Email', 'Role'].map(h => (
                                                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u: { _id: string; name?: string; email?: string; username?: string; role?: string }, i: number) => (
                                            <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Box sx={{ width: 28, height: 28, bgcolor: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1' }}>
                                                                {(u.name || u.email || '?')[0].toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{u.name || '—'}</Typography>
                                                    </Box>
                                                </td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{u.email || u.username}</Typography>
                                                </td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <Chip label={u.role || 'ADMIN'} size="small" sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 700, fontSize: '0.68rem' }} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* ── RIGHT: Stats + Security ── */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Stat Blocks */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <StatBlock icon={<UsersIcon />}   label="Admin Users"    value={users?.length || 0}       accent="#6366f1" bg="#eef2ff" />
                        <StatBlock icon={<ClientsIcon />} label="Total Clients"  value={stats?.clientsCount || 0} accent="#10b981" bg="#ecfdf5" />
                        <StatBlock icon={<TasksIcon />}   label="Total Tasks"    value={stats?.tasksCount || 0}   accent="#f59e0b" bg="#fffbeb" />
                    </Box>

                    {/* Security Card */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LockIcon sx={{ fontSize: 18, color: '#f43f5e' }} />
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>Security Control</Typography>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, mb: 1.5 }}>
                                Reset the admin password for this firm's portal.
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextField
                                    fullWidth size="small" label="New Admin Password" type="password"
                                    value={resetPassword}
                                    onChange={e => setResetPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                />
                                <Button
                                    fullWidth variant="contained"
                                    onClick={handleResetPassword}
                                    disabled={resetPasswordMutation.isPending || !resetPassword.trim()}
                                    startIcon={<AdminIcon />}
                                    sx={{
                                        borderRadius: '12px', textTransform: 'none', fontWeight: 700,
                                        bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none',
                                        '&:disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' },
                                    }}
                                >
                                    {resetPasswordMutation.isPending ? 'Resetting…' : 'Reset Password'}
                                </Button>
                            </Stack>
                        </Box>
                    </Box>

                    {/* Quick Info Card */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 3 }}>
                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem', mb: 2 }}>Quick Info</Typography>
                        <Stack spacing={1.5}>
                            {[
                                { label: 'Subdomain', value: firm.subdomain, icon: <UrlIcon /> },
                                { label: 'DB Type', value: firm.dbType || 'default', icon: <DriveIcon /> },
                                { label: 'Max Admins', value: `${firm.maxAdmins || 5} users`, icon: <AdminIcon /> },
                                { label: 'Drive', value: firm.googleDriveType === 'personal' ? 'Personal' : 'App Drive', icon: <DriveIcon /> },
                            ].map(item => (
                                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f8fafc' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#94a3b8', '& svg': { fontSize: 15 } }}>
                                        {item.icon}
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{item.label}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </Box>

            {/* ── Add-on Catalog Dialog ── */}
            <Box>
                <Dialog
                    open={purchaseDialogOpen}
                    onClose={() => setPurchaseDialogOpen(false)}
                    maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
                >
                    <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Assign Add-on</Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>MANUAL PURCHASE/ASSIGNMENT</Typography>
                        </Box>
                        <IconButton onClick={() => setPurchaseDialogOpen(false)}><CloseIcon /></IconButton>
                    </Box>
                    <Box sx={{ p: 2.5, maxHeight: '60vh', overflowY: 'auto' }}>
                        {loadingCatalog ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} /></Box>
                        ) : catalogAddons.length === 0 ? (
                            <Typography sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>No add-ons available in catalog.</Typography>
                        ) : (
                            <Stack spacing={2}>
                                {catalogAddons.map((ad: { _id: string; name: string; description: string; price: number; icon: string; color: string }) => {
                                    const preset = COLOR_PRESETS[ad.color] || COLOR_PRESETS.Indigo;
                                    const isOwned = firm.addons?.some((fa: { addonId: { _id: string } }) => fa.addonId?._id === ad._id);

                                    return (
                                        <Box
                                            key={ad._id}
                                            sx={{
                                                bgcolor: '#fff', borderRadius: '18px', border: `1px solid ${preset.border}`,
                                                p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5,
                                                opacity: isOwned ? 0.6 : 1, transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: isOwned ? 'none' : preset.bg, transform: isOwned ? 'none' : 'translateY(-2px)' }
                                            }}
                                        >
                                            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: preset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 24, color: preset.text } }}>
                                                {ICON_OPTIONS[ad.icon] || <AddonIcon />}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{ad.name}</Typography>
                                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.25 }}>{ad.description}</Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography sx={{ fontWeight: 800, color: preset.text, fontSize: '1.05rem' }}>₹{ad.price}/yr</Typography>
                                                <Button
                                                    size="small" variant={isOwned ? 'outlined' : 'contained'}
                                                    disabled={isOwned || addAddonMutation.isPending}
                                                    onClick={() => addAddonMutation.mutate(ad._id)}
                                                    sx={{
                                                        mt: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem',
                                                        ...(isOwned ? { color: '#94a3b8', borderColor: '#e2e8f0' } : { bgcolor: preset.text, boxShadow: 'none' })
                                                    }}
                                                >
                                                    {isOwned ? 'Assigned' : 'Assign Now'}
                                                </Button>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Dialog>
            </Box>
        </Box>
    );
};

export default FirmDetails;
