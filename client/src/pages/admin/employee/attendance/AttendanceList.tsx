import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    Snackbar,
    Alert,
    Chip,
    TablePagination,
} from '@mui/material';
import { FormatListBulleted as ListIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../../../../services/staffService';
import { attendanceService } from '../../../../services/attendanceService';
import type { AttendanceData } from '../../../../services/attendanceService';
import { format, isValid, parseISO } from 'date-fns';
import { BulkImportAttendanceModal } from './BulkImportAttendanceModal';

interface AttendanceRecord {
    _id: string;
    employee: { _id: string; firstName: string; lastName: string; };
    date: string;
    inTime?: string;
    outTime?: string;
    description?: string;
    status?: string;
    workHours?: string;
    breakTime?: string;
    overtime?: string;
}

const safeFormatDate = (dateStr: string) => {
    try {
        const d = parseISO(dateStr);
        return isValid(d) ? format(d, 'dd-MMM-yyyy') : dateStr;
    } catch {
        return dateStr;
    }
};

export const AttendanceList: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Filter state
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
    const [editForm, setEditForm] = useState({
        employee: '',
        date: '',
        inTime: '09:00',
        outTime: '18:00',
        description: '',
        status: 'Present',
        workHours: '00:00',
        breakTime: '00:00',
        overtime: '00:00',
    });

    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const { data: staffList } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffService.getStaff()
    });

    const { data: attendanceList, isLoading } = useQuery({
        queryKey: ['attendance', selectedEmployee, fromDate, toDate],
        queryFn: () => attendanceService.getAttendance({
            employee: selectedEmployee || undefined,
            startDate: fromDate || undefined,
            endDate: toDate || undefined
        })
    });

    const deleteMutation = useMutation({
        mutationFn: attendanceService.deleteAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Omit<AttendanceData, '_id'> }) =>
            attendanceService.updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            setEditOpen(false);
        },
        onError: () => {
            alert('Failed to update attendance record.');
        }
    });

    const handleClearFilters = () => {
        setSelectedEmployee('');
        setFromDate('');
        setToDate(new Date().toISOString().split('T')[0]);
        setPage(0);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this attendance record?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEditOpen = (record: AttendanceRecord) => {
        setEditRecord(record);
        setEditForm({
            employee: record.employee?._id || '',
            date: record.date ? record.date.split('T')[0] : '',
            inTime: record.inTime || '',
            outTime: record.outTime || '',
            description: record.description || '',
            status: record.status || 'Present',
            workHours: record.workHours || '00:00',
            breakTime: record.breakTime || '00:00',
            overtime: record.overtime || '00:00',
        });
        setEditOpen(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, checked, type } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditSave = () => {
        if (!editRecord) return;
        updateMutation.mutate({
            id: editRecord._id,
            data: {
                employee: editForm.employee,
                date: editForm.date,
                inTime: editForm.inTime || undefined,
                outTime: editForm.outTime || undefined,
                description: editForm.description,
                status: editForm.status,
                workHours: editForm.workHours,
                breakTime: editForm.breakTime,
                overtime: editForm.overtime,
            }
        });
    };

    const calculateHours = (inTime?: string, outTime?: string) => {
        if (!inTime || !outTime) return '-';
        const [inH, inM] = inTime.split(':').map(Number);
        const [outH, outM] = outTime.split(':').map(Number);
        let diff = (outH * 60 + outM) - (inH * 60 + inM);
        if (diff < 0) diff += 24 * 60;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="600">Employee Attendance List</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => setBulkImportOpen(true)}>
                            Import Excel
                        </Button>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => navigate('/admin/employee/attendance/add')}>
                            Add New
                        </Button>
                    </Box>
                </Box>

                {/* Filters */}
                <Box sx={{ p: 3, bgcolor: '#fff' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', width: '80px', flexShrink: 0 }}>Employee</Typography>
                            <Select
                                fullWidth size="small" displayEmpty
                                value={selectedEmployee}
                                onChange={(e) => {
                                    setSelectedEmployee(e.target.value as string);
                                    setPage(0);
                                }}
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="">All Employees</MenuItem>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {staffList?.map((s: any) => (
                                    <MenuItem key={s._id} value={s._id}>{s.firstName} {s.lastName}</MenuItem>
                                ))}
                            </Select>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', flexShrink: 0 }}>From</Typography>
                            <TextField fullWidth size="small" type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', flexShrink: 0 }}>To</Typography>
                            <TextField fullWidth size="small" type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="contained" onClick={handleClearFilters} sx={{ bgcolor: '#ff6c60', color: 'white', minWidth: '40px', p: 1, boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}>
                                <CloseIcon fontSize="small" />
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Table */}
            <Paper sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="700">Attendance Records</Typography>
                    {attendanceList && !isLoading && (
                        <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.85 }}>
                            {attendanceList.length} record{attendanceList.length !== 1 ? 's' : ''}
                        </Typography>
                    )}
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Employee Name</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>In Time</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Out Time</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Work Hours</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Break</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>OT</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading...</TableCell>
                                </TableRow>
                            ) : (!attendanceList || attendanceList.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 600 }}>No Record Found</TableCell>
                                </TableRow>
                            ) : (
                                (attendanceList as AttendanceRecord[]).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((record, idx) => (
                                    <TableRow key={record._id} hover sx={{ '&:hover': { bgcolor: '#f0f4ff' } }}>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{(page * rowsPerPage) + idx + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{record.employee?.firstName} {record.employee?.lastName}</TableCell>
                                        <TableCell>{record.date ? safeFormatDate(record.date) : '-'}</TableCell>
                                        <TableCell>
                                            {record.inTime ? (
                                                <Box component="span" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    {record.inTime}
                                                </Box>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {record.outTime ? (
                                                <Box component="span" sx={{ bgcolor: '#fff3e0', color: '#e65100', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                    {record.outTime}
                                                </Box>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Box component="span" sx={{ bgcolor: '#ede7f6', color: '#4527a0', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {record.workHours || calculateHours(record.inTime, record.outTime)}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                            {record.breakTime || '00:00'}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                            {record.overtime || '00:00'}
                                        </TableCell>
                                        <TableCell>
                                            {record.status === 'Present' ? (
                                                <Chip label="Present" color="success" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                                            ) : record.status === 'Absent' ? (
                                                <Chip label="Absent" color="error" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                                            ) : record.status === 'Weekly Off' ? (
                                                <Chip label="Weekly Off" color="primary" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                                            ) : (
                                                <Chip label="Present" color="success" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton size="small" onClick={() => handleEditOpen(record)} sx={{ color: '#667eea', '&:hover': { bgcolor: '#e8eafc' } }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(record._id)} sx={{ '&:hover': { bgcolor: '#fde8e8' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    component="div"
                    count={attendanceList ? attendanceList.length : 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: '1px solid #e2e8f0' }}
                />
            </Paper>

            {/* ─── Edit Dialog ─── */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                    <Typography fontWeight="600">Edit Attendance</Typography>
                    <IconButton size="small" onClick={() => setEditOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {/* Employee */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>
                                Employee <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select
                                fullWidth size="small" displayEmpty
                                name="employee"
                                value={editForm.employee}
                                onChange={(e) => setEditForm(prev => ({ ...prev, employee: e.target.value as string }))}
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {staffList?.map((s: any) => (
                                    <MenuItem key={s._id} value={s._id}>{s.firstName} {s.lastName}</MenuItem>
                                ))}
                            </Select>
                        </Box>

                        {/* Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>
                                Date <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField
                                fullWidth size="small" type="date"
                                name="date"
                                value={editForm.date}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* In Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>In Time</Typography>
                            <TextField
                                fullWidth size="small" type="time"
                                name="inTime"
                                value={editForm.inTime}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* Out Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>Out Time</Typography>
                            <TextField
                                fullWidth size="small" type="time"
                                name="outTime"
                                value={editForm.outTime}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>
                                Status <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select
                                fullWidth size="small"
                                name="status"
                                value={editForm.status}
                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as string }))}
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="Present">Present</MenuItem>
                                <MenuItem value="Absent">Absent</MenuItem>
                                <MenuItem value="Weekly Off">Weekly Off</MenuItem>
                            </Select>
                        </Box>

                        {/* Work Hours */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>Work Hours</Typography>
                            <TextField
                                fullWidth size="small"
                                name="workHours"
                                placeholder="e.g. 09:28"
                                value={editForm.workHours}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* Break Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>Break Time</Typography>
                            <TextField
                                fullWidth size="small"
                                name="breakTime"
                                placeholder="e.g. 00:00"
                                value={editForm.breakTime}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* Overtime */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0 }}>Overtime (OT)</Typography>
                            <TextField
                                fullWidth size="small"
                                name="overtime"
                                placeholder="e.g. 00:00"
                                value={editForm.overtime}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>

                        {/* Description */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '110px', flexShrink: 0, pt: 1 }}>Description</Typography>
                            <TextField
                                fullWidth size="small" multiline rows={3}
                                name="description"
                                value={editForm.description}
                                onChange={handleEditChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        variant="contained"
                        onClick={handleEditSave}
                        disabled={updateMutation.isPending}
                        sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', textTransform: 'none', px: 3, boxShadow: 'none' }}
                    >
                        {updateMutation.isPending ? 'Saving...' : 'Update'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setEditOpen(false)}
                        sx={{ bgcolor: '#ff6c60', color: 'white', textTransform: 'none', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <BulkImportAttendanceModal
                open={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                showSnackbar={showSnackbar}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};





