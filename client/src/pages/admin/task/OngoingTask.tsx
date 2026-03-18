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
    TableRow,
    TableHead,
    CircularProgress,
    Chip,
    Avatar,
    AvatarGroup,
    Tooltip,
    IconButton,
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    FormControl,
    InputLabel,
    LinearProgress,
    Alert,
} from '@mui/material';
import {
    List as ListIcon,
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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TaskMasterData, Client, User, Task, TaskStatus } from '../../../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pending', color: '#6b7280', bg: '#6b728020' },
    IN_PROCESS: { label: 'In Process', color: '#3b82f6', bg: '#3b82f620' },
    PENDING_FOR_APPROVAL: { label: 'Sent for Approval', color: '#f59e0b', bg: '#f59e0b20' },
    APPROVED: { label: 'Approved', color: '#2dd4bf', bg: '#2dd4bf20' },
    DONE: { label: 'Done', color: '#10b981', bg: '#10b98120' },
    ON_HOLD: { label: 'On Hold', color: '#8b5cf6', bg: '#8b5cf620' },
    PENDING_FROM_CLIENT: { label: 'Pending from Client', color: '#f97316', bg: '#f9731620' },
    PENDING_FROM_DEPARTMENT: { label: 'Pending from Dept', color: '#ec4899', bg: '#ec489920' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#ef444420' },
    REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#dc262620' },
};

// ─── Work flow steps shown visually ───
const FLOW_STEPS: { status: TaskStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'PENDING', label: 'To Do', icon: <PendingIcon fontSize="small" /> },
    { status: 'IN_PROCESS', label: 'In Process', icon: <StartIcon fontSize="small" /> },
    { status: 'PENDING_FOR_APPROVAL', label: 'Sent for Approval', icon: <SubmitIcon fontSize="small" /> },
    { status: 'APPROVED', label: 'Approved', icon: <DoneIcon fontSize="small" /> },
    { status: 'DONE', label: 'Done', icon: <DoneIcon fontSize="small" /> },
];

