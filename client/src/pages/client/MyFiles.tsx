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
    Checkbox,
    IconButton,
    Button,
    Stack,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    Folder as FolderIcon,
    InsertDriveFile as DriveFileIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { fileService, type IFile } from '../../services/fileService';
import { billingService, type PaymentStatus } from '../../services/billingService';

export const MyFiles: React.FC = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState<IFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
    const [checkingPayment, setCheckingPayment] = useState(true);

    // Selection
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    // Bulk Download
    const [downloadingZip, setDownloadingZip] = useState(false);

    // Folder Navigation State
    const [currentPath, setCurrentPath] = useState<string[]>([]); // [] = root, ['GST'] = GST folder, ['GST', '2024'] = Year folder

    // Check payment status on mount
    React.useEffect(() => {
        const checkPaymentStatus = async () => {
            if (!user?.clientId) return;
            try {
                setCheckingPayment(true);
                const status = await billingService.getPaymentStatus(user.clientId);
                setPaymentStatus(status);
            } catch (err) {
                console.error('Failed to check payment status:', err);
                // If check fails, assume access is allowed (fail open)
                setPaymentStatus({
                    hasFileAccess: true,
                    totalInvoices: 0,
                    paidInvoices: 0,
                    pendingInvoices: 0,
                    overdueInvoices: 0,
                    totalOutstanding: 0,
                    overdueDetails: []
                });
            } finally {
                setCheckingPayment(false);
            }
        };
        checkPaymentStatus();
    }, [user]);

    // Load all files
    const loadFiles = React.useCallback(async () => {
        if (!user?.clientId) return;

        // Don't load files if payment check is still in progress
        if (checkingPayment) return;

        // Don't load files if access is restricted
        if (paymentStatus && !paymentStatus.hasFileAccess) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await fileService.getFiles(user.clientId, {});
            setFiles(data);
        } catch (err: unknown) {
            console.error('Failed to load files:', err);
            if (err && typeof err === 'object' && 'response' in err) {
                const error = err as { response?: { status?: number } };
                if (error.response?.status === 403) {
                    setError('File access restricted due to pending payments');
                } else {
                    setError('Failed to load files');
                }
            } else {
                setError('Failed to load files');
            }
        } finally {
            setLoading(false);
        }
    }, [user, checkingPayment, paymentStatus]);

    // Initial load
    React.useEffect(() => {
        const timer = setTimeout(() => {
            loadFiles();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadFiles]);

    const handleSelectOne = (fileId: string) => {
        setSelectedFileIds(prev =>
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const handleBulkDownload = async () => {
        try {
            setDownloadingZip(true);
            await fileService.downloadZip(selectedFileIds);
            setSelectedFileIds([]); // Clear selection after download
        } catch (err) {
            console.error('Download failed:', err);
            setError('Failed to download files. Please try again.');
        } finally {
            setDownloadingZip(false);
        }
    };

    // Filter files based on current path
    const getCurrentContent = () => {
        if (!files.length) return { folders: [], files: [] };

        // Root Level
        if (currentPath.length === 0) {
            return {
                folders: [
                    { name: 'Income Tax Returns (ITR)', id: 'ITR', count: files.filter(f => f.category === 'ITR').length, color: '#4caf50' },
                    { name: 'GST Returns', id: 'GST', count: files.filter(f => f.category === 'GST').length, color: '#2196f3' },
                    { name: 'Accounting', id: 'ACCOUNTING', count: files.filter(f => f.category === 'ACCOUNTING').length, color: '#ff9800' },
                    { name: 'User Documents', id: 'USER_DOCS', count: files.filter(f => f.category === 'USER_DOCS').length, color: '#9c27b0' }
                ],
                files: []
            };
        }

        const category = currentPath[0];
        const year = currentPath[1];
        const month = currentPath[2];
        const docType = currentPath[3];

        // Level 1: Category -> Show Years (except USER_DOCS which shows files directly)
        if (currentPath.length === 1) {
            const categoryFiles = files.filter(f => f.category === category);

            // USER_DOCS doesn't have year organization, show files directly
            if (category === 'USER_DOCS') {
                return { folders: [], files: categoryFiles };
            }

            // For other categories, show year folders
            const years = [...new Set(categoryFiles.map(f => f.year).filter(Boolean))].sort().reverse();
            return {
                folders: years.map(y => ({
                    name: `FY ${y}-${parseInt(y) + 1}`,
                    id: y,
                    count: categoryFiles.filter(f => f.year === y).length,
                    color: '#607d8b'
                })),
                files: []
            };
        }

        // Level 2: Year -> Show Months (GST only) or Files (ITR/Accounting/UserDocs)
        if (currentPath.length === 2) {
            const yearFiles = files.filter(f => f.category === category && f.year === year);

            // ITR, ACCOUNTING, and USER_DOCS show files directly without month organization
            if (category === 'ITR' || category === 'ACCOUNTING' || category === 'USER_DOCS') {
                return { folders: [], files: yearFiles };
            }

            // Only GST uses month-based organization
            const months = [...new Set(yearFiles.map(f => f.month || 'Other'))];
            // Sort months chronologically if possible, otherwise alphabetical
            const monthOrder = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'Other'];
            months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

            return {
                folders: months.map(m => ({
                    name: m,
                    id: m,
                    count: yearFiles.filter(f => (f.month || 'Other') === m).length,
                    color: '#9c27b0'
                })),
                files: []
            };
        }


        // Level 3: Month -> Show DocTypes (GST only)
        // Note: Accounting no longer reaches this level as it shows files at Level 2
        if (currentPath.length === 3) {
            const monthFiles = files.filter(f => f.category === category && f.year === year && (f.month || 'Other') === month);

            if (category === 'GST') {
                const docTypes = [...new Set(monthFiles.map(f => f.docType || 'Other'))];
                return {
                    folders: docTypes.map(d => ({
                        name: d,
                        id: d,
                        count: monthFiles.filter(f => (f.docType || 'Other') === d).length,
                        color: '#009688'
                    })),
                    files: []
                };
            }

            // Fallback (should not be reached for Accounting anymore)
            return { folders: [], files: monthFiles };
        }

        // Level 4: GST DocType -> Show Files
        if (currentPath.length === 4) {
            const finalFiles = files.filter(f =>
                f.category === category &&
                f.year === year &&
                (f.month || 'Other') === month &&
                (f.docType || 'Other') === docType
            );
            return { folders: [], files: finalFiles };
        }

        return { folders: [], files: [] };
    };

    const { folders, files: currentFiles } = getCurrentContent();
    const isRoot = currentPath.length === 0;

    const FolderCard = ({ folder }: { folder: { id: string; name: string; count: number; color: string } }) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={folder.id}>
            <Paper
                elevation={0}
                onClick={() => setCurrentPath([...currentPath, folder.id])}
                sx={{
                    p: 3,
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.06)',
                    background: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 20px 40px -10px ${folder.color}30`,
                        borderColor: folder.color,
                        '& .folder-icon-bg': {
                            transform: 'scale(1.1)',
                        }
                    },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                }}
            >
                {/* Decorative background element */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: `linear-gradient(135deg, ${folder.color}10 0%, transparent 100%)`,
                        borderRadius: '0 0 0 100%',
                        zIndex: 0
                    }}
                />

                <Box
                    className="folder-icon-bg"
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        bgcolor: `${folder.color}10`, // lighter opacity
                        color: folder.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.3s ease',
                        zIndex: 1
                    }}
                >
                    <FolderIcon sx={{ fontSize: 32 }} color="inherit" />
                </Box>

                <Box flex={1} zIndex={1}>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#2c3e50', mb: 0.5, letterSpacing: '-0.5px' }}>
                        {folder.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{
                            bgcolor: `${folder.color}15`,
                            color: folder.color,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 600
                        }}>
                            {folder.count} {folder.count === 1 ? 'File' : 'Files'}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ color: 'text.disabled' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Box>
            </Paper>
        </Grid>
    );

    // ... render return ... 
    // Need to reconstruct the return JSX to include breadcrumbs and the new view.

    return (
        <Box sx={{ px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 }, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
            {/* Header Section */}
            <Box mb={{ xs: 3, sm: 5 }} display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
                <Box>
                    <Typography
                        variant="h3"
                        fontWeight="800"
                        sx={{
                            background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                            letterSpacing: '-1px'
                        }}
                    >
                        My Documents
                    </Typography>

                    {/* Modern Breadcrumbs */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                        <Typography
                            variant="body2"
                            onClick={() => setCurrentPath([])}
                            sx={{
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                '&:hover': { color: 'primary.main' },
                                color: isRoot ? 'text.secondary' : 'text.disabled',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <Box component="span" sx={{ fontSize: 18 }}>🏠</Box> Home
                        </Typography>
                        {currentPath.map((path, index) => (
                            <React.Fragment key={path}>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '10px' }}>❯</Typography>
                                <Typography
                                    variant="body2"
                                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { color: 'primary.main', transform: 'translateY(-1px)' },
                                        fontWeight: index === currentPath.length - 1 ? 700 : 500,
                                        color: index === currentPath.length - 1 ? 'primary.main' : 'text.secondary',
                                        bgcolor: index === currentPath.length - 1 ? 'primary.50' : 'transparent',
                                        px: index === currentPath.length - 1 ? 1.5 : 0.5,
                                        py: index === currentPath.length - 1 ? 0.5 : 0,
                                        borderRadius: 2
                                    }}
                                >
                                    {path === 'ITR' ? 'Income Tax' : path === 'GST' ? 'GST Returns' : path === 'ACCOUNTING' ? 'Accounting' : path}
                                </Typography>
                            </React.Fragment>
                        ))}
                    </Stack>
                </Box>

                {selectedFileIds.length > 0 && (
                    <Button
                        variant="contained"
                        onClick={handleBulkDownload}
                        disabled={downloadingZip}
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1.2,
                            textTransform: 'none',
                            fontWeight: 600,
                            background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                            boxShadow: '0 8px 16px -4px #534bae60',
                            '&:hover': {
                                boxShadow: '0 12px 20px -4px #534bae80',
                            }
                        }}
                        startIcon={downloadingZip ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    >
                        Download Selection ({selectedFileIds.length})
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'error.main' }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Payment Checks */}
            {checkingPayment && (
                <Paper
                    elevation={0}
                    sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed #e0e0e0' }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography sx={{ mt: 3, color: 'text.secondary', fontWeight: 500 }}>Checking secure access...</Typography>
                </Paper>
            )}

            {!checkingPayment && paymentStatus && !paymentStatus.hasFileAccess && (
                <Alert severity="error" variant="filled" sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 16px -4px rgba(211, 47, 47, 0.4)' }}>
                    <Typography variant="subtitle2" fontWeight="700">Access Restricted</Typography>
                    Please clear pending dues of ₹{paymentStatus.totalOutstanding} to access your documents.
                </Alert>
            )}

            {/* Main Content Area */}
            {paymentStatus?.hasFileAccess && (
                <Box>
                    {loading && (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress size={40} thickness={4} />
                        </Box>
                    )}
                    {!loading && (
                        <>
                            {/* Folders Grid */}
                            {folders.length > 0 && (
                                <Grid container spacing={3} sx={{ mb: 5 }}>
                                    {folders.map(folder => <FolderCard folder={folder} key={folder.id} />)}
                                </Grid>
                            )}

                            {/* Files List */}
                            {currentFiles.length > 0 ? (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        border: '1px solid',
                                        borderColor: 'rgba(0,0,0,0.06)',
                                        boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
                                    }}>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell padding="checkbox" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                        <Checkbox
                                                            color="primary"
                                                            checked={selectedFileIds.length === currentFiles.length && currentFiles.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedFileIds(currentFiles.map(f => f._id));
                                                                else setSelectedFileIds([]);
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '1px solid #f1f5f9' }}>FILE NAME</TableCell>
                                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '1px solid #f1f5f9' }}>DATE</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', py: 2, borderBottom: '1px solid #f1f5f9' }}>ACTIONS</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {currentFiles.map((file) => (
                                                    <TableRow
                                                        key={file._id}
                                                        hover
                                                        selected={selectedFileIds.includes(file._id)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': { bgcolor: '#f1f5f9' },
                                                            '&.Mui-selected': { bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }
                                                        }}
                                                    >
                                                        <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <Checkbox
                                                                color="primary"
                                                                checked={selectedFileIds.includes(file._id)}
                                                                onChange={() => handleSelectOne(file._id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', py: 2.5 }}>
                                                            <Box display="flex" alignItems="center">
                                                                <Box
                                                                    sx={{
                                                                        mr: 2,
                                                                        p: 1.5,
                                                                        borderRadius: 2,
                                                                        bgcolor: file.originalFileName.toLowerCase().endsWith('.pdf') ? '#ffebee' : '#e3f2fd',
                                                                        color: file.originalFileName.toLowerCase().endsWith('.pdf') ? '#d32f2f' : '#1976d2',
                                                                        display: 'flex'
                                                                    }}
                                                                >
                                                                    <DriveFileIcon />
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#334155' }}>{file.fileName}</Typography>
                                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                                                                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.originalFileName.split('.').pop()?.toUpperCase()}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                                                            {new Date(file.uploadedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); window.open(file.driveWebViewLink, '_blank'); }}
                                                                    sx={{ color: '#64748b', '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' } }}
                                                                >
                                                                    <VisibilityIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => { e.stopPropagation(); fileService.downloadFile(file._id, file.fileName); }}
                                                                    sx={{ color: '#64748b', '&:hover': { color: '#0f172a', bgcolor: '#f1f5f9' } }}
                                                                >
                                                                    <DownloadIcon fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Paper>
                            ) : (
                                folders.length === 0 && (
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            textAlign: 'center',
                                            py: 12,
                                            borderRadius: 4,
                                            bgcolor: '#fff',
                                            border: '1px dashed #cbd5e1'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                mx: 'auto',
                                                borderRadius: '50%',
                                                bgcolor: '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 3
                                            }}
                                        >
                                            <FolderIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
                                        </Box>
                                        <Typography variant="h6" color="#334155" fontWeight="600" gutterBottom>No Item Found</Typography>
                                        <Typography variant="body2" color="#64748b">This folder appears to be empty.</Typography>
                                    </Paper>
                                )
                            )}
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
};
