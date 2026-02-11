import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Chip,
    InputAdornment,
    Button,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Folder as FolderIcon,
    LocationOn as LocationIcon,
    Inventory as InventoryIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';

export const FileRegister: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ physicalFileNumber: '', rackLocation: '' });

    // Fetch clients
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    // Update mutation
    const updateClientMutation = useMutation({
        mutationFn: (data: { id: string, updates: Partial<Client> }) =>
            adminService.updateClient(data.id, data.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setEditingId(null);
        }
    });

    const handleEdit = (client: Client) => {
        setEditingId(client._id);
        setEditForm({
            physicalFileNumber: client.physicalFileNumber || '',
            rackLocation: client.rackLocation || ''
        });
    };

    const handleSave = (id: string) => {
        updateClientMutation.mutate({
            id,
            updates: {
                physicalFileNumber: editForm.physicalFileNumber,
                rackLocation: editForm.rackLocation
            }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const filteredClients = clients.filter((client: Client) => {
        const query = searchQuery.toLowerCase();
        return (
            client.name.toLowerCase().includes(query) ||
            (client.panNumber && client.panNumber.toLowerCase().includes(query)) ||
            (client.physicalFileNumber && client.physicalFileNumber.toLowerCase().includes(query)) ||
            (client.rackLocation && client.rackLocation.toLowerCase().includes(query))
        );
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Statistics
    const totalFiles = clients.filter(c => c.physicalFileNumber).length;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, pb: 10 }}>
            {/* Header */}
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={4} gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                        Office File Register
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track physical file locations and rack numbers
                    </Typography>
                </Box>
                <Chip
                    icon={<InventoryIcon />}
                    label={`${totalFiles} Files Tracked`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold', borderRadius: 2, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}
                />
            </Box>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by Client, PAN, File No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 2 }
                    }}
                    size="small"
                />
                <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    sx={{ borderRadius: 2, whiteSpace: 'nowrap', width: { xs: '100%', md: 'auto' } }}
                >
                    Filters
                </Button>
            </Paper>

            {/* Content Switcher: Mobile Cards vs Desktop Table */}
            {isMobile ? (
                <Box display="flex" flexDirection="column" gap={2}>
                    {filteredClients.map((client: Client) => {
                        const isEditing = editingId === client._id;
                        return (
                            <Paper key={client._id} sx={{ p: 2, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
                                {/* Card Header */}
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography fontWeight="700" color="#1e293b" fontSize="1rem">{client.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">{client.email}</Typography>
                                        {client.panNumber && (
                                            <Chip label={client.panNumber} size="small" variant="outlined" sx={{ borderRadius: 1, fontWeight: 600, mt: 0.5, fontSize: '0.7rem', height: 20 }} />
                                        )}
                                    </Box>
                                    {!isEditing && (
                                        <IconButton size="small" onClick={() => handleEdit(client)} sx={{ bgcolor: '#f1f5f9', color: '#64748b' }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                <Box display="flex" flexDirection="column" gap={2}>
                                    {/* File Number Field */}
                                    <Box>
                                        <Typography variant="caption" fontWeight="600" color="text.secondary" gutterBottom>FILE NUMBER</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="e.g. F-101"
                                                value={editForm.physicalFileNumber}
                                                onChange={(e) => setEditForm({ ...editForm, physicalFileNumber: e.target.value.toUpperCase() })}
                                                sx={{ bgcolor: 'white' }}
                                            />
                                        ) : (
                                            <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="#f8fafc" borderRadius={2}>
                                                <FolderIcon fontSize="small" color="primary" sx={{ opacity: 0.7 }} />
                                                <Typography fontWeight="600" fontSize="0.9rem">
                                                    {client.physicalFileNumber || <span style={{ fontStyle: 'italic', color: '#94a3b8', fontWeight: 400 }}>Not Assigned</span>}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Rack Location Field */}
                                    <Box>
                                        <Typography variant="caption" fontWeight="600" color="text.secondary" gutterBottom>RACK LOCATION</Typography>
                                        {isEditing ? (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="e.g. Rack A - Shelf 2"
                                                value={editForm.rackLocation}
                                                onChange={(e) => setEditForm({ ...editForm, rackLocation: e.target.value })}
                                                sx={{ bgcolor: 'white' }}
                                            />
                                        ) : (
                                            <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="#f8fafc" borderRadius={2}>
                                                <LocationIcon fontSize="small" color="error" sx={{ opacity: 0.7 }} />
                                                <Typography fontSize="0.9rem">
                                                    {client.rackLocation || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Not Assigned</span>}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* Edit Actions */}
                                {isEditing && (
                                    <Box display="flex" gap={2} mt={2} pt={2} borderTop="1px solid #e2e8f0">
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            startIcon={<SaveIcon />}
                                            onClick={() => handleSave(client._id)}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        );
                    })}
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CLIENT DETAILS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PAN NUMBER</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '20%' }}>FILE NO.</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '20%' }}>RACK LOCATION</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredClients.map((client: Client) => {
                                const isEditing = editingId === client._id;
                                return (
                                    <TableRow key={client._id} hover>
                                        <TableCell>
                                            <Typography fontWeight="600" color="#1e293b">{client.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {client.panNumber ? (
                                                <Chip label={client.panNumber} size="small" variant="outlined" sx={{ borderRadius: 1, fontWeight: 600 }} />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="e.g. F-101"
                                                    value={editForm.physicalFileNumber}
                                                    onChange={(e) => setEditForm({ ...editForm, physicalFileNumber: e.target.value.toUpperCase() })}
                                                    sx={{ bgcolor: 'white' }}
                                                    autoFocus
                                                />
                                            ) : (
                                                client.physicalFileNumber ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <FolderIcon fontSize="small" color="primary" sx={{ opacity: 0.7 }} />
                                                        <Typography fontWeight="600">{client.physicalFileNumber}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled" fontStyle="italic">Not Assigned</Typography>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    placeholder="e.g. Rack A - Shelf 2"
                                                    value={editForm.rackLocation}
                                                    onChange={(e) => setEditForm({ ...editForm, rackLocation: e.target.value })}
                                                    sx={{ bgcolor: 'white' }}
                                                />
                                            ) : (
                                                client.rackLocation ? (
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <LocationIcon fontSize="small" color="error" sx={{ opacity: 0.7 }} />
                                                        <Typography>{client.rackLocation}</Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled" fontStyle="italic">Not Assigned</Typography>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {isEditing ? (
                                                <Box display="flex" gap={1} justifyContent="flex-end">
                                                    <Tooltip title="Save">
                                                        <IconButton size="small" color="primary" onClick={() => handleSave(client._id)} sx={{ bgcolor: '#eff6ff' }}>
                                                            <SaveIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton size="small" color="error" onClick={handleCancel} sx={{ bgcolor: '#fef2f2' }}>
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ) : (
                                                <Tooltip title="Edit Location">
                                                    <IconButton size="small" onClick={() => handleEdit(client)} sx={{ '&:hover': { color: '#2563eb', bgcolor: '#eff6ff' } }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {filteredClients.length === 0 && (
                <Box textAlign="center" py={8} sx={{ opacity: 0.7 }}>
                    <InventoryIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No clients found</Typography>
                    <Typography variant="body2" color="text.disabled">Try adjusting your search filters.</Typography>
                </Box>
            )}
        </Box>
    );
};
