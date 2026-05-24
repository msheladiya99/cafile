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
    const [filterSearchType, setFilterSearchType] = React.useState('name');
    const [filterSearchText, setFilterSearchText] = React.useState('');

    const subMasterOptions = ['Individual', 'Proprietorship', 'HUF', 'Partnership Firm', 'Company', 'Private Limited', 'Limited Liability Partnership', 'Association of Persons', 'Body of Individuals', 'Local Authority', 'Artificial Juridical Person', 'Co-operative Society', 'Trust', 'Other'];

    // Pagination State
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // Reset page when filters change
    React.useEffect(() => {
        setPage(0);
    }, [filterGroup, filterClient, filterSubMaster, filterSearchType, filterSearchText]);

    // Computed Filtered Clients
    const filteredClients = React.useMemo(() => {
        return clients.filter((client) => {
            // Group Filter
            if (filterGroup && typeof client.groupName === 'object' && client.groupName?._id !== filterGroup) return false;
            // Client Dropdown Filter (by _id)
            if (filterClient && client._id !== filterClient) return false;

            // Sub Master Filter
            if (filterSubMaster && client.subMaster !== filterSubMaster) return false;

            // Search Text Filter
            if (filterSearchText) {
                const searchLower = filterSearchText.toLowerCase();
                
                if (filterSearchType === 'name') {
                    const primaryMatch = client.name.toLowerCase().includes(searchLower);
                    const contactMatch = client.multipleContacts?.some(contact => 
                        contact.name.toLowerCase().includes(searchLower)
                    );
                    if (!primaryMatch && !contactMatch) return false;
                } else if (filterSearchType === 'mobile') {
                    const primaryMatch = client.phone?.includes(filterSearchText);
                    const contactMatch = client.multipleContacts?.some(contact => 
                        contact.mobile?.includes(filterSearchText)
                    );
                    if (!primaryMatch && !contactMatch) return false;
                } else if (filterSearchType === 'email') {
                    const primaryMatch = client.email?.toLowerCase().includes(searchLower);
                    const contactMatch = client.multipleContacts?.some(contact => 
                        contact.email?.toLowerCase().includes(searchLower)
                    );
                    if (!primaryMatch && !contactMatch) return false;
                }
            }

            return true;
        });
    }, [clients, filterGroup, filterClient, filterSubMaster, filterSearchType, filterSearchText]);

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
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                                    <Select
                                        size="small"
                                        value={filterSearchType}
                                        onChange={(e) => setFilterSearchType(e.target.value)}
                                        sx={{ width: { xs: '100%', sm: '150px' }, borderRadius: '8px' }}
                                        inputProps={{ 'aria-label': 'Search Category' }}
                                    >
                                        <MenuItem value="name">By Contact Name</MenuItem>
                                        <MenuItem value="mobile">By Contact Number</MenuItem>
                                        <MenuItem value="email">By Email</MenuItem>
                                    </Select>
                                    <TextField
                                        id="filter-search-text"
                                        fullWidth
                                        size="small"
                                        placeholder="Enter name..."
                                        value={filterSearchText}
                                        onChange={(e) => setFilterSearchText(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                        inputProps={{ 'aria-label': 'Search Text' }}
                                    />
                                </Box>
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
                                        mobile: client.phone,
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
                                                mobile: client.phone,
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





