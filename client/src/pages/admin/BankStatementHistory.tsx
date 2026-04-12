import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Chip, TextField, Select, MenuItem,
    FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, LinearProgress, Avatar, Tooltip, IconButton,
    Alert, Snackbar,
} from '@mui/material';
import {
    AccountBalance, Download, Delete, Refresh, Search, FilterList,
    CheckCircle, Error as ErrorIcon, HourglassEmpty, CloudUpload,
    Psychology, Visibility, TrendingDown, TrendingUp, BarChart,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { bankStatementApi, type BankStatementRecord } from '../../services/bankStatementApi';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG = {
    completed:  { label: 'Completed', color: '#22c55e', bg: '#f0fdf4', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    processing: { label: 'Processing', color: '#f59e0b', bg: '#fffbeb', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    uploaded:   { label: 'Queued', color: '#667eea', bg: '#eef2ff', icon: <CloudUpload sx={{ fontSize: 14 }} /> },
    failed:     { label: 'Failed', color: '#ef4444', bg: '#fef2f2', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
};

const METHOD_CONFIG = {
    'pdf-parse': { label: 'Rule-based', color: '#667eea' },
    ocr:         { label: 'OCR', color: '#f59e0b' },
    ai:          { label: 'Gemini AI', color: '#7c3aed' },
    manual:      { label: 'Manual', color: '#64748b' },
};

const ConfBadge: React.FC<{ value: number }> = ({ value }) => {
    const color = value >= 85 ? '#22c55e' : value >= 65 ? '#f59e0b' : '#ef4444';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color }}>{value}%</Typography>
            </Box>
        </Box>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BankStatementHistory: React.FC = () => {
    const [rows,    setRows   ] = useState<BankStatementRecord[]>([]);
    const [total,   setTotal  ] = useState(0);
    const [page,    setPage   ] = useState(1);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [filter,  setFilter ] = useState({ clientId: '', status: '' });
    const [search,  setSearch ] = useState('');
    const [snack,   setSnack  ] = useState({ open: false, msg: '', sev: 'success' as 'success' | 'error' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await bankStatementApi.listAll({
                clientId: filter.clientId || undefined,
                status:   filter.status   || undefined,
                page,
                limit: 15,
            });
            setRows(res.data);
            setTotal(res.total);
        } catch {
            setSnack({ open: true, msg: 'Failed to load history', sev: 'error' });
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        adminService.getClients().then(d => {
            interface CR { clients: Client[] }
            const raw = d as unknown as Client[] | CR;
            setClients(Array.isArray(raw) ? raw : (raw as CR).clients || []);
        }).catch(() => {});
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this statement? This cannot be undone.')) return;
        try {
            await bankStatementApi.deleteStatement(id);
            setSnack({ open: true, msg: 'Statement deleted', sev: 'success' });
            load();
        } catch {
            setSnack({ open: true, msg: 'Delete failed', sev: 'error' });
        }
    };

    const visible = search
        ? rows.filter(r =>
            r.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
            (r.bankName || '').toLowerCase().includes(search.toLowerCase())
        )
        : rows;

    // ── Summary stats ──────────────────────────────────────────────────────────
    const stats = {
        total:      rows.length,
        completed:  rows.filter(r => r.status === 'completed').length,
        totalDebit: rows.reduce((s, r) => s + (r.totalDebit || 0), 0),
        totalCredit:rows.reduce((s, r) => s + (r.totalCredit || 0), 0),
    };

    return (
        <Box sx={{ p: 3 }}>

            {/* Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 50%, #7c3aed 100%)',
                borderRadius: 3, p: 3, mb: 3, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: 2, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AccountBalance sx={{ fontSize: 30 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>Statement History</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>All past bank statement uploads for your firm</Typography>
                    </Box>
                </Box>
                <Button startIcon={<Refresh />} onClick={load} variant="outlined"
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)' } }}>
                    Refresh
                </Button>
            </Box>

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Loaded', value: total, icon: <BarChart />, color: '#667eea' },
                        { label: 'Completed', value: stats.completed, icon: <CheckCircle />, color: '#22c55e' },
                        { label: 'Total Debit', value: fmt(stats.totalDebit), icon: <TrendingDown />, color: '#ef4444' },
                        { label: 'Total Credit', value: fmt(stats.totalCredit), icon: <TrendingUp />, color: '#22c55e' },
                    ].map(s => (
                        <Paper key={s.label} elevation={0} sx={{
                            p: 2, borderRadius: 3, border: `1px solid ${s.color}25`,
                            background: `linear-gradient(135deg, ${s.color}08, ${s.color}03)`,
                            display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 150,
                        }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                {s.icon}
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#111', lineHeight: 1.2, fontSize: '1rem' }}>{s.value}</Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            </motion.div>

            {/* Filters */}
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', overflow: 'hidden' }}>
                <Box sx={{
                    p: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)',
                    borderBottom: '1px solid #eee',
                }}>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Search file or bank..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <Search sx={{ fontSize: 18, color: '#aaa', mr: 0.5 }} /> }}
                            sx={{ width: 220, background: '#fff', borderRadius: 2 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 160, background: '#fff', borderRadius: 2 }}>
                            <InputLabel>Client</InputLabel>
                            <Select value={filter.clientId} onChange={e => { setFilter(f => ({ ...f, clientId: e.target.value })); setPage(1); }} label="Client"
                                startAdornment={<FilterList sx={{ fontSize: 16, ml: 0.5, mr: -0.5, color: '#aaa' }} />}>
                                <MenuItem value="">All Clients</MenuItem>
                                {clients.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 140, background: '#fff', borderRadius: 2 }}>
                            <InputLabel>Status</InputLabel>
                            <Select value={filter.status} onChange={e => { setFilter(f => ({ ...f, status: e.target.value })); setPage(1); }} label="Status">
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="completed">✅ Completed</MenuItem>
                                <MenuItem value="processing">⏳ Processing</MenuItem>
                                <MenuItem value="failed">❌ Failed</MenuItem>
                            </Select>
                        </FormControl>
                        <Chip label={`${total} total`} size="small" sx={{ background: '#fff' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#888' }}>
                        Showing {visible.length} of {total}
                    </Typography>
                </Box>

                {loading && <LinearProgress />}

                <TableContainer sx={{ maxHeight: 540 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['File', 'Bank / Account', 'Client', 'Transactions', 'Debit / Credit', 'Method', 'Confidence', 'Status', 'Date', 'Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, background: '#f8f9ff', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 8, color: '#bbb' }}>
                                        <AccountBalance sx={{ fontSize: 54, mb: 1, opacity: 0.3 }} />
                                        <Typography>No statements found. Upload your first file.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : visible.map((row, idx) => {
                                const sc = STATUS_CONFIG[row.status] || STATUS_CONFIG.uploaded;
                                const mc = METHOD_CONFIG[row.processingMethod] || { label: 'Unknown', color: '#888' };
                                return (
                                    <TableRow key={row._id} sx={{ background: idx % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { background: 'rgba(102,126,234,0.04)' } }}>

                                        {/* File */}
                                        <TableCell sx={{ maxWidth: 180 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: '#eef2ff', color: '#667eea', fontSize: 11 }}>
                                                    📄
                                                </Avatar>
                                                <Tooltip title={row.originalFileName}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                                                        {row.originalFileName}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>

                                        {/* Bank */}
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{row.bankName || '—'}</Typography>
                                            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.68rem' }}>{row.accountNumber || ''}</Typography>
                                        </TableCell>

                                        {/* Client */}
                                        <TableCell>
                                            <Typography variant="caption">{row.statementPeriod || '—'}</Typography>
                                        </TableCell>

                                        {/* Transactions */}
                                        <TableCell>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>{row.transactionCount || 0}</Typography>
                                        </TableCell>

                                        {/* Debit / Credit */}
                                        <TableCell sx={{ minWidth: 120 }}>
                                            <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', fontWeight: 600 }}>{fmt(row.totalDebit || 0)}</Typography>
                                            <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600 }}>{fmt(row.totalCredit || 0)}</Typography>
                                        </TableCell>

                                        {/* Method */}
                                        <TableCell>
                                            <Chip label={mc.label} size="small"
                                                sx={{ background: `${mc.color}18`, color: mc.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                                                icon={<Psychology sx={{ fontSize: '12px !important', color: `${mc.color} !important` }} />} />
                                        </TableCell>

                                        {/* Confidence */}
                                        <TableCell>
                                            {row.status === 'completed' ? <ConfBadge value={row.confidence || 0} /> : <span style={{ color: '#bbb' }}>—</span>}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <Chip
                                                label={sc.label}
                                                size="small"
                                                icon={sc.icon}
                                                sx={{ background: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                            />
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#666' }}>
                                            {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {row.status === 'completed' && (
                                                <Tooltip title="Download Excel">
                                                    <IconButton size="small" onClick={() => bankStatementApi.downloadExcel(row._id)}
                                                        sx={{ color: '#22c55e', '&:hover': { background: '#f0fdf4' } }}>
                                                        <Download fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="View">
                                                <IconButton size="small" sx={{ color: '#667eea', '&:hover': { background: '#eef2ff' } }}>
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}
                                                    sx={{ '&:hover': { background: '#fef2f2' } }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ p: 1.5, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbff' }}>
                    <Typography variant="caption" sx={{ color: '#888' }}>Page {page}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                        <Button size="small" disabled={rows.length < 15} onClick={() => setPage(p => p + 1)}>Next →</Button>
                    </Box>
                </Box>
            </Paper>

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.sev} sx={{ borderRadius: 2 }} onClose={() => setSnack(s => ({ ...s, open: false }))}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BankStatementHistory;
