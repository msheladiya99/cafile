import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    CircularProgress,
    Card,
    CardContent,
    Stack,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    FormatListBulleted as FormatListBulletedIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { ClientGroup } from '../../../services/clientGroupService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow } from '../../../components/common/UIComponents';
import { Helmet } from 'react-helmet-async';


export const ClientContactDetail: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const { data: clients = [], isLoading, isError } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: groups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    // Filter States
    const [filterGroup, setFilterGroup] = React.useState('');
    const [filterClient, setFilterClient] = React.useState('');
    const [filterSubMaster, setFilterSubMaster] = React.useState('');
    const [filterSearchText, setFilterSearchText] = React.useState('');

    const subMasterOptions = ['Individual', 'Proprietorship', 'HUF', 'Partnership', 'Company', 'Private Limited', 'Limited Liability Partnership', 'Trust', 'AOP/BOI', 'Local Authority', 'Artificial Juridical Person', 'Firm', 'Co-operative Society', 'Other'];

    // Pagination State
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(0);
    }, [filterGroup, filterClient, filterSubMaster, filterSearchText]);

    // Reset client filter when group changes
    React.useEffect(() => {
        setFilterClient('');
    }, [filterGroup]);

    // Computed Filtered Clients
    const filteredClients = React.useMemo(() => {
        return clients.filter((client) => {
            // Group Filter
            if (filterGroup) {
                const clientGroupId = typeof client.groupName === 'object' && client.groupName !== null
                    ? client.groupName._id
                    : client.groupName;
                if (clientGroupId !== filterGroup) return false;
            }
            // Client Dropdown Filter (by _id)
            if (filterClient && client._id !== filterClient) return false;

            // Sub Master Filter
            if (filterSubMaster && client.subMaster !== filterSubMaster) return false;

            // Global Search Filter (searches name, code, email, phone, proprietor, username, groupName, and contact name, mobile, email)
            if (filterSearchText) {
                const searchLower = filterSearchText.toLowerCase();
                
                // Primary client matches
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

                // Sub-contacts matches
                const matchContactName = client.multipleContacts?.some(contact => 
                    contact.name?.toLowerCase().includes(searchLower)
                ) || false;
                const matchContactMobile = client.multipleContacts?.some(contact => 
                    contact.mobile?.includes(filterSearchText)
                ) || false;
                const matchContactEmail = client.multipleContacts?.some(contact => 
                    contact.email?.toLowerCase().includes(searchLower)
                ) || false;

                if (!matchName && !matchEmail && !matchClientCode && !matchPhone1 && !matchPhone2 && !matchProprietor && !matchUsername && !matchGroupName &&
                    !matchContactName && !matchContactMobile && !matchContactEmail) {
                    return false;
                }
            }

            return true;
        });
    }, [clients, groups, filterGroup, filterClient, filterSubMaster, filterSearchText]);

    return (
        <PageContainer>
            <Helmet>
                <title>Client Contact List | MyCAFile</title>
                <meta name="description" content="View and manage multiple contact persons for all clients." />
            </Helmet>
            {/* Header Section */}
            <PageHeader title="Client Contact Detail" />

            <ContentContainer>

                {/* Filters Section */}
                <Section title="Filter Options" icon={<FilterListIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 0, lg: 4 } }}>
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
                            <FilterRow label="Search" inputId="filter-search-text">
                                <TextField
                                    id="filter-search-text"
                                    fullWidth
                                    size="small"
                                    placeholder="Search by name, email, phone, contact..."
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
                <Section title="Client Contacts" icon={<FormatListBulletedIcon />}>
                    {isLoading ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CircularProgress size={30} />
                        </Box>
                    ) : isError ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" color="error">Error loading clients</Typography>
                        </Box>
                    ) : !clients.length ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                No Record Found
                            </Typography>
                        </Box>
                    ) : isMobile ? (
                        <Stack spacing={2}>
                            {filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((client) => {
                                const contacts = client.multipleContacts || [];
                                const allContacts = [
                                    {
                                        name: client.name,
                                        designation: 'Primary',
                                        mobile: client.phone2 ? `${client.phone}, ${client.phone2}` : client.phone,
                                        email: client.email,
                                        status: client.status,
                                        isPrimary: true
                                    },
                                    ...contacts
                                ];

                                return allContacts.map((contact, idx) => (
                                    <Card key={`${client._id}-${idx}`} variant="outlined" sx={{ borderRadius: '12px', borderColor: 'divider' }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                        {contact.name || (idx === 0 ? client.name : 'Unnamed Contact')}
                                                    </Typography>
                                                    {idx === 0 && (
                                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                            Client: {client.name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    {idx === 0 && (
                                                        <Chip label="Primary" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                                                    )}
                                                    <Box sx={{
                                                        px: 1,
                                                        py: 0.2,
                                                        borderRadius: '8px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        bgcolor: contact.status ? '#dcfce7' : '#fee2e2',
                                                        color: contact.status ? '#15803d' : '#b91c1c'
                                                    }}>
                                                        {contact.status ? 'Active' : 'Inactive'}
                                                    </Box>
                                                </Box>
                                            </Box>
                                            
                                            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                                            
                                            <Stack spacing={0.8}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Designation</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{contact.designation || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Mobile</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>{contact.mobile || '-'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{contact.email || '-'}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ));
                            })}
                        </Stack>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Client Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Contact Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Designation</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Mobile</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredClients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((client) => {
                                        const contacts = client.multipleContacts || [];
                                        const allContacts = [
                                            {
                                                name: client.name,
                                                designation: 'Primary',
                                                mobile: client.phone2 ? `${client.phone}, ${client.phone2}` : client.phone,
                                                email: client.email,
                                                status: client.status,
                                                isPrimary: true
                                            },
                                            ...contacts
                                        ];

                                        return allContacts.map((contact, idx) => (
                                            <TableRow key={`${client._id}-${idx}`} hover sx={{ '&:last-child td': { borderBottom: idx === allContacts.length - 1 ? '1px solid #e2e8f0' : 'none' } }}>
                                                <TableCell sx={{ fontWeight: idx === 0 ? 600 : 400, color: idx === 0 ? 'text.primary' : 'text.disabled' }}>
                                                    {idx === 0 ? client.name : ''}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{contact.name || (idx === 0 ? client.name : '-')}</Typography>
                                                        {('isPrimary' in contact && contact.isPrimary) && (
                                                            <Chip label="Primary" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#eef2ff', color: '#6366f1' }} />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{contact.designation}</TableCell>
                                                <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>{contact.mobile}</TableCell>
                                                <TableCell sx={{ color: 'text.secondary' }}>{contact.email}</TableCell>
                                                <TableCell>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        px: 1.2,
                                                        py: 0.4,
                                                        borderRadius: '12px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        bgcolor: contact.status ? '#e8f5e9' : '#ffebee',
                                                        color: contact.status ? 'success.main' : 'error.main'
                                                    }}>
                                                        {contact.status ? 'Active' : 'Inactive'}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })}
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
        </PageContainer>
    );
};





