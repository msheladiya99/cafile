import React, { useState, useMemo } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Tabs,
    Tab,
    Divider,
    Menu,
    ListItemIcon,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Stack,
    alpha,
    Avatar,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LibraryBooks as ServiceIcon,
    FileDownload as DownloadIcon,
    MoreVert as MoreVertIcon,
    Payment as PaymentIcon,
    Group as GroupIcon,
    PersonOutline as PersonIcon,
    CheckCircleOutline as CheckIcon,
} from '@mui/icons-material';
import { billingService } from '../../services/billingService';
import { Snackbar, Alert } from '@mui/material';
import type { Invoice, ServiceItem, InvoiceItem } from '../../services/billingService';
import { adminService } from '../../services/adminService';
import { clientGroupService } from '../../services/clientGroupService';
import firmService from '../../services/firmService';
import type { IMultiFirmData } from '../../services/firmService';
import type { Client } from '../../types';
import type { ClientGroup } from '../../services/clientGroupService';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@mui/material';
import { CommonButton } from '../../components/common/UIComponents';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClientBillingRow {
    clientId: string;
    clientName: string;
    items: InvoiceItem[];
}

// Helper: safely unwrap a PopulatedRef (string | Object) to the object, or null if it's a plain string ID
function getRef<T extends Record<string, unknown>>(ref: string | T | undefined): T | null {
    if (!ref || typeof ref === 'string') return null;
    return ref as T;
}

