import React, { useState } from 'react';
import {
    Box, Grid, Paper, Typography, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Avatar, LinearProgress, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    FileDownload as DownloadIcon,
    People as PeopleIcon,
    Receipt as ReceiptIcon,
    Inventory as InventoryIcon,
    CalendarMonth as CalendarIcon,
    AssignmentTurnedIn as TaskDoneIcon,
    WarningAmber as WarningIcon,
    TrendingUp as TrendingUpIcon,
    BarChart as ChartIcon
} from '@mui/icons-material';
import {
    Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    ComposedChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { adminService } from '../../services/adminService';
import { billingService } from '../../services/billingService';
import type { Invoice } from '../../services/billingService';
import { taskService } from '../../services/taskService';
import type { Client, Task } from '../../types';
import { CommonButton } from '../../components/common/UIComponents';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// ─── Report Metric Card ──────────────────────────────────────────────────────
interface ReportMetricCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    progress?: number;
}

const ReportMetricCard: React.FC<ReportMetricCardProps> = ({ title, value, subtitle, icon, color, progress }) => (
    <Card sx={{ height: '100%', borderRadius: 3, border: `1.5px solid ${color}25`, bgcolor: `${color}05`, boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                <Box>
                    <Typography variant="caption" fontWeight={700} color={color} textTransform="uppercase" letterSpacing={0.5}>{title}</Typography>
                    <Typography variant="h4" fontWeight={800} color="#1e293b" mt={0.5}>{value}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 44, height: 44, borderRadius: 2 }}>{icon}</Avatar>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={progress !== undefined ? 1 : 0}>{subtitle}</Typography>
            {progress !== undefined && (
                <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: `${color}20`, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
            )}
        </CardContent>
    </Card>
);

export const MonthlyReports: React.FC = () => {
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    // Queries
    const { data: report, isLoading: loadingReport } = useQuery({ queryKey: ['monthlyReport', selectedYear, selectedMonth], queryFn: () => analyticsService.getMonthlyReport(selectedYear, selectedMonth) });
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => billingService.getInvoices() });
    const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.getTasks() });

    // Single Month KPI Calcs
    const fileStats = React.useMemo(() => {
        const tracked = clients.filter((c: Client) => c.physicalFileNumber).length;
        return { total: clients.length, tracked, untracked: clients.length - tracked, percentage: clients.length ? Math.round((tracked / clients.length) * 100) : 0 };
    }, [clients]);

    const revenueStats = React.useMemo(() => {
        const monthlyInvoices = invoices.filter((inv: Invoice) => {
            const date = new Date(inv.issueDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
        const billed = monthlyInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.totalAmount || 0), 0);
        const collected = monthlyInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.paidAmount || 0), 0);
        const realization = billed > 0 ? Math.round((collected / billed) * 100) : 0;
        return { billed, collected, pending: billed - collected, count: monthlyInvoices.length, realization };
    }, [invoices, selectedMonth, selectedYear]);

    const filingStats = React.useMemo(() => {
        const monthlyTasks = tasks.filter((t: Task) => {
            if (!t.targetDate) return false;
            const date = new Date(t.targetDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
        const total = monthlyTasks.length;
        const done = monthlyTasks.filter((t: Task) => t.status === 'DONE').length;
        const overdue = monthlyTasks.filter((t: Task) => t.isOverdue && t.status !== 'DONE').length;
        return { total, done, overdue, percentage: total ? Math.round((done / total) * 100) : 0 };
    }, [tasks, selectedMonth, selectedYear]);

    // Trend & Distribution Calcs
    const trendData = React.useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const mInvs = invoices.filter(inv => {
                const idate = new Date(inv.issueDate);
                return idate.getMonth() + 1 === m && idate.getFullYear() === y;
            });
            const billed = mInvs.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
            const collected = mInvs.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
            data.push({ month: MONTHS[m - 1].substring(0, 3), Billed: billed, Collected: collected });
        }
        return data;
    }, [invoices, selectedYear, selectedMonth]);

    const taskStatusData = React.useMemo(() => {
        const monthlyTasks = tasks.filter((t: Task) => {
            if (!t.targetDate) return false;
            const date = new Date(t.targetDate);
            return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
        });
        const pending = monthlyTasks.filter(t => t.status === 'PENDING').length;
        const inProc = monthlyTasks.filter(t => t.status === 'IN_PROCESS').length;
        const done = monthlyTasks.filter(t => t.status === 'DONE').length;
        const approval = monthlyTasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').length;
        const onHold = monthlyTasks.filter(t => t.status === 'ON_HOLD').length;

        return [
            { name: 'Pending', value: pending, color: '#94a3b8' },
            { name: 'In Process', value: inProc, color: '#3b82f6' },
            { name: 'Done', value: done, color: '#10b981' },
            { name: 'Approval', value: approval, color: '#f59e0b' },
            { name: 'On Hold', value: onHold, color: '#8b5cf6' },
        ].filter(d => d.value > 0);
    }, [tasks, selectedYear, selectedMonth]);

    const criticalWatchlist = React.useMemo(() => {
        return tasks
            .filter(t => t.isOverdue && t.status !== 'DONE')
            .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
            .slice(0, 5);
    }, [tasks]);

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
Realization Rate: ${revenueStats.realization}%
Pending: ₹${revenueStats.pending.toLocaleString()}
Invoices Raised: ${revenueStats.count}

