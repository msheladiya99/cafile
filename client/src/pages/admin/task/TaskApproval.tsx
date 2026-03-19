import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Button, MenuItem, Select, Grid,
    Table, TableBody, TableCell, TableContainer, TableRow,
    IconButton, TableHead, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Divider, Alert,
    Avatar, Tooltip, LinearProgress, Badge, InputAdornment, useMediaQuery, useTheme
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    FactCheck as TaskIcon,
    Info as InfoIcon,
    Timer as TimerIcon,
    Search as SearchIcon,
    WorkspacePremium as PremiumIcon,
    FilterList as FilterIcon,
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    Warning as WarningIcon,
    CheckCircleOutline as DoneIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import { useAuth } from '../../../contexts/AuthContext';
import type { TaskMasterData, Client, Task, TaskStatus, User } from '../../../types';
import toast from 'react-hot-toast';

const FREQ_COLORS: Record<string, string> = {
    Daily: '#6366f1', Weekly: '#3b82f6', Monthly: '#10b981', Quarterly: '#f59e0b',
    'Half Yearly': '#f97316', Yearly: '#ec4899', 'One Time': '#94a3b8', Fortnightly: '#8b5cf6',
};

export const TaskApproval: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Dialogs
    const [rejectTask, setRejectTask] = useState<Task | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [detailTask, setDetailTask] = useState<Task | null>(null);

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    const { data: taskMasters = [] } = useQuery({ queryKey: ['taskMasters'], queryFn: taskMasterService.getTaskMasters });
    const { data: clientGroups = [] } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });

    const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: ['tasksApproval', groupName, clientName, selectedTask, frequency, user?._id],
        queryFn: () => taskService.getTasks({
            status: 'PENDING_FOR_APPROVAL',
            clientId: clientName || undefined,
            clientGroupId: groupName || undefined,
            reportingManager: user?.role === 'ADMIN' ? undefined : user?._id
        }),
        refetchInterval: 30_000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasksApproval'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            const msg = variables.status === 'APPROVED'
                ? '✅ Task approved! Employee can now mark it as Done.'
                : '❌ Task rejected. Employee has been notified.';
            toast.success(msg);
        },
        onError: (error: Error) => { toast.error(error.message || 'Failed to update status'); }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
    });

    const handleApprove = (taskId: string) => updateStatusMutation.mutate({ taskId, status: 'APPROVED' });

    const handleRejectConfirm = async () => {
        if (!rejectTask) return;
        if (rejectReason.trim()) {
            await addCommentMutation.mutateAsync({ taskId: rejectTask._id, text: `❌ Rejected: ${rejectReason}` });
        }
        updateStatusMutation.mutate({ taskId: rejectTask._id, status: 'REJECTED' });
        setRejectTask(null);
        setRejectReason('');
    };

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

    const filteredTasks = useMemo(() => tasks.filter(t => {
        const taskAny = t as Task & { taskMasterId?: string; frequency?: string };
        if (selectedTask && taskAny.taskMasterId !== selectedTask) return false;
        if (frequency && taskAny.frequency !== frequency) return false;
        if (search) {
            const s = search.toLowerCase();
            if (!t.title?.toLowerCase().includes(s) && !(t.clientId as Client)?.name?.toLowerCase().includes(s)) return false;
        }
        return true;
    }), [tasks, selectedTask, frequency, search]);

    const getAssignedNames = (task: Task) =>
        (task.assignedTo as User[])?.map(u => u.name || u.username).filter(Boolean).join(', ') || '—';

    return (
        <Box sx={{ p: 0 }}>
            {/* ── Header ── */}
            <Paper elevation={0} sx={{
                p: { xs: 2.5, sm: 2 },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px 12px 0 0',
                display: 'flex', flexDirection: { xs: 'column', md: 'row' }, 
                justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' },
                gap: { xs: 2, md: 0 }
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TaskIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} lineHeight={1}>Task Approval</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Review & approve completed tasks</Typography>
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Search tasks or client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} /></InputAdornment> }}
                        sx={{
                            flexGrow: { xs: 1, md: 0 }, width: { xs: '100%', md: 220 }, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2,
                            '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } },
                            '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' }
                        }}
                    />
                    <Tooltip title="Toggle Filters">
                        <IconButton onClick={() => setShowFilters(s => !s)} sx={{ color: 'white', bgcolor: showFilters ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
                            <Badge badgeContent={[groupName, clientName, selectedTask, frequency].filter(Boolean).length} color="error">
                                <FilterIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                    {!tasksLoading && (
                        <Chip
                            label={`${filteredTasks.length} pending`}
                            size="small"
                            icon={<PremiumIcon sx={{ fontSize: '14px !important', color: 'white !important' }} />}
                            sx={{ bgcolor: filteredTasks.length > 0 ? '#f59e0b' : 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                        />
                    )}
                </Box>
            </Paper>

            {/* ── Info Banner ── */}
            <Box sx={{
                bgcolor: '#fffbeb', border: '1px solid #fde68a', p: 1.5,
                display: 'flex', gap: 1, alignItems: 'flex-start'
            }}>
                <InfoIcon sx={{ color: '#f59e0b', mt: 0.3, fontSize: 18, flexShrink: 0 }} />
                <Box>
                    <Typography variant="body2" fontWeight={700} color="#92400e">How Task Approval Works</Typography>
                    <Typography variant="caption" color="#78350f">
                        When a staff member completes a task, they click <strong>"Submit for Approval"</strong>. The task appears here with status <em>Pending for Approval</em>.
                        <strong> Approve</strong> to let the employee mark it as Done, or <strong>Reject</strong> with feedback so they can rework and resubmit.
                    </Typography>
                </Box>
            </Box>

            {/* ── Filters (collapsible) ── */}
            {showFilters && (
                <Paper sx={{ p: 2.5, borderRadius: 0, borderBottom: '1px solid #eee' }}>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Group', value: groupName, set: setGroupName, items: clientGroups.map((g: { _id: string; groupName: string }) => ({ v: g._id, l: g.groupName })) },
                            { label: 'Client', value: clientName, set: setClientName, items: clients.map((c: Client) => ({ v: c._id, l: c.name })) },
                            { label: 'Task', value: selectedTask, set: setSelectedTask, items: taskMasters.map((t: TaskMasterData) => ({ v: t._id, l: t.taskName })) },
                            { label: 'Frequency', value: frequency, set: setFrequency, items: frequencies.map(f => ({ v: f, l: f })) },
                            { label: 'Year', value: year, set: setYear, items: years.map(y => ({ v: y, l: y })) },
                        ].map(({ label, value, set, items }) => (
                            <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={label}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                                <Select size="small" fullWidth displayEmpty value={value} onChange={e => set(e.target.value)} sx={{ mt: 0.5 }}>
                                    <MenuItem value=""><em>All {label}s</em></MenuItem>
                                    {items.map((item: { v: string; l: string }) => <MenuItem key={item.v} value={item.v}>{item.l}</MenuItem>)}
                                </Select>
                            </Grid>
                        ))}
                    </Grid>
                    {[groupName, clientName, selectedTask, frequency].some(Boolean) && (
                        <Box mt={1.5} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                            <Typography variant="caption" color="text.secondary">Active filters:</Typography>
                            {groupName && <Chip size="small" label={`Group: ${clientGroups.find((g: { _id: string; groupName: string }) => g._id === groupName)?.groupName}`} onDelete={() => setGroupName('')} />}
                            {clientName && <Chip size="small" label={`Client: ${clients.find((c: Client) => c._id === clientName)?.name}`} onDelete={() => setClientName('')} />}
                            {selectedTask && <Chip size="small" label={`Task: ${taskMasters.find((t: TaskMasterData) => t._id === selectedTask)?.taskName}`} onDelete={() => setSelectedTask('')} />}
                            {frequency && <Chip size="small" label={`Freq: ${frequency}`} onDelete={() => setFrequency('')} />}
                        </Box>
                    )}
                </Paper>
            )}

            {/* ── Table ── */}
            <Paper elevation={1} sx={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid #e2e8f0',
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" sx={{ color: '#667eea' }} />
                        <Typography fontWeight={700} color="#334155">
                            Approval Queue ({filteredTasks.length})
                        </Typography>
                    </Box>
                    <IconButton size="small"><ExpandMoreIcon /></IconButton>
                </Box>

                {tasksLoading && <LinearProgress sx={{ height: 3 }} />}

                <TableContainer sx={{ maxHeight: 560 }}>
                    {isMobile ? (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f8fafc' }}>
                            {tasksLoading ? (
                                <Box display="flex" flexDirection="column" alignItems="center" gap={1} py={4}>
                                    <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
                                    <Typography variant="caption" color="text.secondary">Loading approval queue…</Typography>
                                </Box>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task, index) => {
                                    const completed = task.checklist?.filter(c => c.completed).length ?? 0;
                                    const total = task.checklist?.length ?? 0;
                                    const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
                                    const timeH = Math.round((task.actualTimeSpent || 0) / 60 * 10) / 10;
                                    const isOverdue = task.isOverdue;
                                    const freq = (task as Task & { frequency?: string }).frequency;

                                    return (
                                        <Paper key={task._id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: isOverdue ? '#fff5f5' : 'white', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="caption" fontWeight="700" color="text.secondary" mr={1}>#{index + 1}</Typography>
                                                    <Typography variant="subtitle1" component="span" fontWeight="700" color="primary.main">{task.title}</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>{(task.clientId as Client)?.name || 'Internal'}</Typography>
                                                </Box>
                                                {freq && (
                                                    <Chip label={freq} size="small" sx={{
                                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                                        bgcolor: `${FREQ_COLORS[freq] || '#94a3b8'}15`,
                                                        color: FREQ_COLORS[freq] || '#94a3b8',
                                                    }} />
                                                )}
                                            </Box>
                                            
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Assigned To</Typography>
                                                    <Typography variant="body2" fontWeight="500" noWrap>{getAssignedNames(task)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Due Date</Typography>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <Typography variant="body2" sx={{ color: isOverdue ? 'error.main' : 'inherit', fontWeight: isOverdue ? 700 : 500 }}>
                                                            {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '—'}
                                                        </Typography>
                                                        {isOverdue && <WarningIcon sx={{ fontSize: 12, color: 'error.main' }} />}
                                                    </Box>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Time Spent</Typography>
                                                    <Typography variant="body2" color={timeH > (task.estimatedHours || 1) ? 'error.main' : 'text.secondary'} fontWeight="600">
                                                        {timeH}h <span style={{fontWeight: 400}}>Est: {task.estimatedHours || 1}h</span>
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Checklist</Typography>
                                                    {total > 0 ? (
                                                        <Typography variant="caption" color={pct === 100 ? 'success.main' : 'text.secondary'} fontWeight={600}>
                                                            {completed}/{total} ({pct}%)
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 1 }} />
                                            
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Button size="small" variant="outlined" startIcon={<InfoIcon />} onClick={() => setDetailTask(task)}
                                                    sx={{ textTransform: 'none', fontWeight: 600 }}>
                                                    Info
                                                </Button>
                                                <Button size="small" variant="contained" color="error"
                                                    startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => setRejectTask(task)}
                                                    disabled={updateStatusMutation.isPending}
                                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                                    Reject
                                                </Button>
                                                <Button size="small" variant="contained" color="success"
                                                    startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => handleApprove(task._id)}
                                                    disabled={updateStatusMutation.isPending}
                                                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                                    Approve
                                                </Button>
                                            </Box>
                                        </Paper>
                                    );
                                })
                            ) : (
                                <Box p={4} textAlign="center">
                                    <DoneIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.6, display: 'block', mx: 'auto', mb: 1 }} />
                                    <Typography variant="subtitle1" fontWeight={700} color="text.secondary">All Caught Up!</Typography>
                                    <Typography variant="body2" color="text.disabled">No tasks are pending approval right now.</Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    {['#', 'Client', 'Task / Frequency', 'Assigned To', 'Due Date', 'Time', 'Checklist', 'Actions'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, bgcolor: '#f8fafc', color: '#475569', fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasksLoading ? (
                                    <TableRow>
                                        <TableCell align="center" colSpan={8} sx={{ py: 6 }}>
                                            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                                                <LinearProgress sx={{ width: 200, borderRadius: 2 }} />
                                                <Typography variant="caption" color="text.secondary">Loading approval queue…</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTasks.length > 0 ? (
                                    filteredTasks.map((task, index) => {
                                        const completed = task.checklist?.filter(c => c.completed).length ?? 0;
                                        const total = task.checklist?.length ?? 0;
                                        const pct = total > 0 ? Math.round((completed / total) * 100) : 100;
                                        const timeH = Math.round((task.actualTimeSpent || 0) / 60 * 10) / 10;
                                        const isOverdue = task.isOverdue;
                                        const freq = (task as Task & { frequency?: string }).frequency;

                                        return (
                                            <TableRow key={task._id} hover sx={{
                                                '&:hover': { bgcolor: '#fafafe' },
                                                ...(isOverdue ? { bgcolor: '#fff5f5' } : {})
                                            }}>
                                                <TableCell>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary">{index + 1}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{(task.clientId as Client)?.name || 'Internal'}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 200 }}>
                                                    <Typography variant="body2" fontWeight={600} noWrap title={task.title}>{task.title}</Typography>
                                                    {freq && (
                                                        <Chip label={freq} size="small" sx={{
                                                            height: 18, fontSize: '0.62rem', fontWeight: 700, mt: 0.25,
                                                            bgcolor: `${FREQ_COLORS[freq] || '#94a3b8'}15`,
                                                            color: FREQ_COLORS[freq] || '#94a3b8',
                                                        }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                                        {(task.assignedTo as User[])?.slice(0, 3).map(u => (
                                                            <Tooltip key={u._id} title={u.name || u.username}>
                                                                <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#667eea' }}>
                                                                    {(u.name || u.username || '?').charAt(0).toUpperCase()}
                                                                </Avatar>
                                                            </Tooltip>
                                                        ))}
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" noWrap>{getAssignedNames(task)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: isOverdue ? 'error.main' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                                                        {task.targetDate ? new Date(task.targetDate).toLocaleDateString('en-IN') : '—'}
                                                    </Typography>
                                                    {isOverdue && (
                                                        <Box display="flex" alignItems="center" gap={0.25}>
                                                            <WarningIcon sx={{ fontSize: 12, color: 'error.main' }} />
                                                            <Typography variant="caption" color="error.main" fontWeight={700}>Overdue</Typography>
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <TimerIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                                        <Typography variant="caption" fontWeight={600}>{timeH}h</Typography>
                                                    </Box>
                                                    <Typography variant="caption" color={timeH > (task.estimatedHours || 1) ? 'error.main' : 'text.secondary'}>
                                                        Est: {task.estimatedHours || 1}h
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 100 }}>
                                                    {total > 0 ? (
                                                        <Box>
                                                            <LinearProgress variant="determinate" value={pct} sx={{
                                                                height: 5, borderRadius: 3, bgcolor: '#e2e8f0',
                                                                '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#10b981' : '#667eea' }
                                                            }} />
                                                            <Typography variant="caption" color={pct === 100 ? 'success.main' : 'text.secondary'} fontWeight={600}>
                                                                {completed}/{total} ({pct}%)
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Chip label="N/A" size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" gap={0.5} alignItems="center">
                                                        <Tooltip title="View task details">
                                                            <IconButton size="small" onClick={() => setDetailTask(task)}
                                                                sx={{ color: '#667eea', bgcolor: '#f0f0ff', '&:hover': { bgcolor: '#667eea', color: 'white' } }}>
                                                                <InfoIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Button size="small" variant="contained" color="success"
                                                            startIcon={<ApproveIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => handleApprove(task._id)}
                                                            disabled={updateStatusMutation.isPending}
                                                            sx={{ fontSize: '0.72rem', py: 0.4, px: 1.2, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                                            Approve
                                                        </Button>
                                                        <Button size="small" variant="contained" color="error"
                                                            startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => setRejectTask(task)}
                                                            disabled={updateStatusMutation.isPending}
                                                            sx={{ fontSize: '0.72rem', py: 0.4, px: 1.2, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                                            Reject
                                                        </Button>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell align="center" colSpan={8} sx={{ py: 10 }}>
                                            <DoneIcon sx={{ fontSize: 56, color: '#10b981', opacity: 0.6, display: 'block', mx: 'auto', mb: 1.5 }} />
                                            <Typography variant="h6" fontWeight={700} color="text.secondary">All Caught Up!</Typography>
                                            <Typography variant="body2" color="text.disabled" mt={0.5}>
                                                No tasks are pending approval right now.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Paper>

            {/* ── Reject Dialog ── */}
            <Dialog open={!!rejectTask} onClose={() => { setRejectTask(null); setRejectReason(''); }} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ bgcolor: '#fee2e2', color: '#b91c1c', py: 2 }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: '#fca5a5', color: '#b91c1c', width: 36, height: 36 }}><RejectIcon /></Avatar>
                        <Box>
                            <Typography fontWeight={800}>Reject Task</Typography>
                            <Typography variant="caption" sx={{ color: '#b91c1c99' }}>Provide feedback for the employee</Typography>
                        </Box>
                    </Box>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2.5 }}>
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        The employee will be able to rework and resubmit this task.
                    </Alert>
                    <Typography variant="body2" color="text.secondary" mb={1.5}>
                        <strong>Task:</strong> {rejectTask?.title}
                    </Typography>
                    <TextField fullWidth multiline rows={3}
                        label="Reason for Rejection (optional but recommended)"
                        placeholder="Explain what needs to be fixed or improved..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        size="small" sx={{ borderRadius: 2 }} />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => { setRejectTask(null); setRejectReason(''); }} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleRejectConfirm}
                        disabled={updateStatusMutation.isPending}
                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}>
                        Confirm Rejection
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Detail Dialog ── */}
            <Dialog open={!!detailTask} onClose={() => setDetailTask(null)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', py: 2 }}>
                    <Typography fontWeight={800} lineHeight={1}>Task Details</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>{detailTask?.title}</Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5 }}>
                    {detailTask && (
                        <Box>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'Client', value: (detailTask.clientId as Client)?.name || 'Internal' },
                                    { label: 'Target Date', value: new Date(detailTask.targetDate).toLocaleDateString('en-IN') },
                                    { label: 'Assigned To', value: getAssignedNames(detailTask) },
                                    { label: 'Time Spent', value: `${Math.round((detailTask.actualTimeSpent || 0) / 60 * 10) / 10}h / ${detailTask.estimatedHours || 1}h estimated` },
                                ].map(({ label, value }) => (
                                    <Grid size={{ xs: 6 }} key={label}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
                                        <Typography variant="body2" fontWeight={600} mt={0.25}>{value}</Typography>
                                    </Grid>
                                ))}
                            </Grid>

                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight={700} mb={1}>Description</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                                {detailTask.description || 'No description provided.'}
                            </Typography>

                            {(detailTask.checklist?.length || 0) > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight={700}>Checklist</Typography>
                                        <Chip size="small"
                                            label={`${detailTask.checklist.filter(c => c.completed).length}/${detailTask.checklist.length} done`}
                                            color={detailTask.checklist.every(c => c.completed) ? 'success' : 'default'} />
                                    </Box>
                                    {detailTask.checklist.map(item => (
                                        <Box key={item.id} display="flex" alignItems="center" gap={1.5} py={0.75}
                                            sx={{ borderRadius: 1, bgcolor: item.completed ? '#f0fdf4' : 'transparent', px: 1, mb: 0.25 }}>
                                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: item.completed ? '#10b981' : '#e2e8f0', flexShrink: 0 }} />
                                            <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.disabled' : 'inherit' }}>
                                                {item.text}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            )}

                            {(detailTask.comments?.length || 0) > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Latest Activity</Typography>
                                    {[...detailTask.comments].reverse().slice(0, 4).map(c => (
                                        <Box key={c.id} sx={{ mb: 1.5 }}>
                                            <Box display="flex" alignItems="center" gap={1} mb={0.25}>
                                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: '#667eea' }}>
                                                    {(c.userName || '?').charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Typography variant="caption" fontWeight={700}>{c.userName}</Typography>
                                                <Typography variant="caption" color="text.disabled" ml="auto">
                                                    {new Date(c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ bgcolor: '#f0f4f8', p: 1, borderRadius: '0 8px 8px 8px', fontSize: '0.82rem' }}>
                                                {c.text}
                                            </Typography>
                                        </Box>
                                    ))}
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setDetailTask(null)} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Close</Button>
                    {detailTask && (
                        <>
                            <Button variant="contained" color="error"
                                onClick={() => { setRejectTask(detailTask); setDetailTask(null); }}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}>
                                Reject
                            </Button>
                            <Button variant="contained" color="success"
                                onClick={() => { handleApprove(detailTask._id); setDetailTask(null); }}
                                disabled={updateStatusMutation.isPending}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}>
                                Approve ✅
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TaskApproval;
