import React, { useState } from 'react';
import {
    Box,
    Button,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    IconButton,
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
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow } from '../../../components/common/UIComponents';


export const EmployeeList: React.FC = () => {
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

    const employees = staffData.map(emp => ({
        id: emp._id,
        name: emp.name,
        code: emp.employeeCode,
        designation: emp.designation || emp.role,
        status: emp.status !== false ? 'Active' : 'Inactive'
    })).filter(emp => {
        if (filterDesignation && emp.designation !== filterDesignation) return false;
        if (filterStatus !== 'all') {
            const isActive = filterStatus === 'active';
            if ((emp.status === 'Active') !== isActive) return false;
        }
        return true;
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Employee List"
                actions={
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/admin/employee/master')}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}
                    >
                        Add New
                    </Button>
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
                                    sx={{ borderRadius: 1.5, color: filterDesignation ? 'inherit' : 'text.secondary' }}
                                >
                                    <MenuItem value="">Choose a Designation...</MenuItem>
                                    <MenuItem value="Staff">Staff</MenuItem>
                                    <MenuItem value="Manager">Manager</MenuItem>
                                    <MenuItem value="Admin">Admin</MenuItem>
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
                                    sx={{ borderRadius: 1.5 }}
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
                <Section title="Employee List" icon={<FormatListBulletedIcon />}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Emp Code</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Employee Name</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Designation</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                ) : employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#667eea' }}>{emp.code || '---'}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{emp.name}</TableCell>
                                            <TableCell>{emp.designation}</TableCell>
                                            <TableCell>
                                                <Box sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    borderRadius: 2,
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
                </Section>
            </ContentContainer>

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
