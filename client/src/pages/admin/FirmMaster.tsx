import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Select, MenuItem,
    Tabs, Tab, IconButton, Avatar, Snackbar, Alert, CircularProgress,
    Switch, Tooltip, FormControlLabel, Divider, Modal, Fade, Backdrop,
    Grid, RadioGroup,
} from '@mui/material';
import {
    Building2,
    Save,
    Camera,
    Plus,
    Trash2,
    Minus,
    Info,
    Receipt,
    Download,
    List,
    FileSpreadsheet,
    Pencil,
    Check,
    Upload,
    X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import firmService from '../../services/firmService';
import type { FirmMasterData, IMultiFirmData } from '../../services/firmService';
import { CommonButton } from '../../components/common/UIComponents';

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface FieldRowProps { label: string; required?: boolean; children: React.ReactNode; htmlFor?: string }
const Row: React.FC<FieldRowProps> = ({ label, required, children, htmlFor }) => (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 2, 
        gap: { xs: 0.5, sm: 1.5 } 
    }}>
        <Typography 
            component="label" 
            htmlFor={htmlFor}
            sx={{ 
                width: { xs: '100%', sm: 160 }, 
                flexShrink: 0, 
                fontSize: '0.82rem', 
                color: 'text.secondary', 
                fontWeight: 600,
                opacity: 0.9,
                cursor: htmlFor ? 'pointer' : 'default'
            }}
        >
            {label}{required && <span aria-hidden="true" style={{ color: 'red', marginLeft: '2px' }}>*</span>}
        </Typography>
        <Box sx={{ flex: 1, width: '100%' }}>{children}</Box>
    </Box>
);

const SectionHead: React.FC<{ icon?: React.ReactNode; title: string }> = ({ icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f7fa', px: 1.5, py: 0.75, borderRadius: '8px', mb: 1.5, border: '1px solid #e8ecf0', width: '100%', boxSizing: 'border-box' }}>
        {icon && <Box sx={{ color: '#667eea', display: 'flex' }}>{icon}</Box>}
        <Typography fontSize="0.82rem" fontWeight={700} color="#444">{title}</Typography>
    </Box>
);

const sx = { size: 'small' as const, sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } } };
const selSx = { size: 'small' as const, sx: { borderRadius: '8px', fontSize: '0.82rem' } };

interface ImgBoxProps { label: string; url?: string; onUpload: (f: File) => void; onRemove?: () => void; loading?: boolean }
const ImgBox: React.FC<ImgBoxProps> = ({ label, url, onUpload, onRemove, loading }) => (
    <Box sx={{ mb: 1.5 }}>
        <SectionHead title={label} />
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 1.5 
        }}>
            <Box sx={{ 
                width: { xs: '100%', sm: 120 }, 
                height: 100, 
                border: '2px dashed #ccc', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                bgcolor: '#fafafa', 
                overflow: 'hidden', 
                position: 'relative' 
            }}>
                {loading ? <CircularProgress size={20} /> : url
                    ? (
                        <>
                            <img 
                                src={url} 
                                alt={label} 
                                width="120" 
                                height="100" 
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                            {onRemove && (
                                <IconButton
                                    aria-label={`Remove ${label}`}
                                    size="small"
                                    onClick={onRemove}
                                    title={`Remove ${label}`}
                                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.7)', padding: 0.5, '&:hover': { bgcolor: 'white' } }}
                                >
                                    <X size={14} color="#d32f2f" />
                                </IconButton>
                            )}
                        </>
                    )
                    : (
                        <Box component="label" sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Upload size={24} color="#ccc" />
                            <Typography fontSize="0.65rem" color="#aaa" mt={0.5}>Upload</Typography>
                            <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                        </Box>
                    )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', width: '100%' }}>
                <CommonButton component="label" size="small"
                    sx={{ bgcolor: '#f1f5f9', color: '#555', borderRadius: 0, px: 1.5, py: 0.5, borderRight: '1px solid #ccc', fontSize: '0.78rem', minWidth: 90, whiteSpace: 'nowrap' }}>
                    Choose File
                    <input type="file" hidden accept="image/jpeg,image/png" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                </CommonButton>
                <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url ? 'Image set' : 'No file chosen'}</Typography>
            </Box>
            <Box sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.72rem', width: '100%' }}>
                <strong>NOTE!</strong> JPEG or PNG Image Format only
            </Box>
        </Box>
    </Box>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const BLANK: FirmMasterData = {
    firmName: '', shortName: '', address: '', country: 'India', state: '', city: '',
    postalCode: '', mobile: '', email: '', phoneL: '', firmType: '',
    bankName: '', bankBranch: '', accountHolderName: '', accountNumber: '',
    ifscCode: '', ibanNo: '', swiftCode: '', micrCode: '', panNumber: '',
    firmZone: 'UTC+05:30 Chennai, Kolkata, Mumbai, New Delhi', clientCodePrefix: 'CA', invoicePrefix: 'INV-',
    invoiceEmails: '', supportEmails: '', supportMobile: '',
    autoCloseHours: 10,
    gstin: '', membershipNo: '', membershipDate: '', frnNo: '', frnDate: '',
    licenceNo: '', licenceAuthority: '',
    website: '', facebook: '', twitter: '', googlePlus: '', pmsAppUrl: '',
    extraField1: '', extraField2: '', extraField3: '', extraField4: '', extraField5: '', extraField6: '', extraField7: '',
    partners: [],
    showLogo: true,
};

