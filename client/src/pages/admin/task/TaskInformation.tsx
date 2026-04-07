import React, { useState } from 'react';
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
    CircularProgress,
    Chip,
    Alert,
    Avatar,
    Tooltip,
    TablePagination,
} from '@mui/material';
import { 
    Filter, 
    RotateCcw, 
    LayoutList, 
    Users, 
    Calendar,
    Briefcase,
    Tag,
    AlertCircle,
    Building2,
} from 'lucide-react';
import { CommonButton } from '../../../components/common/UIComponents';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import type { TaskMasterData, Client, User, Task, TaskStatus } from '../../../types';

export const TaskInformation: React.FC = () => {
    // Basic States
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [status, setStatus] = useState('');
    const [year, setYear] = useState('');
    const [department, setDepartment] = useState('');
    const [reportingManager, setReportingManager] = useState('');

    // Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch Lists
    const { data: clientGroups = [] } = useQuery<any[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: taskMasterData = [] } = useQuery<TaskMasterData[]>({
        queryKey: ['taskMasterData'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departmentsList = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];
    
    const statusMap: Record<string, TaskStatus> = {
        'Pending': 'PENDING',
        'In Progress': 'IN_PROCESS',
        'Completed': 'DONE',
        'On Hold': 'ON_HOLD',
        'Cancelled': 'CANCELLED',
        'Pending Approval': 'PENDING_FOR_APPROVAL',
        'Rejected': 'REJECTED',
        'Approved': 'APPROVED'
    };
    const statuses = Object.keys(statusMap);

    const { 
        data: filteredTasks = [], 
        isLoading: tasksLoading,
        isError,
        error: tasksError,
        refetch
    } = useQuery<Task[]>({
        queryKey: ['tasksCombined', groupName, clientName, selectedTask, frequency, status, year, department, reportingManager],
        queryFn: async () => {
            const dbStatus = status ? statusMap[status] : undefined;
            const res = await taskService.getTasks({
                clientGroupId: groupName || undefined,
                clientId: clientName || undefined,
                taskMasterId: selectedTask || undefined,
                frequency: frequency || undefined,
                status: dbStatus,
                year: (year && year.length >= 4) ? year : undefined,
                department: department || undefined,
                reportingManager: reportingManager || undefined
            });
            return Array.isArray(res) ? res : [];
        },
        retry: 1
    });

    const handleReset = () => {
        setGroupName('');
        setClientName('');
        setSelectedTask('');
        setFrequency('');
        setStatus('');
        setYear('');
        setDepartment('');
        setReportingManager('');
        setPage(0);
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Calculate sliced data for pagination
    const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: 0, height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Section */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LayoutList size={28} color="#2563eb" strokeWidth={2.5} />
                        Task Information
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ mt: 0.5 }}>Real-time intelligence and tracking for all compliance operations</Typography>
                </Box>
                <CommonButton 
                    startIcon={<RotateCcw size={18} />} 
                    onClick={handleReset}
                    sx={{ 
                        borderRadius: '10px', 
                        textTransform: 'none', 
                        px: 2.5,
                        py: 1,
                        bgcolor: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#e2e8f0' }
                    }}
                >
                    Reset Filters
                </CommonButton>
            </Box>

            {isError && (
                <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ mb: 2, borderRadius: '12px' }}>
                    Connectivity issue: {(tasksError as any)?.message || 'Database sync failed'}
                    <CommonButton size="small" onClick={() => refetch()} sx={{ ml: 2, height: 24 }}>Retry Sync</CommonButton>
                </Alert>
            )}

            {/* Filter Grid */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 1.5, 
                    mb: 1.5,
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Users size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Group Name</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={groupName} onChange={(e) => { setGroupName(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Groups</MenuItem>
                            {(clientGroups || []).map((g: any) => (<MenuItem key={g?._id || Math.random()} value={g?._id}>{g?.groupName}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Building2 size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Client Name</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={clientName} onChange={(e) => { setClientName(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Clients</MenuItem>
                            {(clients || []).map((c: Client) => (<MenuItem key={c?._id || Math.random()} value={c?._id}>{c?.name}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Briefcase size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Scope of Task</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={selectedTask} onChange={(e) => { setSelectedTask(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Tasks</MenuItem>
                            {(taskMasterData || []).map((t: TaskMasterData) => (<MenuItem key={t?._id || Math.random()} value={t?._id}>{t?.taskName}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <RotateCcw size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Frequency</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={frequency} onChange={(e) => { setFrequency(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Cycles</MenuItem>
                            {frequencies.map(f => (<MenuItem key={f} value={f}>{f}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Filter size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Progress Status</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Statuses</MenuItem>
                            {statuses.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Calendar size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>FY Year</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => { setYear(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">Current</MenuItem>
                            <MenuItem value="2023-2024">2023-24</MenuItem>
                            <MenuItem value="2024-2025">2024-25</MenuItem>
                            <MenuItem value="2025-2026">2025-26</MenuItem>
                            <MenuItem value="2026-2027">2026-27</MenuItem>
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Tag size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Service Dept</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={department} onChange={(e) => { setDepartment(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Departments</MenuItem>
                            {departmentsList.map(d => (<MenuItem key={d} value={d}>{d}</MenuItem>))}
                        </Select>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                            <Users size={12} color="#64748b" />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Team Lead / Manager</Typography>
                        </Box>
                        <Select size="small" fullWidth displayEmpty value={reportingManager} onChange={(e) => { setReportingManager(e.target.value); setPage(0); }} sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <MenuItem value="">All Active Personnel</MenuItem>
                            {(staffUsers || []).map((u: User) => (<MenuItem key={u?._id || Math.random()} value={u?._id}>{u?.name} ({u?.role})</MenuItem>))}
                        </Select>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table Container */}
            <Paper 
                elevation={0} 
                sx={{ 
                    flex: 1,
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Job Repository</Typography>
                    <Chip 
                        label={`${(filteredTasks || []).length} Live Records`} 
                        size="small" 
                        sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, height: 22, fontSize: '0.7rem' }} 
                    />
                </Box>

                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>#</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>ENTITY CONTEXT</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>TASK DESCRIPTION</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>CYCLE</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>YEAR</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>STATUS</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem' }}>ASSIGNED TO</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={24} thickness={4} sx={{ color: '#2563eb' }} />
                                        <Typography sx={{ mt: 1, color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Syncing repository...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (paginatedTasks || []).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Box sx={{ opacity: 0.3, mb: 1 }}><LayoutList size={32} /></Box>
                                        <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>No records identified</Typography>
                                        <Typography variant="caption" color="text.disabled">Adjust your filters to broaden scope</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (paginatedTasks || []).map((task: Task, index: number) => (
                                <TableRow key={task?._id || index} hover>
                                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{String(page * rowsPerPage + index + 1).padStart(2, '0')}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>
                                            {typeof task?.clientId === 'object' && task?.clientId !== null ? (task.clientId as any).name || 'Unknown' : (task?.clientId || 'Internal')}
                                        </Typography>
                                        {typeof task?.clientGroupId === 'object' && task?.clientGroupId !== null && (
                                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                {(task.clientGroupId as any).groupName || ''}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>{task?.title || 'No Title'}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                            <Chip 
                                                label={task?.priority || 'MEDIUM'} 
                                                size="small" 
                                                sx={{ 
                                                    height: 16, fontSize: '0.6rem', fontWeight: 700,
                                                    bgcolor: task?.priority === 'URGENT' ? '#fee2e2' : '#f1f5f9',
                                                    color: task?.priority === 'URGENT' ? '#ef4444' : '#64748b'
                                                }} 
                                            />
                                            {task?.isOverdue && (
                                                <Chip label="OVERDUE" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#dc2626' }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="#64748b">{task?.frequency || '-'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="#64748b">{(task as any)?.year || '-'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={(task?.status || 'PENDING').replace(/_/g, ' ')} 
                                            size="small" 
                                            sx={{ 
                                                height: 18, fontSize: '0.65rem', fontWeight: 800,
                                                bgcolor: task?.status === 'DONE' ? '#f0fdf4' : (task?.status === 'IN_PROCESS' ? '#eff6ff' : '#fff7ed'),
                                                color: task?.status === 'DONE' ? '#16a34a' : (task?.status === 'IN_PROCESS' ? '#2563eb' : '#ea580c'),
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                            {((task?.assignedTo as unknown as User[]) || []).map((u, idx) => (
                                                <Tooltip key={u?._id || idx} title={u?.role || 'Staff'}>
                                                    <Chip 
                                                        avatar={<Avatar sx={{ width: 14, height: 14, fontSize: '0.6rem' }}>{u?.username?.charAt(0) || '?'}</Avatar>}
                                                        label={u?.username || u?.name || 'User'} 
                                                        size="small" 
                                                        variant="outlined" 
                                                        sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ffffff', borderRadius: '4px' }} 
                                                    />
                                                </Tooltip>
                                            ))}
                                            {(!task?.assignedTo || task?.assignedTo.length === 0) && (
                                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>Unassigned</Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 30, 50]}
                    component="div"
                    count={(filteredTasks || []).length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: '1px solid #f1f5f9',
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontWeight: 600
                        },
                    }}
                />
            </Paper>
        </Box>
    );
};

export default TaskInformation;
