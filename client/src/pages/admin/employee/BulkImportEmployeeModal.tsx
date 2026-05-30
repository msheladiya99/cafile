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
import { staffService } from '../../../services/staffService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkImportEmployeeModalProps {
    open: boolean;
    onClose: () => void;
    showSnackbar: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const EXCEL_FIELDS = [
    'First Name', 'Last Name', 'Email', 'Mobile Number', 'Phone', 'Employee Code', 'Role (ADMIN/MANAGER/STAFF/INTERN)', 'Designation',
    'Custom Username', 'Custom Password', 'Address', 'Country', 'State', 'City', 'Postal Code',
    'Birth Date', 'Joining Date', 'Monthly Salary', 'Rate Per Hours', 'Leaving Date', 'Reference', 'Description', 'Status (Active/Inactive)',
    'PF Number', 'ESI Number', 'Aadhar No.', 'PAN No.', 'Driving Licence No',
    'Passport No', 'Passport Authority', 'Passport Date From', 'Passport Date To',
    'Visa No', 'Visa Authority', 'Visa Date From', 'Visa Date To',
    'EID No', 'EID Authority', 'EID Date From', 'EID Date To',
    'Bank Name', 'Bank Branch', 'Account No', 'Account Holder Name', 'IFSC Code', 'Bank Address',
    'Extra Field 1', 'Extra Field 2', 'Extra Field 3', 'Extra Field 4', 'Extra Field 5', 'Extra Field 6', 'Extra Field 7'
];

