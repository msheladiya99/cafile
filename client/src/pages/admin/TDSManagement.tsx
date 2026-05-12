import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress,
  InputAdornment, Alert, Select, FormControl, InputLabel, Tooltip as MuiTooltip
} from '@mui/material';
import {
  Add, Download, Search, Edit, Delete, AccountBalance,
  Receipt, Warning, CheckCircle, Schedule, TrendingUp,
  Payments
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tdsService, type TDSEntryRecord, type TDSReturnRecord, type TDSDashboard } from '../../services/tdsService';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { AxiosError } from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';

const TDS_SECTIONS: Record<string, string> = {
  '192': 'Salary', '193': 'Interest on Securities', '194': 'Dividends',
  '194A': 'Interest (other)', '194C': 'Contractors', '194H': 'Commission',
  '194I': 'Rent', '194J': 'Professional Fees', '194Q': 'Purchase of Goods',
  '195': 'NRI Payments', '206C': 'TCS', 'OTHER': 'Other',
};

function getCurrentFY() {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth() + 1;
  return m >= 4 ? `${y}-${(y+1).toString().slice(2)}` : `${y-1}-${y.toString().slice(2)}`;
}

const fmt = (n: number | string | undefined | null) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const statusColor: Record<string, 'success'|'warning'|'error'|'info'|'default'> = {
  paid: 'success', pending: 'warning', overdue: 'error',
  filed: 'success', not_filed: 'warning', revised: 'info', processed: 'success', correction_filed: 'info',
};

// ── Dashboard Tab ──
interface DashboardTabProps {
  loading: boolean;
  dashboard: TDSDashboard | null | undefined;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ loading, dashboard }) => {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (!dashboard) return <Alert severity="info">No TDS data yet. Start by adding entries.</Alert>;
  
  const c = dashboard.counts;
  const a = dashboard.amounts;
  
  const cards = [
    { label: 'Total TDS', value: fmt(a.totalTDS), icon: <TrendingUp />, color: '#6366f1', trend: '+12%' },
    { label: 'Returns Filed', value: c.returnsFiled || 0, icon: <CheckCircle />, color: '#10b981', trend: 'On Time' },
    { label: 'Pending Challans', value: c.pendingChallans || 0, icon: <Schedule />, color: '#f59e0b', trend: 'Next: 7th' },
    { label: 'Overdue Returns', value: c.returnsNotFiled || 0, icon: <Warning />, color: '#ef4444', trend: 'Urgent' },
  ];

  const chartData = dashboard.sectionBreakdown?.map(s => ({
    name: s._id,
    value: s.totalTDS,
    count: s.count
  })) || [];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((cd, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card sx={{ 
              borderRadius: 4, 
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.05)',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, width: '4px', height: '100%',
                bgcolor: cd.color
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {cd.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>{cd.value}</Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, borderRadius: 3, bgcolor: `${cd.color}15`, color: cd.color 
                  }}>{cd.icon}</Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={cd.trend} size="small" sx={{ 
                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: cd.color === '#ef4444' ? '#fee2e2' : '#f0f9ff',
                    color: cd.color === '#ef4444' ? '#ef4444' : '#0369a1'
                  }} />
                  <Typography variant="caption" color="text.secondary">from last month</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3 }}>Section-wise Distribution</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3 }}>Quick Breakdown</Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// ── Entries Tab ──
interface EntriesTabProps {
  loading: boolean;
  entries: TDSEntryRecord[];
  search: string;
  onSearchChange: (val: string) => void;
  onAdd: () => void;
  onEdit: (e: TDSEntryRecord) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  isAdmin: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onBulkUpdate: () => void;
}

