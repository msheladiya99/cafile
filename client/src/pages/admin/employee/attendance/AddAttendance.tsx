import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Select,
    MenuItem,
    Button,
    TextField,
    Snackbar,
    Alert,
} from '@mui/material';
import { BulkImportAttendanceModal } from './BulkImportAttendanceModal';
import { GridView as GridViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { staffService } from '../../../../services/staffService';
import { attendanceService } from '../../../../services/attendanceService';

interface FormRowProps {
    label: string;
    required?: boolean;
    children?: React.ReactNode;
    vertical?: boolean;
}

const FormRow = ({ label, required, children, vertical }: FormRowProps) => {
    const childIsElement = React.isValidElement(children);
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ 
                display: 'flex', 
                alignItems: { xs: 'flex-start', sm: vertical ? 'flex-start' : 'center' }, 
                flexDirection: { xs: 'column', sm: vertical ? 'column' : 'row' }, 
                gap: { xs: 1, sm: vertical ? 0.5 : 0 } 
            }}>
                <Typography sx={{ 
                    width: { xs: '100%', sm: vertical ? '100%' : '160px' }, 
                    color: 'text.secondary', 
                    fontSize: '0.85rem', 
                    fontWeight: 600, 
                    pt: { xs: 0, sm: !vertical && childIsElement && (children as React.ReactElement<{ multiline?: boolean }>).props.multiline ? 1 : 0 }, 
                    flexShrink: 0 
                }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <Box sx={{ flex: 1, width: '100%' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

interface SectionProps {
    title: string;
    icon: React.ReactElement<{ sx?: Record<string, unknown> }>;
    children?: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
    <Paper variant="outlined" sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#f5f7fa', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {React.cloneElement(icon, { sx: { width: 20, height: 20, color: 'text.secondary' } })}
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            {children}
        </Box>
    </Paper>
);

export const AddAttendance: React.FC = () => {
    const navigate = useNavigate();
    
    const [bulkImportOpen, setBulkImportOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const [formData, setFormData] = useState({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        inTime: '10:17',
        outTime: '22:17',
        description: '',
        status: 'Present',
        workHours: '00:00',
        breakTime: '00:00',
        overtime: '00:00'
    });

    const { data: staffList } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffService.getStaff()
    });

    const saveMutation = useMutation({
        mutationFn: attendanceService.createAttendance,
        onSuccess: () => {
            navigate('/admin/employee/attendance/list');
        },
        onError: (error) => {
            console.error('Failed to save attendance:', error);
            alert('Failed to save attendance. Please make sure all required fields are filled.');
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInputChange = (e: any) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = () => {
        if (!formData.employee || !formData.date) {
            alert('Please select an employee and date.');
            return;
        }

        saveMutation.mutate({
            employee: formData.employee,
            date: formData.date,
            inTime: formData.inTime || undefined,
            outTime: formData.outTime || undefined,
            description: formData.description,
            status: formData.status,
            workHours: formData.workHours,
            breakTime: formData.breakTime,
            overtime: formData.overtime
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="600">Add Attendance</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => navigate('/admin/employee/attendance/add')}>Add New</Button>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => setBulkImportOpen(true)}>
                            Import Excel
                        </Button>
                        <Button size="small" variant="contained" sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => navigate('/admin/employee/attendance/list')}>List</Button>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ maxWidth: 800 }}>
                <Section title="Attendance Details" icon={<GridViewIcon />}>
                    <FormRow label="Employee" required>
                        <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            name="employee"
                            value={formData.employee}
                            onChange={handleInputChange}
                            sx={{ borderRadius: '8px', color: formData.employee ? 'text.primary' : 'text.secondary' }}
                        >
                            <MenuItem value="" disabled>Choose a Employee...</MenuItem>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {staffList?.map((staff: any) => (
                                <MenuItem key={staff._id} value={staff._id}>
                                    {staff.firstName} {staff.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormRow>

                    <FormRow label="Date" required>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="In Time">
                        <TextField
                            fullWidth
                            size="small"
                            type="time"
                            name="inTime"
                            value={formData.inTime}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="Out Time">
                        <TextField
                            fullWidth
                            size="small"
                            type="time"
                            name="outTime"
                            value={formData.outTime}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="Status" required>
                        <Select
                            fullWidth
                            size="small"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            sx={{ borderRadius: '8px' }}
                        >
                            <MenuItem value="Present">Present</MenuItem>
                            <MenuItem value="Absent">Absent</MenuItem>
                            <MenuItem value="Weekly Off">Weekly Off</MenuItem>
                        </Select>
                    </FormRow>

                    <FormRow label="Work Hours">
                        <TextField
                            fullWidth
                            size="small"
                            name="workHours"
                            placeholder="e.g. 09:28"
                            value={formData.workHours}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="Break Time">
                        <TextField
                            fullWidth
                            size="small"
                            name="breakTime"
                            placeholder="e.g. 00:00"
                            value={formData.breakTime}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="Overtime (OT)">
                        <TextField
                            fullWidth
                            size="small"
                            name="overtime"
                            placeholder="e.g. 00:00"
                            value={formData.overtime}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>

                    <FormRow label="Description">
                        <TextField
                            fullWidth
                            size="small"
                            multiline
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </FormRow>
                </Section>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none' }}
                    >
                        {saveMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/admin/employee/attendance/list')}
                        sx={{ bgcolor: '#ff6c60', color: 'white', textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>

            <BulkImportAttendanceModal
                open={bulkImportOpen}
                onClose={() => {
                    setBulkImportOpen(false);
                    // Redirect to lists to show the newly imported records
                    navigate('/admin/employee/attendance/list');
                }}
                showSnackbar={showSnackbar}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '8px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
