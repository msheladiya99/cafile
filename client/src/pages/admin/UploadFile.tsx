import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    Alert,
    CircularProgress,
    Fade,
    Chip,
    Stack,
    Divider,
    IconButton,
    Autocomplete,
    TextField,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    CloudDone as CloudDoneIcon,
    InsertDriveFile as FileIcon,
    DeleteOutline as DeleteIcon,
    ErrorOutline as ErrorIcon,
    InfoOutlined as InfoIcon,
    FolderSpecial as FolderSpecialIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { CommonButton } from '../../components/common/UIComponents';
import type { Client } from '../../types';
import { AxiosError } from 'axios';

interface FileUploadItem {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    message?: string;
}

export const UploadFile: React.FC = () => {
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

        const BATCH_SIZE = 3;
        const filesToProcess = selectedFiles.map((file, index) => ({ file, index })).filter(({ file }) => file.status !== 'success');
        const updatedFiles = [...selectedFiles];

        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async ({ file: item, index }) => {
                updatedFiles[index] = { ...updatedFiles[index], status: 'uploading' };
                setSelectedFiles([...updatedFiles]);

                try {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    formData.append('clientId', selectedClient);
                    formData.append('category', category);

                    if (category !== 'USER_DOCS') {
                        formData.append('year', year);
                    }
                    if (category === 'GST') {
                        if (month) formData.append('month', month);
                        if (docType) formData.append('docType', docType);
                    }

                    formData.append('fileName', item.file.name);
                    formData.append('useGoogleDrive', 'true');

                    await adminService.uploadFile(formData);

                    updatedFiles[index] = { ...updatedFiles[index], status: 'success', message: 'Uploaded' };
                } catch (err: unknown) {
                    console.error('Upload Error:', err);
                    const message = err instanceof AxiosError
                        ? err.response?.data?.message || 'Failed'
                        : 'Failed';
                    updatedFiles[index] = { ...updatedFiles[index], status: 'error', message };
                }

                setSelectedFiles([...updatedFiles]);
            }));
        }

        setLoading(false);
    };

    const handleReset = () => {
        setSelectedFiles([]);
        setSelectedClient('');
        setYear(new Date().getFullYear().toString());
        setMonth('');
        setDocType('');
        setCategory('ITR');
        setError('');
    };

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

    const selectSx = {
        borderRadius: '8px',
        fontSize: '0.875rem',
        bgcolor: '#fff',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e5e7eb',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9ca3af',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#111827',
            borderWidth: '1.5px',
        },
    };

    return (
        <Box sx={{ width: '100%', px: { xs: 1.5, sm: 4, md: 8 }, py: { xs: 2, sm: 3 } }}>
        <Box
            sx={{
                width: '100%',
                maxWidth: 860,
                mx: 'auto',
                bgcolor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
            }}
        >
                {/* Card Header */}
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 4, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <FolderSpecialIcon sx={{ fontSize: 26, color: '#111' }} />
                        <Typography
                            sx={{
                                fontSize: { xs: '1.2rem', sm: '1.35rem' },
                                fontWeight: 800,
                                color: '#111',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Upload Files
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: '#888', ml: 0.5 }}>
                        Select a client and upload documents to their account.
                    </Typography>
                </Box>

                <Divider sx={{ mx: { xs: 3, sm: 4 } }} />

                {/* Card Body */}
                <Box sx={{ px: { xs: 3, sm: 4 }, pt: 3, pb: 4 }}>
                    <Stack spacing={3}>

                        {/* Drag & Drop Zone */}
                        <Box
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                border: '1.5px dashed',
                                borderColor: dragActive ? '#3b82f6' : '#d1d5db',
                                borderRadius: '10px',
                                bgcolor: dragActive ? 'rgba(59,130,246,0.04)' : '#fafafa',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 4,
                                px: 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: '#3b82f6',
                                    bgcolor: 'rgba(59,130,246,0.03)',
                                },
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Box
                                sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    bgcolor: '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mb: 1.5,
                                }}
                            >
                                <UploadIcon sx={{ fontSize: 22, color: '#555' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#222', mb: 0.4 }}>
                                {dragActive ? 'Release to add files' : 'Select a file or drag and drop here'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                                PDF, DOC, XLS, JPG — Max 25MB per file
                            </Typography>
                        </Box>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <Box
                                sx={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>
                                        Staged Files
                                    </Typography>
                                    <Chip
                                        label={`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                                        size="small"
                                        sx={{ bgcolor: '#e5e7eb', fontWeight: 600, fontSize: '0.75rem', color: '#374151' }}
                                    />
                                </Box>
                                <Divider />
                                <Stack divider={<Divider />}>
                                    {selectedFiles.map((item, index) => (
                                        <Fade in={true} key={item.id} style={{ transitionDelay: `${index * 40}ms` }}>
                                            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ flexShrink: 0 }}>
                                                    {item.status === 'uploading' ? (
                                                        <CircularProgress size={20} thickness={5} />
                                                    ) : item.status === 'success' ? (
                                                        <SuccessIcon sx={{ fontSize: 20, color: '#22c55e' }} />
                                                    ) : item.status === 'error' ? (
                                                        <ErrorIcon sx={{ fontSize: 20, color: '#ef4444' }} />
                                                    ) : (
                                                        <FileIcon sx={{ fontSize: 20, color: '#9ca3af' }} />
                                                    )}
                                                </Box>
                                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                    <Typography
                                                        noWrap
                                                        title={item.file.name}
                                                        sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}
                                                    >
                                                        {item.file.name}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                                        </Typography>
                                                        {item.message && (
                                                            <>
                                                                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: '#d1d5db' }} />
                                                                <Typography
                                                                    sx={{
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        color: item.status === 'error' ? '#ef4444' : '#22c55e',
                                                                    }}
                                                                >
                                                                    {item.message}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Box>
                                                </Box>
                                                <IconButton
                                                    onClick={() => handleRemoveFile(item.id)}
                                                    disabled={loading || item.status === 'success'}
                                                    size="small"
                                                    sx={{
                                                        color: '#9ca3af',
                                                        flexShrink: 0,
                                                        '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.06)' },
                                                    }}
                                                    aria-label="Remove file"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Fade>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        {/* Target Client */}
                        <Box>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
                                Target Client <span style={{ color: '#ef4444' }}>*</span>
                            </Typography>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={clients}
                                loading={loadingClients}
                                getOptionLabel={(option) => option.name || ''}
                                value={clients.find((c) => c._id === selectedClient) || null}
                                onChange={(event, newValue) => {
                                    setSelectedClient(newValue ? newValue._id : '');
                                }}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                renderOption={(props, option) => (
                                    <li {...props} key={option._id}>
                                        <Box>
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{option.name}</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>{option.email}</Typography>
                                        </Box>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select a client"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {loadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                bgcolor: '#fff',
                                                fontSize: '0.875rem',
                                                '& fieldset': { borderColor: '#e5e7eb' },
                                                '&:hover fieldset': { borderColor: '#9ca3af' },
                                                '&.Mui-focused fieldset': { borderColor: '#111827', borderWidth: '1.5px' },
                                            }
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Document Type + Financial Year row */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
                                    Document Type <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value as 'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS');
                                            if (e.target.value !== 'GST') {
                                                setMonth('');
                                                setDocType('');
                                            }
                                        }}
                                        sx={selectSx}
                                    >
                                        <MenuItem value="ITR">Income Tax Records</MenuItem>
                                        <MenuItem value="GST">GST Compliance</MenuItem>
                                        <MenuItem value="ACCOUNTING">Accounting & Audit</MenuItem>
                                        <MenuItem value="USER_DOCS">User Documents</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {category !== 'USER_DOCS' && (
                                <Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
                                        Financial Year
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            sx={selectSx}
                                        >
                                            {years.map((y) => (
                                                <MenuItem key={y} value={y}>FY {y}-{(parseInt(y) + 1).toString().slice(-2)}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </Box>

                        {/* GST-specific fields */}
                        {category === 'GST' && (
                            <Fade in={true}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
                                            Reporting Month
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                displayEmpty
                                                value={month}
                                                onChange={(e) => setMonth(e.target.value)}
                                                renderValue={(value) => value || <span style={{ color: '#9ca3af' }}>Select month</span>}
                                                sx={selectSx}
                                            >
                                                {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map((m) => (
                                                    <MenuItem key={m} value={m}>{m}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 0.75 }}>
                                            Returns Category
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                displayEmpty
                                                value={docType}
                                                onChange={(e) => setDocType(e.target.value)}
                                                renderValue={(value) => value || <span style={{ color: '#9ca3af' }}>Select type</span>}
                                                sx={selectSx}
                                            >
                                                {['GSTR-1', 'GSTR-2A', 'GSTR-2B', 'GSTR-3B', 'Challan', 'Other'].map((type) => (
                                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </Box>
                            </Fade>
                        )}

                        {/* Google Drive Badge */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.5,
                                borderRadius: '8px',
                                bgcolor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                            }}
                        >
                            <CloudDoneIcon sx={{ fontSize: 18, color: '#16a34a', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 500 }}>
                                <strong>Google Drive Integration Active</strong> — Files sync automatically to secure cloud storage.
                            </Typography>
                        </Box>

                        {/* Error */}
                        {error && (
                            <Alert
                                severity="error"
                                icon={<InfoIcon />}
                                sx={{ borderRadius: '8px', fontSize: '0.85rem' }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column-reverse', sm: 'row' },
                            justifyContent: 'flex-end', 
                            gap: 1.5 
                        }}>
                            <CommonButton
                                variant="outlined"
                                fullWidth={true} // isMobile check could be used but fullWidth works well with Box flex
                                onClick={handleReset}
                                disabled={loading}
                                sx={{
                                    borderRadius: '10px',
                                    px: 3,
                                    py: 1.2,
                                    fontSize: '0.875rem',
                                    color: '#475569',
                                    borderColor: '#e2e8f0',
                                    flex: { xs: 1, sm: 'initial' },
                                    '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                                }}
                            >
                                Cancel
                            </CommonButton>
                            <CommonButton
                                variant="contained"
                                fullWidth={true}
                                onClick={handleSubmit}
                                disabled={selectedFiles.every(f => f.status === 'success')}
                                loading={loading}
                                startIcon={<UploadIcon />}
                                sx={{ 
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderRadius: '10px',
                                    py: 1.2,
                                    flex: { xs: 1, sm: 'initial' }
                                }}
                            >
                                Upload Files
                            </CommonButton>
                        </Box>
                    </Stack>
                </Box>
        </Box>
        </Box>
    );
};





