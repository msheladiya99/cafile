import React, { useState } from 'react';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    IconButton,
    useMediaQuery,
    useTheme,
    Paper,
} from '@mui/material';
import {
    FormatListBulleted as FormatListBulletedIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../../../services/staffService';
import { CircularProgress, Snackbar, Alert } from '@mui/material';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow, CommonButton } from '../../../components/common/UIComponents';
import { BulkImportEmployeeModal } from './BulkImportEmployeeModal';

export const EmployeeList: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const queryClient = useQueryClient();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const { data: staffData = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    const deleteMutation = useMutation({
        mutationFn: staffService.deleteStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setSnackbar({ open: true, message: 'Employee deleted successfully', severity: 'success' });
        },
        onError: () => {
            setSnackbar({ open: true, message: 'Error deleting employee', severity: 'error' });
        }
    });

    const employees = staffData.map(emp => {
        // Derive a human-readable designation: prefer the saved designation field,
        // fall back to converting the role enum (STAFF → Staff, MANAGER → Manager …)
        const roleLabel: Record<string, string> = {
            ADMIN: 'Admin', MANAGER: 'Manager', STAFF: 'Staff', INTERN: 'Intern'
        };
        const designation = emp.designation || roleLabel[emp.role as string] || emp.role || '-';
        return {
            id: emp._id,
            name: emp.name,
            code: emp.employeeCode,
            loginId: emp.username,
            designation,
            status: emp.status !== false ? 'Active' : 'Inactive'
        };
    }).filter(emp => {
        if (filterDesignation && emp.designation !== filterDesignation) return false;
        if (filterStatus !== 'all') {
            const isActive = filterStatus === 'active';
            if ((emp.status === 'Active') !== isActive) return false;
        }
        return true;
    });

    // Compute unique designations from actual staff data for the filter dropdown
    const uniqueDesignations = React.useMemo(() => {
        const roleLabel: Record<string, string> = {
            ADMIN: 'Admin', MANAGER: 'Manager', STAFF: 'Staff', INTERN: 'Intern'
        };
        const seen = new Set<string>();
        staffData.forEach(emp => {
            const d = emp.designation || roleLabel[emp.role as string] || emp.role;
            if (d) seen.add(d);
        });
        return Array.from(seen).sort();
    }, [staffData]);

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            deleteMutation.mutate(id);
        }
    };

    const [bulkImportOpen, setBulkImportOpen] = useState(false);

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity: severity === 'info' ? 'success' : severity });
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Employee List"
                actions={
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <CommonButton
                            variant="contained"
                            size="small"
                            onClick={() => setBulkImportOpen(true)}
                            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, color: 'white', borderRadius: '8px', boxShadow: 'none' }}
                        >
                            Import Excel
                        </CommonButton>
                        <CommonButton
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/admin/employee/master')}
                            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', borderRadius: '8px', boxShadow: 'none' }}
                        >
                            + Add New
                        </CommonButton>
                    </Box>
                }
            />

            <ContentContainer>
                {/* Filters Section */}
                <Section title="Filter Options" icon={<FormatListBulletedIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 4 } }}>
                        {/* Left Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Designation">
                                <Select
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterDesignation}
                                    onChange={(e) => setFilterDesignation(e.target.value)}
                                    sx={{ borderRadius: '8px', color: filterDesignation ? 'inherit' : 'text.secondary' }}
                                >
                                    <MenuItem value="">Choose a Designation...</MenuItem>
                                    {uniqueDesignations.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Status">
                                <Select
                                    fullWidth
                                    size="small"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="all">All Employee</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FilterRow>
                        </Box>
                    </Box>
                </Section>

                {/* List Section */}
                <Section title="Employee List" icon={<FormatListBulletedIcon />} noPad>
                    {isMobile ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            ) : employees.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                                    No employees found.
                                </Box>
                            ) : (
                                employees.map((emp) => (
                                    <Paper key={emp.id} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Typography variant="body1" fontWeight={700} color="#334155">{emp.name}</Typography>
                                                <Typography variant="body2" color="#667eea" fontWeight={600}>Code: {emp.code || '---'}</Typography>
                                            </Box>
                                            <Box sx={{
                                                display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                bgcolor: emp.status === 'Active' ? '#e8f5e9' : '#ffebee', color: emp.status === 'Active' ? 'success.main' : 'error.main'
                                            }}>
                                                {emp.status}
                                            </Box>
                                        </Box>
                                        
                                        <Box display="flex" justifyContent="space-between" my={1.5}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">Login ID</Typography>
                                                <Typography variant="body2" fontWeight={500} color="#667eea">{emp.loginId || '---'}</Typography>
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography variant="caption" color="text.secondary" display="block">Designation</Typography>
                                                <Typography variant="body2" fontWeight={500}>{emp.designation}</Typography>
                                            </Box>
                                        </Box>

                                        <Box display="flex" justifyContent="flex-end" pt={1.5} borderTop="1px solid #f0f0f0">
                                            <IconButton size="small" sx={{ color: 'info.main', bgcolor: 'info.50', mr: 1, '&:hover': { bgcolor: 'info.100' } }} onClick={() => navigate(`/admin/employee/master/${emp.id}`)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }} onClick={() => handleDelete(emp.id as string)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                ))
                            )}
                        </Box>
                    ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Emp Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Employee Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Login ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Designation</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>{emp.code || '---'}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                                            <TableCell sx={{ fontWeight: 500, color: '#667eea' }}>{emp.loginId || '---'}</TableCell>
                                            <TableCell>{emp.designation}</TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    bgcolor: emp.status === 'Active' ? '#e8f5e9' : '#ffebee',
                                                    color: emp.status === 'Active' ? 'success.main' : 'error.main'
                                                }}>
                                                    {emp.status}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" sx={{ color: 'info.main', bgcolor: 'info.50', mr: 1, '&:hover': { bgcolor: 'info.100' } }} onClick={() => navigate(`/admin/employee/master/${emp.id}`)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }} onClick={() => handleDelete(emp.id as string)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    )}
                </Section>
            </ContentContainer>

            <BulkImportEmployeeModal
                open={bulkImportOpen}
                onClose={() => setBulkImportOpen(false)}
                showSnackbar={showSnackbar}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
};





