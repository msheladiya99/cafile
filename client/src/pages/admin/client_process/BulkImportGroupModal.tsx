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
import { clientGroupService } from '../../../services/clientGroupService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkImportGroupModalProps {
    open: boolean;
    onClose: () => void;
    showSnackbar: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const EXCEL_FIELDS = [
    'Group Name', 'Address', 'Phone / Mobile', 'Email Address', 'Group Person Name', 'Description', 'Status (Active/Inactive)', 'Group Own By Firm'
];

export const BulkImportGroupModal: React.FC<BulkImportGroupModalProps> = ({
    open, onClose, showSnackbar
}) => {
    const queryClient = useQueryClient();
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([
        
    ]);
    const [fileName, setFileName] = useState('');

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([EXCEL_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Group Template");
        XLSX.writeFile(wb, "Client_Group_Bulk_Import_Template.xlsx");
        showSnackbar('Template downloaded successfully', 'success');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

                const mappedData = data.map((row) => {
                    const getVal = (possibleKeys: string[]) => {
                        const rowKeys = Object.keys(row);
                        const cleanPossible = possibleKeys.map(k => k.trim().toLowerCase());
                        const foundKey = rowKeys.find(rk => {
                            const cleanRk = rk.trim().toLowerCase().replace(/\*$/, '');
                            return cleanPossible.includes(cleanRk);
                        });
                        return foundKey !== undefined ? row[foundKey] : undefined;
                    };

                    const parseStatus = (val: unknown) => {
                        if (typeof val !== 'string' || !val) return true;
                        if (val.toLowerCase() === 'inactive' || val.toLowerCase() === 'false') return false;
                        return true;
                    };

                    const gName = getVal(['group name', 'group', 'groupname']);
                    const mobile = getVal(['phone / mobile', 'phone', 'mobile number', 'mobile', 'mobilenumber']);
                    const email = getVal(['email address', 'email', 'emailaddress']);
                    const groupOwn = getVal(['group own by firm', 'own by firm', 'group own', 'groupownbyfirm']);

                    return {
                        groupName: gName ? String(gName).trim() : '',
                        address: getVal(['address']),
                        mobileNumber: mobile ? String(mobile).trim() : '',
                        email: email ? String(email).trim() : '',
                        groupPersonName: getVal(['group person name', 'person name', 'person']),
                        description: getVal(['description', 'desc']),
                        status: parseStatus(getVal(['status', 'status (active/inactive)'])),
                        groupOwnByFirm: groupOwn ? String(groupOwn).trim() : '',
                    };
                });

                setPreviewData(mappedData);
            } catch (err) {
                console.error('Error parsing excel:', err);
                showSnackbar('Failed to parse Excel file. Make sure it matches the template.', 'error');
            }
        };

        reader.readAsBinaryString(file);
    };

    const [importResults, setImportResults] = useState<{ successful: number, failed: number, errors: string[] } | null>(null);

    const bulkImportMutation = useMutation({
        mutationFn: clientGroupService.bulkCreateGroups,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['clientGroups'] });
            if (data.failed > 0) {
                setImportResults(data);
            } else {
                showSnackbar(`Successfully imported ${data.successful} groups!`, 'success');
                onClose();
            }
            setPreviewData([]);
            setFileName('');
        },
        onError: (err: any) => {
            const reqUrl = err?.config?.url || '';
            const reqBaseUrl = err?.config?.baseURL || '';
            const fullUrl = reqBaseUrl ? `${reqBaseUrl}${reqUrl}` : reqUrl;
            showSnackbar(`${err.response?.data?.message || 'Failed to perform bulk import'} (Requested URL: ${fullUrl})`, 'error');
        }
    });

    const handleConfirmImport = () => {
        if (previewData.length === 0) return;
        const validGroups = previewData.filter(g => 
            g.groupName && String(g.groupName).trim() &&
            g.mobileNumber && String(g.mobileNumber).trim()
        );

        if (validGroups.length === 0) {
            showSnackbar('No valid groups to import (Group Name and Phone/Mobile are required)', 'error');
            return;
        }

        const invalidCount = previewData.length - validGroups.length;
        if (invalidCount > 0) {
            if (!window.confirm(`${invalidCount} row(s) are missing required fields (Group Name or Phone/Mobile) and will be skipped. Do you want to proceed with importing the remaining ${validGroups.length} group(s)?`)) {
                return;
            }
        }

        setImportResults(null);
        bulkImportMutation.mutate({ groups: validGroups });
    };

    const handleReset = () => {
        setImportResults(null);
        setPreviewData([]);
        setFileName('');
    };

    const getValidGroupsCount = () => {
        return previewData.filter(g => 
            g.groupName && String(g.groupName).trim() &&
            g.mobileNumber && String(g.mobileNumber).trim()
        ).length;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                <Typography variant="h6" fontWeight="bold">Bulk Import Client Groups (Excel)</Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4, bgcolor: '#fbfbfb' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center', mt: 2 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
                        Download Template
                    </Button>
                    <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #FF602E 0%, #E25529 100%)' }}>
                        Upload Excel File
                        <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                    </Button>
                </Box>

                {importResults && (
                    <Box sx={{ mt: 2, p: 3, bgcolor: '#fff4f4', borderRadius: '12px', border: '1px solid #fecaca' }}>
                        <Typography variant="h6" color="error" fontWeight="bold" gutterBottom>
                            Import Completed with Errors
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Successfully imported <b>{importResults.successful}</b> groups. Failed to import <b>{importResults.failed}</b> groups.
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
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Previewing: <b>{fileName}</b> ({previewData.length} records)</Typography>
                        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: '12px' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Group Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Phone / Mobile</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Group Person Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Group Own By Firm</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, index) => {
                                        const isError = !row.groupName || !row.mobileNumber;
                                        return (
                                            <TableRow key={index} sx={{ bgcolor: isError ? '#ffebee' : 'inherit' }}>
                                                <TableCell>{(row.groupName as string) || <Typography variant="caption" color="error">Missing Group Name</Typography>}</TableCell>
                                                <TableCell>{(row.mobileNumber as string) || <Typography variant="caption" color="error">Missing Phone / Mobile</Typography>}</TableCell>
                                                <TableCell>{(row.email as string) || '-'}</TableCell>
                                                <TableCell>{(row.groupPersonName as string) || '-'}</TableCell>
                                                <TableCell>{(row.groupOwnByFirm as string) || '-'}</TableCell>
                                                <TableCell>{(row.address as string) || '-'}</TableCell>
                                                <TableCell>
                                                    {isError ? <Chip size="small" label="Missing Required" color="error" /> : <Chip size="small" label="Ready" color="success" />}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {previewData.length > 50 && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                                Showing first 50 rows only...
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
                        disabled={getValidGroupsCount() === 0 || bulkImportMutation.isPending}
                        sx={{ px: 4, borderRadius: '12px', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600 }}
                    >
                        {bulkImportMutation.isPending ? 'Importing...' : `Import ${getValidGroupsCount()} Groups`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
