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
import { clientGroupService } from '../../../services/clientGroupService';
import { masterService } from '../../../services/masterService';
import type { Client } from '../../../types';
import type { ClientGroup } from '../../../services/clientGroupService';
import type { ITStatus } from '../../../services/masterService';

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

    const { data: groups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: itStatuses = [] } = useQuery<ITStatus[]>({
        queryKey: ['itStatus'],
        queryFn: masterService.getITStatuses
    });

    // Filter States
    const [filterGroup, setFilterGroup] = React.useState('');
    const [filterClient, setFilterClient] = React.useState('');
    const [filterSearchType, setFilterSearchType] = React.useState('name');
    const [filterSearchText, setFilterSearchText] = React.useState('');
    const [filterMasterType, setFilterMasterType] = React.useState('');
    const [filterItStatus, setFilterItStatus] = React.useState('');
    const [filterSubMaster, setFilterSubMaster] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [filterFYear, setFilterFYear] = React.useState('');

    const subMasterOptions = ['Individual', 'HUF', 'Partnership Firm', 'LLP', 'Company', 'Association of Persons', 'Body of Individuals', 'Local Authority', 'Artificial Juridical Person', 'Co-operative Society', 'Trust', 'Other'];

    // Computed Filtered Clients
    const filteredClients = React.useMemo(() => {
        return clients.filter((client) => {
            // Group Filter
            if (filterGroup && typeof client.groupName === 'object' && client.groupName?._id !== filterGroup) return false;
            // Client Dropdown Filter (by _id)
            if (filterClient && client._id !== filterClient) return false;

            // Search Text Filter
            if (filterSearchText) {
                const searchLower = filterSearchText.toLowerCase();
                if (filterSearchType === 'name' && !client.name.toLowerCase().includes(searchLower)) return false;
                if (filterSearchType === 'email' && !client.email?.toLowerCase().includes(searchLower)) return false;
                if (filterSearchType === 'phone' && !client.phone?.includes(filterSearchText)) return false;
                if (filterSearchType === 'clientCode' && !client.clientCode?.toLowerCase().includes(searchLower)) return false;
            }

            // Other Dropdowns
            if (filterMasterType && client.masterType !== filterMasterType) return false;
            if (filterItStatus && typeof client.itStatus === 'object' && client.itStatus?._id !== filterItStatus) return false;

            // @ts-expect-error Types mismatch on dynamic property
            if (filterSubMaster && client.subMaster !== filterSubMaster) return false;

            if (filterStatus !== 'all') {
                const isActive = filterStatus === 'active';
                if (client.status !== isActive) return false;
            }

            // @ts-expect-error UI filter not present on model
            if (filterFYear && client.financialYear !== filterFYear) return false;

            return true;
        });
    }, [clients, filterGroup, filterClient, filterSearchType, filterSearchText, filterMasterType, filterItStatus, filterSubMaster, filterStatus, filterFYear]);

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
                            <Select fullWidth size="small" displayEmpty value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} sx={{ borderRadius: 1.5, color: filterGroup ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a Group...</MenuItem>
                                {groups.map(group => (
                                    <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>
                                ))}
                            </Select>
                        </FilterRow>
                        <FilterRow label="Client Name">
                            <Select fullWidth size="small" displayEmpty value={filterClient} onChange={(e) => setFilterClient(e.target.value)} sx={{ borderRadius: 1.5, color: filterClient ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a Client...</MenuItem>
                                {clients.map(client => (
                                    <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                ))}
                            </Select>
                        </FilterRow>
                        <FilterRow label="Search">
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Select size="small" value={filterSearchType} onChange={(e) => setFilterSearchType(e.target.value)} sx={{ width: '150px', borderRadius: 1.5 }}>
                                    <MenuItem value="name">By Name</MenuItem>
                                    <MenuItem value="clientCode">By Client Code</MenuItem>
                                    <MenuItem value="email">By Email</MenuItem>
                                    <MenuItem value="phone">By Phone</MenuItem>
                                </Select>
                                <TextField fullWidth size="small" value={filterSearchText} onChange={(e) => setFilterSearchText(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Box>
                        </FilterRow>
                        <FilterRow label="Master Type">
                            <Select fullWidth size="small" displayEmpty value={filterMasterType} onChange={(e) => setFilterMasterType(e.target.value)} sx={{ borderRadius: 1.5, color: filterMasterType ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a Master type...</MenuItem>
                                {['Client', 'Department', 'Follow Up', 'Other'].map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FilterRow>
                    </Box>

                    {/* Right Column */}
                    <Box sx={{ flex: 1 }}>
                        <FilterRow label="IT Status">
                            <Select fullWidth size="small" displayEmpty value={filterItStatus} onChange={(e) => setFilterItStatus(e.target.value)} sx={{ borderRadius: 1.5, color: filterItStatus ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a IT Status...</MenuItem>
                                {itStatuses.map(status => (
                                    <MenuItem key={status._id} value={status._id}>{status.name}</MenuItem>
                                ))}
                            </Select>
                        </FilterRow>
                        <FilterRow label="Sub Master">
                            <Select fullWidth size="small" displayEmpty value={filterSubMaster} onChange={(e) => setFilterSubMaster(e.target.value)} sx={{ borderRadius: 1.5, color: filterSubMaster ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a Sub Master...</MenuItem>
                                {subMasterOptions.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                        </FilterRow>
                        <FilterRow label="Status">
                            <Select fullWidth size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="all">All Client</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="F Year">
                            <Select fullWidth size="small" displayEmpty value={filterFYear} onChange={(e) => setFilterFYear(e.target.value)} sx={{ borderRadius: 1.5, color: filterFYear ? 'inherit' : 'text.secondary' }}>
                                <MenuItem value="">Choose a Period...</MenuItem>
                                <MenuItem value="april-march">April - March</MenuItem>
                                <MenuItem value="jan-dec">January - December</MenuItem>
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
                            ) : filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                        No clients found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
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
                                            <IconButton size="small" sx={{ color: 'info.main', bgcolor: 'info.50', mr: 1, '&:hover': { bgcolor: 'info.100' } }} onClick={() => navigate(`/admin/client/master/${client._id}`)}>
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
