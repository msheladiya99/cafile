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
    Avatar,
} from '@mui/material';
import { 
    Users, 
    ArrowRightLeft, 
    Send, 
    Info, 
    FileText, 
    Calendar, 
    Filter,
    LayoutList,
    AlertCircle,
    RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { taskService } from '../../../services/taskService';
import { toast } from 'react-hot-toast';
import type { TaskMasterData, Client, User, Task } from '../../../types';
import type { AxiosError } from 'axios';

const STATUS_COLORS: Record<string, { bg: string, color: string }> = {
    PENDING: { bg: '#fff7ed', color: '#9a3412' },
    IN_PROCESS: { bg: '#eff6ff', color: '#1e40af' },
    PENDING_FOR_APPROVAL: { bg: '#f0fdf4', color: '#166534' },
    ON_HOLD: { bg: '#f8fafc', color: '#475569' },
    PENDING_FROM_CLIENT: { bg: '#fef2f2', color: '#991b1b' },
    PENDING_FROM_DEPARTMENT: { bg: '#faf5ff', color: '#6b21a8' },
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

    const { data: previewTasks = [], isFetching: isLoadingPreview, refetch: refetchPreview } = useQuery<Task[]>({
        queryKey: ['transferPreview', transferFrom, clientName, selectedTask, frequency],
        queryFn: () => taskService.getTransferPreview({
            fromUserId: transferFrom,
            clientId: clientName || undefined,
            taskMasterId: selectedTask || undefined,
            frequency: frequency || undefined,
        }),
        enabled: false,
    });

    const handleLoadPreview = () => {
        if (!transferFrom) {
            toast.error('Please select source employee');
            return;
        }
        setPreviewLoaded(true);
        refetchPreview();
    };

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
        if (!transferFrom || !transferTo) return toast.error('Please select both employees');
        if (transferFrom === transferTo) return toast.error('Source and destination cannot be the same');
        
        if (previewLoaded && previewTasks.length === 0) {
            return toast.error('No tasks found to transfer');
        }

        const confirmMsg = previewLoaded 
            ? `Transfer ${previewTasks.length} task(s)?` 
            : `Transfer all matching tasks based on your selected filters?`;

        if (!window.confirm(confirmMsg)) return;

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

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Box sx={{ p: 0, maxWidth: 1200, mx: 'auto' }}>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                {/* Header Container */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, letterSpacing: '-0.02em' }}>
                            Transfer Task
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                            <Users size={16} />
                            <Typography variant="body2">Granular control over task reassignment and workload balancing</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Main Control Card */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, 
                        mb: 4,
                        borderRadius: '24px', 
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <Grid container spacing={4}>
                        {/* Source Employee */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <motion.div variants={itemVariants}>
                                <Typography sx={{ fontWeight: 600, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: '#fef2f2', color: '#991b1b' }}>F</Avatar>
                                    Transfer From <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                                <Select 
                                    size="medium" fullWidth displayEmpty value={transferFrom}
                                    onChange={(e) => { setTransferFrom(e.target.value); setPreviewLoaded(false); }}
                                    sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                                >
                                    <MenuItem value="" disabled>Source Employee...</MenuItem>
                                    {staffUsers.map((u: User) => (
                                        <MenuItem key={u._id} value={u._id} disabled={u._id === transferTo}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{u.username.charAt(0)}</Avatar>
                                                {u.name || u.username}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </motion.div>
                        </Grid>

                        {/* Visual Arrow */}
                        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: { md: 4 } }}>
                            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: '#eff6ff', color: '#3b82f6' }}>
                                <ArrowRightLeft size={20} />
                            </Box>
                        </Grid>

                        {/* Destination Employee */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <motion.div variants={itemVariants}>
                                <Typography sx={{ fontWeight: 600, color: '#475569', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#166534' }}>T</Avatar>
                                    Transfer To <span style={{ color: '#ef4444' }}>*</span>
                                </Typography>
                                <Select 
                                    size="medium" fullWidth displayEmpty value={transferTo}
                                    onChange={(e) => setTransferTo(e.target.value)}
                                    sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                                >
                                    <MenuItem value="" disabled>Destination Employee...</MenuItem>
                                    {staffUsers.map((u: User) => (
                                        <MenuItem key={u._id} value={u._id} disabled={u._id === transferFrom}>
                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{u.username.charAt(0)}</Avatar>
                                                {u.name || u.username}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </motion.div>
                        </Grid>

                        {/* Filters Accordion/Section */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ pt: 2, borderTop: '1px dashed #e2e8f0' }}>
                                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Filter size={16} /> Refine Transfer Scope
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', mb: 0.5 }}>Client Filter</Typography>
                                        <Select size="small" fullWidth displayEmpty value={clientName} 
                                            onChange={(e) => { setClientName(e.target.value); setPreviewLoaded(false); }}
                                            sx={{ borderRadius: '8px' }}>
                                            <MenuItem value="">All Clients</MenuItem>
                                            {clients.map((c: Client) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', mb: 0.5 }}>Task Type</Typography>
                                        <Select size="small" fullWidth displayEmpty value={selectedTask}
                                            onChange={(e) => { setSelectedTask(e.target.value); setPreviewLoaded(false); }}
                                            sx={{ borderRadius: '8px' }}>
                                            <MenuItem value="">All Tasks</MenuItem>
                                            {taskMasters.map((t: TaskMasterData) => (
                                                <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', mb: 0.5 }}>Frequency</Typography>
                                        <Select size="small" fullWidth displayEmpty value={frequency}
                                            onChange={(e) => { setFrequency(e.target.value); setPreviewLoaded(false); }}
                                            sx={{ borderRadius: '8px' }}>
                                            <MenuItem value="">All Frequencies</MenuItem>
                                            {frequencies.map(f => (
                                                <MenuItem key={f} value={f}>{f}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>

                        {/* Options and Actions */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mt: 1, p: 2, borderRadius: '16px', bgcolor: '#f8fafc' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox size="small" checked={removeFromCurrent}
                                            onChange={(e) => setRemoveFromCurrent(e.target.checked)}
                                            sx={{ color: '#3b82f6', '&.Mui-checked': { color: '#3b82f6' } }} />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                                            Remove tasks from current employee after transfer
                                        </Typography>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Button 
                                        variant="outlined" 
                                        onClick={handleLoadPreview}
                                        disabled={!transferFrom || isLoadingPreview}
                                        startIcon={isLoadingPreview ? <CircularProgress size={16} /> : <RefreshCcw size={18} />}
                                        sx={{ borderRadius: '10px', textTransform: 'none' }}
                                    >
                                        Preview Changes
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        onClick={handleTransfer}
                                        disabled={!transferFrom || !transferTo || transferMutation.isPending || (previewLoaded && previewTasks.length === 0)}
                                        startIcon={<Send size={18} />}
                                        sx={{ 
                                            borderRadius: '10px', 
                                            textTransform: 'none', 
                                            bgcolor: '#3b82f6',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                            '&:hover': { bgcolor: '#2563eb' }
                                        }}
                                    >
                                        {transferMutation.isPending ? 'Transferring...' : 'Execute Transfer'}
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Dynamic Status Alert */}
                    <AnimatePresence>
                        {transferFrom && transferTo && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Alert 
                                    severity="info" 
                                    icon={<Info size={20} />}
                                    sx={{ mt: 3, borderRadius: '12px', '& .MuiAlert-message': { width: '100%' } }}
                                >
                                    <Typography variant="body2">
                                        Transferring tasks from <strong>{fromUser?.name || fromUser?.username}</strong> to <strong>{toUser?.name || toUser?.username}</strong>.
                                        {removeFromCurrent ? ' Access will be revoked from the original employee.' : ' Both will have shared access.'}
                                    </Typography>
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Paper>

                {/* Job List Preview Section */}
                <motion.div variants={itemVariants}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: '24px', 
                            overflow: 'hidden', 
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LayoutList size={20} color="#3b82f6" />
                                <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>
                                    Scoped Tasks Preview {previewLoaded && `(${previewTasks.length})`}
                                </Typography>
                            </Box>
                            {previewLoaded && (
                                <Chip 
                                    label="Snapshot Ready" 
                                    size="small" 
                                    onDelete={() => setPreviewLoaded(false)}
                                    sx={{ borderRadius: '6px', fontWeight: 600, bgcolor: '#f0fdf4', color: '#166534', '& .MuiChip-deleteIcon': { color: '#166534' } }} 
                                />
                            )}
                        </Box>

                        <TableContainer sx={{ minHeight: 300, maxHeight: 500 }}>
                            <Table stickyHeader size="medium">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>#</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Task Overview</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Client Context</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Cycle</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Current Status</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 600 }}>Deadline</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {isLoadingPreview ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <CircularProgress size={30} thickness={2} />
                                                <Typography sx={{ mt: 2, color: '#64748b' }}>Analyzing workload scope...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : previewLoaded && previewTasks.length > 0 ? (
                                        previewTasks.map((task: Task, idx: number) => (
                                            <TableRow key={task._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{String(idx + 1).padStart(2, '0')}</TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <FileText size={14} color="#3b82f6" />
                                                        <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>{task.title}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>
                                                        {typeof task.clientId === 'object' ? (task.clientId as Client)?.name : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={task.frequency || 'One Time'} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 20, fontSize: '0.7rem' }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Box 
                                                        sx={{ 
                                                            px: 1, py: 0.5, borderRadius: '6px', display: 'inline-flex',
                                                            bgcolor: STATUS_COLORS[task.status]?.bg || '#f1f5f9',
                                                            color: STATUS_COLORS[task.status]?.color || '#475569',
                                                            fontSize: '0.7rem', fontWeight: 700
                                                        }}
                                                    >
                                                        {task.status.replace(/_/g, ' ')}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: task.isOverdue ? '#ef4444' : '#64748b' }}>
                                                        <Calendar size={14} />
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: task.isOverdue ? 700 : 400 }}>
                                                            {new Date(task.targetDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : previewLoaded && previewTasks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <AlertCircle size={40} color="#cbd5e1" />
                                                <Typography sx={{ mt: 2, color: '#94a3b8' }}>No tasks found matching these criteria.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <Box sx={{ opacity: 0.4 }}>
                                                    <LayoutList size={40} />
                                                </Box>
                                                <Typography sx={{ mt: 2, color: '#94a3b8' }}>Load a preview to audit tasks before transferring.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </motion.div>
            </motion.div>
        </Box>
    );
};

export default TransferTask;






