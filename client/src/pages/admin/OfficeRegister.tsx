import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, IconButton,
    Chip, InputAdornment, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, MenuItem, Divider,
    Autocomplete, Select, TablePagination,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    AssignmentReturn as ReturnIcon,
    RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { CommonButton } from '../../components/common/UIComponents';
import type { Client } from '../../types';

const DOCUMENT_TYPES = [
    'ITR Acknowledgement',
    'Income Tax Return',
    'GST Return',
    'Form 16 / 16A',
    'Balance Sheet',
    'Audit Report',
    'TDS Certificate',
    'PAN Card',
    'Aadhar Card',
    'Bank Statement',
    'Incorporation Certificate',
    'Partnership Deed',
    'Board Resolution',
    'Assessment Order',
    'Notice Reply',
    'Other Document',
];

interface OfficeEntry {
    _id: string;
    clientId: { _id: string; name: string; email: string; panNumber?: string; physicalFileNumber?: string } | string;
    documentType: string;
    description: string;
    receivedByName: string;
    returnDate: string;
    remarks?: string;
    createdAt: string;
}

const emptyForm = {
    clientId: '',
    documentType: '',
    description: '',
    receivedByName: '',
    returnDate: new Date().toISOString().split('T')[0],
    remarks: '',
};

const getDocColor = (type: string) => {
    if (type.includes('ITR') || type.includes('Income')) return '#6366f1';
    if (type.includes('GST')) return '#f59e0b';
    if (type.includes('TDS') || type.includes('Form 16')) return '#10b981';
    if (type.includes('Audit') || type.includes('Balance')) return '#3b82f6';
    if (type.includes('Notice') || type.includes('Order')) return '#ef4444';
    return '#8b5cf6';
};

const getClientName = (e: OfficeEntry): string =>
    typeof e.clientId === 'string' ? '—' : e.clientId.name;

const getClientId = (e: OfficeEntry): string =>
    typeof e.clientId === 'string' ? e.clientId : e.clientId._id;