export const BulkImportEmployeeModal: React.FC<BulkImportEmployeeModalProps> = ({
    open, onClose, showSnackbar
}) => {
    const queryClient = useQueryClient();
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
    const [fileName, setFileName] = useState('');

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([EXCEL_FIELDS]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Template");
        XLSX.writeFile(wb, "Employee_Bulk_Import_Template.xlsx");
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

                    const rawRole = getVal(['role (admin/manager/staff/intern)', 'role']) as string;
                    let cleanRole = 'STAFF';
                    if (rawRole) {
                        const uppercased = rawRole.trim().toUpperCase();
                        if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(uppercased)) {
                            cleanRole = uppercased;
                        }
                    }

                    const passportNoVal = getVal(['passport no']);
                    const visaNoVal = getVal(['visa no']);
                    const eidNoVal = getVal(['eid no']);

                    return {
                        firstName: getVal(['first name']) ? String(getVal(['first name'])).trim() : '',
                        lastName: getVal(['last name']) ? String(getVal(['last name'])).trim() : '',
                        email: getVal(['email']) ? String(getVal(['email'])).trim() : undefined,
                        mobileNumber: getVal(['mobile number', 'mobile']) ? String(getVal(['mobile number', 'mobile'])) : undefined,
                        phone: getVal(['phone']) ? String(getVal(['phone'])) : undefined,
                        employeeCode: getVal(['employee code', 'code']) ? String(getVal(['employee code', 'code'])) : undefined,
                        role: cleanRole,
                        designation: getVal(['designation']) ? String(getVal(['designation'])).trim() : undefined,
                        username: getVal(['custom username', 'username']),
                        password: getVal(['custom password', 'password']),
                        address: getVal(['address']),
                        country: getVal(['country']),
                        state: getVal(['state']),
                        city: getVal(['city']),
                        postalCode: getVal(['postal code', 'postalcode', 'pincode', 'zip']),
                        birthDate: formatDate(getVal(['birth date', 'dob', 'birthdate'])),
                        joiningDate: formatDate(getVal(['joining date'])),
                        monthlySalary: getVal(['monthly salary', 'salary']) ? String(getVal(['monthly salary', 'salary'])) : undefined,
                        ratePerHours: getVal(['rate per hours', 'rate']) ? String(getVal(['rate per hours', 'rate'])) : undefined,
                        leavingDate: formatDate(getVal(['leaving date'])),
                        reference: getVal(['reference']),
                        description: getVal(['description']),
                        status: parseStatus(getVal(['status', 'status (active/inactive)'])),

                        pfNumber: getVal(['pf number', 'pf']),
                        esiNumber: getVal(['esi number', 'esi']),
                        aadharNumber: getVal(['aadhar number', 'aadhar', 'aadhar no.']),
                        panNumber: getVal(['pan number', 'pan', 'pan no.']),
                        drivingLicenceNo: getVal(['driving licence no', 'licence']),

                        passport: !!passportNoVal,
                        passportNo: passportNoVal ? String(passportNoVal) : undefined,
                        passportAuthority: getVal(['passport authority']),
                        passportDateFrom: formatDate(getVal(['passport date from'])),
                        passportDateTo: formatDate(getVal(['passport date to'])),

                        visa: !!visaNoVal,
                        visaNo: visaNoVal ? String(visaNoVal) : undefined,
                        visaAuthority: getVal(['visa authority']),
                        visaDateFrom: formatDate(getVal(['visa date from'])),
                        visaDateTo: formatDate(getVal(['visa date to'])),

                        eid: !!eidNoVal,
                        eidNo: eidNoVal ? String(eidNoVal) : undefined,
                        eidAuthority: getVal(['eid authority']),
                        eidDateFrom: formatDate(getVal(['eid date from'])),
                        eidDateTo: formatDate(getVal(['eid date to'])),

                        bankName: getVal(['bank name']),
                        bankBranch: getVal(['bank branch']),
                        accountNo: getVal(['account no', 'account number']),
                        accountHolderName: getVal(['account holder name', 'holder name']),
                        ifscCode: getVal(['ifsc code', 'ifsc']),
                        bankAddress: getVal(['bank address']),

                        field1: getVal(['extra field 1']),
                        field2: getVal(['extra field 2']),
                        field3: getVal(['extra field 3']),
                        field4: getVal(['extra field 4']),
                        field5: getVal(['extra field 5']),
                        field6: getVal(['extra field 6']),
                        field7: getVal(['extra field 7']),
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
        mutationFn: staffService.bulkCreateStaff,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            if (data.failed > 0) {
                setImportResults(data);
            } else {
                showSnackbar(`Successfully imported ${data.successful} employees!`, 'success');
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
        const validStaff = previewData.filter(s => s.firstName && String(s.firstName).trim());
        if (validStaff.length === 0) {
            showSnackbar('No valid employees to import (First Name is required)', 'error');
            return;
        }

        const invalidCount = previewData.length - validStaff.length;
        if (invalidCount > 0) {
            if (!window.confirm(`${invalidCount} row(s) are missing a First Name and will be skipped. Do you want to proceed with importing the remaining ${validStaff.length} employee(s)?`)) {
                return;
            }
        }

        setImportResults(null);
        bulkImportMutation.mutate({ staff: validStaff });
    };

    const handleReset = () => {
        setImportResults(null);
        setPreviewData([]);
        setFileName('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>
                <Typography variant="h6" fontWeight="bold">Bulk Import Employees (Excel)</Typography>
                <IconButton onClick={onClose} sx={{ color: '#1e293b' }} aria-label="Close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4, bgcolor: '#fbfbfb' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center', mt: 2 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}>
                        Download Template
                    </Button>
                    <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' } }}>
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
                            Successfully imported <b>{importResults.successful}</b> employees. Failed to import <b>{importResults.failed}</b> employees.
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
                                        <TableCell sx={{ fontWeight: 'bold' }}>First Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Last Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Designation</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {previewData.slice(0, 50).map((row, index) => {
                                        const isError = !row.firstName;
                                        return (
                                            <TableRow key={index} sx={{ bgcolor: isError ? '#ffebee' : 'inherit' }}>
                                                <TableCell>{row.firstName as string}</TableCell>
                                                <TableCell>{row.lastName as string}</TableCell>
                                                <TableCell>{row.role as string}</TableCell>
                                                <TableCell>{(row.designation as string) || '-'}</TableCell>
                                                <TableCell>{(row.email as string) || '-'}</TableCell>
                                                <TableCell>{(row.username as string) || '-'}</TableCell>
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
                        disabled={previewData.filter(s => s.firstName && String(s.firstName).trim()).length === 0 || bulkImportMutation.isPending}
                        sx={{ px: 4, borderRadius: '12px', bgcolor: '#6366f1', color: '#ffffff', fontWeight: 600, '&:hover': { bgcolor: '#4338ca' } }}
                    >
                        {bulkImportMutation.isPending ? 'Importing...' : `Import ${previewData.filter(s => s.firstName && String(s.firstName).trim()).length} Employees`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
