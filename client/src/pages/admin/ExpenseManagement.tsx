// Office Expense Management Component
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Stack, Chip,
  Grid, CircularProgress, Select, FormControl, InputAdornment, Tabs, Tab
} from '@mui/material';
import { 
  Add as AddIcon, Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon, 
  Visibility as ViewIcon, Search as SearchIcon
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

  const handleCreate = async () => {
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
      const loadingToast = toast.loading('Saving expense details...');
      await api.post('/expense', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Expense recorded successfully!', { id: loadingToast });
      setOpenAddDialog(false);
      resetForm();
      fetchExpenses();
    } catch (err) {
      const error = err as import('axios').AxiosError<{message: string}>;
      toast.error(error.response?.data?.message || 'Failed to create expense');
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
  const years = Array.from(new Array(5), (_, index) => currentYear - index);

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
          <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '6px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'text.secondary' }}>Approved Total</Typography>
            <Typography variant="h4" fontWeight={800}>₹ {summary.approvedAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '6px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'text.secondary' }}>Total Pending</Typography>
            <Typography variant="h4" fontWeight={800} color="warning.main">₹ {(summary.totalAmount - summary.approvedAmount).toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, borderLeft: '6px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'text.secondary' }}>Total Transactions</Typography>
            <Typography variant="h4" fontWeight={800}>{summary.count}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, color: 'text.secondary' }}>Gross Lodged</Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary">₹ {summary.totalAmount.toLocaleString()}</Typography>
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
                <TableRow key={exp._id} hover>
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
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {exp.receiptUrl && (
                        <IconButton size="small" component="a" href={exp.receiptUrl} target="_blank" color="info">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      )}
                      {isManagerOrAdmin && exp.status === 'PENDING' && (
                        <>
                          <IconButton size="small" color="success" onClick={() => updateStatus(exp._id, 'APPROVED')}><CheckCircleIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => updateStatus(exp._id, 'REJECTED')}><CancelIcon fontSize="small" /></IconButton>
                        </>
                      )}
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

      {/* Firm Master Style Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ p: 3, background: '#101828', color: 'white' }}>
            <Typography variant="h6" fontWeight={700}>Log Office Expense</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Record financial and operational expenditures</Typography>
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
                                {users.map((u: any) => {
                                    const displayName = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : (u.name || u.username);
                                    return <MenuItem key={u._id} value={u._id}>{displayName} ({u.role})</MenuItem>;
                                })}
                                {users.length === 0 && <MenuItem value={user?._id}>{(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : (user?.name || user?.username)} ({user?.role})</MenuItem>}
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
          <Button variant="contained" color="primary" onClick={handleCreate} disabled={loading} sx={{ px: 6, py: 1, borderRadius: 2, textTransform: 'none', background: '#101828' }}>
            Save Expense
          </Button>
          <Button variant="outlined" onClick={() => setOpenAddDialog(false)} color="error" sx={{ px: 6, py: 1, borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </>)}
    </Box>
  );
};

export default ExpenseManagement;