export const OfficeRegister: React.FC = () => {
    const queryClient = useQueryClient();

    const [filterClient, setFilterClient] = useState('All Clients');
    const [filterDocType, setFilterDocType] = useState('All Documents');
    const [filterMonth, setFilterMonth] = useState('All');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<OfficeEntry | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const { data: entries = [], isLoading } = useQuery<OfficeEntry[]>({
        queryKey: ['officeRegister'],
        queryFn: () => adminService.getOfficeRegisterEntries(),
    });

    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients,
    });

    const createMutation = useMutation({
        mutationFn: adminService.createOfficeRegisterEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['officeRegister'] });
            handleClose();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
            adminService.updateOfficeRegisterEntry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['officeRegister'] });
            handleClose();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: adminService.deleteOfficeRegisterEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['officeRegister'] });
            setDeleteConfirm(null);
        },
    });

    const uniqueClients = useMemo(() => {
        const names = Array.from(
            new Set(entries.map((e) => getClientName(e)).filter((n) => n !== '—'))
        );
        return ['All Clients', ...names];
    }, [entries]);

    const monthOptions = useMemo(() => {
        const months = new Set(
            entries.map((e) => {
                try {
                    const d = new Date(e.returnDate);
                    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                } catch {
                    return '';
                }
            }).filter(Boolean)
        );
        return ['All', ...Array.from(months)];
    }, [entries]);

    const filtered = useMemo(() => {
        return entries.filter((e) => {
            if (filterClient !== 'All Clients' && getClientName(e) !== filterClient) return false;
            if (filterDocType !== 'All Documents' && e.documentType !== filterDocType) return false;
            if (filterMonth !== 'All') {
                try {
                    const d = new Date(e.returnDate);
                    const label = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                    if (label !== filterMonth) return false;
                } catch {
                    return false;
                }
            }
            return true;
        });
    }, [entries, filterClient, filterDocType, filterMonth]);

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleReset = () => {
        setFilterClient('All Clients');
        setFilterDocType('All Documents');
        setFilterMonth('All');
        setPage(0);
    };

    const handleOpen = (entry?: OfficeEntry) => {
        if (entry) {
            setEditEntry(entry);
            setForm({
                clientId: getClientId(entry),
                documentType: entry.documentType,
                description: entry.description,
                receivedByName: entry.receivedByName,
                returnDate: entry.returnDate
                    ? entry.returnDate.split('T')[0]
                    : new Date().toISOString().split('T')[0],
                remarks: entry.remarks || '',
            });
        } else {
            setEditEntry(null);
            setForm({ ...emptyForm, returnDate: new Date().toISOString().split('T')[0] });
        }
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
        setEditEntry(null);
        setForm({ ...emptyForm });
        setFormErrors({});
    };

    const validate = () => {
        const errors: Record<string, string> = {};
        if (!form.clientId) errors.clientId = 'Client is required';
        if (!form.documentType) errors.documentType = 'Document type is required';
        if (!form.description.trim()) errors.description = 'Description is required';
        if (!form.receivedByName.trim()) errors.receivedByName = 'Received person name is required';
        if (!form.returnDate) errors.returnDate = 'Return date is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (editEntry) {
            updateMutation.mutate({ id: editEntry._id, data: form });
        } else {
            createMutation.mutate(form as Parameters<typeof adminService.createOfficeRegisterEntry>[0]);
        }
    };

    const labelSx = {
        textTransform: 'uppercase' as const,
        fontSize: '0.68rem',
        fontWeight: 700,
        color: '#64748b',
        letterSpacing: 0.4,
        display: 'block',
        mb: 0.5,
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 2.5 }, pb: 10 }}>

            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5} gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5} mb={0.3}>
                        <ReturnIcon sx={{ fontSize: 28, color: '#6366f1' }} />
                        <Typography variant="h5" fontWeight={800} color="#1e293b">
                            Document Return Register
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" ml={5}>
                        Track documents returned to clients — description &amp; received person name
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{
                        borderRadius: '10px',
                        px: 2.5,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                        flexShrink: 0,
                    }}
                >
                    Add Entry
                </Button>
            </Box>

            {/* Filter Row */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: '8px 8px 0 0',
                    border: '1px solid #e2e8f0',
                    borderBottom: 'none',
                    bgcolor: '#fff',
                }}
            >
                <Box display="flex" flexWrap="wrap" gap={2.5} alignItems="flex-end">
                    {/* Client filter */}
                    <Box>
                        <Typography sx={labelSx}>👤 Client Name</Typography>
                        <Select
                            size="small"
                            value={filterClient}
                            onChange={(e) => { setFilterClient(e.target.value as string); setPage(0); }}
                            sx={{ minWidth: 200, bgcolor: 'white', borderRadius: '8px' }}
                        >
                            {uniqueClients.map((c) => (
                                <MenuItem key={c} value={c}>{c}</MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Document Type filter */}
                    <Box>
                        <Typography sx={labelSx}>📄 Document Type</Typography>
                        <Select
                            size="small"
                            value={filterDocType}
                            onChange={(e) => { setFilterDocType(e.target.value as string); setPage(0); }}
                            sx={{ minWidth: 200, bgcolor: 'white', borderRadius: '8px' }}
                        >
                            <MenuItem value="All Documents">All Documents</MenuItem>
                            {DOCUMENT_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Month filter */}
                    <Box>
                        <Typography sx={labelSx}>📅 Month</Typography>
                        <Select
                            size="small"
                            value={filterMonth}
                            onChange={(e) => { setFilterMonth(e.target.value as string); setPage(0); }}
                            sx={{ minWidth: 180, bgcolor: 'white', borderRadius: '8px' }}
                        >
                            {monthOptions.map((m) => (
                                <MenuItem key={m} value={m}>{m}</MenuItem>
                            ))}
                        </Select>
                    </Box>

                    <Box sx={{ ml: 'auto' }}>
                        <Button
                            size="small"
                            startIcon={<ResetIcon />}
                            onClick={handleReset}
                            variant="outlined"
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                color: '#64748b',
                                borderColor: '#e2e8f0',
                                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                            }}
                        >
                            Reset Filters
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '0 0 8px 8px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }}
            >
                {/* Table header bar */}
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    px={2.5}
                    py={1.5}
                    sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}
                >
                    <Typography fontWeight={700} color="#1e293b" fontSize="0.9rem">
                        Document Return Records
                    </Typography>
                    <Chip
                        label={`${filtered.length} Records`}
                        size="small"
                        sx={{
                            bgcolor: '#f0fdf4',
                            color: '#16a34a',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0',
                        }}
                    />
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {['#', 'CLIENT NAME', 'FILE NO.', 'DOCUMENT TYPE', 'DESCRIPTION', 'RECEIVED BY', 'RETURN DATE', 'REMARKS', 'ACTIONS'].map((col) => (
                                    <TableCell
                                        key={col}
                                        sx={{
                                            fontWeight: 700,
                                            color: '#64748b',
                                            fontSize: '0.72rem',
                                            letterSpacing: 0.5,
                                            py: 1.2,
                                            whiteSpace: 'nowrap',
                                            ...(col === '#' && { width: 50 }),
                                            ...(col === 'FILE NO.' && { width: 110 }),
                                            ...(col === 'ACTIONS' && { width: 80 }),
                                        }}
                                    >
                                        {col}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                        Loading entries...
                                    </TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                        <ReturnIcon sx={{ fontSize: 40, color: '#e2e8f0', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography color="text.secondary" fontSize="0.875rem">No records found</Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            {entries.length === 0
                                                ? 'Click "Add Entry" to record a document return.'
                                                : 'Try adjusting your filters.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((entry, idx) => (
                                    <TableRow
                                        key={entry._id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#f8faff' },
                                            '& td': { borderBottom: '1px solid #f1f5f9', py: 1.1, px: 2 },
                                        }}
                                    >
                                        {/* # */}
                                        <TableCell>
                                            <Typography fontSize="0.78rem" color="#94a3b8" fontWeight={600}>
                                                {String(page * rowsPerPage + idx + 1).padStart(2, '0')}
                                            </Typography>
                                        </TableCell>

                                        {/* Client Name */}
                                        <TableCell>
                                            <Typography fontWeight={700} color="#1e293b" fontSize="0.875rem">
                                                {getClientName(entry)}
                                            </Typography>
                                            {typeof entry.clientId !== 'string' && entry.clientId.panNumber && (
                                                <Typography variant="caption" color="#94a3b8" display="block">
                                                    {entry.clientId.panNumber}
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* FILE NO. */}
                                        <TableCell>
                                            {typeof entry.clientId !== 'string' && entry.clientId.physicalFileNumber ? (
                                                <Chip
                                                    label={entry.clientId.physicalFileNumber}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        bgcolor: '#eff6ff',
                                                        color: '#2563eb',
                                                        border: '1px solid #bfdbfe',
                                                        borderRadius: '6px',
                                                        height: 22,
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="#cbd5e1">—</Typography>
                                            )}
                                        </TableCell>

                                        {/* Document Type */}
                                        <TableCell>
                                            <Chip
                                                label={entry.documentType}
                                                size="small"
                                                sx={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    bgcolor: `${getDocColor(entry.documentType)}18`,
                                                    color: getDocColor(entry.documentType),
                                                    borderRadius: '6px',
                                                    height: 22,
                                                    border: `1px solid ${getDocColor(entry.documentType)}30`,
                                                }}
                                            />
                                        </TableCell>

                                        {/* Description */}
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            <Typography fontSize="0.8rem" color="#374151" sx={{ lineHeight: 1.4 }}>
                                                {entry.description}
                                            </Typography>
                                        </TableCell>

                                        {/* Received By */}
                                        <TableCell>
                                            <Typography fontSize="0.82rem" fontWeight={600} color="#065f46">
                                                {entry.receivedByName}
                                            </Typography>
                                        </TableCell>

                                        {/* Return Date */}
                                        <TableCell>
                                            <Typography fontSize="0.8rem" color="#475569" whiteSpace="nowrap">
                                                {new Date(entry.returnDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </Typography>
                                        </TableCell>

                                        {/* Remarks */}
                                        <TableCell sx={{ maxWidth: 160 }}>
                                            <Typography
                                                fontSize="0.78rem"
                                                color={entry.remarks ? '#64748b' : '#cbd5e1'}
                                                fontStyle={entry.remarks ? 'italic' : 'normal'}
                                            >
                                                {entry.remarks || '—'}
                                            </Typography>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <Box display="flex" gap={0.5}>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpen(entry)}
                                                        sx={{ p: 0.6, '&:hover': { color: '#3b82f6', bgcolor: '#eff6ff' } }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDeleteConfirm(entry._id)}
                                                        sx={{ p: 0.6, '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50]}
                    labelRowsPerPage="Rows per page:"
                    sx={{
                        borderTop: '1px solid #f1f5f9',
                        '& .MuiTablePagination-toolbar': { fontSize: '0.8rem' },
                    }}
                />
            </Paper>

            {/* Add / Edit Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ p: 0.7, borderRadius: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <ReturnIcon sx={{ color: 'white', fontSize: 18 }} />
                        </Box>
                        <Typography fontWeight={700} fontSize="1rem">
                            {editEntry ? 'Edit Entry' : 'Add Document Return'}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Autocomplete
                        options={clients}
                        getOptionLabel={(c: Client) =>
                            `${c.name}${c.panNumber ? ` (${c.panNumber})` : ''}`
                        }
                        value={clients.find((c: Client) => c._id === form.clientId) || null}
                        onChange={(_, v) => setForm((f) => ({ ...f, clientId: v ? v._id : '' }))}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Client Name *"
                                size="small"
                                error={!!formErrors.clientId}
                                helperText={formErrors.clientId}
                            />
                        )}
                        isOptionEqualToValue={(o, v) => o._id === v._id}
                    />

                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Document Type *"
                        value={form.documentType}
                        onChange={(e) => setForm((f) => ({ ...f, documentType: e.target.value }))}
                        error={!!formErrors.documentType}
                        helperText={formErrors.documentType}
                    >
                        {DOCUMENT_TYPES.map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        label="Description *"
                        placeholder="e.g. ITR-3 for FY 2023-24 original documents returned..."
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        error={!!formErrors.description}
                        helperText={formErrors.description}
                    />

                    <TextField
                        fullWidth
                        size="small"
                        label="Received Person Name *"
                        placeholder="Name of person who received the documents"
                        value={form.receivedByName}
                        onChange={(e) => setForm((f) => ({ ...f, receivedByName: e.target.value }))}
                        error={!!formErrors.receivedByName}
                        helperText={formErrors.receivedByName}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        type="date"
                        size="small"
                        label="Return Date *"
                        value={form.returnDate}
                        onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))}
                        error={!!formErrors.returnDate}
                        helperText={formErrors.returnDate}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        fullWidth
                        size="small"
                        label="Remarks (optional)"
                        placeholder="Any additional notes..."
                        value={form.remarks}
                        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                    />
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <CommonButton
                        variant="contained"
                        onClick={handleSubmit}
                        loading={createMutation.isPending || updateMutation.isPending}
                        sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            px: 3,
                            textTransform: 'none',
                        }}
                    >
                        {editEntry ? 'Update Entry' : 'Save Entry'}
                    </CommonButton>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Entry?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" fontSize="0.875rem">
                        This will permanently remove this document return record. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => setDeleteConfirm(null)}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                        disabled={deleteMutation.isPending}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
