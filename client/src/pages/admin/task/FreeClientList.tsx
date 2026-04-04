import React, { useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    IconButton,
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { Client } from '../../../types';

export const FreeClientList: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('All Client');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
    }, []);

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: clientGroups = [] } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            if (groupName && client.groupName !== groupName && (client.groupName as { _id: string })?._id !== groupName) return false;
            if (clientName && client._id !== clientName) return false;
            return true;
        });
    }, [clients, groupName, clientName]);

    return (
        <Box sx={{ p: 0 }}>
            <Paper elevation={0} sx={{
                p: 2,
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h6" fontWeight="500">Free Client List</Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '0 0 8px 8px' }}>
                <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ minWidth: 100, color: 'text.secondary' }}>Group Name</Typography>
                        <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        >
                            <MenuItem value="">Choose a Group...</MenuItem>
                            {clientGroups.map((g: any) => (
                                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ minWidth: 100, color: 'text.secondary' }}>Client Name</Typography>
                        <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        >
                            <MenuItem value="">Choose a Client...</MenuItem>
                            {clients.map((c: Client) => (
                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ minWidth: 100, color: 'text.secondary' }}>Year</Typography>
                        <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        >
                            <MenuItem value="">Choose Year...</MenuItem>
                            {years.map(y => (
                                <MenuItem key={y} value={y}>{y}</MenuItem>
                            ))}
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ minWidth: 100, color: 'text.secondary' }}>Status</Typography>
                        <Select
                            size="small"
                            fullWidth
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <MenuItem value="All Client">All Client</MenuItem>
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                        </Select>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1e293b' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="600">List</Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white' }}>
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Group Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Client Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                            ) : filteredClients.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center">No clients found.</TableCell></TableRow>
                            ) : (
                                filteredClients.map((client, index) => (
                                    <TableRow key={client._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{(client.groupName as any)?.groupName || '-'}</TableCell>
                                        <TableCell>{client.name}</TableCell>
                                        <TableCell>{client.phone || '-'}</TableCell>
                                        <TableCell>{client.email || '-'}</TableCell>
                                        <TableCell>{client.status !== false ? 'Active' : 'Inactive'}</TableCell>
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





