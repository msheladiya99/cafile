import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Chip,
    Alert,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    Description as FileIcon,
} from '@mui/icons-material';
import { adminService } from '../services/adminService';

interface BulkUploadProps {
    open: boolean;
    onClose: () => void;
    clientId: string;
    year: string;
    onUploadComplete: () => void;
}

interface FileUploadStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
    category: string;
    error?: string;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({
    open,
    onClose,
    clientId,
    year,
    onUploadComplete,
}) => {
    const [files, setFiles] = useState<FileUploadStatus[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Auto-detect category from filename
    const detectCategory = (filename: string): string => {
        const lower = filename.toLowerCase();
        if (lower.includes('itr') || lower.includes('income') || lower.includes('tax return')) {
            return 'ITR';
        } else if (lower.includes('gst') || lower.includes('goods') || lower.includes('service tax')) {
            return 'GST';
        } else if (lower.includes('account') || lower.includes('balance') || lower.includes('ledger')) {
            return 'ACCOUNTING';
        }
        return 'ITR'; // Default
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
    };

    const addFiles = (newFiles: File[]) => {
        const fileStatuses: FileUploadStatus[] = newFiles.map(file => ({
            file,
            status: 'pending',
            progress: 0,
            category: detectCategory(file.name),
        }));
        setFiles(prev => [...prev, ...fileStatuses]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateFileCategory = (index: number, category: string) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, category } : f));
    };

    const uploadFiles = async () => {
        if (!clientId || !year) {
            alert('Please select a client and year first');
            return;
        }

        setIsUploading(true);

        for (let i = 0; i < files.length; i++) {
            const fileStatus = files[i];

            if (fileStatus.status === 'success') continue;

            try {
                // Update status to uploading
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'uploading', progress: 0 } : f
                ));

                // Create form data
                const formData = new FormData();
                formData.append('file', fileStatus.file);
                formData.append('clientId', clientId);
                formData.append('year', year);
                formData.append('category', fileStatus.category);
                formData.append('fileName', fileStatus.file.name);

                // Simulate progress (since we can't track real upload progress easily)
                const progressInterval = setInterval(() => {
                    setFiles(prev => prev.map((f, idx) =>
                        idx === i && f.progress < 90
                            ? { ...f, progress: f.progress + 10 }
                            : f
                    ));
                }, 100);

                // Upload file
                await adminService.uploadFile(formData);

                clearInterval(progressInterval);

                // Mark as success
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? { ...f, status: 'success', progress: 100 } : f
                ));

            } catch (error: any) {
                // Mark as error
                setFiles(prev => prev.map((f, idx) =>
                    idx === i ? {
                        ...f,
                        status: 'error',
                        progress: 0,
                        error: error.response?.data?.message || 'Upload failed'
                    } : f
                ));
            }
        }

        setIsUploading(false);
        onUploadComplete();
    };

    const handleClose = () => {
        if (!isUploading) {
            setFiles([]);
            onClose();
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'ITR': return 'primary';
            case 'GST': return 'success';
            case 'ACCOUNTING': return 'warning';
            default: return 'default';
        }
    };

    const allSuccess = files.length > 0 && files.every(f => f.status === 'success');
    const hasErrors = files.some(f => f.status === 'error');

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6" component="div">
                    📦 Bulk File Upload
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: 'white' }} disabled={isUploading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {/* Drag & Drop Area */}
                <Box
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragging ? '#667eea' : '#ccc',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: isDragging ? '#f0f0ff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        mb: 3,
                    }}
                    onClick={() => document.getElementById('bulk-file-input')?.click()}
                >
                    <UploadIcon sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Drag & Drop Files Here
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        or click to browse
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Supports PDF, Excel, Word files
                    </Typography>
                    <input
                        id="bulk-file-input"
                        type="file"
                        multiple
                        accept=".pdf,.xlsx,.xls,.docx,.doc"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                </Box>

                {/* Info Alert */}
                {files.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Auto-categorization:</strong> Files are automatically categorized based on their names.
                        You can change the category by clicking on it.
                    </Alert>
                )}

                {/* Files List */}
                {files.length > 0 && (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {files.map((fileStatus, index) => (
                            <ListItem
                                key={index}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    mb: 1,
                                    backgroundColor:
                                        fileStatus.status === 'success' ? '#f0fff0' :
                                            fileStatus.status === 'error' ? '#fff0f0' :
                                                'white',
                                }}
                            >
                                <ListItemIcon>
                                    {fileStatus.status === 'success' ? (
                                        <SuccessIcon color="success" />
                                    ) : fileStatus.status === 'error' ? (
                                        <ErrorIcon color="error" />
                                    ) : (
                                        <FileIcon color="action" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                {fileStatus.file.name}
                                            </Typography>
                                            <Chip
                                                label={fileStatus.category}
                                                color={getCategoryColor(fileStatus.category)}
                                                size="small"
                                                onClick={() => {
                                                    const categories = ['ITR', 'GST', 'ACCOUNTING'];
                                                    const currentIndex = categories.indexOf(fileStatus.category);
                                                    const nextCategory = categories[(currentIndex + 1) % categories.length];
                                                    updateFileCategory(index, nextCategory);
                                                }}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            {fileStatus.status === 'uploading' && (
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={fileStatus.progress}
                                                    sx={{ mt: 1 }}
                                                />
                                            )}
                                            {fileStatus.status === 'error' && (
                                                <Typography variant="caption" color="error">
                                                    {fileStatus.error}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                                {fileStatus.status === 'pending' && (
                                    <IconButton
                                        edge="end"
                                        onClick={() => removeFile(index)}
                                        size="small"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}

                {/* Success/Error Summary */}
                {allSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        All files uploaded successfully! 🎉
                    </Alert>
                )}
                {hasErrors && !isUploading && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Some files failed to upload. You can retry or remove them.
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={handleClose} disabled={isUploading}>
                    {allSuccess ? 'Close' : 'Cancel'}
                </Button>
                <Button
                    variant="contained"
                    onClick={uploadFiles}
                    disabled={files.length === 0 || isUploading || allSuccess}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                    }}
                >
                    {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
