import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
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
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LibraryBooks as ServiceIcon,
    FileDownload as DownloadIcon,
    MoreVert as MoreVertIcon,
    Payment as PaymentIcon,

} from '@mui/icons-material';
import { billingService } from '../../services/billingService';
import type { Invoice, ServiceItem, InvoiceItem } from '../../services/billingService';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@mui/material';

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
                    <Box display="flex" justifyContent="space-between" sx={{ bgcolor: '#f0f4ff', p: 1.5, borderRadius: 2 }}>
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
                        InputProps={{ sx: { borderRadius: 2 } }}
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
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Method"
                                fullWidth
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                InputProps={{ sx: { borderRadius: 2 } }}
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
                        InputProps={{ sx: { borderRadius: 2 } }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Close</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={!amount || Number(amount) <= 0} sx={{ borderRadius: 2, boxShadow: 'none' }}>
                    Add Payment
                </Button>
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
            PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{initialData ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Service Name"
                            fullWidth
                            variant="outlined"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            InputProps={{ sx: { borderRadius: 2 } }}
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
                            InputProps={{ sx: { borderRadius: 2 } }}
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
                            InputProps={{ sx: { borderRadius: 2 } }}
                        >
                            <MenuItem value="ITR">ITR</MenuItem>
                            <MenuItem value="GST">GST</MenuItem>
                            <MenuItem value="ACCOUNTING">Accounting</MenuItem>
                            <MenuItem value="OTHER">Other</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Cancel</Button>
                <Button
                    onClick={() => onSubmit(formData)}
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
                >
                    {initialData ? 'Update' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const InvoiceDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Invoice>) => void;
    clients: Client[];
    services: ServiceItem[];
    initialData?: Invoice | null;
}> = ({ open, onClose, onSubmit, clients, services, initialData }) => {
    const getInitialState = (data: Invoice | null | undefined) => ({
        clientId: data ? (typeof data.clientId === 'object' ? data.clientId._id : data.clientId) : '',
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
            PaperProps={{ sx: { borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{initialData ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select
                            label="Select Client"
                            fullWidth
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            InputProps={{ sx: { borderRadius: 2 } }}
                            disabled={!!initialData} // Lock client on edit
                        >
                            {clients.map(c => (
                                <MenuItem key={c._id} value={c._id}>{c.name} ({c.email}) </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Invoice Number"
                            fullWidth
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            placeholder="Auto-generated if empty"
                            InputProps={{ sx: { borderRadius: 2 } }}
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
                            InputProps={{ sx: { borderRadius: 2 } }}
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
                        <Button
                            startIcon={<AddIcon />}
                            onClick={addItem}
                            variant="outlined"
                            sx={{ borderRadius: 2, textTransform: 'none', borderStyle: 'dashed' }}
                        >
                            Add Item
                        </Button>
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
                                    InputProps={{ sx: { borderRadius: 1.5 } }}
                                />
                            </Box>
                            <Typography variant="h5" color="primary" fontWeight={700} sx={{ mt: 1 }}>Total: ₹{total}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Cancel</Button>
                <Button
                    onClick={() => onSubmit({ ...formData, subtotal, totalAmount: total, balanceAmount: total })}
                    variant="contained"
                    color="primary"
                    disabled={!formData.clientId || formData.items.length === 0}
                    sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
                >
                    {initialData ? 'Update Invoice' : 'Generate Invoice'}
                </Button>
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
            <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Cancel</Button>
            <Button
                onClick={onConfirm}
                color="error"
                variant="contained"
                sx={{ borderRadius: 2, px: 3, boxShadow: 'none' }}
            >
                Delete
            </Button>
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

    const isLoading = isLoadingInvoices || isLoadingServices || isLoadingClients;

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
            <Box mb={5}>
                <Typography variant="h4" sx={{
                    fontSize: { xs: '1.75rem', md: '2.5rem' },
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                }}>
                    Billing & Invoicing
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                    Manage your client invoices, services, and track payments efficiently.
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {[
                    { title: 'Total Invoiced', value: `₹${totalBilled.toLocaleString()}`, color: '#667eea', icon: <DownloadIcon sx={{ opacity: 0.8 }} /> },
                    { title: 'Pending Payments', value: `₹${pendingAmount.toLocaleString()}`, color: '#ef5350', icon: <DeleteIcon sx={{ opacity: 0.8 }} /> },
                    { title: 'Active Services', value: activeServices, color: '#66bb6a', icon: <ServiceIcon sx={{ opacity: 0.8 }} /> },
                ].map((stat, index) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={index}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 4,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            background: '#fff',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }
                        }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom>
                                        {stat.title.toUpperCase()}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} sx={{ color: '#2c3e50' }}>
                                        {isLoading ? <Skeleton width="60%" /> : stat.value}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor: `${stat.color}15`,
                                    color: stat.color,
                                    flexShrink: 0
                                }}>
                                    {stat.icon}
                                </Box>
                            </Box>
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
                gap: 2
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_: React.SyntheticEvent, val: number) => setActiveTab(val)}
                    variant="standard"
                    sx={{
                        width: { xs: '100%', md: 'auto' },
                        borderBottom: { xs: 1, md: 'none' },
                        borderColor: { xs: 'divider', md: 'transparent' },
                        '& .MuiTab-root': {
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '1rem',
                            minWidth: { xs: 'auto', md: 100 },
                            mr: { xs: 0, md: 2 },
                            flex: { xs: 1, md: 'none' },
                        },
                        '& .Mui-selected': { color: '#667eea' },
                        '& .MuiTabs-indicator': { backgroundColor: '#667eea', height: 3, borderRadius: 3 }
                    }}
                >
                    <Tab label="All Invoices" />
                    <Tab label="Services Library" />
                </Tabs>

                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ServiceIcon />}
                        onClick={() => { setEditingService(null); setServiceDialogOpen(true); }}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            borderColor: '#e0e0e0',
                            color: 'text.primary',
                            '&:hover': { borderColor: '#bdbdbd', bgcolor: '#f5f5f5' },
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Manage Services
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setInvoiceDialogOpen(true)}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            borderRadius: 2,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            '&:hover': { boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)' },
                            whiteSpace: 'nowrap'
                        }}
                    >
                        New Invoice
                    </Button>
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
                                [1, 2, 3].map((i) => <Skeleton key={i} height={150} sx={{ mb: 2, borderRadius: 3 }} />)
                            ) : invoices.length === 0 ? (
                                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                                    <Typography color="text.secondary" variant="subtitle1">No invoices found</Typography>
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
                                                        {inv.clientId?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(inv.issueDate).toLocaleDateString()}
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
                                                    sx={{ borderRadius: 1.5, fontWeight: 600, height: 24 }}
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
                                        {['Invoice #', 'Client', 'Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status', 'Actions'].map((head) => (
                                            <TableCell key={head} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>{head}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map((i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={9}><Skeleton height={40} /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : invoices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                                <Box display="flex" flexDirection="column" alignItems="center">
                                                    <Typography color="text.secondary" variant="h6">No invoices found</Typography>
                                                    <Typography color="text.disabled" variant="body2">Create your first invoice to get started</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        invoices.map((inv) => (
                                            <TableRow key={inv._id} sx={{ '&:hover': { bgcolor: '#fbfbfb' }, transition: 'background-color 0.1s' }}>
                                                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>{inv.invoiceNumber}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>{inv.clientId?.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{inv.clientId?.email}</Typography>
                                                </TableCell>
                                                <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>₹{inv.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell sx={{ color: 'success.main' }}>₹{inv.paidAmount.toLocaleString()}</TableCell>
                                                <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>₹{inv.balanceAmount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={inv.status}
                                                        size="small"
                                                        color={getStatusColor(inv.status)}
                                                        sx={{ fontWeight: 600, borderRadius: 2 }}
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
                                                    sx={{ mt: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.7rem', fontWeight: 600 }}
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
                                                <Chip label={service.category} size="small" sx={{ borderRadius: 1.5, bgcolor: '#f5f5f5', fontWeight: 500 }} />
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
                        borderRadius: 2,
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
        </Container>
    );
};
