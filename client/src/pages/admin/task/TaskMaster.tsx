import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    Switch,
    Alert,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Grid,
    Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, FormatListBulleted as ListIcon, Close as CloseIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { staffService } from '../../../services/staffService';
import { billingService } from '../../../services/billingService';
import api from '../../../services/api';
import type { ServiceItem } from '../../../services/billingService';
import type { TaskMasterData, User, Subtask } from '../../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

export const TaskMaster: React.FC = () => {
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const view = location.pathname.includes('/list') ? 'list' : 'form';
    const setView = (v: 'form' | 'list') => {
        navigate(v === 'form' ? '/admin/task-master/add' : '/admin/task-master/list');
    };
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState<Partial<TaskMasterData>>({
        taskName: '',
        mode: 'One Time',
        department: '',
        frequency: '',
        billingAmount: 0,
        estimatedHours: 1,
        multiFirmId: '',
        reportingManager: '',
        description: '',
        status: 'Active',
        hsnSac: '',
        udin: false,
        subtasks: []
    });

    const [filters, setFilters] = useState({
        department: '',
        frequency: '',
        reportingManager: '',
        udin: '',
        mode: '',
        status: ''
    });

    const [subtaskInput, setSubtaskInput] = useState<Partial<Subtask>>({
        name: '',
        description: '',
        designation: '',
        predefinedEmployee: '',
        activityOrder: 1
    });
    const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);

    const designations = [
        'Junior Accountant',
        'Senior Accountant',
        'Audit Manager',
        'Tax Consultant',
        'Compliance Officer',
        'Partner',
        'Intern'
    ];

    // Fetch Task Masters
    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    // Apply list filters client-side
    const filteredTaskMasters = useMemo(() => {
        return taskMasters.filter((tm: TaskMasterData) => {
            if (filters.department && tm.department !== filters.department) return false;
            if (filters.frequency && tm.frequency !== filters.frequency) return false;
            if (filters.mode && tm.mode !== filters.mode) return false;
            if (filters.status && tm.status !== filters.status) return false;
            if (filters.udin) {
                const want = filters.udin === 'Yes';
                if (!!tm.udin !== want) return false;
            }
            if (filters.reportingManager) {
                const rmId = typeof tm.reportingManager === 'object' && tm.reportingManager !== null && '_id' in (tm.reportingManager as object)
                    ? (tm.reportingManager as { _id: string })._id
                    : tm.reportingManager as string;
                if (rmId !== filters.reportingManager) return false;
            }
            return true;
        });
    }, [taskMasters, filters]);

    // Fetch Staff for Reporting Manager
    const { data: staff = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    // Fetch Services for Billing Link
    const { data: services = [] } = useQuery({
        queryKey: ['billingServices'],
        queryFn: billingService.getServices
    });

    // Fetch Multi-Firms for billing firm selector
    const { data: multiFirms = [] } = useQuery({
        queryKey: ['multiFirms'],
        queryFn: async () => {
            const res = await api.get<{ _id: string; firmName: string; invoicePrefix?: string }[]>('/firm/multi');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<TaskMasterData>) => taskMasterService.createTaskMaster(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskMasters'] });
            setSuccess('Task Master created successfully');
            resetForm();
            setView('list');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to create Task Master');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TaskMasterData> }) =>
            taskMasterService.updateTaskMaster(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskMasters'] });
            setSuccess('Task Master updated successfully');
            resetForm();
            setView('list');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            setError(err.response?.data?.message || 'Failed to update Task Master');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => taskMasterService.deleteTaskMaster(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskMasters'] });
            setSuccess('Task Master deleted successfully');
        }
    });

    const resetForm = () => {
        setFormData({
            taskName: '',
            mode: 'One Time',
            department: '',
            reportingManager: '',
            description: '',
            status: 'Active',
            hsnSac: '',
            udin: false,
            billingAmount: 0,
            estimatedHours: 1,
            multiFirmId: '',
            frequency: '',
            subtasks: []
        });
        setSubtaskInput({
            name: '',
            description: '',
            designation: '',
            predefinedEmployee: '',
            activityOrder: 1
        });
        setError('');
        setSuccess('');
    };

    const handleAddSubtask = () => {
        if (!subtaskInput.name) return;
        setFormData({
            ...formData,
            subtasks: [...(formData.subtasks || []), subtaskInput as Subtask]
        });
        setSubtaskInput({
            name: '',
            description: '',
            designation: '',
            predefinedEmployee: '',
            activityOrder: (formData.subtasks?.length || 0) + 2
        });
        setIsSubtaskModalOpen(false);
    };

    const handleRemoveSubtask = (index: number) => {
        const newSubtasks = [...(formData.subtasks || [])];
        newSubtasks.splice(index, 1);
        setFormData({ ...formData, subtasks: newSubtasks });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Ensure billingAmount is a number
        const submissionData = {
            ...formData,
            billingAmount: parseFloat(String(formData.billingAmount)) || 0
        };

        if (formData._id) {
            updateMutation.mutate({ id: formData._id, data: submissionData });
        } else {
            createMutation.mutate(submissionData);
        }
    };

    if (view === 'list') {
        return (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: { xs: 2, sm: 2.5 }, color: 'white', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                        <Typography variant="h5" fontWeight="600" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Task List</Typography>
                        <Button size="small" fullWidth={isMobile} variant="contained" onClick={() => { resetForm(); setView('form'); }} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', px: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, borderRadius: 2, boxShadow: 'none' }}>
                            Add New
                        </Button>
                    </Box>

                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, mx: { xs: 1, sm: 2 }, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Department</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.department}
                                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose Department...</MenuItem>
                                    <MenuItem value="GST">GST</MenuItem>
                                    <MenuItem value="Income Tax">Income Tax</MenuItem>
                                    <MenuItem value="Audit">Audit</MenuItem>
                                    <MenuItem value="Accounting">Accounting</MenuItem>
                                    <MenuItem value="Compliance">Compliance</MenuItem>
                                </Select>
                            </Box>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Frequency</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.frequency}
                                    onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose Frequency</MenuItem>
                                    <MenuItem value="Daily">Daily</MenuItem>
                                    <MenuItem value="Weekly">Weekly</MenuItem>
                                    <MenuItem value="Monthly">Monthly</MenuItem>
                                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                                    <MenuItem value="Yearly">Yearly</MenuItem>
                                </Select>
                            </Box>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Reporting Manager</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.reportingManager}
                                    onChange={(e) => setFilters({ ...filters, reportingManager: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose Reporting Manager...</MenuItem>
                                    {staff.map((s: User) => (
                                        <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>UDIN</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.udin}
                                    onChange={(e) => setFilters({ ...filters, udin: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose UDIN</MenuItem>
                                    <MenuItem value="Yes">Yes</MenuItem>
                                    <MenuItem value="No">No</MenuItem>
                                </Select>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Mode</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.mode}
                                    onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose Mode</MenuItem>
                                    <MenuItem value="One Time">One Time</MenuItem>
                                    <MenuItem value="Recurrence">Recurrence</MenuItem>
                                    <MenuItem value="Adhoc">Adhoc</MenuItem>
                                </Select>
                            </Box>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Status</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">Choose Status</MenuItem>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                </Select>
                            </Box>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Task</Typography>
                                <Select size="small" fullWidth displayEmpty value="" sx={{ bgcolor: '#fbfffb' }}>
                                    <MenuItem value="">Choose a Task...</MenuItem>
                                </Select>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ mx: { xs: 0, sm: 2 }, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 1.5, display: 'flex', alignItems: 'center', color: 'white', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <ListIcon sx={{ mr: 1 }} />
                    <Typography fontWeight="bold">Task List</Typography>
                </Box>
                <Paper elevation={0} sx={{ mx: { xs: 0, sm: 2 }, borderRadius: 0, border: '1px solid #e0e0e0', borderTop: 'none', overflowX: 'auto' }}>
                    {isMobile ? (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f8fafc' }}>
                            {filteredTaskMasters.length > 0 ? filteredTaskMasters.map((tm: TaskMasterData) => (
                                <Paper key={tm._id} variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'white', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="700" color="primary.main">{tm.taskName}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{tm.department}</Typography>
                                        </Box>
                                        <Chip
                                            label={tm.status}
                                            size="small"
                                            color={tm.status === 'Active' ? 'success' : 'default'}
                                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                    
                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Mode</Typography>
                                            <Typography variant="body2" fontWeight="500">{tm.mode}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Frequency</Typography>
                                            <Typography variant="body2" fontWeight="500">{tm.frequency || '-'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Billing Amount</Typography>
                                            <Typography variant="body2" fontWeight="500">₹{tm.billingAmount || 0}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<EditIcon />}
                                            onClick={() => {
                                                const rm = tm.reportingManager;
                                                const rmId = typeof rm === 'object' && rm !== null && '_id' in rm ? (rm as { _id: string })._id : (rm as string | undefined);
                                                const mode = tm.mode === 'Recurring' ? 'Recurrence' : tm.mode;
                                                setFormData({ ...tm, reportingManager: rmId, mode });
                                                setView('form');
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                const id = tm._id;
                                                if (id && window.confirm('Delete this task master?')) {
                                                    deleteMutation.mutate(id);
                                                }
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </Paper>
                            )) : (
                                <Box p={3} textAlign="center">
                                    <Typography color="text.secondary">
                                        {taskMasters.length > 0 ? 'No records match the selected filters.' : 'No Record Found'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                {taskMasters.length > 0 && (
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Task Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                                            <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Billing</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                )}
                                <TableBody>
                                    {filteredTaskMasters.map((tm: TaskMasterData) => (
                                        <TableRow key={tm._id} hover>
                                            <TableCell>{tm.taskName}</TableCell>
                                            <TableCell>{tm.mode}</TableCell>
                                            <TableCell>{tm.frequency || '-'}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{tm.department}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>₹{tm.billingAmount || 0}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tm.status}
                                                    size="small"
                                                    color={tm.status === 'Active' ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => {
                                                    const rm = tm.reportingManager;
                                                    const rmId = typeof rm === 'object' && rm !== null && '_id' in rm ? (rm as { _id: string })._id : (rm as string | undefined);
                                                    // Normalize mode: convert 'Recurring' to 'Recurrence'
                                                    const mode = tm.mode === 'Recurring' ? 'Recurrence' : tm.mode;
                                                    setFormData({ ...tm, reportingManager: rmId, mode });
                                                    setView('form');
                                                }} color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => {
                                                    const id = tm._id;
                                                    if (id && window.confirm('Delete this task master?')) {
                                                        deleteMutation.mutate(id);
                                                    }
                                                }} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredTaskMasters.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 3, fontWeight: 600, color: 'text.secondary' }}>
                                                {taskMasters.length > 0 ? 'No records match the selected filters.' : 'No Record Found'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', mb: 3 }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="600">Task Master</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            onClick={() => { setView('form'); resetForm(); }}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                        >
                            Add New
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setView('list')}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                        >
                            List
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={3}>
                        {/* Row 1 */}
                        <TextField
                            label="Task Name *"
                            variant="outlined"
                            value={formData.taskName}
                            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                            required
                            size="small"
                        />
                        <TextField
                            select
                            label="Mode *"
                            variant="outlined"
                            value={formData.mode === 'Recurring' ? 'Recurrence' : formData.mode}
                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            required
                            size="small"
                        >
                            <MenuItem value="One Time">One Time</MenuItem>
                            <MenuItem value="Recurrence">Recurrence</MenuItem>
                            <MenuItem value="Adhoc">Adhoc</MenuItem>
                        </TextField>

                        {/* Row 2 */}
                        <TextField
                            select
                            label="Department *"
                            variant="outlined"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            required
                            size="small"
                        >
                            <MenuItem value="GST">GST</MenuItem>
                            <MenuItem value="Income Tax">Income Tax</MenuItem>
                            <MenuItem value="Audit">Audit</MenuItem>
                            <MenuItem value="Accounting">Accounting</MenuItem>
                            <MenuItem value="Compliance">Compliance</MenuItem>
                            <MenuItem value="ROC / Company Law">ROC / Company Law</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Frequency"
                            variant="outlined"
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            size="small"
                            disabled={formData.mode !== 'Recurrence' && formData.mode !== 'Recurring'}
                        >
                            <MenuItem value=""><em>-- Select Frequency --</em></MenuItem>
                            <MenuItem value="Daily">Daily</MenuItem>
                            <MenuItem value="Weekly">Weekly</MenuItem>
                            <MenuItem value="Fortnightly">Fortnightly</MenuItem>
                            <MenuItem value="Monthly">Monthly</MenuItem>
                            <MenuItem value="Quarterly">Quarterly</MenuItem>
                            <MenuItem value="Half Yearly">Half Yearly</MenuItem>
                            <MenuItem value="Yearly">Yearly</MenuItem>
                        </TextField>

                        {/* Row 3 */}
                        <TextField
                            select
                            label="Approval Access (Reporting Manager) *"
                            variant="outlined"
                            value={formData.reportingManager}
                            onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                            required
                            size="small"
                        >
                            {staff.filter((s: User) => ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(s.role)).map((s: User) => (
                                <MenuItem key={s._id} value={s._id}>
                                    {s.name || s.username}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box display="flex" alignItems="center" px={1}>
                            <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>Status</Typography>
                            <Chip
                                label={formData.status}
                                color={formData.status === 'Active' ? 'primary' : 'default'}
                                onClick={() => setFormData({ ...formData, status: formData.status === 'Active' ? 'Inactive' : 'Active' })}
                                sx={{ minWidth: 80, fontWeight: 700 }}
                            />
                        </Box>

                        {/* Row 4 */}
                        <TextField
                            label="Description"
                            variant="outlined"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            size="small"
                        />

                        <Box display="flex" alignItems="center" px={1}>
                            <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>UDIN</Typography>
                            <Switch
                                checked={formData.udin}
                                onChange={(e) => setFormData({ ...formData, udin: e.target.checked })}
                                color="primary"
                            />
                        </Box>

                        {/* Row 5 */}
                        <TextField
                            label="HSN/SAC"
                            variant="outlined"
                            value={formData.hsnSac}
                            onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                            size="small"
                        />

                        <TextField
                            select
                            label="Link to Billing Service Library"
                            variant="outlined"
                            size="small"
                            value=""
                            onChange={(e) => {
                                const service = services.find(s => s._id === e.target.value);
                                if (service) {
                                    setFormData({
                                        ...formData,
                                        billingAmount: service.basePrice,
                                        taskName: formData.taskName || service.name,
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

                        {/* Row 6 */}
                        <TextField
                            label="Auto Billing Amount (₹)"
                            type="number"
                            variant="outlined"
                            value={formData.billingAmount || ''}
                            onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="Amount to be billed on completion"
                            size="small"
                        />

                        {/* Row 7 */}
                        <TextField
                            label="Estimated Hours per Task"
                            type="number"
                            variant="outlined"
                            value={formData.estimatedHours || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 1 })}
                         size="small"
                            inputProps={{ min: 0.5, step: 0.5 }}
                            helperText="Used for time tracking efficiency reports"
                        />

                        {/* Billing Firm (MultiFirm) */}
                        <TextField
                            select
                            label="Billing Firm (Auto Invoice From)"
                            variant="outlined"
                            size="small"
                            value={typeof formData.multiFirmId === 'object' && formData.multiFirmId !== null
                                ? (formData.multiFirmId as { _id: string })._id
                                : (formData.multiFirmId || '')}
                            onChange={(e) => setFormData({ ...formData, multiFirmId: e.target.value || undefined })}
                            helperText="Which firm's letterhead to use for auto-generated invoices"
                        >
                            <MenuItem value=""><em>Main Firm (Default)</em></MenuItem>
                            {multiFirms.map((mf: { _id: string; firmName: string; invoicePrefix?: string }) => (
                                <MenuItem key={mf._id} value={mf._id}>
                                    {mf.firmName} {mf.invoicePrefix ? `(${mf.invoicePrefix})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>


                    <Box display="flex" gap={2} justifyContent="center" mb={2}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createMutation.isPending}
                            sx={{
                                minWidth: 100,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                }
                            }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={resetForm}
                            sx={{ minWidth: 100, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Paper>

                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                        <Typography fontWeight="600">Subtask List</Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setIsSubtaskModalOpen(true)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                        >
                            Add Subtask
                        </Button>
                    </Box>
                    <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                        {formData.subtasks && formData.subtasks.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Sub Task Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.subtasks.map((st, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{st.activityOrder || i + 1}</TableCell>
                                                <TableCell>{st.name}</TableCell>
                                                <TableCell>{st.designation || '-'}</TableCell>
                                                <TableCell>
                                                    {typeof st.predefinedEmployee === 'object'
                                                        ? (st.predefinedEmployee as User).name
                                                        : staff.find(s => s._id === st.predefinedEmployee)?.name || '-'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveSubtask(i)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>No subtasks added yet.</Typography>
                        )}
                    </Box>
                </Box>

                {/* Subtask Modal */}
                <Dialog
                    open={isSubtaskModalOpen}
                    onClose={() => setIsSubtaskModalOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
                >
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <Typography variant="h6" fontWeight="600">Add Subtask Information</Typography>
                        <IconButton size="small" onClick={() => setIsSubtaskModalOpen(false)} sx={{ color: 'white' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, pt: 4 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center">
                                    <Typography sx={{ width: 140, fontWeight: 500, color: 'text.secondary' }}>Sub Task Name *</Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        value={subtaskInput.name}
                                        onChange={(e) => setSubtaskInput({ ...subtaskInput, name: e.target.value })}
                                        placeholder="Enter sub task name"
                                    />
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center">
                                    <Typography sx={{ width: 140, fontWeight: 500, color: 'text.secondary' }}>Designation</Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        value={subtaskInput.designation}
                                        onChange={(e) => setSubtaskInput({ ...subtaskInput, designation: e.target.value as string })}
                                    >
                                        <MenuItem value="">Choose a Designation...</MenuItem>
                                        {designations.map(d => (
                                            <MenuItem key={d} value={d}>{d}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center">
                                    <Typography sx={{ width: 140, fontWeight: 500, color: 'text.secondary' }}>Predefine Employee *</Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        value={subtaskInput.predefinedEmployee}
                                        onChange={(e) => setSubtaskInput({ ...subtaskInput, predefinedEmployee: e.target.value as string })}
                                    >
                                        <MenuItem value="">Choose a Employee...</MenuItem>
                                        {staff.map((s: User) => (
                                            <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex" alignItems="center">
                                    <Typography sx={{ width: 140, fontWeight: 500, color: 'text.secondary' }}>Activity Order *</Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <IconButton
                                            size="small"
                                            onClick={() => setSubtaskInput({ ...subtaskInput, activityOrder: Math.max(1, (subtaskInput.activityOrder || 1) - 1) })}
                                            sx={{ border: '1px solid #e0e0e0' }}
                                        >
                                            <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        <TextField
                                            size="small"
                                            value={subtaskInput.activityOrder}
                                            sx={{ width: 60, '& input': { textAlign: 'center' } }}
                                            InputProps={{ readOnly: true }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={() => setSubtaskInput({ ...subtaskInput, activityOrder: (subtaskInput.activityOrder || 1) + 1 })}
                                            sx={{ border: '1px solid #e0e0e0' }}
                                        >
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Box display="flex">
                                    <Typography sx={{ width: 140, fontWeight: 500, color: 'text.secondary', pt: 1 }}>Description</Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        size="small"
                                        value={subtaskInput.description}
                                        onChange={(e) => setSubtaskInput({ ...subtaskInput, description: e.target.value })}
                                        placeholder="Enter description"
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5, px: 3, gap: 1.5, justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            onClick={handleAddSubtask}
                            disabled={!subtaskInput.name || !subtaskInput.predefinedEmployee}
                            sx={{ minWidth: 100, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textTransform: 'none' }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setIsSubtaskModalOpen(false)}
                            sx={{ minWidth: 100, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 1, px: 3, color: 'white' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ListIcon fontSize="small" />
                            <Typography fontWeight="600" variant="body2">Subtask List</Typography>
                        </Box>
                    </Box>
                </Dialog>
            </form>
        </Box>
    );
};

export default TaskMaster;
