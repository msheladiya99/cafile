import React, { useState, useEffect, useCallback, Fragment } from 'react';
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
    Folder as FolderIcon,
    InsertDriveFile as DriveFileIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    GridView as GridViewIcon,
    List as ListViewIcon
} from '@mui/icons-material';
import { AxiosError } from 'axios';
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

    // Navigation & UI State
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Check payment status on mount
    useEffect(() => {
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
    const loadFiles = useCallback(async () => {
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
            if (err instanceof AxiosError) {
                if (err.response?.status === 403) {
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
    useEffect(() => {
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
    
    // Filter by search query
    const filteredFiles = currentFiles.filter(f => 
        f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredFolders = folders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const FolderCard = ({ folder }: { folder: { id: string; name: string; count: number; color: string } }) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={folder.id}>
            <Box
                onClick={() => setCurrentPath([...currentPath, folder.id])}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    '&:hover': {
                        bgcolor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transform: 'translateY(-1px)'
                    }
                }}
            >
                <FolderIcon sx={{ fontSize: 40, color: '#64748b' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                        variant="body2" 
                        fontWeight="600" 
                        sx={{ 
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {folder.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        {folder.count} {folder.count === 1 ? 'item' : 'items'}
                    </Typography>
                </Box>
            </Box>
        </Grid>
    );

    const FileCard = ({ file }: { file: IFile }) => {
        const isSelected = selectedFileIds.includes(file._id);
        const isPdf = file.originalFileName.toLowerCase().endsWith('.pdf');

        return (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={file._id}>
                <Box
                    onClick={() => window.open(file.driveWebViewLink, '_blank')}
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        bgcolor: isSelected ? 'primary.50' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                        '&:hover': {
                            bgcolor: isSelected ? 'primary.50' : 'rgba(0,0,0,0.03)',
                            '& .file-checkbox': { opacity: 1 },
                            '& .file-preview': { transform: 'translateY(-2px)' }
                        }
                    }}
                >
                    <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            handleSelectOne(file._id);
                        }}
                        className="file-checkbox"
                        sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            left: 8, 
                            opacity: isSelected ? 1 : 0,
                            transition: 'opacity 0.2s',
                            zIndex: 2
                        }}
                    />

                    <Box
                        className="file-preview"
                        sx={{
                            width: '100%',
                            height: 100,
                            borderRadius: 2,
                            bgcolor: isPdf ? '#fdeded' : '#e3f2fd',
                            mb: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s',
                            border: '1px solid',
                            borderColor: isPdf ? '#fad2d2' : '#bbdefb'
                        }}
                    >
                        <DriveFileIcon sx={{ fontSize: 40, color: isPdf ? '#d32f2f' : '#1976d2' }} />
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: isPdf ? '#d32f2f' : '#1976d2', 
                                fontWeight: 800, 
                                mt: 0.5,
                                fontSize: '10px'
                            }}
                        >
                            {file.originalFileName.split('.').pop()?.toUpperCase()}
                        </Typography>
                    </Box>

                    <Typography 
                        variant="body2" 
                        fontWeight="500" 
                        sx={{ 
                            color: '#3c4043', 
                            mb: 0.5,
                            width: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.2,
                            minHeight: '2.4em'
                        }}
                    >
                        {file.fileName}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={0.5} sx={{ color: '#70757a' }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {(file.fileSize / 1024).toFixed(0)} KB
                        </Typography>
                        <Typography variant="caption">•</Typography>
                        <IconButton 
                            size="small" 
                            onClick={(e) => {
                                e.stopPropagation();
                                fileService.downloadFile(file._id, file.fileName);
                            }}
                            sx={{ p: 0.5 }}
                        >
                            <DownloadIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Box>
            </Grid>
        );
    };

    // ... render return ... 
    // Need to reconstruct the return JSX to include breadcrumbs and the new view.

    return (
        <Box sx={{
            px: { xs: 0, sm: 4 },
            py: { xs: 0, sm: 5 },
            minHeight: '100vh',
            bgcolor: '#f8f9fa'
        }}>
            {/* Main Container */}
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* Header & Toolbar */}
                <Box mb={4} sx={{ px: { xs: 2, sm: 0 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography
                            variant="h4"
                            fontWeight="800"
                            sx={{
                                color: '#1e293b',
                                letterSpacing: '-1px'
                            }}
                        >
                            Documents
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            {selectedFileIds.length > 0 && (
                                <Button
                                    variant="contained"
                                    onClick={handleBulkDownload}
                                    disabled={downloadingZip}
                                    startIcon={downloadingZip ? <CircularProgress size={18} /> : <DownloadIcon />}
                                    sx={{ 
                                        borderRadius: 2, 
                                        textTransform: 'none', 
                                        bgcolor: '#1e293b',
                                        '&:hover': { bgcolor: '#0f172a' }
                                    }}
                                >
                                    Download ({selectedFileIds.length})
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    {/* Navigation Bar */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: '#fff',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap'
                        }}
                    >
                        {/* Breadcrumbs */}
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto' }}>
                            <IconButton 
                                size="small" 
                                onClick={() => currentPath.length > 0 && setCurrentPath(currentPath.slice(0, -1))}
                                disabled={currentPath.length === 0}
                            >
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 'fit-content' }}>
                                <Typography
                                    variant="body2"
                                    onClick={() => setCurrentPath([])}
                                    sx={{
                                        cursor: 'pointer',
                                        fontWeight: currentPath.length === 0 ? 700 : 500,
                                        color: currentPath.length === 0 ? 'primary.main' : 'text.secondary',
                                        '&:hover': { color: 'primary.main' },
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        bgcolor: currentPath.length === 0 ? 'primary.50' : 'transparent'
                                    }}
                                >
                                    Home
                                </Typography>
                                {currentPath.map((path, index) => (
                                    <Fragment key={path}>
                                        <Typography variant="caption" color="text.disabled">❯</Typography>
                                        <Typography
                                            variant="body2"
                                            onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                                            sx={{
                                                cursor: 'pointer',
                                                fontWeight: index === currentPath.length - 1 ? 700 : 500,
                                                color: index === currentPath.length - 1 ? 'primary.main' : 'text.secondary',
                                                '&:hover': { color: 'primary.main' },
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: index === currentPath.length - 1 ? 'primary.50' : 'transparent',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {path === 'ITR' ? 'Income Tax' : path === 'GST' ? 'GST' : path}
                                        </Typography>
                                    </Fragment>
                                ))}
                            </Stack>
                        </Box>

                        {/* Search & View Controls */}
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    bgcolor: '#f1f3f4', 
                                    borderRadius: 2, 
                                    px: 1.5,
                                    width: { xs: '100%', sm: 200, md: 300 }
                                }}
                            >
                                <SearchIcon sx={{ color: '#5f6368', fontSize: 20, mr: 1 }} />
                                <input 
                                    placeholder="Search in folder..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        padding: '8px 0',
                                        outline: 'none',
                                        width: '100%',
                                        fontSize: '14px'
                                    }}
                                />
                            </Box>

                            <IconButton 
                                onClick={() => setViewMode('grid')} 
                                color={viewMode === 'grid' ? 'primary' : 'default'}
                                sx={{ bgcolor: viewMode === 'grid' ? 'primary.50' : 'transparent' }}
                            >
                                <GridViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                                onClick={() => setViewMode('list')} 
                                color={viewMode === 'list' ? 'primary' : 'default'}
                                sx={{ bgcolor: viewMode === 'list' ? 'primary.50' : 'transparent' }}
                            >
                                <ListViewIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Paper>
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
                <Box sx={{ px: { xs: 2, sm: 0 } }}>
                    {loading && (
                        <Box display="flex" justifyContent="center" py={12}>
                            <CircularProgress size={40} thickness={4} sx={{ color: '#64748b' }} />
                        </Box>
                    )}
                    
                    {!loading && (
                        <>
                            {viewMode === 'grid' ? (
                                <Box>
                                    {/* Folders Section */}
                                    {filteredFolders.length > 0 && (
                                        <Box mb={4}>
                                            <Typography variant="overline" sx={{ color: '#5f6368', fontWeight: 700, mb: 2, display: 'block' }}>Folders</Typography>
                                            <Grid container spacing={2}>
                                                {filteredFolders.map(folder => <FolderCard folder={folder} key={folder.id} />)}
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* Files Section */}
                                    {filteredFiles.length > 0 && (
                                        <Box>
                                            <Typography variant="overline" sx={{ color: '#5f6368', fontWeight: 700, mb: 2, display: 'block' }}>Files</Typography>
                                            <Grid container spacing={2}>
                                                {filteredFiles.map(file => <FileCard file={file} key={file._id} />)}
                                            </Grid>
                                        </Box>
                                    )}

                                    {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                                        <Paper elevation={0} sx={{ textAlign: 'center', py: 12, borderRadius: 4, bgcolor: '#fff', border: '1px dashed #cbd5e1' }}>
                                            <FolderIcon sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
                                            <Typography variant="h6" color="#334155" fontWeight="600">No items found</Typography>
                                            <Typography variant="body2" color="#64748b">Try searching for something else or navigate to a different folder.</Typography>
                                        </Paper>
                                    )}
                                </Box>
                            ) : (
                                /* List View (Table) */
                                <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            checked={selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedFileIds(filteredFiles.map(f => f._id));
                                                                else setSelectedFileIds([]);
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {/* List folders in table if needed, or just files */}
                                                {filteredFolders.map(folder => (
                                                    <TableRow key={folder.id} hover onClick={() => setCurrentPath([...currentPath, folder.id])} sx={{ cursor: 'pointer' }}>
                                                        <TableCell />
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={2}>
                                                                <FolderIcon sx={{ color: folder.color || '#fbbc04' }} />
                                                                <Typography variant="body2" fontWeight="600">{folder.name}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>--</TableCell>
                                                        <TableCell>{folder.count} items</TableCell>
                                                        <TableCell align="right">
                                                            <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {filteredFiles.map(file => (
                                                    <TableRow key={file._id} hover selected={selectedFileIds.includes(file._id)}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                size="small"
                                                                checked={selectedFileIds.includes(file._id)}
                                                                onChange={() => handleSelectOne(file._id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={() => window.open(file.driveWebViewLink, '_blank')} sx={{ cursor: 'pointer' }}>
                                                            <Box display="flex" alignItems="center" gap={2}>
                                                                <DriveFileIcon sx={{ color: file.originalFileName.toLowerCase().endsWith('.pdf') ? '#d32f2f' : '#1976d2' }} />
                                                                <Typography variant="body2" fontWeight="500">{file.fileName}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                                            {new Date(file.uploadedAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                                            {(file.fileSize / 1024).toFixed(0)} KB
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <IconButton size="small" onClick={() => fileService.downloadFile(file._id, file.fileName)}>
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
                            )}
                        </>
                    )}
                </Box>
            )}
            </Box>
        </Box>
    );
};
