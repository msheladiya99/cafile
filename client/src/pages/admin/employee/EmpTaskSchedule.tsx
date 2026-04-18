import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    Select,
    FormControl,
    Button,
    TextField,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    Tooltip,
    LinearProgress,
    IconButton,
    Collapse,
    alpha
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    Clear as ClearIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Assignment as TaskIcon,
    FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import { staffService } from '../../../services/staffService';
import { taskService } from '../../../services/taskService';
import type { User, Task, Client } from '../../../types';


// ─── Status config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:                  { label: 'Pending',             color: '#92400e', bg: '#fef3c7' },
    IN_PROCESS:               { label: 'In Process',          color: '#1e40af', bg: '#dbeafe' },
    PENDING_FOR_APPROVAL:     { label: 'Pending Approval',    color: '#6d28d9', bg: '#ede9fe' },
    APPROVED:                 { label: 'Approved',            color: '#065f46', bg: '#d1fae5' },
    DONE:                     { label: 'Done',                color: '#065f46', bg: '#d1fae5' },
    CANCELLED:                { label: 'Cancelled',           color: '#6b7280', bg: '#f3f4f6' },
    ON_HOLD:                  { label: 'On Hold',             color: '#7c3aed', bg: '#ede9fe' },
    PENDING_FROM_CLIENT:      { label: 'Pending (Client)',    color: '#b45309', bg: '#fef3c7' },
    PENDING_FROM_DEPARTMENT:  { label: 'Pending (Dept)',      color: '#b45309', bg: '#fef3c7' },
    REJECTED:                 { label: 'Rejected',            color: '#991b1b', bg: '#fee2e2' },
};

const PRIORITY_CONFIG: Record<string, { color: string; dot: string }> = {
    LOW:    { color: '#6b7280', dot: '#9ca3af' },
    MEDIUM: { color: '#d97706', dot: '#f59e0b' },
    HIGH:   { color: '#dc2626', dot: '#ef4444' },
    URGENT: { color: '#7c3aed', dot: '#8b5cf6' },
};

const frequencies = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
const years = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
const statuses = ['PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED', 'DONE', 'CANCELLED', 'ON_HOLD', 'PENDING_FROM_CLIENT', 'PENDING_FROM_DEPARTMENT', 'REJECTED'];
const dateTypes = ['Target Date', 'Start Date', 'Created Date'];

// ─── Helper: format date ─────────────────────────────────────────
const fmtDate = (d?: string | Date) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Helper: mins → h m ─────────────────────────────────────────
const fmtMins = (mins: number) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
};

