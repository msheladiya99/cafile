import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Alert, AlertTitle,
    CircularProgress, Chip, Tooltip, IconButton, TextField,
    Select, MenuItem, FormControl, InputLabel, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
    CloudUpload, Download, Description, CheckCircle, Warning,
    Delete, Edit, Save, Cancel,
    AccountBalance, TrendingDown, TrendingUp, SwapHoriz,
    Refresh, ExpandMore, ExpandLess,
    ArrowUpward, ArrowDownward, FilterList,
    AutoFixHigh, Psychology, Visibility, ErrorOutline,
    CreditCard,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { bankStatementApi } from '../../services/bankStatementApi';
import type { AutoFixSuggestion, CreditBalance, TransactionRow, ProcessResponse, ProgressEvent } from '../../services/bankStatementApi';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

type ProcessStep = 'upload' | 'processing' | 'preview' | 'done';

const CATEGORIES = [
    'Salary', 'Income', 'Transfer', 'UPI Transfer', 'NEFT Transfer', 'RTGS Transfer',
    'IMPS Transfer', 'EMI/Loan', 'Tax/GST', 'Insurance', 'Investments', 'Rent',
    'Food & Dining', 'Travel', 'Shopping', 'Medical', 'Education', 'Utility Bills',
    'Fuel', 'ATM', 'Cash', 'Cheque', 'Savings/FD', 'Miscellaneous',
];

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string; value: string; color: string; icon: React.ReactNode; subtitle?: string;
}> = ({ label, value, color, icon, subtitle }) => (
    <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: `${color}30`,
        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        display: 'flex', alignItems: 'center', gap: 2, minWidth: 170,
    }}>
        <Box sx={{ width: 46, height: 46, borderRadius: 2, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
                {value}
            </Typography>
            {subtitle && <Typography variant="caption" sx={{ color: '#888' }}>{subtitle}</Typography>}
        </Box>
    </Paper>
);

const ConfidenceBar: React.FC<{ confidence: number; ocrUsed?: boolean; method?: string }> = ({ confidence, ocrUsed, method }) => {
    const color = confidence >= 80 ? '#22c55e' : confidence >= 50 ? '#f59e0b' : '#ef4444';
    const label = confidence >= 80 ? 'High Confidence' : confidence >= 50 ? 'Medium — Verify' : 'Low — Review Required';
    return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #eee', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#444' }}>
                    AI Extraction Confidence
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {ocrUsed && <Chip label="OCR Used" size="small" icon={<Visibility sx={{ fontSize: 12 }} />} sx={{ fontSize: '0.65rem', height: 20, background: '#f0f4ff', color: '#667eea' }} />}
                    {method && <Chip label={method === 'ai' ? 'Gemini AI' : method === 'ocr' ? 'Vision OCR' : 'Rule-based'} size="small" icon={<Psychology sx={{ fontSize: 12 }} />} sx={{ fontSize: '0.65rem', height: 20, background: '#f8f0ff', color: '#764ba2' }} />}
                    <Typography variant="caption" sx={{ fontWeight: 700, color }}>
                        {confidence}% — {label}
                    </Typography>
                </Box>
            </Box>
            <LinearProgress
                variant="determinate"
                value={confidence}
                sx={{
                    height: 8, borderRadius: 4,
                    bgcolor: '#eee',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                }}
            />
        </Paper>
    );
};

// ─── Live SSE Progress Bar ────────────────────────────────────────────────────

const STEP_ICONS: Record<string, string> = {
    fetch:    '📥',
    parse:    '📄',
    ocr:      '👁️',
    rule:     '📊',
    ai:       '🧠',
    validate: '🔍',
    saving:   '💾',
    done:     '✅',
    error:    '❌',
};

