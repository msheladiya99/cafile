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
    TextField
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

    // Fetch Staff Users for the dropdown
    const { data: staffMembers = [], isLoading: isLoadingStaff } = useQuery({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    // Fetch Logs based on filters -> Notice: we only created param for a single date? Let's use `dateFrom` and `dateTo` or just pass `dateFrom` for now. Wait, I will adjust the backend to handle `startDate` and `endDate` so we match "from To".
    // Wait, the API I wrote just has `date` which gets exactly that day. Let's fix backend to support startDate and endDate.
    const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
        queryKey: ['loginLogs', selectedEmployee, dateFrom, dateTo],
        queryFn: async () => adminService.getLoginLogs(selectedEmployee, dateFrom, dateTo)
    });

    const handleClear = () => {
        setSelectedEmployee('');
        setDateFrom('');
        setDateTo('');
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Login Log Detail</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(12, 1fr)' }} gap={3} alignItems="center">
                    <Box gridColumn={{ xs: 'span 1', md: 'span 4' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Employee</Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    displayEmpty
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                >
                                    <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                    {!isLoadingStaff && staffMembers.map((staff: { _id: string, name?: string, username: string }) => (
                                        <MenuItem key={staff._id} value={staff._id}>{staff.name || staff.username}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Date</Typography>
                            <TextField
                                type="date"
                                size="small"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <Box sx={{ bgcolor: '#f0f0f0', px: 2, py: 1, border: '1px solid #ddd' }}>
                                To
                            </Box>
                            <TextField
                                type="date"
                                size="small"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleClear}
                                sx={{ minWidth: 40, p: 1 }}
                            >
                                <ClearIcon />
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                )}
            </Paper>
        </Box>
    );
};
