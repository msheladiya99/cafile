// Staff Monthly Reimbursement Panel
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Grid,
  Alert, Divider, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer,
  IconButton, CircularProgress, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import {
  AccountBalanceWallet as ReimburseIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as ViewIcon,
  Payments as PayIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Expense {
  _id: string;
  expenseId: string;
  date: string;
  category: string;
  totalAmount: number;
  status: string;
  reimbursementStatus: string;
  paymentMethod: string;
  paidBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reimbursedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reimbursedAt?: string;
}

export const ExpenseReimbursementPanel: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [viewDetails, setViewDetails] = useState<Expense[]>([]);
  
  // Transfer Confirm States
  const [transferConfirmStaffId, setTransferConfirmStaffId] = useState<string | null>(null);
  const [transferAdminId, setTransferAdminId] = useState<string>(user?._id || '');

  useEffect(() => {
    fetchExpenses();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { /* ignore */ }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      // Fetch all approved expenses
      const res = await api.get('/expense?status=APPROVED');
      setExpenses(res.data.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Filter only pending reimbursements
  const pendingReimbursements = expenses.filter(e => e.reimbursementStatus === 'PENDING');
  
  // Previously cleared reimbursements
  const pastReimbursements = expenses.filter(e => e.reimbursementStatus === 'REIMBURSED')
                                      .sort((a, b) => new Date(b.reimbursedAt || 0).getTime() - new Date(a.reimbursedAt || 0).getTime())
                                      .slice(0, 10); // Show last 10

  // Group by Staff for 'PENDING'
  const staffClaims: Record<string, { staff: any, totalAmount: number, expenses: Expense[] }> = {};
  pendingReimbursements.forEach(exp => {
    if (!exp.paidBy) return;
    const staffId = exp.paidBy._id;
    if (!staffClaims[staffId]) {
      staffClaims[staffId] = { staff: exp.paidBy, totalAmount: 0, expenses: [] };
    }
    staffClaims[staffId].totalAmount += exp.totalAmount;
    staffClaims[staffId].expenses.push(exp);
  });

  const handleReimburse = (staffId: string) => {
    setTransferConfirmStaffId(staffId);
  };

  const confirmAndSubmitReimburse = async () => {
    if (!transferConfirmStaffId) return;
    
    // We pass both expenseIds array and the administrator ID handling it
    const expenseIds = staffClaims[transferConfirmStaffId].expenses.map(e => e._id);
    try {
      const loadingToast = toast.loading('Processing reimbursement transfer...');
      await api.patch('/expense/reimburse', { expenseIds, reimbursedBy: transferAdminId });
      toast.success('Funds successfully cleared & reimbursed!', { id: loadingToast });
      
      setTransferConfirmStaffId(null);
      setSelectedStaff(null);
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to reimburse claims');
    }
  };

  if (loading) {
    return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  const claimEntries = Object.values(staffClaims);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1e293b">Staff Reimbursements</Typography>
          <Typography variant="body2" color="text.secondary">
            Process out-of-pocket expenses paid by team members
          </Typography>
        </Box>
      </Stack>

      <Alert
        icon={<ReimburseIcon />}
        severity="info"
        sx={{ mb: 4, borderRadius: '12px', bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
      >
        <Typography variant="body2" fontWeight={700}>How Reimbursements Work</Typography>
        <Typography variant="body2">
          When staff create an expense and mark it <strong>"Claim Reimbursement"</strong>, it appears here once <strong>APPROVED</strong>. You can view their total out-of-pocket spend and clear it in one click.
        </Typography>
      </Alert>

      {claimEntries.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>All Caught Up!</Typography>
          <Typography variant="body2" color="text.secondary">No pending staff reimbursements</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {claimEntries.map(claim => (
            <Grid item xs={12} md={6} lg={4} key={claim.staff._id}>
              <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', bgcolor: '#f59e0b' }} />
                
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box pl={2}>
                    <Typography variant="h6" fontWeight={800}>{claim.staff.firstName} {claim.staff.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                      {claim.expenses.length} Pending Bills
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    icon={<WarningIcon fontSize="small" />}
                    label="Unpaid Claims"
                    color="warning"
                    sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box pl={2} mb={3}>
                  <Typography variant="caption" color="text.secondary">TOTAL DUE TO STAFF</Typography>
                  <Typography variant="h4" fontWeight={900} color="#b45309">
                    ₹{claim.totalAmount.toLocaleString()}
                  </Typography>
                </Box>

                <Stack pl={2} direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    size="small"
                    onClick={() => { setSelectedStaff(claim.staff._id); setViewDetails(claim.expenses); }}
                    sx={{ flex: 1, borderRadius: '8px', fontWeight: 700 }}
                  >
                    View Bills
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PayIcon />}
                    size="small"
                    onClick={() => handleReimburse(claim.staff._id)}
                    sx={{ flex: 1, borderRadius: '8px', fontWeight: 800, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                  >
                    Transfer
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedStaff} onClose={() => setSelectedStaff(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white', py: 2 }}>
          <Typography variant="h6" fontWeight={800}>Claim Breakdown</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>BILL NO</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>CATEGORY</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>PAID VIA</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>AMOUNT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewDetails.map(exp => (
                  <TableRow key={exp._id} hover>
                    <TableCell>{format(new Date(exp.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell><Typography variant="body2" fontFamily="monospace">{exp.expenseId}</Typography></TableCell>
                    <TableCell>{exp.category}</TableCell>
                    <TableCell><Chip size="small" label={exp.paymentMethod} sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={800}>₹{exp.totalAmount.toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setSelectedStaff(null)} variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }}>
            Close Listing
          </Button>
          <Button
            onClick={() => { if (selectedStaff) handleReimburse(selectedStaff); }}
            variant="contained"
            startIcon={<PayIcon />}
            sx={{ borderRadius: '8px', fontWeight: 800, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Clear Total (₹{viewDetails.reduce((s, e) => s + e.totalAmount, 0).toLocaleString()})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Confirmation Dialog */}
      <Dialog open={!!transferConfirmStaffId} onClose={() => setTransferConfirmStaffId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800}>Confirm Transfer</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
             <PayIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
             <Typography variant="body1" fontWeight={700}>
               Are you sure you want to clear the claims for {transferConfirmStaffId && staffClaims[transferConfirmStaffId]?.staff.firstName}?
             </Typography>
             <Typography variant="h5" fontWeight={900} color="success.main" sx={{ my: 1 }}>
               ₹{transferConfirmStaffId && staffClaims[transferConfirmStaffId]?.totalAmount.toLocaleString()}
             </Typography>
          </Box>
          
          <FormControl fullWidth size="small" sx={{ textAlign: 'left' }}>
            <InputLabel id="admin-select-label">Select Transferring Admin</InputLabel>
            <Select
              labelId="admin-select-label"
              label="Select Transferring Admin"
              value={transferAdminId}
              onChange={(e) => setTransferAdminId(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              {users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').map((u: any) => (
                <MenuItem key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role})</MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              The system will record this transfer was completed by the selected administrator.
            </Typography>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>
          <Button onClick={() => setTransferConfirmStaffId(null)} variant="outlined" sx={{ borderRadius: '8px', flex: 1 }}>
            Cancel
          </Button>
          <Button
            onClick={confirmAndSubmitReimburse}
            variant="contained"
            color="success"
            sx={{ borderRadius: '8px', flex: 1, fontWeight: 800 }}
          >
            Confirm & Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reimbursement History */}
      {pastReimbursements.length > 0 && (
        <Box mt={6}>
          <Typography variant="h6" fontWeight={800} mb={2}>Recent Transfers & Clearing History</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>DATE CLEARED</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STAFF PAID TO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>BILL EXPENSE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>AMOUNT (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>CLEARED BY (ADMIN)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pastReimbursements.map(exp => (
                  <TableRow key={exp._id}>
                    <TableCell>{exp.reimbursedAt ? format(new Date(exp.reimbursedAt), 'dd MMM yyyy, hh:mm a') : '-'}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={800}>{exp.paidBy?.firstName} {exp.paidBy?.lastName}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{exp.category} ({exp.expenseId})</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" color="success.main" fontWeight={800}>₹{exp.totalAmount.toLocaleString()}</Typography></TableCell>
                    <TableCell>
                      {exp.reimbursedBy ? (
                        <Chip size="small" label={`${exp.reimbursedBy.firstName} ${exp.reimbursedBy.lastName}`} sx={{ bgcolor: '#ede9fe', color: '#5b21b6', fontWeight: 600, fontSize: '0.7rem' }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">System / Unknown</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

    </Box>
  );
};

export default ExpenseReimbursementPanel;
