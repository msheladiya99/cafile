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
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    Chip,
    Alert,
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
import { taskService } from '../../../services/taskService';
import type { TaskMasterData, Client, User, Task } from '../../../types';

export const ApprovedTaskList: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState('');
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

    // Fetch Approved Tasks
    const { data: tasks = [], isLoading, isError, error, refetch } = useQuery<Task[]>({
        queryKey: ['tasksApproved', groupName, clientName, department, selectedTask, frequency, year, reportingManager],
        queryFn: () => taskService.getTasks({
            status: 'APPROVED', 
            clientId: clientName || undefined,
            clientGroupId: groupName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            year: year || undefined,
            department: department || undefined,
            reportingManager: reportingManager || undefined
        })
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departmentsList = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];

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
                    <TaskIcon sx={{ color: '#10b981' }} />
                    <Typography variant="h6" fontWeight="700">Approved Task List</Typography>
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: '#8d6e63',
                            '&:hover': { bgcolor: '#795548' },
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px'
                        }}
                    >
                        Export List
                    </Button>
                </Box>
            </Paper>

            {/* Search Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px', borderBottom: '1px solid #e2e8f0' }}>
                <Grid container spacing={3}>
                    {/* First Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName} onChange={(e) => setGroupName(e.target.value)}>
                                <MenuItem value="">All Groups</MenuItem>
                                {(clientGroups || []).map((g: any) => (
                                    <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Client Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={clientName} onChange={(e) => setClientName(e.target.value)}>
                                <MenuItem value="">All Clients</MenuItem>
                                {(clients || []).map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Second Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Department</Typography>
                            <Select size="small" fullWidth displayEmpty value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <MenuItem value="">All Departments</MenuItem>
                                {departmentsList.map((d) => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                                <MenuItem value="">All Tasks</MenuItem>
                                {(taskMasters || []).map((t: TaskMasterData) => (
                                    <MenuItem key={t._id} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Third Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Frequency</Typography>
                            <Select size="small" fullWidth displayEmpty value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value="">All Frequencies</MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value="">All Years</MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Fourth Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Reporting Manager</Typography>
                            <Select size="small" fullWidth displayEmpty value={reportingManager} onChange={(e) => setReportingManager(e.target.value)}>
                                <MenuItem value="">All Personnel</MenuItem>
                                {(staffUsers || []).map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load approved tasks: {(error as Error).message}
                    <Button size="small" onClick={() => refetch()} sx={{ ml: 2 }}>Retry</Button>
                </Alert>
            )}

            {/* Results List Section */}
            <Paper elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5,
                    bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="700" variant="body2">Approved Task List ({tasks.length})</Typography>
                    </Box>
                    <IconButton size="small">
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>
                <TableContainer sx={{ minHeight: 200, bgcolor: '#ffffff' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Client / Group</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Task Description</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Year</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Approval Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={24} sx={{ mb: 1 }} />
                                        <Typography variant="body2" color="textSecondary">Loading approved tasks...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 10 }}>
                                        <Typography variant="body1" fontWeight="500">No Record Found</Typography>
                                        <Typography variant="caption">Tasks will appear here once they are approved by an admin</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : tasks.map((task: Task, index: number) => (
                                <TableRow key={task._id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700}>{(task.clientId as any)?.name || 'Internal'}</Typography>
                                        {(task.clientGroupId as any)?.groupName && (
                                            <Typography variant="caption" color="textSecondary">{(task.clientGroupId as any).groupName}</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                                        <Typography variant="caption" color="textSecondary">{(task as any).frequency || '-'}</Typography>
                                    </TableCell>
                                    <TableCell>{(task as any).year || '-'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label="APPROVED" 
                                            size="small" 
                                            sx={{ height: 20, bgcolor: '#f0fdf4', color: '#10b981', fontWeight: 700, fontSize: '0.65rem' }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('en-IN') : '-'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ApprovedTaskList;
