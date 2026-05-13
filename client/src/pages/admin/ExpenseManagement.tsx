// Office Expense Management Component
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Stack, Chip,
  Grid, CircularProgress, Select, FormControl, InputAdornment, Tabs, Tab, Drawer, Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon, 
  Visibility as ViewIcon, Search as SearchIcon,
  Close as CloseIcon, Receipt as ReceiptIcon, OpenInNew as OpenInNewIcon,
  Business as BusinessIcon, AttachMoney as MoneyIcon, AccountCircle as PersonIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { ExpenseSettlementPanel } from './ExpenseSettlementPanel';
import { ExpenseReimbursementPanel } from './ExpenseReimbursementPanel';

// ─── Helpers (Same as Firm Master) ───────────────────────────────────────────
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
                width: { xs: '100%', sm: 180 }, 
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

const sxStyle = { size: 'small' as const, sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } } };
const selSx = { size: 'small' as const, sx: { borderRadius: '8px', fontSize: '0.82rem' } };

// ─── Main Component ──────────────────────────────────────────────────────────

interface Expense {
  _id: string;
  expenseId: string;
  date: string;
  expenseType: string;
  paymentMethod: string;
  referenceNo?: string;
  vendorName?: string;
  vendorContact?: string;
  vendorGst?: string;
  vendorAddress?: string;
  category: string;
  description?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  clientName?: string;
  projectWork?: string;
  billableStatus: string;
  paidBy: { _id: string, firstName: string, lastName: string, username: string, email: string };
  approvedBy?: { _id: string, firstName: string, lastName: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  receiptUrl?: string;
  monthWise: string;
  yearWise: string;
}

export const ExpenseManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const isManagerOrAdmin = isAdmin || user?.role === 'MANAGER';

  const [activeTab, setActiveTab] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalAmount: 0, approvedAmount: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{_id: string, firstName: string, lastName: string, username: string, email: string, role: string}[]>([]);

