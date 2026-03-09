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
    Chip,
    CircularProgress
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


export const ClientContactDetail: React.FC = () => {
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

    const subMasterOptions = ['Individual', 'HUF', 'Partnership Firm', 'LLP', 'Company', 'Association of Persons', 'Body of Individuals', 'Local Authority', 'Artificial Juridical Person', 'Co-operative Society', 'Trust', 'Other'];

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
                const primaryMatch = filterSearchType === 'name' && client.name.toLowerCase().includes(searchLower);

                // Also check if any of the multiple contacts match the name
                const contactMatch = client.multipleContacts?.some(contact => {
                    return filterSearchType === 'name' && contact.name.toLowerCase().includes(searchLower);
                });

                if (!primaryMatch && !contactMatch) return false;
            }

            return true;
        });
    }, [clients, filterGroup, filterClient, filterSubMaster, filterSearchType, filterSearchText]);

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader title="Client Contact Detail" />

            <ContentContainer>

                {/* Filters Section */}
                <Section title="Filter Options" icon={<FilterListIcon />}>
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
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Sub Master">
                                <Select fullWidth size="small" displayEmpty value={filterSubMaster} onChange={(e) => setFilterSubMaster(e.target.value)} sx={{ borderRadius: 1.5, color: filterSubMaster ? 'inherit' : 'text.secondary' }}>
                                    <MenuItem value="">Choose a Sub Master...</MenuItem>
                                    {subMasterOptions.map(option => (
                                        <MenuItem key={option} value={option}>{option}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Search">
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Select size="small" value={filterSearchType} onChange={(e) => setFilterSearchType(e.target.value)} sx={{ width: '150px', borderRadius: 1.5 }}>
                                        <MenuItem value="name">By Contact Name</MenuItem>
                                    </Select>
                                    <TextField fullWidth size="small" value={filterSearchText} onChange={(e) => setFilterSearchText(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
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
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Client Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Contact Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredClients.map((client) => {
                                        const contacts = client.multipleContacts || [];
                                        const allContacts = [
                                            // Include primary contact
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
                                            <TableRow key={`${client._id}-${idx}`} hover>
                                                <TableCell>{idx === 0 ? client.name : ''}</TableCell>
                                                <TableCell>
                                                    {contact.name}
                                                    {('isPrimary' in contact && contact.isPrimary) && <Chip label="Primary" size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: '0.65rem' }} />}
                                                </TableCell>
                                                <TableCell>{contact.designation}</TableCell>
                                                <TableCell>{contact.mobile}</TableCell>
                                                <TableCell>{contact.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={contact.status ? 'Active' : 'Inactive'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: contact.status ? '#e8f5e9' : '#ffebee',
                                                            color: contact.status ? 'success.main' : 'error.main',
                                                            fontWeight: 600,
                                                            height: 22
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Section>
            </ContentContainer>
        </PageContainer>
    );
};
