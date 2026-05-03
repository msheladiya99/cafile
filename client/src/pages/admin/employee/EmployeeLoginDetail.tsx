import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    Select,
    FormControl,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    TextField,
    Grid,
    TablePagination
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { format } from 'date-fns';

export const EmployeeLoginDetail: React.FC = () => {
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    // Fetch Staff Users for the dropdown
    const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    // Fetch Logs based on filters and pagination
    const { data: logResponse = { logs: [], total: 0 }, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['loginLogs', selectedEmployee, dateFrom, dateTo, page, rowsPerPage],
        queryFn: async () => adminService.getLoginLogs(selectedEmployee, dateFrom, dateTo, page + 1, rowsPerPage)
    });

    const handleClear = () => {
        setSelectedEmployee('');
        setDateFrom('');
        setDateTo('');
        setPage(0);
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const logs = logResponse.logs;
    const totalCount = logResponse.total;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Login Log Detail</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 14, width: { xs: '100%', md: 80 } }}>Employee</Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    displayEmpty
                                    value={selectedEmployee}
                                    onChange={(e) => {
                                        setSelectedEmployee(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                    <MenuItem value="">All Employees</MenuItem>
                                    {!isLoadingStaff && staffMembers.map((staff: { _id: string, name?: string, username: string }) => (
                                        <MenuItem key={staff._id} value={staff._id}>{staff.name || staff.username}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 60 }, mb: { xs: 0.5, md: 0 } }}>Date</Typography>
                            </Grid>
                            <Grid size={{ xs: 5, md: 4 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    size="small"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 2, md: 'auto' }} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{ bgcolor: '#f0f0f0', px: 1, py: 0.5, border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    To
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 5, md: 4 }}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    size="small"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setPage(0);
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="error"
                                    onClick={handleClear}
                                    sx={{ minWidth: { xs: '100%', md: 40 }, p: 1 }}
                                >
                                    <ClearIcon />
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>List</Typography>
                    </Box>
                </Box>

                {isLoadingLogs ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : logs.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontWeight: 600 }}>
                        <Typography variant="body2">No Record Found</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Employee Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>IP Address</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Log Date & Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log: { userId?: { name?: string, username: string }, ipAddress?: string, timestamp: string }, index: number) => (
                                        <TableRow key={index} hover>
                                            <TableCell>{log.userId?.name || log.userId?.username}</TableCell>
                                            <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                                            <TableCell>{format(new Date(log.timestamp), 'dd-MMM-yyyy hh:mm a')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={totalCount}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid #e2e8f0' }}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};





