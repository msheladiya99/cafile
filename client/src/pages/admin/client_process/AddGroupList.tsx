import React, { useState } from 'react';
import {
    Box,
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
import {
    AddCircleOutline as AddCircleOutlineIcon,
    FormatListBulleted as FormatListBulletedIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientGroup } from '../../../services/clientGroupService';
import { clientGroupService } from '../../../services/clientGroupService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow as FormRow } from '../../../components/common/UIComponents';


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
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Client Groups"
                actions={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" size="small" onClick={handleSave} disabled={createGroupMutation.isPending} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            {createGroupMutation.isPending ? 'Saving...' : 'Save Group'}
                        </Button>
                        <Button variant="contained" size="small" onClick={handleCancel} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Clear Form
                        </Button>
                    </Box>
                }
            />

            {/* Form & List Container */}
            <ContentContainer>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>

                    {/* Add Group Form */}
                    <Box sx={{ flex: 1 }}>
                        <Section title="Add New Group" icon={<AddCircleOutlineIcon />}>
                            <FormRow label="Group Name" required>
                                <TextField
                                    name="groupName"
                                    value={formData.groupName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="Address">
                                <TextField
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="Phone / Mobile" required>
                                <TextField
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="Email Address" required>
                                <TextField
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="GSTIN">
                                <TextField
                                    name="gstin"
                                    value={formData.gstin}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="Description">
                                <TextField
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                            </FormRow>

                            <FormRow label="Status">
                                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: formData.status ? '#e8f5e9' : '#ffebee', borderRadius: 4, px: 2, height: 32, width: 'fit-content' }}>
                                    <Switch size="small" color="primary" sx={{ ml: -1 }} checked={formData.status} onChange={handleStatusChange} />
                                    <Typography variant="body2" sx={{ color: formData.status ? 'success.main' : 'error.main', ml: 0.5, fontWeight: 600 }}>{formData.status ? 'Active' : 'Inactive'}</Typography>
                                </Box>
                            </FormRow>
                        </Section>
                    </Box>

                    {/* Group List */}
                    <Box sx={{ flex: 1 }}>
                        <Section title="Group List" icon={<FormatListBulletedIcon />}>
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Group Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Mobile</TableCell>
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
                                                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>Group Not Found</TableCell>
                                            </TableRow>
                                        ) : (
                                            groups.map((g, i) => (
                                                <TableRow key={i} hover>
                                                    <TableCell sx={{ fontWeight: 500 }}>{g.groupName}</TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary' }}>{g.email}</TableCell>
                                                    <TableCell sx={{ color: 'text.secondary' }}>{g.mobileNumber}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.status ? 'success.main' : 'error.main', mr: 1 }} />
                                                            <Typography variant="caption" sx={{ color: g.status ? 'success.main' : 'error.main', fontWeight: 600 }}>
                                                                {g.status ? 'Active' : 'Inactive'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Section>
                    </Box>

                </Box>
            </ContentContainer>

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
        </PageContainer>
    );
};

