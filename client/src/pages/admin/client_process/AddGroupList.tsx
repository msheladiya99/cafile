import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientGroup } from '../../../services/clientGroupService';
import { clientGroupService } from '../../../services/clientGroupService';

export const AddGroupList: React.FC = () => {
    const [formData, setFormData] = useState({
        groupName: '',
        address: '',
        description: '',
        status: true,
        email: '',
        mobileNumber: '',
        gstin: ''
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showSnackbar = (message: string, severity: 'success' | 'info' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const queryClient = useQueryClient();

    const { data: groups = [], isLoading } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const createGroupMutation = useMutation({
        mutationFn: clientGroupService.createGroup,
        onSuccess: () => {
            showSnackbar('Group saved successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
            handleCancel(); // Reset form
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showSnackbar(error.response?.data?.message || 'Failed to save group', 'error');
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, status: e.target.checked }));
    };

    const handleSave = () => {
        if (!formData.groupName || !formData.email || !formData.mobileNumber) {
            showSnackbar('Please fill all required fields', 'error');
            return;
        }
        createGroupMutation.mutate(formData);
    };

    const handleCancel = () => {
        setFormData({
            groupName: '',
            address: '',
            description: '',
            status: true,
            email: '',
            mobileNumber: '',
            gstin: ''
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Form Section */}
            <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>Add Group + List</Typography>
                    <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                        Add New
                    </Button>
                </Box>

                <Box sx={{ p: 4, bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                        {/* Left Column */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    Group Name <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="groupName"
                                    value={formData.groupName}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    Address
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={3}
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    Description
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    multiline
                                    rows={3}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
                                    Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: formData.status ? '#e8eaed' : '#fce4e4', borderRadius: 4, px: 2, height: 32 }}>
                                    <Switch
                                        checked={formData.status}
                                        onChange={handleStatusChange}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: -1 }}
                                    />
                                    <Typography variant="body2" sx={{ color: formData.status ? 'primary.main' : 'error.main', ml: 0.5, fontWeight: 600 }}>
                                        {formData.status ? 'Active' : 'Inactive'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    Email <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    Mobile Number <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>

                            <Box sx={{ mb: 3, display: 'flex' }}>
                                <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                                    GSTIN
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleInputChange}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={createGroupMutation.isPending}
                            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4, py: 1, textTransform: 'none', borderRadius: 2, fontWeight: 600 }}
                        >
                            {createGroupMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            sx={{ px: 4, py: 1, textTransform: 'none', borderRadius: 2, color: 'text.secondary', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>Group List</Typography>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Group Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Mobile Number</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', borderBottom: 'none', py: 3 }}>Group Not Found</TableCell>
                                </TableRow>
                            ) : (
                                groups.map((g, i) => (
                                    <TableRow key={i} hover>
                                        <TableCell>{g.groupName}</TableCell>
                                        <TableCell>{g.email}</TableCell>
                                        <TableCell>{g.mobileNumber}</TableCell>
                                        <TableCell>
                                            <span style={{ color: g.status ? 'green' : 'red', fontWeight: 500 }}>
                                                {g.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
