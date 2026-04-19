import React, { useState, useRef, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Chip,
    CircularProgress, Alert, AlertTitle, Divider,
    IconButton, Tooltip, Snackbar, LinearProgress,
} from '@mui/material';
import {
    Gavel, AutoAwesome, ContentCopy, Download, Clear,
    ArrowForward, CheckCircle, Article, Psychology,
    UploadFile, PictureAsPdf, Close, SwapHoriz,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

// ─── API base ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── API: extract text from PDF/image ────────────────────────────────────────

async function extractTextFromFile(
    file: File,
    token: string
): Promise<{ text: string; method: string; charCount: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/notice-reply/extract-text`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── API: generate reply ──────────────────────────────────────────────────────

async function generateNoticeReply(
    noticeText: string,
    clientDetails: string,
    token: string
): Promise<{ reply: string; provider: string; generatedAt: string }> {
    const res = await fetch(`${API_BASE}/notice-reply/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ noticeText, clientDetails }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let listItems: string[] = [];
    let key = 0;

    const flushList = () => {
        if (listItems.length > 0) {
            nodes.push(
                <Box key={key++} component="ul" sx={{ pl: 2.5, mb: 1.5, '& li': { mb: 0.5 } }}>
                    {listItems.map((item, i) => (
                        <li key={i}>
                            <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.7 }}>
                                {item}
                            </Typography>
                        </li>
                    ))}
                </Box>
            );
            listItems = [];
        }
    };

    for (const line of lines) {
        if (line.startsWith('## ')) {
            flushList();
            nodes.push(
                <Typography key={key++} variant="h6" sx={{
                    fontWeight: 700, color: '#1e293b', mt: 3, mb: 1, fontSize: '1rem',
                    borderBottom: '2px solid #6366f1', pb: 0.5, display: 'inline-block',
                }}>
                    {line.replace(/^## /, '')}
                </Typography>
            );
        } else if (line.startsWith('### ')) {
            flushList();
            nodes.push(
                <Typography key={key++} variant="subtitle1" sx={{ fontWeight: 600, color: '#4f46e5', mt: 2, mb: 0.5 }}>
                    {line.replace(/^### /, '')}
                </Typography>
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            listItems.push(line.replace(/^[-*] /, ''));
        } else if (line.startsWith('---')) {
            flushList();
            nodes.push(<Divider key={key++} sx={{ my: 2 }} />);
        } else if (line.startsWith('*This reply') || line.startsWith('_This reply')) {
            flushList();
            nodes.push(
                <Alert key={key++} severity="warning" icon={<Gavel fontSize="small" />} sx={{ mt: 2, borderRadius: 2 }}>
                    {line.replace(/[*_]/g, '')}
                </Alert>
            );
        } else if (line.trim() === '') {
            flushList();
        } else {
            flushList();
            const hasBold = /\*\*(.+?)\*\*/g.test(line);
            if (hasBold) {
                const parts = line.split(/\*\*(.+?)\*\*/g);
                nodes.push(
                    <Typography key={key++} variant="body2" sx={{ color: '#374151', lineHeight: 1.8, mb: 0.5 }}>
                        {parts.map((p, i) =>
                            i % 2 === 1 ? <strong key={i}>{p}</strong> : p
                        )}
                    </Typography>
                );
            } else {
                nodes.push(
                    <Typography key={key++} variant="body2" sx={{ color: '#374151', lineHeight: 1.8, mb: 0.5 }}>
                        {line}
                    </Typography>
                );
            }
        }
    }
    flushList();
    return nodes;
}

// ─── Notice type quick-fills ──────────────────────────────────────────────────

const NOTICE_TYPES = [
    'Income Tax – 143(2)', 'Income Tax – 148 (Reopening)',
    'GST – DRC-01',
];

// ─── Main Component ───────────────────────────────────────────────────────────

type InputMode = 'text' | 'pdf';

const NoticeReplyGenerator: React.FC = () => {
    const { token } = useAuth() as any;

    // Input mode
    const [inputMode, setInputMode] = useState<InputMode>('text');

    // Text mode state
    const [noticeText, setNoticeText] = useState('');

    // PDF mode state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [extractMethod, setExtractMethod] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Shared state
    const [clientDetails, setClientDetails] = useState('');
    const [reply, setReply] = useState('');
    const [provider, setProvider] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const replyRef = useRef<HTMLDivElement>(null);

    // The actual notice text used for generation
    const activeNoticeText = inputMode === 'pdf' ? extractedText : noticeText;

    // ── File handling ──────────────────────────────────────────────────────────

    const handleFileSelect = useCallback(async (file: File) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setError('Only PDF, JPG, PNG, or WebP files are supported.');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setError('File size must be under 15 MB.');
            return;
        }

        setUploadedFile(file);
        setExtractedText('');
        setExtractMethod('');
        setError('');
        setReply('');
        setExtracting(true);

        try {
            const result = await extractTextFromFile(file, token);
            setExtractedText(result.text);
            setExtractMethod(result.method);
        } catch (err: any) {
            setError(err.message || 'Failed to extract text from file.');
            setUploadedFile(null);
        } finally {
            setExtracting(false);
        }
    }, [token]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    // ── Generate reply ─────────────────────────────────────────────────────────

    const handleGenerate = async () => {
        if (!activeNoticeText.trim() || activeNoticeText.trim().length < 20) {
            setError('Please provide complete notice text (at least a few sentences).');
            return;
        }
        setLoading(true);
        setError('');
        setReply('');
        try {
            const result = await generateNoticeReply(activeNoticeText, clientDetails, token);
            setReply(result.reply);
            setProvider(result.provider);
            setTimeout(() => replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        } catch (err: any) {
            setError(err.message || 'Failed to generate reply. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => { navigator.clipboard.writeText(reply); setCopied(true); };

    const handleDownload = () => {
        const blob = new Blob([reply], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax_notice_reply_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setNoticeText('');
        setClientDetails('');
        setReply('');
        setError('');
        setUploadedFile(null);
        setExtractedText('');
        setExtractMethod('');
    };

    const fillSample = (type: string) => {
        setInputMode('text');
        if (type.includes('143(2)')) {
            setNoticeText(`Notice under Section 143(2) of the Income Tax Act, 1961\nAssessment Year: 2023-24\nPAN: ABCDE1234F\n\nDear Sir/Madam,\n\nYour return of income for AY 2023-24 has been selected for scrutiny assessment.\n\nYou are required to submit:\n1. Complete Bank statements for all accounts\n2. Details of property purchased worth Rs. 45,00,000\n3. Explanation for cash deposits of Rs. 8,00,000\n4. Source of funds for foreign travel expenses worth Rs. 3,50,000\n\nIncome Tax Officer, Ward 4(1), Mumbai`);
        } else if (type.includes('148')) {
            setNoticeText(`Notice under Section 148 of the Income Tax Act, 1961\nAssessment Year: 2020-21\n\nI have reason to believe that your income for AY 2020-21 has escaped assessment.\nYou are requested to file your return within 30 days.\n\nReason: SFT information showing high value transactions not reflected in return.\n- Unexplained credits of Rs. 12,00,000 in bank account.`);
        } else if (type.includes('DRC')) {
            setNoticeText(`Form GST DRC-01\nGSTIN: 27ABCDE1234F1Z5\n\nDiscrepancy between GSTR-2A and ITC claimed in GSTR-3B.\n- ITC claimed: Rs. 4,50,000\n- ITC available in GSTR-2A: Rs. 2,80,000\n- Excess ITC: Rs. 1,70,000 + Interest Rs. 40,800 + Penalty Rs. 17,000\n- Total demand: Rs. 2,27,800\n\nReply within 30 days.`);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Paper elevation={0} sx={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
                    borderRadius: 3, p: 3.5, mb: 3, color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 2,
                }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: 2.5,
                        background: 'rgba(255,255,255,0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Gavel sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={700}>Tax Notice Reply Generator</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>
                            AI-powered • Upload PDF or paste text • Income Tax • GST • TDS
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {['PDF Upload', 'Text Paste', 'AI Analysis'].map(t => (
                            <Chip key={t} label={t} size="small" sx={{
                                background: 'rgba(255,255,255,0.2)', color: '#fff',
                                fontWeight: 600, fontSize: '0.7rem',
                            }} />
                        ))}
                    </Box>
                </Paper>
            </motion.div>

            {/* Input Mode Toggle */}
            <Paper elevation={0} sx={{ border: '1.5px solid #e5e7eb', borderRadius: 3, p: 0.5, mb: 2.5, display: 'inline-flex', gap: 0.5 }}>
                <Button
                    variant={inputMode === 'pdf' ? 'contained' : 'text'}
                    size="small"
                    startIcon={<PictureAsPdf />}
                    onClick={() => setInputMode('pdf')}
                    sx={{
                        borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2,
                        ...(inputMode === 'pdf'
                            ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', boxShadow: 'none' }
                            : { color: '#6b7280' }),
                    }}
                >
                    Upload PDF / Image
                </Button>
                <Button
                    variant={inputMode === 'text' ? 'contained' : 'text'}
                    size="small"
                    startIcon={<Article />}
                    onClick={() => setInputMode('text')}
                    sx={{
                        borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2,
                        ...(inputMode === 'text'
                            ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', boxShadow: 'none' }
                            : { color: '#6b7280' }),
                    }}
                >
                    Paste Text
                </Button>
            </Paper>

            {/* Quick-fill chips (only in text mode) */}
            <AnimatePresence>
                {inputMode === 'text' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1, display: 'block' }}>
                                Quick Fill a Sample
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {NOTICE_TYPES.map(type => (
                                    <Chip
                                        key={type}
                                        label={type}
                                        variant="outlined"
                                        size="small"
                                        clickable
                                        onClick={() => fillSample(type)}
                                        sx={{
                                            borderColor: '#6366f1', color: '#4f46e5',
                                            fontWeight: 500, fontSize: '0.72rem',
                                            '&:hover': { background: '#f5f3ff' },
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' }, gap: 2.5, mb: 2.5 }}>

                {/* Left panel — PDF upload OR text paste */}
                <Paper elevation={0} sx={{ border: '1.5px solid #e5e7eb', borderRadius: 3, p: 2.5 }}>
                    <AnimatePresence mode="wait">

                        {/* ── PDF Upload mode ── */}
                        {inputMode === 'pdf' && (
                            <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PictureAsPdf sx={{ fontSize: 18, color: '#6366f1' }} />
                                    Upload Notice (PDF / Image)
                                </Typography>

                                {/* Drop Zone */}
                                {!uploadedFile && !extracting && (
                                    <Box
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            border: `2px dashed ${dragOver ? '#6366f1' : '#d1d5db'}`,
                                            borderRadius: 2.5,
                                            p: 4,
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: dragOver ? '#f5f3ff' : '#fafafa',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: '#a5b4fc', background: '#f5f3ff' },
                                            minHeight: 200,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <UploadFile sx={{ fontSize: 48, color: '#a5b4fc' }} />
                                        <Typography fontWeight={600} color="#4f46e5">
                                            Drag & drop or click to upload
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            PDF, JPG, PNG — up to 15 MB
                                        </Typography>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            hidden
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleFileSelect(f);
                                                e.target.value = '';
                                            }}
                                        />
                                    </Box>
                                )}

                                {/* Extracting state */}
                                {extracting && (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <CircularProgress size={36} sx={{ color: '#6366f1', mb: 2 }} />
                                        <Typography fontWeight={600} color="#4f46e5">Extracting text from document…</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Reading PDF content · May take a few seconds
                                        </Typography>
                                        <LinearProgress sx={{ mt: 2, borderRadius: 2, bgcolor: '#e0e7ff', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />
                                    </Box>
                                )}

                                {/* Uploaded + extracted */}
                                {uploadedFile && !extracting && (
                                    <Box>
                                        {/* File info bar */}
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 1,
                                            p: 1.5, borderRadius: 2, background: '#f5f3ff',
                                            border: '1px solid #ddd6fe', mb: 1.5,
                                        }}>
                                            <PictureAsPdf sx={{ color: '#7c3aed', fontSize: 22 }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap>
                                                    {uploadedFile.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(uploadedFile.size / 1024).toFixed(1)} KB •{' '}
                                                    {extractedText.length} chars extracted •{' '}
                                                    <strong style={{ color: '#4f46e5' }}>
                                                        {extractMethod === 'ai-vision-ocr' ? '🤖 AI OCR' : '📄 Text layer'}
                                                    </strong>
                                                </Typography>
                                            </Box>
                                            <Tooltip title="Remove file">
                                                <IconButton size="small" onClick={handleClear} sx={{ color: '#9ca3af' }}>
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        {/* Extracted text preview */}
                                        {extractedText && (
                                            <Box>
                                                <Typography variant="caption" fontWeight={600} color="#6b7280" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                                    Extracted Text Preview
                                                </Typography>
                                                <Box sx={{
                                                    mt: 0.5, p: 1.5,
                                                    background: '#f9fafb',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: 2,
                                                    maxHeight: 200,
                                                    overflowY: 'auto',
                                                    fontSize: '0.78rem',
                                                    fontFamily: 'monospace',
                                                    color: '#374151',
                                                    whiteSpace: 'pre-wrap',
                                                    lineHeight: 1.5,
                                                }}>
                                                    {extractedText.slice(0, 800)}{extractedText.length > 800 ? '\n…(truncated preview)' : ''}
                                                </Box>
                                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<SwapHoriz />}
                                                        onClick={() => { setNoticeText(extractedText); setInputMode('text'); }}
                                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', borderColor: '#c4b5fd', color: '#7c3aed' }}
                                                    >
                                                        Edit in text mode
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<UploadFile />}
                                                        onClick={() => { setUploadedFile(null); setExtractedText(''); fileInputRef.current?.click(); }}
                                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', borderColor: '#e5e7eb', color: '#6b7280' }}
                                                    >
                                                        Replace file
                                                    </Button>
                                                </Box>
                                                {/* Hidden file input for replace */}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    hidden
                                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) handleFileSelect(f);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* How it works info */}
                                {!uploadedFile && !extracting && (
                                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2, fontSize: '0.78rem' }}>
                                        <AlertTitle sx={{ fontSize: '0.79rem', fontWeight: 600 }}>How PDF extraction works</AlertTitle>
                                        • <strong>Digital PDFs</strong> — text extracted instantly via pdf-parse<br />
                                        • <strong>Scanned / image PDFs</strong> — AI vision OCR reads the document<br />
                                        • <strong>Images (JPG/PNG)</strong> — AI OCR extracts all text automatically
                                    </Alert>
                                )}
                            </motion.div>
                        )}

                        {/* ── Text paste mode ── */}
                        {inputMode === 'text' && (
                            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Article sx={{ fontSize: 18, color: '#6366f1' }} />
                                    Paste Notice Text *
                                </Typography>
                                <TextField
                                    multiline
                                    rows={10}
                                    fullWidth
                                    placeholder={`Paste the complete tax notice text here...\n\nExample: Notice under Section 143(2) of Income Tax Act...\n\nInclude: Notice type, section, assessment year, demands, deadlines`}
                                    value={noticeText}
                                    onChange={e => setNoticeText(e.target.value)}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2, fontSize: '0.875rem',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#a5b4fc' },
                                            '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                                        },
                                    }}
                                />
                                <Typography variant="caption" sx={{ color: '#9ca3af', mt: 0.5, display: 'block' }}>
                                    {noticeText.length} characters
                                </Typography>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </Paper>

                {/* Right panel — Client context */}
                <Paper elevation={0} sx={{ border: '1.5px solid #e5e7eb', borderRadius: 3, p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Psychology sx={{ fontSize: 18, color: '#8b5cf6' }} />
                        Client Context (Optional)
                    </Typography>
                    <TextField
                        multiline
                        rows={5}
                        fullWidth
                        placeholder={`Add client-specific details:\n\n• Client name & PAN\n• Nature of business\n• Income sources\n• Previous assessment details\n• Documents available\n• Any special circumstances`}
                        value={clientDetails}
                        onChange={e => setClientDetails(e.target.value)}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2, fontSize: '0.875rem',
                                '& fieldset': { borderColor: '#e5e7eb' },
                                '&:hover fieldset': { borderColor: '#c4b5fd' },
                                '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                            },
                        }}
                    />

                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                            <AlertTitle sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Pro Tips</AlertTitle>
                            • Include the Assessment Year<br />
                            • Add income sources of client<br />
                            • Mention available documents<br />
                            • Note any previous notices
                        </Alert>
                    </Box>

                    {/* Ready indicator */}
                    {activeNoticeText.length > 20 && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                            <Box sx={{
                                mt: 2, p: 1.5, borderRadius: 2,
                                background: '#f0fdf4', border: '1px solid #bbf7d0',
                                display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <CheckCircle sx={{ color: '#22c55e', fontSize: 18 }} />
                                <Typography variant="caption" fontWeight={600} color="#15803d">
                                    Notice text ready — {activeNoticeText.length} chars •{' '}
                                    {inputMode === 'pdf' && extractMethod === 'ai-vision-ocr' ? '🤖 AI OCR' :
                                     inputMode === 'pdf' ? '📄 PDF extracted' : '✍️ Manual input'}
                                </Typography>
                            </Box>
                        </motion.div>
                    )}
                </Paper>
            </Box>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleGenerate}
                    disabled={loading || activeNoticeText.trim().length < 20 || extracting}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                    endIcon={!loading && <ArrowForward />}
                    sx={{
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        borderRadius: 2.5, px: 4, py: 1.3, fontWeight: 700,
                        fontSize: '0.95rem', textTransform: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                        '&:hover': { background: 'linear-gradient(135deg, #4338ca, #6d28d9)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
                        '&:disabled': { background: '#e5e7eb', color: '#9ca3af', boxShadow: 'none' },
                    }}
                >
                    {loading ? 'Generating Reply…' : 'Generate Professional Reply'}
                </Button>

                {(activeNoticeText || reply) && (
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={handleClear}
                        startIcon={<Clear />}
                        sx={{
                            borderRadius: 2.5, px: 3, py: 1.3, fontWeight: 600,
                            textTransform: 'none', borderColor: '#e5e7eb', color: '#6b7280',
                            '&:hover': { borderColor: '#d1d5db', background: '#f9fafb' },
                        }}
                    >
                        Clear All
                    </Button>
                )}
            </Box>

            {/* Loading state */}
            <AnimatePresence>
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Paper elevation={0} sx={{
                            border: '1.5px solid #e0e7ff', borderRadius: 3, p: 3, mb: 3,
                            background: 'linear-gradient(135deg, #f5f3ff, #faf5ff)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                                <Box>
                                    <Typography fontWeight={600} color="#4f46e5">Analyzing Notice & Drafting Reply…</Typography>
                                    <Typography variant="caption" sx={{ color: '#7c3aed' }}>
                                        Identifying notice type → Extracting issues → Drafting formal reply…
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Reply Output */}
            <AnimatePresence>
                {reply && (
                    <motion.div
                        ref={replyRef as any}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Paper elevation={0} sx={{ border: '1.5px solid #c7d2fe', borderRadius: 3, overflow: 'hidden' }}>
                            {/* Reply Header */}
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                px: 3, py: 2, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                borderBottom: '1px solid #ddd6fe',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <CheckCircle sx={{ color: '#22c55e', fontSize: 22 }} />
                                    <Typography fontWeight={700} color="#1e293b">Professional Reply Generated</Typography>
                                    {provider && (
                                        <Chip label={`via ${provider}`} size="small" sx={{
                                            background: '#e0e7ff', color: '#4338ca',
                                            fontWeight: 600, fontSize: '0.7rem',
                                        }} />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Copy to Clipboard">
                                        <IconButton
                                            size="small"
                                            onClick={handleCopy}
                                            sx={{
                                                background: '#fff', border: '1px solid #ddd6fe',
                                                color: copied ? '#22c55e' : '#6366f1',
                                                '&:hover': { background: '#f5f3ff' },
                                            }}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download as Text File">
                                        <IconButton
                                            size="small"
                                            onClick={handleDownload}
                                            sx={{
                                                background: '#fff', border: '1px solid #ddd6fe', color: '#6366f1',
                                                '&:hover': { background: '#f5f3ff' },
                                            }}
                                        >
                                            <Download fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Reply Content */}
                            <Box sx={{ p: 3.5, background: '#fff' }}>
                                {renderMarkdown(reply)}
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Copied toast */}
            <Snackbar
                open={copied}
                autoHideDuration={2500}
                onClose={() => setCopied(false)}
                message="Reply copied to clipboard!"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
};

export default NoticeReplyGenerator;
