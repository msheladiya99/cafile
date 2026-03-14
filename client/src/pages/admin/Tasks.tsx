import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    LinearProgress,
    Tooltip,
    Stack,
    Card,
    CardContent,
    CardActions,
    Avatar,
    AvatarGroup,
    useTheme,
    useMediaQuery,
    Alert,
    Tabs,
    Tab,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Timer as TimerIcon,
    Comment as CommentIcon,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { taskService } from '../../services/taskService';
import { staffService } from '../../services/staffService';
import { adminService } from '../../services/adminService';
import { clientGroupService } from '../../services/clientGroupService';
import { billingService } from '../../services/billingService';
import type { ServiceItem } from '../../services/billingService';
import type { Task, TaskStatus, TaskPriority, TaskCategory, User, Client, CreateTaskData } from '../../types';
import firmService from '../../services/firmService';
import { AxiosError } from 'axios';

export const Tasks: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const queryClient = useQueryClient();

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

    // Filters
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
    const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL');
    const [filterStaff, setFilterStaff] = useState<string>('ALL');
    const [filterClient, setFilterClient] = useState<string>('ALL');
    const [filterOverdue, setFilterOverdue] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch tasks with ALL filters
    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ['tasks', filterStatus, filterPriority, filterStaff, filterClient, filterOverdue],
        queryFn: () => taskService.getTasks({
            status: filterStatus === 'ALL' ? undefined : filterStatus,
            priority: filterPriority === 'ALL' ? undefined : filterPriority,
            assignedTo: filterStaff === 'ALL' ? undefined : filterStaff,
            clientId: filterClient === 'ALL' ? undefined : filterClient,
            overdue: filterOverdue || undefined
        })
    });

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Fetch staff for assignment
    const { data: staff = [] } = useQuery<User[]>({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    // Fetch clients for linking
    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: clientGroups = [] } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    // Fetch multi firms
    const { data: multiFirms = [] } = useQuery({
        queryKey: ['multiFirms'],
        queryFn: firmService.getMultiFirms
    });

    // Fetch Services for Billing Link
    const { data: services = [] } = useQuery<ServiceItem[]>({
        queryKey: ['billingServices'],
        queryFn: billingService.getServices
    });

    const [formData, setFormData] = useState<CreateTaskData>({
        title: '',
        description: '',
        category: 'CLIENT_WORK',
        assignedTo: [],
        priority: 'MEDIUM',
        targetDate: '',
        estimatedHours: 1,
        tags: [],
        checklist: [],
        billingType: 'SINGLE_CLIENT',
        clientId: '',
        clientGroupId: '',
        firmId: '',
        billingAmount: 0
    });

    // Create task mutation
    const createTaskMutation = useMutation({
        mutationFn: (data: CreateTaskData) => taskService.createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setSuccess('Task created successfully!');
            setOpenCreateDialog(false);
            resetForm();
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to create task');
        }
    });

    // Update status mutation
    useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setSuccess('Task status updated!');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    });

    // Timer mutations
    useMutation({
        mutationFn: (taskId: string) => taskService.startTimer(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    useMutation({
        mutationFn: (taskId: string) => taskService.stopTimer(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: 'CLIENT_WORK',
            assignedTo: [],
            priority: 'MEDIUM',
            targetDate: '',
            estimatedHours: 1,
            tags: [],
            checklist: [],
            billingType: 'SINGLE_CLIENT',
            clientId: '',
            clientGroupId: '',
            firmId: '',
            billingAmount: 0
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        createTaskMutation.mutate(formData);
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case 'URGENT': return '#ef4444';
            case 'HIGH': return '#f59e0b';
            case 'MEDIUM': return '#3b82f6';
            case 'LOW': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'PENDING': return '#6b7280';
            case 'STARTED': return '#3b82f6';
            case 'UNDER_REVIEW': return '#f59e0b';
            case 'DONE': return '#10b981';
            case 'CANCELLED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Group tasks by status for Kanban view
    const tasksByStatus: Record<string, Task[]> = {
        PENDING: filteredTasks.filter((t: Task) => t.status === 'PENDING'),
        STARTED: filteredTasks.filter((t: Task) => t.status === 'STARTED'),
        UNDER_REVIEW: filteredTasks.filter((t: Task) => t.status === 'UNDER_REVIEW'),
        DONE: filteredTasks.filter((t: Task) => t.status === 'DONE')
    };

    const renderTaskCard = (task: Task) => {
        // Safe access (robustness against missing data)
        const assignedUsers = Array.isArray(task.assignedTo) ? (task.assignedTo as User[]) : [];
        const client = task.clientId as Client | undefined;
        const clientGroup = task.clientGroupId as { _id: string; groupName: string } | undefined;
        const isTimerRunning = !!task.currentTimerStart;
        const tags = Array.isArray(task.tags) ? task.tags : [];
        const comments = Array.isArray(task.comments) ? task.comments : [];
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];

        // Helper to safe-guard user data access
        const getUserName = (u: User | Record<string, unknown>) => (u as { name?: string; username?: string })?.name || (u as { name?: string; username?: string })?.username || '?';

        return (
            <Card
                key={task._id}
                sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: 'none',
                    borderLeft: `5px solid ${getPriorityColor(task.priority)}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        transform: 'translateY(-3px)'
                    }
                }}
                onClick={() => setSelectedTask(task)}
            >
                <CardContent sx={{ pb: 1, pt: 1.5 }}>
                    {/* Title & Client */}
                    <Box mb={1.5}>
                        <Typography variant="h6" fontSize="0.95rem" fontWeight="700" gutterBottom sx={{ lineHeight: 1.3 }}>
                            {task.title || 'Untitled Task'}
                        </Typography>
                        {client && task.billingType !== 'CLIENT_GROUP' && (
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    🏢 {client.name}
                                </Box>
                                {(task.billingAmount || task.firmId) && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <AssignmentIcon sx={{ fontSize: 14 }} />
                                        {task.firmId ? (task.firmId as { firmName?: string }).firmName || 'Primary Firm' : 'Primary Firm'}
                                        {task.billingAmount ? ` | ₹${task.billingAmount}` : ''}
                                    </Box>
                                )}
                            </Typography>
                        )}
                        {task.billingType === 'CLIENT_GROUP' && clientGroup && (
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                    🏢 {clientGroup.groupName} (Group)
                                </Box>
                                {(task.billingAmount || task.firmId) && (
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <AssignmentIcon sx={{ fontSize: 14 }} />
                                        {task.firmId ? (task.firmId as { firmName?: string }).firmName || 'Primary Firm' : 'Primary Firm'}
                                        {task.billingAmount ? ` | ₹${task.billingAmount}` : ''}
                                    </Box>
                                )}
                            </Typography>
                        )}
                    </Box>

                    {/* Progress Bar */}
                    <Box mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Progress
                            </Typography>
                            <Typography variant="caption" fontWeight="700" color="primary.main">
                                {task.progressPercentage || 0}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage || 0}
                            sx={{
                                height: 5,
                                borderRadius: 3,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: getStatusColor(task.status),
                                    borderRadius: 3
                                }
                            }}
                        />
                    </Box>

                    {/* Tags */}
                    {(tags.length > 0 || isTimerRunning) && (
                        <Box mb={2} display="flex" gap={0.5} flexWrap="wrap">
                            {isTimerRunning && (
                                <Chip
                                    icon={<TimerIcon sx={{ fontSize: '0.9rem !important' }} />}
                                    label="Timer On"
                                    size="small"
                                    color="success"
                                    sx={{ fontSize: '0.65rem', height: 22, fontWeight: 600 }}
                                />
                            )}
                            {tags.slice(0, 3).map((tag, idx) => (
                                <Chip
                                    key={idx}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: 22,
                                        bgcolor: 'rgba(0,0,0,0.04)',
                                        fontWeight: 500
                                    }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Footer Infos */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            {task.targetDate && (
                                <Tooltip title="Due Date">
                                    <Box display="flex" alignItems="center" gap={0.5}>
                                        <Typography variant="caption" sx={{ fontSize: '1rem' }}>📅</Typography>
                                        <Typography variant="caption" color={task.isOverdue ? 'error.main' : 'text.secondary'} fontWeight={task.isOverdue ? 700 : 400}>
                                            {new Date(task.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            )}
                            {(task.billingAmount ?? 0) > 0 && (
                                <Tooltip title="Auto Billing Amount">
                                    <Chip
                                        label={`₹${task.billingAmount}`}
                                        size="small"
                                        color="info"
                                        variant="outlined"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            borderColor: 'primary.light',
                                            color: 'primary.dark'
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </Box>

                        <Box display="flex" alignItems="center" gap={1}>
                            {comments.length > 0 && (
                                <Box display="flex" alignItems="center" gap={0.2} color="text.secondary">
                                    <CommentIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">{comments.length}</Typography>
                                </Box>
                            )}
                            {checklist.length > 0 && (
                                <Box display="flex" alignItems="center" gap={0.2} color="text.secondary">
                                    <CheckIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">
                                        {checklist.filter(i => i.completed).length}/{checklist.length}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </CardContent>

                <Divider sx={{ my: 0 }} />

                <CardActions sx={{ py: 1, px: 2, justifyContent: 'space-between', bgcolor: '#fafafa' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {formatTime(task.actualTimeSpent || 0)}
                        </Typography>
                    </Box>
                    <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.65rem' } }}>
                        {assignedUsers.map((user) => {
                            // Ensure user object is valid before rendering
                            if (!user || typeof user !== 'object') return null;
                            const name = getUserName(user);
                            return (
                                <Tooltip key={user._id || Math.random()} title={name}>
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                        {name.charAt(0).toUpperCase()}
                                    </Avatar>
                                </Tooltip>
                            );
                        })}
                    </AvatarGroup>
                </CardActions>
            </Card>
        );
    };

    const renderKanbanColumn = (status: keyof typeof tasksByStatus, title: string, color: string) => (
        <Paper
            elevation={0}
            sx={{
                minWidth: isMobile ? '280px' : '320px',
                bgcolor: '#ffffff',
                borderRadius: 3,
                borderTop: `4px solid ${color}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                height: 'fit-content',
                maxHeight: 'calc(100vh - 220px)',
            }}
        >
            <Box p={2} pb={1} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid #f0f0f0">
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                        {title}
                    </Typography>
                </Box>
                <Chip
                    label={tasksByStatus[status].length}
                    size="small"
                    sx={{
                        bgcolor: `${color}15`,
                        color: color,
                        fontWeight: 700,
                        height: 24,
                        borderRadius: 1
                    }}
                />
            </Box>

            <Box
                sx={{
                    p: 1.5,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: '#dfe6e9', borderRadius: '3px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#bdc3c7' }
                }}
            >
                {tasksByStatus[status].map((task: Task) => renderTaskCard(task))}
                {tasksByStatus[status].length === 0 && (
                    <Box py={6} display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ opacity: 0.5 }}>
                        <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.disabled">No tasks</Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );

    return (
        <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', pb: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="800" gutterBottom sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Task Board
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your team's workflow and performance
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenCreateDialog(true)}
                    sx={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.2)',
                        borderRadius: 3,
                        px: 3,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                        }
                    }}
                >
                    New Task
                </Button>
            </Box>

            {/* Filter Bar */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        placeholder="Search tasks..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 250 }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="ALL">All Status</MenuItem>
                        <MenuItem value="PENDING">To Do</MenuItem>
                        <MenuItem value="STARTED">In Progress</MenuItem>
                        <MenuItem value="UNDER_REVIEW">Review</MenuItem>
                        <MenuItem value="DONE">Completed</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Priority"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'ALL')}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="ALL">All Priority</MenuItem>
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="URGENT">Urgent</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Assignee"
                        value={filterStaff}
                        onChange={(e) => setFilterStaff(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="ALL">All Staff</MenuItem>
                        {staff.map(s => (
                            <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Client"
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="ALL">All Clients</MenuItem>
                        {clients.map(c => (
                            <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                        ))}
                    </TextField>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Overdue</Typography>
                        <Chip
                            label={filterOverdue ? "ON" : "OFF"}
                            onClick={() => setFilterOverdue(!filterOverdue)}
                            color={filterOverdue ? "error" : "default"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                        />
                    </Box>
                </Stack>
            </Paper>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {/* View Toggle */}
            <Paper elevation={0} sx={{ mb: 4, bgcolor: 'transparent', display: 'flex', justifyContent: 'center' }}>
                <Tabs
                    value={viewMode}
                    onChange={(_, v) => setViewMode(v)}
                    sx={{
                        bgcolor: 'white',
                        borderRadius: 4,
                        p: 0.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                        '& .MuiTabs-indicator': { display: 'none' },
                        '& .Mui-selected': {
                            bgcolor: '#f1f5f9',
                            color: '#0f172a !important',
                            borderRadius: 3,
                            fontWeight: '700 !important'
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'text.secondary',
                            minHeight: 40,
                            px: 3,
                            borderRadius: 3,
                            transition: 'all 0.2s'
                        }
                    }}
                >
                    <Tab label="Board" value="kanban" icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                    <Tab label="List" value="list" icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Kanban Board */}
            {viewMode === 'kanban' && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 3,
                        overflowX: 'auto',
                        pb: 2,
                        alignItems: 'flex-start',
                        minHeight: 'calc(100vh - 250px)',
                        px: 1
                    }}
                >
                    {renderKanbanColumn('PENDING', 'To Do', '#64748b')}
                    {renderKanbanColumn('STARTED', 'In Progress', '#3b82f6')}
                    {renderKanbanColumn('UNDER_REVIEW', 'Review', '#f59e0b')}
                    {renderKanbanColumn('DONE', 'Completed', '#10b981')}
                </Box>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <Box sx={{ px: 1 }}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" p={10}><LinearProgress sx={{ width: '100%', maxWidth: 400, borderRadius: 2 }} /></Box>
                    ) : filteredTasks.length > 0 ? (
                        <Stack spacing={2}>
                            {filteredTasks.map(task => renderTaskCard(task))}
                        </Stack>
                    ) : (
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 3, opacity: 0.6 }}>
                            <AssignmentIcon sx={{ fontSize: 60, mb: 2, color: 'text.disabled' }} />
                            <Typography variant="h6">No tasks found matching your filters</Typography>
                        </Paper>
                    )}
                </Box>
            )}

            {/* Create Task Dialog */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" fontWeight="700">
                        Create New Task
                    </Typography>
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                label="Task Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <TextField
                                    select
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                                >
                                    <MenuItem value="CLIENT_WORK">Client Work</MenuItem>
                                    <MenuItem value="INTERNAL">Internal</MenuItem>
                                    <MenuItem value="REVIEW">Review</MenuItem>
                                    <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                                    <MenuItem value="FILING">Filing</MenuItem>
                                    <MenuItem value="OTHER">Other</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                >
                                    <MenuItem value="LOW">Low</MenuItem>
                                    <MenuItem value="MEDIUM">Medium</MenuItem>
                                    <MenuItem value="HIGH">High</MenuItem>
                                    <MenuItem value="URGENT">Urgent</MenuItem>
                                </TextField>
                            </Box>
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <TextField
                                    type="date"
                                    label="Target Date"
                                    value={formData.targetDate}
                                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                                <TextField
                                    type="number"
                                    label="Estimated Hours"
                                    value={formData.estimatedHours}
                                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                                    inputProps={{ min: 0.5, step: 0.5 }}
                                    required
                                />
                            </Box>
                            <TextField
                                select
                                label="Assign To"
                                SelectProps={{ multiple: true }}
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value as unknown as string[] })}
                            >
                                {staff.map((member: User) => (
                                    <MenuItem key={member._id} value={member._id}>
                                        {member.name || member.username} ({member.role})
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <TextField
                                    select
                                    label="Task Type"
                                    value={formData.billingType || 'SINGLE_CLIENT'}
                                    onChange={(e) => setFormData({ ...formData, billingType: e.target.value as 'SINGLE_CLIENT' | 'CLIENT_GROUP', clientId: '', clientGroupId: '' })}
                                >
                                    <MenuItem value="SINGLE_CLIENT">Single Client</MenuItem>
                                    <MenuItem value="CLIENT_GROUP">Client Group</MenuItem>
                                </TextField>

                                {formData.billingType === 'SINGLE_CLIENT' ? (
                                    <TextField
                                        select
                                        label="Link to Client (Optional)"
                                        value={formData.clientId || ''}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {clients.map((client: Client) => (
                                            <MenuItem key={client._id} value={client._id}>
                                                {client.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                ) : (
                                    <TextField
                                        select
                                        label="Link to Group (Optional)"
                                        value={formData.clientGroupId || ''}
                                        onChange={(e) => setFormData({ ...formData, clientGroupId: e.target.value })}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {clientGroups.map((group: { _id: string; groupName: string }) => (
                                            <MenuItem key={group._id} value={group._id}>
                                                {group.groupName}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </Box>

                            <TextField
                                select
                                label="Link to Billing Service Library"
                                value=""
                                onChange={(e) => {
                                    const service = services.find(s => s._id === e.target.value);
                                    if (service) {
                                        setFormData({
                                            ...formData,
                                            billingAmount: service.basePrice,
                                            title: formData.title || service.name,
                                            description: formData.description || service.description
                                        });
                                    }
                                }}
                            >
                                <MenuItem value=""><em>-- Choose from Service Library --</em></MenuItem>
                                {services.map((s: ServiceItem) => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {s.name} (₹{s.basePrice})
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <TextField
                                    select
                                    label="Select Firm (Optional)"
                                    value={formData.firmId || ''}
                                    onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                                >
                                    <MenuItem value="">Primary Firm</MenuItem>
                                    {multiFirms.map((firm: { _id?: string; firmName: string }) => (
                                        <MenuItem key={firm._id} value={firm._id}>
                                            {firm.firmName}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    type="number"
                                    label="Billing Amount (₹)"
                                    value={formData.billingAmount || ''}
                                    onChange={(e) => setFormData({ ...formData, billingAmount: Number(e.target.value) })}
                                    inputProps={{ min: 0 }}
                                />
                            </Box>

                            <TextField
                                label="Tags (comma separated)"
                                placeholder="e.g. ITR, Urgent, Audit"
                                value={formData.tags?.join(', ') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '')
                                })}
                            />

                            <TextField
                                label="Checklist Items (Each item on new line)"
                                multiline
                                rows={3}
                                placeholder="Task sub-item 1&#10;Task sub-item 2"
                                value={formData.checklist?.join('\n') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    checklist: e.target.value.split('\n').map(t => t.trim()).filter(t => t !== '')
                                })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createTaskMutation.isPending}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none'
                            }}
                        >
                            Create Task
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Task Detail Dialog */}
            <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: '1px solid #f0f0f0', pb: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="800">{selectedTask?.title}</Typography>
                        {selectedTask?.priority && (
                            <Chip
                                label={selectedTask.priority}
                                size="small"
                                sx={{ bgcolor: getPriorityColor(selectedTask.priority), color: 'white', fontWeight: 700 }}
                            />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    {selectedTask && (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                                <Typography variant="body1">{selectedTask.description || 'No description provided.'}</Typography>
                            </Box>

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                                    <Chip label={selectedTask.status} size="small" sx={{ bgcolor: getStatusColor(selectedTask.status), color: 'white' }} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Deadline</Typography>
                                    <Typography variant="body2" fontWeight="600">{new Date(selectedTask.targetDate).toLocaleDateString()}</Typography>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assignees</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {(selectedTask.assignedTo as User[]).map((u: User) => (
                                        <Chip key={u._id} label={u.name || u.username} avatar={<Avatar>{(u.name || u.username).charAt(0)}</Avatar>} />
                                    ))}
                                </Box>
                            </Box>

                            {selectedTask.tags.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tags</Typography>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {selectedTask.tags.map(tag => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                                    </Box>
                                </Box>
                            )}

                            {selectedTask.checklist.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Checklist</Typography>
                                    <Stack spacing={1}>
                                        {selectedTask.checklist.map(item => (
                                            <Box key={item.id} display="flex" alignItems="center" gap={1}>
                                                {item.completed ? <CheckIcon color="success" sx={{ fontSize: 20 }} /> : <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #ccc' }} />}
                                                <Typography variant="body2" sx={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'text.disabled' : 'text.primary' }}>
                                                    {item.text}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            <Divider />

                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Estimated: {selectedTask.estimatedHours}h</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>Actual: {Math.floor(selectedTask.actualTimeSpent / 60)}h {selectedTask.actualTimeSpent % 60}m</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">Created on {new Date(selectedTask.createdAt).toLocaleDateString()}</Typography>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
                    <Button onClick={() => setSelectedTask(null)} color="inherit">Close</Button>
                    <Button variant="contained" color="primary" onClick={() => setSelectedTask(null)}>Edit Task</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
