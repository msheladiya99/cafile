import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
} from '@mui/material';
import { FormatListBulleted as ListIcon, Calculate as CalculateIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { staffService } from '../../../services/staffService';
import { attendanceService } from '../../../services/attendanceService';

interface MonthSummary {
    month: string;
    totalHours: string;
    calculatedDays: number;
}

export const Form108: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(String(currentYear));
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const years: number[] = [];
    for (let y = currentYear; y >= 2010; y--) {
        years.push(y);
    }

    const { data: staffList } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffService.getStaff()
    });

    const { data: summaryData, isLoading, refetch } = useQuery<MonthSummary[]>({
        queryKey: ['form108', selectedEmployee, year],
        queryFn: () => attendanceService.getForm108(selectedEmployee, year),
        enabled: false, // only run when manually triggered
    });

    const handleCalculate = () => {
        if (!selectedEmployee) {
            alert('Please select an employee.');
            return;
        }
        if (!year) {
            alert('Please select a year.');
            return;
        }
        refetch();
    };

    // Calculate totals from summary
    const totalDays = summaryData?.reduce((sum, row) => sum + row.calculatedDays, 0) ?? 0;
    const totalMinutesAll = summaryData?.reduce((sum, row) => {
        const [hPart, mPart] = row.totalHours.replace('h', '').replace('m', '').split(' ').map(s => parseInt(s.trim()) || 0);
        return sum + hPart * 60 + mPart;
    }, 0) ?? 0;
    const totalHoursAll = `${Math.floor(totalMinutesAll / 60)}h ${totalMinutesAll % 60}m`;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2 }}>
                    <Typography variant="h5" fontWeight="600">Form 108</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>Monthly Employee Attendance Summary</Typography>
                </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '60px', flexShrink: 0 }}>
                            Year <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <Select
                            fullWidth size="small" displayEmpty
                            value={year}
                            onChange={(e) => setYear(e.target.value as string)}
                            sx={{ borderRadius: '8px' }}
                        >
                            {years.map(y => (
                                <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: '90px', flexShrink: 0 }}>
                            Employee <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <Select
                            fullWidth size="small" displayEmpty
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value as string)}
                            sx={{ borderRadius: '8px' }}
                        >
                            <MenuItem value="" disabled>Choose Employee...</MenuItem>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {staffList?.map((s: any) => (
                                <MenuItem key={s._id} value={s._id}>{s.firstName} {s.lastName}</MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleCalculate}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <CalculateIcon />}
                            fullWidth
                            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', textTransform: 'none', py: 1, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: '#5a6fd6' } }}
                        >
                            {isLoading ? 'Calculating...' : 'Calculate'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results Table */}
            <Paper sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="700">Time Spent in Year</Typography>
                    {summaryData && (
                        <Typography variant="caption" sx={{ ml: 'auto', opacity: 0.85 }}>
                            {year} — Total: {totalHoursAll} / {totalDays} days
                        </Typography>
                    )}
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Month</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Total Hours</TableCell>
                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Attendance Days</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={30} sx={{ color: '#667eea' }} />
                                    </TableCell>
                                </TableRow>
                            ) : !summaryData ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                        No data available. Please select filters and click <strong>Calculate</strong>.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {summaryData.map((row, idx) => (
                                        <TableRow key={row.month} hover sx={{ bgcolor: idx % 2 === 0 ? '#fff' : '#fafbff', '&:hover': { bgcolor: '#f0f4ff' } }}>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.month}</TableCell>
                                            <TableCell>
                                                {row.calculatedDays > 0 ? (
                                                    <Box component="span" sx={{ bgcolor: '#ede7f6', color: '#4527a0', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {row.totalHours}
                                                    </Box>
                                                ) : (
                                                    <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>—</Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.calculatedDays > 0 ? (
                                                    <Box component="span" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {row.calculatedDays} day{row.calculatedDays !== 1 ? 's' : ''}
                                                    </Box>
                                                ) : (
                                                    <Box component="span" sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>—</Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals row */}
                                    <TableRow sx={{ bgcolor: '#f0f4ff', borderTop: '2px solid #667eea' }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#4527a0' }}>Total</TableCell>
                                        <TableCell>
                                            <Box component="span" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: '#fff', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                {totalHoursAll}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box component="span" sx={{ bgcolor: '#43a047', color: '#fff', px: 1.5, py: 0.3, borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                                                {totalDays} days
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};





