import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    MenuItem,
    Select,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    IconButton,
} from '@mui/material';
import {
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    FactCheck as TaskIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { TaskMasterData, Client, User } from '../../../types';

export const ApprovedTaskList: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [reportingManager, setReportingManager] = useState('');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // Fetch data for dropdowns
    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: clientGroups = [] } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departments = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2,
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <TaskIcon />
                    <Typography variant="h6" fontWeight="500">Approved Task List</Typography>
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: '#8d6e63',
                            '&:hover': { bgcolor: '#795548' },
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        Approve Task
                    </Button>
                </Box>
            </Paper>

            {/* Search Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* First Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName} onChange={(e) => setGroupName(e.target.value)}>
                                <MenuItem value=""><em>Choose a Group...</em></MenuItem>
                                {clientGroups.map((g: { _id: string; groupName: string }) => (
                                    <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Client Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={clientName} onChange={(e) => setClientName(e.target.value)}>
                                <MenuItem value=""><em>Choose a Client...</em></MenuItem>
                                {clients.map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Second Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Department</Typography>
                            <Select size="small" fullWidth displayEmpty value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <MenuItem value=""><em>Choose a Department...</em></MenuItem>
                                {departments.map((d) => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                                <MenuItem value=""><em>Choose a Task...</em></MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Third Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                            <Select size="small" fullWidth displayEmpty value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value=""><em>Choose a Frequency...</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Fourth Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Reporting Manager</Typography>
                            <Select size="small" fullWidth displayEmpty value={reportingManager} onChange={(e) => setReportingManager(e.target.value)}>
                                <MenuItem value=""><em>Choose a Employee...</em></MenuItem>
                                {staffUsers.filter(u => ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(u.role)).map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results List Section */}
            <Paper elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5,
                    bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="500">Approved Task List</Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white' }}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>
                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell align="center" colSpan={10} sx={{ color: 'text.secondary', py: 6 }}>
                                    No Record Found
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ApprovedTaskList;





