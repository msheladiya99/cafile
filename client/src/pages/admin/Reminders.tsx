import React, { useState } from 'react';
import {
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Tooltip,
    Alert,
    Snackbar,
    Card,
    CardContent,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Event as EventIcon,
    NotificationsActive as NotificationsIcon,
    FilterList as FilterIcon,
    History as HistoryIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { reminderService } from '../../services/reminderService';
import { adminService } from '../../services/adminService';
import type { Reminder, Client } from '../../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@mui/material';

interface ReminderDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Reminder>) => void;
    initialData?: Reminder | null;
    clients: Client[];
}

const ReminderDialog: React.FC<ReminderDialogProps> = ({
    onClose,
    onSubmit,
    initialData,
    clients,
    open
}) => {
    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                clientId: (initialData.clientId as Client)?._id || '',
                title: initialData.title,
                description: initialData.description || '',
                dueDate: initialData.dueDate.split('T')[0],
                reminderType: initialData.reminderType,
                priority: initialData.priority,
                notifyBefore: initialData.notifyBefore,
            };
        }
        return {
            clientId: '',
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            reminderType: 'ITR',
            priority: 'MEDIUM',
            notifyBefore: 7,
        };
    });

    const handleSubmit = () => {
        onSubmit(formData as Partial<Reminder>);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {initialData ? 'Edit Reminder' : 'Create New Reminder'}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Set a deadline and automated notification for your client.
                </Typography>
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            select
                            label="Select Client"
                            fullWidth
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            variant="outlined"
                        >
                            {clients.map((client) => (
                                <MenuItem key={client._id} value={client._id}>
                                    {client.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Reminder Title (e.g., ITR Filing - Q3)"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Description / Additional Notes"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            label="Days Notice"
                            type="number"
                            fullWidth
                            helperText="Notify client X days before"
                            value={formData.notifyBefore}
                            onChange={(e) => setFormData({ ...formData, notifyBefore: parseInt(e.target.value) })}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Reminder Type"
                            fullWidth
                            value={formData.reminderType}
                            onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })}
                        >
                            <MenuItem value="ITR">ITR Filing</MenuItem>
                            <MenuItem value="GST">GST Return</MenuItem>
                            <MenuItem value="ACCOUNTING">Accounting</MenuItem>
                            <MenuItem value="OTHER">Other</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            select
                            label="Priority"
                            fullWidth
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <MenuItem value="LOW">Low</MenuItem>
                            <MenuItem value="MEDIUM">Medium</MenuItem>
                            <MenuItem value="HIGH">High</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        px: 4,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {initialData ? 'Update Reminder' : 'Create Reminder'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const Reminders: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: reminders = [], isLoading: isLoadingReminders } = useQuery<Reminder[]>({
        queryKey: ['reminders'],
        queryFn: () => reminderService.getAllReminders()
    });

    const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: () => adminService.getClients()
    });

    const isLoading = isLoadingReminders || isLoadingClients;

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [filter, setFilter] = useState('ALL');
    const [notifying, setNotifying] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const showSnackbar = (message: string, severity: 'success' | 'info' | 'error' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCreate = async (data: Partial<Reminder>) => {
        try {
            await reminderService.createReminder(data);
            setDialogOpen(false);
            showSnackbar('Reminder created successfully!');
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        } catch (error) {
            console.error('Error creating reminder:', error);
            showSnackbar('Failed to create reminder', 'error');
        }
    };

    const handleUpdate = async (data: Partial<Reminder>) => {
        if (!editingReminder) return;
        try {
            await reminderService.updateReminder(editingReminder._id, data);
            setDialogOpen(false);
            setEditingReminder(null);
            showSnackbar('Reminder updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        } catch (error) {
            console.error('Error updating reminder:', error);
            showSnackbar('Failed to update reminder', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this reminder?')) {
            try {
                await reminderService.deleteReminder(id);
                showSnackbar('Reminder deleted');
                queryClient.invalidateQueries({ queryKey: ['reminders'] });
            } catch (error) {
                console.error('Error deleting reminder:', error);
                showSnackbar('Failed to delete reminder', 'error');
            }
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await reminderService.completeReminder(id);
            showSnackbar('Reminder marked as completed');
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        } catch (error) {
            console.error('Error completing reminder:', error);
            showSnackbar('Failed to update status', 'error');
        }
    };

    const handleSendNotifications = async () => {
        setNotifying(true);
        try {
            const result = await reminderService.sendNotifications();
            showSnackbar(result.message || 'Notifications sent successfully');
            queryClient.invalidateQueries({ queryKey: ['reminders'] });
        } catch (error) {
            console.error('Error sending notifications:', error);
            showSnackbar('Error sending automated notifications', 'error');
        } finally {
            setNotifying(false);
        }
    };

    const getStatusColor = (status: string, dueDate: string): 'success' | 'error' | 'warning' | 'default' => {
        if (status === 'COMPLETED') return 'success';
        if (new Date(dueDate) < new Date()) return 'error';
        return 'warning';
    };

    const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'default' => {
        switch (priority) {
            case 'HIGH': return 'error';
            case 'MEDIUM': return 'warning';
            case 'LOW': return 'info';
            default: return 'default';
        }
    };

    const filteredReminders = reminders.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'OVERDUE') return r.status === 'OVERDUE' || (r.status === 'PENDING' && new Date(r.dueDate) < new Date());
        return r.status === filter;
    });

    const pendingCount = reminders.filter(r => r.status === 'PENDING').length;
    const overdueCount = reminders.filter(r => r.status === 'OVERDUE' || (r.status === 'PENDING' && new Date(r.dueDate) < new Date())).length;



    return (
        <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                        Reminders & Deadlines
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage ITR, GST, and other filing deadlines for your clients.
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={notifying ? <CircularProgress size={20} /> : <NotificationsIcon />}
                        disabled={notifying}
                        onClick={handleSendNotifications}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': {
                                borderColor: '#764ba2',
                                backgroundColor: 'rgba(102, 126, 234, 0.04)'
                            }
                        }}
                    >
                        Send Manual Alerts
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setEditingReminder(null);
                            setDialogOpen(true);
                        }}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            px: 3,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            textTransform: 'none',
                            fontWeight: 600
                        }}
                    >
                        Create Reminder
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} mb={4}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }}>
                                    <ScheduleIcon />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Total Pending</Typography>
                                    <Typography variant="h5" fontWeight="700">{isLoading ? <Skeleton width={40} /> : pendingCount}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#f44336' }}>
                                    <HistoryIcon />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Overdue</Typography>
                                    <Typography variant="h5" fontWeight="700" color="error">{isLoading ? <Skeleton width={40} /> : overdueCount}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                                    <CheckCircleIcon />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Completed Recently</Typography>
                                    <Typography variant="h5" fontWeight="700">{reminders.filter(r => r.status === 'COMPLETED').length}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center" borderBottom="1px solid #f0f0f0">
                    <Box display="flex" gap={1}>
                        <FilterIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        <Chip
                            label="All"
                            onClick={() => setFilter('ALL')}
                            color={filter === 'ALL' ? 'primary' : 'default'}
                            variant={filter === 'ALL' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                        />
                        <Chip
                            label="Pending"
                            onClick={() => setFilter('PENDING')}
                            color={filter === 'PENDING' ? 'primary' : 'default'}
                            variant={filter === 'PENDING' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                        />
                        <Chip
                            label="Overdue"
                            onClick={() => setFilter('OVERDUE')}
                            color={filter === 'OVERDUE' ? 'error' : 'default'}
                            variant={filter === 'OVERDUE' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                        />
                        <Chip
                            label="Completed"
                            onClick={() => setFilter('COMPLETED')}
                            color={filter === 'COMPLETED' ? 'success' : 'default'}
                            variant={filter === 'COMPLETED' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                        />
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fbfbfb' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Task / Title</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}><Skeleton height={40} /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredReminders.map((reminder) => (
                                <TableRow key={reminder._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight="700">{reminder.title}</Typography>
                                        {reminder.description && (
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                                {reminder.description}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="600">{(reminder.clientId as Client)?.name || 'Unknown Client'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EventIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                                            <Typography variant="body2">
                                                {new Date(reminder.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reminder.reminderType}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reminder.priority}
                                            size="small"
                                            color={getPriorityColor(reminder.priority)}
                                            sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.65rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reminder.status}
                                            size="small"
                                            color={getStatusColor(reminder.status, reminder.dueDate)}
                                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                            {reminder.status !== 'COMPLETED' && (
                                                <Tooltip title="Mark Complete">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleComplete(reminder._id)}
                                                    >
                                                        <CheckCircleIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setEditingReminder(reminder);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(reminder._id)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredReminders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                        <Box display="flex" flexDirection="column" alignItems="center" color="text.secondary">
                                            <EventIcon sx={{ fontSize: 60, mb: 2, opacity: 0.2 }} />
                                            <Typography variant="h6" fontWeight="600" color="text.secondary" gutterBottom>
                                                No reminders found
                                            </Typography>
                                            <Typography variant="body2">
                                                {filter === 'ALL' ? 'Start by creating your first reminder.' : `No reminders match the "${filter}" filter.`}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ReminderDialog
                key={editingReminder?._id || 'new'}
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={editingReminder ? handleUpdate : handleCreate}
                initialData={editingReminder}
                clients={clients}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

