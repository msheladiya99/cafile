import React, { useState, useEffect } from 'react';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Tooltip,
    useMediaQuery,
    useTheme,
    Stack,
    Divider,
    Button,
    Grid
} from '@mui/material';
import {
    FileDownload as DownloadIcon,
    ReceiptLong as InvoiceIcon
} from '@mui/icons-material';
import { billingService } from '../../services/billingService';
import type { Invoice } from '../../services/billingService';
import { format, parseISO } from 'date-fns';

export const ClientInvoices: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const data = await billingService.getInvoices();
                setInvoices(data);
            } catch (error) {
                console.error('Error loading invoices:', error);
            } finally {
                setLoading(false);
            }
        };
        loadInvoices();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return { color: '#2e7d32', bg: '#e8f5e9' };
            case 'PENDING': return { color: '#ed6c02', bg: '#fff3e0' };
            case 'PARTIAL': return { color: '#0288d1', bg: '#e1f5fe' };
            case 'CANCELLED': return { color: '#d32f2f', bg: '#ffebee' };
            default: return { color: '#757575', bg: '#f5f5f5' };
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress size={40} thickness={4} sx={{ color: '#1a237e' }} />
        </Box>
    );

    return (
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 8 }}>
            {!isMobile ? (
                <Container maxWidth="lg" sx={{ pt: 5 }}>
                    <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight="800"
                                sx={{
                                    background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                    letterSpacing: '-1px'
                                }}
                            >
                                My Invoices
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight="500">
                                View and download your service invoices
                            </Typography>
                        </Box>
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                    >
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2.5 }}>INVOICE #</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DATE</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DUE DATE</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>TOTAL</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>BALANCE</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>ACTIONS</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow
                                            key={inv._id}
                                            hover
                                            sx={{ '&:hover': { bgcolor: '#f8fafc' }, transition: 'background-color 0.2s' }}
                                        >
                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{inv.invoiceNumber}</TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{format(parseISO(inv.issueDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell sx={{ color: '#64748b' }}>{format(parseISO(inv.dueDate), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>₹{inv.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: inv.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>
                                                ₹{inv.balanceAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={inv.status}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        color: getStatusColor(inv.status).color,
                                                        bgcolor: getStatusColor(inv.status).bg,
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Download PDF">
                                                    <IconButton
                                                        onClick={() => generateInvoicePDF(inv)}
                                                        sx={{ color: '#64748b', '&:hover': { color: '#1a237e', bgcolor: '#e8eaf6' } }}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Container>
            ) : (
                /* Mobile View */
                <Box>
                    <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #f1f3f4', mb: 2 }}>
                        <Box sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="500" sx={{ color: '#202124', letterSpacing: '-0.5px' }}>
                                Invoices
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1.5 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                border: '1.5px solid #dadce0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: '#f8fafc'
                            }}>
                                <InvoiceIcon sx={{ color: '#5f6368', fontSize: 24 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>
                                    Billing Records
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#5f6368', fontWeight: 500 }}>
                                    {invoices.length} invoices found
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Stack spacing={2} sx={{ px: 2 }}>
                        {invoices.map((inv) => (
                            <Paper
                                key={inv._id}
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    border: '1px solid #e2e8f0',
                                    boxShadow: 'none',
                                    '&:active': { bgcolor: '#f8fafc' }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>
                                            INVOICE NUMBER
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {inv.invoiceNumber}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={inv.status}
                                        size="small"
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            color: getStatusColor(inv.status).color,
                                            bgcolor: getStatusColor(inv.status).bg,
                                            borderRadius: '6px',
                                            px: 0.5,
                                            ml: 1
                                        }}
                                    />
                                </Box>

                                <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                            DATE
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                                            {format(parseISO(inv.issueDate), 'dd MMM yyyy')}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                            DUE DATE
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                                            {format(parseISO(inv.dueDate), 'dd MMM yyyy')}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                            TOTAL
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 700 }}>
                                            ₹{inv.totalAmount.toLocaleString()}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600, display: 'block' }}>
                                            BALANCE
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#ef4444', fontWeight: 700 }}>
                                            ₹{inv.balanceAmount.toLocaleString()}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => generateInvoicePDF(inv)}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        py: 1,
                                        color: '#1a237e',
                                        borderColor: '#e2e8f0',
                                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                                    }}
                                >
                                    Download PDF
                                </Button>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}

            {invoices.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <InvoiceIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No invoices found</Typography>
                </Box>
            )}
        </Box>
    );
};
