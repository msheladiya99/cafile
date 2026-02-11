import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    CircularProgress,
} from '@mui/material';
import {
    FileDownload as DownloadIcon,
    People as PeopleIcon,
    Folder as FolderIcon,
    Receipt as ReceiptIcon,
    NotificationsActive as ReminderIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { adminService } from '../../services/adminService';
import { billingService } from '../../services/billingService';
import type { Invoice } from '../../services/billingService';
import { reminderService } from '../../services/reminderService';
import type { Client, Reminder } from '../../types';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyReports: React.FC = () => {
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    // Fetch Analytics Data
    const { data: report, isLoading: loadingReport } = useQuery({
        queryKey: ['monthlyReport', selectedYear, selectedMonth],
        queryFn: () => analyticsService.getMonthlyReport(selectedYear, selectedMonth)
    });

    // Fetch Clients (for File Register stats)
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    // Fetch Invoices (for Revenue stats)
    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: () => billingService.getInvoices()
    });

    // Fetch Reminders (for Task stats)
    const { data: reminders = [] } = useQuery({
        queryKey: ['reminders'],
        queryFn: () => reminderService.getAllReminders()
    });

    // Calculations
    const fileStats = React.useMemo(() => {
        const tracked = clients.filter((c: Client) => c.physicalFileNumber).length;
        return {
            total: clients.length,
            tracked,
            untracked: clients.length - tracked,
            percentage: clients.length ? Math.round((tracked / clients.length) * 100) : 0
        };
    }, [clients]);

    const revenueStats = React.useMemo(() => {
        const monthlyInvoices = invoices.filter((inv: Invoice) => {
            const date = new Date(inv.issueDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });

        const billed = monthlyInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);
        const collected = monthlyInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.paidAmount || 0), 0);

        return { billed, collected, pending: billed - collected, count: monthlyInvoices.length };
    }, [invoices, selectedMonth, selectedYear]);

    const taskStats = React.useMemo(() => {
        const monthlyReminders = reminders.filter((rem: Reminder) => {
            const date = new Date(rem.dueDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });

        const total = monthlyReminders.length;
        const completed = monthlyReminders.filter((r: Reminder) => r.status === 'COMPLETED').length;

        return { total, completed, pending: total - completed };
    }, [reminders, selectedMonth, selectedYear]);

    const handleDownloadReport = () => {
        if (!report) return;

        const reportText = `
Monthly Report - ${report.period.monthName} ${report.period.year}
${'='.repeat(50)}

SUMMARY
-------
Files Uploaded: ${report.summary.filesUploaded}
New Clients Joined: ${report.summary.newClients}

REVENUE SNAPSHOT
----------------
Total Invoiced: ₹${revenueStats.billed.toLocaleString()}
Total Collected: ₹${revenueStats.collected.toLocaleString()}
Pending: ₹${revenueStats.pending.toLocaleString()}
Invoices Raised: ${revenueStats.count}

TASK PERFORMANCE
----------------
Total Tasks Due: ${taskStats.total}
Completed: ${taskStats.completed}
Pending: ${taskStats.pending}

OFFICE FILE REGISTER
--------------------
Total Clients: ${fileStats.total}
Physical Files Tracked: ${fileStats.tracked}
Untracked: ${fileStats.untracked}

Generated on: ${new Date().toLocaleString()}
        `;

        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${report.period.monthName}_${selectedYear}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    if (loadingReport) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!report) return null;

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5 }}>
            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={2}
                mb={4}
            >
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #1e293b, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                        Monthly Intelligence
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comprehensive insights into office performance
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReport}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        width: { xs: '100%', sm: 'auto' },
                        boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)'
                    }}
                >
                    Download Summary
                </Button>
            </Box>

            {/* Period Selector */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Year</InputLabel>
                        <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {years.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth size="small">
                        <InputLabel>Month</InputLabel>
                        <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            {MONTHS.map((month, index) => <MenuItem key={index} value={index + 1}>{month}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Typography variant="h6" fontWeight="700" textAlign="center" color="primary.main">
                        {report.period.monthName} {report.period.year}
                    </Typography>
                </Box>
            </Paper>

            {/* Analytics Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>

                {/* 1. Client Growth */}
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible' }}>
                    <Box sx={{ position: 'absolute', top: -10, right: 20, bgcolor: '#f093fb', p: 1.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)' }}>
                        <PeopleIcon sx={{ color: 'white' }} />
                    </Box>
                    <CardContent sx={{ pt: 4 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600">NEW CLIENTS</Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ my: 1 }}>{report.summary.newClients}</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#f3e8ff', color: '#9d4edd', px: 1, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
                            Joined this month
                        </Typography>
                    </CardContent>
                </Card>

                {/* 2. File Activity */}
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible' }}>
                    <Box sx={{ position: 'absolute', top: -10, right: 20, bgcolor: '#4facfe', p: 1.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)' }}>
                        <FolderIcon sx={{ color: 'white' }} />
                    </Box>
                    <CardContent sx={{ pt: 4 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600">FILES PROCESSED</Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ my: 1 }}>{report.summary.filesUploaded}</Typography>
                        <Typography variant="caption" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', px: 1, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
                            Uploaded securely
                        </Typography>
                    </CardContent>
                </Card>

                {/* 3. Revenue Stats */}
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible' }}>
                    <Box sx={{ position: 'absolute', top: -10, right: 20, bgcolor: '#43e97b', p: 1.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(67, 233, 123, 0.4)' }}>
                        <ReceiptIcon sx={{ color: 'white' }} />
                    </Box>
                    <CardContent sx={{ pt: 4 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600">REVENUE (This Month)</Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ my: 1 }}>₹{revenueStats.billed.toLocaleString()}</Typography>
                        <Box display="flex" gap={2}>
                            <Typography variant="caption" color="success.main" fontWeight="700">Get: ₹{revenueStats.collected.toLocaleString()}</Typography>
                            <Typography variant="caption" color="error.main" fontWeight="700">Due: ₹{revenueStats.pending.toLocaleString()}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                {/* 4. Task Completion */}
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible' }}>
                    <Box sx={{ position: 'absolute', top: -10, right: 20, bgcolor: '#fa709a', p: 1.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(250, 112, 154, 0.4)' }}>
                        <ReminderIcon sx={{ color: 'white' }} />
                    </Box>
                    <CardContent sx={{ pt: 4 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="600">TASK COMPLETION</Typography>
                        <Typography variant="h4" fontWeight="800" sx={{ my: 1 }}>
                            {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {taskStats.completed}/{taskStats.total} Tasks Completed
                        </Typography>
                    </CardContent>
                </Card>

                {/* 5. Physical File Registry */}
                <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'visible', gridColumn: { md: 'span 2', lg: 'span 2' } }}>
                    <Box sx={{ position: 'absolute', top: -10, right: 20, bgcolor: '#667eea', p: 1.5, borderRadius: 3, boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
                        <InventoryIcon sx={{ color: 'white' }} />
                    </Box>
                    <CardContent sx={{ pt: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="body2" color="text.secondary" fontWeight="600">OFFICE FILE REGISTER</Typography>
                                <Typography variant="h4" fontWeight="800" sx={{ my: 1 }}>{fileStats.percentage}% Tracked</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {fileStats.tracked} files assigned to racks out of {fileStats.total} active clients.
                                </Typography>
                            </Box>
                            {/* Simple Visual Bar */}
                            <Box sx={{ width: '50%', height: 8, bgcolor: '#e2e8f0', borderRadius: 4, ml: 4, position: 'relative' }}>
                                <Box sx={{
                                    width: `${fileStats.percentage}%`,
                                    height: '100%',
                                    borderRadius: 4,
                                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                    transition: 'width 1s ease-in-out'
                                }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

            </Box>
        </Box>
    );
};
