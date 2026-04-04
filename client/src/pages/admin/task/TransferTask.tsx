import React, { useState } from 'react';
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
    TableHead,
    TableRow,
    Checkbox,
    FormControlLabel,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    List as ListIcon,
    SwapHoriz as TransferIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { taskService } from '../../../services/taskService';
import { toast } from 'react-hot-toast';
import type { TaskMasterData, Client, User, Task } from '../../../types';
import type { AxiosError } from 'axios';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    PENDING: 'warning',
    IN_PROCESS: 'info',
    PENDING_FOR_APPROVAL: 'info',
    ON_HOLD: 'default',
    PENDING_FROM_CLIENT: 'default',
    PENDING_FROM_DEPARTMENT: 'default',
};

export const TransferTask: React.FC = () => {
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequency, setFrequency] = useState('');
    const [removeFromCurrent, setRemoveFromCurrent] = useState(true);
    const [previewLoaded, setPreviewLoaded] = useState(false);

    const queryClient = useQueryClient();

    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    // Preview: tasks that will be transferred
    const { data: previewTasks = [], isFetching: isLoadingPreview, refetch: refetchPreview } = useQuery<Task[]>({
        queryKey: ['transferPreview', transferFrom, clientName, selectedTask, frequency],
        queryFn: () => taskService.getTransferPreview({
            fromUserId: transferFrom,
            clientId: clientName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
        }),
        enabled: false, // only run on manual trigger
    });

    const handleLoadPreview = () => {
        if (!transferFrom) {
            toast.error('Please select "Transfer From" employee');
            return;
        }
        setPreviewLoaded(true);
        refetchPreview();
    };

    // Transfer mutation
    const transferMutation = useMutation({
        mutationFn: taskService.transferTasks,
        onSuccess: (data) => {
            toast.success(data.message);
            setPreviewLoaded(false);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['transferPreview'] });
        },
        onError: (err: AxiosError<{ message: string }>) => {
            toast.error(err.response?.data?.message || 'Transfer failed');
        }
    });

    const handleTransfer = () => {
        if (!transferFrom) return toast.error('Please select "Transfer From" employee');
        if (!transferTo) return toast.error('Please select "Transfer To" employee');
        if (transferFrom === transferTo) return toast.error('Transfer From and Transfer To cannot be the same');
        if (previewTasks.length === 0) return toast.error('No tasks found to transfer. Load preview first.');

        if (!window.confirm(`Transfer ${previewTasks.length} task(s) from this employee? ${removeFromCurrent ? 'They will be removed from the original employee.' : 'Both employees will share these tasks.'}`)) return;

        transferMutation.mutate({
            fromUserId: transferFrom,
            toUserId: transferTo,
            clientId: clientName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
            removeFromCurrent,
        });
    };

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

    const fromUser = staffUsers.find((u: User) => u._id === transferFrom);
    const toUser = staffUsers.find((u: User) => u._id === transferTo);

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: 2,
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <TransferIcon />
                    <Typography variant="h6" fontWeight="500">Transfer Task</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    Reassign active tasks from one employee to another
                </Typography>
            </Paper>

            {/* Transfer Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* Transfer From */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 150, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Transfer From <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={transferFrom}
                                onChange={(e) => { setTransferFrom(e.target.value); setPreviewLoaded(false); }}>
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}
                                        disabled={u._id === transferTo}>
                                        {u.name || u.username} ({u.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Transfer To */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 150, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Transfer To <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={transferTo}
                                onChange={(e) => setTransferTo(e.target.value)}>
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}
                                        disabled={u._id === transferFrom}>
                                        {u.name || u.username} ({u.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Client Filter */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 150, color: 'text.secondary', fontSize: '0.9rem' }}>Client Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={clientName}
                                onChange={(e) => { setClientName(e.target.value); setPreviewLoaded(false); }}>
                                <MenuItem value=""><em>All Clients</em></MenuItem>
                                {clients.map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Task Filter */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 150, color: 'text.secondary', fontSize: '0.9rem' }}>Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={selectedTask}
                                onChange={(e) => { setSelectedTask(e.target.value); setPreviewLoaded(false); }}>
                                <MenuItem value=""><em>All Tasks</em></MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Frequency Filter */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 150, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                            <Select size="small" fullWidth displayEmpty value={frequency}
                                onChange={(e) => { setFrequency(e.target.value); setPreviewLoaded(false); }}>
                                <MenuItem value=""><em>All Frequencies</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Remove from current checkbox */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" height="100%">
                            <Box sx={{ width: 150 }} />
                            <FormControlLabel
                                control={
                                    <Checkbox size="small" checked={removeFromCurrent}
                                        onChange={(e) => setRemoveFromCurrent(e.target.checked)}
                                        sx={{ color: '#764ba2', '&.Mui-checked': { color: '#764ba2' } }} />
                                }
                                label={
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        Remove From Current Employee
                                    </Typography>
                                }
                            />
                        </Box>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" gap={2} justifyContent="center" mt={1}>
                            <Button variant="outlined" startIcon={<SearchIcon />}
                                onClick={handleLoadPreview}
                                disabled={!transferFrom || isLoadingPreview}
                                sx={{ borderColor: '#667eea', color: '#667eea' }}>
                                {isLoadingPreview ? 'Loading...' : 'Load Preview'}
                            </Button>
                            <Button variant="contained" startIcon={<TransferIcon />}
                                onClick={handleTransfer}
                                disabled={!transferFrom || !transferTo || previewTasks.length === 0 || transferMutation.isPending}
                                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' } }}>
                                {transferMutation.isPending ? 'Transferring...' : `Transfer ${previewTasks.length > 0 ? `(${previewTasks.length})` : ''} Tasks`}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                {/* Transfer info box */}
                {transferFrom && transferTo && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Tasks will be transferred from <strong>{fromUser?.name || fromUser?.username}</strong> to <strong>{toUser?.name || toUser?.username}</strong>.
                        {removeFromCurrent ? ' The original employee will NO LONGER be assigned.' : ' Both employees will share these tasks.'}
                    </Alert>
                )}
            </Paper>

            {/* Job List Preview */}
            <Paper elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <Box sx={{
                    p: 1.5,
                    bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="500">
                            Job List {previewLoaded && `(${previewTasks.length} tasks)`}
                        </Typography>
                    </Box>
                    {isLoadingPreview && <CircularProgress size={18} sx={{ color: 'white' }} />}
                </Box>
                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        {previewLoaded && previewTasks.length > 0 && (
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Task Title</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Target Date</TableCell>
                                </TableRow>
                            </TableHead>
                        )}
                        <TableBody>
                            {isLoadingPreview ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={6} sx={{ py: 6 }}>
                                        <CircularProgress size={24} />
                                        <Typography variant="body2" color="text.secondary" mt={1}>Loading tasks...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : previewLoaded && previewTasks.length > 0 ? (
                                previewTasks.map((task: Task, idx: number) => (
                                    <TableRow key={task._id} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{task.title}</TableCell>
                                        <TableCell>
                                            {typeof task.clientId === 'object'
                                                ? (task.clientId as Client)?.name
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={task.frequency || 'One Time'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={task.status.replace(/_/g, ' ')}
                                                size="small"
                                                color={STATUS_COLORS[task.status] || 'default'}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: task.isOverdue ? 'error.main' : 'inherit' }}>
                                            {new Date(task.targetDate).toLocaleDateString('en-IN')}
                                            {task.isOverdue && <Typography component="span" variant="caption" color="error"> (Overdue)</Typography>}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : previewLoaded && previewTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell align="center" colSpan={6} sx={{ color: 'text.secondary', py: 6 }}>
                                        No active tasks found for the selected employee with these filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow>
                                    <TableCell align="center" colSpan={6} sx={{ color: 'text.secondary', py: 6 }}>
                                        Select an employee above and click "Load Preview" to see tasks that will be transferred.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TransferTask;





