import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
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
    Delete as DeleteIcon,
    FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface FilterRowProps {
    label: string;
    children: React.ReactNode;
}

const FilterRow = ({ label, children }: FilterRowProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ width: { xs: '100%', sm: '120px' }, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
            {label}
        </Typography>
        <Box sx={{ flex: 1, width: '100%' }}>
            {children}
        </Box>
    </Box>
);

export const EmployeeList: React.FC = () => {
    const navigate = useNavigate();
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock data for demonstration - in a real app, this would come from an API
    const employees = [
        { id: 1, name: 'Meet Sheladiya', designation: 'Staff', status: 'Active' },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Employee List</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/admin/employee/master')}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}
                        >
                            Add New
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Filters Section */}
            <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', p: 3 }}>
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
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormatListBulletedIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>List</Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                        <FileDownloadIcon fontSize="small" />
                    </IconButton>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Employee Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Designation</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.map((emp) => (
                                <TableRow key={emp.id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
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
                                        <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};