FILING & COMPLIANCE
-------------------
Total Filings/Tasks: ${filingStats.total}
Successfully Filed/Done: ${filingStats.done}
Overdue/Critical: ${filingStats.overdue}

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
        a.download = `Firm_Report_${report.period.monthName}_${selectedYear}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    if (loadingReport) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress sx={{ color: '#0f172a' }} />
            </Box>
        );
    }

    if (!report) return null;

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f0f2f8', minHeight: '100vh' }}>
            
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2.5 }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ color: '#1e293b', lineHeight: 1.2, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                        Management Reporting
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.25}>
                        Enterprise analytics and financial intelligence
                    </Typography>
                </Box>
                <CommonButton variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadReport} sx={{ bgcolor: '#0f172a', color: 'white', '&:hover': { bgcolor: '#1e293b' }, boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)', whiteSpace: 'nowrap' }}>
                    Export Full Report
                </CommonButton>
            </Box>

            {/* ── Period Selector ── */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box display="flex" alignItems="center" gap={1.5} sx={{ pr: 3, borderRight: { sm: '1px solid #e2e8f0' } }}>
                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 40, height: 40, borderRadius: 2 }}><CalendarIcon fontSize="small" /></Avatar>
                    <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>Reporting Period</Typography>
                        <Typography variant="subtitle1" fontWeight={800} color="#0f172a">{report.period.monthName} {report.period.year}</Typography>
                    </Box>
                </Box>
                
                <Box display="flex" gap={2} flexGrow={1}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(Number(e.target.value))} sx={{ borderRadius: 2 }}>
                            {years.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Month</InputLabel>
                        <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(Number(e.target.value))} sx={{ borderRadius: 2 }}>
                            {MONTHS.map((month, index) => <MenuItem key={index} value={index + 1}>{month}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* ── Top KPIs Row ── */}
            <Grid container spacing={2.5} mb={3}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ReportMetricCard title="Client Onboarding" value={report.summary.newClients} subtitle="New clients joined this period" icon={<PeopleIcon />} color="#8b5cf6" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ReportMetricCard title="Filing Velocity" value={`${filingStats.percentage}%`} subtitle={`${filingStats.done} / ${filingStats.total} returns filed`} icon={<TaskDoneIcon />} color="#0ea5e9" progress={filingStats.percentage} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <ReportMetricCard title="Compliance Alert" value={filingStats.overdue} subtitle={filingStats.overdue > 0 ? "Critical overdue filings" : "All filings on track"} icon={<WarningIcon />} color={filingStats.overdue > 0 ? "#ef4444" : "#10b981"} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card sx={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                <Typography variant="caption" fontWeight={700} sx={{ opacity: 0.9, textTransform: 'uppercase', letterSpacing: 0.5 }}>Billing Realization</Typography>
                                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36, borderRadius: 2 }}><ReceiptIcon fontSize="small" /></Avatar>
                            </Box>
                            <Box display="flex" alignItems="baseline" gap={1} mb={1}>
                                <Typography variant="h3" fontWeight={900}>{revenueStats.realization}%</Typography>
                                {revenueStats.realization >= 80 && <TrendingUpIcon fontSize="small" sx={{ opacity: 0.8 }} />}
                            </Box>
                            <Box display="flex" justifyContent="space-between" pt={1.5} sx={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                <Box><Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Billed</Typography><Typography variant="body2" fontWeight={800}>₹{revenueStats.billed.toLocaleString()}</Typography></Box>
                                <Box textAlign="right"><Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Collected</Typography><Typography variant="body2" fontWeight={800}>₹{revenueStats.collected.toLocaleString()}</Typography></Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Middle Row: Charts ── */}
            <Grid container spacing={3} mb={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h6" fontWeight={800} color="#0f172a">Financial Performance (6-Month Trend)</Typography>
                            <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 36, height: 36, borderRadius: 2 }}><ChartIcon fontSize="small" /></Avatar>
                        </Box>
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number | string | undefined) => [`₹${Number(value ?? 0).toLocaleString()}`]}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="Billed" barSize={30} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" mb={2}>Task Status Distribution</Typography>
                        {taskStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={taskStatusData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                                        {taskStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" alignItems="center" justifyContent="center" height={260}>
                                <Typography color="text.secondary">No task data for this period.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ── Bottom Row: Tables & Operations ── */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ bgcolor: '#fee2e2', color: '#ef4444', width: 36, height: 36, borderRadius: 2 }}><WarningIcon fontSize="small" /></Avatar>
                                <Typography variant="h6" fontWeight={800} color="#0f172a">Critical Watchlist</Typography>
                            </Box>
                            <Chip label={`${criticalWatchlist.length} Items`} size="small" color="error" sx={{ fontWeight: 700 }} />
                        </Box>
                        <TableContainer sx={{ flexGrow: 1 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>Task Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>Client</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', borderBottom: '2px solid #f1f5f9' }}>Target</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {criticalWatchlist.length > 0 ? criticalWatchlist.map((task) => (
                                        <TableRow key={task._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{task.title}</TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{(task.clientId as Client)?.name || 'Internal'}</TableCell>
                                            <TableCell align="right">
                                                <Chip label={new Date(task.targetDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} size="small" sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '0.65rem' }} />
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No critical overdue items. Great job!</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar sx={{ bgcolor: '#f1f5f9', color: '#475569', width: 36, height: 36, borderRadius: 2 }}><InventoryIcon fontSize="small" /></Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={800} color="#0f172a">Physical Registry</Typography>
                                    <Typography variant="caption" color="text.secondary">Document compliance tracker</Typography>
                                </Box>
                            </Box>
                            <Chip label={fileStats.percentage > 80 ? 'Audit Ready' : 'Review Required'} color={fileStats.percentage > 80 ? 'success' : 'warning'} size="small" sx={{ fontWeight: 700 }} />
                        </Box>
                        
                        <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #f1f5f9' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1.5}>
                                <Typography variant="h3" fontWeight={900} color="#0f172a">{fileStats.percentage}%</Typography>
                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                    {fileStats.tracked} / {fileStats.total} tracked
                                </Typography>
                            </Box>
                            <LinearProgress 
                                variant="determinate" 
                                value={fileStats.percentage} 
                                sx={{ height: 10, borderRadius: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', borderRadius: 5 } }} 
                            />
                            <Typography variant="caption" display="block" mt={2} color={fileStats.untracked > 0 ? 'error.main' : 'success.main'} fontWeight={700}>
                                {fileStats.untracked > 0 ? `${fileStats.untracked} clients missing physical file assignment.` : `All files correctly mapped.`}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