const LiveProgressBar: React.FC<{ event: ProgressEvent | null }> = ({ event }) => {
    const pct     = event?.progress ?? 0;
    const label   = event?.label   ?? 'Starting AI engine...';
    const step    = event?.step    ?? 'fetch';
    const color   = step === 'error' ? '#ef4444' : step === 'done' ? '#22c55e' : '#667eea';
    const icon    = STEP_ICONS[step] || '⚙️';

    return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress
                    variant="determinate"
                    value={pct}
                    size={90}
                    thickness={4}
                    sx={{ color }}
                />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {icon}
                </Box>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mb: 2 }}>
                {pct < 100 ? `${pct}% complete` : step === 'done' ? 'Processing complete!' : 'Finishing...'}
            </Typography>
            <Box sx={{ maxWidth: 320, mx: 'auto' }}>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4, transition: 'transform 0.4s ease' } }}
                />
            </Box>
        </Box>
    );
};


// ─── Main Component ───────────────────────────────────────────────────────────

export const BankStatementTool: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step,           setStep          ] = useState<ProcessStep>('upload');
    const [clients,        setClients       ] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [dragOver,       setDragOver      ] = useState(false);
    const [selectedFile,   setSelectedFile  ] = useState<File | null>(null);
    const [result,         setResult        ] = useState<ProcessResponse | null>(null);
    const [rows,           setRows          ] = useState<TransactionRow[]>([]);
    const [statementId,    setStatementId   ] = useState('');
    const [editingRow,     setEditingRow    ] = useState<number | null>(null);
    const [editBuffer,     setEditBuffer    ] = useState<TransactionRow | null>(null);
    const [filter,         setFilter        ] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortCol,        setSortCol       ] = useState<keyof TransactionRow | ''>('');
    const [sortDir,        setSortDir       ] = useState<'asc' | 'desc'>('asc');
    const [showErrors,     setShowErrors    ] = useState(true);
    const [savingRows,     setSavingRows    ] = useState(false);
    const [reprocessing,   setReprocessing  ] = useState(false);
    const [creditInfo,     setCreditInfo    ] = useState<CreditBalance | null>(null);
    const [fixSuggestions, setFixSuggestions] = useState<AutoFixSuggestion[]>([]);
    const [showFixDialog,  setShowFixDialog ] = useState(false);
    const [applyingFixes,  setApplyingFixes ] = useState(false);
    const [sseProgress,    setSseProgress   ] = useState<ProgressEvent | null>(null);
    const [snackbar,       setSnackbar      ] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, msg: '', severity: 'info' });

    const showSnackRef = useRef<((msg: string, severity?: 'success' | 'error' | 'info' | 'warning') => void) | null>(null);
    const showSnack = useCallback((msg: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setSnackbar({ open: true, msg, severity });
    }, [setSnackbar]);
    showSnackRef.current = showSnack;

    // ── Load clients + credit balance ─────────────────────────────────────────

    useEffect(() => {
        adminService.getClients().then(data => {
            interface ClientsResponse { clients: Client[] }
            const responseData = data as unknown as Client[] | ClientsResponse;
            setClients(Array.isArray(responseData) ? responseData : (responseData as ClientsResponse).clients || []);
        }).catch(() => showSnackRef.current?.('Failed to load clients', 'error'));

        bankStatementApi.getCreditBalance().then(setCreditInfo).catch(() => {});
    }, []);

    // ── Drag & Drop ───────────────────────────────────────────────────────────

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) setSelectedFile(f);
    }, []);

    // ── Polling ───────────────────────────────────────────────────────────────

    const pollStatus = (id: string) => {
        const interval = setInterval(async () => {
            try {
                const data = await bankStatementApi.getStatement(id);
                if (data.status === 'completed') {
                    clearInterval(interval);
                    const asProcessResponse = {
                        ...data,
                        id:           data._id,
                        rows:         data.extractedRows,
                        extractedRows: data.extractedRows,
                    } as unknown as ProcessResponse;
                    setResult(asProcessResponse);
                    setRows(data.extractedRows || []);
                    setStatementId(id);
                    setStep('preview');

                    // Compute suggestions from flagged rows
                    const suggestable = (data.extractedRows || [])
                        .filter(r => r.hasError && !r.autoFixed)
                        .map((r, i) => ({ rowIndex: i, field: 'balance' as const, currentValue: r.balance, suggestedValue: r.balance, reason: r.errorMessage || '', confidence: 70 }));
                    if (suggestable.length > 0) setFixSuggestions(suggestable);

                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    showSnack(data.processingErrors?.join(', ') || 'Processing failed', 'error');
                    setStep('upload');
                }
            } catch { /* keep polling */ }
        }, 2500);
    };

    // ── Process File ──────────────────────────────────────────────────────────

    const handleProcess = async () => {
        if (!selectedFile || !selectedClient) {
            showSnack('Please select a client and a file.', 'error');
            return;
        }

        if (creditInfo && creditInfo.remaining === 0 && creditInfo.monthlyLimit !== -1) {
            showSnack(`Credit limit reached (${creditInfo.usedThisMonth}/${creditInfo.monthlyLimit} this month). Please upgrade your plan.`, 'error');
            return;
        }

        setStep('processing');
        setSseProgress(null);
        let eventSource: EventSource | null = null;
        try {
            const data = await bankStatementApi.uploadAndProcess(selectedFile, selectedClient);
            setStatementId(data.id);

            // Subscribe to SSE progress immediately
            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
            eventSource = bankStatementApi.subscribeProgress(data.id, token, (evt: ProgressEvent) => {
                setSseProgress(evt);
                if (evt.step === 'done' || evt.step === 'error') {
                    eventSource?.close();
                    // Load final data from server
                    bankStatementApi.getStatement(data.id).then(stmt => {
                        if (stmt.status === 'completed') {
                            const asProcessResponse = { ...stmt, id: stmt._id, rows: stmt.extractedRows, extractedRows: stmt.extractedRows } as unknown as ProcessResponse;
                            setResult(asProcessResponse);
                            setRows(stmt.extractedRows || []);
                            setStep('preview');
                            const suggestable = (stmt.extractedRows || [])
                                .filter(r => r.hasError && !r.autoFixed)
                                .map((r, i) => ({ rowIndex: i, field: 'balance' as const, currentValue: r.balance, suggestedValue: r.balance, reason: r.errorMessage || '', confidence: 70 }));
                            if (suggestable.length > 0) setFixSuggestions(suggestable);
                        } else {
                            showSnack(stmt.processingErrors?.join(', ') || 'Processing failed', 'error');
                            setStep('upload');
                        }
                    }).catch(() => { showSnack('Failed to load results', 'error'); setStep('upload'); });
                }
            });
            eventSource.onerror = () => {
                // SSE failed — fall back to polling
                eventSource?.close();
                pollStatus(data.id);
            };

            // Immediate complete handling (sync parse)
            if (data.status === 'completed') {
                eventSource.close();
                setResult(data);
                setRows(data.rows || data.extractedRows || []);
                setStep('preview');
            } else if (data.status === 'failed') {
                eventSource.close();
                showSnack('Upload processing failed', 'error');
                setStep('upload');
            }
        } catch (err: unknown) {
            eventSource?.close();
            const errorMsg =
                err !== null && typeof err === 'object' && 'response' in err
                    ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Upload failed')
                    : 'Upload failed';
            showSnack(errorMsg, 'error');
            setStep('upload');
        }
    };

    // ── Row Editing ───────────────────────────────────────────────────────────

    const startEdit = (idx: number) => { setEditingRow(idx); setEditBuffer({ ...rows[idx] }); };
    const saveEdit  = () => {
        if (editingRow === null || !editBuffer) return;
        const updated = [...rows];
        updated[editingRow] = { ...editBuffer, hasError: false };
        setRows(updated);
        setEditingRow(null);
        setEditBuffer(null);
    };
    const cancelEdit = () => { setEditingRow(null); setEditBuffer(null); };
    const deleteRow  = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

    // ── Save to Server ────────────────────────────────────────────────────────

    const handleSaveRows = async () => {
        setSavingRows(true);
        try {
            await bankStatementApi.updateRows(statementId, rows);
            showSnack('Changes saved successfully', 'success');
        } catch {
            showSnack('Failed to save changes', 'error');
        } finally {
            setSavingRows(false);
        }
    };

    // ── Reprocess with AI ─────────────────────────────────────────────────────

    const handleReprocessAI = async () => {
        if (!statementId) return;
        setReprocessing(true);
        try {
            await bankStatementApi.reprocess(statementId);
            showSnack('AI analysis started in background...', 'info');
            setStep('processing');
            pollStatus(statementId);
        } catch {
            showSnack('Failed to start AI analysis', 'error');
        } finally {
            setReprocessing(false);
        }
    };

    // ── Apply Auto-Fixes ──────────────────────────────────────────────────────

    const handleApplyFixes = async () => {
        setApplyingFixes(true);
        try {
            const res = await bankStatementApi.applyFixes(statementId, fixSuggestions);
            setRows(res.rows);
            setFixSuggestions([]);
            setShowFixDialog(false);
            showSnack(`${fixSuggestions.length} fix(es) applied!`, 'success');
        } catch {
            showSnack('Failed to apply fixes', 'error');
        } finally {
            setApplyingFixes(false);
        }
    };

    // ── Sorting + Filtering ───────────────────────────────────────────────────

    const filteredRows = rows.filter(row => {
        const matchText = !filter || [row.date, row.description, row.category].join(' ').toLowerCase().includes(filter.toLowerCase());
        const matchCat  = !categoryFilter || row.category === categoryFilter;
        return matchText && matchCat;
    });

    const sortedRows = [...filteredRows].sort((a, b) => {
        if (!sortCol) return 0;
        const aVal = a[sortCol] ?? '', bVal = b[sortCol] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number')
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
    });

    const totalDebit  = rows.reduce((s, r) => s + (r.debit  || 0), 0);
    const totalCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
    const errorRows   = rows.filter(r => r.hasError).length;
    const suspRows    = rows.filter(r => r.suspicious).length;

    const handleSort = (col: keyof TransactionRow) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const handleReset = () => {
        setStep('upload'); setSelectedFile(null); setResult(null);
        setRows([]); setStatementId(''); setFilter(''); setCategoryFilter(''); setFixSuggestions([]);
    };

    const SortIcon = ({ col }: { col: keyof TransactionRow }) => {
        if (sortCol !== col) return <FilterList sx={{ fontSize: 14, opacity: 0.4 }} />;
        return sortDir === 'asc' ? <ArrowUpward sx={{ fontSize: 14 }} /> : <ArrowDownward sx={{ fontSize: 14 }} />;
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <Box sx={{ mb: 4 }}>

            {/* ─── Page Header ─── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3, p: 3, mb: 3, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalance sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>Bank Statement → Excel</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            AI-powered • OCR-enabled • CA-grade • HDFC, SBI, ICICI, Axis & more
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Credit badge */}
                    {creditInfo && (
                        <Chip
                            icon={<CreditCard sx={{ fontSize: 14 }} />}
                            label={creditInfo.monthlyLimit === -1
                                ? 'Unlimited'
                                : `${creditInfo.remaining} credits left`}
                            sx={{
                                background: creditInfo.remaining === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.15)',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
                                fontWeight: 600, fontSize: '0.75rem',
                            }}
                        />
                    )}
                    {step !== 'upload' && (
                        <Button startIcon={<Refresh />} onClick={handleReset} variant="outlined"
                            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#fff', background: 'rgba(255,255,255,0.1)' } }}>
                            New Statement
                        </Button>
                    )}
                </Box>
            </Box>

            <AnimatePresence mode="wait">

                {/* ─── STEP 1: Upload ─── */}
                {step === 'upload' && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>

                            {/* Client Select */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eee' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccountBalance sx={{ color: '#667eea' }} /> Step 1 — Select Client
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Select Client *</InputLabel>
                                    <Select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} label="Select Client *">
                                        {clients.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                                        {clients.length === 0 && <MenuItem disabled value="">Loading clients...</MenuItem>}
                                    </Select>
                                </FormControl>
                            </Paper>

                            {/* File Upload */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eee' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Description sx={{ color: '#667eea' }} /> Step 2 — Upload Statement
                                </Typography>
                                <Box
                                    onDrop={handleDrop}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        border: `2px dashed ${dragOver ? '#667eea' : '#ddd'}`,
                                        borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
                                        transition: 'all 0.2s', background: dragOver ? 'rgba(102,126,234,0.04)' : '#fafafa',
                                        '&:hover': { borderColor: '#667eea', background: 'rgba(102,126,234,0.04)' },
                                    }}
                                >
                                    <input ref={fileInputRef} type="file" hidden accept=".pdf,.csv,.jpg,.jpeg,.png"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
                                    {selectedFile ? (
                                        <Box>
                                            <CheckCircle sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedFile.name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#888' }}>
                                                {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <CloudUpload sx={{ fontSize: 48, color: '#667eea', mb: 1 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>Drop file here or click to browse</Typography>
                                            <Typography variant="caption" sx={{ color: '#888' }}>
                                                Supports PDF, CSV, JPG, PNG · Scanned PDFs supported via OCR · Max 30MB
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Box>

                        {/* Supported banks */}
                        <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: 3, border: '1px solid #eee', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#444' }}>✅ Supported Banks & Formats</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {['HDFC Bank', 'SBI', 'ICICI', 'Axis Bank', 'Kotak', 'PNB', 'Bank of Baroda', 'Yes Bank', 'IndusInd', 'Canara', 'Union Bank', 'IDBI', 'Federal', 'Scanned PDF (OCR)', '& more'].map(b => (
                                    <Chip key={b} label={b} size="small" sx={{ background: '#fff', border: '1px solid #ddd', fontWeight: 500, fontSize: '0.75rem' }} />
                                ))}
                            </Box>
                        </Paper>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" size="large" onClick={handleProcess}
                                disabled={!selectedFile || !selectedClient}
                                startIcon={<AccountBalance />}
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 2, px: 4, py: 1.5, fontWeight: 700, fontSize: '1rem',
                                    boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
                                    '&:hover': { boxShadow: '0 6px 25px rgba(102,126,234,0.5)' },
                                    '&:disabled': { background: '#ccc' },
                                }}>
                                Extract Transactions →
                            </Button>
                        </Box>
                    </motion.div>
                )}

                {/* ─── STEP 2: Processing ─── */}
                {step === 'processing' && (
                    <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #eee' }}>
                            <LiveProgressBar event={sseProgress} />
                        </Paper>
                    </motion.div>
                )}

                {/* ─── STEP 3: Preview ─── */}
                {step === 'preview' && result && (
                    <motion.div key="preview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                        {/* Processing Errors */}
                        {result.processingErrors?.length > 0 && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
                                action={<IconButton size="small" onClick={() => setShowErrors(!showErrors)}>{showErrors ? <ExpandLess /> : <ExpandMore />}</IconButton>}>
                                <AlertTitle>Extraction Issues ({result.processingErrors.length})</AlertTitle>
                                {showErrors && result.processingErrors.map((e, i) => <div key={i}>• {e}</div>)}
                            </Alert>
                        )}

                        {/* Warnings */}
                        {result.processingWarnings?.length > 0 && (
                            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                                <AlertTitle>Warnings ({result.processingWarnings.length})</AlertTitle>
                                {result.processingWarnings.slice(0, 4).map((w, i) => <div key={i}>• {w}</div>)}
                                {result.processingWarnings.length > 4 && <div>...and {result.processingWarnings.length - 4} more</div>}
                            </Alert>
                        )}

                        {/* Auto-fix suggestion banner */}
                        {fixSuggestions.length > 0 && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}
                                action={
                                    <Button size="small" startIcon={<AutoFixHigh />}
                                        onClick={() => setShowFixDialog(true)} variant="contained"
                                        sx={{ background: '#667eea', color: '#fff', '&:hover': { background: '#764ba2' } }}>
                                        Review {fixSuggestions.length} Fix(es)
                                    </Button>
                                }>
                                <AlertTitle>Auto-Fix Available</AlertTitle>
                                {fixSuggestions.length} row(s) have suggested corrections. Review and apply with one click.
                            </Alert>
                        )}

                        {/* Confidence bar */}
                        <ConfidenceBar
                            confidence={result.confidence || 0}
                            ocrUsed={result.ocrUsed}
                            method={result.processingMethod}
                        />

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <Button startIcon={<Refresh />} onClick={handleReprocessAI} disabled={reprocessing}
                                variant="outlined" color="secondary" sx={{ borderRadius: 2 }}>
                                {reprocessing ? 'Processing...' : 'Re-run Deep AI'}
                            </Button>
                        </Box>

                        {/* Summary Cards */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                            <StatCard label="Total Transactions" value={rows.length.toString()} color="#667eea" icon={<SwapHoriz />} />
                            <StatCard label="Total Debit" value={fmt(totalDebit)} color="#ef4444" icon={<TrendingDown />} subtitle="Expenses" />
                            <StatCard label="Total Credit" value={fmt(totalCredit)} color="#22c55e" icon={<TrendingUp />} subtitle="Income" />
                            <StatCard
                                label="Net Flow"
                                value={fmt(totalCredit - totalDebit)}
                                color={totalCredit >= totalDebit ? '#22c55e' : '#ef4444'}
                                icon={<AccountBalance />}
                            />
                            {result.bankName && (
                                <StatCard label="Bank Detected" value={result.bankName} color="#764ba2" icon={<AccountBalance />} subtitle={result.statementPeriod} />
                            )}
                            {errorRows > 0 && (
                                <StatCard label="Error Rows" value={errorRows.toString()} color="#f59e0b" icon={<Warning />} subtitle="Review needed" />
                            )}
                            {suspRows > 0 && (
                                <StatCard label="Suspicious" value={suspRows.toString()} color="#ef4444" icon={<ErrorOutline />} subtitle="CA flag" />
                            )}
                        </Box>

                        {/* Preview Table */}
                        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee', overflow: 'hidden' }}>
                            {/* Table Toolbar */}
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, borderBottom: '1px solid #eee', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)' }}>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <TextField size="small" placeholder="Search transactions..." value={filter}
                                        onChange={e => setFilter(e.target.value)} sx={{ width: 220, background: '#fff', borderRadius: 2 }} />
                                    <FormControl size="small" sx={{ minWidth: 150, background: '#fff', borderRadius: 2 }}>
                                        <InputLabel>Category</InputLabel>
                                        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} label="Category">
                                            <MenuItem value="">All Categories</MenuItem>
                                            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <Chip label={`${sortedRows.length} rows`} size="small" sx={{ background: '#fff' }} />
                                    {suspRows > 0 && (
                                        <Chip label={`${suspRows} suspicious`} size="small"
                                            sx={{ background: '#fff0f0', color: '#ef4444', border: '1px solid #fecaca' }} />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" startIcon={<Save />} onClick={handleSaveRows} disabled={savingRows}
                                        variant="outlined" sx={{ borderRadius: 2 }}>
                                        {savingRows ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button size="small" startIcon={<Download />} onClick={() => bankStatementApi.downloadExcel(statementId)}
                                        variant="contained"
                                        sx={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: 2, fontWeight: 700, boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }}>
                                        Download Excel
                                    </Button>
                                </Box>
                            </Box>

                            {/* Table */}
                            <TableContainer sx={{ maxHeight: 520, overflowY: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            {(['date', 'description', 'debit', 'credit', 'balance', 'category'] as (keyof TransactionRow)[]).map(col => (
                                                <TableCell key={col} onClick={() => handleSort(col)}
                                                    sx={{ fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', background: '#f8f9ff', whiteSpace: 'nowrap', '&:hover': { background: '#eef0ff' }, userSelect: 'none', textAlign: ['debit', 'credit', 'balance'].includes(col) ? 'right' : 'left' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: ['debit', 'credit', 'balance'].includes(col) ? 'flex-end' : 'flex-start' }}>
                                                        {col === 'description' ? 'Particulars' : col.charAt(0).toUpperCase() + col.slice(1)}
                                                        <SortIcon col={col} />
                                                    </Box>
                                                </TableCell>
                                            ))}
                                            <TableCell sx={{ fontWeight: 700, background: '#f8f9ff' }}>Conf.</TableCell>
                                            <TableCell sx={{ fontWeight: 700, background: '#f8f9ff', whiteSpace: 'nowrap' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#888' }}>
                                                    <Description sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                                                    <Typography>No transactions found</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : sortedRows.map((row, idx) => {
                                            const originalIdx = rows.findIndex(r => r === row);
                                            const isEditing   = editingRow === originalIdx;
                                            const rowBg = row.suspicious ? 'rgba(249,115,22,0.06)'
                                                        : row.hasError   ? 'rgba(239,68,68,0.04)'
                                                        : row.autoFixed  ? 'rgba(34,197,94,0.04)'
                                                        : idx % 2 === 0  ? '#fff' : '#fafbff';

                                            return (
                                                <TableRow key={idx} sx={{ background: rowBg, '&:hover': { background: row.hasError ? 'rgba(239,68,68,0.08)' : 'rgba(102,126,234,0.04)' } }}>
                                                    {isEditing && editBuffer ? (
                                                        <>
                                                            <TableCell><TextField size="small" value={editBuffer.date} onChange={e => setEditBuffer({ ...editBuffer, date: e.target.value })} sx={{ width: 110 }} /></TableCell>
                                                            <TableCell><TextField size="small" value={editBuffer.description} onChange={e => setEditBuffer({ ...editBuffer, description: e.target.value })} fullWidth /></TableCell>
                                                            <TableCell><TextField size="small" type="number" value={editBuffer.debit} onChange={e => setEditBuffer({ ...editBuffer, debit: parseFloat(e.target.value) || 0 })} sx={{ width: 100 }} /></TableCell>
                                                            <TableCell><TextField size="small" type="number" value={editBuffer.credit} onChange={e => setEditBuffer({ ...editBuffer, credit: parseFloat(e.target.value) || 0 })} sx={{ width: 100 }} /></TableCell>
                                                            <TableCell><TextField size="small" type="number" value={editBuffer.balance} onChange={e => setEditBuffer({ ...editBuffer, balance: parseFloat(e.target.value) || 0 })} sx={{ width: 110 }} /></TableCell>
                                                            <TableCell>
                                                                <FormControl size="small" sx={{ minWidth: 130 }}>
                                                                    <Select value={editBuffer.category || ''} onChange={e => setEditBuffer({ ...editBuffer, category: e.target.value })}>
                                                                        {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                                                    </Select>
                                                                </FormControl>
                                                            </TableCell>
                                                            <TableCell>—</TableCell>
                                                            <TableCell>
                                                                <IconButton size="small" color="success" onClick={saveEdit}><Save fontSize="small" /></IconButton>
                                                                <IconButton size="small" color="error" onClick={cancelEdit}><Cancel fontSize="small" /></IconButton>
                                                            </TableCell>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                                {row.suspicious && <Tooltip title="Suspicious transaction"><ErrorOutline sx={{ fontSize: 13, color: '#f97316', mr: 0.5 }} /></Tooltip>}
                                                                {row.hasError   && <Tooltip title={row.errorMessage}><Warning sx={{ fontSize: 13, color: '#f59e0b', mr: 0.5 }} /></Tooltip>}
                                                                {row.autoFixed  && <Tooltip title="Auto-corrected"><AutoFixHigh sx={{ fontSize: 13, color: '#22c55e', mr: 0.5 }} /></Tooltip>}
                                                                {row.date}
                                                            </TableCell>
                                                            <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                                                <Tooltip title={row.description}><span>{row.description}</span></Tooltip>
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', color: row.debit > 0 ? '#ef4444' : '#aaa', fontWeight: row.debit > 0 ? 600 : 400, fontSize: '0.82rem' }}>
                                                                {row.debit > 0 ? fmt(row.debit) : '—'}
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', color: row.credit > 0 ? '#22c55e' : '#aaa', fontWeight: row.credit > 0 ? 600 : 400, fontSize: '0.82rem' }}>
                                                                {row.credit > 0 ? fmt(row.credit) : '—'}
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'right', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                                                                {row.balance > 0 ? fmt(row.balance) : '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.category && (
                                                                    <Chip label={row.category} size="small" sx={{ fontSize: '0.7rem', height: 22, background: '#f0f4ff', color: '#667eea', border: '1px solid #dde4ff' }} />
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: row.confidence != null && row.confidence < 60 ? '#ef4444' : '#22c55e' }}>
                                                                {row.confidence != null ? `${row.confidence}%` : '—'}
                                                            </TableCell>
                                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                                <Tooltip title="Edit">
                                                                    <IconButton size="small" onClick={() => startEdit(originalIdx)}><Edit fontSize="small" /></IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete row">
                                                                    <IconButton size="small" color="error" onClick={() => deleteRow(originalIdx)}><Delete fontSize="small" /></IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Table Footer */}
                            <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 4, background: '#fafbff', flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 700 }}>Total Debit: {fmt(totalDebit)}</Typography>
                                <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 700 }}>Total Credit: {fmt(totalCredit)}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>Net: {fmt(totalCredit - totalDebit)}</Typography>
                            </Box>
                        </Paper>

                        {/* Bottom Action Bar */}
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                            <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} sx={{ borderRadius: 2 }}>
                                Process Another
                            </Button>
                            <Button variant="contained" size="large" startIcon={<Download />}
                                onClick={() => bankStatementApi.downloadExcel(statementId)}
                                sx={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', borderRadius: 2, px: 4, py: 1.5, fontWeight: 700, boxShadow: '0 4px 20px rgba(34,197,94,0.4)', '&:hover': { boxShadow: '0 6px 25px rgba(34,197,94,0.5)' } }}>
                                📥 Download Multi-Sheet Excel
                            </Button>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Auto-Fix Dialog ─── */}
            <Dialog open={showFixDialog} onClose={() => setShowFixDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    <AutoFixHigh sx={{ mr: 1, color: '#667eea' }} />
                    Auto-Fix Suggestions ({fixSuggestions.length})
                </DialogTitle>
                <DialogContent dividers>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Row', 'Field', 'Current Value', 'Suggested Value', 'Reason', 'Confidence'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {fixSuggestions.map((s, i) => (
                                <TableRow key={i}>
                                    <TableCell>#{s.rowIndex + 1}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.field}</TableCell>
                                    <TableCell sx={{ color: '#ef4444' }}>₹{s.currentValue.toFixed(2)}</TableCell>
                                    <TableCell sx={{ color: '#22c55e' }}>₹{s.suggestedValue.toFixed(2)}</TableCell>
                                    <TableCell>{s.reason}</TableCell>
                                    <TableCell>{s.confidence}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowFixDialog(false)}>Skip</Button>
                    <Button onClick={handleApplyFixes} disabled={applyingFixes} variant="contained"
                        sx={{ background: '#667eea' }}>
                        {applyingFixes ? 'Applying...' : 'Apply All Fixes'}
                    </Button>
                </DialogActions>
            </Dialog>

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