// ─── Expandable row ──────────────────────────────────────────────
const TaskRow: React.FC<{ task: Task; staffMap: Record<string, string>; clientMap: Record<string, string> }> = ({ task, staffMap, clientMap }) => {
    const [open, setOpen] = useState(false);
    const status = STATUS_CONFIG[task.status] ?? { label: task.status, color: '#374151', bg: '#f3f4f6' };
    const priority = PRIORITY_CONFIG[task.priority] ?? { color: '#6b7280', dot: '#9ca3af' };
    const isOverdue = task.isOverdue && task.status !== 'DONE' && task.status !== 'CANCELLED';

    return (
        <>
            <TableRow
                hover
                sx={{
                    cursor: 'pointer',
                    bgcolor: isOverdue ? alpha('#ef4444', 0.04) : 'inherit',
                    '&:hover': { bgcolor: alpha('#667eea', 0.04) },
                    borderLeft: isOverdue ? '3px solid #ef4444' : '3px solid transparent',
                    transition: 'all 0.15s'
                }}
                onClick={() => setOpen(o => !o)}
            >
                {/* # */}
                <TableCell sx={{ width: 36, color: 'text.disabled', fontSize: '0.75rem' }}>
                    <IconButton size="small" sx={{ p: 0 }}>
                        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </TableCell>

                {/* Task */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DotIcon sx={{ fontSize: 10, color: priority.dot, flexShrink: 0 }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                                {task.title}
                            </Typography>
                            {task.frequency && (
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>{task.frequency}</Typography>
                            )}
                        </Box>
                    </Box>
                </TableCell>

                {/* Client */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {task.clientId ? (clientMap[typeof task.clientId === 'object' ? task.clientId._id : task.clientId] ?? '—') : '—'}
                        </Typography>
                    </Box>
                </TableCell>

                {/* Assigned To */}
                <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {(task.assignedTo ?? []).slice(0, 2).map((uid: string | User) => {
                            const uId = typeof uid === 'object' ? (uid as { _id: string })._id : uid;
                            const name = staffMap[uId] ?? uId;
                            return (
                                <Tooltip key={uId} title={name}>
                                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                                        {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </Avatar>
                                </Tooltip>
                            );
                        })}
                        {(task.assignedTo ?? []).length > 2 && (
                            <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#9ca3af' }}>
                                +{task.assignedTo.length - 2}
                            </Avatar>
                        )}
                        {(!task.assignedTo || task.assignedTo.length === 0) && (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>Unassigned</Typography>
                        )}
                    </Box>
                </TableCell>

                {/* Target Date */}
                <TableCell>
                    <Typography
                        variant="body2"
                        sx={{ color: isOverdue ? '#ef4444' : 'text.secondary', fontWeight: isOverdue ? 600 : 400 }}
                    >
                        {fmtDate(task.targetDate)}
                        {isOverdue && <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#ef4444' }}>⚠ Overdue</Typography>}
                    </Typography>
                </TableCell>

                {/* Status */}
                <TableCell>
                    <Chip
                        label={status.label}
                        size="small"
                        sx={{
                            bgcolor: status.bg,
                            color: status.color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                            border: 'none'
                        }}
                    />
                </TableCell>

                {/* Progress */}
                <TableCell sx={{ width: 100 }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.progressPercentage ?? 0}%</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage ?? 0}
                            sx={{
                                height: 5, borderRadius: 3,
                                bgcolor: '#f0f0f0',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: (task.progressPercentage ?? 0) === 100 ? '#22c55e' : '#667eea'
                                }
                            }}
                        />
                    </Box>
                </TableCell>

                {/* Time */}
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {fmtMins(task.actualTimeSpent)} / {task.estimatedHours}h
                        </Typography>
                    </Box>
                </TableCell>
            </TableRow>

            {/* ── Expanded detail row ── */}
            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: '#f8fafc', px: 4, py: 2, borderBottom: '1px solid #e2e8f0' }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{task.description || '—'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Priority</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: priority.color, fontWeight: 700 }}>{task.priority}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Date</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>{fmtDate(task.startDate)}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Staff</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        {(task.assignedTo ?? []).map((uid: string | User) => {
                                            const uId = typeof uid === 'object' ? (uid as { _id: string })._id : uid;
                                            return (
                                                <Box key={uId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                                                    <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{staffMap[uId] ?? uId}</Typography>
                                                </Box>
                                            );
                                        })}
                                        {(!task.assignedTo || task.assignedTo.length === 0) && (
                                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>Unassigned</Typography>
                                        )}
                                    </Box>
                                </Grid>
                                {task.checklist && task.checklist.length > 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            Checklist ({task.checklist.filter((c: { completed: boolean }) => c.completed).length}/{task.checklist.length} done)
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
                                                        textDecoration: item.completed ? 'line-through' : 'none'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

// ─── Main Component ──────────────────────────────────────────────
export const EmpTaskSchedule: React.FC = () => {

    const [filterData, setFilterData] = useState({
        clientName: '',
        employee: '',
        frequency: '',
        year: '',
        status: '',
        dateType: '',
        dateFrom: '',
        dateTo: ''
    });
    const [applied, setApplied] = useState(false);

    // — Data fetches —
    const { data: clients = [], isLoading: loadingClients } = useQuery({
        queryKey: ['clients'], queryFn: adminService.getClients
    });
    const { data: staff = [], isLoading: loadingStaff } = useQuery({
        queryKey: ['staff'], queryFn: staffService.getStaff
    });

    // Build query params from applied filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskFilters: any = useMemo(() => {
        const f: Record<string, string> = {};
        if (filterData.employee)  f.assignedTo = filterData.employee;
        if (filterData.status)    f.status     = filterData.status;
        if (filterData.frequency) f.frequency  = filterData.frequency;
        if (filterData.clientName) f.clientId  = filterData.clientName;
        return f;
    }, [filterData.employee, filterData.status, filterData.frequency, filterData.clientName]);

    const { data: tasks = [], isLoading: loadingTasks, refetch } = useQuery({
        queryKey: ['empTaskSchedule', taskFilters],
        queryFn: () => taskService.getTasks(taskFilters),
        enabled: true, // always fetch; filter client-side too
    });

    // Build lookup maps
    const staffMap = useMemo(() => {
        const m: Record<string, string> = {};
        staff.forEach((s: User) => { m[s._id] = s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.username; });
        return m;
    }, [staff]);

    const clientMap = useMemo(() => {
        const m: Record<string, string> = {};
        clients.forEach((c: Client) => { m[c._id] = c.name; });
        return m;
    }, [clients]);

    // Client-side additional filtering (year / date range)
    const filteredTasks = useMemo(() => (tasks as Task[]).filter((task: Task) => {
        // Year filter (FY: e.g. "2024-2025" means Apr 2024 – Mar 2025)
        if (filterData.year) {
            const [startYr] = filterData.year.split('-').map(Number);
            const fyStart = new Date(startYr, 3, 1);          // Apr 1
            const fyEnd   = new Date(startYr + 1, 2, 31);     // Mar 31
            const td = new Date(task.targetDate);
            if (td < fyStart || td > fyEnd) return false;
        }
        // Date range filter
        if (filterData.dateFrom || filterData.dateTo) {
            let compareDate: Date;
            if (filterData.dateType === 'Start Date')   compareDate = new Date(task.startDate   ?? task.targetDate);
            else if (filterData.dateType === 'Created Date') compareDate = new Date(task.createdAt);
            else                                          compareDate = new Date(task.targetDate);

            if (filterData.dateFrom && compareDate < new Date(filterData.dateFrom)) return false;
            if (filterData.dateTo   && compareDate > new Date(filterData.dateTo))   return false;
        }
        return true;
    }), [tasks, filterData.year, filterData.dateFrom, filterData.dateTo, filterData.dateType]);

    const handleChange = (field: string) => (e: { target: { value: unknown } }) => {
        setFilterData(prev => ({ ...prev, [field]: e.target.value as string }));
    };

    const handleSearch = () => {
        setApplied(true);
        refetch();
    };

    const handleClear = () => {
        setFilterData({ clientName: '', employee: '', frequency: '', year: '', status: '', dateType: '', dateFrom: '', dateTo: '' });
        setApplied(false);
    };

    // Summary counts
    const counts = useMemo(() => ({
        total:    filteredTasks.length,
        pending:  filteredTasks.filter((t: { status: string }) => t.status === 'PENDING').length,
        inProcess: filteredTasks.filter((t: { status: string }) => ['IN_PROCESS', 'PENDING_FOR_APPROVAL'].includes(t.status)).length,
        done:     filteredTasks.filter((t: { status: string }) => ['DONE', 'APPROVED'].includes(t.status)).length,
        overdue:  filteredTasks.filter((t: { isOverdue: boolean; status: string }) => t.isOverdue && !['DONE', 'CANCELLED'].includes(t.status)).length,
    }), [filteredTasks]);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* ── Header ── */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TaskIcon sx={{ fontSize: 28 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="700" sx={{ lineHeight: 1.2 }}>Employee Task Schedule</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>View & filter all employee tasks</Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* ── Summary Cards ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Tasks',  value: counts.total,    bg: '#667eea', icon: '📋' },
                    { label: 'Pending',      value: counts.pending,  bg: '#f59e0b', icon: '⏳' },
                    { label: 'In Progress',  value: counts.inProcess, bg: '#3b82f6', icon: '🔄' },
                    { label: 'Completed',    value: counts.done,     bg: '#22c55e', icon: '✅' },
                    { label: 'Overdue',      value: counts.overdue,  bg: '#ef4444', icon: '⚠️' },
                ].map(card => (
                    <Grid key={card.label} size={{ xs: 6, sm: 4, md: 'auto' }} sx={{ flex: { md: 1 } }}>
                        <Paper sx={{ p: 2, borderRadius: '12px', borderTop: `3px solid ${card.bg}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="800" sx={{ color: card.bg, lineHeight: 1 }}>{card.value}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{card.icon} {card.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* ── Filter Panel ── */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                    🔍 Filters
                </Typography>
                <Grid container spacing={2}>
                    {/* Client */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Client</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.clientName} onChange={handleChange('clientName')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Clients</MenuItem>
                                {loadingClients
                                    ? <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                                    : (clients as Client[]).map((c: Client) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Employee */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Employee</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.employee} onChange={handleChange('employee')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Employees</MenuItem>
                                {loadingStaff
                                    ? <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                                    : (staff as User[]).map((s: User) => (
                                        <MenuItem key={s._id} value={s._id}>
                                            {s.name || `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()} {s.role ? `(${s.designation ?? s.role})` : ''}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Frequency */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Frequency</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.frequency} onChange={handleChange('frequency')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Frequencies</MenuItem>
                                {frequencies.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Status */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Status</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.status} onChange={handleChange('status')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {statuses.map(s => (
                                    <MenuItem key={s} value={s}>
                                        <Chip label={STATUS_CONFIG[s]?.label ?? s} size="small" sx={{ bgcolor: STATUS_CONFIG[s]?.bg, color: STATUS_CONFIG[s]?.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Year */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Financial Year</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.year} onChange={handleChange('year')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Years</MenuItem>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Date Range */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography sx={{ fontSize: 12, mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>Date Range</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 110 }}>
                                <Select displayEmpty value={filterData.dateType} onChange={handleChange('dateType')} sx={{ borderRadius: '8px' }}>
                                    <MenuItem value="">Type</MenuItem>
                                    {dateTypes.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField type="date" size="small" value={filterData.dateFrom} onChange={handleChange('dateFrom')} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Box sx={{ color: 'text.disabled', fontSize: '0.8rem', flexShrink: 0 }}>to</Box>
                            <TextField type="date" size="small" value={filterData.dateTo} onChange={handleChange('dateTo')} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Box>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={12}>
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 1.5, 
                            justifyContent: 'flex-end', 
                            mt: 1,
                            pt: 2,
                            borderTop: '1px solid #f1f5f9'
                        }}>
                            <Button 
                                variant="outlined" 
                                color="error" 
                                startIcon={<ClearIcon fontSize="small" />} 
                                onClick={handleClear} 
                                sx={{ 
                                    textTransform: 'none', 
                                    borderRadius: '8px', 
                                    px: 3,
                                    height: 36,
                                    fontWeight: 600
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={loadingTasks ? <CircularProgress size={16} color="inherit" /> : <SearchIcon fontSize="small" />}
                                onClick={handleSearch}
                                disabled={loadingTasks}
                                sx={{ 
                                    textTransform: 'none', 
                                    borderRadius: '8px', 
                                    px: 3,
                                    height: 36,
                                    fontWeight: 600,
                                    bgcolor: '#667eea', 
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#5a67d8' },
                                    boxShadow: '0 4px 12px rgba(102,126,234,0.2)' 
                                }}
                            >
                                {loadingTasks ? 'Searching...' : 'Search'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* ── Task List ── */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="700" sx={{ fontSize: '1rem' }}>Job List</Typography>
                    </Box>
                    <Chip label={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, color: 'white', fontWeight: 700 }} />
                </Box>

                {loadingTasks ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <CircularProgress size={36} sx={{ color: '#667eea' }} />
                        <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>Loading tasks...</Typography>
                    </Box>
                ) : filteredTasks.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>📋</Typography>
                        <Typography variant="body1" fontWeight={600}>No tasks found</Typography>
                        <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                            {applied ? 'Try adjusting your filters.' : 'No tasks have been created yet.'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ width: 36 }} />
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Task</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Assigned To</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Target Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', width: 100 }}>Progress</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Time</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTasks.map((task: Task) => (
                                    <TaskRow key={task._id} task={task} staffMap={staffMap} clientMap={clientMap} />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};