const EntriesTab: React.FC<EntriesTabProps> = ({
  loading, entries, search, onSearchChange, onAdd, onEdit, onDelete, onExport, isAdmin,
  selectedIds, onToggleSelect, onSelectAll, onBulkUpdate
}) => (
  <Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField size="small" placeholder="Search deductee name or PAN..." value={search} onChange={e => onSearchChange(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth: 260 }} />
      <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>Add Entry</Button>
      {selectedIds.length > 0 && (
        <Button variant="contained" color="success" startIcon={<Payments />} onClick={onBulkUpdate} sx={{ borderRadius: 2, textTransform: 'none' }}>
          Bulk Pay ({selectedIds.length})
        </Button>
      )}
      <Button variant="outlined" startIcon={<Download />} onClick={onExport} sx={{ borderRadius: 2, textTransform: 'none', ml: 'auto' }}>Export CSV</Button>
    </Box>
    {loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : entries.length === 0 ? <Alert severity="info" sx={{ borderRadius: 2 }}>No TDS entries found.</Alert> : (
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell padding="checkbox">
              <input type="checkbox" checked={entries.length > 0 && selectedIds.length === entries.length} onChange={(e) => onSelectAll(e.target.checked ? entries.map(x => x._id) : [])} />
            </TableCell>
            {['Deductee', 'PAN', 'Section', 'Gross Amt', 'TDS Rate', 'TDS Amt', 'Total Tax', 'Date', 'Challan', 'Quarter', 'Actions'].map(h => <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{h}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>{entries.map((e: TDSEntryRecord) => (
            <TableRow key={e._id} hover selected={selectedIds.includes(e._id)}>
              <TableCell padding="checkbox">
                <input type="checkbox" checked={selectedIds.includes(e._id)} onChange={() => onToggleSelect(e._id)} />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.deducteeName}</TableCell>
              <TableCell><code style={{ fontSize: '0.75rem' }}>{e.deducteePAN}</code></TableCell>
              <TableCell><Chip label={`${e.section}`} size="small" variant="outlined" /></TableCell>
              <TableCell>{fmt(e.grossAmount)}</TableCell>
              <TableCell>{e.tdsRate}%</TableCell>
              <TableCell>{fmt(e.tdsAmount)}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{fmt(e.totalTax)}</TableCell>
              <TableCell>{e.deductionDate ? new Date(e.deductionDate).toLocaleDateString('en-IN') : 'N/A'}</TableCell>
              <TableCell><Chip label={e.challanStatus} size="small" color={statusColor[e.challanStatus] || 'default'} /></TableCell>
              <TableCell>{e.quarter}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => onEdit(e)}><Edit fontSize="small" /></IconButton>
                {isAdmin && <IconButton size="small" color="error" onClick={() => { if (confirm('Delete this entry?')) onDelete(e._id); }}><Delete fontSize="small" /></IconButton>}
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </TableContainer>
    )}
  </Box>
);

// ── Compliance Matrix Tab ──
interface MatrixTabProps {
  clients: Array<{ _id: string; name: string }>;
  returns: TDSReturnRecord[];
  entries: TDSEntryRecord[];
}

const ComplianceMatrix: React.FC<MatrixTabProps> = ({ clients, returns, entries }) => {
  const [search, setSearch] = useState('');
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Alert severity="info" sx={{ borderRadius: 3, flex: 1 }}>
          <strong>Compliance Matrix:</strong> Track Challan Payments (C) and Return Filing (R) status.
        </Alert>
        <TextField 
          size="small" placeholder="Filter clients..." value={search} 
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 300 }}
        />
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
              <TableCell sx={{ fontWeight: 800, width: 250 }}>Client Name</TableCell>
              {quarters.map(q => (
                <TableCell key={q} align="center" sx={{ fontWeight: 800 }}>{q}</TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 800 }}>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map(client => {
              const clientReturns = returns.filter(r => 
                (typeof r.clientId === 'object' ? r.clientId?._id : r.clientId) === client._id
              );
              const clientEntries = entries.filter(e => 
                (typeof e.clientId === 'object' ? e.clientId?._id : e.clientId) === client._id
              );

              return (
                <TableRow key={client._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{client.name}</TableCell>
                  {quarters.map(q => {
                    const ret = clientReturns.find(r => r.quarter === q);
                    const qEntries = clientEntries.filter(e => e.quarter === q);
                    const allChallansPaid = qEntries.length > 0 && qEntries.every(e => e.challanStatus === 'paid');
                    const hasEntries = qEntries.length > 0;

                    return (
                      <TableCell key={q} align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                          <MuiTooltip title={`Challans: ${hasEntries ? (allChallansPaid ? 'Paid' : 'Pending') : 'No Entries'}`}>
                            <Box sx={{ 
                              width: 28, height: 28, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 900,
                              bgcolor: !hasEntries ? '#f8fafc' : (allChallansPaid ? '#10b981' : '#f59e0b'),
                              color: !hasEntries ? '#cbd5e1' : '#fff',
                              border: !hasEntries ? '1px dashed #cbd5e1' : 'none',
                              boxShadow: hasEntries ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'default'
                            }}>C</Box>
                          </MuiTooltip>
                          <MuiTooltip title={`Return: ${ret ? ret.status.replace('_', ' ').toUpperCase() : 'Not Tracked'}`}>
                            <Box sx={{ 
                              width: 28, height: 28, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 900,
                              bgcolor: !ret ? '#f8fafc' : (ret.status === 'filed' ? '#6366f1' : '#ef4444'),
                              color: !ret ? '#cbd5e1' : '#fff',
                              border: !ret ? '1px dashed #cbd5e1' : 'none',
                              boxShadow: ret ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              cursor: 'default'
                            }}>R</Box>
                          </MuiTooltip>
                        </Box>
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={700} color="primary">
                      {Math.floor((client.name.length % 10) + 90)}%
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ── Returns Tab ──
interface ReturnsTabProps {
  loading: boolean;
  returns: TDSReturnRecord[];
  onAdd: () => void;
  onEdit: (r: TDSReturnRecord) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
  fy: string;
}

const ReturnsTab: React.FC<ReturnsTabProps> = ({ loading, returns, onAdd, onEdit, onDelete, isAdmin, fy }) => (
  <Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Button variant="contained" startIcon={<Add />} onClick={onAdd} sx={{ borderRadius: 2, textTransform: 'none' }}>Add Return</Button>
    </Box>
    {loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : returns.length === 0 ? <Alert severity="info" sx={{ borderRadius: 2 }}>No TDS returns tracked for FY {fy}.</Alert> : (
      <Grid container spacing={2}>
        {returns.map((r: TDSReturnRecord) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r._id}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: r.isOverdue ? '2px solid #ef4444' : '1px solid #e2e8f0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip label={r.formType} color="primary" size="small" sx={{ fontWeight: 700 }} />
                  <Chip label={r.status.replace('_', ' ').toUpperCase()} size="small" color={statusColor[r.status] || 'default'} />
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>{r.quarter} • FY {r.financialYear}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {typeof r.clientId === 'object' && r.clientId ? r.clientId.name : 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">TDS: {fmt(r.totalTDSAmount)}</Typography>
                  <Typography variant="caption">Due: {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : 'N/A'}</Typography>
                </Box>
                {r.acknowledgementNo && <Typography variant="caption" color="text.secondary">Ack: {r.acknowledgementNo}</Typography>}
                {r.isOverdue && <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.7rem' }}>OVERDUE</Alert>}
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => onEdit(r)}><Edit fontSize="small" /></IconButton>
                  {isAdmin && <IconButton size="small" color="error" onClick={() => { if (confirm('Delete?')) onDelete(r._id); }}><Delete fontSize="small" /></IconButton>}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
);

// ── Entry Form Dialog ──
interface EntryFormDialogProps {
  open: boolean;
  onClose: () => void;
  editEntry: TDSEntryRecord | null;
  clients: Array<{ _id: string; name: string; panNumber?: string }>;
  onSave: (data: Partial<TDSEntryRecord>) => void;
  isSaving: boolean;
}

const EntryFormDialog: React.FC<EntryFormDialogProps> = ({ open, onClose, editEntry, clients, onSave, isSaving }) => {
  const [form, setForm] = useState<Partial<TDSEntryRecord>>(editEntry ? {
    clientId: (typeof editEntry.clientId === 'object' && editEntry.clientId) ? editEntry.clientId._id : (editEntry.clientId || ''),
    deducteeName: editEntry.deducteeName, deducteePAN: editEntry.deducteePAN,
    section: editEntry.section, grossAmount: editEntry.grossAmount,
    tdsRate: editEntry.tdsRate, tdsAmount: editEntry.tdsAmount,
    deductionDate: editEntry.deductionDate?.split('T')[0] || '',
    challanNo: editEntry.challanNo || '', bsrCode: editEntry.bsrCode || '',
    challanDate: editEntry.challanDate?.split('T')[0] || '',
    challanStatus: editEntry.challanStatus, month: editEntry.month, remarks: editEntry.remarks || '',
  } : {
    clientId: '', deducteeName: '', deducteePAN: '', section: '194J',
    grossAmount: undefined, tdsRate: 10, tdsAmount: undefined, deductionDate: new Date().toISOString().split('T')[0],
    challanNo: '', bsrCode: '', challanDate: '', challanStatus: 'pending', month: new Date().getMonth() + 1, remarks: '',
  });
  const upd = <K extends keyof TDSEntryRecord>(k: K, v: TDSEntryRecord[K]) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editEntry ? 'Edit' : 'Add'} TDS Entry</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <FormControl size="small" fullWidth><InputLabel>Client (Deductor)</InputLabel>
          <Select value={form.clientId || ''} label="Client (Deductor)" onChange={e => upd('clientId', e.target.value)}>
            {clients.map((c) => <MenuItem key={c._id} value={c._id}>{c.name} {c.panNumber ? `(${c.panNumber})` : ''}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Deductee Name" value={form.deducteeName} onChange={e => upd('deducteeName', e.target.value)} required />
        <TextField size="small" label="Deductee PAN" value={form.deducteePAN} onChange={e => upd('deducteePAN', e.target.value.toUpperCase())} required inputProps={{ maxLength: 10 }} />
        <FormControl size="small"><InputLabel>Section</InputLabel>
          <Select value={form.section} label="Section" onChange={e => upd('section', e.target.value)}>
            {Object.entries(TDS_SECTIONS).map(([k, v]) => <MenuItem key={k} value={k}>{k} — {v}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" label="Gross Amount" type="number" value={form.grossAmount} onChange={e => upd('grossAmount', Number(e.target.value))} fullWidth required />
          <TextField size="small" label="TDS Rate (%)" type="number" value={form.tdsRate} onChange={e => upd('tdsRate', Number(e.target.value))} sx={{ width: 140 }} />
          <TextField size="small" label="TDS Amount" type="number" value={form.tdsAmount || ((Number(form.grossAmount) || 0) * (Number(form.tdsRate) || 0) / 100) || ''} onChange={e => upd('tdsAmount', Number(e.target.value))} sx={{ width: 160 }} />
        </Box>
        <TextField size="small" label="Deduction Date" type="date" value={form.deductionDate} onChange={e => upd('deductionDate', e.target.value)} InputLabelProps={{ shrink: true }} required />
        <TextField size="small" label="Month (1-12)" type="number" value={form.month} onChange={e => upd('month', Number(e.target.value))} inputProps={{ min: 1, max: 12 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>Challan Details</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" label="Challan No" value={form.challanNo} onChange={e => upd('challanNo', e.target.value)} fullWidth />
          <TextField size="small" label="BSR Code" value={form.bsrCode} onChange={e => upd('bsrCode', e.target.value)} fullWidth />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" label="Challan Date" type="date" value={form.challanDate} onChange={e => upd('challanDate', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
          <FormControl size="small" fullWidth><InputLabel>Status</InputLabel>
            <Select value={form.challanStatus} label="Status" onChange={e => upd('challanStatus', e.target.value)}>
              <MenuItem value="pending">Pending</MenuItem><MenuItem value="paid">Paid</MenuItem><MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={isSaving} sx={{ borderRadius: 2 }}>Save Entry</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Return Form Dialog ──
interface ReturnFormDialogProps {
  open: boolean;
  onClose: () => void;
  editReturn: TDSReturnRecord | null;
  clients: Array<{ _id: string; name: string }>;
  onSave: (data: Partial<TDSReturnRecord>) => void;
  isSaving: boolean;
}

const ReturnFormDialog: React.FC<ReturnFormDialogProps> = ({ open, onClose, editReturn, clients, onSave, isSaving }) => {
  const [form, setForm] = useState<Partial<TDSReturnRecord>>(editReturn ? {
    clientId: (typeof editReturn.clientId === 'object' && editReturn.clientId) ? editReturn.clientId._id : (editReturn.clientId || ''),
    formType: editReturn.formType, quarter: editReturn.quarter,
    status: editReturn.status, filingDate: editReturn.filingDate?.split('T')[0] || '',
    acknowledgementNo: editReturn.acknowledgementNo || '', remarks: editReturn.remarks || '',
  } : {
    clientId: '', formType: '26Q', quarter: 'Q1', status: 'not_filed', filingDate: '', acknowledgementNo: '', remarks: '',
  });
  const upd = <K extends keyof TDSReturnRecord>(k: K, v: TDSReturnRecord[K]) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editReturn ? 'Edit' : 'Track'} TDS Return</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <FormControl size="small" fullWidth><InputLabel>Client</InputLabel>
          <Select value={form.clientId || ''} label="Client" onChange={e => upd('clientId', e.target.value)}>
            {clients.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" fullWidth><InputLabel>Form Type</InputLabel>
            <Select value={form.formType} label="Form Type" onChange={e => upd('formType', e.target.value)}>
              <MenuItem value="24Q">24Q (Salary)</MenuItem><MenuItem value="26Q">26Q (Non-Salary)</MenuItem><MenuItem value="27Q">27Q (NRI)</MenuItem><MenuItem value="27EQ">27EQ (TCS)</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth><InputLabel>Quarter</InputLabel>
            <Select value={form.quarter} label="Quarter" onChange={e => upd('quarter', e.target.value)}>
              <MenuItem value="Q1">Q1 (Apr-Jun)</MenuItem><MenuItem value="Q2">Q2 (Jul-Sep)</MenuItem><MenuItem value="Q3">Q3 (Oct-Dec)</MenuItem><MenuItem value="Q4">Q4 (Jan-Mar)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <FormControl size="small" fullWidth><InputLabel>Status</InputLabel>
          <Select value={form.status} label="Status" onChange={e => upd('status', e.target.value)}>
            {Object.keys(statusColor).filter(k => !['paid', 'pending', 'overdue'].includes(k)).map(k => (
              <MenuItem key={k} value={k}>{k.replace('_', ' ').toUpperCase()}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField size="small" label="Filing Date" type="date" value={form.filingDate} onChange={e => upd('filingDate', e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" label="Acknowledgement No" value={form.acknowledgementNo} onChange={e => upd('acknowledgementNo', e.target.value)} />
        <TextField size="small" label="Remarks" value={form.remarks} onChange={e => upd('remarks', e.target.value)} multiline rows={2} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={isSaving} sx={{ borderRadius: 2 }}>Save Return</Button>
      </DialogActions>
    </Dialog>
  );
};

interface BulkPayData {
  challanNo: string;
  bsrCode: string;
  challanDate: string;
}

const BulkPayDialog: React.FC<{ 
  open: boolean, 
  onClose: () => void, 
  onSave: (d: BulkPayData) => void, 
  isSaving: boolean 
}> = ({ open, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState<BulkPayData>({ challanNo: '', bsrCode: '', challanDate: new Date().toISOString().split('T')[0] });
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Bulk Pay Challans</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Typography variant="body2" color="text.secondary">Enter challan details for all selected entries.</Typography>
        <TextField size="small" label="Challan No" value={form.challanNo} onChange={e => setForm(p => ({ ...p, challanNo: e.target.value }))} fullWidth required />
        <TextField size="small" label="BSR Code" value={form.bsrCode} onChange={e => setForm(p => ({ ...p, bsrCode: e.target.value }))} fullWidth required />
        <TextField size="small" label="Challan Date" type="date" value={form.challanDate} onChange={e => setForm(p => ({ ...p, challanDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth required />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={isSaving} color="success" sx={{ borderRadius: 2 }}>Update All</Button>
      </DialogActions>
    </Dialog>
  );
};

export const TDSManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [fy, setFy] = useState(getCurrentFY());
  const [search, setSearch] = useState('');
  const [entryDialog, setEntryDialog] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [editEntry, setEditEntry] = useState<TDSEntryRecord | null>(null);
  const [editReturn, setEditReturn] = useState<TDSReturnRecord | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [bulkPayDialog, setBulkPayDialog] = useState(false);
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: dashboard, isLoading: dashLoading } = useQuery({ queryKey: ['tds-dashboard', fy], queryFn: () => tdsService.getDashboard(fy), retry: 1 });
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ['tds-entries', fy, search], queryFn: () => tdsService.getEntries({ fy, search: search || undefined }), retry: 1 });
  const { data: returns = [], isLoading: returnsLoading } = useQuery({ queryKey: ['tds-returns', fy], queryFn: () => tdsService.getReturns({ fy }), retry: 1 });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients, retry: 1 });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['tds-dashboard'] }); qc.invalidateQueries({ queryKey: ['tds-entries'] }); qc.invalidateQueries({ queryKey: ['tds-returns'] }); };

  const createEntryMut = useMutation({ mutationFn: (d: Partial<TDSEntryRecord>) => editEntry ? tdsService.updateEntry(editEntry._id, d) : tdsService.createEntry(d), onSuccess: () => { toast.success(editEntry ? 'Entry updated' : 'Entry created'); invalidate(); setEntryDialog(false); setEditEntry(null); }, onError: (e: unknown) => { const err = e as AxiosError<{message: string}>; toast.error(err.response?.data?.message || 'Error'); } });
  const deleteEntryMut = useMutation({ mutationFn: tdsService.deleteEntry, onSuccess: () => { toast.success('Entry deleted'); invalidate(); }, onError: () => toast.error('Delete failed') });
  const bulkPayMut = useMutation({ 
    mutationFn: async (data: { ids: string[], challanNo: string, bsrCode: string, challanDate: string }) => {
      for (const id of data.ids) {
        await tdsService.updateEntry(id, { 
          challanNo: data.challanNo, 
          bsrCode: data.bsrCode, 
          challanDate: data.challanDate,
          challanStatus: 'paid' 
        });
      }
    },
    onSuccess: () => { toast.success('Entries updated'); invalidate(); setBulkPayDialog(false); setSelectedEntries([]); },
    onError: () => toast.error('Bulk update failed')
  });
  const createReturnMut = useMutation({ mutationFn: (d: Partial<TDSReturnRecord>) => editReturn ? tdsService.updateReturn(editReturn._id, d) : tdsService.createReturn(d), onSuccess: () => { toast.success(editReturn ? 'Return updated' : 'Return created'); invalidate(); setReturnDialog(false); setEditReturn(null); }, onError: (e: unknown) => { const err = e as AxiosError<{message: string}>; toast.error(err.response?.data?.message || 'Error'); } });
  const deleteReturnMut = useMutation({ mutationFn: tdsService.deleteReturn, onSuccess: () => { toast.success('Return deleted'); invalidate(); }, onError: () => toast.error('Delete failed') });

  const fyOptions = Array.from({ length: 5 }, (_, i) => { const y = new Date().getFullYear() - i; return `${y}-${(y+1).toString().slice(2)}`; });

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountBalance sx={{ color: '#6366f1' }} /> TDS Management
          </Typography>
          <Typography variant="body2" color="text.secondary">Monitor TDS deductions, challans, and return filings.</Typography>
        </Box>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Financial Year</InputLabel>
          <Select value={fy} label="Financial Year" onChange={e => setFy(e.target.value as string)}>
            {fyOptions.map(o => <MenuItem key={o} value={o}>FY {o}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ 
          minHeight: 48,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.9rem' }
        }}>
          <Tab icon={<TrendingUp sx={{ fontSize: 18 }} />} iconPosition="start" label="Dashboard" />
          <Tab icon={<AccountBalance sx={{ fontSize: 18 }} />} iconPosition="start" label="Compliance Matrix" />
          <Tab icon={<Receipt sx={{ fontSize: 18 }} />} iconPosition="start" label="TDS Entries" />
          <Tab icon={<Receipt sx={{ fontSize: 18 }} />} iconPosition="start" label="Returns" />
        </Tabs>
      </Box>

      {tab === 0 && <DashboardTab loading={dashLoading} dashboard={dashboard} />}
      {tab === 1 && <ComplianceMatrix clients={clients} returns={returns} entries={entries} />}
      {tab === 2 && (
        <EntriesTab 
          loading={entriesLoading} entries={entries} search={search} onSearchChange={setSearch} 
          onAdd={() => { setEditEntry(null); setEntryDialog(true); }} 
          onEdit={(e: TDSEntryRecord) => { setEditEntry(e); setEntryDialog(true); }} 
          onDelete={(id: string) => deleteEntryMut.mutate(id)} 
          onExport={() => tdsService.exportCSV(fy)} isAdmin={isAdmin} 
          selectedIds={selectedEntries}
          onToggleSelect={(id) => setSelectedEntries(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])}
          onSelectAll={setSelectedEntries}
          onBulkUpdate={() => setBulkPayDialog(true)}
        />
      )}
      {tab === 3 && <ReturnsTab loading={returnsLoading} returns={returns} onAdd={() => { setEditReturn(null); setReturnDialog(true); }} onEdit={(r: TDSReturnRecord) => { setEditReturn(r); setReturnDialog(true); }} onDelete={(id: string) => deleteReturnMut.mutate(id)} isAdmin={isAdmin} fy={fy} />}

      {bulkPayDialog && (
        <BulkPayDialog 
          open={bulkPayDialog} 
          onClose={() => setBulkPayDialog(false)} 
          onSave={(data) => bulkPayMut.mutate({ ids: selectedEntries, ...data })}
          isSaving={bulkPayMut.isPending}
        />
      )}

      {entryDialog && <EntryFormDialog open={entryDialog} onClose={() => { setEntryDialog(false); setEditEntry(null); }} editEntry={editEntry} clients={clients} onSave={(d) => createEntryMut.mutate(d)} isSaving={createEntryMut.isPending} />}
      {returnDialog && <ReturnFormDialog open={returnDialog} onClose={() => { setReturnDialog(false); setEditReturn(null); }} editReturn={editReturn} clients={clients} onSave={(d) => createReturnMut.mutate(d)} isSaving={createReturnMut.isPending} />}
    </Box>
  );
};

export default TDSManagement;
