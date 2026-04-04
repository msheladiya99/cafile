import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Select,
    MenuItem,
    Button,
    TextField,
    Checkbox,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { staffService } from '../../../../services/staffService';
import { attendanceService } from '../../../../services/attendanceService';

export const AddAttendance: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        inTimeChecked: false,
        inTime: '10:17',
        outTimeChecked: false,
        outTime: '22:17',
        description: ''
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
            inTime: formData.inTimeChecked ? formData.inTime : undefined,
            outTime: formData.outTimeChecked ? formData.outTime : undefined,
            description: formData.description
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
                        <Button size="small" variant="contained" sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', textTransform: 'none', boxShadow: 'none' }} onClick={() => navigate('/admin/employee/attendance/list')}>List</Button>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ p: 4, mb: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Grid container spacing={4} sx={{ maxWidth: 800 }}>
                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 0.5, sm: 2 } }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: { xs: '100%', sm: '120px' }, flexShrink: 0 }}>
                            Employee <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <Select
                            fullWidth
                            size="small"
                            displayEmpty
                            name="employee"
                            value={formData.employee}
                            onChange={handleInputChange}
                            sx={{ borderRadius: '8px' }}
                        >
                            <MenuItem value="" disabled>Choose a Employee...</MenuItem>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {staffList?.map((staff: any) => (
                                <MenuItem key={staff._id} value={staff._id}>
                                    {staff.firstName} {staff.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 0.5, sm: 2 } }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: { xs: '100%', sm: '120px' }, flexShrink: 0 }}>
                            Date <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 0.5, sm: 2 } }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: { xs: '100%', sm: '120px' }, flexShrink: 0 }}>
                            In Time <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                            <Checkbox
                                name="inTimeChecked"
                                checked={formData.inTimeChecked}
                                onChange={handleInputChange}
                                sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' }, p: { xs: 0, sm: 1 } }}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                type="time"
                                name="inTime"
                                value={formData.inTime}
                                onChange={handleInputChange}
                                disabled={!formData.inTimeChecked}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 0.5, sm: 2 } }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: { xs: '100%', sm: '120px' }, flexShrink: 0 }}>
                            Out Time
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                            <Checkbox
                                name="outTimeChecked"
                                checked={formData.outTimeChecked}
                                onChange={handleInputChange}
                                sx={{ color: '#667eea', '&.Mui-checked': { color: '#667eea' }, p: { xs: 0, sm: 1 } }}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                type="time"
                                name="outTime"
                                value={formData.outTime}
                                onChange={handleInputChange}
                                disabled={!formData.outTimeChecked}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', gap: { xs: 0.5, sm: 2 } }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', width: { xs: '100%', sm: '120px' }, flexShrink: 0, pt: { xs: 0, sm: 1 } }}>
                            Description
                        </Typography>
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
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none' }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/admin/employee/attendance/list')}
                            sx={{ bgcolor: '#ff6c60', color: 'white', textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};





