import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Grid,
    useMediaQuery,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as VisibilityIcon,
    Folder as FolderIcon,
    InsertDriveFile as DriveFileIcon,
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
    MoreVert as MoreVertIcon,
    SwapVert as SortIcon
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import { format, isToday, isThisMonth, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { fileService, type IFile } from '../../services/fileService';
import { billingService, type PaymentStatus } from '../../services/billingService';

export const MyFiles: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    const [headerMenuAnchor, setHeaderMenuAnchor] = useState<null | HTMLElement>(null);

    const handleHeaderMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setHeaderMenuAnchor(event.currentTarget);
    };

    const handleHeaderMenuClose = () => {
        setHeaderMenuAnchor(null);
    };

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

    // Helper to group files by date
    const groupFilesByDate = (filesToGroup: IFile[]) => {
        const groups: { [key: string]: IFile[] } = {
            'Today': [],
            'This month': [],
            'Earlier': []
        };

        filesToGroup.forEach(file => {
            const date = parseISO(file.uploadedAt);
            if (isToday(date)) {
                groups['Today'].push(file);
            } else if (isThisMonth(date)) {
                groups['This month'].push(file);
            } else {
                groups['Earlier'].push(file);
            }
        });

        return groups;
    };

    const groupedFiles = groupFilesByDate(currentFiles);

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
        <Box sx={{
            px: { xs: 0, sm: 4 },
            py: { xs: 0, sm: 5 },
            minHeight: '100vh',
            bgcolor: isMobile ? '#fff' : '#f8f9fa'
        }}>
            {/* Header Section */}
            {!isMobile ? (
                <Box mb={5} display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={2}>
                    <Box sx={{ width: 'auto' }}>
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
                        <Box sx={{ overflowX: 'auto', width: '100%', pb: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, minWidth: 'fit-content' }}>
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
                                        gap: 0.5,
                                        whiteSpace: 'nowrap'
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
                                                borderRadius: 2,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {path === 'ITR' ? 'Income Tax' : path === 'GST' ? 'GST Returns' : path === 'ACCOUNTING' ? 'Accounting' : path}
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Stack>
                        </Box>
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
            ) : (
                /* Mobile Header (Screenshot Style) */
                <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #f1f3f4' }}>
                    {/* Row 1: Main Title */}
                    <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="500" sx={{ color: '#202124', letterSpacing: '-0.5px' }}>
                            {currentPath.length > 0 ? (currentPath[currentPath.length - 1] === 'ITR' ? 'Income Tax' : currentPath[currentPath.length - 1] === 'GST' ? 'GST Returns' : currentPath[currentPath.length - 1]) : 'Documents'}
                        </Typography>
                    </Box>

                    {/* Row 2: Actions Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 1, height: 56 }}>
                        <IconButton
                            onClick={() => {
                                if (currentPath.length > 0) {
                                    setCurrentPath(prev => prev.slice(0, -1));
                                } else {
                                    navigate('/client/dashboard');
                                }
                            }}
                            sx={{ color: '#5f6368' }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Box sx={{ flex: 1 }} />
                        <IconButton sx={{ color: '#5f6368' }}>
                            <SearchIcon />
                        </IconButton>
                        <IconButton sx={{ color: '#5f6368' }}>
                            <SortIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleHeaderMenuOpen}
                            sx={{ color: selectedFileIds.length > 0 ? 'primary.main' : '#5f6368' }}
                        >
                            <MoreVertIcon />
                        </IconButton>

                        <Menu
                            anchorEl={headerMenuAnchor}
                            open={Boolean(headerMenuAnchor)}
                            onClose={handleHeaderMenuClose}
                            PaperProps={{
                                sx: { borderRadius: 2, minWidth: 180, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
                            }}
                        >
                            <MenuItem
                                onClick={() => { handleBulkDownload(); handleHeaderMenuClose(); }}
                                disabled={selectedFileIds.length === 0 || downloadingZip}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon>
                                    {downloadingZip ? <CircularProgress size={20} /> : <DownloadIcon fontSize="small" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={`Download ${selectedFileIds.length > 0 ? `(${selectedFileIds.length})` : 'Selection'}`}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                />
                            </MenuItem>
                        </Menu>
                    </Box>

                    {/* Row 3: Path & Info Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, gap: 1 }}>
                        <Box sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            border: '1.5px solid #dadce0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FolderIcon sx={{ color: '#9aa0a6', fontSize: 20 }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#80868b', fontSize: '1.1rem', mx: 0.5 }}>▶</Typography>
                        <Typography variant="body1" sx={{ color: '#1967d2', fontWeight: 500, flex: 1 }}>
                            {currentPath.length > 0 ? currentPath[currentPath.length - 1] : 'Documents'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                            {currentFiles.length + folders.length} items
                        </Typography>
                    </Box>
                </Box>
            )}

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
                            {/* Folders List - Styled for mobile list view */}
                            {folders.length > 0 && (
                                isMobile ? (
                                    <Box sx={{ mb: 2 }}>
                                        <Stack>
                                            {folders.map((folder) => (
                                                <Box
                                                    key={folder.id}
                                                    onClick={() => setCurrentPath([...currentPath, folder.id])}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        px: 2,
                                                        py: 1.5,
                                                        gap: 2,
                                                        cursor: 'pointer',
                                                        '&:active': { bgcolor: '#f1f3f4' }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 1,
                                                            bgcolor: '#e8f0fe',
                                                            color: '#5f6368',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <FolderIcon sx={{ color: '#9aa0a6' }} />
                                                    </Box>
                                                    <Box flex={1} sx={{ overflow: 'hidden' }}>
                                                        <Typography variant="body1" fontWeight="500" sx={{ color: '#202124', mb: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {folder.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#70757a' }}>
                                                            Folder • {folder.count} items
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right', minWidth: 60 }}>
                                                        <Typography variant="caption" sx={{ color: '#70757a', fontWeight: 500 }}>
                                                            {folder.count} items
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                ) : (
                                    <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 5 }}>
                                        {folders.map(folder => <FolderCard folder={folder} key={folder.id} />)}
                                    </Grid>
                                )
                            )}

                            {/* Files List / Card View for Mobile */}
                            {currentFiles.length > 0 ? (
                                isMobile ? (
                                    <Box sx={{ pt: 1 }}>
                                        {['Today', 'This month', 'Earlier'].map(group => (
                                            groupedFiles[group].length > 0 && (
                                                <Box key={group} sx={{ mb: 1 }}>
                                                    <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ color: '#5f6368', fontWeight: 500, mr: 1.5 }}>
                                                            {group}
                                                        </Typography>
                                                        <Box sx={{ flex: 1, height: '1.5px', borderTop: '1px dotted #dadce0' }} />
                                                    </Box>
                                                    <Stack>
                                                        {groupedFiles[group].map((file) => (
                                                            <Box
                                                                key={file._id}
                                                                onClick={() => window.open(file.driveWebViewLink, '_blank')}
                                                                onContextMenu={(e) => {
                                                                    e.preventDefault();
                                                                    handleSelectOne(file._id);
                                                                }}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    px: 2,
                                                                    py: 2,
                                                                    gap: 2,
                                                                    cursor: 'pointer',
                                                                    bgcolor: selectedFileIds.includes(file._id) ? '#e8f0fe' : 'transparent',
                                                                    '&:active': { bgcolor: '#f1f3f4' }
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        width: 52,
                                                                        height: 52,
                                                                        borderRadius: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        overflow: 'hidden'
                                                                    }}
                                                                >
                                                                    {file.originalFileName.toLowerCase().endsWith('.pdf') ? (
                                                                        <Box sx={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            bgcolor: '#fcedea',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            border: '1px solid #f8d7da'
                                                                        }}>
                                                                            <DriveFileIcon sx={{ color: '#d93025', fontSize: 24 }} />
                                                                            <Typography sx={{ color: '#d93025', fontSize: '8px', fontWeight: 700 }}>PDF</Typography>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            bgcolor: '#e8f0fe',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            border: '1px solid #d2e3fc'
                                                                        }}>
                                                                            <DriveFileIcon sx={{ color: '#1a73e8', fontSize: 24 }} />
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                                <Box flex={1} sx={{ overflow: 'hidden' }}>
                                                                    <Typography variant="body1" fontWeight="500" sx={{ color: '#202124', mb: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {file.fileName}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: '#70757a', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                                        <span style={{ color: '#70757a' }}>Drive</span>
                                                                        <span style={{ fontSize: '4px' }}>●</span>
                                                                        <span>{format(parseISO(file.uploadedAt), 'd MMM h:mm a')}</span>
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ color: '#70757a', fontWeight: 500, display: 'block' }}>
                                                                            {(file.fileSize / 1024).toFixed(2)} KB
                                                                        </Typography>
                                                                    </Box>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            fileService.downloadFile(file._id, file.fileName);
                                                                        }}
                                                                        sx={{ color: '#5f6368' }}
                                                                    >
                                                                        <DownloadIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )
                                        ))}
                                    </Box>
                                ) : (
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
                                )
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
