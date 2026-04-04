import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    IconButton,
    useMediaQuery,
    useTheme,
    Card,
    CardContent
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    TableChart as ExcelIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';

export const FreeEmployeeList: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const { data: employees = [], isLoading } = useQuery({
        queryKey: ['freeEmployees'],
        queryFn: adminService.getFreeEmployees
    });

    const handleExportExcel = () => {
        // Implement simple CSV export using Blob
        const headers = ['ID', 'First Name', 'Last Name', 'Mobile Number', 'Email', 'Designation'];
        const csvContent = [
            headers.join(','),
            ...employees.map((emp, index) => {
                const nameParts = (emp.name || emp.username).split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                return [
                    index + 1,
                    `"${firstName}"`,
                    `"${lastName}"`,
                    `"${emp.phone || ''}"`,
                    `"${emp.email || ''}"`,
                    `"${emp.role || ''}"`,
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Free_Employee_List.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 4, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Free Employee List</Typography>
                </Box>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>Free Employee List</Typography>
                    </Box>
                    <IconButton size="small" onClick={handleExportExcel} sx={{ color: 'white', bgcolor: '#6366f1', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, borderRadius: '8px' }} title="Export to CSV">
                        <ExcelIcon fontSize="small" />
                    </IconButton>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : employees.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontWeight: 600 }}>
                        <Typography variant="body2">No Free Employees Found</Typography>
                    </Box>
                ) : isMobile ? (
                    <>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                            {employees.map((emp, index) => {
                                const nameParts = (emp.name || emp.username).split(' ');
                                const firstName = nameParts[0] || '';
                                const lastName = nameParts.slice(1).join(' ') || '';

                                return (
                                    <Card key={emp._id} sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Box display="flex" justifyContent="space-between" mb={1.5}>
                                                <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                                    {firstName} {lastName}
                                                </Typography>
                                                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', px: 1, py: 0.5, borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    ID: {index + 1}
                                                </Box>
                                            </Box>

                                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Mobile Number</Typography>
                                                    <Typography variant="body2" fontWeight="500">{emp.phone || 'N/A'}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                                    <Typography variant="body2" fontWeight="500" noWrap>{emp.email || 'N/A'}</Typography>
                                                </Box>
                                                <Box gridColumn="span 2">
                                                    <Typography variant="caption" color="text.secondary" display="block">Designation</Typography>
                                                    <Typography variant="body2" fontWeight="500">{emp.role}</Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    </>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>First Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Last Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Mobile Number</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Designation</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.map((emp, index) => {
                                    const nameParts = (emp.name || emp.username).split(' ');
                                    const firstName = nameParts[0] || '';
                                    const lastName = nameParts.slice(1).join(' ') || '';

                                    return (
                                        <TableRow key={emp._id} hover>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{firstName}</TableCell>
                                            <TableCell>{lastName}</TableCell>
                                            <TableCell>{emp.phone || 'N/A'}</TableCell>
                                            <TableCell>{emp.email || 'N/A'}</TableCell>
                                            <TableCell>{emp.role}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};





