import React from 'react';
import {
    Box,
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
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Stack,
    Divider
} from '@mui/material';
import {
    FormatListBulleted as FormatListBulletedIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    FilterList as FilterListIcon,
    LockReset as LockResetIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { masterService } from '../../../services/masterService';
import type { Client } from '../../../types';
import type { ClientGroup } from '../../../services/clientGroupService';
import type { ITStatus } from '../../../services/masterService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow } from '../../../components/common/UIComponents';


export const ClientList: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

            const clientSubMasterStr = typeof client.subMaster === 'object' ? client.subMaster?.name : client.subMaster;
            if (filterSubMaster && clientSubMasterStr !== filterSubMaster) return false;

            if (filterStatus !== 'all') {
                const isActive = filterStatus === 'active';
                if (client.status !== isActive) return false;
            }

            if (filterFYear && client.financialYear !== filterFYear) return false;

            return true;
        });
    }, [clients, filterGroup, filterClient, filterSearchType, filterSearchText, filterMasterType, filterItStatus, filterSubMaster, filterStatus, filterFYear]);

    const handleResetPassword = async (clientId: string) => {
        if (window.confirm('Are you sure you want to reset this client\'s password and send them an email?')) {
            try {
                const result = await adminService.resetClientPassword(clientId);
                alert(`Password Reset Successful!\n\nNew Password: ${result.password}\n\nAn email has also been sent to the client.`);
            } catch (error) {
                console.error('Reset password error:', error);
                alert('Failed to reset password. Please try again.');
            }
        }
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Client List"
                actions={
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 1.5, 
                        flexWrap: 'wrap',
                        width: { xs: '100%', sm: 'auto' },
                        '& .MuiButton-root': { 
                            flex: { xs: 1, sm: 'none' },
                            whiteSpace: 'nowrap'
                        }
                    }}>
                        <Button variant="contained" size="small" onClick={() => navigate('/admin/client/master')} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                            Add New
                        </Button>
                        <Button variant="contained" size="small" onClick={() => navigate('/admin/client/list')} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                            List
                        </Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                            Field Master
                        </Button>
                    </Box>
                }
            />

            {/* Container */}
            <ContentContainer>

                {/* Filters Section */}
                <Section title="Filter Options" icon={<FilterListIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 4 } }}>
                        {/* Left Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Group Name" inputId="filter-group">
                                <Select
                                    id="filter-group"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterGroup}
                                    onChange={(e) => setFilterGroup(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterGroup ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Group Name' }}
                                >
                                    <MenuItem value="">Choose a Group...</MenuItem>
                                    {groups.map(group => (
                                        <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Client Name" inputId="filter-client">
                                <Select
                                    id="filter-client"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterClient}
                                    onChange={(e) => setFilterClient(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterClient ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Client Name' }}
                                >
                                    <MenuItem value="">Choose a Client...</MenuItem>
                                    {clients.map(client => (
                                        <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Search" inputId="filter-search-text">
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Select
                                        size="small"
                                        value={filterSearchType}
                                        onChange={(e) => setFilterSearchType(e.target.value)}
                                        sx={{ width: '150px', borderRadius: 1.5 }}
                                        inputProps={{ 'aria-label': 'Search Category' }}
                                    >
                                        <MenuItem value="name">By Name</MenuItem>
                                        <MenuItem value="clientCode">By Client Code</MenuItem>
                                        <MenuItem value="email">By Email</MenuItem>
                                        <MenuItem value="phone">By Phone</MenuItem>
                                    </Select>
                                    <TextField
                                        id="filter-search-text"
                                        fullWidth
                                        size="small"
                                        value={filterSearchText}
                                        onChange={(e) => setFilterSearchText(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        inputProps={{ 'aria-label': 'Search Text' }}
                                    />
                                </Box>
                            </FilterRow>
                            <FilterRow label="Master Type" inputId="filter-master-type">
                                <Select
                                    id="filter-master-type"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterMasterType}
                                    onChange={(e) => setFilterMasterType(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterMasterType ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Master Type' }}
                                >
                                    <MenuItem value="">Choose a Master type...</MenuItem>
                                    {['Client', 'Department', 'Follow Up', 'Other'].map(type => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="IT Status" inputId="filter-it-status">
                                <Select
                                    id="filter-it-status"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterItStatus}
                                    onChange={(e) => setFilterItStatus(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterItStatus ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'IT Status' }}
                                >
                                    <MenuItem value="">Choose a IT Status...</MenuItem>
                                    {itStatuses.map(status => (
                                        <MenuItem key={status._id} value={status._id}>{status.name}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Sub Master" inputId="filter-sub-master">
                                <Select
                                    id="filter-sub-master"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterSubMaster}
                                    onChange={(e) => setFilterSubMaster(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterSubMaster ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Sub Master' }}
                                >
                                    <MenuItem value="">Choose a Sub Master...</MenuItem>
                                    {subMasterOptions.map(option => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Status" inputId="filter-status">
                                <Select
                                    id="filter-status"
                                    fullWidth
                                    size="small"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    sx={{ borderRadius: 1.5 }}
                                    inputProps={{ 'aria-label': 'Client Status' }}
                                >
                                    <MenuItem value="all">All Client</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FilterRow>
                            <FilterRow label="F Year" inputId="filter-financial-year">
                                <Select
                                    id="filter-financial-year"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterFYear}
                                    onChange={(e) => setFilterFYear(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: filterFYear ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Financial Year' }}
                                >
                                    <MenuItem value="">Choose a Period...</MenuItem>
                                    <MenuItem value="april-march">April - March</MenuItem>
                                    <MenuItem value="jan-dec">January - December</MenuItem>
                                </Select>
                            </FilterRow>
                        </Box>
                    </Box>
                </Section>

                {/* List Section */}
                <Section title="List" icon={<FormatListBulletedIcon />}>
                    {isMobile ? (
                        <Stack spacing={2}>
                            {isLoading ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Loading clients...</Box>
                            ) : filteredClients.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No clients found.</Box>
                            ) : (
                                filteredClients.map((client) => (
                                    <Card key={client._id} variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', overflow: 'hidden' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                                        {client.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                        {client.username && (
                                                            <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, bgcolor: '#eef2ff', px: 0.8, py: 0.2, borderRadius: 1 }}>
                                                                ID: {client.username}
                                                            </Typography>
                                                        )}
                                                        {client.clientCode && (
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, bgcolor: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: 1 }}>
                                                                Code: {client.clientCode}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Box sx={{
                                                    px: 1,
                                                    py: 0.3,
                                                    borderRadius: 1,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    bgcolor: client.status !== false ? '#dcfce7' : '#fee2e2',
                                                    color: client.status !== false ? '#15803d' : '#b91c1c'
                                                }}>
                                                    {client.status !== false ? 'Active' : 'Inactive'}
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Group Name</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                        {(typeof client.groupName === 'object' && client.groupName !== null) ? client.groupName.groupName : (client.groupName || '-')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">IT Status</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                        {(typeof client.itStatus === 'object' && client.itStatus !== null) ? client.itStatus.name : (client.itStatus || '-')}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', bgcolor: '#f8fafc', m: -2, mt: 0, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#6366f1', bgcolor: 'white', border: '1px solid', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                    onClick={() => navigate(`/admin/client/${client._id}`)}
                                                >
                                                    <VisibilityIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#f59e0b', bgcolor: 'white', border: '1px solid', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                    onClick={() => handleResetPassword(client._id)}
                                                >
                                                    <LockResetIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#06b6d4', bgcolor: 'white', border: '1px solid', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                    onClick={() => navigate(`/admin/client/master/${client._id}`)}
                                                >
                                                    <EditIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: '#ef4444', bgcolor: 'white', border: '1px solid', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
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
                                                    {client.username && (
                                                        <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 600 }}>
                                                            ID: {client.username}
                                                        </Typography>
                                                    )}
                                                    {client.clientCode && (
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Code: {client.clientCode}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{(typeof client.groupName === 'object' && client.groupName !== null) ? client.groupName.groupName : (client.groupName || '-')}</TableCell>
                                                <TableCell>{(typeof client.itStatus === 'object' && client.itStatus !== null) ? client.itStatus.name : (client.itStatus || '-')}</TableCell>
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
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'primary.main', bgcolor: 'primary.50', mr: 1, '&:hover': { bgcolor: 'primary.100' } }}
                                                        onClick={() => navigate(`/admin/client/${client._id}`)}
                                                        aria-label="View client details"
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'warning.main', bgcolor: 'warning.50', mr: 1, '&:hover': { bgcolor: 'warning.100' } }}
                                                        onClick={() => handleResetPassword(client._id)}
                                                        aria-label="Reset password"
                                                        title="Reset & Send Email"
                                                    >
                                                        <LockResetIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'info.main', bgcolor: 'info.50', mr: 1, '&:hover': { bgcolor: 'info.100' } }}
                                                        onClick={() => navigate(`/admin/client/master/${client._id}`)}
                                                        aria-label="Edit client"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                                                        aria-label="Delete client"
                                                    >
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
        </PageContainer>
    );
};
