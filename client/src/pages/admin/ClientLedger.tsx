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
    Select,
    useMediaQuery,
    Avatar
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
import { billingService, type ClientLedger as IBillingClientLedger } from '../../services/billingService';
import type { Client, User } from '../../types';
import { adminService } from '../../services/adminService';
import { clientGroupService, type ClientGroup } from '../../services/clientGroupService';
import firmService, { type IMultiFirmData } from '../../services/firmService';
import { PageHeader, PageContainer, ContentContainer, Section, FilterRow, CommonButton } from '../../components/common/UIComponents';

interface ClientLedgerRecord extends Omit<IBillingClientLedger, 'client'> {
    client: IBillingClientLedger['client'] & {
        logoUrl?: string;
    };
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
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedFirm, setSelectedFirm] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');

    // Reset client filter when group changes
    React.useEffect(() => {
        setSelectedClient('');
    }, [selectedGroup]);

    const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
    const months = [
        { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
        { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

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

    // Fetch groups
    const { data: groups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups,
    });

    // Fetch firm brands
    const { data: firms = [] } = useQuery<IMultiFirmData[]>({
        queryKey: ['multiFirms'],
        queryFn: firmService.getMultiFirms,
    });

    // Fetch client ledger
    const { data: ledgerData, isLoading, error } = useQuery({
        queryKey: ['clientLedger', selectedClient, selectedStaff, startDate, endDate, selectedGroup, selectedFirm, selectedYear, selectedMonth],
        queryFn: async () => {
            const data = await billingService.getClientLedger({
                clientId: selectedClient || undefined,
                staffId: selectedStaff || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                groupId: selectedGroup || undefined,
                firmId: selectedFirm || undefined,
                year: selectedYear || undefined,
                month: selectedMonth || undefined,
            });
            return data as unknown as { clientLedgers: ClientLedgerRecord[]; overallSummary: Record<string, number>; generatedAt: string };
        },
    });

    const filteredLedgers = React.useMemo(() => {
        if (!ledgerData?.clientLedgers) return [];
        if (!searchText) return ledgerData.clientLedgers;

        const searchLower = searchText.toLowerCase();

        return ledgerData.clientLedgers.filter((cl) => {
            const clientInfo = clients.find(c => c._id === cl.client._id);
            const nameMatch = cl.client.name?.toLowerCase().includes(searchLower) || false;
            const emailMatch = cl.client.email?.toLowerCase().includes(searchLower) || false;
            const codeMatch = (cl.client as any).clientCode?.toLowerCase().includes(searchLower) || clientInfo?.clientCode?.toLowerCase().includes(searchLower) || false;
            const proprietorMatch = clientInfo?.proprietorName?.toLowerCase().includes(searchLower) || false;
            const tradeNameMatch = clientInfo?.tradeName?.toLowerCase().includes(searchLower) || false;

            let groupNameMatch = false;
            if (clientInfo) {
                const groupId = typeof clientInfo.groupName === 'object' && clientInfo.groupName !== null
                    ? clientInfo.groupName._id
                    : clientInfo.groupName;
                const group = groups.find(g => g._id === groupId);
                if (group?.groupName?.toLowerCase().includes(searchLower)) {
                    groupNameMatch = true;
                }
            }

            const phoneMatch = cl.client.phone?.includes(searchText) || clientInfo?.phone?.includes(searchText) || clientInfo?.phone2?.includes(searchText) || false;

            return nameMatch || emailMatch || codeMatch || proprietorMatch || tradeNameMatch || groupNameMatch || phoneMatch;
        });
    }, [ledgerData?.clientLedgers, searchText, clients, groups]);

    const handleExport = () => {
        if (!filteredLedgers.length) return;

        let csv = 'Client Name,Total Billed,Total Paid,Total Due,Total Overdue,Invoices,Paid,Pending,Overdue,Payment Rate %\n';

        filteredLedgers.forEach((cl: ClientLedgerRecord) => {
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
                    <CommonButton
                        variant="contained"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        disabled={!filteredLedgers.length}
                        sx={{ borderRadius: '8px', boxShadow: 'none' }}
                    >
                        Export CSV
                    </CommonButton>
                }
            />

            <ContentContainer>

                {/* Filters Section */}
                <Section title="Filter Options" icon={<FilterListIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: isTablet ? 'column' : 'row', gap: { xs: 0, lg: 4 } }}>
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
                                    sx={{ borderRadius: '8px', color: selectedStaff ? 'inherit' : 'text.secondary' }}
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
                                    sx={{ borderRadius: '8px', color: selectedClient ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Client Name' }}
                                >
                                    <MenuItem value="">Choose a Client...</MenuItem>
                                    {[...clients]
                                        .filter(client => {
                                            if (!selectedGroup) return true;
                                            const clientGroupId = typeof client.groupName === 'object' && client.groupName !== null
                                                ? client.groupName._id
                                                : client.groupName;
                                            return clientGroupId === selectedGroup;
                                        })
                                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                        .map(client => (
                                            <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                        ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Group Name" inputId="group-select">
                                <Select
                                    id="group-select"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    sx={{ borderRadius: '8px', color: selectedGroup ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Group Name' }}
                                >
                                    <MenuItem value="">Choose a Group...</MenuItem>
                                    {[...groups].sort((a, b) => (a.groupName || '').localeCompare(b.groupName || '')).map(group => (
                                        <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                            <FilterRow label="Firm Name" inputId="firm-select">
                                <Select
                                    id="firm-select"
                                    fullWidth
                                    size="small"
                                    displayEmpty
                                    value={selectedFirm}
                                    onChange={(e) => setSelectedFirm(e.target.value)}
                                    sx={{ borderRadius: '8px', color: selectedFirm ? 'inherit' : 'text.secondary' }}
                                    inputProps={{ 'aria-label': 'Firm Name' }}
                                >
                                    <MenuItem value="">Choose a Firm...</MenuItem>
                                    {firms.map(firm => (
                                        <MenuItem key={firm._id} value={firm._id}>{firm.firmName}</MenuItem>
                                    ))}
                                </Select>
                            </FilterRow>
                        </Box>

                        {/* Right Column */}
                        <Box sx={{ flex: 1 }}>
                            <FilterRow label="Search" inputId="filter-search-text">
                                <TextField
                                    id="filter-search-text"
                                    fullWidth
                                    size="small"
                                    placeholder="Search by name, group, firm, proprietor..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    inputProps={{ 'aria-label': 'Search Text' }}
                                />
                            </FilterRow>
                            <FilterRow label="Year / Month">
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        {years.map(year => (
                                            <MenuItem key={year} value={year}>{year}</MenuItem>
                                        ))}
                                    </Select>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        sx={{ borderRadius: '8px', color: selectedMonth ? 'inherit' : 'text.secondary' }}
                                    >
                                        <MenuItem value="">Full Year</MenuItem>
                                        {months.map(month => (
                                            <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </FilterRow>
                            <FilterRow label="Period">
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ 'aria-label': 'Start Date' }}
                                    />
                                    <TextField
                                        fullWidth
                                        type="date"
                                        size="small"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ 'aria-label': 'End Date' }}
                                    />
                                </Box>
                            </FilterRow>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                <CommonButton
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                        setSelectedStaff('');
                                        setSelectedClient('');
                                        setSelectedGroup('');
                                        setSelectedFirm('');
                                        setSelectedYear(new Date().getFullYear().toString());
                                        setSelectedMonth('');
                                        setStartDate('');
                                        setEndDate('');
                                        setSearchText('');
                                    }}
                                    startIcon={<ClearIcon />}
                                    sx={{ color: 'error.main', textTransform: 'none', fontWeight: 600 }}
                                    aria-label="Clear all filters"
                                >
                                    Clear Filters
                                </CommonButton>
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
                                            <Grid size={{ xs: 6, sm: 6, md: 3 }} key={index}>
                                                <Paper
                                                    sx={{
                                                        p: { xs: 1.5, sm: 2 },
                                                        borderRadius: '12px',
                                                        height: '100%',
                                                        border: `1px solid ${alpha(card.color, 0.2)}`,
                                                        bgcolor: '#ffffff',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            transform: 'translateY(-4px)',
                                                            boxShadow: `0 8px 16px ${alpha(card.color, 0.1)}`,
                                                        },
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}>
                                                        <Box
                                                            sx={{
                                                                width: 36,
                                                                height: 36,
                                                                borderRadius: '8px',
                                                                bgcolor: card.bgColor,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <Icon sx={{ fontSize: 18, color: card.color }} />
                                                        </Box>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                                                {card.label}
                                                            </Typography>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, color: '#1e293b' }}>
                                                                {card.value}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}

                            {/* Client Accordions */}
                            {filteredLedgers.length === 0 ? (
                                <Alert severity="info">No ledger data found matching the selected filters.</Alert>
                            ) : (
                                filteredLedgers.map((clientLedger: ClientLedgerRecord) => (
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
                                        <AccordionSummary 
                                            expandIcon={<ExpandMoreIcon />}
                                            sx={{ 
                                                px: { xs: 1, sm: 2 },
                                                '& .MuiAccordionSummary-content': { 
                                                    minWidth: 0,
                                                    my: { xs: 1, sm: 1.5 }
                                                } 
                                            }}
                                        >
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                gap: { xs: 1.5, sm: 2 },
                                                width: '100%',
                                                minWidth: 0
                                            }}>
                                                <Avatar
                                                    variant="rounded"
                                                    src={clientLedger.client.logoUrl}
                                                    sx={{
                                                        width: { xs: 36, sm: 40 },
                                                        height: { xs: 36, sm: 40 },
                                                        borderRadius: '10px',
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        color: theme.palette.primary.main,
                                                        fontWeight: 700,
                                                        fontSize: '1rem',
                                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                                                    }}
                                                >
                                                    {clientLedger.client.name?.charAt(0).toUpperCase() || <PersonIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                                                </Avatar>
                                                
                                                <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, color: '#1e293b', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                                                            {clientLedger.client.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                                            {clientLedger.client.clientCode || clientLedger.client.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexShrink: 0 }}>
                                                    <Chip
                                                        label={formatCurrency(clientLedger.summary.totalDue)}
                                                        size="small"
                                                        color={clientLedger.summary.totalDue > 0 ? 'error' : 'success'}
                                                        sx={{ fontWeight: 800, height: 24, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                                    />
                                                </Box>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                                            {/* Compact Metrics */}
                                            <Grid container spacing={1} sx={{ mb: 2 }}>
                                                {[
                                                    { label: 'Billed', value: formatCurrency(clientLedger.summary.totalBilled), icon: ReceiptIcon, color: '#6366f1' },
                                                    { label: 'Paid', value: formatCurrency(clientLedger.summary.totalPaid), icon: CheckCircleIcon, color: '#10b981' },
                                                    { label: 'Due', value: formatCurrency(clientLedger.summary.totalDue), icon: WarningIcon, color: '#ef4444' },
                                                    { label: 'Invoices', value: clientLedger.summary.totalInvoices, icon: ReceiptIcon, color: '#64748b' },
                                                    { label: 'Rate', value: `${clientLedger.summary.paymentRate}%`, icon: TrendingUpIcon, color: '#6366f1' },
                                                    { label: 'Avg Days', value: clientLedger.summary.avgPaymentDays, icon: ScheduleIcon, color: '#8b5cf6' },
                                                ].map((metric, i) => {
                                                    const Icon = metric.icon;
                                                    return (
                                                        <Grid size={{ xs: 4, sm: 4, md: 4, lg: 2 }} key={i}>
                                                            <Paper
                                                                variant="outlined"
                                                                sx={{
                                                                    p: 1.2,
                                                                    textAlign: 'center',
                                                                    borderRadius: '12px',
                                                                    borderColor: alpha(metric.color, 0.1),
                                                                    bgcolor: alpha(metric.color, 0.02),
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: 0.2
                                                                }}
                                                            >
                                                                <Icon sx={{ fontSize: 16, color: metric.color }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
                                                                    {metric.value}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
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
                                            ) : isMobile ? (
                                                <Stack spacing={1.5}>
                                                    {clientLedger.ledgerEntries.map((entry, index) => (
                                                        <Paper
                                                            key={index}
                                                            variant="outlined"
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: '12px',
                                                                borderColor: 'divider',
                                                                bgcolor: entry.type === 'PAYMENT' ? 'rgba(16, 185, 129, 0.02)' : '#ffffff'
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                                                    {formatDate(entry.date)}
                                                                </Typography>
                                                                <Chip 
                                                                    label={entry.type} 
                                                                    size="small" 
                                                                    color={entry.type === 'PAYMENT' ? 'success' : 'default'}
                                                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} 
                                                                />
                                                            </Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, lineHeight: 1.2 }}>
                                                                {entry.description}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1.5, borderTop: '1px dashed', borderColor: 'divider', pt: 1.2 }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>DEBIT</Typography>
                                                                    <Typography variant="caption" color="error" sx={{ fontWeight: 800 }}>{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</Typography>
                                                                </Box>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>CREDIT</Typography>
                                                                    <Typography variant="caption" color="success.main" sx={{ fontWeight: 800 }}>{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</Typography>
                                                                </Box>
                                                                <Box sx={{ flex: 1, textAlign: 'right' }}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>BALANCE</Typography>
                                                                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#1e293b' }}>{formatCurrency(entry.balance)}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <TableContainer
                                                    component={Paper}
                                                    variant="outlined"
                                                    sx={{ borderRadius: '8px', maxHeight: 400 }}
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
                                                                                {formatCurrency(entry.credit) || 0}
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





