// Year-End Partner Expense Settlement Panel
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, Alert, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  LinearProgress, IconButton
} from '@mui/material';
import {
  Balance as BalanceIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  HourglassBottom as PendingIcon,
  Payments as PayIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettlementPartner {
  userId: string;
  name: string;
  sharePercent: number;
  shareAmount: number;
  amountPaid: number;
  balance: number;
}

interface Settlement {
  _id: string;
  settlementId: string;
  year: string;
  totalExpense: number;
  partners: SettlementPartner[];
  status: 'OPEN' | 'PARTIAL' | 'SETTLED';
  paymentMode?: string;
  paymentReference?: string;
  notes?: string;
}

interface PreviewData {
  year: string;
  totalExpense: number;
  expenseCount: number;
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
}

interface PartnerForm {
  userId: string;
  name: string;
  sharePercent: number;
  amountPaid: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sxStyle = { size: 'small' as const, sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.82rem' } } };
const selSx = { size: 'small' as const, sx: { borderRadius: '8px', fontSize: '0.82rem' } };

const statusColor = (s: string) =>
  s === 'SETTLED' ? 'success' : s === 'PARTIAL' ? 'warning' : 'default';

function generateFinancialYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => {
    const yr = current - i;
    return `${yr}-${String(yr + 1).slice(-2)}`;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export const ExpenseSettlementPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openSettle, setOpenSettle] = useState<Settlement | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Create form
  const [createYear, setCreateYear] = useState(generateFinancialYears()[0]);
  const [partners, setPartners] = useState<PartnerForm[]>([
    { userId: user?._id || '', name: user ? `${user.firstName} ${user.lastName}` : '', sharePercent: 50, amountPaid: 0 },
    { userId: '', name: '', sharePercent: 50, amountPaid: 0 }
  ]);
  const [notes, setNotes] = useState('');

  // Settle form
  const [settlePayMode, setSettlePayMode] = useState('BANK');
  const [settleRef, setSettleRef] = useState('');
  const [settlePartners, setSettlePartners] = useState<SettlementPartner[]>([]);

  const fyList = generateFinancialYears();

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const res = await api.get('/expense-settlement');
      setSettlements(res.data.data);
    } catch { /* silent */ }
  };

  const fetchPreview = async (year: string) => {
    setLoadingPreview(true);
    setPreview(null);
    try {
      const res = await api.get(`/expense-settlement/preview?year=${year}`);
      setPreview(res.data as PreviewData);
    } catch {
      toast.error('Failed to load expense preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const totalSharePercent = partners.reduce((s, p) => s + Number(p.sharePercent || 0), 0);

  const handlePartnerChange = (idx: number, field: keyof PartnerForm, val: string | number) => {
    const updated = [...partners];
    (updated[idx] as Record<string, string | number>)[field] = val;
    setPartners(updated);
  };

  const handleCreate = async () => {
    if (Math.abs(totalSharePercent - 100) > 0.01) {
      toast.error(`Shares must total 100%. Currently: ${totalSharePercent}%`);
      return;
    }
    try {
      const loading = toast.loading('Creating settlement record...');
      await api.post('/expense-settlement', { year: createYear, partners, notes });
      toast.success('Settlement created!', { id: loading });
      setOpenCreate(false);
      fetchSettlements();
    } catch (err) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to create settlement');
    }
  };

  const handleSettle = async () => {
    if (!openSettle) return;
    try {
      const loading = toast.loading('Recording payment...');
      await api.patch(`/expense-settlement/${openSettle._id}/settle`, {
        paymentMode: settlePayMode,
        paymentReference: settleRef,
        partners: settlePartners
      });
      toast.success('Settlement updated!', { id: loading });
      setOpenSettle(null);
      fetchSettlements();
    } catch (err) {
      const error = err as import('axios').AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this settlement record?')) return;
    try {
      await api.delete(`/expense-settlement/${id}`);
      toast.success('Deleted');
      fetchSettlements();
    } catch { toast.error('Delete failed'); }
  };

  const openSettleDialog = (s: Settlement) => {
    setOpenSettle(s);
    setSettlePayMode(s.paymentMode || 'BANK');
    setSettleRef(s.paymentReference || '');
    setSettlePartners(s.partners.map(p => ({ ...p })));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} color="#1e293b">Year-End Settlements</Typography>
          <Typography variant="body2" color="text.secondary">
            Divide &amp; clear approved office expenses between firm partners at financial year end
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setOpenCreate(true); fetchPreview(createYear); }}
            sx={{ bgcolor: '#101828', borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#1f2937' } }}
          >
            New Settlement
          </Button>
        )}
      </Stack>

      {/* How it works banner */}
      <Alert
        icon={<BalanceIcon />}
        severity="info"
        sx={{ mb: 4, borderRadius: '12px', border: '1px solid #bfdbfe' }}
      >
        <Typography variant="body2" fontWeight={700}>How Year-End Settlement Works</Typography>
        <Typography variant="body2">
          1. All <strong>APPROVED</strong> expenses for the financial year are totalled automatically. &nbsp;
          2. You divide them by partner share % (must equal 100%). &nbsp;
          3. Record how much each partner has already paid. &nbsp;
          4. The system shows who owes whom and allows you to mark it as <strong>SETTLED</strong>.
        </Typography>
      </Alert>

      {/* Settlement Records */}
      {settlements.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <BalanceIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>No settlements yet</Typography>
          <Typography variant="body2" color="text.secondary">Create your first year-end settlement to get started</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {settlements.map(s => {
            const totalPaid = s.partners.reduce((sum, p) => sum + p.amountPaid, 0);
            const progress = s.totalExpense > 0 ? (totalPaid / s.totalExpense) * 100 : 0;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={s._id}>
                <Paper sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                  {/* Card Header */}
                  <Box sx={{ px: 3, py: 2, bgcolor: '#101828', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>FY {s.year}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>{s.settlementId}</Typography>
                    </Box>
                    <Chip
                      label={s.status}
                      size="small"
                      color={statusColor(s.status) as 'success' | 'warning' | 'default'}
                      icon={s.status === 'SETTLED' ? <CheckCircleIcon /> : <PendingIcon />}
                      sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                    />
                  </Box>

                  <Box sx={{ p: 3 }}>
                    {/* Totals */}
                    <Stack direction="row" justifyContent="space-between" mb={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL APPROVED EXPENSE</Typography>
                        <Typography variant="h5" fontWeight={900} color="primary.main">₹ {s.totalExpense.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL PAID</Typography>
                        <Typography variant="h5" fontWeight={900} color="success.main">₹ {totalPaid.toLocaleString()}</Typography>
                      </Box>
                    </Stack>

                    {/* Progress */}
                    <Box mb={2}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(progress, 100)}
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: progress >= 100 ? '#10b981' : '#f59e0b' } }}
                      />
                      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{Math.round(progress)}% settled</Typography>
                    </Box>

                    {/* Partner Table */}
                    <TableContainer sx={{ mb: 2, border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>PARTNER</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>SHARE</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>SHOULD PAY</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>PAID</TableCell>
                            <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem' }}>BALANCE</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {s.partners.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell><Typography variant="body2" fontWeight={700}>{p.name}</Typography></TableCell>
                              <TableCell><Chip label={`${p.sharePercent}%`} size="small" sx={{ fontSize: '0.7rem' }} /></TableCell>
                              <TableCell><Typography variant="body2" fontWeight={600}>₹{p.shareAmount.toLocaleString()}</Typography></TableCell>
                              <TableCell><Typography variant="body2" color="success.main" fontWeight={600}>₹{p.amountPaid.toLocaleString()}</Typography></TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={800} color={p.balance > 0 ? 'error.main' : 'success.main'}>
                                  {p.balance > 0 ? `₹${p.balance.toLocaleString()} owes` : p.balance < 0 ? `₹${Math.abs(p.balance).toLocaleString()} overpaid` : '✓ Clear'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {s.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        📝 {s.notes}
                      </Typography>
                    )}

                    {/* Actions */}
                    {isAdmin && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {s.status !== 'SETTLED' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PayIcon />}
                            onClick={() => openSettleDialog(s)}
                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                          >
                            Record Payment
                          </Button>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Create Settlement Dialog ──────────────────────────────────── */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, bgcolor: '#101828', color: 'white' }}>
            <Typography variant="h6" fontWeight={800}>Create Year-End Settlement</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>Select financial year and define partner shares</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>

          {/* Year Picker */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={800} mb={1.5}>📅 Financial Year</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Select value={createYear} onChange={e => { setCreateYear(e.target.value); fetchPreview(e.target.value); }} {...selSx} sx={{ width: 180, borderRadius: '8px' }}>
                {fyList.map(y => <MenuItem key={y} value={y}>FY {y}</MenuItem>)}
              </Select>
              <Typography variant="body2" color="text.secondary">
                Apr {createYear.split('-')[0]} – Mar 20{createYear.split('-')[1]}
              </Typography>
            </Stack>
          </Paper>

          {/* Preview */}
          {loadingPreview && <LinearProgress sx={{ mb: 2, borderRadius: 4 }} />}
          {preview && (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3, bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
              <Typography variant="subtitle2" fontWeight={800} mb={1.5}>📊 Expense Summary for FY {preview.year}</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">Total APPROVED</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">₹{preview.totalExpense.toLocaleString()}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">No. of Expenses</Typography>
                  <Typography variant="h6" fontWeight={900}>{preview.expenseCount}</Typography>
                </Grid>
                {Object.entries(preview.byCategory || {}).slice(0, 4).map(([cat, amt]) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={cat}>
                    <Typography variant="caption" color="text.secondary">{cat}</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{(amt as number).toLocaleString()}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Partners */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={800}>👥 Partner Shares (must = 100%)</Typography>
              <Chip
                label={`${totalSharePercent}% / 100%`}
                color={Math.abs(totalSharePercent - 100) < 0.01 ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            </Stack>

            {partners.map((p, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                <TextField
                  label="Partner Name"
                  value={p.name}
                  onChange={e => handlePartnerChange(idx, 'name', e.target.value)}
                  {...sxStyle}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Share %"
                  type="number"
                  value={p.sharePercent}
                  onChange={e => handlePartnerChange(idx, 'sharePercent', parseFloat(e.target.value) || 0)}
                  {...sxStyle}
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Already Paid ₹"
                  type="number"
                  value={p.amountPaid}
                  onChange={e => handlePartnerChange(idx, 'amountPaid', parseFloat(e.target.value) || 0)}
                  {...sxStyle}
                  sx={{ flex: 1 }}
                />
                {preview && (
                  <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                    <Typography variant="caption" color="text.secondary">Share Amt</Typography>
                    <Typography variant="body2" fontWeight={800} color="primary.main">
                      ₹{((preview.totalExpense * p.sharePercent) / 100).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {partners.length > 2 && (
                  <IconButton size="small" color="error" onClick={() => setPartners(partners.filter((_, i) => i !== idx))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button size="small" startIcon={<AddIcon />} onClick={() => setPartners([...partners, { userId: '', name: '', sharePercent: 0, amountPaid: 0 }])} sx={{ textTransform: 'none' }}>
              Add Partner
            </Button>
          </Paper>

          {/* Balance Preview */}
          {preview && Math.abs(totalSharePercent - 100) < 0.01 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3, bgcolor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Typography variant="subtitle2" fontWeight={800} mb={1}>⚖️ Settlement Preview</Typography>
              {partners.map((p, i) => {
                const shareAmt = (preview.totalExpense * p.sharePercent) / 100;
                const balance = shareAmt - p.amountPaid;
                return (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: i < partners.length - 1 ? '1px solid #d1fae5' : 'none' }}>
                    <Typography variant="body2" fontWeight={700}>{p.name || `Partner ${i + 1}`}</Typography>
                    <Typography variant="body2" fontWeight={800} color={balance > 0 ? 'error.main' : 'success.main'}>
                      {balance > 0 ? `Owes ₹${balance.toFixed(2)}` : balance < 0 ? `Overpaid ₹${Math.abs(balance).toFixed(2)}` : '✓ All clear'}
                    </Typography>
                  </Stack>
                );
              })}
            </Paper>
          )}

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            fullWidth multiline rows={2} {...sxStyle}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'white', borderTop: '1px solid #e2e8f0', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={Math.abs(totalSharePercent - 100) > 0.01}
            sx={{ bgcolor: '#101828', px: 6, borderRadius: '10px', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#1f2937' } }}
          >
            Create Settlement
          </Button>
          <Button variant="outlined" onClick={() => setOpenCreate(false)} color="error" sx={{ px: 6, borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Record Payment Dialog ─────────────────────────────────────── */}
      <Dialog open={!!openSettle} onClose={() => setOpenSettle(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, bgcolor: '#10b981', color: 'white' }}>
            <Typography variant="h6" fontWeight={800}>Record Settlement Payment</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>FY {openSettle?.year} — ₹{openSettle?.totalExpense.toLocaleString()}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" fontWeight={700} mb={1}>Payment Mode</Typography>
              <Select value={settlePayMode} onChange={e => setSettlePayMode(e.target.value)} fullWidth {...selSx}>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="BANK">Bank Transfer</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
              </Select>
            </Box>
            <TextField label="Payment Reference / UTR" value={settleRef} onChange={e => setSettleRef(e.target.value)} fullWidth {...sxStyle} />
            <Divider />
            <Typography variant="body2" fontWeight={800}>Update Partner Payments</Typography>
            {settlePartners.map((p, idx) => (
              <Stack key={idx} direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" fontWeight={700} sx={{ flex: 1 }}>{p.name}</Typography>
                <Typography variant="caption" color="text.secondary">Share: ₹{p.shareAmount.toLocaleString()}</Typography>
                <TextField
                  label="Amount Paid ₹"
                  type="number"
                  value={p.amountPaid}
                  onChange={e => {
                    const updated = [...settlePartners];
                    updated[idx] = {
                      ...updated[idx],
                      amountPaid: parseFloat(e.target.value) || 0,
                      balance: parseFloat((updated[idx].shareAmount - (parseFloat(e.target.value) || 0)).toFixed(2))
                    };
                    setSettlePartners(updated);
                  }}
                  {...sxStyle}
                  sx={{ width: 160 }}
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSettle}
            sx={{ bgcolor: '#10b981', px: 6, borderRadius: '10px', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#059669' } }}
          >
            Confirm Payment
          </Button>
          <Button variant="outlined" onClick={() => setOpenSettle(null)} sx={{ px: 4, borderRadius: '10px', textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseSettlementPanel;