export const OngoingTask: React.FC = () => {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [status, setStatus] = useState('');
    const [employee, setEmployee] = useState('');
    const [search, setSearch] = useState('');
    const [processingTask, setProcessingTask] = useState<Task | null>(null);
    const [newComment, setNewComment] = useState('');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

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

    const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: ['tasks', groupName, clientName, selectedTask, frequency, status, employee],
        queryFn: () => taskService.getTasks({
            clientGroupId: groupName || undefined,
            clientId: clientName || undefined,
            status: (status as TaskStatus) || undefined,
            assignedTo: employee || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
        })
    });

    const filteredTasks = useMemo(() => {
        if (!search) return tasks;
        return tasks.filter(t =>
            (t.title?.toLowerCase().includes(search.toLowerCase()) || 
             (t.clientId as Client)?.name?.toLowerCase().includes(search.toLowerCase()))
        );
    }, [tasks, search]);

    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasksApproval'] });
            if (processingTask && processingTask._id === data.task._id) {
                setProcessingTask(data.task as Task);
            }
            toast.success('Status updated');
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === data.task._id) {
                setProcessingTask(data.task as Task);
            }
            setNewComment('');
            toast.success('Comment added');
        }
    });

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.startTimer(taskId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) {
                setProcessingTask(data.task as Task);
            }
        }
    });

    const stopTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.stopTimer(taskId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) {
                setProcessingTask(data.task as Task);
            }
        }
    });

    const updateChecklistMutation = useMutation({
        mutationFn: ({ taskId, itemId, completed }: { taskId: string; itemId: string; completed: boolean }) =>
            taskService.updateChecklistItem(taskId, itemId, completed),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (processingTask && processingTask._id === (data.task as Task)._id) {
                setProcessingTask(data.task as Task);
            }
        }
    });

    // Derived status data for UI sync
    const currentTask = (processingTask && tasks.find(t => t._id === processingTask._id)) || processingTask;


    const renderProcessingModal = () => {
        if (!currentTask) return null;
        const cfg = STATUS_CONFIG[currentTask.status] || STATUS_CONFIG.PENDING;
        const isTimerRunning = !!currentTask.currentTimerStart;

        // Progress calc for current task - properly synced with query data
        const completedCheck = currentTask.checklist?.filter(c => c.completed).length ?? 0;
        const totalCheck = currentTask.checklist?.length ?? 0;
        const checkPct = totalCheck > 0 ? Math.round((completedCheck / totalCheck) * 100) : 0;
        const flowStep = FLOW_STEPS.findIndex(s => s.status === currentTask.status);

        return (
            <Dialog
                open={!!processingTask}
                onClose={() => setProcessingTask(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, minHeight: '70vh' } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5, px: 2.5
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight="700" lineHeight={1}>Task Processing</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            {currentTask.title}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setProcessingTask(null)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                {/* Workflow Progress Bar */}
                <Box sx={{ px: 3, py: 1.5, bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                        Workflow Progress
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0}>
                        {FLOW_STEPS.map((step, idx) => {
                            const isDone = idx < flowStep;
                            const isCurrent = idx === flowStep;
                            const isLast = idx === FLOW_STEPS.length - 1;
                            return (
                                <React.Fragment key={step.status}>
                                    <Tooltip title={`Click to set: ${step.label}`}>
                                        <Box
                                            onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: step.status })}
                                            sx={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                cursor: 'pointer', minWidth: 70,
                                                '&:hover .step-label': { color: '#667eea' }
                                            }}
                                        >
                                            <Box sx={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: isCurrent ? '#667eea' : isDone ? '#10b981' : '#e0e0e0',
                                                color: (isCurrent || isDone) ? 'white' : '#9e9e9e',
                                                border: isCurrent ? '3px solid #764ba2' : 'none',
                                                transition: 'all 0.2s',
                                                boxShadow: isCurrent ? '0 0 0 4px rgba(102,126,234,0.2)' : 'none'
                                            }}>
                                                {step.icon}
                                            </Box>
                                            <Typography className="step-label" variant="caption" align="center"
                                                sx={{ mt: 0.5, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#667eea' : isDone ? '#10b981' : '#9e9e9e', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                                {step.label}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                    {!isLast && (
                                        <Box sx={{
                                            flex: 1, height: 2,
                                            bgcolor: idx < flowStep ? '#10b981' : '#e0e0e0',
                                            mt: '-16px'
                                        }} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </Box>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    <Grid container sx={{ minHeight: '50vh' }}>
                        {/* LEFT PANEL */}
                        <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, borderRight: '1px solid #eee' }}>
                            {/* Status + Info */}
                            <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
                                <Chip
                                    label={cfg.label}
                                    size="small"
                                    sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, border: `1px solid ${cfg.color}40` }}
                                />
                                {processingTask.isOverdue && (
                                    <Chip label="⚠ Overdue" size="small" color="error" variant="outlined" />
                                )}
                                <Chip label={`${processingTask.frequency || 'One Time'}`} size="small" variant="outlined" />
                                <Chip
                                    icon={<TimerIcon style={{ fontSize: 14 }} />}
                                    label={`${Math.round((processingTask.actualTimeSpent || 0) / 60 * 10) / 10}h spent`}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">
                                    {processingTask.description || 'No description available.'}
                                </Typography>
                                <Box display="flex" gap={2} mt={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Client:</strong> {(processingTask.clientId as Client)?.name || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Target:</strong> {new Date(processingTask.targetDate).toLocaleDateString('en-IN')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Est:</strong> {processingTask.estimatedHours}h
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* ── Quick Action Buttons ── */}
                            <Box mb={2}>
                                <Typography variant="subtitle2" gutterBottom fontWeight="700" color="text.secondary">
                                    ⚡ Quick Actions
                                </Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {/* Timer */}
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={isTimerRunning ? <StopIcon /> : <StartIcon />}
                                        color={isTimerRunning ? 'error' : 'success'}
                                        onClick={() => isTimerRunning
                                            ? stopTimerMutation.mutate(processingTask._id)
                                            : startTimerMutation.mutate(processingTask._id)}
                                        sx={{ borderRadius: 2, textTransform: 'none' }}
                                    >
                                        {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                                    </Button>

                                    {/* Status shortcuts */}
                                    {processingTask.status === 'PENDING' && (
                                        <Button variant="outlined" size="small" color="info"
                                            onClick={() => updateStatusMutation.mutate({ taskId: processingTask._id, status: 'IN_PROCESS' })}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}>
                                            Start Working
                                        </Button>
                                    )}

                                    {processingTask.status === 'IN_PROCESS' && (
                                        <Button variant="contained" size="small"
                                            startIcon={<SubmitIcon />}
                                            onClick={() => {
                                                updateStatusMutation.mutate({ taskId: processingTask._id, status: 'PENDING_FOR_APPROVAL' });
                                                toast.success('Task submitted for manager approval!');
                                            }}
                                            sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
                                            Submit for Approval
                                        </Button>
                                    )}

                                    {(processingTask.status === 'IN_PROCESS' || processingTask.status === 'PENDING_FOR_APPROVAL') && (
                                        <Button variant="outlined" size="small" color="warning"
                                            onClick={() => updateStatusMutation.mutate({ taskId: processingTask._id, status: 'ON_HOLD' })}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}>
                                            Put On Hold
                                        </Button>
                                    )}

                                    {/* More status override */}
                                    <FormControl size="small" sx={{ minWidth: 160 }}>
                                        <InputLabel sx={{ fontSize: '0.8rem' }}>Change Status</InputLabel>
                                        <Select
                                            value={processingTask.status}
                                            label="Change Status"
                                            onChange={(e) => updateStatusMutation.mutate({
                                                taskId: processingTask._id,
                                                status: e.target.value as TaskStatus
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                            sx={{ fontSize: '0.8rem' }}
                                        >
                                            <MenuItem value="PENDING">To Do</MenuItem>
                                            <MenuItem value="IN_PROCESS">In Process</MenuItem>
                                            <MenuItem value="PENDING_FOR_APPROVAL">Send for Approval</MenuItem>
                                            <MenuItem value="APPROVED">Approved</MenuItem>
                                            <MenuItem value="REJECTED">Rejected</MenuItem>
                                            <MenuItem value="ON_HOLD">On Hold</MenuItem>
                                            <MenuItem value="PENDING_FROM_CLIENT">Pending from Client</MenuItem>
                                            <MenuItem value="PENDING_FROM_DEPARTMENT">Pending from Dept</MenuItem>
                                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {/* Admin/Manager quick approve */}
                                    {currentTask.status === 'PENDING_FOR_APPROVAL' && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                                        <Button
                                            variant="contained" size="small" color="success"
                                            onClick={() => updateStatusMutation.mutate({ taskId: currentTask._id, status: 'APPROVED' })}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Approve Task
                                        </Button>
                                    )}
                                </Box>
                            </Box>

                            {/* ── Approval Status Info ── */}
                            {currentTask.status === 'PENDING_FOR_APPROVAL' && (
                                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                                    This task has been submitted and is <strong>awaiting manager approval</strong>.
                                    The reporting manager will approve or reject it from the <strong>Task Approval</strong> page.
                                </Alert>
                            )}
                            {currentTask.status === 'APPROVED' && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    ✅ This task has been <strong>approved</strong> by the manager.
                                    Click <strong>"Mark as Done"</strong> to complete it.
                                </Alert>
                            )}
                            {currentTask.status === 'REJECTED' && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    ❌ This task was <strong>rejected</strong> by the manager. Please review the activity log for feedback and resubmit.
                                </Alert>
                            )}

                            {/* ── Checklist ── */}
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="700" color="text.secondary">
                                        ✅ Checklist
                                    </Typography>
                                    <Typography variant="caption" color={checkPct === 100 ? 'success.main' : 'text.secondary'}>
                                        {completedCheck}/{totalCheck} done
                                    </Typography>
                                </Box>
                                {totalCheck > 0 && (
                                    <LinearProgress variant="determinate" value={checkPct}
                                        sx={{ mb: 1, height: 6, borderRadius: 3,
                                            bgcolor: '#e0e0e0',
                                            '& .MuiLinearProgress-bar': { bgcolor: checkPct === 100 ? '#10b981' : '#667eea' }
                                        }} />
                                )}
                                <List dense>
                                    {(currentTask.checklist || []).map((item) => (
                                        <ListItem key={item.id} dense disablePadding
                                            sx={{
                                                borderRadius: 1, mb: 0.25,
                                                bgcolor: item.completed ? 'rgba(16,185,129,0.06)' : 'transparent',
                                                '&:hover': { bgcolor: 'rgba(102,126,234,0.06)' }
                                            }}>
                                            <Checkbox
                                                edge="start"
                                                checked={item.completed}
                                                onChange={(e) => updateChecklistMutation.mutate({
                                                    taskId: currentTask._id,
                                                    itemId: item.id,
                                                    completed: e.target.checked
                                                })}
                                                sx={{ '&.Mui-checked': { color: '#10b981' } }}
                                                size="small"
                                            />
                                            <ListItemText
                                                primary={item.text}
                                                sx={{
                                                    '& .MuiListItemText-primary': {
                                                        textDecoration: item.completed ? 'line-through' : 'none',
                                                        color: item.completed ? 'text.disabled' : 'text.primary',
                                                        fontSize: '0.875rem',
                                                    }
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                    {totalCheck === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>
                                            No checklist items.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        </Grid>

                        {/* RIGHT PANEL: Activity Log */}
                        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="700" color="text.secondary">
                                💬 Activity Log
                            </Typography>
                            <Box sx={{
                                height: 320, overflowY: 'auto',
                                border: '1px solid #eee', borderRadius: 2,
                                bgcolor: 'white', p: 1.5, mb: 2
                            }}>
                                {(currentTask.comments || []).length === 0 ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <Typography variant="body2" color="text.disabled">No activities yet.</Typography>
                                    </Box>
                                ) : (
                                    [...(currentTask.comments || [])].reverse().map((comment) => (
                                        <Box key={comment.id} sx={{ mb: 1.5 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: '#667eea' }}>
                                                        {(comment.userName || '?').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="caption" fontWeight="700">{comment.userName}</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled">
                                                    {new Date(comment.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{
                                                bgcolor: '#f0f4f8', p: 1, borderRadius: '0 8px 8px 8px',
                                                mt: 0.5, fontSize: '0.85rem'
                                            }}>
                                                {comment.text}
                                            </Typography>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <TextField
                                fullWidth multiline rows={3}
                                placeholder="Add comment or note..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                size="small"
                                sx={{ bgcolor: 'white', borderRadius: 2 }}
                            />
                            <Button
                                fullWidth variant="contained" startIcon={<SubmitIcon />}
                                onClick={() => addCommentMutation.mutate({ taskId: currentTask._id, text: newComment })}
                                disabled={!newComment.trim() || addCommentMutation.isPending}
                                sx={{ mt: 1, bgcolor: '#764ba2', '&:hover': { bgcolor: '#667eea' }, textTransform: 'none' }}
                            >
                                Post Activity
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee', gap: 1 }}>
                    <Button onClick={() => setProcessingTask(null)} color="inherit" sx={{ textTransform: 'none' }}>
                        Close
                    </Button>

                    {/* Submit for Approval (big shortcut) */}
                    {currentTask.status === 'IN_PROCESS' && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<SubmitIcon />}
                            onClick={() => {
                                updateStatusMutation.mutate({ taskId: currentTask._id, status: 'PENDING_FOR_APPROVAL' });
                                toast.success('Task sent to manager for approval!');
                                setProcessingTask(null);
                            }}
                            sx={{ textTransform: 'none', borderColor: '#f59e0b', color: '#f59e0b' }}
                        >
                            Submit for Approval
                        </Button>
                    )}

                    {/* Mark Done (only after APPROVED, or if Admin/Manager) */}
                    <Button
                        variant="contained"
                        startIcon={<DoneIcon />}
                        disabled={(currentTask.status !== 'APPROVED' && user?.role !== 'ADMIN' && user?.role !== 'MANAGER') || updateStatusMutation.isPending}
                        onClick={() => {
                            updateStatusMutation.mutate({ taskId: currentTask._id, status: 'DONE' });
                            setProcessingTask(null);
                        }}
                        sx={{
                            textTransform: 'none',
                            bgcolor: currentTask.status === 'APPROVED' || currentTask.status === 'DONE' ? '#10b981' : undefined,
                            '&:hover': { bgcolor: '#059669' }
                        }}
                    >
                        Mark as Done
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <OngoingIcon />
                    <Typography variant="h6" fontWeight="500">Ongoing Task</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            width: 220,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                            },
                            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.7)' }
                        }}
                    />
                    <Button variant="contained" size="small" startIcon={<ListIcon />}
                        sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        List
                    </Button>
                </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
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
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value=""><em>All Statuses</em></MenuItem>
                                {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                    <MenuItem key={val} value={val}>{cfg.label}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Employee</Typography>
                            <Select size="small" fullWidth displayEmpty value={employee} onChange={(e) => setEmployee(e.target.value)}>
                                <MenuItem value=""><em>All Employees</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>All Years</em></MenuItem>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Workflow hint box */}
            <Paper sx={{ mb: 1, p: 1.5, bgcolor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 2 }}>
                <Typography variant="caption" color="primary" fontWeight="600">
                    📋 Task Workflow:&nbsp;
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Pending → In Process → <strong>Submit for Approval</strong> → (Manager approves on Task Approval page) → <strong>Mark as Done</strong>
                </Typography>
            </Paper>

            {/* Job List */}
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
                        <Typography fontWeight="500">Job List ({filteredTasks.length})</Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white' }}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>
                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#eee' }}>
                                <TableCell sx={{ fontWeight: 600 }}>SR No</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Client Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Task Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Target Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task: Task, index: number) => {
                                    const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                                    return (
                                        <TableRow key={task._id} hover
                                            sx={{ bgcolor: task.isOverdue && task.status !== 'DONE' ? 'rgba(239,68,68,0.03)' : 'inherit' }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{(task.clientId as Client)?.name || 'Internal'}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{task.title}</TableCell>
                                            <TableCell sx={{ color: task.isOverdue && task.status !== 'DONE' ? 'error.main' : 'inherit' }}>
                                                {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cfg.label}
                                                    size="small"
                                                    sx={{
                                                        height: 20, fontSize: '0.7rem',
                                                        bgcolor: cfg.bg, color: cfg.color,
                                                        fontWeight: 600, borderRadius: 1
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem' } }}>
                                                    {(task.assignedTo as User[] || []).map((u: User) => (
                                                        <Tooltip key={u._id} title={u.name || u.username}>
                                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small" variant="outlined"
                                                    onClick={() => setProcessingTask(task)}
                                                    sx={{
                                                        fontSize: '0.7rem', py: 0,
                                                        textTransform: 'none',
                                                        color: '#764ba2', borderColor: '#764ba2',
                                                        '&:hover': { borderColor: '#667eea', bgcolor: '#f0f0ff' }
                                                    }}
                                                >
                                                    Process
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={7} sx={{ color: 'text.secondary', py: 6 }}>
                                        No Record Found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {renderProcessingModal()}
        </Box>
    );
};

export default OngoingTask;
