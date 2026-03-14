import React, { useState } from 'react';
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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Grid,
    Select,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, FormatListBulleted as ListIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { staffService } from '../../../services/staffService';
import { billingService } from '../../../services/billingService';
import type { ServiceItem } from '../../../services/billingService';
import type { TaskMasterData, User } from '../../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

export const TaskMaster: React.FC = () => {
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();

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

    const [subtaskInput, setSubtaskInput] = useState({ name: '', description: '' });

    // Fetch Task Masters
    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

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
            subtasks: []
        });
        setSubtaskInput({ name: '', description: '' });
        setError('');
        setSuccess('');
    };

    const handleAddSubtask = () => {
        if (!subtaskInput.name) return;
        setFormData({
            ...formData,
            subtasks: [...(formData.subtasks || []), { ...subtaskInput }]
        });
        setSubtaskInput({ name: '', description: '' });
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
        createMutation.mutate(formData);
    };

    if (view === 'list') {
        return (
            <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 2, borderRadius: '4px 4px 0 0' }}>
                    <Typography variant="h5" color="white" fontWeight="600">Task List</Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(102, 126, 234, 0.8)', p: 1, display: 'flex', justifyContent: 'flex-end', borderRadius: '0 0 4px 4px', mb: 2 }}>
                    <Button size="small" variant="contained" onClick={() => setView('form')} sx={{ bgcolor: '#8b8b8b', color: 'white', textTransform: 'none', px: 3, '&:hover': { bgcolor: '#707070' } }}>Add New</Button>
                </Box>

                <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', mx: 2 }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" mb={2} alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Department</Typography>
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
                            <Box display="flex" mb={2} alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Frequency</Typography>
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
                            <Box display="flex" mb={2} alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Reporting Manager</Typography>
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
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>UDIN</Typography>
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
                            <Box display="flex" mb={2} alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Mode</Typography>
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
                                    <MenuItem value="Recurring">Recurring</MenuItem>
                                    <MenuItem value="Adhoc">Adhoc</MenuItem>
                                </Select>
                            </Box>
                            <Box display="flex" mb={2} alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Status</Typography>
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
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Task</Typography>
                                <Select size="small" fullWidth displayEmpty value="" sx={{ bgcolor: '#fbfffb' }}>
                                    <MenuItem value="">Choose a Task...</MenuItem>
                                </Select>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Box sx={{ mx: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', p: 1.5, display: 'flex', alignItems: 'center', color: 'white', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <ListIcon sx={{ mr: 1 }} />
                    <Typography fontWeight="bold">Task List</Typography>
                </Box>
                <Paper elevation={0} sx={{ mx: 2, borderRadius: 0, border: '1px solid #e0e0e0', borderTop: 'none' }}>
                    <TableContainer>
                        <Table>
                            {taskMasters.length > 0 && (
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Task Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Billing</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                            )}
                            <TableBody>
                                {taskMasters.map((tm: TaskMasterData) => (
                                    <TableRow key={tm._id} hover>
                                        <TableCell>{tm.taskName}</TableCell>
                                        <TableCell>{tm.mode}</TableCell>
                                        <TableCell>{tm.department}</TableCell>
                                        <TableCell>₹{tm.billingAmount || 0}</TableCell>
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
                                                setFormData({ ...tm, reportingManager: rmId });
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
                                {taskMasters.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3, fontWeight: 600, color: 'text.secondary' }}>
                                            No Record Found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
            <Box mb={2}>
                <Typography variant="h5" fontWeight="700" color="primary.dark">
                    Task Master
                </Typography>
            </Box>

            <Paper
                elevation={1}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    p: 1,
                    mb: 2,
                    borderRadius: 1
                }}
            >
                <Box display="flex" gap={1}>
                    <Button
                        size="small"
                        onClick={() => { setView('form'); resetForm(); }}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                        }}
                    >
                        Add New
                    </Button>
                    <Button
                        size="small"
                        onClick={() => setView('list')}
                        sx={{
                            bgcolor: 'transparent',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                        }}
                    >
                        List
                    </Button>
                </Box>
            </Paper>            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={3}>
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
                            value={formData.mode}
                            onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                            required
                            size="small"
                        >
                            <MenuItem value="One Time">One Time</MenuItem>
                            <MenuItem value="Recurring">Recurring</MenuItem>
                            <MenuItem value="Adhoc">Adhoc</MenuItem>
                        </TextField>

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
                            label="Reporting Manager *"
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

                        <TextField
                            label="Description"
                            variant="outlined"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

                        <TextField
                            label="Auto Billing Amount (₹)"
                            type="number"
                            variant="outlined"
                            value={formData.billingAmount || ''}
                            onChange={(e) => setFormData({ ...formData, billingAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="Amount to be billed on completion"
                            size="small"
                        />

                        <Box display="flex" alignItems="center" px={1}>
                            <Typography variant="subtitle2" sx={{ width: 100, color: 'text.secondary' }}>Status</Typography>
                            <Chip
                                label={formData.status}
                                color={formData.status === 'Active' ? 'primary' : 'default'}
                                onClick={() => setFormData({ ...formData, status: formData.status === 'Active' ? 'Inactive' : 'Active' })}
                                sx={{ minWidth: 80, fontWeight: 700 }}
                            />
                        </Box>

                        <TextField
                            label="HSN/SAC"
                            variant="outlined"
                            value={formData.hsnSac}
                            onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
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

                <Accordion defaultExpanded elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <Typography fontWeight="600">Subtask List</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: '#fafafa', p: 3 }}>
                        <Box display="flex" gap={2} mb={3}>
                            <TextField
                                label="Subtask Name"
                                size="small"
                                value={subtaskInput.name}
                                onChange={(e) => setSubtaskInput({ ...subtaskInput, name: e.target.value })}
                                sx={{ flexGrow: 1 }}
                            />
                            <TextField
                                label="Description (Optional)"
                                size="small"
                                value={subtaskInput.description}
                                onChange={(e) => setSubtaskInput({ ...subtaskInput, description: e.target.value })}
                                sx={{ flexGrow: 2 }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleAddSubtask}
                                disabled={!subtaskInput.name}
                            >
                                Add
                            </Button>
                        </Box>

                        {formData.subtasks && formData.subtasks.length > 0 ? (
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.subtasks.map((st, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell>{st.name}</TableCell>
                                                <TableCell>{st.description}</TableCell>
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
                            <Typography variant="body2" color="text.secondary" textAlign="center">No subtasks added yet.</Typography>
                        )}
                    </AccordionDetails>
                </Accordion>
            </form>
        </Box>
    );
};

export default TaskMaster;
