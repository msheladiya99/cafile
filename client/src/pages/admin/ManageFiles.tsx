import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    useTheme,
    useMediaQuery,
    Divider,
    Stack,
    Avatar,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Menu,
    Breadcrumbs,
    Checkbox,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Description as FileIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    InsertDriveFile as InsertDriveFileIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Image as ImageIcon,
    Home as HomeIcon,
    NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { Client, FileData } from '../../types';

export const ManageFiles: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [files, setFiles] = useState<FileData[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [years, setYears] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [editDialog, setEditDialog] = useState(false);
    const [editingFile, setEditingFile] = useState<FileData | null>(null);
    const [newFileName, setNewFileName] = useState('');
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuFile, setMenuFile] = useState<FileData | null>(null);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);


    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileData) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setMenuFile(file);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuFile(null);
    };

    const handleMenuAction = (action: 'download' | 'edit' | 'delete') => {
        if (!menuFile) return;
        if (action === 'download') adminService.downloadFile(menuFile._id, menuFile.fileName);
        if (action === 'edit') handleEdit(menuFile);
        if (action === 'delete') handleDelete(menuFile._id);
        handleMenuClose();
    };

    const groupFiles = (files: FileData[]) => {
        const groups: { [key: string]: FileData[] } = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'This Month': [],
            'Older': []
        };

        files.forEach(file => {
            const date = new Date(file.uploadedAt);
            const now = new Date();
            // Reset hours to compare dates properly
            const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) groups['Today'].push(file); // Same day
            else if (diffDays === 1) groups['Yesterday'].push(file);
            else if (diffDays <= 7) groups['This Week'].push(file);
            else if (diffDays <= 30) groups['This Month'].push(file);
            else groups['Older'].push(file);
        });
        return groups;
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext || '')) return <PictureAsPdfIcon color="error" />;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon color="primary" />;
        return <InsertDriveFileIcon color="action" />;
    };

    useEffect(() => {
        loadClients();
    }, []);

    const loadYears = useCallback(async () => {
        try {
            const data = await adminService.getClientYears(selectedClient);
            setYears(data);
        } catch (error) {
            console.error('Error loading years:', error);
        }
    }, [selectedClient]);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getClientFiles(
                selectedClient,
                selectedYear,
                selectedCategory
            );
            setFiles(data);
            setFilteredFiles(data);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedClient, selectedYear, selectedCategory]);

    useEffect(() => {
        if (selectedClient) {
            loadYears();
            loadFiles();
        }
    }, [selectedClient, selectedYear, selectedCategory, loadYears, loadFiles]);

    const loadClients = async () => {
        try {
            const data = await adminService.getClients();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };



    // Simplified filter with search
    useEffect(() => {
        let filtered = files;

        // Filter by search query
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(file =>
                file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredFiles(filtered);
    }, [searchQuery, files]);

    // Clear selection when filters change
    useEffect(() => {
        setSelectedFileIds([]);
    }, [selectedClient, selectedYear, selectedCategory, searchQuery]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedFileIds(filteredFiles.map(f => f._id));
        } else {
            setSelectedFileIds([]);
        }
    };

    const handleSelectOne = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (event.target.checked) {
            setSelectedFileIds(prev => [...prev, id]);
        } else {
            setSelectedFileIds(prev => prev.filter(fileId => fileId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFileIds.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedFileIds.length} files? This action cannot be undone.`)) {
            setLoading(true);
            try {
                const result = await adminService.deleteFiles(selectedFileIds);
                if (result.errors && result.errors.length > 0) {
                    alert(`Deleted ${result.deletedCount} files. Errors: ${result.errors.join(', ')}`);
                }
                setSelectedFileIds([]);
                loadFiles();
            } catch (error) {
                console.error('Error deleting files:', error);
                alert('Failed to delete selected files');
            } finally {
                setLoading(false);
            }
        }
    };


    const handleEdit = (file: FileData) => {
        setEditingFile(file);
        setNewFileName(file.fileName);
        setEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (editingFile && newFileName) {
            try {
                await adminService.updateFileName(editingFile._id, newFileName);
                setEditDialog(false);
                loadFiles();
            } catch (error) {
                console.error('Error updating file:', error);
            }
        }
    };

    const handleDelete = async (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            try {
                await adminService.deleteFile(fileId);
                loadFiles();
            } catch (error) {
                console.error('Error deleting file:', error);
            }
        }
    };



    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'ITR':
                return 'primary';
            case 'GST':
                return 'success';
            case 'ACCOUNTING':
                return 'warning';
            case 'USER_DOCS':
                return 'info';
            default:
                return 'default';
        }
    };



    return (
        <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="700" gutterBottom>
                Manage Files
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={isMobile ? 2 : 4}>
                View and manage client files
            </Typography>

            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
            >
                <Stack direction={isMobile ? 'column' : 'row'} spacing={2} width="100%">
                    <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 250 }}>
                        <InputLabel>Select Client</InputLabel>
                        <Select
                            value={selectedClient}
                            onChange={(e) => {
                                setSelectedClient(e.target.value);
                                setSelectedYear('');
                                setSelectedCategory('');
                                setSearchQuery('');
                            }}
                            label="Select Client"
                        >
                            <MenuItem value="">All Clients</MenuItem>
                            {clients.map((client) => (
                                <MenuItem key={client._id} value={client._id}>
                                    {client.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 200 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            label="Year"
                            disabled={!selectedClient}
                        >
                            <MenuItem value="">All Years</MenuItem>
                            {years.map((year) => (
                                <MenuItem key={year} value={year}>
                                    FY {year}-{(parseInt(year) + 1).toString().slice(-2)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 200 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            label="Category"
                            disabled={!selectedClient}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            <MenuItem value="ITR">ITR Returns</MenuItem>
                            <MenuItem value="GST">GST Returns</MenuItem>
                            <MenuItem value="ACCOUNTING">Accounting</MenuItem>
                            <MenuItem value="USER_DOCS">User Documents</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth={isMobile}
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!selectedClient}
                        sx={{ minWidth: isMobile ? '100%' : 250, flex: 1 }}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                    />
                </Stack>
                {selectedFileIds.length > 0 && (
                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleBulkDelete}
                            sx={{ borderRadius: 2 }}
                        >
                            Delete Selected ({selectedFileIds.length})
                        </Button>
                    </Box>
                )}
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            ) : (
                isMobile ? (
                    <Box>
                        {/* Breadcrumbs for Context */}
                        {selectedClient && (
                            <Paper sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'background.paper' }} elevation={0} variant="outlined">
                                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" color="action" />} aria-label="breadcrumb">
                                    <Stack direction="row" alignItems="center" gap={0.5} color="text.secondary">
                                        <HomeIcon fontSize="small" />
                                    </Stack>
                                    <Typography color="text.primary" fontWeight="500">
                                        {clients.find(c => c._id === selectedClient)?.name || 'Client'}
                                    </Typography>
                                    {(selectedYear || selectedCategory) && (
                                        <Typography color="text.secondary" variant="body2">
                                            {[
                                                selectedYear ? `FY ${selectedYear}` : '',
                                                selectedCategory
                                            ].filter(Boolean).join(' / ')}
                                        </Typography>
                                    )}
                                </Breadcrumbs>
                            </Paper>
                        )}

                        {!selectedClient ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }} variant="outlined">
                                <Typography color="text.secondary">Please select a client to view files</Typography>
                            </Paper>
                        ) : filteredFiles.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }} variant="outlined">
                                <Typography color="text.secondary">
                                    {searchQuery ? 'No files match your search' : 'No files found'}
                                </Typography>
                            </Paper>
                        ) : (
                            // Grouped Files List
                            Object.entries(groupFiles(filteredFiles)).map(([group, groupFiles]) => (
                                groupFiles.length > 0 && (
                                    <Box key={group} mb={3}>
                                        <Typography variant="overline" color="text.secondary" fontWeight="700" sx={{ px: 1, letterSpacing: 1 }}>
                                            {group}
                                        </Typography>
                                        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mt: 1 }} elevation={0} variant="outlined">
                                            <List disablePadding>
                                                {groupFiles.map((file, index) => (
                                                    <React.Fragment key={file._id}>
                                                        {index > 0 && <Divider component="li" sx={{ ml: 9 }} />}
                                                        <ListItem
                                                            secondaryAction={
                                                                <Stack direction="row" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                                                                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                                                    </Typography>
                                                                    <IconButton
                                                                        edge="end"
                                                                        size="small"
                                                                        onClick={(e) => handleMenuOpen(e, file)}
                                                                        sx={{ color: 'text.secondary' }}
                                                                    >
                                                                        <MoreVertIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Stack>
                                                            }
                                                            disablePadding
                                                            sx={{
                                                                '&:active': { bgcolor: 'action.hover' }
                                                            }}
                                                        >
                                                            <ListItemButton
                                                                onClick={() => adminService.downloadFile(file._id, file.fileName)}
                                                                sx={{ py: 1.5 }}
                                                            >
                                                                <ListItemIcon sx={{ minWidth: 50 }}>
                                                                    <Avatar
                                                                        variant="rounded"
                                                                        sx={{
                                                                            bgcolor: 'transparent',
                                                                            color: 'primary.main',
                                                                            border: '1px solid',
                                                                            borderColor: 'divider'
                                                                        }}
                                                                    >
                                                                        {getFileIcon(file.fileName)}
                                                                    </Avatar>
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={
                                                                        <Typography variant="body2" fontWeight="600" noWrap sx={{ pr: 4 }}>
                                                                            {file.fileName}
                                                                        </Typography>
                                                                    }
                                                                    secondary={
                                                                        <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
                                                                            <Chip
                                                                                label={file.category}
                                                                                size="small"
                                                                                color={getCategoryColor(file.category)}
                                                                                variant="outlined"
                                                                                sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1 }}
                                                                            />
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                • {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </Typography>
                                                                        </Stack>
                                                                    }
                                                                    secondaryTypographyProps={{ component: 'div' }}
                                                                />
                                                            </ListItemButton>
                                                        </ListItem>
                                                    </React.Fragment>
                                                ))}
                                            </List>
                                        </Paper>
                                    </Box>
                                )
                            ))
                        )}

                        {/* Action Menu */}
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: { width: 180, borderRadius: 2 }
                            }}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        >
                            <MenuItem onClick={() => handleMenuAction('download')}>
                                <ListItemIcon><InsertDriveFileIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Download</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => handleMenuAction('edit')}>
                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                <ListItemText>Rename</ListItemText>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
                                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                                <ListItemText>Delete</ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            indeterminate={selectedFileIds.length > 0 && selectedFileIds.length < filteredFiles.length}
                                            checked={filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length}
                                            onChange={handleSelectAll}
                                            disabled={filteredFiles.length === 0}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Uploaded</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {!selectedClient ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                Please select a client to view files
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredFiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">
                                                {searchQuery ? 'No files match your search' : 'No files found'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredFiles.map((file) => (
                                        <TableRow key={file._id} hover selected={selectedFileIds.includes(file._id)}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    checked={selectedFileIds.includes(file._id)}
                                                    onChange={(event) => handleSelectOne(event, file._id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <FileIcon color="action" />
                                                        <Typography
                                                            fontWeight="600"
                                                            sx={{
                                                                cursor: 'pointer',
                                                                color: '#667eea',
                                                                '&:hover': {
                                                                    textDecoration: 'underline',
                                                                }
                                                            }}
                                                            onClick={() => adminService.downloadFile(file._id, file.fileName)}
                                                        >
                                                            {file.fileName}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={file.category}
                                                    color={getCategoryColor(file.category)}
                                                    size="small"
                                                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {file.year ? (
                                                    <Chip
                                                        label={`FY ${file.year}-${(parseInt(file.year) + 1).toString().slice(-2)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 1.5 }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.5, whiteSpace: 'nowrap' }}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEdit(file)}
                                                        title="Edit Name"
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(file._id)}
                                                        title="Delete File"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                )
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit File Name</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="File Name"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>





        </Box>
    );
};
