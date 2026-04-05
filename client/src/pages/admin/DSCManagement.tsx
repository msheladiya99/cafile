import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, TextField, MenuItem, Select,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
    CircularProgress, Avatar, Tooltip, LinearProgress, Alert,
    InputAdornment, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import GppGoodIcon from '@mui/icons-material/GppGood';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { dscService, type DSCRecord } from '../../services/dscService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { CommonButton } from '../../components/common/UIComponents';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:        { label: 'Active',        color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
    expiring_soon: { label: 'Expiring Soon', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    expired:       { label: 'Expired',       color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

function daysUntil(date: string) {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Password Reveal Modal ────────────────────────────────────────────────────
function PasswordModal({ dscId, dscLabel, onClose }: { dscId: string; dscLabel: string; onClose: () => void }) {
    const [step, setStep]           = useState<'warn' | 'reveal' | 'show'>('warn');
    const [password, setPassword]   = useState('');
    const [visible, setVisible]     = useState(false);
    const [loading, setLoading]     = useState(false);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (step !== 'show') return;
        const t = setInterval(() => setCountdown(c => {
            if (c <= 1) { clearInterval(t); onClose(); }
            return c - 1;
        }), 1000);
        return () => clearInterval(t);
    }, [step, onClose]);

    async function handleReveal() {
        setLoading(true);
        try {
            const res = await dscService.viewPassword(dscId);
            setPassword(res.password);
            setStep('show');
            setCountdown(10);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Failed to retrieve password');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                color: 'white', fontWeight: 700
            }}>
                🔐 View DSC Password
                <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400, mt: 0.5 }}>{dscLabel}</Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {step === 'warn' && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
                        <Typography variant="body2" fontWeight={600}>Security Warning</Typography>
                        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                            <li>This action will be logged with your name, time & IP</li>
                            <li>Password auto-hides after <strong>10 seconds</strong></li>
                            <li>Admin will receive an email alert</li>
                        </ul>
                    </Alert>
                )}

                {step === 'reveal' && (
                    <Box textAlign="center" py={2}>
                        <LockIcon sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />
                        <Typography color="text.secondary">Click below to securely retrieve the DSC password.</Typography>
                    </Box>
                )}

                {step === 'show' && (
                    <Box>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#f8fafc', mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    DSC Password
                                </Typography>
                                <Typography variant="caption" color="error" fontWeight={700}>
                                    Hides in {countdown}s
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography fontFamily="monospace" fontSize="1.25rem" fontWeight={700} flex={1} letterSpacing={4}>
                                    {visible ? password : '••••••••'}
                                </Typography>
                                <IconButton size="small" onClick={() => setVisible(v => !v)}>
                                    {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                                <IconButton size="small" onClick={() => { navigator.clipboard.writeText(password); toast.success('Copied!'); }}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Paper>
                        <LinearProgress
                            variant="determinate"
                            value={(countdown / 10) * 100}
                            sx={{ borderRadius: '12px', height: 6, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <CommonButton onClick={onClose} variant="outlined" sx={{ borderRadius: '12px' }}>
                    {step === 'show' ? 'Close' : 'Cancel'}
                </CommonButton>
                {step === 'warn' && (
                    <CommonButton onClick={() => setStep('reveal')} variant="contained" color="error" sx={{ borderRadius: '12px' }}>
                        I Understand, Continue
                    </CommonButton>
                )}
                {step === 'reveal' && (
                    <CommonButton onClick={handleReveal} loading={loading} variant="contained"
                        sx={{ borderRadius: '12px', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: 'error.main', '&:hover': { bgcolor: '#fef2f2' } }}>
                        🔓 Reveal Password
                    </CommonButton>
                )}
            </DialogActions>
        </Dialog>
    );
}

// ─── Audit Log Modal ──────────────────────────────────────────────────────────
function AuditModal({ dscId, dscLabel, onClose }: { dscId: string; dscLabel: string; onClose: () => void }) {
    const { data, isLoading } = useQuery({ queryKey: ['dsc-audit', dscId], queryFn: () => dscService.getAuditLog(dscId) });

    const ACTION_COLOR: Record<string, 'error' | 'info' | 'success' | 'default'> = {
        VIEW_PASSWORD: 'error', UPDATE: 'info', CREATE: 'success', DELETE: 'error'
    };

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', color: 'white', fontWeight: 700 }}>
                📋 Audit Log
                <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 400 }}>{dscLabel}</Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {isLoading ? (
                    <Box textAlign="center" py={4}><CircularProgress size={28} /></Box>
                ) : (data?.auditLog || []).length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={3}>No audit entries found</Typography>
                ) : (
                    <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                        {[...(data?.auditLog || [])].reverse().map((log: { action: string; accessedBy?: { name?: string }; accessedAt: string; ipAddress: string }, i: number) => (
                            <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#f8fafc' }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" fontWeight={700}>{log.accessedBy?.name || 'Unknown'}</Typography>
                                    <Chip label={log.action} size="small" color={ACTION_COLOR[log.action] || 'default'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(log.accessedAt).toLocaleString('en-IN')} · IP: {log.ipAddress}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <CommonButton onClick={onClose} variant="outlined" sx={{ borderRadius: '12px' }}>Close</CommonButton>
            </DialogActions>
        </Dialog>
    );
}

// ─── DSC Form Modal ───────────────────────────────────────────────────────────
function DSCFormModal({ initial, onClose, onSuccess }: { initial?: DSCRecord | null; onClose: () => void; onSuccess: () => void }) {
    const isEdit = !!initial;
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });

    const [form, setForm] = useState({
        clientId:         (initial?.clientId as { _id: string } | null)?._id || (initial?.clientId as string) || '',
        dscNumber:        initial?.dscNumber || '',
        holderName:       initial?.holderName || '',
        issueDate:        initial?.issueDate?.slice(0, 10) || '',
        expiryDate:       initial?.expiryDate?.slice(0, 10) || '',
        dscClass:         initial?.dscClass || '',
        dscType:          initial?.dscType || '',
        issuingAuthority: initial?.issuingAuthority || '',
        purpose:          initial?.purpose || '',
        dscPassword:      '',
    });
    const [saving, setSaving] = useState(false);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: Partial<DSCRecord> & { dscPassword?: string } = { ...form };
            if (!payload.dscPassword) delete payload.dscPassword;
            if (isEdit) {
                await dscService.update(initial!._id, payload);
                toast.success('DSC updated');
            } else {
                await dscService.create(payload);
                toast.success('DSC added successfully');
            }
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Failed to save DSC');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, maxHeight: '92vh', m: { xs: 0, sm: 2 } } }}>
            <DialogTitle sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 700, py: 2 }}>
                {isEdit ? '✏️ Edit DSC' : '➕ Add New DSC'}
                <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 400, mt: 0.25 }}>Digital Signature Certificate</Typography>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
                    <Box display="flex" flexDirection="column" gap={2.5}>

                        {/* Client — full width */}
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Client *</InputLabel>
                            <Select value={form.clientId} label="Select Client *" required
                                onChange={e => set('clientId', e.target.value)} sx={{ borderRadius: '12px' }}>
                                {(clients as { _id: string; name: string; panNumber?: string }[]).map(c => (
                                    <MenuItem key={c._id} value={c._id}>
                                        {c.name}{c.panNumber ? ` — ${c.panNumber}` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* DSC Number | Holder Name */}
                        <Box display="flex" gap={2} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <TextField size="small" label="DSC Number *" required placeholder="e.g. DSC123456"
                                value={form.dscNumber} onChange={e => set('dscNumber', e.target.value)}
                                fullWidth InputProps={{ sx: { borderRadius: '12px' } }} />
                            <TextField size="small" label="Holder Name *" required placeholder="Name as on DSC"
                                value={form.holderName} onChange={e => set('holderName', e.target.value)}
                                fullWidth InputProps={{ sx: { borderRadius: '12px' } }} />
                        </Box>

                        {/* Issue Date | Expiry Date */}
                        <Box display="flex" gap={2} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <TextField size="small" label="Issue Date *" type="date" required fullWidth
                                value={form.issueDate} onChange={e => set('issueDate', e.target.value)}
                                InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: '12px' } }} />
                            <TextField size="small" label="Expiry Date *" type="date" required fullWidth
                                value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                                InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: '12px' } }} />
                        </Box>

                        {/* DSC Class | DSC Type */}
                        <Box display="flex" gap={2} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>DSC Class</InputLabel>
                                <Select value={form.dscClass} label="DSC Class"
                                    onChange={e => set('dscClass', e.target.value)} sx={{ borderRadius: '12px' }}>
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="Class 1">Class 1</MenuItem>
                                    <MenuItem value="Class 2">Class 2</MenuItem>
                                    <MenuItem value="Class 3">Class 3</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" fullWidth>
                                <InputLabel>DSC Type</InputLabel>
                                <Select value={form.dscType} label="DSC Type"
                                    onChange={e => set('dscType', e.target.value)} sx={{ borderRadius: '12px' }}>
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="Signing">Signing</MenuItem>
                                    <MenuItem value="Encryption">Encryption</MenuItem>
                                    <MenuItem value="Both">Both</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Issuing Authority | Purpose */}
                        <Box display="flex" gap={2} sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <TextField size="small" label="Issuing Authority" placeholder="e.g. eMudhra, Sify, NSDL"
                                value={form.issuingAuthority} onChange={e => set('issuingAuthority', e.target.value)}
                                fullWidth InputProps={{ sx: { borderRadius: '12px' } }} />
                            <TextField size="small" label="Purpose" placeholder="e.g. Income Tax, MCA"
                                value={form.purpose} onChange={e => set('purpose', e.target.value)}
                                fullWidth InputProps={{ sx: { borderRadius: '12px' } }} />
                        </Box>

                        {/* Password — full width */}
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#fffbeb', borderColor: '#fde68a' }}>
                            <Typography variant="caption" fontWeight={700} color="#92400e"
                                sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                                🔐 DSC Password (AES-256 Encrypted)
                            </Typography>
                            <TextField fullWidth size="small" type="password"
                                value={form.dscPassword} onChange={e => set('dscPassword', e.target.value)}
                                placeholder={isEdit ? 'Leave blank to keep existing password' : 'Enter DSC password to store securely'}
                                InputProps={{ sx: { borderRadius: '12px', bgcolor: 'white' } }} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Password is encrypted using AES-256-CBC and stored securely. Only Admin/Manager can view it.
                            </Typography>
                        </Paper>

                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <CommonButton onClick={onClose} variant="outlined" sx={{ borderRadius: '12px' }}>Cancel</CommonButton>
                    <CommonButton type="submit" variant="contained" loading={saving} sx={{ borderRadius: '12px' }}>
                        {isEdit ? 'Update DSC' : 'Add DSC'}
                    </CommonButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}