  // Split-view panel
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Filters
  const [filterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  // Dialog State
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    expenseId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    expenseType: 'OFFICE',
    paymentMethod: 'CASH',
    referenceNo: '',
    vendorName: '',
    vendorContact: '',
    vendorGst: '',
    vendorAddress: '',
    category: '',
    description: '',
    amount: '',
    taxAmount: '0',
    totalAmount: '0',
    clientName: '',
    projectWork: '',
    billableStatus: 'NON_BILLABLE',
    paidBy: user?._id || '',
    reimbursementStatus: 'NOT_APPLICABLE',
    remarks: ''
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear, filterStatus, filterType]);

  // Auto-calculate total amount
  useEffect(() => {
    const subtotal = parseFloat(formData.amount) || 0;
    const tax = parseFloat(formData.taxAmount) || 0;
    setFormData(prev => ({ ...prev, totalAmount: (subtotal + tax).toString() }));
  }, [formData.amount, formData.taxAmount]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.append('monthWise', filterMonth);
      if (filterYear) params.append('yearWise', filterYear);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('expenseType', filterType);

      const res = await api.get(`/expense?${params.toString()}`);
      setExpenses(res.data.data);
      setSummary(res.data.summary);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { /* ignore */ }
  };

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleCreateOrUpdate = async () => {
    if (!formData.amount || !formData.category || !formData.paidBy) {
      toast.error('Please fill required fields (Amount, Category, Paid By)');
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      payload.append(key, val);
    });
    if (file) payload.append('billFile', file);

    try {
      const loadingToast = toast.loading(editingExpense ? 'Updating expense details...' : 'Saving expense details...');
      
      if (editingExpense) {
        await api.patch(`/expense/${editingExpense._id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense updated successfully!', { id: loadingToast });
      } else {
        await api.post('/expense', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense recorded successfully!', { id: loadingToast });
      }

      setOpenAddDialog(false);
      setEditingExpense(null);
      resetForm();
      fetchExpenses();
    } catch (err) {
      const error = err as import('axios').AxiosError<{message: string}>;
      toast.error(error.response?.data?.message || `Failed to ${editingExpense ? 'update' : 'create'} expense`);
    }
  };

  const resetForm = () => {
    setFormData({
      expenseId: '', date: format(new Date(), 'yyyy-MM-dd'), expenseType: 'OFFICE',
      paymentMethod: 'CASH', referenceNo: '', vendorName: '', vendorContact: '',
      vendorGst: '', vendorAddress: '', category: '', description: '',
      amount: '', taxAmount: '0', totalAmount: '0', clientName: '',
      projectWork: '', billableStatus: 'NON_BILLABLE', paidBy: user?._id || '',
      reimbursementStatus: 'NOT_APPLICABLE',
      remarks: ''
    });
    setFile(null);
  };

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      expenseId: exp.expenseId || '',
      date: format(new Date(exp.date), 'yyyy-MM-dd'),
      expenseType: exp.expenseType,
      paymentMethod: exp.paymentMethod,
      referenceNo: exp.referenceNo || '',
      vendorName: exp.vendorName || '',
      vendorContact: exp.vendorContact || '',
      vendorGst: exp.vendorGst || '',
      vendorAddress: exp.vendorAddress || '',
      category: exp.category,
      description: exp.description || '',
      amount: exp.amount.toString(),
      taxAmount: exp.taxAmount.toString(),
      totalAmount: exp.totalAmount.toString(),
      clientName: exp.clientName || '',
      projectWork: exp.projectWork || '',
      billableStatus: exp.billableStatus,
      paidBy: exp.paidBy?._id || '',
      reimbursementStatus: 'NOT_APPLICABLE',
      remarks: exp.remarks || ''
    });
    setOpenAddDialog(true);
  };

  const resolveName = (u: { firstName?: string; lastName?: string; name?: string; username?: string } | null | undefined) => {
    if (!u) return '—';
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (u.name) return u.name;
    if (u.username) {
      if (u.username.includes('@')) {
        const part = u.username.split('@')[0];
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
      return u.username;
    }
    return '—';
  };

  const updateStatus = async (id: string, status: string) => {
    const remarks = window.prompt(`Optional remarks for ${status.toLowerCase()}:`);
    try {
      await api.patch(`/expense/${id}/status`, { status, remarks });
      toast.success(`Expense ${status.toLowerCase()}!`);
      fetchExpenses();
    } catch (err) {
      const error = err as import('axios').AxiosError<{message: string}>;
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expense/${id}`);
      toast.success('Expense record deleted');
      fetchExpenses();
    } catch (err) {
      const error = err as import('axios').AxiosError<{message: string}>;
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(new Array(8), (_, index) => (currentYear + 1) - index);

  const filteredExpenses = expenses.filter(exp => 
    exp.expenseId?.toLowerCase().includes(search.toLowerCase()) ||
    exp.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    exp.category?.toLowerCase().includes(search.toLowerCase()) ||
    exp.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 3 } }}>
      {/* Tab Header */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' } }}>
          <Tab label="📋  Expense Ledger" />
          <Tab label="⚖️  Year-End Settlement" />
          <Tab label="💰  Staff Claims & Reimb." />
        </Tabs>
      </Box>

      {activeTab === 2 ? <ExpenseReimbursementPanel /> : activeTab === 1 ? <ExpenseSettlementPanel /> : (<>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#101828' }}>Office Expenses</Typography>
          <Typography variant="body2" color="textSecondary">Comprehensive Tracking & Bill Management</Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setOpenAddDialog(true)} 
          sx={{ borderRadius: 2, px: 4, py: 1.2, background: '#101828', '&:hover': { background: '#1d2939' } }}>
          Record New Expense
        </Button>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #a7f3d0', boxShadow: 'none' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#065f46' }}>✅ Approved Total</Typography>
            <Typography variant="h4" fontWeight={800} color="#047857">₹ {summary.approvedAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a', boxShadow: 'none' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#92400e' }}>⏳ Total Pending</Typography>
            <Typography variant="h4" fontWeight={800} color="#b45309">₹ {(summary.totalAmount - summary.approvedAmount).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe', boxShadow: 'none' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#1e40af' }}>📊 Transactions</Typography>
            <Typography variant="h4" fontWeight={800} color="#1d4ed8">{summary.count}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe', boxShadow: 'none' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: '#5b21b6' }}>💰 Gross Lodged</Typography>
            <Typography variant="h4" fontWeight={800} color="#6d28d9">₹ {summary.totalAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth placeholder="Search by ID, Vendor, or Category..." size="small" value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>, sx: { borderRadius: 2 } }} />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <Select value={filterYear} displayEmpty onChange={e => setFilterYear(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="">All Years</MenuItem>
                {years.map(y => <MenuItem key={y} value={y.toString()}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <Select value={filterStatus} displayEmpty onChange={e => setFilterStatus(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <Select value={filterType} displayEmpty onChange={e => setFilterType(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="OFFICE">Office</MenuItem>
                <MenuItem value="TRAVEL">Travel</MenuItem>
                <MenuItem value="UTILITY">Utility</MenuItem>
                <MenuItem value="SALARY">Salary</MenuItem>
                <MenuItem value="MISC">Misc</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button variant="text" fullWidth color="inherit" onClick={() => { setFilterYear(''); setFilterStatus(''); setFilterType(''); setSearch(''); }}>
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Spend by Category ── */}
      {filteredExpenses.length > 0 && (() => {
        const categoryMap: Record<string, number> = {};
        filteredExpenses.forEach(exp => {
          const cat = exp.category || 'Uncategorized';
          categoryMap[cat] = (categoryMap[cat] || 0) + exp.totalAmount;
        });
        const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const maxVal = sorted[0]?.[1] || 1;
        const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
        return (
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: '#667eea' }} />
              <Typography fontSize="0.72rem" fontWeight={800} letterSpacing={1} color="#475569" sx={{ textTransform: 'uppercase' }}>
                Spend by Category
              </Typography>
            </Stack>
            <Stack spacing={1.2}>
              {sorted.map(([cat, amt], i) => (
                <Box key={cat} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography fontSize="0.78rem" color="#334155" sx={{ width: 130, flexShrink: 0 }}>{cat}</Typography>
                  <Box sx={{ flex: 1, height: 8, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%',
                      width: `${(amt / maxVal) * 100}%`,
                      bgcolor: colors[i % colors.length],
                      borderRadius: 4,
                      transition: 'width 0.6s ease'
                    }} />
                  </Box>
                  <Typography fontSize="0.78rem" fontWeight={700} color="#334155" sx={{ width: 80, textAlign: 'right', flexShrink: 0 }}>
                    ₹{amt.toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        );
      })()}

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', boxShadow: 'none', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f9fafb' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Exp ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Date / Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Vendor / Payee</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 10 }}><Typography color="textDisabled">No transactions found.</Typography></TableCell></TableRow>
            ) : (
              filteredExpenses.map(exp => (
                <TableRow
                  key={exp._id}
                  hover
                  onClick={() => setSelectedExpense(exp)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    bgcolor: selectedExpense?._id === exp._id ? '#eef2ff' : 'transparent',
                    '&:hover': { bgcolor: selectedExpense?._id === exp._id ? '#e0e7ff' : '#f8fafc' },
                    borderLeft: selectedExpense?._id === exp._id ? '3px solid #667eea' : '3px solid transparent',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary">{exp.expenseId}</Typography>
                    <Typography variant="caption" color="textSecondary">{exp.paymentMethod}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{format(new Date(exp.date), 'dd MMM yyyy')}</Typography>
                    <Chip label={exp.expenseType} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{exp.vendorName || 'General Payee'}</Typography>
                    {exp.vendorGst && <Typography variant="caption" color="textSecondary">GST: {exp.vendorGst}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{exp.category}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800}>₹ {exp.totalAmount?.toLocaleString()}</Typography>
                    <Typography variant="caption" color="textSecondary">Tax: ₹{exp.taxAmount}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={exp.status} size="small"
                      color={exp.status === 'APPROVED' ? 'success' : exp.status === 'REJECTED' ? 'error' : 'warning'}
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={e => e.stopPropagation()}>

                      {isManagerOrAdmin && exp.status === 'PENDING' && (
                        <>
                          <IconButton size="small" color="success" onClick={() => updateStatus(exp._id, 'APPROVED')}><CheckCircleIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => updateStatus(exp._id, 'REJECTED')}><CancelIcon fontSize="small" /></IconButton>
                        </>
                      )}
                       <IconButton size="small" color="info" onClick={() => setSelectedExpense(exp)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      {(isAdmin || exp.paidBy?._id === user?._id) && (
                        <IconButton size="small" color="error" onClick={() => deleteExpense(exp._id)}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Split-View Bill Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', md: '75vw', lg: '68vw' },
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
          }
        }}
      >
        {selectedExpense && (
          <>
            {/* LEFT: Bill Entry Details */}
            <Box sx={{
              width: { xs: '100%', md: '42%' },
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fff',
              borderRight: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <Box sx={{ px: 3, py: 2.5, background: '#fff', borderBottom: '2px solid #eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Box>
                  <Typography fontWeight={800} fontSize="1rem" color="#1e293b">Expense Details</Typography>
                  <Typography fontSize="0.75rem" color="#667eea" fontWeight={600}>{selectedExpense.expenseId}</Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  {(isAdmin || selectedExpense.paidBy?._id === user?._id) && (
                    <Tooltip title="Edit Expense">
                      <IconButton size="small" sx={{ color: '#667eea', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }} onClick={() => startEdit(selectedExpense)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { bgcolor: '#f1f5f9' } }} onClick={() => setSelectedExpense(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ overflowY: 'auto', flex: 1, p: 2.5 }}>

                {/* Status Badge */}
                <Box sx={{ mb: 2.5 }}>
                  <Chip
                    label={selectedExpense.status}
                    color={selectedExpense.status === 'APPROVED' ? 'success' : selectedExpense.status === 'REJECTED' ? 'error' : 'warning'}
                    sx={{ fontWeight: 800, fontSize: '0.8rem', px: 1 }}
                  />
                  {selectedExpense.remarks && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                      Remarks: {selectedExpense.remarks}
                    </Typography>
                  )}
                </Box>

                {/* Section: Basic */}
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon sx={{ fontSize: 14, color: '#667eea' }} />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#444">Basic Information</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5 }}>
                    {([
                      ['Date', format(new Date(selectedExpense.date), 'dd MMM yyyy')],
                      ['Type', selectedExpense.expenseType],
                      ['Payment Mode', selectedExpense.paymentMethod],
                      ['Reference No', selectedExpense.referenceNo || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px dashed #f0f0f0' }}>
                        <Typography fontSize="0.78rem" color="text.secondary">{label}</Typography>
                        <Typography fontSize="0.78rem" fontWeight={600}>{val}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Section: Vendor */}
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 14, color: '#667eea' }} />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#444">Vendor Details</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5 }}>
                    {([
                      ['Vendor Name', selectedExpense.vendorName || '—'],
                      ['Contact', selectedExpense.vendorContact || '—'],
                      ['GSTIN', selectedExpense.vendorGst || '—'],
                      ['Address', selectedExpense.vendorAddress || '—'],
                    ] as [string, string][]).map(([label, val]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px dashed #f0f0f0' }}>
                        <Typography fontSize="0.78rem" color="text.secondary">{label}</Typography>
                        <Typography fontSize="0.78rem" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '55%' }}>{val}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Section: Financial */}
                <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2, overflow: 'hidden', border: '1px solid #d1fae5' }}>
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f0fdf4', borderBottom: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon sx={{ fontSize: 14, color: '#10b981' }} />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#065f46">Financial Summary</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5 }}>
                    {([
                      ['Category', selectedExpense.category],
                      ['Base Amount', `₹ ${selectedExpense.amount?.toLocaleString()}`],
                      ['Tax Amount', `₹ ${selectedExpense.taxAmount?.toLocaleString()}`],
                    ] as [string, string][]).map(([label, val]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px dashed #f0f0f0' }}>
                        <Typography fontSize="0.78rem" color="text.secondary">{label}</Typography>
                        <Typography fontSize="0.78rem" fontWeight={600}>{val}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 0.5, borderTop: '2px solid #10b981' }}>
                      <Typography fontSize="0.85rem" fontWeight={700} color="#065f46">Total Amount</Typography>
                      <Typography fontSize="0.85rem" fontWeight={800} color="#065f46">₹ {selectedExpense.totalAmount?.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Section: Allocation */}
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 14, color: '#667eea' }} />
                    <Typography fontSize="0.75rem" fontWeight={700} color="#444">Allocation & Workflow</Typography>
                  </Box>
                  <Box sx={{ px: 2, py: 1.5 }}>
                    {([
                      ['Paid By', resolveName(selectedExpense.paidBy)],
                      ['Approved By', resolveName(selectedExpense.approvedBy)],
                      ['Client', selectedExpense.clientName || '—'],
                      ['Project/Work', selectedExpense.projectWork || '—'],
                      ['Billable Status', selectedExpense.billableStatus],
                    ] as [string, string][]).map(([label, val]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px dashed #f0f0f0' }}>
                        <Typography fontSize="0.78rem" color="text.secondary">{label}</Typography>
                        <Typography fontSize="0.78rem" fontWeight={600}>{val}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>

              </Box>

              {/* Footer Actions */}
              {isManagerOrAdmin && selectedExpense.status === 'PENDING' && (
                <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1.5, flexShrink: 0 }}>
                  <Button fullWidth variant="contained" color="success" size="small"
                    onClick={() => { updateStatus(selectedExpense._id, 'APPROVED'); setSelectedExpense(null); }}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    startIcon={<CheckCircleIcon />}>
                    Approve
                  </Button>
                  <Button fullWidth variant="outlined" color="error" size="small"
                    onClick={() => { updateStatus(selectedExpense._id, 'REJECTED'); setSelectedExpense(null); }}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    startIcon={<CancelIcon />}>
                    Reject
                  </Button>
                </Box>
              )}
            </Box>

            {/* RIGHT: Full Bill / Receipt Viewer */}
            <Box sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              bgcolor: '#f8faff',
              overflow: 'hidden',
            }}>
              {/* Viewer Header */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid #e8ecf8' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon sx={{ color: '#667eea', fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography color="#1e293b" fontWeight={700} fontSize="0.88rem">Bill / Receipt</Typography>
                    <Typography color="#94a3b8" fontSize="0.7rem">Attached document preview</Typography>
                  </Box>
                </Stack>
                {selectedExpense.receiptUrl && (
                  <Tooltip title="Open in new tab">
                    <IconButton size="small" component="a" href={selectedExpense.receiptUrl} target="_blank" sx={{ color: '#667eea', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}>
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Viewer Body */}
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', p: 2 }}>
                {selectedExpense.receiptUrl ? (
                  (() => {
                    const url = selectedExpense.receiptUrl;
                    const isGoogleDrive = url.includes('drive.google.com');
                    let previewUrl = url;
                    const isImage = !url.toLowerCase().endsWith('.pdf');

                    if (isGoogleDrive) {
                      const fileId = url.split('/d/')[1]?.split('/')[0];
                      if (fileId) {
                        // For Google Drive, we use the /preview link for both images and PDFs in an iframe
                        // as it provides a better UI with zoom/rotate
                        previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                        // However, for images we could also use the direct link if we want to use <img>
                        // But /preview works great for both in an iframe.
                      }
                    }

                    if (isGoogleDrive || !isImage) {
                      return (
                        <iframe
                          src={previewUrl}
                          title="Bill Receipt"
                          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: '#fff' }}
                        />
                      );
                    }

                    return (
                      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={previewUrl}
                          alt="Bill Receipt"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          }}
                        />
                      </Box>
                    );
                  })()
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <ReceiptIcon sx={{ fontSize: 40, color: '#c7d2fe' }} />
                    </Box>
                    <Typography fontSize="1rem" fontWeight={700} color="#334155">No Bill Attached</Typography>
                    <Typography fontSize="0.78rem" color="#94a3b8" mt={0.5}>No receipt was uploaded for this expense.</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </>
        )}
      </Drawer>

      {/* Firm Master Style Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3, background: '#101828', color: 'white' }}>
            <Typography variant="h6" fontWeight={700}>{editingExpense ? 'Edit Expense' : 'Log Office Expense'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{editingExpense ? `Updating ${editingExpense.expenseId}` : 'Record financial and operational expenditures'}</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Column 1: Sections 1 and 3 */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <SectionHead title="1. Basic Form" />
                        <Row label="Expense ID"><TextField placeholder="Leave blank for Auto-generate" value={formData.expenseId} onChange={e => setFormData({...formData, expenseId: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Date *"><TextField type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} fullWidth {...sxStyle} InputLabelProps={{ shrink: true }} /></Row>
                        <Row label="Expense Type *">
                            <Select value={formData.expenseType} onChange={e => setFormData({...formData, expenseType: e.target.value})} fullWidth displayEmpty {...selSx}>
                                <MenuItem value="OFFICE">Office</MenuItem>
                                <MenuItem value="TRAVEL">Travel</MenuItem>
                                <MenuItem value="UTILITY">Utility</MenuItem>
                                <MenuItem value="SALARY">Salary</MenuItem>
                                <MenuItem value="MISC">Misc</MenuItem>
                            </Select>
                        </Row>
                        <Row label="Payment Mode *">
                            <Select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} fullWidth displayEmpty {...selSx}>
                                <MenuItem value="CASH">Cash</MenuItem>
                                <MenuItem value="BANK">Bank Transfer</MenuItem>
                                <MenuItem value="UPI">UPI</MenuItem>
                                <MenuItem value="CARD">Card</MenuItem>
                            </Select>
                        </Row>
                        <Row label="Reference No"><TextField placeholder="Transaction ID / Bill No" value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} fullWidth {...sxStyle} /></Row>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <SectionHead title="3. Financial Detail" />
                        <Row label="Category *">
                            <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} fullWidth displayEmpty {...selSx}>
                                <MenuItem value="" disabled><em style={{ color: '#aaa' }}>Choose Category...</em></MenuItem>
                                {['Rent', 'Electricity', 'Internet', 'Stationery', 'Software', 'Professional Fees', 'Miscellaneous'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </Row>
                        <Row label="Amount * (₹)"><TextField type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Tax Amount (₹)"><TextField type="number" value={formData.taxAmount} onChange={e => setFormData({...formData, taxAmount: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Total Amount (₹)"><TextField disabled value={formData.totalAmount} fullWidth {...sxStyle} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb', fontWeight: 700 } }} /></Row>
                        <Row label="Description"><TextField value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} fullWidth multiline rows={2} {...sxStyle} /></Row>
                        
                        <SectionHead title="Bill Upload" />
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                            <Button component="label" size="small" sx={{ bgcolor: '#f1f5f9', color: '#555', borderRadius: 0, px: 2, borderRight: '1px solid #ccc', textTransform: 'none' }}>
                                Choose File
                                <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                            </Button>
                            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file ? file.name : 'No file chosen'}
                            </Typography>
                        </Box>
                    </Paper>
                </Stack>
            </Grid>

            {/* Column 2: Sections 2 and 4 */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <SectionHead title="2. Vendor Detail" />
                        <Row label="Vendor Name"><TextField value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Contact Number"><TextField value={formData.vendorContact} onChange={e => setFormData({...formData, vendorContact: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="GSTIN"><TextField value={formData.vendorGst} onChange={e => setFormData({...formData, vendorGst: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Vendor Address"><TextField value={formData.vendorAddress} onChange={e => setFormData({...formData, vendorAddress: e.target.value})} fullWidth multiline rows={2} {...sxStyle} /></Row>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                        <SectionHead title="4. Allocation & Workflow" />
                        <Row label="Client Name"><TextField value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Project / Work"><TextField value={formData.projectWork} onChange={e => setFormData({...formData, projectWork: e.target.value})} fullWidth {...sxStyle} /></Row>
                        <Row label="Billable Type">
                            <Select value={formData.billableStatus} onChange={e => setFormData({...formData, billableStatus: e.target.value})} fullWidth {...selSx}>
                                <MenuItem value="BILLABLE">Billable</MenuItem>
                                <MenuItem value="NON_BILLABLE">Non-Billable</MenuItem>
                            </Select>
                        </Row>
                        <Row label="Paid By *">
                            <Select value={formData.paidBy} onChange={e => setFormData({...formData, paidBy: e.target.value})} fullWidth {...selSx}>
                                {users.map((u) => (
                                    <MenuItem key={u._id} value={u._id}>{resolveName(u)} ({u.role})</MenuItem>
                                ))}
                                {users.length === 0 && <MenuItem value={user?._id}>{resolveName(user)} ({user?.role})</MenuItem>}
                            </Select>
                        </Row>
                        <Row label="Reimbursement">
                            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', p: 1, px: 2, bgcolor: formData.reimbursementStatus === 'PENDING' ? '#f0fdf4' : 'transparent' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <input 
                                       type="checkbox" 
                                       checked={formData.reimbursementStatus === 'PENDING'} 
                                       onChange={(e) => setFormData({...formData, reimbursementStatus: e.target.checked ? 'PENDING' : 'NOT_APPLICABLE'})} 
                                    />
                                    Claim Reimbursement (Paid from personal funds)
                                </label>
                            </Box>
                        </Row>
                    </Paper>
                </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid #e5e7eb', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleCreateOrUpdate} disabled={loading} sx={{ px: 6, py: 1, borderRadius: 2, textTransform: 'none', background: '#101828' }}>
            {editingExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
          <Button variant="outlined" onClick={() => { setOpenAddDialog(false); setEditingExpense(null); }} color="error" sx={{ px: 6, py: 1, borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </>)}
    </Box>
  );
};

export default ExpenseManagement;
