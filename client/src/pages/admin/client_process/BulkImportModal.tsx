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
import { adminService } from '../../../services/adminService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClientGroup } from '../../../services/clientGroupService';
import type { ITStatus, SubMaster } from '../../../services/masterService';
import type { User } from '../../../types';

interface BulkImportModalProps {
    open: boolean;
    onClose: () => void;
    itStatuses: ITStatus[];
    groups: ClientGroup[];
    subMasters: SubMaster[];
    staffList: User[];
    showSnackbar: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const EXCEL_FIELDS = [
    'Firm Name*', 'Email*', 'Mobile Number*', 'PAN Number', 'GST Number', 'Aadhar Number',
    'Proprietor Name',
    'Custom Username', 'Client Code', 'Group Name', 'IT Status', 'Master Type', 'Sub Master',
    'Date of Birth', 'Address', 'Country', 'State', 'City', 'Pincode', 'Currency',
    'Incorporation Date From', 'Incorporation Date To', 'Licence No', 'Licence Authority', 'TRN No',
    'Description', 'Support Employee (Username)', 'Status (Active/Inactive)', 'Financial Year',
    'Alt Address', 'Alt Phone M', 'Alt Phone L', 'Alt Fax',
    'Extra Field 1', 'Extra Field 2', 'Extra Field 3', 'Extra Field 4', 'Extra Field 5', 'Extra Field 6', 'Extra Field 7'
];

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
    open, onClose, itStatuses, groups, subMasters, staffList, showSnackbar
}) => {
    const queryClient = useQueryClient();
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
    const [fileName, setFileName] = useState('');

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([EXCEL_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Client Template");
        XLSX.writeFile(wb, "Client_Bulk_Import_Template.xlsx");
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
                    const findId = <T extends { _id?: string }>(list: T[], val: unknown, keyName: keyof T) => {
                        if (typeof val !== 'string' || !val) return undefined;
                        const found = list.find(item => String(item[keyName] || '').toLowerCase() === val.toLowerCase());
                        return found ? found._id : undefined;
                    };
                    const findUserByUsername = (val: unknown) => {
                        if (typeof val !== 'string' || !val) return undefined;
                        const found = staffList.find(u => u.username?.toLowerCase() === val.toLowerCase());
                        return found ? found._id : undefined;
                    };

                    const formatDate = (val: unknown) => {
                        if (!val) return undefined;
                        if (val instanceof Date) return val.toISOString().split('T')[0];
                        return val;
                    };

                    const parseStatus = (val: unknown) => {
                        if (typeof val !== 'string' || !val) return true;
                        if (val.toLowerCase() === 'inactive' || val.toLowerCase() === 'false') return false;
                        return true;
                    };

                    return {
                        name: (row['Firm Name*'] || row['Client Name*']) as string,
                        proprietorName: row['Proprietor Name'] ? String(row['Proprietor Name']) : undefined,
                        email: row['Email*'],
                        phone: row['Mobile Number*'] ? String(row['Mobile Number*']) : undefined,
                        panNumber: row['PAN Number'] ? String(row['PAN Number']) : undefined,
                        gstNumber: row['GST Number'] ? String(row['GST Number']) : undefined,
                        aadharNumber: row['Aadhar Number'] ? String(row['Aadhar Number']) : undefined,
                        username: row['Custom Username'],
                        clientCode: row['Client Code'],
                        masterType: row['Master Type'] || 'Client',
                        financialYear: row['Financial Year'] || 'april-march',
                        address: row['Address'],
                        country: row['Country'],
                        state: row['State'],
                        city: row['City'],
                        postalCode: row['Pincode'],
                        currency: row['Currency'],
                        licenceNo: row['Licence No'],
                        licenceAuthority: row['Licence Authority'],
                        trnNo: row['TRN No'],
                        description: row['Description'],
                        status: parseStatus(row['Status (Active/Inactive)']),
                        birthDate: formatDate(row['Date of Birth']),
                        incorporationDateFrom: formatDate(row['Incorporation Date From']),
                        incorporationDateTo: formatDate(row['Incorporation Date To']),
                        altAddress: row['Alt Address'],
                        altPhoneM: row['Alt Phone M'],
                        altPhoneL: row['Alt Phone L'],
                        altFax: row['Alt Fax'],
                        extraField1: row['Extra Field 1'],
                        extraField2: row['Extra Field 2'],
                        extraField3: row['Extra Field 3'],
                        extraField4: row['Extra Field 4'],
                        extraField5: row['Extra Field 5'],
                        extraField6: row['Extra Field 6'],
                        extraField7: row['Extra Field 7'],

                        // Relationships mapping
                        groupName: findId(groups, row['Group Name'], 'groupName'),
                        itStatus: findId(itStatuses, row['IT Status'], 'name'),
                        subMaster: findId(subMasters, row['Sub Master'], 'name'),
                        supportEmployee: findUserByUsername(row['Support Employee (Username)']),

                        // Raw values for table view
                        _rawGroupName: row['Group Name'],
                        _rawItStatus: row['IT Status']
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
        mutationFn: adminService.bulkCreateClients,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            if (data.failed > 0) {
                setImportResults(data);
            } else {
                showSnackbar(`Successfully imported ${data.successful} clients!`, 'success');
                onClose();
            }
            setPreviewData([]);
            setFileName('');
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            showSnackbar(error.response?.data?.message || 'Failed to perform bulk import', 'error');
        }
    });

    const handleConfirmImport = () => {
        if (previewData.length === 0) return;
        setImportResults(null);
        bulkImportMutation.mutate({ clients: previewData });
    };

    const handleReset = () => {
        setImportResults(null);
        setPreviewData([]);
        setFileName('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                <Typography variant="h6" fontWeight="bold">Bulk Import Clients (Excel)</Typography>
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
                            Successfully imported <b>{importResults.successful}</b> clients. Failed to import <b>{importResults.failed}</b> clients.
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
                                        <TableCell sx={{ fontWeight: 'bold' }}>Firm Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Proprietor Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>PAN</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Group</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, index) => {
                                        const isError = !row.name || !row.email || !row.phone;
                                        return (
                                            <TableRow key={index} sx={{ bgcolor: isError ? '#ffebee' : 'inherit' }}>
                                                <TableCell>{row.name as string}</TableCell>
                                                <TableCell>{(row.proprietorName as string) || '-'}</TableCell>
                                                <TableCell>{row.email as string}</TableCell>
                                                <TableCell>{(row.panNumber as string) || '-'}</TableCell>
                                                <TableCell>{(row._rawGroupName as string) || '-'}</TableCell>
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
                        disabled={previewData.length === 0 || bulkImportMutation.isPending}
                        sx={{ px: 4, borderRadius: '12px', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600 }}
                    >
                        {bulkImportMutation.isPending ? 'Importing...' : `Import ${previewData.length} Clients`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};





