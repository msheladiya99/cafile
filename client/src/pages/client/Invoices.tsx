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
} from '@mui/material';
import {
    Visibility as ViewIcon,
    FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { billingService } from '../../services/billingService';
import type { Invoice } from '../../services/billingService';

export const ClientInvoices: React.FC = () => {
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
            case 'PAID': return 'success';
            case 'PENDING': return 'warning';
            case 'PARTIAL': return 'info';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4, px: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>My Invoices</Typography>

            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Invoice #</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Paid</TableCell>
                                <TableCell>Balance</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.map((inv) => (
                                <TableRow key={inv._id}>
                                    <TableCell sx={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                                    <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                                    <TableCell>₹{inv.totalAmount}</TableCell>
                                    <TableCell color="success.main">₹{inv.paidAmount}</TableCell>
                                    <TableCell color="error.main">₹{inv.balanceAmount}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={inv.status}
                                            size="small"
                                            color={getStatusColor(inv.status) as 'success' | 'warning' | 'info' | 'error' | 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Invoice">
                                            <IconButton size="small"><ViewIcon /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download PDF">
                                            <IconButton size="small" onClick={async () => await generateInvoicePDF(inv)}><DownloadIcon /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};
