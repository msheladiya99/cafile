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
} from '@mui/material';
import {
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    Timeline as OngoingIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import type { TaskMasterData, Client, User, Task, TaskStatus } from '../../../types';

export const OngoingTask: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [dateType, setDateType] = useState('On Effective ...');
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

    // Fetch data for dropdowns
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
    const statuses = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

    // Fetch tasks based on filters
    const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
        queryKey: ['tasks', groupName, clientName, selectedTask, frequency, status, employee, search],
        queryFn: () => taskService.getTasks({
            clientGroupId: groupName || undefined,
            clientId: clientName || undefined,
            status: (status as TaskStatus) || undefined,
            assignedTo: employee || undefined,
            // We'll need to expand the API to support 'search' if needed, or filter client-side
        })
    });

    const filteredTasks = useMemo(() => {
        if (!search) return tasks;
        return tasks.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.clientId as Client)?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [tasks, search]);

    const queryClient = useQueryClient();

    // Mutations for processing
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
            taskService.updateStatus(taskId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            toast.success('Status updated');
        }
    });

    const addCommentMutation = useMutation({
        mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
            taskService.addComment(taskId, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setNewComment('');
            toast.success('Comment added');
        }
    });

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.startTimer(taskId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const stopTimerMutation = useMutation({
        mutationFn: (taskId: string) => taskService.stopTimer(taskId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const updateChecklistMutation = useMutation({
        mutationFn: ({ taskId, itemId, completed }: { taskId: string; itemId: string; completed: boolean }) =>
            taskService.updateChecklistItem(taskId, itemId, completed),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#6b7280';
            case 'IN_PROCESS': return '#3b82f6';
            case 'PENDING_FOR_APPROVAL': return '#f59e0b';
            case 'APPROVED': return '#2dd4bf';
            case 'DONE': return '#10b981';
            case 'CANCELLED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const renderProcessingModal = () => {
        if (!processingTask) return null;

        const isTimerRunning = !!processingTask.currentTimerStart;

        return (
            <Dialog
                open={!!processingTask}
                onClose={() => setProcessingTask(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, minHeight: '60vh' }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: '#764ba2',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5
                }}>
                    <Typography variant="h6" fontWeight="600">Task Processing</Typography>
                    <IconButton size="small" onClick={() => setProcessingTask(null)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <Grid container sx={{ height: '100%' }}>
                        {/* Task Details & Status */}
                        <Grid size={{ xs: 12, md: 7 }} sx={{ p: 3, borderRight: '1px solid #eee' }}>
                            <Box mb={3}>
                                <Typography variant="overline" color="text.secondary">Project / Task</Typography>
                                <Typography variant="h5" fontWeight="700" color="primary.dark">
                                    {processingTask.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {processingTask.description || 'No description available.'}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box mb={3}>
                                <Typography variant="subtitle2" gutterBottom fontWeight="600">Quick Actions</Typography>
                                <Box display="flex" gap={2} mt={1}>
                                    <Button
                                        variant="contained"
                                        startIcon={isTimerRunning ? <CloseIcon /> : <OngoingIcon />}
                                        color={isTimerRunning ? "error" : "success"}
                                        onClick={() => isTimerRunning ? stopTimerMutation.mutate(processingTask._id) : startTimerMutation.mutate(processingTask._id)}
                                        loading={startTimerMutation.isPending || stopTimerMutation.isPending}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        {isTimerRunning ? "Stop Timer" : "Start Timer"}
                                    </Button>

                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                        <InputLabel>Update Status</InputLabel>
                                        <Select
                                            value={processingTask.status}
                                            label="Update Status"
                                            onChange={(e) => updateStatusMutation.mutate({
                                                taskId: processingTask._id,
                                                status: e.target.value as TaskStatus
                                            })}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            <MenuItem value="PENDING">To Do</MenuItem>
                                            <MenuItem value="IN_PROCESS">In Progress</MenuItem>
                                            <MenuItem value="PENDING_FOR_APPROVAL">Review</MenuItem>
                                            <MenuItem value="APPROVED">Approved</MenuItem>
                                            <MenuItem value="ON_HOLD">On Hold</MenuItem>
                                            <MenuItem value="CANCELLED">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight="600">Checklist</Typography>
                                <List dense>
                                    {(processingTask.checklist || []).map((item) => (
                                        <ListItem key={item.id} dense disablePadding>
                                            <Checkbox
                                                edge="start"
                                                checked={item.completed}
                                                onChange={(e) => updateChecklistMutation.mutate({
                                                    taskId: processingTask._id,
                                                    itemId: item.id,
                                                    completed: e.target.checked
                                                })}
                                            />
                                            <ListItemText
                                                primary={item.text}
                                                sx={{
                                                    textDecoration: item.completed ? 'line-through' : 'none',
                                                    color: item.completed ? 'text.disabled' : 'text.primary'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                    {(processingTask.checklist || []).length === 0 && (
                                        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                            No checklist items.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        </Grid>

                        {/* Activity Log / Comments */}
                        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, bgcolor: '#fafafa' }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight="600">Activity Log</Typography>
                            <Box sx={{
                                height: 300,
                                overflowY: 'auto',
                                border: '1px solid #eee',
                                borderRadius: 2,
                                bgcolor: 'white',
                                p: 1,
                                mb: 2
                            }}>
                                {(processingTask.comments || []).map((comment) => (
                                    <Box key={comment.id} sx={{ mb: 1.5 }}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="caption" fontWeight="700">{comment.userName}</Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ bgcolor: '#f0f4f8', p: 1, borderRadius: '0 8px 8px 8px', mt: 0.5 }}>
                                            {comment.text}
                                        </Typography>
                                    </Box>
                                ))}
                                {(processingTask.comments || []).length === 0 && (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <Typography variant="body2" color="text.disabled">No activities yet.</Typography>
                                    </Box>
                                )}
                            </Box>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Add entry/comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                size="small"
                                sx={{ bgcolor: 'white' }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={() => addCommentMutation.mutate({ taskId: processingTask._id, text: newComment })}
                                disabled={!newComment.trim() || addCommentMutation.isPending}
                                sx={{ mt: 1, bgcolor: '#764ba2', '&:hover': { bgcolor: '#667eea' } }}
                            >
                                Post Activity
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setProcessingTask(null)} color="inherit">Close</Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            updateStatusMutation.mutate({ taskId: processingTask._id, status: 'DONE' });
                            setProcessingTask(null);
                        }}
                    >
                        Mark as Completed
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
                            width: 250,
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
                    <Button variant="contained" size="small" startIcon={<ListIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        List
                    </Button>
                </Box>
            </Paper>

            {/* Selection Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={2}>
                    {/* Row 1 */}
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

                    {/* Row 2 */}
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

                    {/* Row 3 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Select size="small" sx={{ width: 140 }} value={dateType} onChange={(e) => setDateType(e.target.value)}>
                                <MenuItem value="On Effective ...">On Effective ...</MenuItem>
                            </Select>
                            <Box display="flex" alignItems="center" gap={0} sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                                <TextField size="small" placeholder="From" sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, width: 120 }} />
                                <Box sx={{ px: 1, bgcolor: '#f0f0f0', py: 1, borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd', fontSize: '0.8rem' }}>To</Box>
                                <TextField size="small" placeholder="To" sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, width: 120 }} />
                            </Box>
                            <IconButton size="small" sx={{ bgcolor: '#ff5252', color: 'white', borderRadius: 1, '&:hover': { bgcolor: '#ff1744' } }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
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

                    {/* Row 4 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value=""><em>None selected</em></MenuItem>
                                {statuses.map(s => (
                                    <MenuItem key={s.toUpperCase().replace(' ', '_')} value={s.toUpperCase().replace(' ', '_')}>{s}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Employee</Typography>
                            <Select size="small" fullWidth displayEmpty value={employee} onChange={(e) => setEmployee(e.target.value)}>
                                <MenuItem value=""><em>Choose a Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Job List Section */}
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
                        <Typography fontWeight="500">Job List</Typography>
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
                                <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasksLoading ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task: Task, index: number) => (
                                    <TableRow key={task._id} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{(task.clientId as Client)?.name || 'Internal'}</TableCell>
                                        <TableCell>{task.title}</TableCell>
                                        <TableCell>{task.targetDate ? new Date(task.targetDate).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={task.status}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                    bgcolor: `${getStatusColor(task.status)}20`,
                                                    color: getStatusColor(task.status),
                                                    fontWeight: 600,
                                                    borderRadius: 1
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
                                        <TableCell>{(task.firmId as { firmName?: string })?.firmName || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    py: 0,
                                                    textTransform: 'none',
                                                    color: '#764ba2',
                                                    borderColor: '#764ba2',
                                                    '&:hover': { borderColor: '#667eea', bgcolor: '#f0f0ff' }
                                                }}
                                            >
                                                Process
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={8} sx={{ color: 'text.secondary', py: 6 }}>
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
