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
    TableHead,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    Alert,
    Avatar,
    Tooltip,
    LinearProgress,
} from '@mui/material';
import {
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FactCheck as TaskIcon,
    Info as InfoIcon,
    Timer as TimerIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TaskMasterData, Client, Task, TaskStatus, User } from '../../../types';
import toast from 'react-hot-toast';

export const TaskApproval: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());

    // Reject dialog
    const [rejectTask, setRejectTask] = useState<Task | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    // Detail dialog
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    const { user } = useAuth();
    const queryClient = useQueryClient();

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // Data
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

    const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: ['tasksApproval', groupName, clientName, selectedTask, frequency, department, user?._id],
        queryFn: () => taskService.getTasks({
            status: 'PENDING_FOR_APPROVAL',
            clientId: clientName || undefined,
            clientGroupId: groupName || undefined,
            reportingManager: user?.role === 'ADMIN' ? undefined : user?._id
        })
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasksApproval'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            const msg = variables.status === 'APPROVED'
                ? '✅ Task approved! Employee can now mark it as Done.'
                : '❌ Task rejected! Employee has been notified.';
            toast.success(msg);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update status');
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
    });

    const handleApprove = (taskId: string) => {
        updateStatusMutation.mutate({ taskId, status: 'APPROVED' });
    };

    const handleRejectConfirm = async () => {
        if (!rejectTask) return;
        // Post rejection reason as comment first
        if (rejectReason.trim()) {
            await addCommentMutation.mutateAsync({ taskId: rejectTask._id, text: `❌ Rejected: ${rejectReason}` });
        }
        updateStatusMutation.mutate({ taskId: rejectTask._id, status: 'REJECTED' });
        setRejectTask(null);
        setRejectReason('');
    };

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departments = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];

    // Filtered tasks by client-side department filter
    const filteredTasks = useMemo(() => tasks.filter(t => {
        if (selectedTask && (t as Task & { taskMasterId?: string }).taskMasterId !== selectedTask) return false;
        if (frequency && (t as Task & { frequency?: string }).frequency !== frequency) return false;
        return true;
    }), [tasks, selectedTask, frequency]);

    const getAssignedNames = (task: Task) =>
        (task.assignedTo as User[])?.map(u => u.name || u.username).filter(Boolean).join(', ') || '—';

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <TaskIcon />
                    <Typography variant="h6" fontWeight="500">Task Approval</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    {tasksLoading ? null : (
                        <Chip
                            label={`${filteredTasks.length} pending`}
                            size="small"
                            sx={{ bgcolor: filteredTasks.length > 0 ? '#f59e0b' : 'rgba(0,0,0,0.2)', color: 'white', fontWeight: 700 }}
                        />
                    )}
                </Box>
            </Paper>

            {/* Approval Workflow Hint */}
            <Box sx={{ bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, p: 1.5, mt: 1, mx: 0, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <InfoIcon sx={{ color: '#f59e0b', mt: 0.3, fontSize: 18 }} />
                <Box>
                    <Typography variant="body2" fontWeight="600" color="#92400e">How Task Approval Works</Typography>
                    <Typography variant="caption" color="#78350f">
                        When a staff member finishes a task, they click <strong>"Submit for Approval"</strong> on the Ongoing Task page.
                        The task appears here (status: <em>Pending for Approval</em>). You review it and either <strong>Approve</strong> (staff can then mark it Done)
                        or <strong>Reject</strong> (staff gets feedback and can rework and resubmit).
                    </Typography>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 3, mt: 1, mb: 1, borderRadius: 2 }}>
                <Grid container spacing={2}>
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
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Task Approval Table */}
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="500">Task Approval List ({filteredTasks.length})</Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white' }}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>

                {tasksLoading && <LinearProgress />}

                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>S.N.</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Target Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Time Spent</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Checklist</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={9} sx={{ py: 6 }}>
                                        Loading tasks pending approval...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task, index) => {
                                    const completed = task.checklist?.filter(c => c.completed).length ?? 0;
                                    const total = task.checklist?.length ?? 0;
                                    const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
                                    const timeH = Math.round((task.actualTimeSpent || 0) / 60 * 10) / 10;
                                    const isOverdue = task.isOverdue;

                                    return (
                                        <TableRow key={task._id} hover>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{(task.clientId as Client)?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {(task as Task & { frequency?: string }).frequency || 'One Time'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={(task as Task & { frequency?: string }).frequency || 'One Time'}
                                                    size="small" variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                                    {(task.assignedTo as User[])?.map(u => (
                                                        <Tooltip key={u._id} title={u.name || u.username}>
                                                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: '#667eea' }}>
                                                                {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">{getAssignedNames(task)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: isOverdue ? 'error.main' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                                                {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '-'}
                                                {isOverdue && <Typography variant="caption" color="error" display="block">Overdue</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <TimerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    <Typography variant="caption">{timeH}h</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Est: {task.estimatedHours}h
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 90 }}>
                                                {total > 0 ? (
                                                    <Box>
                                                        <LinearProgress variant="determinate" value={pct}
                                                            sx={{ height: 5, borderRadius: 3,
                                                                bgcolor: '#e0e0e0',
                                                                '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10b981' : '#667eea' }
                                                            }} />
                                                        <Typography variant="caption" color={pct === 100 ? 'success.main' : 'text.secondary'}>
                                                            {completed}/{total} ({pct}%)
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box display="flex" justifyContent="center" gap={0.5}>
                                                    {/* View details */}
                                                    <Tooltip title="View task details">
                                                        <IconButton size="small"
                                                            onClick={() => setDetailTask(task)}
                                                            sx={{ color: '#667eea' }}>
                                                            <InfoIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* Approve */}
                                                    <Tooltip title="Approve this task">
                                                        <Button
                                                            size="small" variant="contained" color="success"
                                                            startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => handleApprove(task._id)}
                                                            disabled={updateStatusMutation.isPending}
                                                            sx={{ fontSize: '0.7rem', py: 0.3, minWidth: 80, textTransform: 'none' }}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </Tooltip>

                                                    {/* Reject */}
                                                    <Tooltip title="Reject and give feedback">
                                                        <Button
                                                            size="small" variant="contained" color="error"
                                                            startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => setRejectTask(task)}
                                                            disabled={updateStatusMutation.isPending}
                                                            sx={{ fontSize: '0.7rem', py: 0.3, minWidth: 70, textTransform: 'none' }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={9} sx={{ color: 'text.secondary', py: 8 }}>
                                        <TaskIcon sx={{ fontSize: 48, color: '#e0e0e0', display: 'block', mx: 'auto', mb: 1 }} />
                                        <Typography>No Tasks Pending for Approval</Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            When employees submit tasks for approval, they will appear here.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* ── Reject Dialog ── */}
            <Dialog open={!!rejectTask} onClose={() => { setRejectTask(null); setRejectReason(''); }} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ bgcolor: '#fee2e2', color: '#b91c1c' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <RejectIcon />
                        <Typography fontWeight="700">Reject Task</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        The employee will be notified and can rework and resubmit the task.
                    </Alert>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                        <strong>Task:</strong> {rejectTask?.title}
                    </Typography>
                    <TextField
                        fullWidth multiline rows={3}
                        label="Reason for Rejection (optional)"
                        placeholder="Explain what needs to be reworked..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        size="small"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setRejectTask(null); setRejectReason(''); }} color="inherit">Cancel</Button>
                    <Button
                        variant="contained" color="error"
                        onClick={handleRejectConfirm}
                        disabled={updateStatusMutation.isPending}
                    >
                        Confirm Reject
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Task Detail Dialog ── */}
            <Dialog open={!!detailTask} onClose={() => setDetailTask(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 1.5 }}>
                    <Typography fontWeight="700">Task Details</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85 }}>{detailTask?.title}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {detailTask && (
                        <Box>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Client</Typography>
                                    <Typography variant="body2" fontWeight={500}>{(detailTask.clientId as Client)?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Target Date</Typography>
                                    <Typography variant="body2">{new Date(detailTask.targetDate).toLocaleDateString('en-IN')}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                                    <Typography variant="body2">{getAssignedNames(detailTask)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" color="text.secondary">Time Spent</Typography>
                                    <Typography variant="body2">{Math.round((detailTask.actualTimeSpent || 0) / 60 * 10) / 10}h / {detailTask.estimatedHours}h estimated</Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" fontWeight={700} mb={1}>Description</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {detailTask.description || 'No description.'}
                            </Typography>

                            {detailTask.checklist?.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                                        Checklist ({detailTask.checklist.filter(c => c.completed).length}/{detailTask.checklist.length} done)
                                    </Typography>
                                    {detailTask.checklist.map(item => (
                                        <Box key={item.id} display="flex" alignItems="center" gap={1} py={0.5}>
                                            <Box sx={{
                                                width: 16, height: 16, borderRadius: '50%',
                                                bgcolor: item.completed ? '#10b981' : '#e0e0e0',
                                                flexShrink: 0
                                            }} />
                                            <Typography variant="body2"
                                                sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.disabled' : 'inherit' }}>
                                                {item.text}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            )}

                            {detailTask.comments?.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Activity Log</Typography>
                                    {[...detailTask.comments].reverse().slice(0, 5).map(c => (
                                        <Box key={c.id} sx={{ mb: 1 }}>
                                            <Typography variant="caption" fontWeight={700}>{c.userName}</Typography>
                                            <Typography variant="body2" sx={{ bgcolor: '#f0f4f8', p: 0.75, borderRadius: '0 6px 6px 6px', mt: 0.25, fontSize: '0.82rem' }}>
                                                {c.text}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailTask(null)} color="inherit">Close</Button>
                    {detailTask && (
                        <>
                            <Button variant="contained" color="error"
                                onClick={() => { setRejectTask(detailTask); setDetailTask(null); }}
                                sx={{ textTransform: 'none' }}>
                                Reject
                            </Button>
                            <Button variant="contained" color="success"
                                onClick={() => { handleApprove(detailTask._id); setDetailTask(null); }}
                                sx={{ textTransform: 'none' }}>
                                Approve
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TaskApproval;
