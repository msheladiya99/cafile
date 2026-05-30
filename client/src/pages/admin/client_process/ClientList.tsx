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
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow, CommonButton } from '../../../components/common/UIComponents';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';


export const ClientList: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const queryClient = useQueryClient();
    const { hasPermission } = useAuth();

    const { data: clients = [], isLoading } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: groups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: subMasters = [] } = useQuery<any[]>({
        queryKey: ['subMaster'],
        queryFn: masterService.getSubMasters
    });

    const subMasterMap = React.useMemo(() => {
        return subMasters.reduce((acc, sm) => {
            acc[sm._id] = sm.name;
            return acc;
        }, {} as Record<string, string>);
    }, [subMasters]);

    const getConstitutionName = (subMasterVal: any) => {
        if (!subMasterVal) return '-';
        if (typeof subMasterVal === 'object') return subMasterVal.name || '-';
        return subMasterMap[subMasterVal] || subMasterVal;
    };

    // Filter States
    const [filterGroup, setFilterGroup] = React.useState('');
    const [filterClient, setFilterClient] = React.useState('');
    const [filterSearchText, setFilterSearchText] = React.useState('');
    const [filterMasterType, setFilterMasterType] = React.useState('');
    const [filterSubMaster, setFilterSubMaster] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

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

    const subMasterOptions = ['Individual', 'Proprietorship', 'HUF', 'Partnership', 'Company', 'Private Limited', 'Limited Liability Partnership', 'Trust', 'AOP/BOI', 'Local Authority', 'Artificial Juridical Person', 'Firm', 'Co-operative Society', 'Other'];

    // Reset page and selection when filters change to avoid empty views
    React.useEffect(() => {
        setPage(0);
        setSelectedClients([]);
    }, [filterGroup, filterClient, filterSearchText, filterMasterType, filterSubMaster, filterStatus]);

    // Reset client filter when group changes
    React.useEffect(() => {
        setFilterClient('');
    }, [filterGroup]);

    // Computed Filtered Clients
    const filteredClients = React.useMemo(() => {
        const filtered = clients.filter((client) => {
            // Group Filter
            if (filterGroup) {
                const clientGroupId = typeof client.groupName === 'object' && client.groupName !== null
                    ? client.groupName._id
                    : client.groupName;
                if (clientGroupId !== filterGroup) return false;
            }
            // Client Dropdown Filter (by _id)
            if (filterClient && client._id !== filterClient) return false;

            // Global Search Filter (searches name, code, email, phone, proprietor, username, groupName)
            if (filterSearchText) {
                const searchLower = filterSearchText.toLowerCase();
                const matchName = client.name?.toLowerCase().includes(searchLower) || false;
                const matchEmail = client.email?.toLowerCase().includes(searchLower) || false;
                const matchClientCode = client.clientCode?.toLowerCase().includes(searchLower) || false;
                const matchPhone1 = client.phone?.includes(filterSearchText) || false;
                const matchPhone2 = client.phone2?.includes(filterSearchText) || false;
                const matchProprietor = client.proprietorName?.toLowerCase().includes(searchLower) || false;
                const matchUsername = client.username?.toLowerCase().includes(searchLower) || false;
                
                // Group Name match
                let matchGroupName = false;
                const clientGroupId = typeof client.groupName === 'object' && client.groupName !== null
                    ? client.groupName._id
                    : client.groupName;
                if (typeof client.groupName === 'object' && client.groupName !== null && 'groupName' in client.groupName) {
                    matchGroupName = client.groupName.groupName?.toLowerCase().includes(searchLower) || false;
                } else if (clientGroupId) {
                    const group = groups.find(g => g._id === clientGroupId);
                    matchGroupName = group?.groupName?.toLowerCase().includes(searchLower) || false;
                }
                
                if (!matchName && !matchEmail && !matchClientCode && !matchPhone1 && !matchPhone2 && !matchProprietor && !matchUsername && !matchGroupName) {
                    return false;
                }
            }

            // Other Dropdowns
            if (filterMasterType && client.masterType !== filterMasterType) return false;

            const clientSubMasterStr = typeof client.subMaster === 'object' ? client.subMaster?.name : client.subMaster;
            if (filterSubMaster && clientSubMasterStr !== filterSubMaster) return false;

            if (filterStatus !== 'all') {
                const isActive = filterStatus === 'active';
                if (client.status !== isActive) return false;
            }


            return true;
        });

        return filtered.sort((a, b) => {
            const cmp = (a.name || '').localeCompare(b.name || '');
            return sortOrder === 'asc' ? cmp : -cmp;
        });
    }, [clients, groups, filterGroup, filterClient, filterSearchText, filterMasterType, filterSubMaster, filterStatus, sortOrder]);

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
        onMutate: async (id) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['clients'] });

            // Snapshot the previous value
            const previousClients = queryClient.getQueryData<Client[]>(['clients']);

            // Optimistically update the cache by filtering out the client
            queryClient.setQueryData<Client[]>(['clients'], (oldClients) => {
                return oldClients ? oldClients.filter(c => c._id !== id) : [];
            });

            // Return a context object with the snapshotted value
            return { previousClients };
        },
        onError: (error: unknown, _id, context) => {
            console.error('Error deleting client:', error);
            // Roll back to the previous value if mutation fails
            if (context?.previousClients) {
                queryClient.setQueryData(['clients'], context.previousClients);
            }
            toast.error('Failed to delete client');
        },
        onSuccess: () => {
            toast.success('Client deleted successfully');
        },
        onSettled: () => {
            // Always refetch after error or success to keep server and client in sync
            queryClient.invalidateQueries({ queryKey: ['clients'] });
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
        onMutate: async (variables) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['clients'] });

            // Snapshot the previous value
            const previousClients = queryClient.getQueryData<Client[]>(['clients']);

            // Optimistically update the cache by filtering out the selected clients
            queryClient.setQueryData<Client[]>(['clients'], (oldClients) => {
                return oldClients ? oldClients.filter(c => !variables.includes(c._id)) : [];
            });

            // Reset selected checklist instantly so UI indicators clear immediately
            setSelectedClients([]);

            // Return a context object with the snapshotted value
            return { previousClients };
        },
        onError: (error: unknown, _variables, context) => {
            console.error('Error during bulk deletion:', error);
            // Roll back to the previous value if mutation fails
            if (context?.previousClients) {
                queryClient.setQueryData(['clients'], context.previousClients);
            }
            toast.error('Failed to delete selected clients');
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Clients deleted successfully');
        },
        onSettled: () => {
            // Always refetch after error or success to keep server and client in sync
            queryClient.invalidateQueries({ queryKey: ['clients'] });
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
                                {hasPermission('client.delete') && (
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
                                )}
                            </>
                        )}
                        {hasPermission('client.add') && (
                            <CommonButton variant="contained" size="small" onClick={() => navigate('/admin/client/master')} sx={{ boxShadow: 'none' }}>
                                + Add New
                            </CommonButton>
                        )}
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
                                    {[...groups].sort((a, b) => (a.groupName || '').localeCompare(b.groupName || '')).map(group => (
                                        <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Client / Firm Name" inputId="filter-client">
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
                                    {[...clients]
                                        .filter(client => {
                                            if (!filterGroup) return true;
                                            const clientGroupId = typeof client.groupName === 'object' && client.groupName !== null
                                                ? client.groupName._id
                                                : client.groupName;
                                            return clientGroupId === filterGroup;
                                        })
                                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                        .map(client => (
                                            <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                        ))}
                                </Select>
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
                            <FilterRow label="Constitution" inputId="filter-sub-master">
                                <Select
                                    id="filter-sub-master"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={filterSubMaster}
                                    onChange={(e) => setFilterSubMaster(e.target.value)}
                                    sx={{ borderRadius: '8px', color: filterSubMaster ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Constitution' }}
                                >
                                    <MenuItem value="">Choose a Constitution...</MenuItem>
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
                            <FilterRow label="Search" inputId="filter-search-text">
                                <TextField
                                    id="filter-search-text"
                                    fullWidth
                                    size="small"
                                    placeholder="Search by name, code, email, phone, proprietor..."
                                    value={filterSearchText}
                                    onChange={(e) => setFilterSearchText(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    inputProps={{ 'aria-label': 'Search Text' }}
                                />
                            </FilterRow>

                        </Box>
                    </Box>
                </Section>

                {/* List Section */}
                <Section
                    title="List"
                    icon={<FormatListBulletedIcon />}
                    noPad
                    actions={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', display: { xs: 'none', sm: 'block' } }}>
                                Sort:
                            </Typography>
                            <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', p: '2px', borderRadius: '8px' }}>
                                <Button
                                    size="small"
                                    onClick={() => setSortOrder('asc')}
                                    sx={{
                                        minWidth: 'auto',
                                        height: 24,
                                        px: 1.5,
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '6px',
                                        bgcolor: sortOrder === 'asc' ? '#fff' : 'transparent',
                                        color: sortOrder === 'asc' ? '#6366f1' : '#64748b',
                                        boxShadow: sortOrder === 'asc' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                        '&:hover': {
                                            bgcolor: sortOrder === 'asc' ? '#fff' : 'rgba(0,0,0,0.02)',
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    A - Z
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setSortOrder('desc')}
                                    sx={{
                                        minWidth: 'auto',
                                        height: 24,
                                        px: 1.5,
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '6px',
                                        bgcolor: sortOrder === 'desc' ? '#fff' : 'transparent',
                                        color: sortOrder === 'desc' ? '#6366f1' : '#64748b',
                                        boxShadow: sortOrder === 'desc' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                        '&:hover': {
                                            bgcolor: sortOrder === 'desc' ? '#fff' : 'rgba(0,0,0,0.02)',
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Z - A
                                </Button>
                            </Box>
                        </Box>
                    }
                >
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
                                                {client.proprietorName && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="caption" color="text.secondary">Proprietor Name</Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                            {client.proprietorName}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Group Name</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                {(typeof client.groupName === 'object' && client.groupName !== null) ? client.groupName.groupName : (client.groupName || '-')}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', bgcolor: '#f8fafc', m: -2, mt: 0, p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                                {hasPermission('client.edit') && (
                                                    <>
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
                                                    </>
                                                )}
                                                {hasPermission('client.delete') && (
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: '#ef4444', bgcolor: 'white', border: '1px solid', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f1f5f9' } }}
                                                        onClick={() => handleDeleteClient(client._id, client.name || '')}
                                                        disabled={deleteClientMutation.isPending}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                )}
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
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Client / Firm Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Proprietor Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Constitution</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Group Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>Loading clients...</TableCell>
                                        </TableRow>
                                    ) : filteredClients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
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
                                                <TableCell>{client.proprietorName || '-'}</TableCell>
                                                <TableCell>{getConstitutionName(client.subMaster)}</TableCell>
                                                <TableCell>{(typeof client.groupName === 'object' && client.groupName !== null) ? client.groupName.groupName : (client.groupName || '-')}</TableCell>
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
                                                    {hasPermission('client.edit') && (
                                                        <>
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
                                                        </>
                                                    )}
                                                    {hasPermission('client.delete') && (
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: 'error.main', bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } }}
                                                            aria-label="Delete client"
                                                            onClick={() => handleDeleteClient(client._id, client.name || '')}
                                                            disabled={deleteClientMutation.isPending}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
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





