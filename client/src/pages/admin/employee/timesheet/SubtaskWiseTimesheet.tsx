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
    CircularProgress,
    Grid
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { clientGroupService } from '../../../../services/clientGroupService';
import { staffService } from '../../../../services/staffService';
import { taskService } from '../../../../services/taskService';
import { masterService } from '../../../../services/masterService';

export const SubtaskWiseTimesheet: React.FC = () => {
    const [filterData, setFilterData] = useState({
        groupName: '',
        clientName: '',
        task: '',
        frequency: '',
        subTask: '',
        year: '',
        employee: '',
        status: '',
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

    const handleChange = (field: string) => (e: { target: { value: unknown } }) => {
        setFilterData({ ...filterData, [field]: e.target.value as string });
    };

    const handleClear = () => {
        setFilterData({
            groupName: '',
            clientName: '',
            task: '',
            frequency: '',
            subTask: '',
            year: '',
            employee: '',
            status: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Subtask Wise Timesheet</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Grid container spacing={3} alignItems="center">
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Group Name</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.groupName} onChange={handleChange('groupName')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose a Group...</MenuItem>
                                    {loadingGroups ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        groups.map((group: { _id: string; groupName: string }) => <MenuItem key={group._id} value={group._id}>{group.groupName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Client Name</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.clientName} onChange={handleChange('clientName')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose a Client...</MenuItem>
                                    {loadingClients ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        clients.map((client: { _id: string; name: string }) => <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Task</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.task} onChange={handleChange('task')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose a Task...</MenuItem>
                                    {loadingTasks ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        tasks.map((task: { _id: string; title: string }) => <MenuItem key={task._id} value={task._id}>{task.title}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Frequency</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.frequency} onChange={handleChange('frequency')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Select an Option</MenuItem>
                                    {frequencies.map((freq) => <MenuItem key={freq} value={freq}>{freq}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Row 3 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Sub Task</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.subTask} onChange={handleChange('subTask')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Select an Option</MenuItem>
                                    {loadingSubMasters ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        subMasters.map((subTask: { _id: string; name: string }) => <MenuItem key={subTask._id} value={subTask._id}>{subTask.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Year</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.year} onChange={handleChange('year')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose Year...</MenuItem>
                                    {years.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Row 4 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Employee</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.employee} onChange={handleChange('employee')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                    {loadingStaff ? <MenuItem disabled><CircularProgress size={20} /></MenuItem> :
                                        staff.map((s: { _id: string; name?: string; role?: string }) => <MenuItem key={s._id} value={s._id}>{s.name} {s.role ? `(${s.role})` : ''}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 0.5, md: 2 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 } }}>Status</Typography>
                            <FormControl size="small" fullWidth>
                                <Select displayEmpty value={filterData.status} onChange={handleChange('status')} sx={{ borderRadius: 1.5 }}>
                                    <MenuItem value="" disabled>Choose a Status...</MenuItem>
                                    {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Grid>

                    {/* Row 5 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Grid container spacing={1} alignItems="center">
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13, width: { xs: '100%', md: 100 }, mb: { xs: 0.5, md: 0 } }}>Date</Typography>
                            </Grid>
                            <Grid size={{ xs: 5, md: 4 }}>
                                <TextField fullWidth type="date" size="small" value={filterData.dateFrom} onChange={handleChange('dateFrom')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Grid>
                            <Grid size={{ xs: 2, md: 'auto' }} sx={{ display: 'flex', justifyContent: 'center' }}>
                                <Box sx={{ bgcolor: '#f0f0f0', px: 1, py: 0.5, border: '1px solid #ddd', borderRadius: 1, fontSize: '0.8rem' }}>To</Box>
                            </Grid>
                            <Grid size={{ xs: 5, md: 4 }}>
                                <TextField fullWidth type="date" size="small" value={filterData.dateTo} onChange={handleChange('dateTo')} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 'auto' }}>
                                <Button fullWidth variant="contained" color="error" onClick={handleClear} sx={{ minWidth: { xs: '100%', md: 40 }, p: 1 }}>
                                    <ClearIcon />
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
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
