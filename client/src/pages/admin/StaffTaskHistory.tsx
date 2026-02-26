import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    TextField,
    MenuItem,
    Button,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    CircularProgress,
    Stack,
    Divider,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Download as DownloadIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '../../services/taskService';
import type { User, TaskStatus } from '../../types';
import { adminService } from '../../services/adminService';

const statusColors: Record<TaskStatus, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
    PENDING: 'default',
    STARTED: 'primary',
    UNDER_REVIEW: 'warning',
    DONE: 'success',
    CANCELLED: 'error',
};

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
    LOW: 'default',
    MEDIUM: 'info',
    HIGH: 'warning',
    URGENT: 'error',
};

export const StaffTaskHistory: React.FC = () => {
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Fetch staff members
    const { data: staff = [] } = useQuery<User[]>({
        queryKey: ['staff'],
        queryFn: adminService.getStaffUsers,
    });

    // Fetch staff history
    const { data: historyData, isLoading, error } = useQuery({
        queryKey: ['staffHistory', selectedStaff, selectedStatus, startDate, endDate],
        queryFn: () => taskService.getStaffHistory({
            staffId: selectedStaff || undefined,
            status: selectedStatus as TaskStatus || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        }),
    });

    const handleExport = () => {
        // Simple CSV export
        if (!historyData?.staffHistory) return;

        let csv = 'Staff Name,Total Tasks,Completed,Pending,In Progress,Under Review,Overdue,Est. Hours,Actual Hours,Efficiency %,On-Time %,Completion %\n';

        historyData.staffHistory.forEach((sh: any) => {
            csv += `${sh.staff.name},${sh.summary.totalTasks},${sh.summary.completedTasks},${sh.summary.pendingTasks},${sh.summary.inProgressTasks},${sh.summary.underReviewTasks},${sh.summary.overdueTasks},${sh.summary.totalEstimatedHours},${sh.summary.totalActualHours},${sh.summary.avgEfficiency},${sh.summary.onTimeRate},${sh.summary.completionRate}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `staff-task-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon sx={{ fontSize: 32 }} />
                    Staff Task History (Ledger)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Complete task history and performance metrics for each staff member
                </Typography>
            </Box>

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                label="Staff Member"
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="">All Staff</MenuItem>
                                {staff.map((s) => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {s.name || s.username} ({s.role})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                size="small"
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="STARTED">In Progress</MenuItem>
                                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                                <MenuItem value="DONE">Completed</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                type="date"
                                fullWidth
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <TextField
                                type="date"
                                fullWidth
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setSelectedStaff('');
                                setSelectedStatus('');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Clear Filters
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                            disabled={!historyData?.staffHistory?.length}
                        >
                            Export CSV
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Loading State */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load staff history. Please try again.
                </Alert>
            )}

            {/* Staff History */}
            {!isLoading && historyData?.staffHistory && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <PersonIcon />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {historyData.totalStaff}
                                            </Typography>
                                            <Typography variant="body2">Total Staff</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <AssignmentIcon />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {historyData.staffHistory.reduce((sum: number, sh: any) => sum + sh.summary.totalTasks, 0)}
                                            </Typography>
                                            <Typography variant="body2">Total Tasks</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CheckCircleIcon />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {historyData.staffHistory.reduce((sum: number, sh: any) => sum + sh.summary.completedTasks, 0)}
                                            </Typography>
                                            <Typography variant="body2">Completed</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <ScheduleIcon />
                                        <Box>
                                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                {Math.round(historyData.staffHistory.reduce((sum: number, sh: any) => sum + sh.summary.totalActualHours, 0))}h
                                            </Typography>
                                            <Typography variant="body2">Total Hours</Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Staff Accordions */}
                    {historyData.staffHistory.length === 0 ? (
                        <Alert severity="info">No task history found for the selected filters.</Alert>
                    ) : (
                        historyData.staffHistory.map((staffHistory: any) => (
                            <Accordion key={staffHistory.staff._id} sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                                        <PersonIcon color="primary" />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {staffHistory.staff.name || staffHistory.staff.username}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {staffHistory.staff.email} • {staffHistory.staff.role}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={`${staffHistory.summary.totalTasks} Tasks`}
                                                size="small"
                                                color="primary"
                                            />
                                            <Chip
                                                label={`${staffHistory.summary.completionRate}% Complete`}
                                                size="small"
                                                color="success"
                                            />
                                        </Stack>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {/* Summary Metrics */}
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6" color="primary">{staffHistory.summary.totalTasks}</Typography>
                                                    <Typography variant="caption">Total</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6" color="success.main">{staffHistory.summary.completedTasks}</Typography>
                                                    <Typography variant="caption">Completed</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6" color="warning.main">{staffHistory.summary.inProgressTasks}</Typography>
                                                    <Typography variant="caption">In Progress</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6" color="error.main">{staffHistory.summary.overdueTasks}</Typography>
                                                    <Typography variant="caption">Overdue</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6">{staffHistory.summary.avgEfficiency}%</Typography>
                                                    <Typography variant="caption">Efficiency</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                                            <Card variant="outlined">
                                                <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                    <Typography variant="h6">{staffHistory.summary.onTimeRate}%</Typography>
                                                    <Typography variant="caption">On-Time</Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Task Table */}
                                    {staffHistory.tasks.length === 0 ? (
                                        <Alert severity="info">No tasks found</Alert>
                                    ) : (
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Title</strong></TableCell>
                                                        <TableCell><strong>Client</strong></TableCell>
                                                        <TableCell><strong>Status</strong></TableCell>
                                                        <TableCell><strong>Priority</strong></TableCell>
                                                        <TableCell><strong>Target Date</strong></TableCell>
                                                        <TableCell><strong>Est. Hrs</strong></TableCell>
                                                        <TableCell><strong>Actual Hrs</strong></TableCell>
                                                        <TableCell><strong>Progress</strong></TableCell>
                                                        <TableCell><strong>Created</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {staffHistory.tasks.map((task: any) => (
                                                        <TableRow key={task._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {task.title}
                                                                </Typography>
                                                                {task.isOverdue && task.status !== 'DONE' && (
                                                                    <Chip label="OVERDUE" size="small" color="error" sx={{ mt: 0.5 }} />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {task.client?.name || '-'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={task.status}
                                                                    size="small"
                                                                    color={statusColors[task.status as TaskStatus]}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={task.priority}
                                                                    size="small"
                                                                    color={priorityColors[task.priority]}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {formatDate(task.targetDate)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>{task.estimatedHours}h</TableCell>
                                                            <TableCell>{task.actualHours}h</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={`${task.progressPercentage}%`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {formatDate(task.createdAt)}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </>
            )}
        </Box>
    );
};
