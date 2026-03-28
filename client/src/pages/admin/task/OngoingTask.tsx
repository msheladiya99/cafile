import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, MenuItem, Select, Grid, Table, TableBody,
    TableCell, TableContainer, TableRow, TableHead, CircularProgress,
    Chip, Avatar, AvatarGroup, Tooltip, IconButton, TextField, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, List,
    ListItem, ListItemText, Checkbox, FormControl,
    LinearProgress, Alert, Badge, InputAdornment, useMediaQuery, useTheme,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Timeline as OngoingIcon,
    Close as CloseIcon,
    PlayArrow as StartIcon,
    Stop as StopIcon,
    Check as DoneIcon,
    HourglassEmpty as PendingIcon,
    Send as SubmitIcon,
    Timer as TimerIcon,
    Info as InfoIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Warning as OverdueIcon,
    CheckCircle as CheckIcon,
    PauseCircle as HoldIcon,
    Cancel as CancelIcon,
    List as ListIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TaskMasterData, Client, User, Task, TaskStatus } from '../../../types';

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

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
    URGENT: { label: 'URGENT', color: '#fee2e2' },
    HIGH:   { label: 'HIGH',   color: '#fef3c7' },
    MEDIUM: { label: 'MED',    color: '#dbeafe' },
    LOW:    { label: 'LOW',    color: '#dcfce7' },
};