// ─── Group Billing Dialog ─────────────────────────────────────────────────────
const GroupBillingDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (groupId: string, rows: ClientBillingRow[], meta: { firmId: string; dueDate: string; tax: number; notes: string }) => void;
    clients: Client[];
    clientGroups: ClientGroup[];
    multiFirms: IMultiFirmData[];
    services: ServiceItem[];
}> = ({ open, onClose, onSubmit, clients, clientGroups, multiFirms, services }) => {
    const [groupId, setGroupId] = useState('');
    const [firmId, setFirmId] = useState('');
    const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const [tax, setTax] = useState(0);
    const [notes, setNotes] = useState('');

    // Derive rows from groupId + clients (no useEffect + setState needed)
    const rows = useMemo(() => {
        if (!groupId) return [];
        const groupClients = clients.filter(c => {
            if (!c.groupName) return false;
            if (typeof c.groupName === 'string') return c.groupName === groupId;
            return (c.groupName as { _id: string })._id === groupId;
        });
        return groupClients.map(c => ({ clientId: c._id!, clientName: c.name, items: [] as InvoiceItem[] }));
    }, [groupId, clients]);

    // Mutable item state layered on top of the derived rows
    const [itemOverrides, setItemOverrides] = useState<Record<string, InvoiceItem[]>>({});

    // Effective rows merge derived clients with mutable items
    const effectiveRows: ClientBillingRow[] = useMemo(() =>
        rows.map(r => ({ ...r, items: itemOverrides[r.clientId] ?? [] })),
        [rows, itemOverrides]
    );

    // Reset all form state when dialog closes (called from onClose, not useEffect)
    const handleClose = () => {
        setGroupId('');
        setFirmId('');
        setTax(0);
        setNotes('');
        setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
        setItemOverrides({});
        onClose();
    };

    const addItem = (clientId: string) => {
        setItemOverrides(prev => ({
            ...prev,
            [clientId]: [...(prev[clientId] ?? []), { name: '', quantity: 1, unitPrice: 0, amount: 0 }],
        }));
    };

    const removeItem = (clientId: string, idx: number) => {
        setItemOverrides(prev => ({
            ...prev,
            [clientId]: (prev[clientId] ?? []).filter((_, i) => i !== idx),
        }));
    };

    const updateItem = (clientId: string, idx: number, field: string, value: string | number) => {
        setItemOverrides(prev => {
            const items = [...(prev[clientId] ?? [])];
            const item = { ...items[idx], [field]: value };
            if (field === 'quantity' || field === 'unitPrice') {
                item.amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
            }
            if (field === 'serviceId') {
                const svc = services.find(s => s._id === value);
                if (svc) { item.name = svc.name; item.unitPrice = svc.basePrice; item.amount = (item.quantity || 1) * svc.basePrice; }
            }
            items[idx] = item;
            return { ...prev, [clientId]: items };
        });
    };

    // Apply the same items to ALL clients at once
    const applyToAll = (sourceItems: InvoiceItem[]) => {
        const overrides: Record<string, InvoiceItem[]> = {};
        rows.forEach(r => { overrides[r.clientId] = sourceItems.map(i => ({ ...i })); });
        setItemOverrides(overrides);
    };

    const itemsTotal = effectiveRows.reduce((sum, r) => sum + r.items.reduce((s, i) => s + i.amount, 0), 0);
    const grandTotal = itemsTotal + tax;
    const canSubmit = groupId && effectiveRows.some(r => r.items.length > 0);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflow: 'hidden' } }}>
            <Box sx={{ p: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, borderRadius: '12px' }}>
                    <GroupIcon sx={{ fontSize: 26 }} />
                </Avatar>
                <Box>
                    <DialogTitle sx={{ p: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.25rem' }}>Group Billing</DialogTitle>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                        Aggregated invoice for the entire group
                    </Typography>
                </Box>
            </Box>

            <DialogContent sx={{ pt: 3, px: 3 }}>
                {/* Meta row */}
                <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField select label="Select Group" fullWidth value={groupId}
                            onChange={e => { setGroupId(e.target.value); setItemOverrides({}); }}
                            InputProps={{ sx: { borderRadius: '12px' } }}>
                            {clientGroups.map(g => (
                                <MenuItem key={g._id} value={g._id!}>{g.groupName}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField select label="Issuing Firm" fullWidth value={firmId}
                            onChange={e => setFirmId(e.target.value)}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}>
                            <MenuItem value="">Primary Firm</MenuItem>
                            {multiFirms.map(f => <MenuItem key={f._id} value={f._id}>{f.firmName}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField label="Due Date" type="date" fullWidth
                            InputLabelProps={{ shrink: true }} value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField label="Tax (₹)" type="number" fullWidth value={tax}
                            onChange={e => setTax(parseFloat(e.target.value) || 0)}
                            InputProps={{ sx: { borderRadius: '12px' } }} />
                    </Grid>
                </Grid>

                {!groupId && (
                    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                        <GroupIcon sx={{ fontSize: 56, opacity: 0.2, mb: 1 }} />
                        <Typography variant="body1" fontWeight={500}>Select a client group to begin</Typography>
                    </Box>
                )}

                {rows.length > 0 && (
                    <Box>
                        {/* Quick "Apply to all" helper */}
                        {rows[0] && (itemOverrides[rows[0].clientId]?.length ?? 0) > 0 && (
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <CommonButton size="small" variant="outlined" startIcon={<CheckIcon />}
                                    onClick={() => applyToAll(itemOverrides[rows[0].clientId] ?? [])}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontSize: '0.8rem' }}>
                                    Copy 1st client items to all
                                </CommonButton>
                            </Box>
                        )}

                        {effectiveRows.map((row, ri) => {
                            const clientTotal = row.items.reduce((s, i) => s + i.amount, 0);
                            return (
                                <Paper key={row.clientId} variant="outlined" sx={{
                                    mb: 2.5, borderRadius: 3, overflow: 'hidden',
                                    borderColor: row.items.length > 0 ? 'primary.main' : 'divider',
                                    borderWidth: row.items.length > 0 ? 2 : 1,
                                    transition: 'border-color 0.2s'
                                }}>
                                    {/* Client header */}
                                    <Box sx={{
                                        px: 2.5, py: 1.5,
                                        bgcolor: row.items.length > 0 ? alpha('#667eea', 0.06) : '#f8fafc',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        borderBottom: '1px solid', borderColor: 'divider'
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                bgcolor: row.items.length > 0 ? 'primary.main' : '#e2e8f0',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <PersonIcon sx={{ fontSize: 18, color: row.items.length > 0 ? '#fff' : '#94a3b8' }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} color={row.items.length > 0 ? 'primary.main' : 'text.primary'}>
                                                    {ri + 1}. {row.clientName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.items.length} item{row.items.length !== 1 ? 's' : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="subtitle2" fontWeight={700}
                                            color={row.items.length > 0 ? 'primary.main' : 'text.disabled'}>
                                            ₹{clientTotal.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    {/* Items */}
                                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1 }}>
                                        {row.items.map((item, idx) => (
                                            <Box key={idx} sx={{
                                                display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center',
                                                flexWrap: { xs: 'wrap', md: 'nowrap' }
                                            }}>
                                                <TextField select label="Service" size="small"
                                                    sx={{ minWidth: 140, flex: '0 0 140px' }}
                                                    value={item.serviceId || ''}
                                                    onChange={e => updateItem(row.clientId, idx, 'serviceId', e.target.value)}>
                                                    <MenuItem value="">Custom…</MenuItem>
                                                    {services.map(s => <MenuItem key={s._id} value={s._id!}>{s.name}</MenuItem>)}
                                                </TextField>
                                                <TextField label="Item Name" size="small" sx={{ flex: 1, minWidth: 120 }}
                                                    value={item.name}
                                                    onChange={e => updateItem(row.clientId, idx, 'name', e.target.value)} />
                                                <TextField label="Qty" type="number" size="small" sx={{ width: 70 }}
                                                    value={item.quantity}
                                                    onChange={e => updateItem(row.clientId, idx, 'quantity', parseFloat(e.target.value) || 0)} />
                                                <TextField label="Price (₹)" type="number" size="small" sx={{ width: 100 }}
                                                    value={item.unitPrice}
                                                    onChange={e => updateItem(row.clientId, idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                                <Typography sx={{ minWidth: 70, fontWeight: 700, textAlign: 'right', fontSize: '0.9rem' }}>
                                                    ₹{item.amount.toLocaleString()}
                                                </Typography>
                                                <IconButton size="small" color="error" onClick={() => removeItem(row.clientId, idx)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        <CommonButton size="small" startIcon={<AddIcon />} onClick={() => addItem(row.clientId)}
                                            variant="outlined" sx={{
                                                borderRadius: '8px', textTransform: 'none',
                                                borderStyle: 'dashed', fontSize: '0.8rem', mt: 0.5
                                            }}>
                                            Add Item
                                        </CommonButton>
                                    </Box>
                                </Paper>
                            );
                        })}

                        {/* Grand total */}
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                                <Typography fontWeight={700}>₹{itemsTotal.toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">Tax</Typography>
                                <Typography fontWeight={700}>₹{tax.toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary">Invoice Total</Typography>
                                <Typography variant="h5" fontWeight={800} color="primary.main">₹{grandTotal.toLocaleString()}</Typography>
                            </Box>
                        </Box>

                        <TextField label="Notes" fullWidth multiline rows={2}
                            value={notes} onChange={e => setNotes(e.target.value)}
                            InputProps={{ sx: { borderRadius: '12px' } }} sx={{ mt: 2 }} />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
                <CommonButton onClick={handleClose} variant="text" sx={{ color: 'text.secondary' }}>Cancel</CommonButton>
                <CommonButton
                    onClick={() => onSubmit(groupId, effectiveRows, { firmId, dueDate, tax, notes })}
                    variant="contained" disabled={!canSubmit}
                    startIcon={<GroupIcon />}
                    sx={{ borderRadius: '12px', px: 3, boxShadow: 'none', fontWeight: 700 }}>
                    Generate Invoice
                </CommonButton>
            </DialogActions>
        </Dialog>
    );
};

// --- Sub-components ---

const PaymentHistoryDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (payment: { amount: number; date: string; method: string; note?: string }) => void;
    onDelete: (paymentId: string) => void;
    invoice: Invoice | null;
}> = ({ open, onClose, onSubmit, onDelete, invoice }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState('UPI');
    const [note, setNote] = useState('');



    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) return;
        onSubmit({ amount: Number(amount), date, method, note: note || undefined });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Manage Payments</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Payment History</Typography>
                    {invoice?.payments && invoice.payments.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Method</TableCell>
                                        <TableCell align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.payments.map((p) => (
                                        <TableRow key={p._id}>
                                            <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>₹{p.amount.toLocaleString()}</TableCell>
                                            <TableCell>{p.method}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" color="error" onClick={() => p._id && onDelete(p._id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mb: 2 }}>No payments recorded yet.</Typography>
                    )}
                    <Box display="flex" justifyContent="space-between" sx={{ bgcolor: '#f0f4ff', p: 1.5, borderRadius: '12px' }}>
                        <Typography variant="body2" fontWeight={600}>Total Paid: ₹{(invoice?.paidAmount || 0).toLocaleString()}</Typography>
                        <Typography variant="body2" fontWeight={600} color="error">Balance: ₹{(invoice?.balanceAmount || 0).toLocaleString()}</Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }}><Chip label="Record New Payment" size="small" /></Divider>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Amount Received (₹)"
                        type="number"
                        fullWidth
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Payment Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Method"
                                fullWidth
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            >
                                {['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'].map((m) => (
                                    <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                    <TextField
                        label="Notes / Transaction ID"
                        fullWidth
                        multiline
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        InputProps={{ sx: { borderRadius: '12px' } }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <CommonButton onClick={onClose} variant="text" sx={{ borderRadius: '12px', color: 'text.secondary' }}>Close</CommonButton>
                <CommonButton onClick={handleSubmit} variant="contained" disabled={!amount || Number(amount) <= 0} sx={{ borderRadius: '12px', boxShadow: 'none' }}>
                    Add Payment
                </CommonButton>
            </DialogActions>
        </Dialog>
    );
};

const ServiceDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ServiceItem>) => void;
    initialData?: ServiceItem | null;
}> = ({ open, onClose, onSubmit, initialData }) => {
    const getInitialState = (data: ServiceItem | null | undefined) => ({
        name: data?.name || '',
        description: data?.description || '',
        basePrice: data?.basePrice || 0,
        category: (data?.category || 'ITR') as 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER',
        isActive: data?.isActive ?? true,
    });

    const [formData, setFormData] = useState(() => getInitialState(initialData));
    const [prevOpen, setPrevOpen] = useState(open);
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    if (open !== prevOpen || initialData !== prevInitialData) {
        setPrevOpen(open);
        setPrevInitialData(initialData);
        if (open) {
            setFormData(getInitialState(initialData));
        }
    }



    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' } }}
        >
            <Box sx={{ p: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, borderRadius: '12px' }}>
                    <ServiceIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <DialogTitle sx={{ p: 0, fontWeight: 800, color: '#1e293b' }}>
                    {initialData ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
            </Box>
            <DialogContent sx={{ mt: 2, px: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Service Name"
                            fullWidth
                            variant="outlined"
                            placeholder="e.g. Monthly GST Filing"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            placeholder="Describe what this service includes..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Base Price"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            label="Category"
                            fullWidth
                            variant="outlined"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER' })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                        >
                            <MenuItem value="ITR">ITR</MenuItem>
                            <MenuItem value="GST">GST</MenuItem>
                            <MenuItem value="ACCOUNTING">Accounting</MenuItem>
                            <MenuItem value="OTHER">Other</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1, gap: 1.5 }}>
                <CommonButton onClick={onClose} variant="text" sx={{ borderRadius: '12px', color: 'text.secondary', fontWeight: 700 }}>Cancel</CommonButton>
                <CommonButton
                    onClick={() => onSubmit(formData)}
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: '14px', px: 4, py: 1.2, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)', fontWeight: 800 }}
                >
                    {initialData ? 'Update Service' : 'Save Service'}
                </CommonButton>
            </DialogActions>
        </Dialog>
    );
};

const InvoiceDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Invoice>) => void;
    clients: Client[];
    clientGroups: ClientGroup[];
    multiFirms: IMultiFirmData[];
    services: ServiceItem[];
    initialData?: Invoice | null;
}> = ({ open, onClose, onSubmit, clients, clientGroups, multiFirms, services, initialData }) => {
    const getInitialState = (data: Invoice | null | undefined) => ({
        billingType: data?.billingType || 'SINGLE_CLIENT',
        clientId: data?.clientId ? (typeof data.clientId === 'object' ? data.clientId._id : data.clientId) : '',
        clientGroupId: data?.clientGroupId ? (typeof data.clientGroupId === 'object' ? data.clientGroupId._id : data.clientGroupId) : '',
        firmId: data?.firmId ? (typeof data.firmId === 'object' ? data.firmId._id : data.firmId) : '',
        dueDate: data?.dueDate ? data.dueDate.split('T')[0] : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        invoiceNumber: data?.invoiceNumber || '',
        items: data?.items || [],
        notes: data?.notes || '',
        tax: data?.tax || 0,
    });

    const [formData, setFormData] = useState(() => getInitialState(initialData));
    const [prevOpen, setPrevOpen] = useState(open);
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    if (open !== prevOpen || initialData !== prevInitialData) {
        setPrevOpen(open);
        setPrevInitialData(initialData);
        if (open) {
            setFormData(getInitialState(initialData));
        }
    }



    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, unitPrice: 0, amount: 0 }],
        });
    };

    const removeItem = (index: number) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        // Ensure item exists
        if (!newItems[index]) return;

        const item = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'unitPrice') {
            item.amount = (item.quantity || 0) * (item.unitPrice || 0);
        }

        if (field === 'serviceId') {
            const service = services.find(s => s._id === value);
            if (service) {
                item.name = service.name;
                item.unitPrice = service.basePrice;
                item.amount = (item.quantity || 1) * service.basePrice;
            }
        }

        newItems[index] = item;
        setFormData({ ...formData, items: newItems });
    };

    const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + (formData.tax || 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', overflow: 'hidden' } }}
        >
            <Box sx={{ p: 3, pb: 1, display: 'flex', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, borderRadius: '12px' }}>
                    <AddIcon sx={{ fontSize: 26 }} />
                </Avatar>
                <Box>
                    <DialogTitle sx={{ p: 0, fontWeight: 900, color: '#1e293b', fontSize: '1.25rem' }}>
                        {initialData ? 'Edit Invoice' : 'Create New Invoice'}
                    </DialogTitle>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>
                        {initialData ? `Editing ${initialData.invoiceNumber}` : 'Generate professional invoices for clients'}
                    </Typography>
                </Box>
            </Box>
            <DialogContent sx={{ pt: 3, px: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            label="Billing Type"
                            fullWidth
                            value={formData.billingType}
                            onChange={(e) => setFormData({ ...formData, billingType: e.target.value as 'SINGLE_CLIENT' | 'CLIENT_GROUP', clientId: '', clientGroupId: '' })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                            disabled={!!initialData}
                        >
                            <MenuItem value="SINGLE_CLIENT">Single Client</MenuItem>
                            <MenuItem value="CLIENT_GROUP">Client Group</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            label="Issuing Firm"
                            fullWidth
                            value={formData.firmId}
                            onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                            InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                            disabled={!!initialData}
                        >
                            <MenuItem value="">Primary Firm</MenuItem>
                            {multiFirms.map((f: IMultiFirmData) => (
                                <MenuItem key={f._id} value={f._id}>{f.firmName} (Multi Firm)</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    {formData.billingType === 'SINGLE_CLIENT' && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Select Client"
                                fullWidth
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                                disabled={!!initialData} // Lock client on edit
                            >
                                {clients.map(c => (
                                    <MenuItem key={c._id} value={c._id}>{c.name} ({c.email}) </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}
                    {formData.billingType === 'CLIENT_GROUP' && (
                        <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    label="Select Client Group"
                                    fullWidth
                                    value={formData.clientGroupId}
                                    onChange={(e) => setFormData({ ...formData, clientGroupId: e.target.value })}
                                    InputProps={{ sx: { borderRadius: '16px', bgcolor: '#f8fafc' } }}
                                    disabled={!!initialData} // Lock group on edit
                                >
                                    {clientGroups.map((g: ClientGroup) => (
                                        <MenuItem key={g._id} value={g._id}>{g.groupName} ({g.email}) </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            {formData.clientGroupId && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <Typography variant="caption" color="primary" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                                            Associated Clients:
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {clients
                                                .filter(c => {
                                                    if (!c.groupName) return false;
                                                    if (typeof c.groupName === 'string') return c.groupName === formData.clientGroupId;
                                                    return (c.groupName as { _id: string })._id === formData.clientGroupId;
                                                })
                                                .map(c => c.name)
                                                .join(', ') || 'No clients mapped to this group'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Invoice Number"
                            fullWidth
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="Auto-generated if empty"
                            InputProps={{ sx: { borderRadius: '12px' } }}
                            disabled={!!initialData}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            InputProps={{ sx: { borderRadius: '12px' } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2, mt: 3, fontWeight: 700, color: 'text.secondary' }}>Invoice Items</Typography>
                        {formData.items.map((item: InvoiceItem, index: number) => (
                            <Box key={index} sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 2,
                                mb: 2,
                                alignItems: { xs: 'stretch', md: 'center' },
                                p: 2,
                                border: '1px solid #f0f0f0',
                                borderRadius: 3,
                                bgcolor: '#fbfbfb'
                            }}>
                                <TextField
                                    select
                                    label="Service"
                                    sx={{ minWidth: { xs: '100%', md: 200 } }}
                                    size="small"
                                    value={item.serviceId || ''}
                                    onChange={(e) => updateItem(index, 'serviceId', e.target.value)}
                                >
                                    {services.map(s => (
                                        <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                    ))}
                                    <MenuItem value="">Custom...</MenuItem>
                                </TextField>
                                <TextField
                                    label="Item Name"
                                    fullWidth
                                    size="small"
                                    value={item.name}
                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                />
                                <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                                    <TextField
                                        label="Qty"
                                        type="number"
                                        sx={{ width: { xs: '50%', md: 80 } }}
                                        size="small"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                    />
                                    <TextField
                                        label="Price"
                                        type="number"
                                        sx={{ width: { xs: '50%', md: 120 } }}
                                        size="small"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    />
                                </Box>
                                <Typography sx={{ minWidth: 80, fontWeight: 700, textAlign: 'right' }}>₹{item.amount}</Typography>
                                <IconButton color="error" onClick={() => removeItem(index)} size="small">
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        ))}
                        <CommonButton
                            startIcon={<AddIcon />}
                            onClick={addItem}
                            variant="outlined"
                            sx={{ borderRadius: '12px', textTransform: 'none', borderStyle: 'dashed' }}
                        >
                            Add Item
                        </CommonButton>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <Typography color="text.secondary">Subtotal: <Box component="span" fontWeight={600} color="text.primary">₹{subtotal}</Box></Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography color="text.secondary">Tax (₹): </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    sx={{ width: 100 }}
                                    value={formData.tax}
                                    onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                                    InputProps={{ sx: { borderRadius: '8px' } }}
                                />
                            </Box>
                            <Typography variant="h5" color="primary" fontWeight={700} sx={{ mt: 1 }}>Total: ₹{total}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <CommonButton onClick={onClose} variant="text" sx={{ borderRadius: '12px', color: 'text.secondary' }}>Cancel</CommonButton>
                <CommonButton
                    onClick={() => onSubmit({ ...formData, subtotal, totalAmount: total, balanceAmount: total })}
                    variant="contained"
                    color="primary"
                    disabled={(!formData.clientId && !formData.clientGroupId) || formData.items.length === 0}
                    sx={{ borderRadius: '12px', px: 3, boxShadow: 'none' }}
                >
                    {initialData ? 'Update Invoice' : 'Generate Invoice'}
                </CommonButton>
            </DialogActions>
        </Dialog>
    );
};


const DeleteConfirmationDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    content: string;
}> = ({ open, onClose, onConfirm, title, content }) => (
    <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
    >
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent>
            <Typography variant="body1" color="text.secondary">{content}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
            <CommonButton onClick={onClose} variant="text" sx={{ borderRadius: '12px', color: 'text.secondary' }}>Cancel</CommonButton>
            <CommonButton
                onClick={onConfirm}
                color="error"
                variant="contained"
                sx={{ borderRadius: '12px', px: 3, boxShadow: 'none' }}
            >
                Delete
            </CommonButton>
        </DialogActions>
    </Dialog>
);

// --- Main Page Component ---

export const Billing: React.FC = () => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [activeTab, setActiveTab] = useState(0);

    const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
        queryKey: ['invoices'],
        queryFn: () => billingService.getInvoices()
    });

    const { data: services = [], isLoading: isLoadingServices } = useQuery<ServiceItem[]>({
        queryKey: ['services'],
        queryFn: () => billingService.getServices()
    });

    const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: () => adminService.getClients()
    });

    const { data: clientGroups = [], isLoading: isLoadingGroups } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: () => clientGroupService.getGroups()
    });

    const { data: multiFirms = [], isLoading: isLoadingFirms } = useQuery({
        queryKey: ['multiFirms'],
        queryFn: () => firmService.getMultiFirms()
    });

    const isLoading = isLoadingInvoices || isLoadingServices || isLoadingClients || isLoadingGroups || isLoadingFirms;

    const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

    // Payment & Menu state
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuTarget, setMenuTarget] = useState<Invoice | null>(null);

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'SERVICE' | 'INVOICE' } | null>(null);

    // Group Billing
    const [groupBillingOpen, setGroupBillingOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoice: Invoice) => {
        setAnchorEl(event.currentTarget);
        setMenuTarget(invoice);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuTarget(null);
    };

    const handleOpenPayment = () => {
        setPaymentTarget(menuTarget);
        setPaymentDialogOpen(true);
        handleMenuClose();
    };

    const handleSubmitPayment = async (paymentData: { amount: number; date: string; method: string; note?: string }) => {
        if (!paymentTarget) return;
        try {
            await billingService.addPayment(paymentTarget._id, {
                ...paymentData,
                date: new Date(paymentData.date),
                method: paymentData.method as 'UPI' | 'OTHER' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE'
            });
            setPaymentDialogOpen(false);
            setPaymentTarget(null);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        } catch (error) {
            console.error('Error adding payment:', error);
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!paymentTarget) return;
        try {
            const updatedInvoice = await billingService.deletePayment(paymentTarget._id, paymentId);
            setPaymentTarget(updatedInvoice);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        } catch (error) {
            console.error('Error deleting payment:', error);
        }
    };



    const handleEditFromMenu = () => {
        if (menuTarget) handleEditInvoice(menuTarget);
        handleMenuClose();
    };

    const handleDeleteFromMenu = () => {
        if (menuTarget) handleDeleteInvoice(menuTarget._id);
        handleMenuClose();
    };

    const handleDownloadPDF = async () => {
        if (menuTarget) {
            await generateInvoicePDF(menuTarget);
        }
        handleMenuClose();
    };

    const handleCreateService = async (data: Partial<ServiceItem>) => {
        try {
            await billingService.createService(data);
            setServiceDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['services'] });
        } catch (error) {
            console.error('Error creating service:', error);
        }
    };

    const handleUpdateService = async (data: Partial<ServiceItem>) => {
        if (!editingService) return;
        try {
            await billingService.updateService(editingService._id!, data);
            setServiceDialogOpen(false);
            setEditingService(null);
            queryClient.invalidateQueries({ queryKey: ['services'] });
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

    const handleDeleteService = (id: string) => {
        setDeleteTarget({ id, type: 'SERVICE' });
        setDeleteDialogOpen(true);
    };

    const handleDeleteInvoice = (id: string) => {
        setDeleteTarget({ id, type: 'INVOICE' });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'SERVICE') {
                await billingService.deleteService(deleteTarget.id);
                queryClient.invalidateQueries({ queryKey: ['services'] });
            } else {
                await billingService.deleteInvoice(deleteTarget.id);
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            }
        } catch (error) {
            console.error(`Error deleting ${deleteTarget.type.toLowerCase()}: `, error);
        } finally {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const handleCreateGroupBilling = async (
        groupId: string,
        rows: { clientId: string; clientName: string; items: InvoiceItem[] }[],
        meta: { firmId: string; dueDate: string; tax: number; notes: string }
    ) => {
        const validRows = rows.filter(r => r.items.length > 0);
        if (!groupId || validRows.length === 0) return;

        // Flatten all client items into one list, prefixing each item name with the client name
        const allItems: InvoiceItem[] = validRows.flatMap(row =>
            row.items.map(item => ({
                ...item,
                name: `[${row.clientName}] ${item.name}`,
            }))
        );

        const subtotal = allItems.reduce((s, i) => s + i.amount, 0);
        const invoicePayload = {
            billingType: 'CLIENT_GROUP' as const,
            clientGroupId: groupId,
            items: allItems,
            subtotal,
            tax: meta.tax,
            totalAmount: subtotal + meta.tax,
            balanceAmount: subtotal + meta.tax,
            dueDate: meta.dueDate,
            notes: meta.notes,
            firmId: meta.firmId,
        };

        try {
            await billingService.createInvoice(invoicePayload);
            setGroupBillingOpen(false);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setSnackbar({ open: true, message: '✅ Group invoice created successfully!', severity: 'success' });
        } catch (error) {
            console.error('Group billing error:', error);
            setSnackbar({ open: true, message: 'Failed to create group invoice. Please try again.', severity: 'error' });
        }
    };

    const handleCreateOrUpdateInvoice = async (data: Partial<Invoice>) => {
        try {
            if (editingInvoice) {
                // Update existing invoice
                await billingService.updateInvoice(editingInvoice._id, data);
            } else {
                // Create new invoice
                await billingService.createInvoice(data);
            }
            setInvoiceDialogOpen(false);
            setEditingInvoice(null);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        } catch (error) {
            console.error('Error saving invoice:', error);
        }
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setInvoiceDialogOpen(true);
    };

    // ...

    // Update the dialog props in JSX:
    /*
            <InvoiceDialog
                open={invoiceDialogOpen}
                onClose={() => { setInvoiceDialogOpen(false); setEditingInvoice(null); }}
                onSubmit={handleCreateOrUpdateInvoice}
                clients={clients}
                services={services}
                initialData={editingInvoice}
            />
    */

    const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
        switch (status) {
            case 'PAID': return 'success';
            case 'PENDING': return 'warning';
            case 'PARTIAL': return 'info';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    // Calculate summary metrics
    const totalBilled = invoices.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
    const pendingAmount = invoices.reduce((sum: number, inv: Invoice) => sum + inv.balanceAmount, 0);
    const activeServices = services.filter((s: ServiceItem) => s.isActive).length;



    return (
        <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
            <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 3 }}>
                <Box sx={{ 
                    bgcolor: '#ffffff', 
                    borderBottom: '1px solid #e2e8f0', 
                    px: { xs: 2, sm: 3 }, 
                    py: 2.5, 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight="800" sx={{ color: '#1e293b', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Billing & Invoicing</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                            Manage invoices, services, and track payments efficiently.
                        </Typography>
                    </Box>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1.5, 
                        width: { xs: '100%', sm: 'auto' },
                        '& > button': { flex: { xs: 1, sm: 'initial' } }
                    }}>
                        <CommonButton
                            variant="outlined"
                            size="small"
                            startIcon={<ServiceIcon />}
                            onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}
                            sx={{ borderRadius: '12px', py: 1 }}
                        >
                            Services
                        </CommonButton>
                        <CommonButton
                            variant="outlined"
                            size="small"
                            startIcon={<GroupIcon />}
                            onClick={() => setGroupBillingOpen(true)}
                            sx={{ borderRadius: '12px', py: 1, borderColor: '#667eea', color: '#667eea' }}
                        >
                            Group Billing
                        </CommonButton>
                        <CommonButton
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setInvoiceDialogOpen(true)}
                            sx={{ borderRadius: '12px', py: 1 }}
                        >
                            New Invoice
                        </CommonButton>
                    </Box>
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 4 }}>
                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { title: 'Total Invoiced', value: `₹${totalBilled.toLocaleString()}`, color: '#667eea', icon: <DownloadIcon /> },
                    { title: 'Pending Payments', value: `₹${pendingAmount.toLocaleString()}`, color: '#f43f5e', icon: <PaymentIcon /> },
                    { title: 'Active Services', value: activeServices, color: '#10b981', icon: <ServiceIcon /> },
                ].map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: '24px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            background: '#fff',
                            border: '1px solid #f1f5f9',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                                transform: 'translateY(-6px)', 
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                                borderColor: alpha(stat.color, 0.3) 
                            }
                        }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1.2, display: 'block', mb: 1, textTransform: 'uppercase' }}>
                                        {stat.title}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', fontSize: { xs: '1.75rem', md: '2.25rem' }, letterSpacing: '-0.02em' }}>
                                        {isLoading ? <Skeleton width={120} /> : stat.value}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: '16px',
                                    bgcolor: alpha(stat.color, 0.08),
                                    color: stat.color,
                                    display: 'flex',
                                    transition: 'all 0.3s',
                                    '& svg': { fontSize: { xs: 28, md: 32 } }
                                }}>
                                    {stat.icon}
                                </Box>
                            </Box>
                            {/* Decorative element */}
                            <Box sx={{ position: 'absolute', bottom: -10, right: -10, width: 60, height: 60, borderRadius: '50%', bgcolor: alpha(stat.color, 0.03) }} />
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                mb: 3,
                gap: 2.5
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_: React.SyntheticEvent, val: number) => setActiveTab(val)}
                    variant={isMobile ? "fullWidth" : "standard"}
                    sx={{
                        width: { xs: '100%', md: 'auto' },
                        borderBottom: { xs: 1, md: 'none' },
                        borderColor: { xs: 'divider', md: 'transparent' },
                        '& .MuiTab-root': {
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            minWidth: { xs: 'auto', md: 100 },
                            mr: { xs: 0, md: 2 },
                            flex: { xs: 1, md: 'none' },
                            py: 1.5
                        },
                        '& .Mui-selected': { color: '#667eea' },
                        '& .MuiTabs-indicator': { backgroundColor: '#667eea', height: 3, borderRadius: 3 }
                    }}
                >
                    <Tab label="All Invoices" />
                    <Tab label="Services Library" />
                </Tabs>

                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5, 
                    width: { xs: '100%', md: 'auto' } 
                }}>
                    <CommonButton
                        fullWidth
                        variant="outlined"
                        startIcon={<ServiceIcon />}
                        onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}
                        sx={{
                            borderRadius: '12px',
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            fontWeight: 600,
                            py: { xs: 1.2, sm: 1 },
                            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Manage Services
                    </CommonButton>
                    <CommonButton
                        fullWidth
                        variant="outlined"
                        startIcon={<GroupIcon />}
                        onClick={() => setGroupBillingOpen(true)}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 600,
                            py: { xs: 1.2, sm: 1 },
                            whiteSpace: 'nowrap',
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': { bgcolor: alpha('#667eea', 0.05) }
                        }}
                    >
                        Group Billing
                    </CommonButton>
                    <CommonButton
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setInvoiceDialogOpen(true)}
                        sx={{ 
                            borderRadius: '12px',
                            fontWeight: 600,
                            py: { xs: 1.2, sm: 1 },
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)' 
                        }}
                    >
                        New Invoice
                    </CommonButton>
                </Box>
            </Box>

            <Paper sx={{
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
            }}>
                {activeTab === 0 && (
                    isMobile ? (
                        <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {[1, 2, 3].map((i) => <Skeleton key={i} height={150} sx={{ borderRadius: 3 }} />)}
                                </Box>
                            ) : invoices.length === 0 ? (
                                <Box textAlign="center" py={8} px={2}>
                                    <Box sx={{ 
                                        width: 64, height: 64, borderRadius: '50%', bgcolor: '#f1f5f9', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 
                                    }}>
                                        <PaymentIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
                                    </Box>
                                    <Typography variant="h6" fontWeight={700} color="#334155">No Invoices Found</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240, mx: 'auto', mt: 0.5 }}>
                                        You haven't generated any invoices yet. Start by creating one to track your billing.
                                    </Typography>
                                </Box>
                            ) : (
                                invoices.map((inv) => (
                                    <Card key={inv._id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                                        {inv.invoiceNumber}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={600} color="text.primary">
                                                        {inv.billingType === 'CLIENT_GROUP'
                                                            ? `Group: ${getRef(inv.clientGroupId)?.groupName ?? ''}`
                                                            : getRef(inv.clientId)?.name ?? ''}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Firm: {getRef(inv.firmId)?.firmName ?? 'Primary'} | {new Date(inv.issueDate).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, inv)}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>

                                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" color="text.secondary">Total</Typography>
                                                    <Typography variant="body2" fontWeight={700}>₹{inv.totalAmount.toLocaleString()}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="error.main">₹{inv.balanceAmount.toLocaleString()}</Typography>
                                                </Grid>
                                            </Grid>

                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Chip
                                                    label={inv.status}
                                                    size="small"
                                                    color={getStatusColor(inv.status)}
                                                    sx={{ borderRadius: '8px', fontWeight: 600, height: 24 }}
                                                />
                                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                                                </Typography>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        {['Invoice #', 'Billed To', 'Issuing Firm', 'Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2.5 }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map((i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={10}><Skeleton height={40} /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 12 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Box sx={{ 
                                                        width: 80, height: 80, borderRadius: '50%', bgcolor: '#f8fafc', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 
                                                    }}>
                                                        <PaymentIcon sx={{ fontSize: 40, color: '#e2e8f0' }} />
                                                    </Box>
                                                    <Typography variant="h5" fontWeight={700} color="#475569">No billing records yet</Typography>
                                                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 400 }}>
                                                        Stay organized by creating and tracking professional invoices for your clients.
                                                    </Typography>
                                                    <CommonButton variant="contained" startIcon={<AddIcon />} onClick={() => setInvoiceDialogOpen(true)} sx={{ mt: 3, borderRadius: '12px' }}>
                                                        Create First Invoice
                                                    </CommonButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv._id} sx={{ '&:hover': { bgcolor: '#fbfbfb' }, transition: 'background-color 0.1s' }}>
                                                <TableCell sx={{ fontWeight: 800, color: '#0f172a', py: 2.5 }}>{inv.invoiceNumber}</TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                                                        {inv.billingType === 'CLIENT_GROUP'
                                                            ? `[Group] ${getRef(inv.clientGroupId)?.groupName ?? ''}`
                                                            : getRef(inv.clientId)?.name ?? ''}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                        {inv.billingType === 'CLIENT_GROUP'
                                                            ? getRef(inv.clientGroupId)?.email ?? ''
                                                            : getRef(inv.clientId)?.email ?? ''}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography variant="body2" fontWeight={600} color="#64748b">{getRef(inv.firmId)?.firmName ?? 'Primary Firm'}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5, color: '#64748b', fontWeight: 500 }}>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ py: 2.5, color: '#64748b', fontWeight: 500 }}>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 800, py: 2.5, color: '#0f172a' }}>₹{inv.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell sx={{ color: '#10b981', fontWeight: 700, py: 2.5 }}>₹{inv.paidAmount.toLocaleString()}</TableCell>
                                                <TableCell sx={{ color: '#f43f5e', fontWeight: 800, py: 2.5 }}>₹{inv.balanceAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={inv.status}
                                                        size="small"
                                                        color={getStatusColor(inv.status)}
                                                        sx={{ fontWeight: 600, borderRadius: '12px' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, inv)}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                )}

                {activeTab === 1 && (
                    isMobile ? (
                        <Box sx={{ p: 2, bgcolor: '#f8fafc' }}>
                            {isLoading ? (
                                [1, 2, 3].map((i) => <Skeleton key={i} height={120} sx={{ mb: 2, borderRadius: 3 }} />)
                            ) : services.map((service) => (
                                <Card key={service._id} sx={{ mb: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                                                    {service.name}
                                                </Typography>
                                                <Chip
                                                    label={service.category}
                                                    size="small"
                                                    sx={{ mt: 0.5, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.7rem', fontWeight: 600 }}
                                                />
                                            </Box>
                                            <Stack direction="row" spacing={0}>
                                                <IconButton size="small" onClick={() => { setEditingService(service); setServiceDialogOpen(true); }} sx={{ color: 'primary.main' }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteService(service._id!)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {service.description}
                                        </Typography>

                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" fontWeight={700} color="primary.main">
                                                ₹{service.basePrice.toLocaleString()}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: service.isActive ? 'success.main' : 'text.disabled' }} />
                                                <Typography variant="caption" color={service.isActive ? 'success.main' : 'text.secondary'} fontWeight={600}>
                                                    {service.isActive ? 'Active' : 'Inactive'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table sx={{ minWidth: { xs: 650, md: 'auto' } }}>
                                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                        {['Service Name', 'Category', 'Base Price', 'Description', 'Status', 'Actions'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map((i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><Skeleton height={40} /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : services.map((service) => (
                                        <TableRow key={service._id} sx={{ '&:hover': { bgcolor: '#fbfbfb' }, transition: 'background-color 0.1s' }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>{service.name}</TableCell>
                                            <TableCell>
                                                <Chip label={service.category} size="small" sx={{ borderRadius: '8px', bgcolor: '#f5f5f5', fontWeight: 500 }} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>₹{service.basePrice.toLocaleString()}</TableCell>
                                            <TableCell sx={{ maxWidth: 350, color: 'text.secondary' }}>
                                                <Typography variant="body2" noWrap>{service.description}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: service.isActive ? 'success.main' : 'text.disabled' }} />
                                                    <Typography variant="body2" color={service.isActive ? 'success.main' : 'text.secondary'} fontWeight={500}>
                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => { setEditingService(service); setServiceDialogOpen(true); }} sx={{ color: 'primary.main', mr: 1 }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteService(service._id!)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )
                )}
            </Paper>

            <ServiceDialog
                open={serviceDialogOpen}
                onClose={() => { setServiceDialogOpen(false); setEditingService(null); }}
                onSubmit={editingService ? handleUpdateService : handleCreateService}
                initialData={editingService}
            />

            <InvoiceDialog
                open={invoiceDialogOpen}
                onClose={() => { setInvoiceDialogOpen(false); setEditingInvoice(null); }}
                onSubmit={handleCreateOrUpdateInvoice}
                clients={clients}
                clientGroups={clientGroups}
                multiFirms={multiFirms}
                services={services}
                initialData={editingInvoice}
            />

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deleteTarget?.type === 'SERVICE' ? 'Service' : 'Invoice'}`}
                content={`Are you sure you want to delete this ${deleteTarget?.type === 'SERVICE' ? 'service' : 'invoice'}?This action cannot be undone.`}
            />

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        borderRadius: '12px',
                        minWidth: 180
                    },
                }}
            >

                <MenuItem onClick={handleEditFromMenu}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    Edit Invoice
                </MenuItem>
                <MenuItem onClick={handleOpenPayment}>
                    <ListItemIcon><PaymentIcon fontSize="small" color="success" /></ListItemIcon>
                    Record Payment
                </MenuItem>
                <MenuItem onClick={handleDownloadPDF}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                    Download PDF
                </MenuItem>


                <Divider />
                <MenuItem onClick={handleDeleteFromMenu}>
                    <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>

            <PaymentHistoryDialog
                open={paymentDialogOpen}
                onClose={() => setPaymentDialogOpen(false)}
                onSubmit={handleSubmitPayment}
                onDelete={handleDeletePayment}
                invoice={paymentTarget}
            />

            <GroupBillingDialog
                open={groupBillingOpen}
                onClose={() => setGroupBillingOpen(false)}
                onSubmit={handleCreateGroupBilling}
                clients={clients}
                clientGroups={clientGroups}
                multiFirms={multiFirms}
                services={services}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            </Paper>
        </Container>
    );
};





