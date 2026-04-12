import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Chip,
    Alert,
} from '@mui/material';
import {
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    FactCheck as TaskIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { taskService } from '../../../services/taskService';
import { clientGroupService, type ClientGroup } from '../../../services/clientGroupService';
import type { TaskMasterData, Client, User, Task, TaskStatus } from '../../../types';

export const UpdateApprovedTask: React.FC = () => {
    // Selection States
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const cur = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const curFinYear = curMonth >= 4 ? `${cur}-${cur + 1}` : `${cur - 1}-${cur}`;
    const [year, setYear] = useState(curFinYear);
    const [reportingManager, setReportingManager] = useState('');
    const [uiStatus, setUiStatus] = useState('');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 8 }, (_, i) => {
            const y = currentYear - 4 + i;
            return `${y}-${y + 1}`;
        });
    }, []);

    // Fetch data for dropdowns
    const { data: taskMasters = [] } = useQuery({ queryKey: ['taskMasters'], queryFn: taskMasterService.getTaskMasters });
    const { data: clientGroups = [] } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: staffUsers = [] } = useQuery<User[]>({ queryKey: ['staffUsers'], queryFn: adminService.getStaffUsers });

    // Status Mapping
    const statusMap: Record<string, TaskStatus> = {
        'Pending': 'PENDING',
        'In Progress': 'IN_PROCESS',
        'Completed': 'DONE',
        'On Hold': 'ON_HOLD',
        'Cancelled': 'CANCELLED'
    };

    // Fetch tasks for the list
    const { data: tasks = [], isLoading, isError, error, refetch } = useQuery<Task[]>({
        queryKey: ['tasksUpdate', groupName, clientName, department, selectedTask, frequency, year, reportingManager, uiStatus],
        queryFn: () => taskService.getTasks({
            clientId: clientName || undefined,
            clientGroupId: groupName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            year: year || undefined,
            department: department || undefined,
            reportingManager: reportingManager || undefined,
            status: uiStatus ? statusMap[uiStatus] : undefined
        })
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departmentsList = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];
    const taskStatusOptions = Object.keys(statusMap);

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2,
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <TaskIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" fontWeight="700">Update Approved Task</Typography>
            </Paper>

            {/* Selection Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px', borderBottom: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName} onChange={(e) => setGroupName(e.target.value)}>
                                <MenuItem value="">All Groups</MenuItem>
                                {(clientGroups as ClientGroup[] || []).map((g) => (
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

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Department</Typography>
                            <Select size="small" fullWidth displayEmpty value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <MenuItem value="">All Depts</MenuItem>
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

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
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
                                <MenuItem value="">Choose Year</MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

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
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Task Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={uiStatus} onChange={(e) => setUiStatus(e.target.value)}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {taskStatusOptions.map(s => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Accordion */}
            <Accordion sx={{ mb: 1, boxShadow: 1, borderRadius: '4px !important', bgcolor: '#f1f5f9' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <TaskIcon fontSize="small" sx={{ color: '#475569' }} />
                        <Typography fontWeight="700" variant="body2">Fill Global Data</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'white' }}>
                    <Typography variant="body2" color="text.secondary">Global data optimization fields would appear here to update multiple records at once.</Typography>
                </AccordionDetails>
            </Accordion>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to fetch data: {(error as Error).message}
                    <IconButton size="small" onClick={() => refetch()}><CloseIcon /></IconButton>
                </Alert>
            )}

            {/* List Section */}
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
                        <Typography fontWeight="700" variant="body2">Job List ({tasks.length})</Typography>
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
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Task Particulars</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Frequency</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 10 }}>
                                        <Typography variant="body1" fontWeight="500">No Record Found</Typography>
                                        <Typography variant="caption" color="textDisabled">Try varying your search filters</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : tasks.map((task, index) => (
                                <TableRow key={task._id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={700}>{(task.clientId as unknown as Client)?.name || 'Internal'}</Typography>
                                        <Typography variant="caption" color="textSecondary">{(task.clientGroupId as ClientGroup)?.groupName}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                                        <Typography variant="caption" color="textSecondary">{task.priority}</Typography>
                                    </TableCell>
                                    <TableCell>{(task as Task).frequency || '-'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={task.status.replace(/_/g, ' ')} 
                                            size="small" 
                                            sx={{ 
                                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                                bgcolor: task.status === 'DONE' ? '#f0fdf4' : (task.status === 'IN_PROCESS' ? '#eff6ff' : '#fff7ed'),
                                                color: task.status === 'DONE' ? '#10b981' : (task.status === 'IN_PROCESS' ? '#3b82f6' : '#f97316'),
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" color="primary" sx={{ bgcolor: '#eff6ff', borderRadius: '8px' }}>
                                            <TaskIcon fontSize="small" />
                                        </IconButton>
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

export default UpdateApprovedTask;
