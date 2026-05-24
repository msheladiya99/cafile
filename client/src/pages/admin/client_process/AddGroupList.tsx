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
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Checkbox,
    TablePagination,
} from '@mui/material';
import {
    AddCircleOutline as AddCircleOutlineIcon,
    FormatListBulleted as FormatListBulletedIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientGroup } from '../../../services/clientGroupService';
import { clientGroupService } from '../../../services/clientGroupService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow as FormRow, CommonButton } from '../../../components/common/UIComponents';
import { BulkImportGroupModal } from './BulkImportGroupModal';


export const AddGroupList: React.FC = () => {
    const [formData, setFormData] = useState({
        groupName: '',
        address: '',
        description: '',
        status: true,
        email: '',
        mobileNumber: '',
        groupPersonName: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showSnackbar = (message: string, severity: 'success' | 'info' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        groupId: '',
        groupName: ''
    });

    const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

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

    const updateGroupMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ClientGroup> }) => clientGroupService.updateGroup(id, data),
        onSuccess: () => {
            showSnackbar('Group updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
            handleCancel();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showSnackbar(error.response?.data?.message || 'Failed to update group', 'error');
        }
    });

    const deleteGroupMutation = useMutation({
        mutationFn: clientGroupService.deleteGroup,
        onSuccess: () => {
            showSnackbar('Group deleted successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
            closeConfirm();
            setPage(0);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            showSnackbar(error.response?.data?.message || 'Failed to delete group', 'error');
            closeConfirm();
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: clientGroupService.bulkDeleteGroups,
        onSuccess: (data) => {
            showSnackbar(data.message || 'Selected groups deleted successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
            setSelectedGroups([]);
            setConfirmBulkDelete(false);
            setPage(0);
        },
        onError: (error: any) => {
            showSnackbar(error.response?.data?.message || 'Failed to delete selected groups', 'error');
            setConfirmBulkDelete(false);
        }
    });

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const currentViewIds = groups
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((g) => g._id)
                .filter((id): id is string => !!id);
            setSelectedGroups(currentViewIds);
            return;
        }
        setSelectedGroups([]);
    };

    const handleSelectClick = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const selectedIndex = selectedGroups.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedGroups, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedGroups.slice(1));
        } else if (selectedIndex === selectedGroups.length - 1) {
            newSelected = newSelected.concat(selectedGroups.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedGroups.slice(0, selectedIndex),
                selectedGroups.slice(selectedIndex + 1),
            );
        }

        setSelectedGroups(newSelected);
    };

    const isSelected = (id: string) => selectedGroups.indexOf(id) !== -1;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, status: e.target.checked }));
    };

    const handleSave = () => {
        if (!formData.groupName || !formData.mobileNumber) {
            showSnackbar('Please fill all required fields', 'error');
            return;
        }

        if (isEditing && editingId) {
            updateGroupMutation.mutate({ id: editingId, data: formData });
        } else {
            createGroupMutation.mutate(formData);
        }
    };

    const handleEditClick = (group: ClientGroup) => {
        setFormData({
            groupName: group.groupName,
            address: group.address || '',
            description: group.description || '',
            status: group.status,
            email: group.email,
            mobileNumber: group.mobileNumber,
            groupPersonName: group.groupPersonName || ''
        });
        setIsEditing(true);
        setEditingId(group._id || null);
    };

    const handleCancel = () => {
        setFormData({
            groupName: '',
            address: '',
            description: '',
            status: true,
            email: '',
            mobileNumber: '',
            groupPersonName: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setConfirmDialog({
            open: true,
            groupId: id,
            groupName: name
        });
    };

    const handleConfirmDelete = () => {
        if (confirmDialog.groupId) {
            deleteGroupMutation.mutate(confirmDialog.groupId);
        }
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Client Groups"
                actions={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedGroups.length > 0 && (
                            <Button
                                variant="contained"
                                size="small"
                                color="error"
                                onClick={() => setConfirmBulkDelete(true)}
                                disabled={bulkDeleteMutation.isPending}
                                startIcon={<DeleteIcon />}
                                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, boxShadow: 'none', fontSize: '0.85rem' }}
                            >
                                Delete Selected ({selectedGroups.length})
                            </Button>
                        )}
                        <CommonButton onClick={() => setIsImportModalOpen(true)} size="small" sx={{ bgcolor: '#0f766e', '&:hover': { bgcolor: '#0d9488' } }}>
                            Import Groups
                        </CommonButton>
                        <CommonButton onClick={handleSave} loading={createGroupMutation.isPending || updateGroupMutation.isPending} size="small">
                            {isEditing ? 'Update Group' : 'Save Group'}
                        </CommonButton>
                        <CommonButton onClick={handleCancel} size="small" sx={{ bgcolor: '#475569', '&:hover': { bgcolor: '#334155' } }}>
                            {isEditing ? 'Cancel Edit' : 'Clear Form'}
                        </CommonButton>
                    </Box>
                }
            />

            {/* Form & List Container */}
            <ContentContainer>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>

                    {/* Add Group Form */}
                    <Box sx={{ flex: 1 }}>
                        <Section title={isEditing ? "Edit Group" : "Add New Group"} icon={<AddCircleOutlineIcon />}>
                            <FormRow label="Group Name" required>
                                <TextField
                                    name="groupName"
                                    value={formData.groupName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </FormRow>

                            <FormRow label="Group Person Name">
                                <TextField
                                    name="groupPersonName"
                                    value={formData.groupPersonName}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </FormRow>

                            <FormRow label="Phone / Mobile" required>
                                <TextField
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                />
                            </FormRow>

                            <FormRow label="Email Address">
                                <TextField
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    fullWidth
                                    size="small"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    indeterminate={
                                                        selectedGroups.length > 0 &&
                                                        selectedGroups.length < groups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length
                                                    }
                                                    checked={
                                                        groups.length > 0 &&
                                                        selectedGroups.length === groups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length
                                                    }
                                                    onChange={handleSelectAllClick}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Group Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Mobile</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }} align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : groups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 3 }}>Group Not Found</TableCell>
                                            </TableRow>
                                        ) : (
                                            groups
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((g) => (
                                                    <TableRow
                                                        key={g._id}
                                                        sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}
                                                        selected={isSelected(g._id!)}
                                                    >
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                color="primary"
                                                                checked={isSelected(g._id!)}
                                                                onChange={(e) => handleSelectClick(e, g._id!)}
                                                            />
                                                        </TableCell>
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
                                                        <TableCell align="right">
                                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ color: 'primary.main' }}
                                                                    onClick={() => handleEditClick(g)}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteClick(g._id!, g.groupName)}
                                                                    disabled={deleteGroupMutation.isPending}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {groups.length > 0 && (
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 20, 30, 40, 50]}
                                    component="div"
                                    count={groups.length}
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
                    </Box>

                </Box>
            </ContentContainer>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={confirmDialog.open}
                onClose={closeConfirm}
                PaperProps={{
                    sx: { borderRadius: '12px', minWidth: { xs: 300, sm: 400 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Group</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the group "{confirmDialog.groupName}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeConfirm} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ fontWeight: 600, boxShadow: 'none' }} disabled={deleteGroupMutation.isPending}>
                        {deleteGroupMutation.isPending ? 'Deleting...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmBulkDelete}
                onClose={() => setConfirmBulkDelete(false)}
                PaperProps={{
                    sx: { borderRadius: '12px', minWidth: { xs: 300, sm: 400 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Selected Groups</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the {selectedGroups.length} selected group(s)? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmBulkDelete(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={() => bulkDeleteMutation.mutate(selectedGroups)} variant="contained" color="error" sx={{ fontWeight: 600, boxShadow: 'none' }} disabled={bulkDeleteMutation.isPending}>
                        {bulkDeleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            <BulkImportGroupModal
                open={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                showSnackbar={showSnackbar}
            />
        </PageContainer>
    );
};