export const OngoingTask: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState('');
    const [status, setStatus] = useState('');
    const [employee, setEmployee] = useState('');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [processingTask, setProcessingTask] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');

    const years = useMemo(() => {
        const cur = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (cur - 5 + i).toString());
    }, []);

    const queryClient = useQueryClient();
    const { data: taskMasters = [] } = useQuery({ queryKey: ['taskMasters'], queryFn: taskMasterService.getTaskMasters });
    const { data: clientGroups = [] } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: staffUsers = [] } = useQuery({ queryKey: ['staffUsers'], queryFn: adminService.getStaffUsers });
    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

    const { data: tasks = [], isLoading: tasksLoading, refetch } = useQuery<Task[]>({
        queryKey: ['tasks', groupName, clientName, selectedTask, frequency, status, employee, year],
        queryFn: () => taskService.getTasks({
            clientGroupId: groupName || undefined,
            clientId: clientName || undefined,
            status: (status as TaskStatus) || undefined,
            assignedTo: employee || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            year: year || undefined,
        }),
        refetchInterval: 30_000,
    });

    const filteredTasks = useMemo(() => {
        if (!search) return tasks;
        const s = search.toLowerCase();
        return tasks.filter(t =>
            t.title?.toLowerCase().includes(s) ||
            (t.clientId as Client)?.name?.toLowerCase().includes(s)
        );
    }, [tasks, search]);

    // Derive live data for open modal
    const currentTask = (processingTask && tasks.find(t => t._id === processingTask._id)) || processingTask;

    // Summary stats
    const stats = useMemo(() => ({
        total: filteredTasks.length,
        pending: filteredTasks.filter(t => t.status === 'PENDING').length,
        inProcess: filteredTasks.filter(t => t.status === 'IN_PROCESS').length,
        pendingApproval: filteredTasks.filter(t => t.status === 'PENDING_FOR_APPROVAL').length,
        approved: filteredTasks.filter(t => t.status === 'APPROVED').length,
        done: filteredTasks.filter(t => t.status === 'DONE').length,
        overdue: filteredTasks.filter(t => t.isOverdue && t.status !== 'DONE').length,
    }), [filteredTasks]);

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasksApproval'] });
            if (processingTask && processingTask._id === data.task._id) setProcessingTask(data.task as Task);
            toast.success('Status updated');
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === data.task._id) setProcessingTask(data.task as Task);
            setNewComment('');
            toast.success('Note added');
        }
    });

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.startTimer(taskId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const stopTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.stopTimer(taskId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const updateChecklistMutation = useMutation({
        mutationFn: ({ taskId, itemId, completed }: { taskId: string; itemId: string; completed: boolean }) =>
            taskService.updateChecklistItem(taskId, itemId, completed),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) setProcessingTask(data.task as Task);
        }
    });

    const activeFilters = [groupName, clientName, selectedTask, frequency, status, employee].filter(Boolean).length;

    // ─── Processing Modal ─────────────────────────────────────────────────────
    const renderModal = () => {
        if (!currentTask) return null;
        const cfg = STATUS_CONFIG[currentTask.status] || STATUS_CONFIG.PENDING;
        const isTimerRunning = !!currentTask.currentTimerStart;
        const completedCheck = currentTask.checklist?.filter(c => c.completed).length ?? 0;
        const totalCheck = currentTask.checklist?.length ?? 0;
        const checkPct = totalCheck > 0 ? Math.round((completedCheck / totalCheck) * 100) : 0;
        const flowStep = FLOW_STEPS.findIndex(s => s.status === currentTask.status);
        const timeH = Math.round((currentTask.actualTimeSpent || 0) / 60 * 10) / 10;
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
        const isEmployee = user?.role === 'STAFF' || user?.role === 'INTERN';
        // Statuses an employee is NOT allowed to set directly
        const adminOnlyStatuses: TaskStatus[] = ['APPROVED', 'DONE', 'CANCELLED', 'REJECTED'];

        return (
            <Dialog open={!!processingTask} onClose={() => setProcessingTask(null)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

                {/* Header */}
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3, py: 2, color: 'white' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1} mr={2}>
                                <Typography variant="h6" fontWeight={800} lineHeight={1.2}>{currentTask.title}</Typography>
                                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                                    <Chip label={cfg.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
                                    {currentTask.isOverdue && <Chip label="⚠ Overdue" size="small" sx={{ bgcolor: '#ef444430', color: '#fca5a5', fontWeight: 700, fontSize: '0.7rem' }} />}
                                    {(currentTask as Task & { frequency?: string }).frequency && (
                                        <Chip label={(currentTask as Task & { frequency?: string }).frequency} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.7rem' }} />
                                    )}
                                    <Chip label={`⏱ ${timeH}h / ${currentTask.estimatedHours || 1}h`} size="small"
                                        sx={{ bgcolor: timeH > (currentTask.estimatedHours || 1) ? '#fee2e230' : 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.7rem' }} />
                                </Box>
                            </Box>
                            <IconButton size="small" onClick={() => setProcessingTask(null)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
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
                                // Employees cannot click APPROVED or DONE steps
                                const isLockedForEmployee = isEmployee && adminOnlyStatuses.includes(step.status);
                                return (
                                    <React.Fragment key={step.status}>
                                        <Tooltip title={isLockedForEmployee
                                            ? `Only Admin/Manager can set "${step.label}"` 
                                            : `Set status: ${step.label}`}>
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
                    <Grid container sx={{ minHeight: '52vh' }}>
                        {/* LEFT PANEL */}
                        <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, borderRight: '1px solid #f0f0f0' }}>
                            {/* Task Info */}
                            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, mb: 2.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Client</Typography>
                                    <Typography variant="body2" fontWeight={700}>{(currentTask.clientId as Client)?.name || 'Internal'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Target Date</Typography>
                                    <Typography variant="body2" fontWeight={700} color={currentTask.isOverdue ? 'error.main' : 'inherit'}>
                                        {new Date(currentTask.targetDate).toLocaleDateString('en-IN')}
                                        {currentTask.isOverdue && ' ⚠'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Estimate</Typography>
                                    <Typography variant="body2" fontWeight={700}>{currentTask.estimatedHours || 1}h</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>Actual</Typography>
                                    <Typography variant="body2" fontWeight={700} color={timeH > (currentTask.estimatedHours || 1) ? 'warning.main' : 'inherit'}>{timeH}h</Typography>
                                </Box>
                            </Box>

                            {/* Status Alerts */}
                            {currentTask.status === 'PENDING_FOR_APPROVAL' && (
                                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                                    ⏳ Submitted for approval — awaiting manager review on the <strong>Task Approval</strong> page.
                                </Alert>
                            )}
                            {currentTask.status === 'APPROVED' && (
                                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                                    ✅ Task <strong>approved</strong>! Click <strong>"Mark as Done"</strong> below to complete it.
                                </Alert>
                            )}
                            {currentTask.status === 'REJECTED' && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    ❌ Task <strong>rejected</strong>. Check the activity log for feedback, then fix and resubmit.
                                </Alert>
                            )}

                            {/* Quick Actions */}
                            <Box mb={2.5}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1}>
                                    Quick Actions
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {/* Timer */}
                                    <Button size="small" variant="contained"
                                        startIcon={isTimerRunning ? <StopIcon /> : <TimerIcon />}
                                        color={isTimerRunning ? 'error' : 'success'}
                                        onClick={() => isTimerRunning ? stopTimerMutation.mutate(currentTask._id) : startTimerMutation.mutate(currentTask._id)}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                                        {isTimerRunning ? '⏹ Stop Timer' : '▶ Start Timer'}
                                    </Button>

                                    {currentTask.status === 'PENDING' && (
                                        <Button size="small" variant="outlined" color="primary"
                                            onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: 'IN_PROCESS' })}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                                            Start Working
                                        </Button>
                                    )}

                                    {currentTask.status === 'IN_PROCESS' && (
                                        <Button size="small" variant="contained"
                                            startIcon={<SubmitIcon />}
                                            onClick={() => { updateStatusMutation.mutate({ taskId: currentTask._id, status: 'PENDING_FOR_APPROVAL' }); toast.success('Sent for manager approval!'); }}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
                                            Submit for Approval
                                        </Button>
                                    )}

                                    {(currentTask.status === 'IN_PROCESS' || currentTask.status === 'PENDING_FOR_APPROVAL') && (
                                        <Button size="small" variant="outlined" color="warning"
                                            onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: 'ON_HOLD' })}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                                            Put On Hold
                                        </Button>
                                    )}

                                    {isAdmin && currentTask.status === 'PENDING_FOR_APPROVAL' && (
                                        <Button size="small" variant="contained" color="success"
                                            onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: 'APPROVED' })}
                                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                                            ✅ Approve Now
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            {/* Change Status — employees see limited statuses */}
                            <Box mb={2.5}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1}>
                                    Change Status
                                    {isEmployee && (
                                        <Box component="span" sx={{ ml: 1, color: '#f59e0b', fontWeight: 600, textTransform: 'none', fontSize: '0.65rem' }}>
                                            (Approval required for final steps)
                                        </Box>
                                    )}
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                        value={currentTask.status}
                                        onChange={e => updateStatusMutation.mutate({ taskId: currentTask._id, status: e.target.value as TaskStatus })}
                                        disabled={updateStatusMutation.isPending}
                                        sx={{ borderRadius: 2 }}>
                                        {Object.entries(STATUS_CONFIG)
                                            // Employees cannot directly set APPROVED, DONE, CANCELLED, REJECTED
                                            .filter(([val]) => isEmployee ? !adminOnlyStatuses.includes(val as TaskStatus) : true)
                                            .map(([val, cfg]) => (
                                                <MenuItem key={val} value={val}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
                                                        {cfg.label}
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                                {isEmployee && currentTask.status === 'PENDING_FOR_APPROVAL' && (
                                    <Typography variant="caption" color="warning.main" display="block" mt={0.5}>
                                        ⏳ Waiting for Admin/Manager to approve this task.
                                    </Typography>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Checklist */}
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                                        Checklist
                                    </Typography>
                                    <Typography variant="caption" fontWeight={700} color={checkPct === 100 ? 'success.main' : 'text.secondary'}>
                                        {completedCheck}/{totalCheck} ({checkPct}%)
                                    </Typography>
                                </Box>
                                {totalCheck > 0 && (
                                    <LinearProgress variant="determinate" value={checkPct} sx={{
                                        mb: 1.5, height: 6, borderRadius: 3, bgcolor: '#e2e8f0',
                                        '& .MuiLinearProgress-bar': { bgcolor: checkPct === 100 ? '#10b981' : '#667eea', borderRadius: 3 }
                                    }} />
                                )}
                                <List dense disablePadding>
                                    {(currentTask.checklist || []).map(item => (
                                        <ListItem key={item.id} dense disablePadding sx={{
                                            borderRadius: 2, mb: 0.5, px: 1,
                                            bgcolor: item.completed ? '#f0fdf4' : '#f8fafc',
                                            border: '1px solid', borderColor: item.completed ? '#bbf7d0' : '#e2e8f0',
                                            '&:hover': { borderColor: '#667eea20', bgcolor: '#f5f7ff' }
                                        }}>
                                            <Checkbox edge="start" checked={item.completed} size="small"
                                                onChange={e => updateChecklistMutation.mutate({ taskId: currentTask._id, itemId: item.id, completed: e.target.checked })}
                                                sx={{ '&.Mui-checked': { color: '#10b981' } }} />
                                            <ListItemText primary={item.text} sx={{
                                                '& .MuiListItemText-primary': {
                                                    textDecoration: item.completed ? 'line-through' : 'none',
                                                    color: item.completed ? 'text.disabled' : 'text.primary',
                                                    fontSize: '0.875rem', fontWeight: item.completed ? 400 : 500,
                                                }
                                            }} />
                                        </ListItem>
                                    ))}
                                    {totalCheck === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                                            No checklist items for this task.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        </Grid>

                        {/* RIGHT PANEL: Activity Log */}
                        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1.5}>
                                Activity Log
                            </Typography>
                            <Box sx={{
                                flex: 1,
                                overflowY: 'auto', minHeight: 200, maxHeight: 360,
                                border: '1px solid #e2e8f0', borderRadius: 2,
                                bgcolor: 'white', p: 1.5, mb: 1.5
                            }}>
                                {(currentTask.comments || []).length === 0 ? (
                                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={1}>
                                        <InfoIcon sx={{ color: '#e2e8f0', fontSize: 32 }} />
                                        <Typography variant="body2" color="text.disabled">No activity yet.</Typography>
                                    </Box>
                                ) : (
                                    [...(currentTask.comments || [])].reverse().map(comment => (
                                        <Box key={comment.id} sx={{ mb: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                                                <Box display="flex" alignItems="center" gap={0.75}>
                                                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: '#667eea' }}>
                                                        {(comment.userName || '?').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="caption" fontWeight={800}>{comment.userName}</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled">
                                                    {new Date(comment.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                bgcolor: '#f0f4f8', px: 1.5, py: 1, borderRadius: '0 10px 10px 10px',
                                                fontSize: '0.82rem', color: '#374151', lineHeight: 1.5
                                            }}>
                                                {comment.text}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <TextField fullWidth multiline rows={2}
                                placeholder="Add a note or update..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                size="small" sx={{ mb: 1, bgcolor: 'white', borderRadius: 2 }} />
                            <Button fullWidth variant="contained" startIcon={<SubmitIcon />}
                                onClick={() => addCommentMutation.mutate({ taskId: currentTask._id, text: newComment })}
                                disabled={!newComment.trim() || addCommentMutation.isPending}
                                sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#667eea' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                Post Activity
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0', gap: 1 }}>
                    <Button onClick={() => setProcessingTask(null)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Close
                    </Button>
                    <Box flex={1} />
                    {currentTask.status === 'IN_PROCESS' && (
                        <Button variant="outlined" color="warning" startIcon={<SubmitIcon />}
                            onClick={() => { updateStatusMutation.mutate({ taskId: currentTask._id, status: 'PENDING_FOR_APPROVAL' }); toast.success('Task sent to manager for approval!'); setProcessingTask(null); }}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                            Submit for Approval
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<DoneIcon />}
                        disabled={(currentTask.status !== 'APPROVED' && !isAdmin) || updateStatusMutation.isPending}
                        onClick={() => { updateStatusMutation.mutate({ taskId: currentTask._id, status: 'DONE' }); setProcessingTask(null); }}
                        sx={{
                            textTransform: 'none', fontWeight: 700, borderRadius: 2,
                            bgcolor: currentTask.status === 'APPROVED' || isAdmin ? '#10b981' : undefined,
                            '&:hover': { bgcolor: '#059669' }
                        }}>
                        Mark as Done
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* ── Header ── */}
            <Paper elevation={0} sx={{
                px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 2 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', borderRadius: '12px 12px 0 0',
                display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2,
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <OngoingIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} lineHeight={1}>Ongoing Tasks</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Manage, process and track all tasks</Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={1} alignItems="center" width={isMobile ? '100%' : 'auto'}>
                    <TextField
                        size="small" placeholder="Search task..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} /></InputAdornment> }}
                        sx={{
                            width: { xs: '100%', sm: 220 }, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2,
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' }
                        }} />
                    <Tooltip title="Toggle Filters">
                        <IconButton onClick={() => setShowFilters(s => !s)} sx={{ color: 'white', bgcolor: showFilters ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
                            <Badge badgeContent={activeFilters} color="error"><FilterIcon /></Badge>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => refetch()} sx={{ color: 'white' }}><RefreshIcon /></IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* ── Mini Stats Bar ── */}
            <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0', px: 3, py: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Total', count: stats.total, color: '#6366f1' },
                    { label: 'To Do', count: stats.pending, color: '#94a3b8' },
                    { label: 'In Process', count: stats.inProcess, color: '#3b82f6' },
                    { label: 'Pending Approval', count: stats.pendingApproval, color: '#f59e0b' },
                    { label: 'Approved', count: stats.approved, color: '#2dd4bf' },
                    { label: 'Done', count: stats.done, color: '#10b981' },
                    { label: 'Overdue', count: stats.overdue, color: '#ef4444' },
                ].map(s => (
                    <Box key={s.label} textAlign="center">
                        <Typography variant="h6" fontWeight={900} sx={{ color: s.color, lineHeight: 1 }}>{s.count}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{s.label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* ── Filters ── */}
            {showFilters && (
                <Paper sx={{ p: 2.5, borderRadius: 0, borderBottom: '1px solid #e2e8f0' }}>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Group', value: groupName, set: setGroupName, items: clientGroups.map((g: { _id: string; groupName: string }) => ({ v: g._id, l: g.groupName })) },
                            { label: 'Client', value: clientName, set: setClientName, items: clients.map((c: Client) => ({ v: c._id, l: c.name })) },
                            { label: 'Task', value: selectedTask, set: setSelectedTask, items: taskMasters.map((t: TaskMasterData) => ({ v: t._id, l: t.taskName })) },
                            { label: 'Frequency', value: frequency, set: setFrequency, items: frequencies.map(f => ({ v: f, l: f })) },
                            { label: 'Status', value: status, set: setStatus, items: Object.entries(STATUS_CONFIG).map(([v, c]) => ({ v, l: c.label })) },
                            { label: 'Employee', value: employee, set: setEmployee, items: staffUsers.map((u: User) => ({ v: u._id, l: u.name || u.username })) },
                            { label: 'Year', value: year, set: setYear, items: years.map(y => ({ v: y, l: y })) },
                        ].map(({ label, value, set, items }) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3, lg: 1.71 }} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                                <Select size="small" fullWidth displayEmpty value={value} onChange={e => set(e.target.value)} sx={{ mt: 0.5, borderRadius: 2 }}>
                                    <MenuItem value=""><em>All {label}s</em></MenuItem>
                                    {items.map((item: { v: string; l: string }) => <MenuItem key={item.v} value={item.v}>{item.l}</MenuItem>)}
                                </Select>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* ── Workflow Hint ── */}
            <Box sx={{ bgcolor: '#f0f4ff', border: '1px solid #c7d2fe', mx: 0, px: 3, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon sx={{ color: '#6366f1', fontSize: 18, flexShrink: 0 }} />
                <Typography variant="caption" color="#3730a3">
                    <strong>Workflow:</strong> Pending → Start Working → In Process → Submit for Approval → (Manager approves on Task Approval page) → Mark as Done ✅
                </Typography>
            </Box>

            {/* ── Table ── */}
            <Paper elevation={1} sx={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" sx={{ color: '#667eea' }} />
                        <Typography fontWeight={700} color="#334155">Job List ({filteredTasks.length})</Typography>
                    </Box>
                    <IconButton size="small"><ExpandMoreIcon /></IconButton>
                </Box>

                {isMobile ? (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {tasksLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                                <CircularProgress size={28} sx={{ color: '#667eea' }} />
                            </Box>
                        ) : filteredTasks.length > 0 ? (
                            filteredTasks.map((task: Task) => {
                                const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                                const pri = PRIORITY_BADGE[task.priority] || { label: task.priority, color: '#e2e8f0' };
                                const pct = task.checklist?.length > 0
                                    ? Math.round(task.checklist.filter(c => c.completed).length / task.checklist.length * 100)
                                    : task.progressPercentage || 0;

                                return (
                                    <Paper key={task._id} sx={{ p: 2, borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'none', position: 'relative', ...(task.isOverdue && task.status !== 'DONE' ? { bgcolor: '#fff5f5' } : {}) }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} color="#667eea">
                                                    {(task.clientId as Client)?.name || 'Internal'}
                                                </Typography>
                                                <Typography variant="body1" fontWeight={700} lineHeight={1.2} mt={0.5}>
                                                    {task.title}
                                                </Typography>
                                                {(task as Task & { frequency?: string }).frequency && (
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {(task as Task & { frequency?: string }).frequency}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Chip label={pri.label} size="small" sx={{ bgcolor: pri.color, fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5} mb={1}>
                                            <Chip
                                                label={cfg.label}
                                                size="small"
                                                sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', border: `1px solid ${cfg.color}30` }}
                                            />
                                            <Box textAlign="right">
                                                <Typography variant="caption" sx={{ color: task.isOverdue && task.status !== 'DONE' ? 'error.main' : 'text.secondary', fontWeight: task.isOverdue ? 700 : 500 }}>
                                                    🎯 {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '—'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box mb={2}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                <Typography variant="caption" color="text.secondary">Progress</Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{pct}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10b981' : '#667eea' } }} />
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} borderTop="1px solid #f0f0f0">
                                            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.62rem' } }}>
                                                {(task.assignedTo as User[] || []).map((u: User) => (
                                                    <Avatar key={u._id} sx={{ bgcolor: '#667eea' }}>
                                                        {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                ))}
                                            </AvatarGroup>
                                            <Button size="small" variant="contained"
                                                onClick={() => setProcessingTask(task)}
                                                sx={{
                                                    fontSize: '0.75rem', py: 0.5, px: 2, textTransform: 'none', fontWeight: 700,
                                                    borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    boxShadow: '0 2px 8px rgba(102,126,234,0.35)',
                                                }}>
                                                Process Task
                                            </Button>
                                        </Box>
                                    </Paper>
                                );
                            })
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <CheckIcon sx={{ fontSize: 48, color: '#10b981', opacity: 0.5, mb: 1.5 }} />
                                <Typography variant="h6" fontWeight={700} color="text.secondary">No Tasks Found</Typography>
                                <Typography variant="body2" color="text.disabled" mt={0.5}>{activeFilters > 0 ? 'Try adjusting your filters.' : 'No tasks assigned.'}</Typography>
                            </Box>
                        )}
                    </Box>
                ) : (
                <TableContainer sx={{ maxHeight: 520 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {['#', 'Client', 'Task Name', 'Priority', 'Target Date', 'Status', 'Progress', 'Assigned To', 'Action'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#475569', fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={9} sx={{ py: 6 }}>
                                        <CircularProgress size={28} sx={{ color: '#667eea' }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task: Task, index: number) => {
                                    const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                                    const pri = PRIORITY_BADGE[task.priority] || { label: task.priority, color: '#e2e8f0' };
                                    const pct = task.checklist?.length > 0
                                        ? Math.round(task.checklist.filter(c => c.completed).length / task.checklist.length * 100)
                                        : task.progressPercentage || 0;

                                    return (
                                        <TableRow key={task._id} hover sx={{
                                            '&:hover': { bgcolor: '#fafbff' },
                                            ...(task.isOverdue && task.status !== 'DONE' ? { bgcolor: '#fff5f5' } : {}),
                                        }}>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={700} color="text.secondary">{index + 1}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
                                                    {(task.clientId as Client)?.name || 'Internal'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200 }}>
                                                <Typography variant="body2" fontWeight={600} noWrap title={task.title}>{task.title}</Typography>
                                                {(task as Task & { frequency?: string }).frequency && (
                                                    <Typography variant="caption" color="text.secondary">{(task as Task & { frequency?: string }).frequency}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={pri.label} size="small" sx={{ bgcolor: pri.color, fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: task.isOverdue && task.status !== 'DONE' ? 'error.main' : 'inherit', fontWeight: task.isOverdue ? 700 : 400 }}>
                                                    {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '—'}
                                                </Typography>
                                                {task.isOverdue && task.status !== 'DONE' && (
                                                    <Typography variant="caption" color="error.main" display="flex" alignItems="center" gap={0.25}>
                                                        <OverdueIcon sx={{ fontSize: 12 }} /> Overdue
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cfg.label}
                                                    size="small"
                                                    sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.65rem', border: `1px solid ${cfg.color}30`, height: 22 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ minWidth: 90 }}>
                                                <LinearProgress variant="determinate" value={pct} sx={{
                                                    height: 5, borderRadius: 3, bgcolor: '#e2e8f0',
                                                    '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10b981' : '#667eea' }
                                                }} />
                                                <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.62rem' } }}>
                                                    {(task.assignedTo as User[] || []).map((u: User) => (
                                                        <Tooltip key={u._id} title={u.name || u.username}>
                                                            <Avatar sx={{ bgcolor: '#667eea' }}>
                                                                {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="small" variant="contained"
                                                    onClick={() => setProcessingTask(task)}
                                                    sx={{
                                                        fontSize: '0.72rem', py: 0.4, px: 1.5, textTransform: 'none', fontWeight: 700,
                                                        borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        boxShadow: '0 2px 8px rgba(102,126,234,0.35)',
                                                        '&:hover': { boxShadow: '0 4px 16px rgba(102,126,234,0.5)' }
                                                    }}>
                                                    Process
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={9} sx={{ py: 10 }}>
                                        <CheckIcon sx={{ fontSize: 48, color: '#10b981', opacity: 0.5, display: 'block', mx: 'auto', mb: 1.5 }} />
                                        <Typography variant="h6" fontWeight={700} color="text.secondary">No Tasks Found</Typography>
                                        <Typography variant="body2" color="text.disabled" mt={0.5}>
                                            {activeFilters > 0 ? 'Try adjusting your filters.' : 'No tasks have been assigned yet.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                )}
            </Paper>

            {renderModal()}
        </Box>
    );
};

export default OngoingTask;
