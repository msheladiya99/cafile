import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, IconButton,
    Table, TableBody, TableCell, TableHead, TableRow,
    Paper, TableContainer, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import { attendanceService } from '../../../../services/attendanceService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkImportAttendanceModalProps {
    open: boolean;
    onClose: () => void;
    showSnackbar: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface ParsedAttendanceRecord {
    employeeCode: string;
    employeeName: string;
    date: string;
    inTime?: string;
    outTime?: string;
    status: string;
    description: string;
    workHours?: string;
    breakTime?: string;
    overtime?: string;
}

export const BulkImportAttendanceModal: React.FC<BulkImportAttendanceModalProps> = ({
    open, onClose, showSnackbar
}) => {
    const queryClient = useQueryClient();
    const [previewData, setPreviewData] = useState<ParsedAttendanceRecord[]>([]);
    const [fileName, setFileName] = useState('');
    const [importResults, setImportResults] = useState<{ successful: number, failed: number, errors: string[] } | null>(null);

    const handleDownloadFormat = () => {
        try {
            const currentDate = new Date();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const reportMonth = `${monthNames[currentDate.getMonth()]}-${currentDate.getFullYear()}`;

            // Build columns for 31 days
            const days = ['', ...Array.from({ length: 31 }, (_, idx) => idx + 1)];
            const weekdays = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sheetData: any[] = [];

            // Generate 5 blank employee blocks
            for (let i = 0; i < 5; i++) {
                sheetData.push(
                    // Row 0
                    ['Dept. Name', '', '', 'CompName', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Report Month', reportMonth],
                    // Row 1
                    ['Empcode', '', 'Name', '', '', 'Present', '0', 'WO', '0', 'Absent', '0', 'Total Work', '00:00', 'Total OT', '00:00'],
                    // Row 2: Days 1 to 31
                    days,
                    // Row 3: Weekdays
                    weekdays,
                    // Row 4: IN
                    ['IN', ...Array(31).fill('--:--')],
                    // Row 5: OUT
                    ['OUT', ...Array(31).fill('--:--')],
                    // Row 6: WORK
                    ['WORK', ...Array(31).fill('00:00')],
                    // Row 7: Break
                    ['Break', ...Array(31).fill('00:00')],
                    // Row 8: OT
                    ['OT', ...Array(31).fill('00:00')],
                    // Row 9: Status
                    ['Status', ...Array(31).fill('')],
                    // Spacer row
                    []
                );
            }

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance Format');
            XLSX.writeFile(wb, 'Monthly_Attendance_Format.xlsx');
            showSnackbar('Sample attendance format downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error generating format template:', error);
            showSnackbar('Failed to generate sample format template.', 'error');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

                const allRecords: ParsedAttendanceRecord[] = [];

                // Find all starting indexes where row[0] === 'Dept. Name'
                for (let i = 0; i < data.length; i++) {
                    const row = data[i] as string[];
                    if (row && row[0] === 'Dept. Name') {
                        const startIdx = i;

                        // Parse Report Month
                        const headerRow = data[startIdx] as string[];
                        const reportMonthIdx = headerRow.findIndex(val => val && String(val).trim().toLowerCase() === 'report month');
                        let reportMonthStr = '';
                        if (reportMonthIdx !== -1) {
                            for (let c = reportMonthIdx + 1; c < headerRow.length; c++) {
                                if (headerRow[c]) {
                                    reportMonthStr = String(headerRow[c]).trim();
                                    break;
                                }
                            }
                        }

                        let year = new Date().getFullYear();
                        let month = new Date().getMonth();
                        if (reportMonthStr) {
                            const parts = reportMonthStr.split('-');
                            if (parts.length === 2) {
                                const monthStr = parts[0].trim();
                                const yearStr = parts[1].trim();
                                const parsedYear = parseInt(yearStr);
                                if (!isNaN(parsedYear)) year = parsedYear;

                                const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                                const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                                const parsedMonth = parseInt(monthStr);
                                if (!isNaN(parsedMonth)) {
                                    month = parsedMonth - 1;
                                } else {
                                    const lcaseMonth = monthStr.toLowerCase();
                                    let mIdx = monthNames.indexOf(lcaseMonth);
                                    if (mIdx === -1) mIdx = monthShortNames.indexOf(lcaseMonth.substring(0, 3));
                                    if (mIdx !== -1) month = mIdx;
                                }
                            }
                        }

                        // Parse Employee Code and Name
                        const empRow = data[startIdx + 1] as string[];
                        if (!empRow) continue;

                        const empcodeLabelIdx = empRow.findIndex(val => val && String(val).trim().toLowerCase() === 'empcode');
                        let employeeCode = '';
                        if (empcodeLabelIdx !== -1) {
                            for (let c = empcodeLabelIdx + 1; c < empRow.length; c++) {
                                if (empRow[c]) {
                                    employeeCode = String(empRow[c]).trim();
                                    break;
                                }
                            }
                        }

                        const nameLabelIdx = empRow.findIndex(val => val && String(val).trim().toLowerCase() === 'name');
                        let employeeName = '';
                        if (nameLabelIdx !== -1) {
                            for (let c = nameLabelIdx + 1; c < empRow.length; c++) {
                                if (empRow[c]) {
                                    employeeName = String(empRow[c]).trim();
                                    break;
                                }
                            }
                        }

                        // Parse Days row
                        const daysRow = data[startIdx + 2] as string[];
                        if (!daysRow) continue;
                        const colToDayMap: Record<number, number> = {};
                        for (let c = 1; c < daysRow.length; c++) {
                            const val = parseInt(daysRow[c]);
                            if (!isNaN(val) && val >= 1 && val <= 31) {
                                colToDayMap[c] = val;
                            }
                        }

                        // Find IN, OUT, Status, WORK, Break, OT rows
                        let inRow: string[] | null = null;
                        let outRow: string[] | null = null;
                        let statusRow: string[] | null = null;
                        let workRow: string[] | null = null;
                        let breakRow: string[] | null = null;
                        let otRow: string[] | null = null;
                        for (let r = startIdx + 3; r <= startIdx + 10; r++) {
                            const rData = data[r] as string[];
                            if (!rData) continue;
                            const label = String(rData[0]).trim().toUpperCase();
                            if (label === 'IN') inRow = rData;
                            else if (label === 'OUT') outRow = rData;
                            else if (label === 'STATUS') statusRow = rData;
                            else if (label === 'WORK') workRow = rData;
                            else if (label === 'BREAK') breakRow = rData;
                            else if (label === 'OT') otRow = rData;
                        }

                        // Generate records
                        Object.keys(colToDayMap).forEach(colStr => {
                            const col = parseInt(colStr);
                            const day = colToDayMap[col];
                            const statusVal = statusRow ? String(statusRow[col]).trim() : '';
                            if (!statusVal) return;

                            const inTimeVal = inRow ? String(inRow[col]).trim() : '';
                            const outTimeVal = outRow ? String(outRow[col]).trim() : '';

                            const cleanInTime = (inTimeVal && inTimeVal !== '--:--') ? inTimeVal : '';
                            const cleanOutTime = (outTimeVal && outTimeVal !== '--:--') ? outTimeVal : '';

                            const workTimeVal = workRow ? String(workRow[col]).trim() : '';
                            const breakTimeVal = breakRow ? String(breakRow[col]).trim() : '';
                            const overtimeVal = otRow ? String(otRow[col]).trim() : '';

                            const cleanWorkHours = (workTimeVal && workTimeVal !== '--:--') ? workTimeVal : '00:00';
                            const cleanBreakTime = (breakTimeVal && breakTimeVal !== '--:--') ? breakTimeVal : '00:00';
                            const cleanOvertime = (overtimeVal && overtimeVal !== '--:--') ? overtimeVal : '00:00';

                            // Format local date string
                            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                            let cleanStatus = 'Present';
                            if (statusVal.toUpperCase() === 'A') cleanStatus = 'Absent';
                            else if (statusVal.toUpperCase() === 'WO') cleanStatus = 'Weekly Off';

                            allRecords.push({
                                employeeCode,
                                employeeName,
                                date: dateString,
                                inTime: cleanInTime || undefined,
                                outTime: cleanOutTime || undefined,
                                status: cleanStatus,
                                description: `Imported status: ${statusVal}`,
                                workHours: cleanWorkHours,
                                breakTime: cleanBreakTime,
                                overtime: cleanOvertime
                            });
                        });
                    }
                }

                if (allRecords.length === 0) {
                    showSnackbar('No valid attendance records found in the spreadsheet.', 'error');
                } else {
                    setPreviewData(allRecords);
                }
            } catch (err) {
                console.error('Error parsing excel:', err);
                showSnackbar('Failed to parse Excel file. Please upload a valid monthly report.', 'error');
            }
        };

        reader.readAsBinaryString(file);
    };

    const bulkImportMutation = useMutation({
        mutationFn: attendanceService.bulkCreateAttendance,
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            if (res.failed > 0) {
                setImportResults(res);
            } else {
                showSnackbar(`Successfully imported ${res.successful} attendance records!`, 'success');
                onClose();
            }
            setPreviewData([]);
            setFileName('');
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            showSnackbar(error.response?.data?.message || 'Failed to import attendance data.', 'error');
        }
    });

    const handleConfirmImport = () => {
        if (previewData.length === 0) return;
        bulkImportMutation.mutate({ records: previewData });
    };

    const handleReset = () => {
        setImportResults(null);
        setPreviewData([]);
        setFileName('');
    };

    const getStatusChip = (status: string) => {
        if (status === 'Present') return <Chip label="Present" color="success" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />;
        if (status === 'Absent') return <Chip label="Absent" color="error" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />;
        return <Chip label="Weekly Off" color="primary" size="small" sx={{ borderRadius: '6px', fontWeight: 600 }} />;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                <Typography variant="h6" fontWeight="bold">Bulk Import Employee Attendance</Typography>
                <IconButton onClick={onClose} sx={{ color: '#1e293b' }} aria-label="Close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4, bgcolor: '#fbfbfb' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center', mt: 2 }}>
                    <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' } }}>
                        Upload Monthly Performance Excel File
                        <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadFormat} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, border: '1px solid #6366f1', color: '#6366f1', '&:hover': { border: '1px solid #4338ca', bgcolor: '#f5f5ff' } }}>
                        Download Sample Format
                    </Button>
                </Box>

                {importResults && (
                    <Box sx={{ mt: 2, p: 3, bgcolor: '#fff4f4', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        <Typography variant="h6" color="error" fontWeight="bold" gutterBottom>
                            Import Completed with Errors
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Successfully imported <b>{importResults.successful}</b> records. Failed to import <b>{importResults.failed}</b> records.
                        </Typography>

                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Failure Reasons:</Typography>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: '#fff', p: 2, borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {importResults.errors.map((err, i) => (
                                    <li key={i}><Typography variant="body2" color="error">{err}</Typography></li>
                                ))}
                            </ul>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                            <Button variant="contained" color="error" onClick={handleReset} sx={{ textTransform: 'none', borderRadius: '12px', fontWeight: 600 }}>
                                Upload Fixed File
                            </Button>
                        </Box>
                    </Box>
                )}

                {!importResults && fileName && previewData.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Previewing: <b>{fileName}</b> ({previewData.length} entries parsed)</Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '12px' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Employee Code</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Employee Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>In Time</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Out Time</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Work Hours</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Break</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>OT</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.slice(0, 100).map((row, index) => {
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{row.date}</TableCell>
                                                <TableCell>{row.employeeCode || '-'}</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{row.employeeName}</TableCell>
                                                <TableCell>{row.inTime || '-'}</TableCell>
                                                <TableCell>{row.outTime || '-'}</TableCell>
                                                <TableCell>{row.workHours || '00:00'}</TableCell>
                                                <TableCell>{row.breakTime || '00:00'}</TableCell>
                                                <TableCell>{row.overtime || '00:00'}</TableCell>
                                                <TableCell>{getStatusChip(row.status)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {previewData.length > 100 && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                                Showing first 100 entries...
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#fbfbfb', borderTop: '1px solid #e0e0e0' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Close</Button>
                {!importResults && (
                    <Button
                        variant="contained"
                        onClick={handleConfirmImport}
                        disabled={previewData.length === 0 || bulkImportMutation.isPending}
                        sx={{ px: 4, borderRadius: '12px', bgcolor: '#6366f1', color: '#ffffff', fontWeight: 600, '&:hover': { bgcolor: '#4338ca' } }}
                    >
                        {bulkImportMutation.isPending ? 'Importing...' : `Import ${previewData.length} Attendance Entries`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
