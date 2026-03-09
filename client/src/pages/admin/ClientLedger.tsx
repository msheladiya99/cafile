import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    Button,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    CircularProgress,
    Stack,
    Divider,
    Paper,
    alpha,
    useTheme,
    Select
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
    Receipt as ReceiptIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    FormatListBulleted as FormatListBulletedIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { billingService } from '../../services/billingService';
import type { Client, User } from '../../types';
import { adminService } from '../../services/adminService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow } from '../../components/common/UIComponents';

interface ClientLedgerRecord {
    client: Client;
    summary: {
        totalBilled: number;
        totalPaid: number;
        totalDue: number;
        totalOverdue: number;
        totalInvoices: number;
        paidInvoices: number;
        pendingInvoices: number;
        overdueInvoices: number;
        paymentRate: number | string;
        avgPaymentDays?: number | string;
    };
    ledgerEntries: {
        date: string;
        type: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
        status?: string;
        dueDate?: string;
    }[];
}



const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    PAID: 'success',
    PARTIAL: 'warning',
    PENDING: 'default',
    CANCELLED: 'error',
};

export const ClientLedger: React.FC = () => {
    const theme = useTheme();
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Fetch clients
    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients,
    });

    // Fetch staff users
    const { data: staffMembers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers,
    });

    // Fetch client ledger
    const { data: ledgerData, isLoading, error } = useQuery({
        queryKey: ['clientLedger', selectedClient, selectedStaff, startDate, endDate],
        queryFn: () => billingService.getClientLedger({
            clientId: selectedClient || undefined,
            staffId: selectedStaff || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        }),
    });

    const handleExport = () => {
        if (!ledgerData?.clientLedgers) return;

        let csv = 'Client Name,Total Billed,Total Paid,Total Due,Total Overdue,Invoices,Paid,Pending,Overdue,Payment Rate %\n';

        ledgerData.clientLedgers.forEach((cl: ClientLedgerRecord) => {
            csv += `${cl.client.name},${cl.summary.totalBilled},${cl.summary.totalPaid},${cl.summary.totalDue},${cl.summary.totalOverdue},${cl.summary.totalInvoices},${cl.summary.paidInvoices},${cl.summary.pendingInvoices},${cl.summary.overdueInvoices},${cl.summary.paymentRate}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-ledger-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <PageContainer>
            {/* Header Section */}
            <PageHeader
                title="Client Ledger"
                actions={
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={!ledgerData?.clientLedgers?.length}
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}
                    >
                        Export CSV
                    </Button>
                }
            />

            <ContentContainer>

                {/* Filters Section */}
                <Section title="Filter Options" icon={<FilterListIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 4 } }}>
                        {/* Left Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Staff Member" inputId="staff-select">
                                <Select
                                    id="staff-select"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: selectedStaff ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Staff Member' }}
                                >
                                    <MenuItem value="">Choose a Staff...</MenuItem>
                                    {staffMembers.map(staff => (
                                        <MenuItem key={staff._id} value={staff._id}>{staff.name || staff.username}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Client Name" inputId="client-select">
                                <Select
                                    id="client-select"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    sx={{ borderRadius: 1.5, color: selectedClient ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Client Name' }}
                                >
                                    <MenuItem value="">Choose a Client...</MenuItem>
                                    {clients.map(client => (
                                        <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Period">
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ 'aria-label': 'Start Date' }}
                                    />
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ 'aria-label': 'End Date' }}
                                    />
                                </Box>
                            </FilterRow>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setSelectedStaff('');
                                        setSelectedClient('');
                                        setStartDate('');
                                        setEndDate('');
                                    }}
                                    startIcon={<ClearIcon />}
                                    sx={{ color: 'error.main', textTransform: 'none', fontWeight: 600 }}
                                    aria-label="Clear all filters"
                                >
                                    Clear Filters
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Section>

                {/* Ledger Insights */}
                <Section title="Ledger Insights" icon={<FormatListBulletedIcon />}>
                    {/* Loading State */}
                    {isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={30} />
                        </Box>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to load client ledger. Please try again.
                        </Alert>
                    )}

                    {!isLoading && ledgerData?.clientLedgers && (
                        <>
                            {/* Summary Cards */}
                            {ledgerData.overallSummary && (
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        {
                                            icon: PersonIcon,
                                            value: ledgerData.overallSummary.totalClients,
                                            label: 'Clients',
                                            color: '#667eea',
                                            bgColor: alpha('#667eea', 0.1),
                                        },
                                        {
                                            icon: ReceiptIcon,
                                            value: formatCurrency(ledgerData.overallSummary.totalBilled),
                                            label: 'Billed',
                                            color: '#f093fb',
                                            bgColor: alpha('#f093fb', 0.1),
                                        },
                                        {
                                            icon: CheckCircleIcon,
                                            value: formatCurrency(ledgerData.overallSummary.totalPaid),
                                            label: 'Paid',
                                            color: '#10b981',
                                            bgColor: alpha('#10b981', 0.1),
                                        },
                                        {
                                            icon: WarningIcon,
                                            value: formatCurrency(ledgerData.overallSummary.totalDue),
                                            label: 'Due',
                                            color: '#f59e0b',
                                            bgColor: alpha('#f59e0b', 0.1),
                                        },
                                    ].map((card, index) => {
                                        const Icon = card.icon;
                                        return (
                                            <Grid size={{ xs: 6, sm: 3 }} key={index}>
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 2,
                                                        border: `1px solid ${alpha(card.color, 0.2)}`,
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            transform: 'translateY(-4px)',
                                                            boxShadow: `0 4px 12px ${alpha(card.color, 0.2)}`,
                                                        },
                                                    }}
                                                >
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                p: 1,
                                                                borderRadius: 1.5,
                                                                bgcolor: card.bgColor,
                                                                display: 'flex',
                                                            }}
                                                        >
                                                            <Icon sx={{ fontSize: 20, color: card.color }} />
                                                        </Box>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                                                {card.value}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                                {card.label}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}

                            {/* Client Accordions */}
                            {ledgerData.clientLedgers.length === 0 ? (
                                <Alert severity="info">No ledger data found for the selected filters.</Alert>
                            ) : (
                                ledgerData.clientLedgers.map((clientLedger: ClientLedgerRecord) => (
                                    <Accordion
                                        key={clientLedger.client._id}
                                        sx={{
                                            mb: 1.5,
                                            borderRadius: '8px !important',
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            '&:before': { display: 'none' },
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            },
                                        }}
                                    >
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 1.5,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
                                                </Box>
                                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                                                        {clientLedger.client.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                        {clientLedger.client.email}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                                                    <Chip
                                                        label={formatCurrency(clientLedger.summary.totalDue)}
                                                        size="small"
                                                        color={clientLedger.summary.totalDue > 0 ? 'error' : 'success'}
                                                        sx={{ fontWeight: 700, height: 24 }}
                                                    />
                                                    {clientLedger.summary.totalOverdue > 0 && (
                                                        <Chip
                                                            icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                                            label={formatCurrency(clientLedger.summary.totalOverdue)}
                                                            size="small"
                                                            color="warning"
                                                            sx={{ fontWeight: 700, height: 24 }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                                            {/* Compact Metrics */}
                                            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                                {[
                                                    { label: 'Billed', value: formatCurrency(clientLedger.summary.totalBilled), icon: ReceiptIcon, color: '#667eea' },
                                                    { label: 'Paid', value: formatCurrency(clientLedger.summary.totalPaid), icon: CheckCircleIcon, color: '#10b981' },
                                                    { label: 'Due', value: formatCurrency(clientLedger.summary.totalDue), icon: WarningIcon, color: '#ef4444' },
                                                    { label: 'Invoices', value: clientLedger.summary.totalInvoices, icon: ReceiptIcon, color: '#6b7280' },
                                                    { label: 'Rate', value: `${clientLedger.summary.paymentRate}%`, icon: TrendingUpIcon, color: '#3b82f6' },
                                                    { label: 'Avg Days', value: clientLedger.summary.avgPaymentDays, icon: ScheduleIcon, color: '#8b5cf6' },
                                                ].map((metric, i) => {
                                                    const Icon = metric.icon;
                                                    return (
                                                        <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
                                                            <Paper
                                                                variant="outlined"
                                                                sx={{
                                                                    p: 1.5,
                                                                    textAlign: 'center',
                                                                    borderRadius: 1.5,
                                                                    borderColor: alpha(metric.color, 0.2),
                                                                    bgcolor: alpha(metric.color, 0.03),
                                                                }}
                                                            >
                                                                <Icon sx={{ fontSize: 16, color: metric.color, mb: 0.5 }} />
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: metric.color }}>
                                                                    {metric.value}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {metric.label}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>

                                            <Divider sx={{ my: 2 }} />

                                            {/* Compact Table */}
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                                <TrendingUpIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    Transactions
                                                </Typography>
                                            </Stack>
                                            {clientLedger.ledgerEntries.length === 0 ? (
                                                <Alert severity="info" sx={{ py: 1 }}>No transactions found</Alert>
                                            ) : (
                                                <TableContainer
                                                    component={Paper}
                                                    variant="outlined"
                                                    sx={{ borderRadius: 1.5, maxHeight: 400 }}
                                                >
                                                    <Table size="small" stickyHeader>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Date</TableCell>
                                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Type</TableCell>
                                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Description</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Debit</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Credit</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Balance</TableCell>
                                                                <TableCell sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Status</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {clientLedger.ledgerEntries.map((entry: ClientLedgerRecord['ledgerEntries'][0], index: number) => (
                                                                <TableRow
                                                                    key={index}
                                                                    sx={{
                                                                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                                                                        bgcolor: entry.type === 'PAYMENT' ? alpha(theme.palette.success.main, 0.02) : 'inherit'
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(entry.date)}</TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={entry.type}
                                                                            size="small"
                                                                            color={entry.type === 'PAYMENT' ? 'success' : 'default'}
                                                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                                                            {entry.description}
                                                                        </Typography>
                                                                        {entry.type === 'INVOICE' && entry.dueDate && (
                                                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                                                Due: {formatDate(entry.dueDate)}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {entry.debit > 0 && (
                                                                            <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
                                                                                {formatCurrency(entry.debit)}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        {entry.credit > 0 && (
                                                                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                                                                                {formatCurrency(entry.credit)}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                fontWeight: 800,
                                                                                color: entry.balance > 0 ? 'error.main' : 'success.main'
                                                                            }}
                                                                        >
                                                                            {formatCurrency(entry.balance)}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {entry.status && (
                                                                            <Chip
                                                                                label={entry.status}
                                                                                size="small"
                                                                                color={statusColors[entry.status]}
                                                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            )}
                        </>
                    )}
                </Section>
            </ContentContainer>
        </PageContainer>
    );
};
