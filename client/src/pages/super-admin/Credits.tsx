import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Chip, Tooltip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
    DialogContent, DialogActions, LinearProgress, Alert, Snackbar,
    ToggleButtonGroup, ToggleButton, Avatar,
} from '@mui/material';
import {
    CreditCard, TrendingUp, Warning, Business,
    Search, FilterList, Refresh, AccountBalance, Star, ErrorOutline,
    BarChart, CheckCircle, SwapHoriz,
} from '@mui/icons-material';
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as ReTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreditRow {
    firmId: string;
    firmName: string;
    firmEmail: string;
    subdomain: string;
    planType: 'free' | 'pro' | 'enterprise';
    monthlyLimit: number;
    usedThisMonth: number;
    remainingCredits: number;
    totalUsed: number;
    isLow: boolean;
    lastUsedAt: string | null;
    resetDate: string;
}

interface Summary {
    totalFirms: number;
    totalCreditsUsed: number;
    totalCreditsAllotted: number;
    totalLifetimeUsed: number;
    topUsageFirms: CreditRow[];
    lowCreditFirms: CreditRow[];
    monthlyUsageChart: Array<{ month: string; used: number; txnCount: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLOR: Record<string, string> = {
    free:       '#94a3b8',
    pro:        '#667eea',
    enterprise: '#f59e0b',
};

const PLAN_BG: Record<string, string> = {
    free:       '#f1f5f9',
    pro:        '#eef2ff',
    enterprise: '#fffbeb',
};

const planLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

const UtilBar: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
    if (limit === -1) return (
        <Chip label="∞ Unlimited" size="small"
            sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.7rem' }} />
    );
    const pct   = Math.min(limit > 0 ? (used / limit) * 100 : 0, 100);
    const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
    return (
        <Box sx={{ minWidth: 110 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>{used}/{limit}</Typography>
                <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{Math.round(pct)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={pct}
                sx={{ height: 6, borderRadius: 3, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
        </Box>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ label, value, icon, color, subtitle }) => (
    <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: `${color}25`,
        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        flex: 1, minWidth: 160,
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" sx={{ color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                    {label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                    {value}
                </Typography>
                {subtitle && <Typography variant="caption" sx={{ color: '#aaa' }}>{subtitle}</Typography>}
            </Box>
        </Box>
    </Paper>
);

// ─── Add Credits Dialog ───────────────────────────────────────────────────────

const AddCreditsDialog: React.FC<{
    open: boolean;
    firm: CreditRow | null;
    onClose: () => void;
    onSuccess: () => void;
}> = ({ open, firm, onClose, onSuccess }) => {
    const [credits, setCredits] = useState('');
    const [reason,  setReason ] = useState('');
    const [plan,    setPlan   ] = useState('');
    const [loading, setLoading] = useState(false);
    const [tab,     setTab    ] = useState<'credits' | 'plan'>('credits');

    useEffect(() => {
        if (firm) { setCredits(''); setReason(''); setPlan(firm.planType); }
    }, [firm]);

    const handleSubmit = async () => {
        if (!firm) return;
        setLoading(true);
        try {
            if (tab === 'credits') {
                const delta = parseInt(credits);
                if (!credits || isNaN(delta)) return;
                await api.post('/super-admin/credits/update', {
                    firmId:       firm.firmId,
                    creditsToAdd: delta,
                    reason:       reason || undefined,
                });
            } else {
                await api.post('/super-admin/credits/set-plan', {
                    firmId:   firm.firmId,
                    planType: plan,
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Credit update failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard sx={{ color: '#667eea' }} />
                Manage Credits — {firm?.firmName}
            </DialogTitle>
            <DialogContent dividers>
                <ToggleButtonGroup value={tab} exclusive onChange={(_, v) => v && setTab(v)} size="small" sx={{ mb: 3 }}>
                    <ToggleButton value="credits" sx={{ px: 3 }}>Add / Remove Credits</ToggleButton>
                    <ToggleButton value="plan"    sx={{ px: 3 }}>Change Plan</ToggleButton>
                </ToggleButtonGroup>

                {tab === 'credits' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Current: <strong>{firm?.usedThisMonth}</strong> used / <strong>{firm?.monthlyLimit === -1 ? '∞' : firm?.monthlyLimit}</strong> limit
                            {' '}(<strong>{firm?.remainingCredits === -1 ? '∞' : firm?.remainingCredits}</strong> remaining)
                        </Alert>
                        <TextField
                            label="Credits to add (use negative to remove)"
                            type="number"
                            value={credits}
                            onChange={e => setCredits(e.target.value)}
                            placeholder="e.g. 50 or -10"
                            fullWidth
                            helperText="Positive = add credits, negative = reduce limit"
                            autoFocus
                        />
                        <TextField
                            label="Reason (optional)"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g. Bonus credits for Q1"
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            Changing the plan resets the monthly limit to the plan default.
                        </Alert>
                        <FormControl fullWidth>
                            <InputLabel>Plan Type</InputLabel>
                            <Select value={plan} onChange={e => setPlan(e.target.value)} label="Plan Type">
                                <MenuItem value="free">Free — 5 credits/month</MenuItem>
                                <MenuItem value="pro">Pro — 100 credits/month</MenuItem>
                                <MenuItem value="enterprise">Enterprise — Unlimited</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}
                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 2, px: 3 }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const AdminCreditsDashboard: React.FC = () => {
    const [rows,       setRows      ] = useState<CreditRow[]>([]);
    const [summary,    setSummary   ] = useState<Summary | null>(null);
    const [loading,    setLoading   ] = useState(true);
    const [search,     setSearch    ] = useState('');
    const [filter,     setFilter    ] = useState('');
    const [page,       setPage      ] = useState(1);
    const [total,      setTotal     ] = useState(0);
    const [selected,   setSelected  ] = useState<CreditRow | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbar,   setSnackbar  ] = useState({ open: false, msg: '', severity: 'success' as 'success' | 'error' });

    // Stable ref so showSnack doesn't need to be in useCallback deps
    const setSnackbarRef = useRef(setSnackbar);
    setSnackbarRef.current = setSnackbar;

    const showSnack = useCallback((msg: string, severity: 'success' | 'error' = 'success') => {
        setSnackbarRef.current({ open: true, msg, severity });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '30' });
            if (filter) params.set('filter', filter);
            if (search) params.set('search', search);

            const [listRes, summaryRes] = await Promise.all([
                api.get(`/super-admin/credits?${params}`),
                api.get('/super-admin/credits/summary'),
            ]);

            setRows(listRes.data.data || []);
            setTotal(listRes.data.total || 0);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Failed to load credit data:', error);
            showSnack('Failed to load credit data', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filter, search, showSnack]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleManage = (row: CreditRow) => { setSelected(row); setDialogOpen(true); };

    const filteredRows = rows.filter(r =>
        !search || r.firmName.toLowerCase().includes(search.toLowerCase()) || r.firmEmail.toLowerCase().includes(search.toLowerCase())
    );

    // Chart colors: current month is darker, rest are lighter
    const getBarColor = (index: number, total: number) =>
        index === total - 1 ? '#667eea' : '#c7d2fe';

    return (
        <Box sx={{ p: 3 }}>

            {/* ─── Header ─── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3, p: 3, mb: 3, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CreditCard sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Credit Dashboard</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            Monitor &amp; manage bank statement credits across all firms
                        </Typography>
                    </Box>
                </Box>
                <Button startIcon={<Refresh />} onClick={loadData} variant="outlined"
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)' } }}>
                    Refresh
                </Button>
            </Box>

            {/* ─── Summary Cards ─── */}
            {summary && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                        <StatCard label="Total Firms"         value={summary.totalFirms}          icon={<Business />}    color="#667eea" />
                        <StatCard label="Used This Month"     value={summary.totalCreditsUsed}     icon={<TrendingUp />}  color="#ef4444" subtitle="statements processed" />
                        <StatCard label="Total Allotted"      value={summary.totalCreditsAllotted} icon={<CreditCard />}  color="#22c55e" subtitle="monthly capacity" />
                        <StatCard label="Lifetime Processed"  value={summary.totalLifetimeUsed}    icon={<BarChart />}    color="#f59e0b" />
                        <StatCard label="Low Credit Alerts"   value={summary.lowCreditFirms.length} icon={<Warning />}   color="#f97316" subtitle="< 5 credits remaining" />
                    </Box>
                </motion.div>
            )}

            {/* ─── Chart + Quick Lists ─── */}
            {summary && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr 1fr' }, gap: 2, mb: 3 }}>

                    {/* Monthly Usage Chart */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eee' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>📊 Monthly Credit Usage</Typography>
                        <ResponsiveContainer width="100%" height={180}>
                            <ReBarChart data={summary.monthlyUsageChart}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <ReTooltip
                                    contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 12 }}
                                />
                                {/* radius as single number for recharts v3 compatibility */}
                                <Bar dataKey="used" name="Credits Used" radius={4}>
                                    {summary.monthlyUsageChart.map((_, i) => (
                                        <Cell key={`cell-${i}`} fill={getBarColor(i, summary.monthlyUsageChart.length)} />
                                    ))}
                                </Bar>
                            </ReBarChart>
                        </ResponsiveContainer>
                    </Paper>

                    {/* Top Usage Firms */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #eee' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Star sx={{ fontSize: 18, color: '#f59e0b' }} /> Top Usage
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {summary.topUsageFirms.map((f, i) => (
                                <Box key={f.firmId.toString()} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#667eea', fontWeight: 700 }}>
                                        {i + 1}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {f.firmName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#888' }}>{f.usedThisMonth} used</Typography>
                                    </Box>
                                    <Chip label={planLabel(f.planType)} size="small"
                                        sx={{ fontSize: '0.65rem', height: 18, bgcolor: PLAN_BG[f.planType], color: PLAN_COLOR[f.planType] }} />
                                </Box>
                            ))}
                            {summary.topUsageFirms.length === 0 && (
                                <Typography variant="body2" sx={{ color: '#aaa', textAlign: 'center', mt: 2 }}>No data yet</Typography>
                            )}
                        </Box>
                    </Paper>

                    {/* Low Credit Firms */}
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #fecaca', background: '#fff8f8' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#ef4444' }}>
                            <ErrorOutline sx={{ fontSize: 18 }} /> Low Credits
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {summary.lowCreditFirms.map(f => (
                                <Box key={f.firmId.toString()} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1.5, background: '#fff', border: '1px solid #fde8e8' }}>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {f.firmName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700 }}>
                                            {f.remainingCredits} left
                                        </Typography>
                                    </Box>
                                    <Button size="small" variant="outlined" color="error"
                                        sx={{ fontSize: '0.65rem', px: 1, py: 0.3, minWidth: 'auto' }}
                                        onClick={() => handleManage({ ...f, firmEmail: '', totalUsed: 0, isLow: true, lastUsedAt: null, resetDate: '' })}>
                                        Add
                                    </Button>
                                </Box>
                            ))}
                            {summary.lowCreditFirms.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 2 }}>
                                    <CheckCircle sx={{ color: '#22c55e', mb: 0.5 }} />
                                    <Typography variant="caption" sx={{ color: '#22c55e', display: 'block' }}>All firms have sufficient credits</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* ─── Firms Table ─── */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', overflow: 'hidden' }}>

                {/* Toolbar */}
                <Box sx={{
                    p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)',
                    borderBottom: '1px solid #eee',
                }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            size="small" placeholder="Search firm name or email..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <Search sx={{ fontSize: 18, color: '#aaa', mr: 0.5 }} /> }}
                            sx={{ width: 240, background: '#fff', borderRadius: 2 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160, background: '#fff', borderRadius: 2 }}>
                            <InputLabel>Filter</InputLabel>
                            <Select value={filter} onChange={e => setFilter(e.target.value)} label="Filter"
                                startAdornment={<FilterList sx={{ fontSize: 16, ml: 0.5, mr: -0.5, color: '#aaa' }} />}>
                                <MenuItem value="">All Firms</MenuItem>
                                <MenuItem value="low">🔴 Low Credits (&lt; 5)</MenuItem>
                                <MenuItem value="high">🟡 High Usage (&gt; 80%)</MenuItem>
                                <MenuItem value="free">Free Plan</MenuItem>
                                <MenuItem value="pro">Pro Plan</MenuItem>
                            </Select>
                        </FormControl>
                        <Chip label={`${total} firms total`} size="small" sx={{ background: '#fff' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                        Showing {filteredRows.length} of {total} firms
                    </Typography>
                </Box>

                {loading && <LinearProgress />}

                <TableContainer sx={{ maxHeight: 520, overflowY: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['Firm', 'Plan', 'Used / Limit', 'Remaining', 'Total Used', 'Status', 'Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, background: '#f8f9ff', fontSize: '0.82rem' }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRows.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#bbb' }}>
                                        <AccountBalance sx={{ fontSize: 48, mb: 1 }} />
                                        <Typography>No firms found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRows.map((row, idx) => (
                                <TableRow key={row.firmId.toString()}
                                    sx={{ background: row.isLow ? 'rgba(239,68,68,0.03)' : idx % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { background: 'rgba(102,126,234,0.04)' } }}>

                                    {/* Firm */}
                                    <TableCell sx={{ maxWidth: 200 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea', fontSize: 13, fontWeight: 700 }}>
                                                {row.firmName.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {row.firmName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#888', fontSize: '0.7rem' }}>
                                                    {row.firmEmail || row.subdomain}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Plan */}
                                    <TableCell>
                                        <Chip label={planLabel(row.planType)} size="small"
                                            sx={{ background: PLAN_BG[row.planType], color: PLAN_COLOR[row.planType], fontWeight: 700, fontSize: '0.72rem', height: 22 }} />
                                    </TableCell>

                                    {/* Used / Limit */}
                                    <TableCell sx={{ minWidth: 130 }}>
                                        <UtilBar used={row.usedThisMonth} limit={row.monthlyLimit} />
                                    </TableCell>

                                    {/* Remaining */}
                                    <TableCell>
                                        {row.monthlyLimit === -1 ? (
                                            <Chip label="∞" size="small" sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
                                        ) : (
                                            <Typography variant="body2" sx={{
                                                fontWeight: 700, fontSize: '0.85rem',
                                                color: row.remainingCredits < 5 ? '#ef4444' : row.remainingCredits < 20 ? '#f59e0b' : '#22c55e',
                                            }}>
                                                {row.remainingCredits}
                                                {row.remainingCredits < 5 && <Warning sx={{ fontSize: 13, ml: 0.5, verticalAlign: 'middle' }} />}
                                            </Typography>
                                        )}
                                    </TableCell>

                                    {/* Total Used */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem', color: '#555' }}>
                                            {row.totalUsed || 0}
                                        </Typography>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        {row.isLow ? (
                                            <Chip label="⚠ LOW" size="small" sx={{ background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                                        ) : (
                                            <Chip label="✓ OK" size="small" sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                                        )}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell>
                                        <Tooltip title="Manage Credits">
                                            <Button size="small" variant="outlined"
                                                startIcon={<SwapHoriz sx={{ fontSize: 14 }} />}
                                                onClick={() => handleManage(row)}
                                                sx={{ fontSize: '0.72rem', borderRadius: 2, borderColor: '#667eea', color: '#667eea', '&:hover': { background: '#f0f4ff' } }}>
                                                Manage
                                            </Button>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ p: 1.5, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>Page {page}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" disabled={page === 1}        onClick={() => setPage(p => p - 1)}>← Prev</Button>
                        <Button size="small" disabled={rows.length < 30}  onClick={() => setPage(p => p + 1)}>Next →</Button>
                    </Box>
                </Box>
            </Paper>

            {/* ─── Manage Dialog ─── */}
            <AddCreditsDialog
                open={dialogOpen}
                firm={selected}
                onClose={() => setDialogOpen(false)}
                onSuccess={() => { showSnack('Credits updated successfully!'); loadData(); }}
            />

            {/* ─── Snackbar ─── */}
            <Snackbar open={snackbar.open} autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}
                    onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                    {snackbar.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminCreditsDashboard;
