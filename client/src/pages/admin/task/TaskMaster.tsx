import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
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
import { CommonButton } from '../../../components/common/UIComponents';

interface TaskCategoryData { _id: string; name: string; color: string; }

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
    const [autoBilling, setAutoBilling] = useState(false);

    const [formData, setFormData] = useState<Partial<TaskMasterData>>({
        taskName: '',
        mode: 'One Time',
        category: '',
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
        subtasks: [],
        typeOfClient: [],
        dueDays: 0,
        recurringTask: false,
        recurringDays: 0,
        tags: [],
        users: [],
        workingUser: ''
    });

    const [filters, setFilters] = useState({
        category: '',
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
            if (filters.category) {
                const catId = typeof tm.category === 'object' && tm.category !== null
                    ? (tm.category as { _id: string })._id
                    : tm.category as string;
                if (catId !== filters.category) return false;
            }
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

    // Fetch TaskCategories
    const { data: taskCategories = [] } = useQuery<TaskCategoryData[]>({
        queryKey: ['taskCategories'],
        queryFn: async () => {
            const res = await api.get('/task-category');
            return res.data;
        }
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
            category: '',
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
            subtasks: [],
            typeOfClient: [],
            dueDays: 0,
            recurringTask: false,
            recurringDays: 0,
            tags: [],
            users: [],
            workingUser: ''
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

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, position: 'relative' }}>
            {view === 'list' ? (
                <Paper elevation={0} variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', mb: 3 }}>
                    <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                        <Typography variant="h5" fontWeight="600" color="#1e293b" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Task List</Typography>
                        <CommonButton size="small" fullWidth={isMobile} onClick={() => { resetForm(); setView('form'); }}>
                            Add New
                        </CommonButton>
                    </Box>

                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, mx: { xs: 1, sm: 2 }, borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} mb={2} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Category</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    sx={{ bgcolor: '#fbfffb' }}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {taskCategories.map((c: TaskCategoryData) => (
                                        <MenuItem key={c._id} value={c._id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                                                {c.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
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

                <Box sx={{ mx: { xs: 0, sm: 2 }, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', p: 1.5, display: 'flex', alignItems: 'center', color: '#1e293b', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <ListIcon sx={{ mr: 1 }} />
                    <Typography fontWeight="bold">Task List</Typography>
                </Box>
                <Paper elevation={0} sx={{ mx: { xs: 0, sm: 2 }, borderRadius: 0, border: '1px solid #e0e0e0', borderTop: 'none', overflowX: 'auto' }}>
                    {isMobile ? (
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f8fafc' }}>
                            {filteredTaskMasters.length > 0 ? filteredTaskMasters.map((tm: TaskMasterData) => (
                                <Paper key={tm._id} variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: 'white', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
                                        <CommonButton
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
                                        </CommonButton>
                                        <CommonButton
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            loading={deleteMutation.isPending}
                                            onClick={() => {
                                                const id = tm._id;
                                                if (id && window.confirm('Delete this task master?')) {
                                                    deleteMutation.mutate(id);
                                                }
                                            }}
                                        >
                                            Delete
                                        </CommonButton>
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
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 1600 }}>
                                {taskMasters.length > 0 && (
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow sx={{ textTransform: 'uppercase' }}>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 200, position: 'sticky', left: 0, bgcolor: '#f5f5f5', zIndex: 1 }}>NAME</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>CATEGORY</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>TYPE OF CLIENT</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>PERIOD</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>DUE DAYS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>RECURRING TASK</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>RECURRING DAYS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>TAGS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>NO. OF CLIENTS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>USERS</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>WORKING USER</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>DESCRIPTION</TableCell>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>STATUS</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700, minWidth: 120, position: 'sticky', right: 0, bgcolor: '#f5f5f5', zIndex: 1 }}>ACTIONS</TableCell>
                                        </TableRow>
                                    </TableHead>
                                )}
                                <TableBody>
                                    {filteredTaskMasters.map((tm: TaskMasterData) => (
                                        <TableRow key={tm._id} hover>
                                            <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 0 }}>{tm.taskName}</TableCell>
                                            <TableCell>
                                                {tm.category ? (typeof tm.category === 'object' ? (tm.category as TaskCategoryData).name : taskCategories.find((c: TaskCategoryData) => c._id === tm.category)?.name || '-') : '-'}
                                            </TableCell>
                                            <TableCell>{tm.typeOfClient?.join(', ') || '-'}</TableCell>
                                            <TableCell>{tm.frequency || '-'}</TableCell>
                                            <TableCell>{tm.dueDays || '-'}</TableCell>
                                            <TableCell>{tm.recurringTask ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>{tm.recurringDays || '-'}</TableCell>
                                            <TableCell>{tm.tags?.join(', ') || '-'}</TableCell>
                                            <TableCell>{'-'}</TableCell>
                                            <TableCell>
                                                {tm.users?.map(u => {
                                                    const userId = typeof u === 'object' ? (u as { _id: string })._id : u as string;
                                                    return staff.find((s: User) => s._id === userId)?.name || staff.find((s: User) => s._id === userId)?.username || '';
                                                }).filter(Boolean).join(', ') || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {tm.workingUser ? (typeof tm.workingUser === 'object' ? (tm.workingUser as User).name || (tm.workingUser as User).username : staff.find((s: User) => s._id === tm.workingUser)?.name || staff.find((s: User) => s._id === tm.workingUser)?.username || '-') : '-'}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tm.description || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tm.status}
                                                    size="small"
                                                    color={tm.status === 'Active' ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ position: 'sticky', right: 0, bgcolor: 'background.paper', zIndex: 0 }}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => {
                                                        const rm = tm.reportingManager;
                                                        const rmId = typeof rm === 'object' && rm !== null && '_id' in rm ? (rm as { _id: string })._id : (rm as string | undefined);
                                                        // Normalize mode: convert 'Recurring' to 'Recurrence'
                                                        const mode = tm.mode === 'Recurring' ? 'Recurrence' : tm.mode;
                                                        setFormData({ ...tm, reportingManager: rmId, mode });
                                                        setView('form');
                                                    }} 
                                                    color="primary"
                                                    aria-label="Edit task template"
                                                    title="Edit task template"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => {
                                                        const id = tm._id;
                                                        if (id && window.confirm('Delete this task master?')) {
                                                            deleteMutation.mutate(id);
                                                        }
                                                    }} 
                                                    color="error"
                                                    aria-label="Delete task template"
                                                    title="Delete task template"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredTaskMasters.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={14} align="center" sx={{ py: 3, fontWeight: 600, color: 'text.secondary' }}>
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
            ) : (
                <Box sx={{ p: { xs: 0, md: 0 }, bgcolor: '#f0f2f8', minHeight: '100vh' }}>


            {/* Premium Header */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, boxShadow: '0 8px 32px rgba(102,126,234,0.18)', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                            <AddIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} color="#111827" sx={{ letterSpacing: '-0.3px' }}>
                                {formData._id ? 'Edit Task Master' : 'Add New Task'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Define task templates for your firm</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
                        <CommonButton size="small" onClick={() => { setView('form'); resetForm(); }}>
                            + Add New
                        </CommonButton>
                        <CommonButton variant="outlined" size="small" onClick={() => setView('list')}>
                            View List
                        </CommonButton>
                    </Box>
                </Box>
                <Box sx={{ height: 3, background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)' }} />
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '1fr 360px' }} gap={3} alignItems="flex-start">
                <Box display="flex" flexDirection="column" gap={3}>

                {/* Task Identity Card */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8eaf0' }}>
                    <Box sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography fontWeight={700} color="#1e293b" fontSize={15}>📋 Task Identity</Typography>
                    </Box>
                    <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                        <TextField label="Task Name *" variant="outlined" value={formData.taskName}
                            onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                            required size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        />
                        <TextField select label="Mode *" variant="outlined"
                            value={formData.mode === 'Recurring' ? 'Recurrence' : formData.mode}
                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            required size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value="One Time">⏱ One Time</MenuItem>
                            <MenuItem value="Recurrence">🔄 Recurrence</MenuItem>
                            <MenuItem value="Adhoc">⚡ Adhoc</MenuItem>
                        </TextField>

                        <TextField select label="Category" variant="outlined"
                            value={typeof formData.category === 'object' && formData.category !== null ? (formData.category as { _id: string })._id : (formData.category || '')}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value || undefined })}
                            size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value=""><span>— No Category —</span></MenuItem>
                            {taskCategories.map((c: TaskCategoryData) => (
                                <MenuItem key={c._id} value={c._id}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                                        {c.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="Type of Client" variant="outlined" value={formData.typeOfClient || []}
                            onChange={(e) => setFormData({ ...formData, typeOfClient: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                            size="small" SelectProps={{ multiple: true }}
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value="Individual">Individual</MenuItem>
                            <MenuItem value="HUF">HUF</MenuItem>
                            <MenuItem value="Company">Company</MenuItem>
                            <MenuItem value="Partnership">Partnership</MenuItem>
                            <MenuItem value="LLP">LLP</MenuItem>
                            <MenuItem value="Trust">Trust</MenuItem>
                            <MenuItem value="Society">Society</MenuItem>
                        </TextField>

                        <TextField select label="Department *" variant="outlined" value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            required size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value="GST">GST</MenuItem>
                            <MenuItem value="Income Tax">Income Tax</MenuItem>
                            <MenuItem value="Audit">Audit</MenuItem>
                            <MenuItem value="Accounting">Accounting</MenuItem>
                            <MenuItem value="Compliance">Compliance</MenuItem>
                            <MenuItem value="ROC / Company Law">ROC / Company Law</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>

                        <TextField select label="Period (Frequency)" variant="outlined" value={formData.frequency || ''}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value=""><span>— Select Period —</span></MenuItem>
                            <MenuItem value="Daily">Daily</MenuItem>
                            <MenuItem value="Weekly">Weekly</MenuItem>
                            <MenuItem value="Fortnightly">Fortnightly</MenuItem>
                            <MenuItem value="Monthly">Monthly</MenuItem>
                            <MenuItem value="Quarterly">Quarterly</MenuItem>
                            <MenuItem value="Half Yearly">Half Yearly</MenuItem>
                            <MenuItem value="Yearly">Yearly</MenuItem>
                        </TextField>

                        <TextField label="Due Days" type="number" variant="outlined" value={formData.dueDays || ''}
                            onChange={(e) => setFormData({ ...formData, dueDays: parseInt(e.target.value) || 0 })}
                            size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        />

                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#fafbff', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Recurring Task</Typography>
                                <Typography variant="body2" fontWeight={500}>{formData.recurringTask ? 'Yes' : 'No'}</Typography>
                            </Box>
                            <Switch checked={!!formData.recurringTask} onChange={(e) => setFormData({ ...formData, recurringTask: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />
                        </Box>

                        <TextField label="Recurring Days" type="number" variant="outlined" value={formData.recurringDays || ''}
                            onChange={(e) => setFormData({ ...formData, recurringDays: parseInt(e.target.value) || 0 })}
                            size="small" disabled={!formData.recurringTask}
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        />

                        <TextField label="Tags (comma separated)" variant="outlined" value={formData.tags?.join(', ') || ''}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                            size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        />

                        <TextField select label="Users" variant="outlined" value={(formData.users || []).map(u => typeof u === 'object' ? (u as { _id: string })._id : u)}
                            onChange={(e) => setFormData({ ...formData, users: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[] })}
                            size="small" SelectProps={{ multiple: true }}
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            {staff.map((s: User) => (
                                <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="Working User" variant="outlined" value={typeof formData.workingUser === 'object' && formData.workingUser !== null ? (formData.workingUser as { _id: string })._id : (formData.workingUser || '')}
                            onChange={(e) => setFormData({ ...formData, workingUser: e.target.value })}
                            size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value=""><span>— Auto Select / Open —</span></MenuItem>
                            {staff.map((s: User) => (
                                <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                            ))}
                        </TextField>

                        <TextField select label="Approval Access (Reporting Manager) *" variant="outlined"
                            value={typeof formData.reportingManager === 'object' && formData.reportingManager !== null ? (formData.reportingManager as { _id: string })._id : (formData.reportingManager || '')}
                            onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                            required size="small"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                        >
                            <MenuItem value=""><span>— Select Reporting Manager —</span></MenuItem>
                            {staff.filter((s: User) => ['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(s.role)).map((s: User) => (
                                <MenuItem key={s._id} value={s._id}>{s.name || s.username}</MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                            <TextField label="Description" variant="outlined" fullWidth multiline rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                size="small"
                                InputProps={{ sx: { borderRadius: '12px', bgcolor: '#fafbff' } }}
                                sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#667eea' }, '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 } } }}
                            />
                        </Box>

                        {/* Status card */}
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#fafbff', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">Status</Typography>
                                <Typography variant="body2" fontWeight={500}>{formData.status === 'Active' ? 'Visible & usable' : 'Hidden / inactive'}</Typography>
                            </Box>
                            <Chip label={formData.status} color={formData.status === 'Active' ? 'success' : 'default'}
                                onClick={() => setFormData({ ...formData, status: formData.status === 'Active' ? 'Inactive' : 'Active' })}
                                sx={{ fontWeight: 700, cursor: 'pointer', minWidth: 80, boxShadow: formData.status === 'Active' ? '0 2px 8px rgba(16,185,129,0.3)' : 'none' }} />
                        </Box>

                        {/* UDIN card */}
                        <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#fafbff', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">UDIN Required</Typography>
                                <Typography variant="body2" fontWeight={500}>{formData.udin ? 'Yes — generates UDIN' : 'No UDIN needed'}</Typography>
                            </Box>
                            <Switch checked={!!formData.udin} onChange={(e) => setFormData({ ...formData, udin: e.target.checked })}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } } }} />
                        </Box>
                    </Box>
                </Paper>

                {/* Billing & Financials Card */}
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: `1px solid ${autoBilling ? '#10b981' : '#e8eaf0'}`, transition: 'border-color 0.3s ease' }}>
                    <Box sx={{ px: 3, py: 2, background: autoBilling ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.3s ease' }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography fontSize={16}>{autoBilling ? '💰' : '🚫'}</Typography>
                            <Box>
                                <Typography fontWeight={700} color="white" fontSize={15}>Billing & Financials</Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {autoBilling ? 'Auto-invoice on task completion' : 'Auto billing is disabled'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                                {autoBilling ? 'ON' : 'OFF'}
                            </Typography>
                            <Switch
                                checked={autoBilling}
                                onChange={(e) => {
                                    setAutoBilling(e.target.checked);
                                    if (!e.target.checked) {
                                        setFormData(prev => ({ ...prev, billingAmount: 0, multiFirmId: '' }));
                                    }
                                }}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.5)' },
                                    '& .MuiSwitch-track': { bgcolor: 'rgba(255,255,255,0.3)' },
                                    '& .MuiSwitch-thumb': { bgcolor: 'white' },
                                }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                        {/* HSN & Hours — always visible */}
                        <TextField label="HSN/SAC Code" variant="outlined" value={formData.hsnSac}
                            onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                            size="small" InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                        />
                        <TextField label="Auto Billing Amount (₹)" type="number" variant="outlined"
                            value={formData.billingAmount || ''}
                            onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00" size="small" InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                        />
                        <TextField label="Estimated Hours per Task" type="number" variant="outlined"
                            value={formData.estimatedHours || ''}
                            onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 1 })}
                            size="small" inputProps={{ min: 0.5, step: 0.5 }}
                            helperText="Used for efficiency & time tracking reports"
                            InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                            sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                        />

                        {/* Auto Billing fields — only when enabled */}
                        {autoBilling ? (
                            <>
                                <TextField label="Auto Billing Amount (₹)" type="number" variant="outlined"
                                    value={formData.billingAmount || ''}
                                    onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00" size="small" InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                                />
                                <TextField select label="Link to Billing Service Library" variant="outlined" size="small" value=""
                                    onChange={(e) => {
                                        const service = services.find(s => s._id === e.target.value);
                                        if (service) setFormData({ ...formData, billingAmount: service.basePrice, taskName: formData.taskName || service.name, description: formData.description || service.description });
                                    }}
                                    InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                                    sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                                >
                                    <MenuItem value=""><em>— Choose from Service Library —</em></MenuItem>
                                    {services.map((s: ServiceItem) => (
                                        <MenuItem key={s._id} value={s._id}>{s.name} (₹{s.basePrice})</MenuItem>
                                    ))}
                                </TextField>
                                <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' } }}>
                                    <TextField select label="Billing Firm (Auto Invoice From)" variant="outlined" fullWidth size="small"
                                        value={typeof formData.multiFirmId === 'object' && formData.multiFirmId !== null ? (formData.multiFirmId as { _id: string })._id : (formData.multiFirmId || '')}
                                        onChange={(e) => setFormData({ ...formData, multiFirmId: e.target.value || undefined })}
                                        helperText="Which firm's letterhead to use for auto-generated invoices"
                                        InputProps={{ sx: { borderRadius: '12px', bgcolor: '#f0fdf8' } }}
                                        sx={{ '& .MuiOutlinedInput-root': { '&:hover fieldset': { borderColor: '#10b981' }, '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: 2 } } }}
                                    >
                                        <MenuItem value=""><em>Main Firm (Default)</em></MenuItem>
                                        {multiFirms.map((mf: { _id: string; firmName: string; invoicePrefix?: string }) => (
                                            <MenuItem key={mf._id} value={mf._id}>{mf.firmName} {mf.invoicePrefix ? `(${mf.invoicePrefix})` : ''}</MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ gridColumn: { xs: '1', md: '1 / span 2' }, p: 2.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Typography fontSize={16}>🚫</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">Auto Billing is disabled</Typography>
                                    <Typography variant="caption" color="text.disabled">Toggle the switch above to enable automatic invoice generation on task completion</Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* Save / Cancel */}
                <Box display="flex" gap={2}>
                    <CommonButton type="submit" variant="contained" fullWidth
                        loading={createMutation.isPending || updateMutation.isPending}
                        sx={{ py: 1.5, borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', boxShadow: '0 4px 20px rgba(102,126,234,0.4)', '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #653d96 100%)', transform: 'translateY(-1px)' }, transition: 'all 0.2s ease' }}>
                        {formData._id ? '✔ Update Task' : '✔ Save Task'}
                    </CommonButton>
                    <CommonButton variant="outlined" onClick={resetForm}
                        sx={{ py: 1.5, borderRadius: '12px', px: 4, borderColor: '#d0d3e8', color: '#667eea', '&:hover': { borderColor: '#667eea', bgcolor: 'rgba(102,126,234,0.06)' } }}>
                        Reset
                    </CommonButton>
                </Box>
                </Box>{/* end left column */}

                {/* RIGHT COLUMN: Subtasks */}
                <Box>
                <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8eaf0', position: { lg: 'sticky' }, top: { lg: 20 } }}>
                    <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography fontWeight={700} color="white" fontSize={15}>📝 Subtasks ({formData.subtasks?.length || 0})</Typography>
                        <CommonButton variant="contained" size="small" startIcon={<AddIcon />}
                            onClick={() => setIsSubtaskModalOpen(true)}
                            sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#334155' }, color: 'white', borderRadius: '8px', boxShadow: 'none' }}>
                            Add Step
                        </CommonButton>
                    </Box>
                    <Box sx={{ p: 2, maxHeight: 480, overflowY: 'auto' }}>
                        {formData.subtasks && formData.subtasks.length > 0 ? (
                            <Box display="flex" flexDirection="column" gap={1.5}>
                                {formData.subtasks.map((st, i) => (
                                    <Box key={i} sx={{ p: 2, borderRadius: '12px', border: '1px solid #f0f0f0', bgcolor: 'white', display: 'flex', alignItems: 'flex-start', gap: 1.5, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', '&:hover': { borderColor: '#6366f1', boxShadow: '0 2px 8px rgba(99,102,241,0.12)' }, transition: 'all 0.2s ease' }}>
                                        <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography fontSize={11} fontWeight={700} color="white">{st.activityOrder || i + 1}</Typography>
                                        </Box>
                                        <Box flex={1}>
                                            <Typography variant="body2" fontWeight={600}>{st.name}</Typography>
                                            {st.designation && <Typography variant="caption" color="text.secondary">{st.designation}</Typography>}
                                        </Box>
                                        <IconButton 
                                            size="small" 
                                            color="error" 
                                            onClick={() => handleRemoveSubtask(i)} 
                                            sx={{ '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
                                            aria-label="Remove subtask"
                                            title="Remove subtask"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ py: 5, textAlign: 'center' }}>
                                <Typography fontSize={32} mb={1}>📋</Typography>
                                <Typography variant="body2" fontWeight={600} color="text.secondary">No subtasks yet</Typography>
                                <Typography variant="caption" color="text.disabled">Break this task into steps</Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
                </Box>{/* end right col */}
                </Box>{/* end two-col grid */}

                {/* Subtask Modal - Premium Amber */}
                <Dialog open={isSubtaskModalOpen} onClose={() => setIsSubtaskModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                    <DialogTitle sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Typography fontSize={18}>📝</Typography>
                            <Typography variant="h6" fontWeight={700}>Add Subtask Step</Typography>
                        </Box>
                        <IconButton 
                            size="small" 
                            onClick={() => setIsSubtaskModalOpen(false)} 
                            sx={{ color: 'white' }}
                            aria-label="Close dialog"
                            title="Close dialog"
                        >
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
                                            aria-label="Decrease order"
                                            title="Decrease order"
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
                                            aria-label="Increase order"
                                            title="Increase order"
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
                        <CommonButton
                            variant="contained"
                            onClick={handleAddSubtask}
                            disabled={!subtaskInput.name || !subtaskInput.predefinedEmployee}
                            sx={{ minWidth: 140, py: 1.2, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', '&:hover': { background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)' } }}
                        >
                            ✔ Add Step
                        </CommonButton>
                        <CommonButton variant="outlined" onClick={() => setIsSubtaskModalOpen(false)}
                            sx={{ minWidth: 100, py: 1.2, borderRadius: '12px' }}
                        >
                            Cancel
                        </CommonButton>
                    </DialogActions>
                </Dialog>
            </form>
                </Box>
            )}
        </Box>
    );
};

export default TaskMaster;





