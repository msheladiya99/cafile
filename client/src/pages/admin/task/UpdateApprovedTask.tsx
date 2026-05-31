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
    Button,
} from '@mui/material';
import {
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    FactCheck as TaskIcon,
    Close as CloseIcon,
    Update as UpdateIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { taskService } from '../../../services/taskService';
import { clientGroupService, type ClientGroup } from '../../../services/clientGroupService';
import type { TaskMasterData, Client, User, Task, TaskStatus, CreateTaskData } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CommonButton } from '../../../components/common/UIComponents';
import { useAuth } from '../../../contexts/AuthContext';
import {
    Avatar,
    AvatarGroup,
    Tooltip,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Checkbox,
} from '@mui/material';
import {
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Check as DoneIcon,
    HourglassEmpty as PendingIcon,
    Send as SubmitIcon,
    Timer as TimerIcon,
    PauseCircle as HoldIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING:                  { label: 'To Do',               color: '#64748b', bg: '#f1f5f9', icon: <PendingIcon fontSize="inherit" /> },
    IN_PROCESS:               { label: 'In Process',           color: '#3b82f6', bg: '#eff6ff', icon: <StartIcon fontSize="inherit" /> },
    PENDING_FOR_APPROVAL:     { label: 'Sent for Approval',    color: '#f59e0b', bg: '#fffbeb', icon: <SubmitIcon fontSize="inherit" /> },
    APPROVED:                 { label: 'Approved',             color: '#2dd4bf', bg: '#f0fdfa', icon: <CheckIcon fontSize="inherit" /> },
    DONE:                     { label: 'Done',                 color: '#10b981', bg: '#f0fdf4', icon: <DoneIcon fontSize="inherit" /> },
    ON_HOLD:                  { label: 'On Hold',              color: '#8b5cf6', bg: '#f5f3ff', icon: <HoldIcon fontSize="inherit" /> },
    PENDING_FROM_CLIENT:      { label: 'Pending from Client',  color: '#f97316', bg: '#fff7ed', icon: <TimerIcon fontSize="inherit" /> },
    PENDING_FROM_DEPARTMENT:  { label: 'Pending from Dept',    color: '#ec4899', bg: '#fdf2f8', icon: <TimerIcon fontSize="inherit" /> },
    CANCELLED:                { label: 'Cancelled',            color: '#ef4444', bg: '#fef2f2', icon: <CancelIcon fontSize="inherit" /> },
    REJECTED:                 { label: 'Rejected',             color: '#dc2626', bg: '#fef2f2', icon: <CancelIcon fontSize="inherit" /> },
};

