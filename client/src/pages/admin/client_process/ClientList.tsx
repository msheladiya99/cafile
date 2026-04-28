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
    TablePagination,
    IconButton,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Stack,
    Divider,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    FormatListBulleted as FormatListBulletedIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FilterList as FilterListIcon,
    LockReset as LockResetIcon,
    Send as SendIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { masterService } from '../../../services/masterService';
import type { Client } from '../../../types';
import type { ClientGroup } from '../../../services/clientGroupService';
import type { ITStatus } from '../../../services/masterService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow, CommonButton } from '../../../components/common/UIComponents';
import toast from 'react-hot-toast';


export const ClientList: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const queryClient = useQueryClient();

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

    // Pagination State
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [selectedClients, setSelectedClients] = React.useState<string[]>([]);

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = React.useState({
        open: false,
        title: '',
        content: '',
        onConfirm: () => {}
    });

    // Email Dialog State
    const [emailDialog, setEmailDialog] = React.useState(false);
    const [templates, setTemplates] = React.useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = React.useState('');
    const [sendingEmail, setSendingEmail] = React.useState(false);

    React.useEffect(() => {
        if (emailDialog && templates.length === 0) {
            api.get('/email/templates').then(res => setTemplates(res.data)).catch(() => {});
        }
    }, [emailDialog, templates.length]);

    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

    const subMasterOptions = ['Individual', 'HUF', 'Partnership Firm', 'LLP', 'Company', 'Association of Persons', 'Body of Individuals', 'Local Authority', 'Artificial Juridical Person', 'Co-operative Society', 'Trust', 'Other'];

    // Reset page and selection when filters change to avoid empty views
    React.useEffect(() => {
        setPage(0);
        setSelectedClients([]);
    }, [filterGroup, filterClient, filterSearchType, filterSearchText, filterMasterType, filterItStatus, filterSubMaster, filterStatus, filterFYear]);

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
        setConfirmDialog({
            open: true,
            title: 'Reset Password',
            content: "Are you sure you want to reset this client's password and send them an email?",
            onConfirm: async () => {
                closeConfirm();
                try {
                    const result = await adminService.resetClientPassword(clientId);
                    toast.success(`Password Reset Successful! New Password: ${result.password}. An email has also been sent to the client.`, { duration: 6000 });
                } catch (error) {
                    console.error('Reset password error:', error);
                    toast.error('Failed to reset password. Please try again.');
                }
            }
        });
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const currentViewIds = filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((n) => n._id);
            setSelectedClients(currentViewIds);
            return;
        }
        setSelectedClients([]);
    };

    const handleClick = (_event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const selectedIndex = selectedClients.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedClients, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedClients.slice(1));
        } else if (selectedIndex === selectedClients.length - 1) {
            newSelected = newSelected.concat(selectedClients.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedClients.slice(0, selectedIndex),
                selectedClients.slice(selectedIndex + 1),
            );
        }

        setSelectedClients(newSelected);
    };

    const deleteClientMutation = useMutation({
        mutationFn: adminService.deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.success('Client deleted successfully');
        },
        onError: (error: unknown) => {
            console.error('Error deleting client:', error);
            toast.error('Failed to delete client');
        }
    });

    const handleDeleteClient = (id: string, name: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Client',
            content: `Are you sure you want to delete the client "${name}"? This action cannot be undone.`,
            onConfirm: () => {
                closeConfirm();
                deleteClientMutation.mutate(id);
            }
        });
    };

    const bulkDeleteMutation = useMutation({
        mutationFn: adminService.bulkDeleteClients,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setSelectedClients([]);
            toast.success(data.message || 'Clients deleted successfully');
        },
        onError: (error: unknown) => {
            console.error('Error during bulk deletion:', error);
            toast.error('Failed to delete selected clients');
        }
    });

    const handleBulkDelete = () => {
        setConfirmDialog({
            open: true,
            title: 'Delete Multiple Clients',
            content: `Are you absolutely sure you want to delete ${selectedClients.length} selected client(s)? This action cannot be undone.`,
            onConfirm: () => {
                closeConfirm();
                bulkDeleteMutation.mutate(selectedClients);
            }
        });
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Client List"
                actions={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedClients.length > 0 && (
                            <>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setEmailDialog(true)}
                                    startIcon={<SendIcon />}
                                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}
                                >
                                    Send Email ({selectedClients.length})
                                </Button>
                                <Button
                                variant="contained"
                                size="small"
                                color="error"
                                onClick={handleBulkDelete}
                                disabled={bulkDeleteMutation.isPending}
                                startIcon={<DeleteIcon />}
                                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, boxShadow: 'none', fontSize: '0.85rem' }}
                            >
                                    Delete Selected ({selectedClients.length})
                                </Button>
                            </>
                        )}
                        <CommonButton variant="contained" size="small" onClick={() => navigate('/admin/client/master')} sx={{ boxShadow: 'none' }}>
                            + Add New
                        </CommonButton>
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
                                    sx={{ borderRadius: '8px', color: filterGroup ? 'inherit' : 'text.secondary' }}
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
                                    sx={{ borderRadius: '8px', color: filterClient ? 'inherit' : 'text.secondary' }}
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
                                        sx={{ width: '150px', borderRadius: '8px' }}
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
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                                    sx={{ borderRadius: '8px', color: filterMasterType ? 'inherit' : 'text.secondary' }}
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
                                    sx={{ borderRadius: '8px', color: filterItStatus ? 'inherit' : 'text.secondary' }}
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
                                    sx={{ borderRadius: '8px', color: filterSubMaster ? 'inherit' : 'text.secondary' }}
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
                                    sx={{ borderRadius: '8px' }}
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
                                    sx={{ borderRadius: '8px', color: filterFYear ? 'inherit' : 'text.secondary' }}
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
                <Section title="List" icon={<FormatListBulletedIcon />} noPad>
                    {isMobile ? (
                        <Stack spacing={2}>
                            {isLoading ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>Loading clients...</Box>
                            ) : filteredClients.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No clients found.</Box>
                            ) : (
                                filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((client) => (
                                    <Card key={client._id} variant="outlined" sx={{ borderRadius: '12px', borderColor: 'divider', overflow: 'hidden' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                                        {client.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                        {client.username && (
                                                            <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, bgcolor: '#eef2ff', px: 0.8, py: 0.2, borderRadius: '8px' }}>
                                                                ID: {client.username}
                                                            </Typography>
                                                        )}
                                                        {client.clientCode && (
                                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, bgcolor: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: '8px' }}>
                                                                Code: {client.clientCode}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                                <Box sx={{
                                                    px: 1,
                                                    py: 0.3,
                                                    borderRadius: '8px',
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
                                                    onClick={() => handleDeleteClient(client._id, client.name)}
                                                    disabled={deleteClientMutation.isPending}
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
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                color="primary"
                                                indeterminate={selectedClients.length > 0 && selectedClients.length < filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                                                checked={filteredClients.length > 0 && selectedClients.length === filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length}
                                                onChange={handleSelectAllClick}
                                            />
                                        </TableCell>
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
                                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>Loading clients...</TableCell>
                                        </TableRow>
                                    ) : filteredClients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                                No clients found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((client) => {
                                            const isItemSelected = selectedClients.indexOf(client._id) !== -1;
                                            return (
                                            <TableRow 
                                                key={client._id} 
                                                sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                                                selected={isItemSelected}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        color="primary"
                                                        checked={isItemSelected}
                                                        onChange={(event) => handleClick(event, client._id)}
                                                    />
                                                </TableCell>
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
                                                        borderRadius: '12px',
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
                                                        onClick={() => handleDeleteClient(client._id, client.name)}
                                                        disabled={deleteClientMutation.isPending}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        )})
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {filteredClients.length > 0 && (
                        <TablePagination
                            rowsPerPageOptions={[10, 20, 30, 40, 50]}
                            component="div"
                            count={filteredClients.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                        />
                    )}
                </Section>

            </ContentContainer>

            {/* Global Confirmation Dialog for actions */}
            <Dialog 
                open={confirmDialog.open} 
                onClose={closeConfirm}
                PaperProps={{
                    sx: { borderRadius: '12px', minWidth: { xs: 300, sm: 400 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{confirmDialog.content}</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeConfirm} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={confirmDialog.onConfirm} variant="contained" color="error" sx={{ fontWeight: 600, boxShadow: 'none' }}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Email Blast Dialog */}
            <Dialog 
                open={emailDialog} 
                onClose={() => !sendingEmail && setEmailDialog(false)}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: { xs: 300, sm: 400 } } }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Send Email to Selected</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Select a template to send to the {selectedClients.length} chosen clients.
                    </DialogContentText>
                    <Select
                        fullWidth
                        size="small"
                        displayEmpty
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value as string)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="" disabled>Select Email Template...</MenuItem>
                        {templates.map(t => (
                            <MenuItem key={t._id} value={t._id}>{t.name} ({t.subject})</MenuItem>
                        ))}
                    </Select>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setEmailDialog(false)} disabled={sendingEmail} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={async () => {
                            if (!selectedTemplate) return toast.error('Please select an email template');
                            setSendingEmail(true);
                            try {
                                const res = await api.post('/email/send/bulk', { templateId: selectedTemplate, clientIds: selectedClients });
                                toast.success(res.data.message);
                                setEmailDialog(false);
                            } catch (e: any) {
                                toast.error(e.response?.data?.message || 'Failed to send bulk email');
                            } finally {
                                setSendingEmail(false);
                            }
                        }} 
                        variant="contained" 
                        disabled={sendingEmail || !selectedTemplate}
                        startIcon={<SendIcon />}
                        sx={{ fontWeight: 600, boxShadow: 'none', borderRadius: 2 }}
                    >
                        {sendingEmail ? 'Sending...' : 'Send Emails'}
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
};





