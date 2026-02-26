import React from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
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
import { FormatListBulleted as FormatListBulletedIcon, TableChart as TableChartIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import type { Client } from '../../../types';

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

export const ClientList: React.FC = () => {
    const navigate = useNavigate();

    const { data: clients = [], isLoading } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Client List</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate('/admin/client/master')}
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
                        <FilterRow label="Group Name">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Group...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Client Name">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Client...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Search">
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Select size="small" defaultValue="name" sx={{ width: '150px', borderRadius: 1.5 }}>
                                    <MenuItem value="name">By Name</MenuItem>
                                </Select>
                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Box>
                        </FilterRow>
                        <FilterRow label="Master Type">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Master type...</MenuItem>
                            </Select>
                        </FilterRow>
                    </Box>

                    {/* Right Column */}
                    <Box sx={{ flex: 1 }}>
                        <FilterRow label="IT Status">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a IT Status...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Sub Master">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Sub Master...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Status">
                            <Select fullWidth size="small" defaultValue="all" sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="all">All Client</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="F Year">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Period...</MenuItem>
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
                        <TableChartIcon fontSize="small" />
                    </IconButton>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Client Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Group Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>IT Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>Loading clients...</TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                        No clients found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {client.name}
                                            {client.clientCode && <Typography variant="caption" display="block" color="text.secondary">{client.clientCode}</Typography>}
                                        </TableCell>
                                        <TableCell>{client.groupName?.groupName || '-'}</TableCell>
                                        <TableCell>{client.itStatus?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 2,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                bgcolor: client.status !== false ? '#e8f5e9' : '#ffebee',
                                                color: client.status !== false ? 'success.main' : 'error.main'
                                            }}>
                                                {client.status !== false ? 'Active' : 'Inactive'}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" sx={{ color: 'primary.main', bgcolor: 'primary.50', mr: 1, '&:hover': { bgcolor: 'primary.100' } }} onClick={() => navigate(`/admin/client/${client._id}`)}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" sx={{ color: 'info.main', bgcolor: 'info.50', mr: 1, '&:hover': { bgcolor: 'info.100' } }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};