const FLOW_STEPS: { status: TaskStatus; label: string }[] = [
    { status: 'PENDING',              label: 'To Do' },
    { status: 'IN_PROCESS',           label: 'In Process' },
    { status: 'PENDING_FOR_APPROVAL', label: 'Approval' },
    { status: 'APPROVED',             label: 'Approved' },
    { status: 'DONE',                 label: 'Done' },
];


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
    const [uiStatus, setUiStatus] = useState('Pending & Approved');

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [processingTask, setProcessingTask] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');

    // Bulk Update States
    const [bulkStatus, setBulkStatus] = useState<TaskStatus | ''>('');
    const [bulkManager, setBulkManager] = useState('');
    const [bulkAssignedTo, setBulkAssignedTo] = useState<string[]>([]);


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
    const statusMap: Record<string, TaskStatus | TaskStatus[]> = {
        'Pending & Approved': ['PENDING', 'APPROVED'],
        'Pending': 'PENDING',
        'In Progress': 'IN_PROCESS',
        'Completed': 'DONE',
        'On Hold': 'ON_HOLD',
        'Cancelled': 'CANCELLED'
    };

    const taskQueryKey = ['tasksUpdate', groupName, clientName, department, selectedTask, frequency, year, reportingManager, uiStatus] as const;

    const syncTaskInView = (updatedTask: Partial<Task> & { _id: string }) => {
        queryClient.setQueriesData<Task[]>({ queryKey: ['tasksUpdate'] }, (existingTasks) =>
            existingTasks?.map((task) => (
                task._id === updatedTask._id
                    ? ({ ...task, ...updatedTask } as Task)
                    : task
            )) ?? existingTasks
        );

        setProcessingTask((currentTask) => (
            currentTask && currentTask._id === updatedTask._id
                ? ({ ...currentTask, ...updatedTask } as Task)
                : currentTask
        ));
    };

    // Fetch tasks for the list
    const { data: tasks = [], isLoading, isError, error, refetch } = useQuery<Task[]>({
        queryKey: taskQueryKey,
        queryFn: () => taskService.getTasks({
            clientId: clientName || undefined,
            clientGroupId: groupName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            year: year || undefined,
            department: department || undefined,
            reportingManager: reportingManager || undefined,
            status: uiStatus ? statusMap[uiStatus] : undefined
        }),
        refetchInterval: 15_000,
        refetchIntervalInBackground: true,
        refetchOnMount: 'always',
        refetchOnReconnect: true,
        staleTime: 5_000,
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departmentsList = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance', 'ROC / Company Law', 'Other'];
    const taskStatusOptions = Object.keys(statusMap);

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: (data) => {
            syncTaskInView(data.task as Task);
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            if (processingTask && processingTask._id === data.task._id) setProcessingTask(data.task as Task);
            toast.success('Status updated');
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
        onSuccess: (data) => {
            syncTaskInView(data.task as Task);
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            if (processingTask && processingTask._id === data.task._id) setProcessingTask(data.task as Task);
            setNewComment('');
            toast.success('Note added');
        }
    });

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.startTimer(taskId),
        onSuccess: (data) => {
            syncTaskInView(data.task as Task);
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const stopTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.stopTimer(taskId),
        onSuccess: (data) => {
            syncTaskInView(data.task as Task);
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const updateChecklistMutation = useMutation({
        mutationFn: ({ taskId, itemId, completed }: { taskId: string; itemId: string; completed: boolean }) =>
            taskService.updateChecklistItem(taskId, itemId, completed),
        onSuccess: (data) => {
            syncTaskInView(data.task as Task);
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const bulkUpdateMutation = useMutation({
        mutationFn: async () => {
            if (tasks.length === 0) return;
            const promises = tasks.map(async task => {
                if (bulkStatus) {
                    await taskService.updateStatus(task._id, bulkStatus);
                }
                const updateData: Partial<CreateTaskData> = {};
                if (bulkManager) updateData.reportingManager = bulkManager;
                if (bulkAssignedTo.length > 0) updateData.assignedTo = bulkAssignedTo;
                
                if (Object.keys(updateData).length > 0) {
                    await taskService.updateTask(task._id, updateData);
                }
            });
            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasksUpdate'] });
            toast.success('Bulk update completed');
            setBulkStatus('');
            setBulkManager('');
            setBulkAssignedTo([]);
        },
        onError: (err: Error) => {
            toast.error('Bulk update failed: ' + err.message);
        }
    });

    const currentTask = (processingTask && tasks.find(t => t._id === processingTask._id)) || processingTask;

    const renderModal = () => {
        if (!currentTask) return null;
        const cfg = STATUS_CONFIG[currentTask.status] || STATUS_CONFIG.PENDING;
        const isTimerRunning = !!currentTask.currentTimerStart;
        const flowStep = FLOW_STEPS.findIndex(s => s.status === currentTask.status);
        const timeH = Math.round((currentTask.actualTimeSpent || 0) / 60 * 10) / 10;
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
        const isEmployee = user?.role === 'STAFF' || user?.role === 'INTERN';
        const adminOnlyStatuses: TaskStatus[] = ['APPROVED', 'DONE', 'CANCELLED', 'REJECTED'];

        return (
            <Dialog open={!!processingTask} onClose={() => setProcessingTask(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', px: 3, py: 2, color: '#1e293b' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1} mr={2}>
                                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{currentTask.title}</Typography>
                                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                    <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${cfg.color}30` }} />
                                    {currentTask.isOverdue && <Chip label="⚠ Overdue" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: '0.7rem' }} />}
                                    <Chip label={`⏱ ${timeH}h / ${currentTask.estimatedHours || 1}h`} size="small"
                                        sx={{ bgcolor: timeH > (currentTask.estimatedHours || 1) ? '#fee2e2' : '#f1f5f9', color: timeH > (currentTask.estimatedHours || 1) ? '#ef4444' : '#64748b', fontSize: '0.7rem' }} />
                                </Box>
                            </Box>
                            <IconButton 
                                size="small" 
                                onClick={() => setProcessingTask(null)} 
                                sx={{ color: 'text.secondary', bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Workflow Steps */}
                    <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 2, borderBottom: '1px solid #e2e8f0' }}>
                        <Box display="flex" alignItems="center">
                            {FLOW_STEPS.map((step, idx) => {
                                const isDone = idx < flowStep;
                                const isCurrent = idx === flowStep;
                                const isLast = idx === FLOW_STEPS.length - 1;
                                const isLockedForEmployee = isEmployee && adminOnlyStatuses.includes(step.status);
                                return (
                                    <React.Fragment key={step.status}>
                                        <Tooltip title={isLockedForEmployee ? `Only Admin/Manager can set "${step.label}"` : `Set status: ${step.label}`}>
                                            <Box
                                                onClick={() => !isLockedForEmployee && updateStatusMutation.mutate({ taskId: currentTask._id, status: step.status })}
                                                sx={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: isLockedForEmployee ? 'not-allowed' : 'pointer',
                                                    minWidth: 64, opacity: isLockedForEmployee ? 0.4 : 1,
                                                    '&:hover .step-circle': { transform: isLockedForEmployee ? 'none' : 'scale(1.15)' }
                                                }}>
                                                <Box className="step-circle" sx={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: isCurrent ? '#667eea' : isDone ? '#10b981' : '#e2e8f0',
                                                    color: (isCurrent || isDone) ? 'white' : '#94a3b8',
                                                    border: isCurrent ? '2px solid #764ba2' : 'none',
                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(102,126,234,0.2)' : 'none',
                                                    transition: 'all 0.2s', fontSize: '0.75rem', fontWeight: 700,
                                                }}>
                                                    {isLockedForEmployee ? '🔒' : isDone ? '✓' : idx + 1}
                                                </Box>
                                                <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.62rem', fontWeight: isCurrent ? 800 : 400, color: isCurrent ? '#667eea' : isDone ? '#10b981' : '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>
                                                    {step.label}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                        {!isLast && <Box sx={{ flex: 1, height: 2, bgcolor: idx < flowStep ? '#10b981' : '#e2e8f0', mx: 0.5, mt: -2 }} />}
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ p: 0 }}>
                    <Grid container spacing={0}>
                        <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, borderRight: '1px solid #f0f0f0' }}>
                            <Box sx={{ bgcolor: '#f8fafc', borderRadius: '12px', p: 2, mb: 2.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Client</Typography>
                                    <Typography variant="body2" fontWeight={700}>{(currentTask.clientId as Client)?.name || 'Internal'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Target Date</Typography>
                                    <Typography variant="body2" fontWeight={700}>{new Date(currentTask.targetDate).toLocaleDateString('en-IN')}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Estimate</Typography>
                                    <Typography variant="body2" fontWeight={700}>{currentTask.estimatedHours || 1}h</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">Actual</Typography>
                                    <Typography variant="body2" fontWeight={700}>{timeH}h</Typography>
                                </Box>
                            </Box>

                            <Box mb={2.5}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" display="block" mb={1}>Quick Actions</Typography>
                                <Box display="flex" gap={1}>
                                    <CommonButton size="small" startIcon={isTimerRunning ? <StopIcon /> : <TimerIcon />} 
                                        color={isTimerRunning ? 'error' : 'success'}
                                        onClick={() => isTimerRunning ? stopTimerMutation.mutate(currentTask._id) : startTimerMutation.mutate(currentTask._id)}>
                                        {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                                    </CommonButton>
                                    {isAdmin && currentTask.status === 'PENDING_FOR_APPROVAL' && (
                                        <CommonButton size="small" color="success" onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: 'APPROVED' })}>Approve</CommonButton>
                                    )}
                                </Box>
                            </Box>

                            <Box mb={2.5}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" display="block" mb={1}>Checklist</Typography>
                                <List dense disablePadding>
                                    {(currentTask.checklist || []).map(item => (
                                        <ListItem key={item.id} dense>
                                            <Checkbox size="small" checked={item.completed} onChange={e => updateChecklistMutation.mutate({ taskId: currentTask._id, itemId: item.id, completed: e.target.checked })} />
                                            <ListItemText primary={item.text} sx={{ textDecoration: item.completed ? 'line-through' : 'none' }} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, bgcolor: '#fafafa' }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" display="block" mb={1.5}>Activity Log</Typography>
                            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 200, maxHeight: 300, bgcolor: 'white', p: 1.5, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                {[...(currentTask.comments || [])].reverse().map(comment => (
                                    <Box key={comment.id} sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" fontWeight={700} display="block">{comment.userName}</Typography>
                                        <Typography variant="body2" sx={{ bgcolor: '#f1f5f9', p: 1, borderRadius: '4px' }}>{comment.text}</Typography>
                                    </Box>
                                ))}
                            </Box>
                            <TextField fullWidth multiline rows={2} placeholder="Add a note..." value={newComment} onChange={e => setNewComment(e.target.value)} size="small" sx={{ mt: 2, bgcolor: 'white' }} />
                            <CommonButton fullWidth sx={{ mt: 1 }} onClick={() => addCommentMutation.mutate({ taskId: currentTask._id, text: newComment })} disabled={!newComment.trim()}>Post</CommonButton>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setProcessingTask(null)}>Close</Button>
                    <Box flex={1} />
                    <CommonButton onClick={() => { updateStatusMutation.mutate({ taskId: currentTask._id, status: 'DONE' }); setProcessingTask(null); }} color="success" disabled={!isAdmin && currentTask.status !== 'APPROVED'}>Mark as Done</CommonButton>
                </DialogActions>
            </Dialog>
        );
    };


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
                        <UpdateIcon fontSize="small" sx={{ color: '#475569' }} />
                        <Typography fontWeight="700" variant="body2">Fill Global Data</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>(Update {tasks.length} tasks at once)</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'white' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Select size="small" fullWidth displayEmpty value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as TaskStatus)}>
                                <MenuItem value="">— Change Status —</MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([v, c]) => <MenuItem key={v} value={v}>{c.label}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Select size="small" fullWidth displayEmpty value={bulkManager} onChange={(e) => setBulkManager(e.target.value)}>
                                <MenuItem value="">— Change Manager —</MenuItem>
                                {staffUsers.map((u: User) => <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Select size="small" fullWidth multiple displayEmpty value={bulkAssignedTo} onChange={(e) => setBulkAssignedTo(e.target.value as string[])} renderValue={(selected) => {
                                if (selected.length === 0) return <em>— Assign Staff —</em>;
                                return `${selected.length} Staff Selected`;
                            }}>
                                {staffUsers.map((u: User) => <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <CommonButton fullWidth size="small" onClick={() => bulkUpdateMutation.mutate()} loading={bulkUpdateMutation.isPending} disabled={!bulkStatus && !bulkManager && bulkAssignedTo.length === 0}>
                                Update All
                            </CommonButton>
                        </Grid>
                    </Grid>
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
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Assign To</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Dept / Year</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Last Updated</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, bgcolor: '#f8fafc' }}>Action</TableCell>

                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 10 }}>
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
                                        <Typography variant="caption" color="textSecondary">{task.frequency} • {task.priority}</Typography>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            multiple
                                            value={(task.assignedTo as User[] || []).map((u: User) => u._id)}
                                            onChange={async (event) => {
                                                const newAssignees = event.target.value as string[];
                                                try {
                                                    await taskService.updateTask(task._id, { assignedTo: newAssignees });
                                                    toast.success('Task assignment updated successfully');
                                                    refetch();
                                                } catch (err: any) {
                                                    console.error('Error updating task assignees:', err);
                                                    toast.error('Failed to update task assignment: ' + err.message);
                                                }
                                            }}
                                            displayEmpty
                                            renderValue={(selected) => {
                                                if (selected.length === 0) {
                                                    return <Typography variant="caption" sx={{ color: 'text.disabled' }}>Unassigned</Typography>;
                                                }
                                                return (
                                                    <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem' } }}>
                                                        {selected.map((uId: string) => {
                                                            const u = staffUsers.find(user => user._id === uId);
                                                            return (
                                                                <Avatar key={uId} sx={{ bgcolor: '#6366f1' }}>
                                                                    {(u?.name || u?.username || '?').charAt(0).toUpperCase()}
                                                                </Avatar>
                                                            );
                                                        })}
                                                    </AvatarGroup>
                                                );
                                            }}
                                            size="small"
                                            sx={{
                                                minWidth: 100,
                                                maxWidth: 160,
                                                borderRadius: '8px',
                                                '& .MuiSelect-select': {
                                                    py: 0.5,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none'
                                                },
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    border: '1px solid #cbd5e1'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    border: '1px solid #6366f1'
                                                }
                                            }}
                                        >
                                            {staffUsers.map((s: User) => (
                                                <MenuItem key={s._id} value={s._id} sx={{ fontSize: '0.85rem' }}>
                                                    {s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.username}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} color="primary">{task.department || '-'}</Typography>
                                        <Typography variant="caption" color="textSecondary">{task.year || '-'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" display="block">{new Date(task.updatedAt || task.createdAt).toLocaleDateString()}</Typography>
                                        <Typography variant="caption" color="textSecondary">{new Date(task.updatedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                    </TableCell>

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
                                        <IconButton size="small" color="primary" sx={{ bgcolor: '#eff6ff', borderRadius: '8px' }} onClick={() => setProcessingTask(task)}>
                                            <TaskIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>

                                </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Paper>
    {renderModal()}
</Box>

    );
};

export default UpdateApprovedTask;
