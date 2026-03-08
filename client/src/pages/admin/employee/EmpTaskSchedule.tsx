import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    Select,
    FormControl,
    Button,
    TextField,
    CircularProgress
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { staffService } from '../../../services/staffService';
import { taskService } from '../../../services/taskService';
import { masterService } from '../../../services/masterService';

export const EmpTaskSchedule: React.FC = () => {
    const [filterData, setFilterData] = useState({
        groupName: '',
        clientName: '',
        department: '',
        employee: '',
        task: '',
        frequency: '',
        subTask: '',
        year: '',
        status: '',
        dateType: '',
        dateFrom: '',
        dateTo: ''
    });

    // Fetch Lists
    const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: groups = [], isLoading: loadingGroups } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: staff = [], isLoading: loadingStaff } = useQuery({ queryKey: ['staff'], queryFn: staffService.getStaff });
    const { data: tasks = [], isLoading: loadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.getTasks() });
    const { data: subMasters = [], isLoading: loadingSubMasters } = useQuery({ queryKey: ['subMasters'], queryFn: masterService.getSubMasters });

    const frequencies = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    const years = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
    const statuses = ['PENDING', 'STARTED', 'UNDER_REVIEW', 'DONE', 'CANCELLED'];
    const departments = ['IT', 'HR', 'Admin', 'Finance', 'Sales', 'Marketing'];

    const handleChange = (field: string) => (e: { target: { value: unknown } }) => {
        setFilterData({ ...filterData, [field]: e.target.value as string });
    };

    const handleClear = () => {
        setFilterData({
            groupName: '',
            clientName: '',
            department: '',
            employee: '',
            task: '',
            frequency: '',
            subTask: '',
            year: '',
            status: '',
            dateType: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Task Schedule</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(12, 1fr)' }} gap={3} alignItems="center">

                    {/* Row 1 */}
                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Group Name</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.groupName} onChange={handleChange('groupName')}>
                                    <MenuItem value="" disabled>Choose a Group...</MenuItem>
                                    {loadingGroups ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        groups.map((group: { _id: string; groupName: string }) => <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Client Name</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.clientName} onChange={handleChange('clientName')}>
                                    <MenuItem value="" disabled>Choose a Client...</MenuItem>
                                    {loadingClients ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        clients.map((client: { _id: string; name: string }) => <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 2 */}
                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Department</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.department} onChange={handleChange('department')}>
                                    <MenuItem value="" disabled>Choose a Department...</MenuItem>
                                    {departments.map((dept) => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Employee</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.employee} onChange={handleChange('employee')}>
                                    <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                    {loadingStaff ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        staff.map((s: { _id: string; name?: string; role?: string }) => <MenuItem key={s._id} value={s._id}>{s.name} {s.role ? `(${s.role})` : ''}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 3 */}
                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Task</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.task} onChange={handleChange('task')}>
                                    <MenuItem value="" disabled>Choose a Task...</MenuItem>
                                    {loadingTasks ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        tasks.map((task: { _id: string; title: string }) => <MenuItem key={task._id} value={task._id}>{task.title}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Frequency</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.frequency} onChange={handleChange('frequency')}>
                                    <MenuItem value="" disabled>Choose a Frequency...</MenuItem>
                                    {frequencies.map((freq) => <MenuItem key={freq} value={freq}>{freq}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 4 */}
                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Sub Task</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.subTask} onChange={handleChange('subTask')}>
                                    <MenuItem value="" disabled>Choose a Subtask...</MenuItem>
                                    {loadingSubMasters ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        subMasters.map((subTask: { _id: string; name: string }) => <MenuItem key={subTask._id} value={subTask._id}>{subTask.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Year</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.year} onChange={handleChange('year')}>
                                    <MenuItem value="" disabled>Choose Year...</MenuItem>
                                    {years.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    {/* Row 5 */}
                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: 100 }}>Status</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.status} onChange={handleChange('status')}>
                                    <MenuItem value="" disabled>Choose a Status...</MenuItem>
                                    {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Box gridColumn={{ xs: 'span 1', md: 'span 6' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <FormControl size="small" sx={{ width: 140, flexShrink: 0 }}>
                                <Select displayEmpty value={filterData.dateType} onChange={handleChange('dateType')}>
                                    <MenuItem value="" disabled>On Effective ...</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField type="date" size="small" value={filterData.dateFrom} onChange={handleChange('dateFrom')} sx={{ flex: 1 }} />
                            <Box sx={{ bgcolor: '#f0f0f0', px: 2, py: 1, border: '1px solid #ddd' }}>To</Box>
                            <TextField type="date" size="small" value={filterData.dateTo} onChange={handleChange('dateTo')} sx={{ flex: 1 }} />
                            <Button variant="contained" color="error" onClick={handleClear} sx={{ minWidth: 40, p: 1 }}>
                                <ClearIcon />
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>Job List</Typography>
                    </Box>
                </Box>

                <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontWeight: 600 }}>
                    <Typography variant="body2">No Record Found</Typography>
                </Box>
            </Paper>
        </Box>
    );
};
