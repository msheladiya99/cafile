import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Chip, Avatar, LinearProgress,
    Grid, Stack, Skeleton, IconButton, Collapse, Tooltip,
    Select, FormControl, MenuItem, TextField, Button, alpha
} from '@mui/material';
import {
    Assignment as TaskIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Business as BusinessIcon,
    AccessTime as TimeIcon,
    FiberManualRecord as DotIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    CheckCircle,
    HourglassEmpty,
    PlayCircle,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { taskService } from '../../services/taskService';
import type { Task } from '../../types';
import toast from 'react-hot-toast';

// ── Status config ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING:                 { label: 'Pending',          color: '#92400e', bg: '#fef3c7', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    IN_PROCESS:              { label: 'In Process',       color: '#1e40af', bg: '#dbeafe', icon: <PlayCircle sx={{ fontSize: 14 }} /> },
    PENDING_FOR_APPROVAL:    { label: 'Pending Approval', color: '#6d28d9', bg: '#ede9fe', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    APPROVED:                { label: 'Approved',         color: '#065f46', bg: '#d1fae5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    DONE:                    { label: 'Done',             color: '#065f46', bg: '#d1fae5', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    CANCELLED:               { label: 'Cancelled',        color: '#6b7280', bg: '#f3f4f6', icon: <ClearIcon sx={{ fontSize: 14 }} /> },
    ON_HOLD:                 { label: 'On Hold',          color: '#7c3aed', bg: '#ede9fe', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    PENDING_FROM_CLIENT:     { label: 'Pending (Client)', color: '#b45309', bg: '#fef3c7', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    PENDING_FROM_DEPARTMENT: { label: 'Pending (Dept)',   color: '#b45309', bg: '#fef3c7', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    REJECTED:                { label: 'Rejected',         color: '#991b1b', bg: '#fee2e2', icon: <WarningIcon sx={{ fontSize: 14 }} /> },
};

const PRIORITY_DOT: Record<string, string> = {
    LOW: '#9ca3af', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#8b5cf6',
};

const UPDATABLE_STATUSES = [
    'PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'ON_HOLD',
    'PENDING_FROM_CLIENT', 'PENDING_FROM_DEPARTMENT', 'DONE',
];

const fmtDate = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtMins = (mins: number) => {
    if (!mins) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
};

// ── Task Card Component ──────────────────────────────────────────
const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const [open, setOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState('');
    const queryClient = useQueryClient();

    const status = STATUS_CONFIG[task.status] ?? { label: task.status, color: '#374151', bg: '#f3f4f6', icon: null };
    const priorityDot = PRIORITY_DOT[task.priority] ?? '#9ca3af';
    const isOverdue = task.isOverdue && !['DONE', 'CANCELLED', 'APPROVED'].includes(task.status);
    const clientName = task.clientId
        ? (typeof task.clientId === 'object' ? (task.clientId as { name: string }).name : task.clientId)
        : null;

    const { mutate: changeStatus, isPending } = useMutation({
        mutationFn: (newStatus: string) => taskService.updateStatus(task._id, newStatus as Parameters<typeof taskService.updateStatus>[1]),
        onSuccess: () => {
            toast.success('Task status updated');
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
            setUpdatingStatus('');
        },
        onError: () => { toast.error('Failed to update status'); setUpdatingStatus(''); },
    });

    return (
        <Paper
            sx={{
                borderRadius: '14px',
                overflow: 'hidden',
                border: isOverdue ? '1.5px solid #fca5a5' : '1px solid #e5e7eb',
                boxShadow: isOverdue ? '0 4px 16px rgba(239,68,68,0.08)' : '0 2px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
            }}
        >
            {/* Card Header */}
            <Box
                sx={{
                    px: 2.5, py: 2,
                    background: isOverdue ? '#fff5f5' : '#fff',
                    borderBottom: open ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                }}
                onClick={() => setOpen(o => !o)}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" flex={1} minWidth={0}>
                        <Box sx={{ mt: 0.4, flexShrink: 0 }}>
                            <DotIcon sx={{ fontSize: 10, color: priorityDot }} />
                        </Box>
                        <Box flex={1} minWidth={0}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.35, color: '#111827' }}>
                                {task.title}
                            </Typography>
                            {clientName && (
                                <Stack direction="row" spacing={0.5} alignItems="center" mt={0.4}>
                                    <BusinessIcon sx={{ fontSize: 12, color: '#9ca3af' }} />
                                    <Typography variant="caption" sx={{ color: '#6b7280' }}>{clientName}</Typography>
                                </Stack>
                            )}
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                        <Chip
                            label={status.label}
                            size="small"
                            sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.68rem', height: 22, border: 'none' }}
                        />
                        <IconButton size="small" sx={{ p: 0.3 }}>
                            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Stack>

                {/* Progress bar */}
                {(task.progressPercentage ?? 0) > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" mb={0.4}>
                            <Typography variant="caption" sx={{ color: '#9ca3af' }}>Progress</Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>{task.progressPercentage}%</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage ?? 0}
                            sx={{
                                height: 5, borderRadius: 3, bgcolor: '#f0f0f0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: (task.progressPercentage ?? 0) === 100 ? '#22c55e' : '#667eea'
                                }
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Expanded Detail */}
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ px: 2.5, py: 2, bgcolor: '#f8fafc' }}>
                    <Grid container spacing={2}>
                        {/* Dates */}
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Target Date</Typography>
                            <Typography variant="body2" sx={{ mt: 0.3, fontWeight: 600, color: isOverdue ? '#ef4444' : '#374151' }}>
                                {fmtDate(task.targetDate)}
                                {isOverdue && <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#ef4444' }}>⚠ Overdue</Typography>}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Date</Typography>
                            <Typography variant="body2" sx={{ mt: 0.3, color: '#374151' }}>{fmtDate(task.startDate)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Priority</Typography>
                            <Typography variant="body2" sx={{ mt: 0.3, fontWeight: 700, color: PRIORITY_DOT[task.priority] ?? '#6b7280' }}>
                                {task.priority}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Time Spent</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.3}>
                                <TimeIcon sx={{ fontSize: 13, color: '#9ca3af' }} />
                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                    {fmtMins(task.actualTimeSpent ?? 0)} / {task.estimatedHours ?? 0}h est.
                                </Typography>
                            </Stack>
                        </Grid>

                        {/* Description */}
                        {task.description && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
                                <Typography variant="body2" sx={{ mt: 0.3, color: '#6b7280', lineHeight: 1.6 }}>{task.description}</Typography>
                            </Grid>
                        )}

                        {/* Checklist */}
                        {task.checklist && task.checklist.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Checklist ({task.checklist.filter((c: { completed: boolean }) => c.completed).length}/{task.checklist.length})
                                </Typography>
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {task.checklist.map((item: { id: string; text: string; completed: boolean }) => (
                                        <Chip
                                            key={item.id}
                                            label={item.text}
                                            size="small"
                                            sx={{
                                                bgcolor: item.completed ? '#d1fae5' : '#f3f4f6',
                                                color: item.completed ? '#065f46' : '#374151',
                                                fontSize: '0.7rem',
                                                textDecoration: item.completed ? 'line-through' : 'none',
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        )}

                        {/* Status Update */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Update Status</Typography>
                            <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                                {UPDATABLE_STATUSES.map(s => {
                                    const cfg = STATUS_CONFIG[s];
                                    const isActive = task.status === s;
                                    return (
                                        <Chip
                                            key={s}
                                            label={cfg?.label ?? s}
                                            size="small"
                                            onClick={() => {
                                                if (!isActive && !isPending) {
                                                    setUpdatingStatus(s);
                                                    changeStatus(s);
                                                }
                                            }}
                                            disabled={isPending && updatingStatus !== s}
                                            sx={{
                                                cursor: isActive ? 'default' : 'pointer',
                                                bgcolor: isActive ? cfg?.bg : '#f3f4f6',
                                                color: isActive ? cfg?.color : '#6b7280',
                                                fontWeight: isActive ? 700 : 500,
                                                fontSize: '0.7rem',
                                                border: isActive ? `1.5px solid ${cfg?.color}40` : '1px solid transparent',
                                                '&:hover': !isActive ? { bgcolor: cfg?.bg, color: cfg?.color } : {},
                                                opacity: isPending && updatingStatus === s ? 0.6 : 1,
                                            }}
                                        />
                                    );
                                })}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>
            </Collapse>
        </Paper>
    );
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; color: string; emoji: string }> = ({ label, value, color, emoji }) => (
    <Paper sx={{
        p: 2, borderRadius: '14px', textAlign: 'center',
        borderTop: `3px solid ${color}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        '&:hover': { boxShadow: `0 4px 20px ${alpha(color, 0.2)}`, transform: 'translateY(-2px)' },
        transition: 'all 0.2s',
    }}>
        <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{emoji}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mt: 0.3 }}>{label}</Typography>
    </Paper>
);

// ── Main Component ───────────────────────────────────────────────
export const StaffMyTasks: React.FC = () => {
    const { user } = useAuth();
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['myTasks', user?._id],
        queryFn: () => taskService.getTasks({ assignedTo: user?._id, myTasks: true }),
        enabled: !!user?._id,
        refetchInterval: 30000,
    });

    const filtered = useMemo(() => (tasks as Task[]).filter(t => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [tasks, statusFilter, search]);

    const counts = useMemo(() => ({
        total:    tasks.length,
        pending:  (tasks as Task[]).filter(t => t.status === 'PENDING').length,
        inProcess: (tasks as Task[]).filter(t => ['IN_PROCESS', 'PENDING_FOR_APPROVAL'].includes(t.status)).length,
        done:     (tasks as Task[]).filter(t => ['DONE', 'APPROVED'].includes(t.status)).length,
        overdue:  (tasks as Task[]).filter(t => t.isOverdue && !['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)).length,
    }), [tasks]);

    const greetingHour = new Date().getHours();
    const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
            <Helmet>
                <title>My Tasks | MyCAFile</title>
            </Helmet>

            {/* ── Header ── */}
            <Box sx={{ mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
                    <Box>
                        <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 700, mb: 0.3 }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ color: '#111827', letterSpacing: -0.3 }}>
                            {greeting}, {user?.name || user?.username} 👋
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.3 }}>
                            You have <strong style={{ color: counts.overdue > 0 ? '#ef4444' : '#111827' }}>{counts.overdue}</strong> overdue and <strong>{counts.pending}</strong> pending tasks.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FilterIcon />}
                            onClick={() => setShowFilters(f => !f)}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                        >
                            Filters {showFilters ? '▲' : '▼'}
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {/* ── Stat Cards ── */}
            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Assigned', value: counts.total,    color: '#667eea', emoji: '📋' },
                    { label: 'Pending',         value: counts.pending,  color: '#f59e0b', emoji: '⏳' },
                    { label: 'In Progress',     value: counts.inProcess, color: '#3b82f6', emoji: '🔄' },
                    { label: 'Completed',       value: counts.done,     color: '#22c55e', emoji: '✅' },
                    { label: 'Overdue',         value: counts.overdue,  color: '#ef4444', emoji: '🚨' },
                ].map(c => (
                    <Grid key={c.label} size={{ xs: 6, sm: 4, md: 'auto' }} sx={{ flex: { md: 1 } }}>
                        {isLoading ? <Skeleton variant="rounded" height={88} sx={{ borderRadius: '14px' }} /> : <StatCard {...c} />}
                    </Grid>
                ))}
            </Grid>

            {/* ── Filters ── */}
            <Collapse in={showFilters}>
                <Paper sx={{ p: 2, mb: 2.5, borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <Typography sx={{ fontSize: 12, mb: 0.5, color: '#6b7280', fontWeight: 600 }}>Search Task</Typography>
                            <TextField
                                fullWidth size="small" placeholder="Search by task name..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <Typography sx={{ fontSize: 12, mb: 0.5, color: '#6b7280', fontWeight: 600 }}>Filter by Status</Typography>
                            <FormControl size="small" fullWidth>
                                <Select
                                    displayEmpty value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    sx={{ borderRadius: '10px' }}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                        <MenuItem key={key} value={key}>
                                            <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <Button
                                variant="outlined" color="error" fullWidth
                                startIcon={<ClearIcon />}
                                onClick={() => { setSearch(''); setStatusFilter(''); }}
                                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, height: 40 }}
                            >
                                Clear
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {/* ── Tasks List ── */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#111827' }}>
                        My Tasks
                    </Typography>
                    <Chip
                        label={`${filtered.length} task${filtered.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{ bgcolor: '#6366f1', color: '#fff', fontWeight: 700 }}
                    />
                </Stack>

                {isLoading ? (
                    <Stack spacing={1.5}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '14px' }} />)}
                    </Stack>
                ) : filtered.length === 0 ? (
                    <Paper sx={{ py: 8, textAlign: 'center', borderRadius: '14px', border: '1px dashed #e5e7eb', boxShadow: 'none' }}>
                        <Typography sx={{ fontSize: '3rem', mb: 1 }}>🎉</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#111827' }}>
                            {tasks.length === 0 ? 'No tasks assigned yet!' : 'No tasks match your filter'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 0.5 }}>
                            {tasks.length === 0 ? 'You\'re all caught up. Enjoy your day!' : 'Try clearing the filters above.'}
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1.5}>
                        {/* Overdue first */}
                        {filtered.filter(t => t.isOverdue && !['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)).map(t => (
                            <TaskCard key={t._id} task={t} />
                        ))}
                        {/* Pending & In Process */}
                        {filtered.filter(t => !t.isOverdue && !['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)).map(t => (
                            <TaskCard key={t._id} task={t} />
                        ))}
                        {/* Done/Completed */}
                        {filtered.filter(t => ['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)).length > 0 && (
                            <>
                                <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mt: 1, display: 'block' }}>
                                    ✅ Completed
                                </Typography>
                                {filtered.filter(t => ['DONE', 'CANCELLED', 'APPROVED'].includes(t.status)).map(t => (
                                    <TaskCard key={t._id} task={t} />
                                ))}
                            </>
                        )}
                    </Stack>
                )}
            </Box>

            {/* Avatar info box */}
            <Paper sx={{ mt: 3, p: 2, borderRadius: '14px', background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)', border: '1px solid #e0e7ff', boxShadow: 'none' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#6366f1', color: '#fff', fontWeight: 800 }}>
                        {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b' }}>
                            {user?.name || user?.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {user?.designation || user?.role} · Tasks auto-refresh every 30 seconds
                        </Typography>
                    </Box>
                    <Box flex={1} />
                    <Tooltip title="Tasks shown here are assigned to you. Contact your admin to update task assignments.">
                        <Chip label="ℹ My Tasks" size="small" sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', fontWeight: 600 }} />
                    </Tooltip>
                </Stack>
            </Paper>
        </Box>
    );
};

export default StaffMyTasks;