const COUNTRY_LIST = ['India', 'USA', 'UAE', 'UK', 'Canada', 'Australia'];
const STATE_LIST = ['Gujarat', 'Maharashtra', 'Delhi', 'Rajasthan', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Punjab'];
const CITY_LIST = ['Surat', 'Ahmedabad', 'Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];
const FIRM_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Company', 'HUF', 'Trust'];
const ZONES = ['UTC+05:30 Chennai, Kolkata, Mumbai, New Delhi', 'UTC+00:00 UTC', 'UTC+05:45 Kathmandu'];

const DOC_TYPES = [
    'Certificate of Registration', 'ICAI Certificate', 'GST Registration Certificate',
    'PAN Card', 'TAN Certificate', 'Professional Tax Certificate',
    'Partnership Deed', 'MOA / AOA', 'Bank Letter', 'Letterhead',
    'Trade License', 'Shop Act License', 'MSME Certificate',
    'ISO Certificate', 'Other',
];

// ─── Firm Documents Sub-component ─────────────────────────────────────────────
interface FirmDocumentsTabProps { toast: (msg: string, sev?: 'success' | 'error' | 'info') => void }
const FirmDocumentsTab: React.FC<FirmDocumentsTabProps> = ({ toast }) => {
    const queryClient = useQueryClient();
    const [docName, setDocName] = useState('');
    const [docNumber, setDocNumber] = useState('');
    const [docDesc, setDocDesc] = useState('');
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docFileName, setDocFileName] = useState('No file chosen');
    const [saving, setSaving] = useState(false);

    const { data: docs = [], isLoading } = useQuery<import('../../services/firmService').IFirmDocument[]>({
        queryKey: ['firmDocuments'],
        queryFn: firmService.getDocuments,
    });

    const deleteMutation = useMutation({
        mutationFn: firmService.deleteDocument,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['firmDocuments'] }); toast('Document deleted'); },
        onError: () => toast('Delete failed', 'error'),
    });

    const handleSave = async () => {
        if (!docName) { toast('Document Name is required', 'error'); return; }
        setSaving(true);
        try {
            await firmService.addDocument({ documentName: docName, documentNumber: docNumber, description: docDesc, file: docFile || undefined });
            queryClient.invalidateQueries({ queryKey: ['firmDocuments'] });
            toast('Document saved successfully!');
            setDocName(''); setDocNumber(''); setDocDesc(''); setDocFile(null); setDocFileName('No file chosen');
        } catch { toast('Failed to save document', 'error'); }
        finally { setSaving(false); }
    };

    const exportExcel = () => {
        const rows = [['Document Name', 'Document Number', 'Description', 'File', 'Uploaded At'],
        ...docs.map(d => [d.documentName, d.documentNumber || '', d.description || '', d.fileName || '', d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : ''])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'firm_documents.csv'; a.click();
    };

    const fmtSize = (bytes?: number) => !bytes ? '' : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: '8px' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Row label="Document Name *" htmlFor="doc-name">
                        <Select id="doc-name" value={docName} onChange={(e) => setDocName(e.target.value as string)} fullWidth displayEmpty {...selSx}>
                            <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a Document...</em></MenuItem>
                            {DOC_TYPES.map(d => <MenuItem key={d} value={d} sx={{ fontSize: '0.82rem' }}>{d}</MenuItem>)}
                        </Select>
                    </Row>
                    <Row label="Document Number" htmlFor="doc-number">
                        <TextField id="doc-number" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} fullWidth {...sx} />
                    </Row>
                    <Row label="Browse File *">
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', mb: 0.5 }}>
                                <CommonButton component="label" size="small"
                                    sx={{ bgcolor: '#f1f5f9', color: '#555', borderRadius: 0, px: 1.5, borderRight: '1px solid #ccc', fontSize: '0.78rem', minWidth: 90, whiteSpace: 'nowrap', py: 0.7 }}>
                                    Choose File
                                    <input type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocFile(f); setDocFileName(f.name); } }} />
                                </CommonButton>
                                <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docFileName}</Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.3, borderRadius: 0.5, fontSize: '0.72rem', display: 'inline-block' }}>
                                <strong>NOTE!</strong> Attached file less then 10 MB
                            </Box>
                        </Box>
                    </Row>
                    <Row label="Description">
                        <TextField value={docDesc} onChange={(e) => setDocDesc(e.target.value)} fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} />
                    </Row>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                    <CommonButton variant="contained" size="small" onClick={handleSave} loading={saving}
                        sx={{ bgcolor: '#6366f1', color: 'white', borderRadius: '8px', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#4f46e5' } }}>
                        Add Document
                    </CommonButton>
                    <CommonButton variant="outlined" size="small" color="error" onClick={() => { setDocName(''); setDocNumber(''); setDocDesc(''); setDocFile(null); setDocFileName('No file chosen'); }}
                        sx={{ borderRadius: '8px', px: 3 }}>
                        Reset
                    </CommonButton>
                </Box>
            </Paper>

            {/* Document List */}
            <Paper sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Building2 size={16} />
                        <Typography fontWeight={700} fontSize="0.875rem">Firm Document List</Typography>
                    </Box>
                    <Tooltip title="Export to CSV">
                        <IconButton 
                            aria-label="Export documents to CSV"
                            size="small" 
                            onClick={exportExcel} 
                            sx={{ color: 'white', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, borderRadius: '8px' }}
                        >
                            <Typography fontSize="0.7rem" fontWeight={700}>XLS</Typography>
                        </IconButton>
                    </Tooltip>
                </Box>
                {isLoading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
                ) : docs.length === 0 ? (
                    <Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.85rem' }}>Document Not Found</Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                                <tr style={{ background: '#f5f7fa' }}>
                                    {['#', 'Document Name', 'Number', 'File', 'Size', 'Date', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((doc, i) => (
                                    <tr key={doc._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{doc.documentName}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{doc.documentNumber || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            {doc.fileUrl ? (
                                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.78rem' }}>
                                                    {doc.fileName || 'View'}
                                                </a>
                                            ) : <span style={{ color: '#aaa' }}>—</span>}
                                        </td>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{fmtSize(doc.fileSize)}</td>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {doc.fileId && (
                                                    <Tooltip title="Download File">
                                                        <IconButton
                                                            aria-label="Download document file"
                                                            size="small"
                                                            component="a"
                                                            href={`https://drive.google.com/uc?export=download&id=${doc.fileId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{ color: '#667eea' }}
                                                        >
                                                            <Download size={16} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <IconButton 
                                                    aria-label={`Delete ${doc.documentName}`}
                                                    size="small" 
                                                    color="error" 
                                                    onClick={() => doc._id && deleteMutation.mutate(doc._id)}
                                                >
                                                    <Trash2 size={16} />
                                                </IconButton>
                                            </Box>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};


// ─── Currency Sub-component ───────────────────────────────────────────────────
const CURRENCIES = [
    { code: 'AED', name: 'UAE Dirham' }, { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' }, { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' }, { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' }, { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'INR', name: 'Indian Rupee' }, { code: 'JPY', name: 'Japanese Yen' },
    { code: 'MYR', name: 'Malaysian Ringgit' }, { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'SGD', name: 'Singapore Dollar' }, { code: 'USD', name: 'US Dollar' },
    { code: 'ZAR', name: 'South African Rand' },
];
const CURR_BLANK = { currencyCode: '', currencyName: '', rate: 1, isDefault: false, status: true };

const CurrencyTab: React.FC<{ toast: (msg: string, sev?: 'success' | 'error' | 'info') => void }> = ({ toast }) => {
    const queryClient = useQueryClient();
    const [curr, setCurr] = useState(CURR_BLANK);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: currencies = [], isLoading } = useQuery<import('../../services/firmService').ICurrencyData[]>({
        queryKey: ['currencies'], queryFn: firmService.getCurrencies,
    });

    const deleteMutation = useMutation({
        mutationFn: firmService.deleteCurrency,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies'] }); toast('Currency deleted'); },
        onError: () => toast('Delete failed', 'error'),
    });

    const handleCurrencySelect = (code: string) => {
        const found = CURRENCIES.find(c => c.code === code);
        setCurr(p => ({ ...p, currencyCode: code, currencyName: found?.name || '' }));
    };

    const handleSave = async () => {
        if (!curr.currencyCode) { toast('Please choose a currency', 'error'); return; }
        setSaving(true);
        try {
            if (editId) { await firmService.updateCurrency(editId, curr); toast('Currency updated!'); }
            else { await firmService.createCurrency(curr); toast('Currency added!'); }
            queryClient.invalidateQueries({ queryKey: ['currencies'] });
            setCurr(CURR_BLANK); setEditId(null);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
            toast(msg || 'Save failed', 'error');
        } finally { setSaving(false); }
    };

    const exportCSV = () => {
        const rows = [['Currency Code', 'Currency Name', 'Rate', 'Status', 'Type'],
        ...currencies.map(c => [c.currencyCode, c.currencyName, c.rate.toFixed(2), c.status ? 'Active' : 'Inactive', c.isDefault ? 'Default' : ''])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'currency_list.csv'; a.click();
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: '8px' }}>
                <Row label="Currency *">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Select value={curr.currencyCode} onChange={(e) => handleCurrencySelect(e.target.value as string)} displayEmpty size="small" sx={{ minWidth: 200, borderRadius: '8px', fontSize: '0.82rem' }}>
                            <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a Currency...</em></MenuItem>
                            {CURRENCIES.map(c => <MenuItem key={c.code} value={c.code} sx={{ fontSize: '0.82rem' }}>{c.code} - {c.name}</MenuItem>)}
                        </Select>
                        <TextField value={curr.rate} onChange={(e) => setCurr(p => ({ ...p, rate: parseFloat(e.target.value) || 0 }))} type="number" size="small"
                            sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} inputProps={{ min: 0, step: 0.01 }} />
                        <CommonButton size="small" variant="outlined" sx={{ borderRadius: '8px', fontSize: '0.8rem', px: 1.5, minWidth: 'auto', color: '#555', borderColor: '#ccc' }}>Rate.</CommonButton>
                        <Tooltip title="Exchange rate relative to the default currency (e.g. INR = 1.00)">
                            <Info size={18} color="#aaa" style={{ cursor: 'pointer' }} />
                        </Tooltip>
                    </Box>
                </Row>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                    <CommonButton variant="contained" size="small" onClick={handleSave} loading={saving}
                        sx={{ boxShadow: 'none' }}>
                        Save
                    </CommonButton>
                    <CommonButton variant="outlined" size="small" color="error" onClick={() => { setCurr(CURR_BLANK); setEditId(null); }}
                        sx={{ borderRadius: '8px', px: 4 }}>Cancel</CommonButton>
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <List size={16} />
                        <Typography fontWeight={700} fontSize="0.875rem">Currency List</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Activity Log">
                            <CommonButton size="small" variant="contained" sx={{ bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4338ca' }, fontSize: '0.75rem', borderRadius: '8px', boxShadow: 'none', minWidth: 'auto', px: 1.5 }}>Log</CommonButton>
                        </Tooltip>
                        <Tooltip title="Export to Excel/CSV">
                            <IconButton size="small" onClick={exportCSV} sx={{ color: 'white', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, borderRadius: '8px', width: 28, height: 28 }}>
                                <FileSpreadsheet size={14} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                {isLoading ? (<Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>)
                    : currencies.length === 0 ? (<Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.85rem' }}>Currency List <strong>Not Found</strong></Box>)
                        : (<Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead><tr style={{ background: '#f5f7fa', borderBottom: '2px solid #e8ecf0' }}>
                                    {['Currency Code', 'Rate', 'Status', 'Type', 'Action'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{currencies.map((c) => (
                                    <tr key={c._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.currencyCode}<span style={{ color: '#888', fontWeight: 400, marginLeft: 6, fontSize: '0.78rem' }}>{c.currencyName}</span></td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{c.rate.toFixed(2)}</td>
                                        <td style={{ padding: '8px 12px' }}>{c.status ? 'Active' : 'Inactive'}</td>
                                        <td style={{ padding: '8px 12px' }}>{c.isDefault ? <span style={{ color: '#667eea', fontWeight: 700 }}>Default</span> : '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <IconButton size="small" onClick={() => { setCurr({ currencyCode: c.currencyCode, currencyName: c.currencyName, rate: c.rate, isDefault: c.isDefault, status: c.status }); setEditId(c._id || null); }} sx={{ color: '#667eea', mr: 0.5 }}>
                                                <Pencil size={14} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => c._id && deleteMutation.mutate(c._id)}><Trash2 size={16} /></IconButton>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </Box>)}
            </Paper>
        </Box>
    );
};

// ─── Tax Detail Sub-component ─────────────────────────────────────────────────
const TAX_BLANK: { name: string; percentageType: 'Percentage' | 'Fixed'; percentageValue: number; isDefault: boolean; status: boolean } = { name: '', percentageType: 'Percentage', percentageValue: 0, isDefault: false, status: true };

const TaxDetailTab: React.FC<{ toast: (msg: string, sev?: 'success' | 'error' | 'info') => void }> = ({ toast }) => {
    const queryClient = useQueryClient();
    const [tax, setTax] = useState(TAX_BLANK);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: taxes = [], isLoading } = useQuery<import('../../services/firmService').ITaxDetailData[]>({
        queryKey: ['taxDetails'], queryFn: firmService.getTaxDetails,
    });

    const deleteMutation = useMutation({
        mutationFn: firmService.deleteTaxDetail,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['taxDetails'] }); toast('Tax deleted'); },
        onError: () => toast('Delete failed', 'error'),
    });

    const handleSave = async () => {
        if (!tax.name) { toast('Name is required', 'error'); return; }
        setSaving(true);
        try {
            if (editId) { await firmService.updateTaxDetail(editId, tax); toast('Tax updated!'); }
            else { await firmService.createTaxDetail(tax); toast('Tax added!'); }
            queryClient.invalidateQueries({ queryKey: ['taxDetails'] });
            setTax(TAX_BLANK); setEditId(null);
        } catch { toast('Save failed', 'error'); } finally { setSaving(false); }
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: '8px', maxWidth: 700 }}>
                <Row label="Name *">
                    <TextField value={tax.name} onChange={(e) => setTax(p => ({ ...p, name: e.target.value }))} fullWidth {...sx} />
                </Row>
                <Row label="Percentage *">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Select value={tax.percentageType} onChange={(e) => setTax(p => ({ ...p, percentageType: e.target.value as 'Percentage' | 'Fixed' }))} size="small" sx={{ minWidth: 130, borderRadius: '8px', fontSize: '0.82rem' }}>
                            <MenuItem value="Percentage" sx={{ fontSize: '0.82rem' }}>Percentage</MenuItem>
                            <MenuItem value="Fixed" sx={{ fontSize: '0.82rem' }}>Fixed</MenuItem>
                        </Select>
                        <TextField value={tax.percentageValue} onChange={(e) => setTax(p => ({ ...p, percentageValue: parseFloat(e.target.value) || 0 }))} type="number" size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} inputProps={{ min: 0, step: 0.01 }} />
                    </Box>
                </Row>
                <Row label="Default">
                    <Box component="input" type="checkbox" checked={tax.isDefault} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTax(p => ({ ...p, isDefault: e.target.checked }))}
                        sx={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#667eea' }} />
                </Row>
                <Row label="Status">
                    <FormControlLabel
                        control={<Switch size="small" checked={tax.status} onChange={(e) => setTax(p => ({ ...p, status: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />}
                        label={<Typography fontSize="0.8rem" fontWeight={600} color={tax.status ? '#667eea' : 'text.secondary'}>{tax.status ? 'Active' : 'Inactive'}</Typography>}
                    />
                </Row>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                    <CommonButton variant="contained" size="small" onClick={handleSave} loading={saving}
                        sx={{ boxShadow: 'none' }}>
                        Save
                    </CommonButton>
                    <CommonButton variant="outlined" size="small" color="error" onClick={() => { setTax(TAX_BLANK); setEditId(null); }}
                        sx={{ borderRadius: '8px', px: 4 }}>Cancel</CommonButton>
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Building2 size={16} />
                    <Typography fontWeight={700} fontSize="0.875rem">Tax List</Typography>
                </Box>
                {isLoading ? (<Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>)
                    : taxes.length === 0 ? (<Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.85rem' }}>Tax List <strong>Not Found</strong></Box>)
                        : (<Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead><tr style={{ background: '#f5f7fa' }}>{['#', 'Name', 'Type', 'Value', 'Default', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>)}</tr></thead>
                                <tbody>{taxes.map((t, i) => (
                                    <tr key={t._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.name}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{t.percentageType}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{t.percentageValue}{t.percentageType === 'Percentage' ? '%' : ''}</td>
                                        <td style={{ padding: '8px 12px' }}>{t.isDefault ? <Box sx={{ color: '#667eea', fontWeight: 700, fontSize: '0.75rem' }}>✔ Default</Box> : '—'}</td>
                                        <td style={{ padding: '8px 12px' }}><Box sx={{ display: 'inline-flex', px: 1, py: 0.25, borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, bgcolor: t.status ? '#e8f5e9' : '#ffebee', color: t.status ? '#2e7d32' : '#c62828' }}>{t.status ? 'Active' : 'Inactive'}</Box></td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <IconButton size="small" onClick={() => { setTax({ name: t.name, percentageType: t.percentageType, percentageValue: t.percentageValue, isDefault: t.isDefault, status: t.status }); setEditId(t._id || null); }} sx={{ color: '#667eea', mr: 0.5 }}>
                                                <Pencil size={14} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => t._id && deleteMutation.mutate(t._id)}><Trash2 size={16} /></IconButton>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </Box>)}
            </Paper>
        </Box>
    );
};

// ─── Add Multi Firm Sub-component ─────────────────────────────────────────────────
const MF_BLANK: IMultiFirmData = {
    firmName: '', shortName: '', address: '', country: 'India', state: '', city: '', postalCode: '',
    mobile: '', phoneL: '', email: '', firmType: '', bankName: '', bankBranch: '',
    accountHolderName: '', accountNumber: '', ifscCode: '', ibanNo: '', swiftCode: '', micrCode: '',
    panNumber: '', gstin: '', licenceNo: '', licenceAuthority: '', invoicePrefix: 'INV-', status: true,
    extraField1: '', extraField2: '', extraField3: '', extraField4: '', extraField5: '', extraField6: '', extraField7: '',
    supportEmails: '', supportMobile: '', showLogo: true,
};

const AddMultiFirmTab: React.FC<{ toast: (msg: string, sev?: 'success' | 'error' | 'info') => void }> = ({ toast }) => {
    const queryClient = useQueryClient();
    const [mf, setMf] = useState<IMultiFirmData>(MF_BLANK);
    const [editId, setEditId] = useState<string | null>(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [signLoading, setSignLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { data: firms = [], isLoading } = useQuery<IMultiFirmData[]>({
        queryKey: ['multiFirms'], queryFn: firmService.getMultiFirms,
    });

    const deleteMutation = useMutation({
        mutationFn: firmService.deleteMultiFirm,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['multiFirms'] }); toast('Firm deleted'); },
        onError: () => toast('Delete failed', 'error'),
    });

    const mff = (field: keyof IMultiFirmData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setMf(p => ({ ...p, [field]: e.target.value }));
    const mfsel = (field: keyof IMultiFirmData) => (e: { target: { value: unknown } }) =>
        setMf(p => ({ ...p, [field]: e.target.value }));

    const handleSave = async () => {
        if (!mf.firmName) { toast('Firm Name is required', 'error'); return; }
        setSaving(true);
        try {
            if (editId) { await firmService.updateMultiFirm(editId, mf); toast('Firm updated!'); }
            else { await firmService.createMultiFirm(mf); toast('Firm added!'); }
            queryClient.invalidateQueries({ queryKey: ['multiFirms'] });
            setMf(MF_BLANK); setEditId(null);
        } catch { toast('Save failed', 'error'); } finally { setSaving(false); }
    };

    const handleLogo = async (file: File) => {
        if (!editId) { toast('Save the firm first before uploading logo', 'info'); return; }
        setLogoLoading(true);
        try { const r = await firmService.uploadMultiFirmLogo(editId, file); setMf(p => ({ ...p, logoUrl: r.logoUrl })); toast('Logo uploaded!'); }
        catch { toast('Logo upload failed', 'error'); } finally { setLogoLoading(false); }
    };
    const handleSign = async (file: File) => {
        if (!editId) { toast('Save the firm first before uploading sign', 'info'); return; }
        setSignLoading(true);
        try { const r = await firmService.uploadMultiFirmSign(editId, file); setMf(p => ({ ...p, signImageUrl: r.signImageUrl })); toast('Sign uploaded!'); }
        catch { toast('Sign upload failed', 'error'); } finally { setSignLoading(false); }
    };

    return (
        <Box>
            <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', lg: 'row' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <SectionHead icon={<Building2 size={16} />} title="Basic Form" />
                            <Row label="Firm Name *"><TextField value={mf.firmName} onChange={mff('firmName')} fullWidth {...sx} /></Row>
                            <Row label="Short Name *"><TextField value={mf.shortName || ''} onChange={mff('shortName')} fullWidth {...sx} /></Row>
                            <Row label="Address *"><TextField value={mf.address || ''} onChange={mff('address')} fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} /></Row>
                            <Row label="Country *"><Select value={mf.country || ''} onChange={mfsel('country')} fullWidth displayEmpty {...selSx}>{COUNTRY_LIST.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{c}</MenuItem>)}</Select></Row>
                            <Row label="State *"><Select value={mf.state || ''} onChange={mfsel('state')} fullWidth displayEmpty {...selSx}><MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a State...</em></MenuItem>{STATE_LIST.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem' }}>{s}</MenuItem>)}</Select></Row>
                            <Row label="City *"><Select value={mf.city || ''} onChange={mfsel('city')} fullWidth displayEmpty {...selSx}><MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a City...</em></MenuItem>{CITY_LIST.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{c}</MenuItem>)}</Select></Row>
                            <Row label="Postal Code"><TextField value={mf.postalCode || ''} onChange={mff('postalCode')} fullWidth {...sx} /></Row>
                            <Row label="Mobile Number *"><TextField value={mf.mobile || ''} onChange={mff('mobile')} fullWidth {...sx} /></Row>
                            <Row label="Phone(L)"><TextField value={mf.phoneL || ''} onChange={mff('phoneL')} fullWidth {...sx} /></Row>
                            <Row label="Email *"><TextField value={mf.email || ''} onChange={mff('email')} type="email" fullWidth {...sx} /></Row>
                            <Row label="Firm Type *"><Select value={mf.firmType || ''} onChange={mfsel('firmType')} fullWidth displayEmpty {...selSx}><MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a Firm Type...</em></MenuItem>{FIRM_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>{t}</MenuItem>)}</Select></Row>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <SectionHead icon={<Building2 size={16} />} title="Bank Detail" />
                            <Row label="Bank Name *"><TextField value={mf.bankName || ''} onChange={mff('bankName')} fullWidth {...sx} /></Row>
                            <Row label="Bank Branch *"><TextField value={mf.bankBranch || ''} onChange={mff('bankBranch')} fullWidth {...sx} /></Row>
                            <Row label="Account Holder Name *"><TextField value={mf.accountHolderName || ''} onChange={mff('accountHolderName')} fullWidth {...sx} /></Row>
                            <Row label="Bank A/C No *"><TextField value={mf.accountNumber || ''} onChange={mff('accountNumber')} fullWidth {...sx} /></Row>
                            <Row label="Bank IFS Code"><TextField value={mf.ifscCode || ''} onChange={mff('ifscCode')} fullWidth {...sx} /></Row>
                            <Row label="IBAN No."><TextField value={mf.ibanNo || ''} onChange={mff('ibanNo')} fullWidth {...sx} /></Row>
                            <Row label="SWIFT Code"><TextField value={mf.swiftCode || ''} onChange={mff('swiftCode')} fullWidth {...sx} /></Row>
                            <Row label="MICR Code"><TextField value={mf.micrCode || ''} onChange={mff('micrCode')} fullWidth {...sx} /></Row>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <SectionHead title="Support team detail" />
                            <Row label="Email *"><TextField value={mf.supportEmails || ''} onChange={mff('supportEmails')} fullWidth {...sx} helperText={<span style={{ color: '#ef4444', fontSize: '0.72rem' }}><strong>NOTE!</strong> Separate multiple Email with "," (Comma)</span>} /></Row>
                            <Row label="Mobile Number *"><TextField value={mf.supportMobile || ''} onChange={mff('supportMobile')} fullWidth {...sx} /></Row>
                        </Paper>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography fontSize="0.82rem" fontWeight={700} color="#444">Firm Logo Display</Typography>
                                <FormControlLabel
                                    control={<Switch size="small" checked={mf.showLogo !== false} onChange={(e) => setMf(p => ({ ...p, showLogo: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />}
                                    label={<Typography fontSize="0.75rem" fontWeight={600} color={mf.showLogo !== false ? 'primary' : 'text.secondary'}>{mf.showLogo !== false ? 'ON' : 'OFF'}</Typography>}
                                />
                            </Box>
                            <ImgBox label="Firm Logo" url={mf.logoUrl} onUpload={handleLogo} onRemove={() => setMf(p => ({ ...p, logoUrl: '' }))} loading={logoLoading} />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <SectionHead title="Other Detail" />
                            <Row label="PAN No"><TextField value={mf.panNumber || ''} onChange={mff('panNumber')} fullWidth {...sx} /></Row>
                            <Row label="GSTIN"><TextField value={mf.gstin || ''} onChange={mff('gstin')} fullWidth {...sx} /></Row>
                            <Row label="Licence No"><TextField value={mf.licenceNo || ''} onChange={mff('licenceNo')} fullWidth {...sx} /></Row>
                            <Row label="Licence Authority"><TextField value={mf.licenceAuthority || ''} onChange={mff('licenceAuthority')} fullWidth {...sx} /></Row>
                            <Row label="Invoice Prefix *"><TextField value={mf.invoicePrefix || ''} onChange={mff('invoicePrefix')} fullWidth {...sx} /></Row>
                            <Row label="Status">
                                <FormControlLabel
                                    control={<Switch size="small" checked={mf.status ?? true} onChange={(e) => setMf(p => ({ ...p, status: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />}
                                    label={<Typography fontSize="0.8rem" fontWeight={600} color={mf.status ? 'primary' : 'text.secondary'}>{mf.status ? 'Active' : 'Inactive'}</Typography>}
                                />
                            </Row>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f7fa', px: 1.5, py: 0.75, borderRadius: '8px', mb: 1.5, border: '1px solid #e8ecf0' }}>
                                <Typography fontSize="0.82rem" fontWeight={700} color="#444">Extra Fields</Typography>
                                <Tooltip title="Custom fields for this firm"><Info size={14} color="#aaa" /></Tooltip>
                            </Box>
                            {([1, 2, 3, 4, 5, 6, 7] as const).map(n => (
                                <Row key={n} label={`Field ${n}`}><TextField value={(mf as unknown as Record<string, string>)[`extraField${n}`] || ''} onChange={mff(`extraField${n}` as keyof IMultiFirmData)} fullWidth {...sx} /></Row>
                            ))}
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}><ImgBox label="Firm Sign" url={mf.signImageUrl} onUpload={handleSign} onRemove={() => setMf(p => ({ ...p, signImageUrl: '' }))} loading={signLoading} /></Paper>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                    <CommonButton variant="contained" size="small" onClick={handleSave} loading={saving}
                        sx={{ boxShadow: 'none' }}>
                        Save
                    </CommonButton>
                    <CommonButton variant="outlined" size="small" color="error" onClick={() => { setMf(MF_BLANK); setEditId(null); }}
                        sx={{ borderRadius: '8px', px: 4 }}>Cancel</CommonButton>
                </Box>
            </Paper>
            <Paper sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Building2 size={16} /><Typography fontWeight={700} fontSize="0.875rem">Multi Firm List</Typography></Box>
                    <CommonButton size="small" variant="contained" startIcon={<Plus size={18} />} onClick={() => { setMf(MF_BLANK); setEditId(null); }}
                        sx={{ bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4338ca' }, borderRadius: '8px', fontSize: '0.78rem', boxShadow: 'none' }}>Add New</CommonButton>
                </Box>
                {isLoading ? (<Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>)
                    : firms.length === 0 ? (<Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.85rem' }}>Firm Not Found</Box>)
                        : (<Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead><tr style={{ background: '#f5f7fa' }}>{['#', 'Firm Name', 'Type', 'City', 'Mobile', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>)}</tr></thead>
                                <tbody>{firms.map((firm, i) => (
                                    <tr key={firm._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{i + 1}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{firm.firmName}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{firm.firmType || '—'}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{firm.city || '—'}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{firm.mobile || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}><Box sx={{ display: 'inline-flex', px: 1, py: 0.25, borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, bgcolor: firm.status ? '#e8f5e9' : '#ffebee', color: firm.status ? '#2e7d32' : '#c62828' }}>{firm.status ? 'Active' : 'Inactive'}</Box></td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <IconButton size="small" onClick={() => { setMf({ ...MF_BLANK, ...firm }); setEditId(firm._id || null); }} sx={{ color: '#667eea', mr: 0.5 }}>
                                                <Pencil size={14} />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => firm._id && deleteMutation.mutate(firm._id)}><Trash2 size={16} /></IconButton>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </Box>)}
            </Paper>
        </Box>
    );
};

// ─── Partners Sub-component ───────────────────────────────────────────────────
const PARTNER_BLANK = { name: '', designation: 'Partner', icaiMembershipNo: '', joiningDate: '', status: true, signatureImageUrl: '' };

const PartnersTab: React.FC<{
    partners: import('../../services/firmService').IPartner[];
    onUpdate: (partners: import('../../services/firmService').IPartner[]) => void;
    toast: (msg: string, sev?: 'success' | 'error' | 'info') => void;
}> = ({ partners, onUpdate, toast }) => {
    const [curr, setCurr] = useState(PARTNER_BLANK);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleAdd = () => {
        if (!curr.name) { toast('Partner Name is required', 'error'); return; }
        const newArr = [...partners];
        if (editIdx !== null) newArr[editIdx] = { ...curr } as import('../../services/firmService').IPartner;
        else newArr.push({ ...curr } as import('../../services/firmService').IPartner);
        onUpdate(newArr);
        setCurr(PARTNER_BLANK);
        setEditIdx(null);
    };

    const handleSignUpload = async (file: File) => {
        setUploading(true);
        try {
            const r = await firmService.uploadAsset(file);
            setCurr(p => ({ ...p, signatureImageUrl: r.url }));
            toast('Partner signature uploaded!');
        } catch { toast('Upload failed', 'error'); }
        finally { setUploading(false); }
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: '8px' }}>
                <Typography fontSize="0.9rem" fontWeight={700} color="#444" mb={2}>{editIdx !== null ? 'Edit Partner' : 'Add New Partner'}</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Row label="Full Name*"><TextField value={curr.name} onChange={(e) => setCurr(p => ({ ...p, name: e.target.value }))} fullWidth {...sx} /></Row>
                        <Row label="Designation*"><TextField value={curr.designation} onChange={(e) => setCurr(p => ({ ...p, designation: e.target.value }))} fullWidth {...sx} /></Row>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Row label="ICAI Mem. No."><TextField value={curr.icaiMembershipNo} onChange={(e) => setCurr(p => ({ ...p, icaiMembershipNo: e.target.value }))} fullWidth {...sx} /></Row>
                        <Row label="Joining Date"><TextField type="date" value={curr.joiningDate ? curr.joiningDate.split('T')[0] : ''} onChange={(e) => setCurr(p => ({ ...p, joiningDate: e.target.value }))} fullWidth {...sx} InputLabelProps={{ shrink: true }} /></Row>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ border: '1px dashed #ccc', p: 1, borderRadius: '8px', textAlign: 'center', bgcolor: '#fafafa', position: 'relative' }}>
                            <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>Partner Signature</Typography>
                            {uploading ? <CircularProgress size={20} /> : curr.signatureImageUrl ? (
                                <Box component="img" src={curr.signatureImageUrl} alt={`Partner signature - ${curr.name}`} sx={{ height: 40, width: 'auto', mb: 0.5, objectFit: 'contain' }} />
                            ) : <Camera size={24} color="#ccc" />}
                            <CommonButton component="label" size="small" variant="outlined" sx={{ py: 0, px: 1, fontSize: '0.7rem', display: 'block', mx: 'auto', mt: 0.5 }}>
                                {curr.signatureImageUrl ? 'Change' : 'Upload'}
                                <input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSignUpload(f); }} />
                            </CommonButton>
                        </Box>
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3 }}>
                    <CommonButton variant="contained" size="small" onClick={handleAdd}
                        sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', borderRadius: '8px', px: 4 }}>
                        {editIdx !== null ? 'Update Partner' : 'Add to List'}
                    </CommonButton>
                    {editIdx !== null && <CommonButton variant="outlined" size="small" onClick={() => { setCurr(PARTNER_BLANK); setEditIdx(null); }}>Cancel</CommonButton>}
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Building2 size={16} />
                    <Typography fontWeight={700} fontSize="0.875rem">Firm Partners List</Typography>
                </Box>
                {partners.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>No partners added yet.</Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead><tr style={{ background: '#f5f7fa' }}>{['#', 'Name', 'Designation', 'Membership No', 'Signature', 'Action'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>)}</tr></thead>
                            <tbody>
                                {partners.map((p, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '8px 12px', color: '#888' }}>{idx + 1}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{p.name}</td>
                                        <td style={{ padding: '8px 12px', color: '#555' }}>{p.designation}</td>
                                        <td style={{ padding: '8px 12px', color: '#666' }}>{p.icaiMembershipNo || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            {p.signatureImageUrl ? <img src={p.signatureImageUrl} style={{ height: 24, objectFit: 'contain' }} alt="sign" /> : '—'}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <IconButton 
                                                aria-label={`Edit partner ${p.name}`}
                                                size="small" 
                                                onClick={() => { setCurr({ ...PARTNER_BLANK, ...p }); setEditIdx(idx); }} 
                                                sx={{ color: '#667eea', mr: 0.5 }}
                                            >
                                                <Pencil size={14} />
                                            </IconButton>
                                            <IconButton 
                                                aria-label={`Delete partner ${p.name}`}
                                                size="small" 
                                                color="error" 
                                                onClick={() => onUpdate(partners.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                )}
            </Paper>
            <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Note: Changes made here must be saved using the main 'Save' button to be permanent.</Typography>
            </Box>
        </Box>
    );
};


export const FirmMasterPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState(0);
    const [form, setForm] = useState<FirmMasterData>(BLANK);
    const [fieldModal, setFieldModal] = useState(false);
    const [previewModal, setPreviewModal] = useState<{ open: boolean; template: string }>({ open: false, template: 'template1' });
    const [logoLoading, setLogoLoading] = useState(false);
    const [sigLoading, setSigLoading] = useState(false);
    const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'info' }>({ open: false, msg: '', sev: 'success' });

    const toast = (msg: string, sev: 'success' | 'error' | 'info' = 'success') => setSnack({ open: true, msg, sev });

    const { data: firm, isLoading } = useQuery<FirmMasterData>({ queryKey: ['firm'], queryFn: firmService.getFirm });

    useEffect(() => { if (firm) setForm({ ...BLANK, ...firm }); }, [firm]);

    const saveMutation = useMutation({
        mutationFn: firmService.updateFirm,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['firm'] }); toast('Firm details saved successfully!'); setFieldModal(false); },
        onError: () => toast('Failed to save. Please try again.', 'error'),
    });

    const f = (field: keyof FirmMasterData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [field]: e.target.value }));

    const updateLabel = (index: number, value: string) => {
        setForm(p => {
            const labels = [...(p.extraFieldLabels || ['', '', '', '', '', '', ''])];
            labels[index] = value;
            return { ...p, extraFieldLabels: labels };
        });
    };
    const sel = (field: keyof FirmMasterData) => (e: { target: { value: unknown } }) =>
        setForm(p => ({ ...p, [field]: e.target.value }));


    const handleLogo = async (file: File) => { setLogoLoading(true); try { const r = await firmService.uploadLogo(file); setForm(p => ({ ...p, logoUrl: r.logoUrl })); toast('Logo uploaded!'); } catch { toast('Logo upload failed', 'error'); } finally { setLogoLoading(false); } };
    const handleSig = async (file: File) => { setSigLoading(true); try { const r = await firmService.uploadSignature(file); setForm(p => ({ ...p, signatureImageUrl: r.stampImageUrl })); toast('Signature uploaded!'); } catch { toast('Signature upload failed', 'error'); } finally { setSigLoading(false); } };

    const handleAutoHours = (delta: number) => setForm(p => ({ ...p, autoCloseHours: Math.max(1, (p.autoCloseHours || 10) + delta) }));

    if (isLoading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2, flexDirection: 'column' }}>
            <CircularProgress sx={{ color: '#667eea' }} />
            <Typography color="text.secondary" fontSize="0.9rem">Loading firm details...</Typography>
        </Box>
    );

    const tabs = ['Firm Info', 'Partners', 'Firm Documents', 'Add Multi Firm', 'Tax Detail', 'Currency', 'Invoice'];

    return (
        <Box sx={{ p: { xs: 1, sm: 2 }, overflowX: 'hidden' }}>
            {/* Header */}
            <Paper sx={{ mb: 2, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Box sx={{ 
                    bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', 
                    color: '#1e293b', 
                    px: { xs: 1.5, sm: 2.5 }, 
                    py: 1.5, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1.5, sm: 0 }
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, width: 36, height: 36 }}><Building2 size={16} /></Avatar>
                        <Typography fontWeight={700} fontSize="1.05rem">Firm Master</Typography>
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        width: { xs: '100%', sm: 'auto' },
                        flexWrap: 'wrap'
                    }}>
                        <CommonButton variant="contained" size="small"
                            onClick={() => setFieldModal(true)}
                            sx={{ 
                                bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, 
                                borderRadius: '8px', 
                                boxShadow: 'none', 
                                fontWeight: 700, 
                                fontSize: '0.82rem',
                                flex: { xs: 1, sm: 'none' },
                                whiteSpace: 'nowrap'
                            }}>
                            Field Master
                        </CommonButton>
                        <CommonButton variant="contained" size="small" startIcon={saveMutation.isPending ? null : <Save size={16} />}
                            onClick={() => { if (!form.firmName) { toast('Firm Name is required', 'error'); return; } saveMutation.mutate(form); }}
                            loading={saveMutation.isPending}
                            sx={{ 
                                borderRadius: '8px', 
                                boxShadow: 'none', 
                                fontWeight: 700, 
                                fontSize: '0.82rem',
                                flex: { xs: 1, sm: 'none' }
                            }}>
                            Save
                        </CommonButton>
                        <CommonButton variant="outlined" size="small"
                            onClick={() => firm && setForm({ ...BLANK, ...firm })}
                            sx={{ 
                                bgcolor: 'transparent', 
                                color: '#6366f1', 
                                borderColor: '#6366f1', 
                                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)', borderColor: '#4f46e5' }, 
                                borderRadius: '8px', 
                                fontWeight: 700, 
                                fontSize: '0.82rem',
                                flex: { xs: 1, sm: 'none' }
                            }}>
                            Cancel
                        </CommonButton>
                    </Box>
                </Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{ px: 1, bgcolor: '#fff', borderBottom: '1px solid #eee', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: 40, py: 0.5 }, '& .Mui-selected': { color: '#667eea' }, '& .MuiTabs-indicator': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, height: 3 } }}>
                    {tabs.map((t, i) => <Tab key={i} label={t} />)}
                </Tabs>
            </Paper>

            {tab === 0 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexDirection: { xs: 'column', lg: 'row' }, width: '100%', minWidth: 0 }}>
                        {/* LEFT COLUMN */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead icon={<Building2 size={16} />} title="Basic Form" />
                                <Row label="Firm Name*" htmlFor="firm-name"><TextField id="firm-name" value={form.firmName} onChange={f('firmName')} fullWidth {...sx} /></Row>
                                <Row label="Short Name*" htmlFor="short-name"><TextField id="short-name" value={form.shortName || ''} onChange={f('shortName')} fullWidth {...sx} /></Row>
                                <Row label="Address*" htmlFor="address">
                                    <TextField id="address" value={form.address || ''} onChange={f('address')} fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }} />
                                </Row>
                                <Row label="Country*" htmlFor="country">
                                    <Select id="country" value={form.country || ''} onChange={sel('country')} fullWidth displayEmpty {...selSx}>
                                        <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a Country...</em></MenuItem>
                                        {COUNTRY_LIST.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{c}</MenuItem>)}
                                    </Select>
                                </Row>
                                <Row label="State*" htmlFor="state">
                                    <Select id="state" value={form.state || ''} onChange={sel('state')} fullWidth displayEmpty {...selSx}>
                                        <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a State...</em></MenuItem>
                                        {STATE_LIST.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem' }}>{s}</MenuItem>)}
                                    </Select>
                                </Row>
                                <Row label="City*" htmlFor="city">
                                    <Select id="city" value={form.city || ''} onChange={sel('city')} fullWidth displayEmpty {...selSx}>
                                        <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a City...</em></MenuItem>
                                        {CITY_LIST.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{c}</MenuItem>)}
                                    </Select>
                                </Row>
                                <Row label="Postal Code" htmlFor="postal-code"><TextField id="postal-code" value={form.postalCode || ''} onChange={f('postalCode')} fullWidth {...sx} /></Row>
                                <Row label="Mobile Number*" htmlFor="mobile"><TextField id="mobile" value={form.mobile || ''} onChange={f('mobile')} fullWidth {...sx} /></Row>
                                <Row label="Email*" htmlFor="email"><TextField id="email" value={form.email || ''} onChange={f('email')} type="email" fullWidth {...sx} /></Row>
                                <Row label="Phone(L)" htmlFor="phone-l"><TextField id="phone-l" value={form.phoneL || ''} onChange={f('phoneL')} fullWidth {...sx} /></Row>
                                <Row label="Firm Type*" htmlFor="firm-type">
                                    <Select id="firm-type" value={form.firmType || ''} onChange={sel('firmType')} fullWidth displayEmpty {...selSx}>
                                        <MenuItem value="" disabled><em style={{ color: '#aaa', fontSize: '0.82rem' }}>Choose a Firm Type...</em></MenuItem>
                                        {FIRM_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>{t}</MenuItem>)}
                                    </Select>
                                </Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead icon={<Building2 size={16} />} title="Bank Detail" />
                                <Row label="Bank Name*"><TextField value={form.bankName || ''} onChange={f('bankName')} fullWidth {...sx} /></Row>
                                <Row label="Bank Branch*"><TextField value={form.bankBranch || ''} onChange={f('bankBranch')} fullWidth {...sx} /></Row>
                                <Row label="Account Holder Name*"><TextField value={form.accountHolderName || ''} onChange={f('accountHolderName')} fullWidth {...sx} /></Row>
                                <Row label="Bank A/C No*"><TextField value={form.accountNumber || ''} onChange={f('accountNumber')} fullWidth {...sx} /></Row>
                                <Row label="Bank IFS Code"><TextField value={form.ifscCode || ''} onChange={f('ifscCode')} fullWidth {...sx} /></Row>
                                <Row label="IBAN No."><TextField value={form.ibanNo || ''} onChange={f('ibanNo')} fullWidth {...sx} /></Row>
                                <Row label="Swift Code"><TextField value={form.swiftCode || ''} onChange={f('swiftCode')} fullWidth {...sx} /></Row>
                                <Row label="Micr Code"><TextField value={form.micrCode || ''} onChange={f('micrCode')} fullWidth {...sx} /></Row>
                                <Row label="PAN No*"><TextField value={form.panNumber || ''} onChange={f('panNumber')} fullWidth {...sx} inputProps={{ style: { textTransform: 'uppercase' } }} /></Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Other Details" />
                                <Row label="Firm Zone">
                                    <Select value={form.firmZone || ''} onChange={sel('firmZone')} fullWidth displayEmpty {...selSx}>
                                        {ZONES.map(z => <MenuItem key={z} value={z} sx={{ fontSize: '0.8rem' }}>{z}</MenuItem>)}
                                    </Select>
                                </Row>
                                <Row label="Client Code Prefix*"><TextField value={form.clientCodePrefix || ''} onChange={f('clientCodePrefix')} fullWidth {...sx} /></Row>
                                <Row label="Invoice Prefix*"><TextField value={form.invoicePrefix || ''} onChange={f('invoicePrefix')} fullWidth {...sx} /></Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Invoice & Daily Report Email ID" />
                                <Row label="Email*">
                                    <TextField value={form.invoiceEmails || ''} onChange={f('invoiceEmails')} fullWidth {...sx} helperText={<span style={{ color: '#ef4444', fontSize: '0.72rem' }}><strong>NOTE!</strong> Separate multiple Email with "," (Comma)</span>} />
                                </Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Support Detail" />
                                <Row label="Email*">
                                    <TextField value={form.supportEmails || ''} onChange={f('supportEmails')} fullWidth {...sx} helperText={<span style={{ color: '#ef4444', fontSize: '0.72rem' }}><strong>NOTE!</strong> Separate multiple Email with "," (Comma)</span>} />
                                </Row>
                                <Row label="Mobile Number*"><TextField value={form.supportMobile || ''} onChange={f('supportMobile')} fullWidth {...sx} /></Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Timer Auto Close" />
                                <Row label="Auto Close Hours" htmlFor="auto-close">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton
                                            aria-label="Increase auto close hours"
                                            size="small"
                                            onClick={() => handleAutoHours(1)}
                                            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', borderRadius: '8px', width: 28, height: 28 }}
                                        >
                                            <Plus size={16} />
                                        </IconButton>
                                        <TextField
                                            id="auto-close"
                                            value={form.autoCloseHours ?? 10}
                                            onChange={(e) => setForm(p => ({ ...p, autoCloseHours: parseInt(e.target.value) || 10 }))}
                                            size="small"
                                            type="number"
                                            sx={{ width: 70, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } }}
                                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                        />
                                        <IconButton
                                            aria-label="Decrease auto close hours"
                                            size="small"
                                            onClick={() => handleAutoHours(-1)}
                                            sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '8px', '&:hover': { bgcolor: '#dc2626' }, width: 28, height: 28 }}
                                        >
                                            <Minus size={16} />
                                        </IconButton>
                                    </Box>
                                </Row>
                            </Paper>
                        </Box>

                        {/* RIGHT COLUMN */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography fontSize="0.82rem" fontWeight={700} color="#444">Firm Logo Display</Typography>
                                    <FormControlLabel
                                        control={<Switch size="small" checked={form.showLogo !== false} onChange={(e) => setForm(p => ({ ...p, showLogo: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />}
                                        label={<Typography fontSize="0.75rem" fontWeight={600} color={form.showLogo !== false ? 'primary' : 'text.secondary'}>{form.showLogo !== false ? 'ON' : 'OFF'}</Typography>}
                                    />
                                </Box>
                                <ImgBox label="Firm Logo" url={form.logoUrl} onUpload={handleLogo} onRemove={() => setForm(p => ({ ...p, logoUrl: '' }))} loading={logoLoading} />
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Registration Detail" />
                                <Row label="GSTIN"><TextField value={form.gstin || ''} onChange={f('gstin')} fullWidth {...sx} /></Row>
                                <Row label="Membership No"><TextField value={form.membershipNo || ''} onChange={f('membershipNo')} fullWidth {...sx} /></Row>
                                <Row label="Membership Date"><TextField value={form.membershipDate ? form.membershipDate.split('T')[0] : ''} onChange={f('membershipDate')} type="date" fullWidth {...sx} InputLabelProps={{ shrink: true }} /></Row>
                                <Row label="FRN No"><TextField value={form.frnNo || ''} onChange={f('frnNo')} fullWidth {...sx} /></Row>
                                <Row label="FRN Date"><TextField value={form.frnDate ? form.frnDate.split('T')[0] : ''} onChange={f('frnDate')} type="date" fullWidth {...sx} InputLabelProps={{ shrink: true }} /></Row>
                                <Row label="Licence No"><TextField value={form.licenceNo || ''} onChange={f('licenceNo')} fullWidth {...sx} /></Row>
                                <Row label="Licence Authority"><TextField value={form.licenceAuthority || ''} onChange={f('licenceAuthority')} fullWidth {...sx} /></Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
                                <SectionHead title="Social Networking Detail" />
                                <Row label="Web Address"><TextField value={form.website || ''} onChange={f('website')} fullWidth {...sx} placeholder="https://..." /></Row>
                                <Row label="Facebook"><TextField value={form.facebook || ''} onChange={f('facebook')} fullWidth {...sx} /></Row>
                                <Row label="Twitter"><TextField value={form.twitter || ''} onChange={f('twitter')} fullWidth {...sx} /></Row>
                                <Row label="Google +"><TextField value={form.googlePlus || ''} onChange={f('googlePlus')} fullWidth {...sx} /></Row>
                                <Row label="PMS App URL"><TextField value={form.pmsAppUrl || ''} onChange={f('pmsAppUrl')} fullWidth {...sx} /></Row>
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f5f7fa', px: 1.5, py: 0.75, borderRadius: '8px', mb: 1.5, border: '1px solid #e8ecf0' }}>
                                    <Typography fontSize="0.82rem" fontWeight={700} color="#444">Extra Fields</Typography>
                                    <Tooltip title="These fields can be used for custom firm data. Click 'Field Master' in the header to name these fields."><Info size={14} color="#aaa" style={{ cursor: 'pointer' }} /></Tooltip>
                                </Box>
                                {([1, 2, 3, 4, 5, 6, 7] as const).map((n, i) => (
                                    <Row key={n} label={(form.extraFieldLabels && form.extraFieldLabels[i]) || `Field ${n}`}>
                                        <TextField value={(form as unknown as Record<string, string>)[`extraField${n}`] || ''} onChange={f(`extraField${n}` as keyof FirmMasterData)} fullWidth {...sx} />
                                    </Row>
                                ))}
                            </Paper>

                            <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: '8px' }}>
                                <ImgBox label="Firm Signature" url={form.signatureImageUrl} onUpload={handleSig} onRemove={() => setForm(p => ({ ...p, signatureImageUrl: '' }))} loading={sigLoading} />
                            </Paper>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* ── TAB 1: Partners ── */}
            {tab === 1 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <PartnersTab
                        partners={form.partners || []}
                        onUpdate={(p) => setForm(prev => ({ ...prev, partners: p }))}
                        toast={toast}
                    />
                </Paper>
            )}

            {/* ── TAB 2: Firm Documents ── */}
            {tab === 2 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <FirmDocumentsTab toast={toast} />
                </Paper>
            )}


            {/* ── TAB 3: Add Multi Firm ── */}
            {tab === 3 && <AddMultiFirmTab toast={toast} />}


            {/* ── TAB 4: Tax Detail ── */}
            {tab === 4 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <TaxDetailTab toast={toast} />
                </Paper>
            )}


            {/* ── TAB 5: Currency ── */}
            {tab === 5 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <CurrencyTab toast={toast} />
                </Paper>
            )}


            {/* ── TAB 6: Invoice ── */}
            {tab === 6 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px', maxWidth: 800 }}>
                        <SectionHead icon={<Receipt size={16} />} title="Invoice Settings" />
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Row label="Invoice Prefix *"><TextField value={form.invoicePrefix || ''} onChange={f('invoicePrefix')} placeholder="e.g. INV-" fullWidth {...sx} /></Row>
                                <Row label="Client Code Prefix"><TextField value={form.clientCodePrefix || ''} onChange={f('clientCodePrefix')} placeholder="e.g. CA" fullWidth {...sx} /></Row>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Row label="Invoice Email(s)">
                                    <TextField value={form.invoiceEmails || ''} onChange={f('invoiceEmails')} fullWidth {...sx}
                                        helperText={<span style={{ color: '#ef4444', fontSize: '0.72rem' }}><strong>NOTE!</strong> Separate multiple Email with "," (Comma)</span>} />
                                </Row>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <SectionHead title="Choose Bill Format (Template)" />
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            Select a premium layout for your tax invoices. Each template is optimized for clarity and professionalism.
                        </Typography>

                        <RadioGroup
                            value={form.invoiceTemplate || 'template1'}
                            onChange={(e) => setForm(p => ({ ...p, invoiceTemplate: e.target.value }))}
                        >
                            <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            mt: 2, 
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                        }}>
                                {[
                                    { id: 'template1', name: 'Classic Professional', desc: 'Detailed, formal layout' },
                                    { id: 'template2', name: 'Modern Minimalist', desc: 'Clean, sleek design' },
                                    { id: 'template3', name: 'Midnight Minimalist', desc: 'Bold, slate-themed layout' },
                                    { id: 'template4', name: 'Royal Gold', desc: 'Elegant indigo & gold accents' }
                                ].map((t) => (
                                    <Box
                                        key={t.id}
                                        onClick={() => setForm(p => ({ ...p, invoiceTemplate: t.id }))}
                                        sx={{
                                            width: 220, cursor: 'pointer', position: 'relative',
                                            borderRadius: '12px', overflow: 'hidden', border: '3px solid',
                                            borderColor: form.invoiceTemplate === t.id ? '#667eea' : '#eef2f6',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': { transform: 'scale(1.02)', boxShadow: '0 12px 24px rgba(0,0,0,0.12)' },
                                            bgcolor: 'white'
                                        }}
                                    >
                                        <Box sx={{ height: 280, bgcolor: t.id === 'template1' ? '#fcfdff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1.5, position: 'relative' }}>
                                            <Box sx={{
                                                width: '100%', height: '100%', bgcolor: 'white', borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: 1.5,
                                                display: 'flex', flexDirection: 'column', border: '1px solid #f0f2f5'
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                    <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: '#e2e8f0' }} />
                                                    <Box sx={{ width: '40%', height: 12, bgcolor: '#f1f5f9', borderRadius: '8px' }} />
                                                </Box>
                                                <Box sx={{ height: 8, bgcolor: '#f1f5f9', width: '100%', borderRadius: '8px', mb: 0.5 }} />
                                                <Box sx={{ height: 8, bgcolor: '#f1f5f9', width: '90%', borderRadius: '8px', mb: 1.5 }} />

                                                <Box sx={{ flex: 1, borderTop: '1px solid #f1f5f9', pt: 1 }}>
                                                    {[1, 2, 3].map(i => (
                                                        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.8 }}>
                                                            <Box sx={{ flex: 1, height: 6, bgcolor: '#f1f5f9', borderRadius: '8px' }} />
                                                            <Box sx={{ width: 30, height: 6, bgcolor: '#f1f5f9', borderRadius: '8px' }} />
                                                        </Box>
                                                    ))}
                                                </Box>

                                                <Box sx={{ mt: 'auto', borderTop: '2px solid #f1f5f9', pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Box sx={{ 
                                                        width: '50%', 
                                                        height: 15, 
                                                        bgcolor: t.id === 'template2' ? '#667eea' : 
                                                                 t.id === 'template3' ? '#1e293b' : 
                                                                 t.id === 'template4' ? '#4338ca' : '#cbd5e1', 
                                                        borderRadius: '8px', 
                                                        opacity: 0.8,
                                                        border: t.id === 'template4' ? '1px solid #b45309' : 'none'
                                                    }} />
                                                </Box>
                                            </Box>

                                            <CommonButton
                                                size="small"
                                                variant="contained"
                                                onClick={(e) => { e.stopPropagation(); setPreviewModal({ open: true, template: t.id }); }}
                                                sx={{
                                                    position: 'absolute', bottom: 10, bgcolor: 'rgba(255,255,255,0.95)', color: '#667eea',
                                                    '&:hover': { bgcolor: 'white' }, borderRadius: '8px',
                                                    fontWeight: 700, fontSize: '0.7rem', px: 1, py: 0.2, backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                Preview
                                            </CommonButton>

                                            {form.invoiceTemplate === t.id && (
                                                <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', borderRadius: '50%', p: 0.3, boxShadow: '0 2px 8px rgba(102,126,234,0.4)' }}>
                                                    <Check size={18} />
                                                </Box>
                                            )}
                                        </Box>
                                        <Box sx={{ p: 2, bgcolor: form.invoiceTemplate === t.id ? '#f5f7ff' : 'white', borderTop: '1px solid #eef2f6', textAlign: 'center' }}>
                                            <Typography variant="subtitle2" fontWeight={800} color={
                                                form.invoiceTemplate === 'template2' ? '#667eea' : 
                                                form.invoiceTemplate === 'template3' ? '#1e293b' : 
                                                form.invoiceTemplate === 'template4' ? '#4338ca' : '#1e293b'
                                            } sx={{ fontSize: '0.85rem' }}>{t.name}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{t.desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </RadioGroup>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '8px', maxWidth: 800 }}>
                        <SectionHead title="Invoice Terms & Conditions" />
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                            These terms will be displayed at the bottom of every invoice generated.
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <TextField
                                multiline
                                rows={8}
                                fullWidth
                                placeholder="e.g.\n1. Payment is due within 15 days.\n2. Please include invoice number in payment notes.\n..."
                                value={form.invoiceTerms || ''}
                                onChange={f('invoiceTerms')}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem', bgcolor: '#fafafa' } }}
                            />
                        </Box>
                    </Paper>
                </Paper>
            )}

            {/* Save / Cancel Footer (Only for tabs that modify firm-wide record) */}
            {(tab === 0 || tab === 1 || tab === 6) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3, mb: 4 }}>
                    <CommonButton variant="contained" size="small" onClick={() => { if (!form.firmName) { toast('Firm Name is required', 'error'); return; } saveMutation.mutate(form); }}
                        loading={saveMutation.isPending}
                        sx={{ boxShadow: 'none' }}>
                        Save
                    </CommonButton>
                    <CommonButton variant="outlined" size="small" onClick={() => firm && setForm({ ...BLANK, ...firm })}
                        sx={{ color: '#ef4444', borderColor: '#ef4444', '&:hover': { bgcolor: '#fff5f5', borderColor: '#dc2626' } }}>
                        Cancel
                    </CommonButton>
                </Box>
            )}

            <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
            </Snackbar>

            {/* ── FIELD MASTER MODAL ── */}
            <Modal
                open={fieldModal}
                onClose={() => setFieldModal(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backgroundColor: 'rgba(0, 0, 0, 0.4)' } }}
            >
                <Fade in={fieldModal}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: 400, bgcolor: 'background.paper', borderRadius: '12px', boxShadow: 24, p: 4, outline: 'none'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <Building2 size={24} color="#667eea" />
                            <Typography variant="h6" component="h2" fontWeight={700}>Field Master</Typography>
                        </Box>
                        <Typography fontSize="0.85rem" color="text.secondary" mb={3}>
                            Customize the labels for the extra fields in the Firm Info tab.
                        </Typography>
                        <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
                            {([0, 1, 2, 3, 4, 5, 6] as const).map((i) => (
                                <Box key={i} sx={{ mb: 2 }}>
                                    <Typography fontSize="0.75rem" fontWeight={700} color="#555" mb={0.5}>Field {i + 1} Label</Typography>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        placeholder={`Field ${i + 1} Name`}
                                        value={(form.extraFieldLabels && form.extraFieldLabels[i]) || ''}
                                        onChange={(e) => updateLabel(i, e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />
                                </Box>
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4 }}>
                            <CommonButton onClick={() => setFieldModal(false)} variant="text">Cancel</CommonButton>
                            <CommonButton
                                variant="contained"
                                onClick={() => saveMutation.mutate(form)}
                                loading={saveMutation.isPending}
                                sx={{ borderRadius: '8px', px: 3 }}
                            >
                                Update Labels
                            </CommonButton>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

            {/* ── INVOICE PREVIEW MODAL ── */}
            <Modal
                open={previewModal.open}
                onClose={() => setPreviewModal({ ...previewModal, open: false })}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500, sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
            >
                <Fade in={previewModal.open}>
                    <Box sx={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: { xs: '95%', sm: 650 }, bgcolor: '#cbd5e1', borderRadius: '12px', boxShadow: 24, p: 2, outline: 'none',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        {/* THE INVOICE PAPER */}
                        <Paper sx={{
                            p: 6, borderRadius: 0, boxShadow: '0 4px 30px rgba(0,0,0,0.2)', minHeight: 800,
                            bgcolor: 'white', position: 'relative', border: '1px solid #ddd'
                        }}>
                            {/* Watermark for preview */}
                            <Typography sx={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
                                fontSize: '8rem', fontWeight: 900, color: 'rgba(0,0,0,0.03)', pointerEvents: 'none', zIndex: 0
                            }}>PREVIEW</Typography>

                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                {/* Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h4" fontWeight={900} color={previewModal.template === 'template2' ? '#667eea' : '#1e293b'} letterSpacing={-0.5}>
                                            TAX INVOICE
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">Original for Recipient</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        {form.showLogo !== false && form.logoUrl && <Box component="img" src={form.logoUrl} sx={{ height: 60, mb: 1.5, display: 'block', ml: 'auto' }} />}
                                        <Typography fontWeight={800} fontSize="1.1rem">{form.firmName}</Typography>
                                        <Typography fontSize="0.75rem" color="text.secondary" sx={{ maxWidth: 200, ml: 'auto' }}>
                                            {form.address}, {form.city}, {form.state} - {form.postalCode}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 4, borderBottomWidth: 2, borderColor: previewModal.template === 'template2' ? '#667eea' : '#1e293b' }} />

                                {/* Billing Info */}
                                <Grid container spacing={4} sx={{ mb: 6 }}>
                                    <Grid size={6}>
                                        <Typography fontSize="0.7rem" fontWeight={800} color="text.secondary" gutterBottom>BILL TO</Typography>
                                        <Typography fontWeight={700} fontSize="0.95rem">M/S Sample Client Name</Typography>
                                        <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 0.5 }}>
                                            123 Business Avenue, South Wing<br />
                                            Corporate Park, City-400001
                                        </Typography>
                                        <Typography fontSize="0.8rem" sx={{ mt: 1 }}><strong>GSTIN:</strong> 27AAAAA0000A1Z5</Typography>
                                    </Grid>
                                    <Grid size={6} sx={{ textAlign: 'right' }}>
                                        <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                                            <Box sx={{ mb: 1 }}><Typography fontSize="0.75rem" display="inline" fontWeight={700}>Invoice No:</Typography> <Typography fontSize="0.75rem" display="inline" sx={{ ml: 1 }}>{form.invoicePrefix}0001/24-25</Typography></Box>
                                            <Box sx={{ mb: 1 }}><Typography fontSize="0.75rem" display="inline" fontWeight={700}>Date:</Typography> <Typography fontSize="0.75rem" display="inline" sx={{ ml: 1 }}>{new Date().toLocaleDateString()}</Typography></Box>
                                            <Box><Typography fontSize="0.75rem" display="inline" fontWeight={700}>Due Date:</Typography> <Typography fontSize="0.75rem" display="inline" sx={{ ml: 1 }}>{new Date(Date.now() + 1296000000).toLocaleDateString()}</Typography></Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Items Table */}
                                <Box sx={{ mb: 6 }}>
                                    <Box sx={{ bgcolor: previewModal.template === 'template2' ? '#667eea' : '#1e293b', color: 'white', py: 1, px: 2, display: 'flex', fontWeight: 700, fontSize: '0.8rem' }}>
                                        <Box sx={{ flex: 1 }}>DESCRIPTION OF SERVICE</Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>SAC CODE</Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>AMOUNT</Box>
                                    </Box>
                                    <Box sx={{ borderBottom: '1px solid #efefef', py: 2, px: 2, display: 'flex', fontSize: '0.85rem' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={600} fontSize="0.85rem">Statutory Audit Fees</Typography>
                                            <Typography fontSize="0.72rem" color="text.secondary">For the financial year 2023-24</Typography>
                                        </Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>998221</Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>₹ 25,000.00</Box>
                                    </Box>
                                    <Box sx={{ py: 2, px: 2, display: 'flex', fontSize: '0.85rem' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography fontWeight={600} fontSize="0.85rem">Tax Consultancy</Typography>
                                            <Typography fontSize="0.72rem" color="text.secondary">Monthly professional services</Typography>
                                        </Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>998222</Box>
                                        <Box sx={{ width: 100, textAlign: 'right' }}>₹ 5,000.00</Box>
                                    </Box>
                                </Box>

                                {/* Totals */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 6 }}>
                                    <Box sx={{ width: 250 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography fontSize="0.8rem">Sub-Total</Typography><Typography fontSize="0.8rem" fontWeight={600}>₹ 30,000.00</Typography></Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography fontSize="0.8rem">CGST @ 9%</Typography><Typography fontSize="0.8rem" fontWeight={600}>₹ 2,700.00</Typography></Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography fontSize="0.8rem">SGST @ 9%</Typography><Typography fontSize="0.8rem" fontWeight={600}>₹ 2,700.00</Typography></Box>
                                        <Divider sx={{ mb: 1.5 }} />
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            bgcolor: '#f8fafc', 
                                            p: 1, 
                                            borderRadius: '8px',
                                            borderLeft: previewModal.template === 'template4' ? '4px solid #b45309' : 'none'
                                        }}>
                                            <Typography fontWeight={800} fontSize="0.95rem">GRAND TOTAL</Typography>
                                            <Typography fontWeight={900} fontSize="0.95rem" color={
                                                previewModal.template === 'template2' ? '#667eea' : 
                                                previewModal.template === 'template3' ? '#475569' : 
                                                previewModal.template === 'template4' ? '#b45309' : '#1e293b'
                                            }>₹ 35,400.00</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Footer Info */}
                                <Grid container spacing={4}>
                                    <Grid size={7}>
                                        <Typography fontSize="0.7rem" fontWeight={800} color="text.secondary" gutterBottom>TERMS & CONDITIONS</Typography>
                                        <Typography fontSize="0.7rem" sx={{ whiteSpace: 'pre-line', color: '#555' }}>
                                            {form.invoiceTerms || '1. Interest @ 18% will be charged if not paid within 30 days.\n2. Subject to Mumbai Jurisdiction.\n3. This is a computer generated invoice.'}
                                        </Typography>

                                        <Box sx={{ mt: 3, p: 1.5, border: '1px dashed #cbd5e1', borderRadius: '8px', bgcolor: '#f8fafc' }}>
                                            <Typography fontSize="0.7rem" fontWeight={800} color="text.secondary" gutterBottom>BANK DETAILS</Typography>
                                            <Typography fontSize="0.75rem"><strong>{form.bankName}</strong></Typography>
                                            <Typography fontSize="0.75rem">A/c No: {form.accountNumber} | IFSC: {form.ifscCode}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={5} sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Typography fontSize="0.75rem" fontWeight={600} mb={1}>For {form.firmName}</Typography>
                                        {form.signatureImageUrl && (
                                            <Box 
                                                component="img" 
                                                src={form.signatureImageUrl} 
                                                alt={`Authorized Signature for ${form.firmName}`} 
                                                width="120"
                                                height="60"
                                                loading="lazy"
                                                sx={{ height: 60, width: 'auto', mb: 1 }} 
                                            />
                                        )}
                                        <Typography fontSize="0.75rem" fontWeight={800}>Authorized Signatory</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>

                        {/* Modal Footer */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <CommonButton
                                variant="contained"
                                color="inherit"
                                onClick={() => setPreviewModal({ ...previewModal, open: false })}
                                sx={{ borderRadius: '8px', px: 4, bgcolor: 'white', color: '#1e293b' }}
                            >
                                Close Preview
                            </CommonButton>
                        </Box>
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
};





