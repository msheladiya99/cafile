import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    InputAdornment,
    Card,
    CardContent,
    useTheme,
    alpha,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    CircularProgress,
    Container,
    Stack,
    Paper,
    Fade,
    Zoom,
    Divider,
    Chip
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    CloudDone as CloudDoneIcon,
    Person as PersonIcon,
    FolderOpen as FolderIcon,
    EventNote as CalendarIcon,
    InsertDriveFile as FileIcon,
    DeleteOutline as DeleteIcon,
    ErrorOutline as ErrorIcon,
    Storage as StorageIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';
import { AxiosError } from 'axios';

interface FileUploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    message?: string;
}

export const UploadFile: React.FC = () => {
    const theme = useTheme();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [month, setMonth] = useState('');
    const [docType, setDocType] = useState('');
    const [category, setCategory] = useState<'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS'>('ITR');
    const [selectedFiles, setSelectedFiles] = useState<FileUploadItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingClients, setLoadingClients] = useState(true);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await adminService.getClients();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
            setError('Failed to load clients list.');
        } finally {
            setLoadingClients(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = (newFiles: File[]) => {
        const fileItems: FileUploadItem[] = newFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending'
        }));
        setSelectedFiles(prev => [...prev, ...fileItems]);
        setError('');
    };

    const handleRemoveFile = (id: string) => {
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0 || !selectedClient) {
            setError('Please select a client and at least one file.');
            return;
        }

        setError('');
        setLoading(true);

        const updatedFiles = [...selectedFiles];

        for (let i = 0; i < updatedFiles.length; i++) {
            if (updatedFiles[i].status === 'success') continue;

            updatedFiles[i] = { ...updatedFiles[i], status: 'uploading' };
            setSelectedFiles([...updatedFiles]);

            try {
                const formData = new FormData();
                formData.append('file', updatedFiles[i].file);
                formData.append('clientId', selectedClient);
                if (category !== 'USER_DOCS') {
                    formData.append('year', year);
                }
                if (category === 'GST') {
                    if (month) formData.append('month', month);
                    if (docType) formData.append('docType', docType);
                }
                formData.append('category', category);
                formData.append('fileName', updatedFiles[i].file.name);
                formData.append('useGoogleDrive', 'true');

                await adminService.uploadFile(formData);

                updatedFiles[i] = { ...updatedFiles[i], status: 'success', message: 'Uploaded' };
            } catch (err: unknown) {
                console.error('Upload Error:', err);
                const message = err instanceof AxiosError
                    ? err.response?.data?.message || 'Failed'
                    : 'Failed';
                updatedFiles[i] = { ...updatedFiles[i], status: 'error', message };
            }

            setSelectedFiles([...updatedFiles]);
        }

        setLoading(false);
    };

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>


            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={4}>
                {/* Left Column: Configuration */}
                <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
                    <Stack spacing={3}>
                        <Card sx={{
                            borderRadius: 5,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.divider, 0.5)
                        }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <StorageIcon color="primary" />
                                    Upload Context
                                </Typography>

                                <Stack spacing={4}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Target Client</InputLabel>
                                        <Select
                                            value={selectedClient}
                                            onChange={(e) => setSelectedClient(e.target.value)}
                                            label="Target Client"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <PersonIcon color="action" />
                                                </InputAdornment>
                                            }
                                            sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                                        >
                                            {loadingClients ? (
                                                <MenuItem disabled><CircularProgress size={20} sx={{ mr: 2 }} /> Loading...</MenuItem>
                                            ) : clients.map((client) => (
                                                <MenuItem key={client._id} value={client._id}>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight={600}>{client.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Document Type</InputLabel>
                                        <Select
                                            value={category}
                                            onChange={(e) => {
                                                setCategory(e.target.value as 'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS');
                                                if (e.target.value !== 'GST') {
                                                    setMonth('');
                                                    setDocType('');
                                                }
                                            }}
                                            label="Document Type"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <FolderIcon color="action" />
                                                </InputAdornment>
                                            }
                                            sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                                        >
                                            <MenuItem value="ITR">Income Tax Records</MenuItem>
                                            <MenuItem value="GST">GST Compliance</MenuItem>
                                            <MenuItem value="ACCOUNTING">Accounting & Audit</MenuItem>
                                            <MenuItem value="USER_DOCS">User Documents</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {category === 'GST' && (
                                        <Fade in={category === 'GST'}>
                                            <Stack spacing={4}>
                                                <FormControl fullWidth variant="outlined">
                                                    <InputLabel>Reporting Month</InputLabel>
                                                    <Select
                                                        value={month}
                                                        onChange={(e) => setMonth(e.target.value)}
                                                        label="Reporting Month"
                                                        startAdornment={
                                                            <InputAdornment position="start">
                                                                <CalendarIcon color="action" />
                                                            </InputAdornment>
                                                        }
                                                        sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                                                    >
                                                        {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((m) => (
                                                            <MenuItem key={m} value={m}>{m}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                <FormControl fullWidth variant="outlined">
                                                    <InputLabel>Returns Category</InputLabel>
                                                    <Select
                                                        value={docType}
                                                        onChange={(e) => setDocType(e.target.value)}
                                                        label="Returns Category"
                                                        sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                                                    >
                                                        {['GSTR-1', 'GSTR-2A', 'GSTR-2B', 'GSTR-3B', 'Challan', 'Other'].map((type) => (
                                                            <MenuItem key={type} value={type}>{type}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Stack>
                                        </Fade>
                                    )}

                                    {category !== 'USER_DOCS' && (
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Financial Year</InputLabel>
                                            <Select
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
                                                label="Financial Year"
                                                sx={{ borderRadius: 3, bgcolor: '#f8fafc' }}
                                            >
                                                {years.map((y) => (
                                                    <MenuItem key={y} value={y}>FY {y}-{(parseInt(y) + 1).toString().slice(-2)}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: 5,
                            bgcolor: alpha(theme.palette.success.main, 0.05),
                            border: '1px dashed',
                            borderColor: theme.palette.success.main,
                            display: 'flex',
                            gap: 2,
                            alignItems: 'flex-start'
                        }}>
                            <Box sx={{
                                bgcolor: theme.palette.success.main,
                                color: 'white',
                                p: 1,
                                borderRadius: 1.5,
                                display: 'flex'
                            }}>
                                <CloudDoneIcon fontSize="small" />
                            </Box>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                    Google Drive Integration Active
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    All files uploaded here are automatically synced to your secure Cloud storage for long-term retention.
                                </Typography>
                            </Box>
                        </Paper>
                    </Stack>
                </Box>

                {/* Right Column: File Dropzone and List */}
                <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
                    <Stack spacing={3}>
                        <Box
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 6,
                                border: '2px dashed',
                                borderRadius: 6,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderColor: dragActive ? 'primary.main' : 'divider',
                                bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.04) : '#fff',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 15px 35px rgba(0,0,0,0.05)'
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
                            />

                            <Zoom in={true}>
                                <Box sx={{
                                    p: 2.5,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    mb: 2.5
                                }}>
                                    <UploadIcon sx={{ fontSize: 50 }} />
                                </Box>
                            </Zoom>

                            <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
                                {dragActive ? "Release to stage files" : "Drop files to automate"}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                Drag and drop files here, or click to browse your system<br />
                                <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                                    Supports PDF, Excel, Word & Images (Max 25MB)
                                </Typography>
                            </Typography>

                            <Button
                                variant="outlined"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                sx={{ borderRadius: 3, px: 4, py: 1, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                            >
                                Select Documents
                            </Button>
                        </Box>

                        {selectedFiles.length > 0 && (
                            <Card sx={{
                                borderRadius: 5,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                border: '1px solid',
                                borderColor: alpha(theme.palette.divider, 0.5)
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={700}>
                                                Staged Documents
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Review and initiate deployment
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={`${selectedFiles.length} Target Files`}
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: 700, borderRadius: 2 }}
                                        />
                                    </Stack>

                                    <List disablePadding>
                                        {selectedFiles.map((item, index) => (
                                            <Fade in={true} key={item.id} style={{ transitionDelay: `${index * 50}ms` }}>
                                                <ListItem
                                                    sx={{
                                                        px: 2,
                                                        py: 2,
                                                        mb: 1.5,
                                                        borderRadius: 4,
                                                        bgcolor: '#f8fafc',
                                                        border: '1px solid',
                                                        borderColor: item.status === 'error' ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                                                        '&:last-child': { mb: 0 }
                                                    }}
                                                    secondaryAction={
                                                        <IconButton
                                                            onClick={() => handleRemoveFile(item.id)}
                                                            disabled={loading || item.status === 'success'}
                                                            sx={{
                                                                color: 'text.secondary',
                                                                '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) }
                                                            }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemIcon sx={{ minWidth: 50 }}>
                                                        {item.status === 'uploading' ? (
                                                            <CircularProgress size={24} thickness={5} />
                                                        ) : item.status === 'success' ? (
                                                            <SuccessIcon color="success" />
                                                        ) : item.status === 'error' ? (
                                                            <ErrorIcon color="error" />
                                                        ) : (
                                                            <FileIcon color="action" />
                                                        )}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body2" fontWeight={700} sx={{ color: '#2d3748' }}>
                                                                {item.file.name}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                                                </Typography>
                                                                {item.message && (
                                                                    <>
                                                                        <Divider orientation="vertical" flexItem sx={{ height: 10, alignSelf: 'center' }} />
                                                                        <Typography variant="caption" color={item.status === 'error' ? 'error.main' : 'success.main'} fontWeight={700}>
                                                                            {item.message}
                                                                        </Typography>
                                                                    </>
                                                                )}
                                                            </Stack>
                                                        }
                                                    />
                                                </ListItem>
                                            </Fade>
                                        ))}
                                    </List>

                                    <Box sx={{ mt: 4 }}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            size="large"
                                            onClick={handleSubmit}
                                            disabled={loading || selectedFiles.every(f => f.status === 'success')}
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                                            sx={{
                                                py: 2,
                                                borderRadius: 4,
                                                fontSize: '1rem',
                                                fontWeight: 800,
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)',
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            {loading ? "Processing Queue..." : "Initiate Deployment"}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                        {error && (
                            <Alert
                                severity="error"
                                icon={<InfoIcon />}
                                sx={{ borderRadius: 4, fontWeight: 600 }}
                            >
                                {error}
                            </Alert>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Container>
    );
};
