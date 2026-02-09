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
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Description as FileIcon,
    Search as SearchIcon,
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
            <Typography variant="h4" fontWeight="700" gutterBottom>
                Manage Files
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
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
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    <FormControl sx={{ minWidth: 250 }}>
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

                    <FormControl sx={{ minWidth: 200 }}>
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

                    <FormControl sx={{ minWidth: 200 }}>
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
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!selectedClient}
                        sx={{ minWidth: 250, flex: 1 }}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                    />




                </Box>
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
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
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            Please select a client to view files
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filteredFiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {searchQuery ? 'No files match your search' : 'No files found'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredFiles.map((file) => (
                                    <TableRow key={file._id} hover>
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
