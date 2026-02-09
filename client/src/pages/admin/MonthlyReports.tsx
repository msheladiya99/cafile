import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { analyticsService } from '../../services/analyticsService';
import type { MonthlyReport } from '../../services/analyticsService';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyReports: React.FC = () => {
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadReport = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await analyticsService.getMonthlyReport(selectedYear, selectedMonth);
            setReport(data);
        } catch (error) {
            console.error('Error loading monthly report:', error);
            setError('Failed to load monthly report. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);



    const handleDownloadReport = () => {
        if (!report) return;

        const reportText = `
Monthly Report - ${report.period.monthName} ${report.period.year}
${'='.repeat(50)}

SUMMARY
-------
Files Uploaded: ${report.summary.filesUploaded}
New Clients: ${report.summary.newClients}


Generated on: ${new Date().toLocaleString()}
        `;

        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="error" gutterBottom>{error}</Typography>
                <Button variant="outlined" onClick={loadReport} sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    if (!report) return null;



    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                        Monthly Reports
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Detailed monthly activity summaries
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
                    }}
                >
                    Download Report
                </Button>
            </Box>

            {/* Period Selector */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
                    <FormControl fullWidth>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            label="Year"
                        >
                            {years.map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Month</InputLabel>
                        <Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            label="Month"
                        >
                            {MONTHS.map((month, index) => (
                                <MenuItem key={index} value={index + 1}>{month}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="h6" fontWeight="700" textAlign="center">
                        {report.period.monthName} {report.period.year}
                    </Typography>
                </Box>
            </Paper>

            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
                <Card
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                    }}
                >
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Files Uploaded
                                </Typography>
                                <Typography variant="h3" fontWeight="700">
                                    {report.summary.filesUploaded}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    This month
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                                    color: '#667eea',
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <FolderIcon sx={{ fontSize: 40 }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Card
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' },
                    }}
                >
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    New Clients
                                </Typography>
                                <Typography variant="h3" fontWeight="700">
                                    {report.summary.newClients}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    This month
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    bgcolor: 'rgba(240, 147, 251, 0.1)',
                                    color: '#f093fb',
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <PeopleIcon sx={{ fontSize: 40 }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>


        </Box>
    );
};
