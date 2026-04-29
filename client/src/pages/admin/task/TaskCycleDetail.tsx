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
    TextField,
    Chip,
    Button,
    CircularProgress,
    LinearProgress,
    Tooltip,
    TablePagination,
} from '@mui/material';
import {
    List as ListIcon,
    Update as CycleIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import type { TaskMasterData, Client, User, Task } from '../../../types';

const STATUS_MAP: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary' }> = {
    PENDING: { label: 'Pending', color: 'warning' },
    IN_PROCESS: { label: 'In Process', color: 'info' },
    PENDING_FOR_APPROVAL: { label: 'Pending Approval', color: 'primary' },
    APPROVED: { label: 'Approved', color: 'success' },
    DONE: { label: 'Done', color: 'success' },
    CANCELLED: { label: 'Cancelled', color: 'default' },
    ON_HOLD: { label: 'On Hold', color: 'default' },
    PENDING_FROM_CLIENT: { label: 'Pending Client', color: 'warning' },
    PENDING_FROM_DEPARTMENT: { label: 'Pending Dept', color: 'warning' },
    REJECTED: { label: 'Rejected', color: 'error' },
};

export const TaskCycleDetail: React.FC = () => {
    const [assignedTo, setAssignedTo] = useState('');
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [status, setStatus] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [startFrom, setStartFrom] = useState('');
    const [startTo, setStartTo] = useState('');
    const [searchedOnce, setSearchedOnce] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // Fetch dropdown data
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

    // Fetch task cycle data
    const { data: cycleTasks = [], isFetching, refetch } = useQuery<Task[]>({
        queryKey: ['taskCycle', assignedTo, clientName, selectedTask, frequency, status],
        queryFn: () => taskService.getTaskCycle({
            assignedTo: assignedTo || undefined,
            clientId: clientName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            status: status || undefined,
            startDate: startFrom || undefined,
            endDate: startTo || undefined,
        }),
        enabled: false,
    });

    const handleSearch = () => {
        setSearchedOnce(true);
        setPage(0);
        refetch();
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedTasks = useMemo(() => {
        return cycleTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [cycleTasks, page, rowsPerPage]);

    // Filter by group client-side
    const filteredClients = useMemo(() => {
        if (!groupName) return clients;
        return clients.filter((c: Client) => {
            const g = c.groupName;
            const gId = typeof g === 'object' ? (g as { _id: string })?._id : g;
            return gId === groupName;
        });
    }, [clients, groupName]);

    // Summary stats
    const stats = useMemo(() => {
        if (cycleTasks.length === 0) return null;
        const done = cycleTasks.filter(t => t.status === 'DONE').length;
        const inProcess = cycleTasks.filter(t => t.status === 'IN_PROCESS').length;
        const pending = cycleTasks.filter(t => t.status === 'PENDING').length;
        const overdue = cycleTasks.filter(t => t.isOverdue).length;
        return { done, inProcess, pending, overdue, total: cycleTasks.length };
    }, [cycleTasks]);

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

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
                <CycleIcon />
                <Typography variant="h6" fontWeight="500">Task Cycle Detail</Typography>
                <Typography variant="body2" sx={{ ml: 'auto', opacity: 0.85 }}>
                    View full lifecycle of recurring tasks
                </Typography>
            </Paper>

            {/* Selection Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={2}>
                    {/* Assign By (from) */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Assigned To</Typography>
                            <Select size="small" fullWidth displayEmpty value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}>
                                <MenuItem value=""><em>All Employees</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username} ({u.role})</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status}
                                onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value=""><em>All Statuses</em></MenuItem>
                                {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                                    <MenuItem key={val} value={val}>{label}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Group Name */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName}
                                onChange={(e) => { setGroupName(e.target.value); setClientName(''); }}>
                                <MenuItem value=""><em>All Groups</em></MenuItem>
                                {clientGroups.map((g: { _id: string; groupName: string }) => (
                                    <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Client Name */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Client Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={clientName}
                                onChange={(e) => setClientName(e.target.value)}>
                                <MenuItem value=""><em>All Clients</em></MenuItem>
                                {filteredClients.map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Task */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}>
                                <MenuItem value=""><em>All Tasks</em></MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Frequency */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                            <Select size="small" fullWidth displayEmpty value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value=""><em>All Frequencies</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Year */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year}
                                onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>All Years</em></MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Date range */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Target Date</Typography>
                            <TextField size="small" type="date" placeholder="From" value={startFrom}
                                onChange={(e) => setStartFrom(e.target.value)}
                                sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                            <Typography variant="body2" color="text.secondary">to</Typography>
                            <TextField size="small" type="date" placeholder="To" value={startTo}
                                onChange={(e) => setStartTo(e.target.value)}
                                sx={{ flex: 1 }} InputLabelProps={{ shrink: true }} />
                        </Box>
                    </Grid>

                    {/* Search button */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" justifyContent="center" mt={1}>
                            <Button variant="contained" startIcon={<SearchIcon />}
                                onClick={handleSearch} disabled={isFetching}
                                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, px: 4 }}>
                                {isFetching ? 'Searching...' : 'Search Task Cycle'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                {/* Summary */}
                {stats && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`Total: ${stats.total}`} color="primary" variant="outlined" />
                        <Chip label={`Done: ${stats.done}`} color="success" variant="outlined" />
                        <Chip label={`In Process: ${stats.inProcess}`} color="info" variant="outlined" />
                        <Chip label={`Pending: ${stats.pending}`} color="warning" variant="outlined" />
                        <Chip label={`Overdue: ${stats.overdue}`} color="error" variant="outlined" />
                    </Box>
                )}
            </Paper>

            {/* Job List */}
            <Paper elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5,
                    bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="500">
                            Task Cycle List {searchedOnce && `(${cycleTasks.length} records)`}
                        </Typography>
                    </Box>
                    {isFetching && <CircularProgress size={18} sx={{ color: 'white' }} />}
                    <IconButton size="small" sx={{ color: 'white' }}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>

                {isFetching && <LinearProgress />}

                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        {searchedOnce && cycleTasks.length > 0 && (
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Target Date</TableCell>
                                </TableRow>
                            </TableHead>
                        )}
                        <TableBody>
                            {!searchedOnce ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={8} sx={{ color: 'text.secondary', py: 6 }}>
                                        Use filters above and click "Search Task Cycle" to view task history.
                                    </TableCell>
                                </TableRow>
                            ) : cycleTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={8} sx={{ color: 'text.secondary', py: 6 }}>
                                        No tasks found matching the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTasks.map((task: Task, idx: number) => {
                                    const statusInfo = STATUS_MAP[task.status] || { label: task.status, color: 'default' as const };
                                    const assignedUsers = Array.isArray(task.assignedTo)
                                        ? task.assignedTo.map((u: string | User) =>
                                            typeof u === 'object' ? (u.name || u.username) : u
                                        ).join(', ')
                                        : '—';
                                    return (
                                            <TableRow key={task._id} hover
                                                sx={{ bgcolor: task.isOverdue ? 'rgba(255,82,82,0.04)' : 'inherit' }}>
                                                <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{task.title}</TableCell>
                                            <TableCell>
                                                {typeof task.clientId === 'object'
                                                    ? (task.clientId as Client)?.name || '—'
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={task.frequency || 'One Time'} size="small" variant="outlined" />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{assignedUsers || '—'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={statusInfo.label}
                                                    size="small"
                                                    color={statusInfo.color}
                                                    variant="filled"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 100 }}>
                                                <Tooltip title={`${task.progressPercentage}%`}>
                                                    <Box>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={task.progressPercentage || 0}
                                                            sx={{ height: 6, borderRadius: 3,
                                                                bgcolor: '#e0e0e0',
                                                                '& .MuiLinearProgress-bar': {
                                                                    bgcolor: task.status === 'DONE' ? '#4caf50' : '#667eea'
                                                                }
                                                            }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary">{task.progressPercentage}%</Typography>
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={{ color: task.isOverdue ? 'error.main' : 'inherit', fontWeight: task.isOverdue ? 600 : 400 }}>
                                                {new Date(task.targetDate).toLocaleDateString('en-IN')}
                                                {task.isOverdue && (
                                                    <Typography component="div" variant="caption" color="error">Overdue</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {searchedOnce && cycleTasks.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={cycleTasks.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default TaskCycleDetail;