// ─── Main DSC Page ────────────────────────────────────────────────────────────
export const DSCManagement: React.FC = () => {
    const qc = useQueryClient();
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch]             = useState('');
    const [showForm, setShowForm]         = useState(false);
    const [editItem, setEditItem]         = useState<DSCRecord | null>(null);
    const [pwdItem, setPwdItem]           = useState<DSCRecord | null>(null);
    const [auditItem, setAuditItem]       = useState<DSCRecord | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DSCRecord | null>(null);

    const { data: dashboard } = useQuery({ queryKey: ['dsc-dashboard'], queryFn: dscService.getDashboard });
    const { data: dscs = [], isLoading } = useQuery({
        queryKey: ['dsc', statusFilter],
        queryFn: () => dscService.getAll({ status: statusFilter || undefined })
    });

    const filtered = useMemo(() => {
        if (!search) return dscs as DSCRecord[];
        const s = search.toLowerCase();
        return (dscs as DSCRecord[]).filter(d =>
            d.dscNumber.toLowerCase().includes(s) ||
            d.holderName.toLowerCase().includes(s) ||
            ((d.clientId as { name?: string })?.name || '').toLowerCase().includes(s)
        );
    }, [dscs, search]);

    const deleteMutation = useMutation({
        mutationFn: dscService.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dsc'] });
            qc.invalidateQueries({ queryKey: ['dsc-dashboard'] });
            toast.success('DSC deleted');
            setDeleteConfirm(null);
        }
    });

    function invalidate() {
        qc.invalidateQueries({ queryKey: ['dsc'] });
        qc.invalidateQueries({ queryKey: ['dsc-dashboard'] });
    }

    // Stat cards
    const statCards = [
        { label: 'Total DSC',     value: dashboard?.total        ?? 0, icon: <GppGoodIcon />,      color: '#667eea', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
        { label: 'Active',        value: dashboard?.active       ?? 0, icon: <GppGoodIcon />,      color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)' },
        { label: 'Expiring Soon', value: dashboard?.expiringSoon ?? 0, icon: <WarningAmberIcon />,  color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
        { label: 'Expired',       value: dashboard?.expired      ?? 0, icon: <ErrorOutlineIcon />, color: '#ef4444', bg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            {/* ── Page Header ── */}
            <Paper elevation={0} sx={{
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b', borderRadius: '0 0 16px 16px', px: 3, py: 2.5, mb: 3
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    gap: 2.5 
                }}>
                    <Box>
                        <Typography 
                            variant="h5" 
                            fontWeight={800} 
                            display="flex" 
                            alignItems="center" 
                            gap={1}
                            sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                        >
                            <GppGoodIcon sx={{ fontSize: { xs: 24, sm: 28 } }} /> DSC Management
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Digital Signature Certificate — Expiry Tracking & Secure Password Vault
                        </Typography>
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1.5, 
                        width: { xs: '100%', sm: 'auto' },
                        '& > button': { flex: { xs: 1, sm: 'initial' } }
                    }}>
                        <CommonButton variant="outlined" startIcon={<DownloadIcon />}
                            onClick={() => dscService.exportCSV().catch(() => toast.error('Export failed'))}
                            sx={{ borderRadius: '12px', py: 1, px: 2 }}>
                            Export
                        </CommonButton>
                        <CommonButton variant="contained" startIcon={<AddIcon />} onClick={() => { setEditItem(null); setShowForm(true); }}
                            sx={{ borderRadius: '12px', py: 1, px: 2 }}>
                            Add DSC
                        </CommonButton>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ px: { xs: 2, sm: 3 } }}>
                {/* ── Stat Cards ── */}
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {statCards.map(c => (
                        <Grid key={c.label} size={{ xs: 6, sm: 3 }}>
                            <Card elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                                    <Avatar sx={{ 
                                        background: c.bg, 
                                        width: { xs: 36, sm: 48 }, 
                                        height: { xs: 36, sm: 48 }, 
                                        boxShadow: `0 4px 12px ${c.color}40` 
                                    }}>
                                        {React.cloneElement(c.icon as React.ReactElement, { sx: { fontSize: { xs: 18, sm: 24 } } })}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight={800} lineHeight={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>{c.value}</Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>{c.label}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* ── Expiring Soon Widget ── */}
                {(dashboard?.upcoming || []).length > 0 && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
                        <Typography variant="subtitle2" fontWeight={700} mb={1}>⏰ Expiring in Next 30 Days</Typography>
                        <Grid container spacing={1}>
                            {dashboard!.upcoming.map(d => {
                                const days = daysUntil(d.expiryDate);
                                return (
                                    <Grid key={d._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>{(d.clientId as { name?: string })?.name || d.holderName}</Typography>
                                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">{d.dscNumber}</Typography>
                                            </Box>
                                            <Chip label={days <= 0 ? 'Expired' : `${days}d`}
                                                size="small"
                                                sx={{ fontWeight: 800, bgcolor: days <= 0 ? '#fef2f2' : days <= 7 ? '#fff7ed' : '#fffbeb', color: days <= 0 ? '#ef4444' : days <= 7 ? '#ea580c' : '#d97706' }} />
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Alert>
                )}

                {/* ── Filters ── */}
                <Paper elevation={1} sx={{ 
                    borderRadius: 3, 
                    p: 2, 
                    mb: 2.5, 
                    display: 'flex', 
                    gap: 2, 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' } 
                }}>
                    <TextField size="small" placeholder="Search DSC, holder or client..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, sx: { borderRadius: '12px' } }}
                        sx={{ flex: 1 }} />
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: '12px' }}>
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="active">✅ Active</MenuItem>
                            <MenuItem value="expiring_soon">⚠️ Expiring Soon</MenuItem>
                            <MenuItem value="expired">❌ Expired</MenuItem>
                        </Select>
                    </FormControl>
                </Paper>

                {/* ── Table (Desktop) & Cards (Mobile) ── */}
                <Box sx={{ mb: 4 }}>
                    <Paper elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                            <GppGoodIcon fontSize="small" sx={{ color: '#667eea', mr: 1 }} />
                            <Typography fontWeight={700} color="#334155">DSC Records ({filtered.length})</Typography>
                        </Box>

                        {isLoading ? (
                            <Box textAlign="center" py={6}>
                                <CircularProgress size={28} sx={{ color: '#667eea' }} />
                                <Typography variant="body2" color="text.secondary" mt={1}>Loading records…</Typography>
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Box textAlign="center" py={8}>
                                <GppGoodIcon sx={{ fontSize: 48, color: '#10b981', opacity: 0.4, display: 'block', mx: 'auto', mb: 1 }} />
                                <Typography variant="h6" fontWeight={700} color="text.secondary">No DSC Records Found</Typography>
                                <Typography variant="body2" color="text.disabled" mt={0.5}>
                                    {search || statusFilter ? 'Try adjusting your filters.' : 'Add your first DSC record using the button above.'}
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                {/* Table View for tablet/desktop */}
                                <TableContainer sx={{ display: { xs: 'none', md: 'block' }, maxHeight: 540 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {['#', 'Client', 'Holder / DSC No.', 'Expiry Date', 'Days Left', 'Status', 'Class / Type', 'Password', 'Actions'].map(h => (
                                                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#475569', fontSize: '0.78rem', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filtered.map((dsc, i) => {
                                                const cfg  = STATUS_CONFIG[dsc.dscStatus] || STATUS_CONFIG.active;
                                                const days = daysUntil(dsc.expiryDate);
                                                const client = dsc.clientId as { name?: string; email?: string; panNumber?: string };
                                                return (
                                                    <TableRow key={dsc._id} hover sx={{ '&:hover': { bgcolor: '#fafbff' } }}>
                                                        <TableCell sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem' }}>{i + 1}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>{client?.name || '—'}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{client?.panNumber || client?.email || ''}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>{dsc.holderName}</Typography>
                                                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{dsc.dscNumber}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}
                                                                sx={{ color: days <= 0 ? '#ef4444' : days <= 7 ? '#ea580c' : days <= 30 ? '#d97706' : 'inherit' }}>
                                                                {new Date(dsc.expiryDate).toLocaleDateString('en-IN')}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={800}
                                                                sx={{ color: days <= 0 ? '#ef4444' : days <= 7 ? '#ea580c' : days <= 30 ? '#d97706' : '#10b981' }}>
                                                                {days <= 0 ? 'EXPIRED' : `${days}d`}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={cfg.label} size="small"
                                                                sx={{ color: cfg.color, bgcolor: cfg.bg, border: `1px solid ${cfg.border}`, fontWeight: 700, fontSize: '0.65rem' }} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">{dsc.dscClass || '—'}</Typography>
                                                            <br />
                                                            <Typography variant="caption" color="text.secondary">{dsc.dscType || ''}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <CommonButton size="small" variant="outlined" startIcon={<LockIcon sx={{ fontSize: '14px !important' }} />}
                                                                onClick={() => setPwdItem(dsc)}
                                                                sx={{ borderRadius: '8px', fontSize: '0.72rem', borderColor: '#fde68a', color: '#92400e', bgcolor: '#fffbeb', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                                View
                                                            </CommonButton>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box display="flex" gap={0.5}>
                                                                <Tooltip title="Edit">
                                                                    <IconButton size="small" onClick={() => { setEditItem(dsc); setShowForm(true); }} sx={{ color: '#667eea', '&:hover': { bgcolor: '#ede9fe' } }}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Audit Log">
                                                                    <IconButton size="small" onClick={() => setAuditItem(dsc)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
                                                                        <HistoryIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete">
                                                                    <IconButton size="small" onClick={() => setDeleteConfirm(dsc)} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Card View for Mobile/Tablet */}
                                <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1.5 }}>
                                    <Grid container spacing={2}>
                                        {filtered.map((dsc) => {
                                            const cfg = STATUS_CONFIG[dsc.dscStatus] || STATUS_CONFIG.active;
                                            const days = daysUntil(dsc.expiryDate);
                                            const client = dsc.clientId as { name?: string };
                                            return (
                                                <Grid key={dsc._id} size={{ xs: 12, sm: 6 }}>
                                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#ffffff' }}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700} color="#1e293b">{client?.name || '—'}</Typography>
                                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{dsc.holderName}</Typography>
                                                                <Typography variant="caption" color="text.secondary" fontFamily="monospace" sx={{ letterSpacing: 1 }}>{dsc.dscNumber}</Typography>
                                                            </Box>
                                                            <Chip label={cfg.label} size="small"
                                                                sx={{ color: cfg.color, bgcolor: cfg.bg, border: `1px solid ${cfg.border}`, fontWeight: 700, fontSize: '0.65rem' }} />
                                                        </Box>

                                                        <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" display="block">Expiry Date</Typography>
                                                                <Typography variant="body2" fontWeight={600}>{new Date(dsc.expiryDate).toLocaleDateString('en-IN')}</Typography>
                                                            </Box>
                                                            <Box textAlign="right">
                                                                <Typography variant="caption" color="text.secondary" display="block">Days Left</Typography>
                                                                <Typography variant="body2" fontWeight={800} color={days <= 0 ? '#ef4444' : days <= 7 ? '#ea580c' : '#10b981'}>
                                                                    {days <= 0 ? 'EXPIRED' : `${days}d`}
                                                                </Typography>
                                                            </Box>
                                                        </Box>

                                                        <Box display="flex" gap={1}>
                                                            <CommonButton size="small" fullWidth variant="outlined" startIcon={<LockIcon sx={{ fontSize: 16 }} />}
                                                                onClick={() => setPwdItem(dsc)}
                                                                sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: '#fde68a', color: '#92400e', bgcolor: '#fffbeb', '&:hover': { bgcolor: '#fef3c7' } }}>
                                                                View Pass
                                                            </CommonButton>
                                                            <IconButton size="small" onClick={() => { setEditItem(dsc); setShowForm(true); }} sx={{ color: '#667eea', bgcolor: '#f5f3ff' }}>
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => setAuditItem(dsc)} sx={{ color: '#64748b', bgcolor: '#f1f5f9' }}>
                                                                <HistoryIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => setDeleteConfirm(dsc)} sx={{ color: '#ef4444', bgcolor: '#fef2f2' }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* ── Modals ── */}
            {showForm && (
                <DSCFormModal initial={editItem} onClose={() => { setShowForm(false); setEditItem(null); }} onSuccess={invalidate} />
            )}
            {pwdItem && (
                <PasswordModal dscId={pwdItem._id} dscLabel={`${pwdItem.holderName} — ${pwdItem.dscNumber}`} onClose={() => setPwdItem(null)} />
            )}
            {auditItem && (
                <AuditModal dscId={auditItem._id} dscLabel={`${auditItem.holderName} — ${auditItem.dscNumber}`} onClose={() => setAuditItem(null)} />
            )}

            {/* ── Delete Confirm Dialog ── */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle fontWeight={700}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete DSC for <strong>{deleteConfirm?.holderName}</strong>?</Typography>
                    <Typography variant="body2" color="error" mt={1}>This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <CommonButton onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: '12px' }} variant="text">Cancel</CommonButton>
                    <CommonButton variant="contained" color="error" onClick={() => deleteMutation.mutate(deleteConfirm!._id)}
                        loading={deleteMutation.isPending} sx={{ borderRadius: '12px' }}>
                        Delete
                    </CommonButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DSCManagement;





