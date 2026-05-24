import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    MenuItem,
    Select,
    Grid,
    FormControlLabel,
    Radio,
    RadioGroup,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    List as ListIcon,
    KeyboardArrowUp as UpIcon,
    Info as InfoIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Groups as GroupsIcon,
} from '@mui/icons-material';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { staffService } from '../../../services/staffService';
import { clientGroupService } from '../../../services/clientGroupService';
import { taskService } from '../../../services/taskService';
import { taskApplicabilityService } from '../../../services/taskApplicabilityService';
import type { TaskMasterData, Client, TaskApplicability as TaskApplicabilityType, User } from '../../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { CommonButton } from '../../../components/common/UIComponents';


export const TaskApplicability: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isSingleTask = searchParams.get('single') === 'true';
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // ─── Recurrence Task State ───
    const [basedOn, setBasedOn] = useState<'Task' | 'Client'>('Task');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTask, setSelectedTask] = useState('');
    const [groupName, setGroupName] = useState('');
    const [singleSaving, setSingleSaving] = useState(false);
    const [itStatus, setITStatus] = useState('');
    const [subMaster, setSubMaster] = useState('');
    const [department, setDepartment] = useState('');
    const [infiniteApplicability, setInfiniteApplicability] = useState(true);

    // ─── Single Task State ───
    const [singleGroupName, setSingleGroupName] = useState('');
    const [singleClientName, setSingleClientName] = useState('');
    const [singleTask, setSingleTask] = useState('');
    const [singleFrequency, setSingleFrequency] = useState('');
    const [singleYear, setSingleYear] = useState(new Date().getFullYear().toString());
    const [singleDepartment, setSingleDepartment] = useState('');
    const [singleTargetDate, setSingleTargetDate] = useState(new Date().toISOString().split('T')[0]);

    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // ─── Data Fetches ───
    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: clientGroups = [] } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: itStatuses = [] } = useQuery<{ _id: string; name: string }[]>({
        queryKey: ['itStatus'],
        queryFn: adminService.getITStatus
    });

    const { data: subMasters = [] } = useQuery<{ _id: string; name: string }[]>({
        queryKey: ['subMasters'],
        queryFn: adminService.getSubMasters
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: staffList = [] } = useQuery<User[]>({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    // Query key changes depending on what's selected (task or client)
    const appliedQueryKey = useMemo(() => {
        if (isSingleTask) return ['taskApplicability', 'single', singleClientName];
        if (basedOn === 'Task') return ['taskApplicability', 'task', selectedTask];
        return ['taskApplicability', 'client', singleClientName];
    }, [isSingleTask, basedOn, selectedTask, singleClientName]);

    const { data: appliedTasks = [], refetch: refetchApplied } = useQuery({
        queryKey: appliedQueryKey,
        queryFn: () => {
            if (isSingleTask) return taskApplicabilityService.getApplicabilities({ clientId: singleClientName });
            if (basedOn === 'Task') return taskApplicabilityService.getApplicabilities({ taskMasterId: selectedTask });
            return taskApplicabilityService.getApplicabilities({ clientId: singleClientName });
        },
        enabled: isSingleTask ? !!singleClientName : (basedOn === 'Task' ? !!selectedTask : !!singleClientName)
    });

    // ─── Apply Mutation (Recurrence) ───
    const applyMutation = useMutation({
        mutationFn: taskApplicabilityService.applyTask,
        onSuccess: (data: { message: string; count: number; errors?: { id: string; error: string }[] }) => {
            toast.success(`✅ ${data.message}`);
            if (data.errors?.length) {
                const failedMessages = data.errors!.map(e => e.error).join('; ');
                toast.error(`⚠️ ${data.errors!.length} failed: ${failedMessages}`, { duration: 6000 });
            }
            setSelectedClientIds([]);
            setSelectedTaskIds([]);
            // Force both invalidation AND explicit refetch to ensure right panel updates
            queryClient.invalidateQueries({ queryKey: ['taskApplicability'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setTimeout(() => refetchApplied(), 500); // belt-and-suspenders refetch
        },
        onError: (err: AxiosError<{ message: string }>) => {
            toast.error(err.response?.data?.message || 'Failed to apply task');
        }
    });

    // ─── Remove Applicability Mutation ───
    const removeMutation = useMutation({
        mutationFn: (id: string) => taskApplicabilityService.removeApplicability(id),
        onSuccess: () => {
            toast.success('Task applicability removed');
            refetchApplied();
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (err: AxiosError<{ message: string }>) => {
            toast.error(err.response?.data?.message || 'Failed to remove');
        }
    });

    // ─── handleApply (Recurrence — individual clients or tasks) ───
    const handleApply = () => {
        if (basedOn === 'Task') {
            if (!selectedTask) return toast.error('Please select a task');
            if (selectedClientIds.length === 0) return toast.error('Please select at least one client');
            applyMutation.mutate({
                taskMasterId: selectedTask,
                clientIds: selectedClientIds,
                startDate,
                infinite: infiniteApplicability,
                department: department,
                assignedTo,
                itStatus,
                subMaster
            });
        } else {
            // Based On Client
            if (!singleClientName) return toast.error('Please select a client');
            if (selectedTaskIds.length === 0) return toast.error('Please select at least one task');
            // Apply each chosen task with the department
            const applyNext = (idx: number) => {
                if (idx >= selectedTaskIds.length) return;
                applyMutation.mutate({
                    taskMasterId: selectedTaskIds[idx],
                    clientIds: [singleClientName],
                    startDate,
                    infinite: infiniteApplicability,
                    department: department,
                    assignedTo
                }, {
                    onSettled: () => applyNext(idx + 1)
                });
            };
            applyNext(0);
        }
    };

    // ─── handleApplyGroup — apply to entire selected group in one shot ───
    const handleApplyGroup = () => {
        if (!selectedTask) return toast.error('Please select a task first');
        if (!groupName) return toast.error('Please select a group first');
        applyMutation.mutate({
            taskMasterId: selectedTask,
            groupIds: [groupName],
            startDate,
            infinite: infiniteApplicability,
            department: department,
            assignedTo: assignedTo,
        });
    };

    // ─── handleSingleSave (Start Single Task) ───
    const handleSingleSave = async () => {
        if (!singleClientName || !singleTask || !singleYear || !singleTargetDate) {
            toast.error('Please fill all required fields (*)');
            return;
        }

        const master = taskMasters.find((t: TaskMasterData) => t._id === singleTask);
        if (!master) return;

        setSingleSaving(true);
        try {
            const taskData = {
                title: master.taskName,
                description: master.description || '',
                // category must be a valid TaskCategory enum — department names are NOT valid values
                category: 'CLIENT_WORK' as import('../../../types').TaskCategory,
                reportingManager: master.reportingManager
                    ? (typeof master.reportingManager === 'string'
                        ? master.reportingManager
                        : (master.reportingManager as { _id: string })._id)
                    : undefined,
                assignedTo,
                clientId: singleClientName,
                priority: 'MEDIUM' as const,
                targetDate: singleTargetDate,
                estimatedHours: master.estimatedHours || 1,
                frequency: singleFrequency || master.frequency || 'One Time',
                taskMasterId: master._id,
                year: singleYear,
                department: effectiveDepartment,
                billingAmount: master.billingAmount || 0,
                checklist: (master.subtasks || []).map(s => s.name)
            };

            await taskService.createTask(taskData);
            toast.success('Single task started successfully');
            navigate('/admin/tasks/ongoing');
        } catch (error: unknown) {
            const axiosErr = error as import('axios').AxiosError<{ message: string }>;
            toast.error(axiosErr.response?.data?.message || 'Failed to start task');
        } finally {
            setSingleSaving(false);
        }
    };

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departments = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance'];

    // ─── Filtered Clients (Recurrence - Based On Task) ───
    const filteredClients = useMemo(() => {
        return clients.filter((client: Client) => {
            if (groupName) {
                const g = client.groupName;
                const gId = typeof g === 'object' ? (g as { _id: string })?._id : g;
                if (gId !== groupName) return false;
            }
            if (itStatus) {
                const it = client.itStatus;
                const iId = typeof it === 'object' ? (it as { _id: string })?._id : it;
                if (iId !== itStatus) return false;
            }
            if (subMaster) {
                const sm = client.subMaster;
                const sId = typeof sm === 'object' ? (sm as { _id: string })?._id : sm;
                if (sId !== subMaster) return false;
            }
            // Hide already applied — check both client-level and group-level records
            const isAlreadyApplied = appliedTasks.some((at: TaskApplicabilityType) => {
                const cid = at.clientId;
                const clientMatch = (typeof cid === 'string' ? cid : (cid as Client)?._id) === client._id;
                // Also hide if this client is in an already-applied group
                const gid = at.clientGroupId;
                const clientGroupId = typeof client.groupName === 'object'
                    ? (client.groupName as { _id: string })?._id
                    : client.groupName;
                const groupMatch = !!gid && (typeof gid === 'string' ? gid : (gid as { _id: string })?._id) === clientGroupId;
                return clientMatch || groupMatch;
            });
            return !isAlreadyApplied;
        });
    }, [clients, groupName, itStatus, subMaster, appliedTasks]);

    // ─── Filtered Tasks (Recurrence - Based On Client) ───
    const filteredTasks = useMemo(() => {
        return taskMasters.filter((master: TaskMasterData) => {
            const isAlreadyApplied = appliedTasks.some((at: TaskApplicabilityType) => {
                const tid = at.taskMasterId;
                return (typeof tid === 'string' ? tid : (tid as TaskMasterData)?._id) === master._id;
            });
            return !isAlreadyApplied;
        });
    }, [taskMasters, appliedTasks]);

    // ─── Filtered Clients for Single Task (by singleGroupName) ───
    const singleFilteredClients = useMemo(() => {
        if (!singleGroupName) return clients;
        return clients.filter((client: Client) => {
            const g = client.groupName;
            const gId = typeof g === 'object' ? (g as { _id: string })?._id : g;
            return gId === singleGroupName;
        });
    }, [clients, singleGroupName]);

    // ─── Get selected task master details for auto-fill ───
    const selectedTaskMaster = useMemo(() =>
        taskMasters.find((t: TaskMasterData) => t._id === singleTask),
        [taskMasters, singleTask]
    );

    // Auto-fill frequency and department from selected task master
    const effectiveFrequency = singleFrequency || selectedTaskMaster?.frequency || '';
    const effectiveDepartment = singleDepartment || selectedTaskMaster?.department || '';

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{
                p: { xs: 2.5, sm: 2 },
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                gap: { xs: 2, md: 0 }
            }}>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {isSingleTask ? 'Start Single Task & Applicability' : 'Task Applicability Setup'}
                </Typography>
                {!isSingleTask && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                        <CommonButton
                            size="small"
                            onClick={() => navigate('/admin/tasks/free-client-list')}
                            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
                        >
                            Vacant Client
                        </CommonButton>
                        <CommonButton
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/admin/task-master/add')}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                        >
                            Add New
                        </CommonButton>
                        <CommonButton
                            size="small"
                            startIcon={<ListIcon />}
                            onClick={() => navigate('/admin/task-master/list')}
                        >
                            List
                        </CommonButton>
                    </Box>
                )}
                {isSingleTask && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate('/admin/tasks/ongoing')}
                        sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}
                    >
                        View Ongoing Tasks
                    </Button>
                )}
            </Paper>

            {/* Selection Form */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: '0 0 8px 8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                {isSingleTask ? (
                    /* ══════════════════════════════════════════
                       START SINGLE TASK FORM
                    ══════════════════════════════════════════ */
                    <Grid container spacing={3}>
                        {/* Group Name */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Group Name</Typography>
                                <Select size="small" fullWidth displayEmpty value={singleGroupName}
                                    onChange={(e) => { setSingleGroupName(e.target.value); setSingleClientName(''); }}>
                                    <MenuItem value=""><span>Choose a Group...</span></MenuItem>
                                    {clientGroups.map((g: { _id: string; groupName: string }) => (
                                        <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Client Name - filtered by group */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                    Client Name <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <Select size="small" fullWidth displayEmpty value={singleClientName}
                                    onChange={(e) => setSingleClientName(e.target.value)}>
                                    <MenuItem value=""><span>Choose a Client...</span></MenuItem>
                                    {singleFilteredClients.map((c: Client) => (  // ✅ Fixed: filtered by group
                                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Task */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                    Task <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <Select size="small" fullWidth displayEmpty value={singleTask}
                                    onChange={(e) => { setSingleTask(e.target.value); setSingleFrequency(''); setSingleDepartment(''); }}>
                                    <MenuItem value=""><span>Choose a Task...</span></MenuItem>
                                    {taskMasters.map((t: TaskMasterData) => (
                                        <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Frequency - auto-filled from task master */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                                <Select size="small" fullWidth displayEmpty
                                    value={effectiveFrequency}
                                    onChange={(e) => setSingleFrequency(e.target.value)}>
                                    <MenuItem value=""><span>Choose a Frequency...</span></MenuItem>
                                    {frequencies.map(f => (
                                        <MenuItem key={f} value={f}>{f}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            {selectedTaskMaster?.frequency && !singleFrequency && (
                                <Typography variant="caption" color="primary" sx={{ ml: 18, mt: 0.3, display: 'block' }}>
                                    Auto-filled from task: {selectedTaskMaster.frequency}
                                </Typography>
                            )}
                        </Grid>

                        {/* Year */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                    Year <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <Select size="small" fullWidth displayEmpty value={singleYear}
                                    onChange={(e) => setSingleYear(e.target.value)}>
                                    <MenuItem value=""><span>Choose Year...</span></MenuItem>
                                    {years.map(y => (
                                        <MenuItem key={y} value={y}>{y}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Department - auto-filled from task master */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Department</Typography>
                                <Select size="small" fullWidth displayEmpty
                                    value={effectiveDepartment}
                                    onChange={(e) => setSingleDepartment(e.target.value)}>
                                    <MenuItem value=""><span>Choose a Department...</span></MenuItem>
                                    {departments.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Target Date */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                    Target Date <span style={{ color: 'red' }}>*</span>
                                </Typography>
                                <TextField type="date" size="small" fullWidth
                                    value={singleTargetDate}
                                    onChange={(e) => setSingleTargetDate(e.target.value)} />
                            </Box>
                        </Grid>

                        {/* Assigned To — single task */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Assigned To</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    multiple
                                    displayEmpty
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                    renderValue={(selected) => {
                                        if ((selected as string[]).length === 0) return <span style={{ color: '#888' }}>Choose employee(s)...</span>;
                                        return (selected as string[]).map(id => {
                                            const emp = staffList.find((s: User) => s._id === id);
                                            return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username : id;
                                        }).join(', ');
                                    }}
                                >
                                    <MenuItem value="" disabled><span>Choose employee(s)...</span></MenuItem>
                                    {staffList.map((emp: User) => (
                                        <MenuItem key={emp._id} value={emp._id}>
                                            <Checkbox size="small" checked={assignedTo.includes(emp._id)} />
                                            {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {selectedTaskMaster && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ bgcolor: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: '12px', p: 2, ml: 18 }}>
                                    <Typography variant="body2" fontWeight={600} color="primary" mb={0.5}>Task Details</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Description:</strong> {selectedTaskMaster.description || '—'} &nbsp;|&nbsp;
                                        <strong>Mode:</strong> {selectedTaskMaster.mode} &nbsp;|&nbsp;
                                        <strong>Billing:</strong> ₹{selectedTaskMaster.billingAmount || 0} &nbsp;|&nbsp;
                                        <strong>Subtasks:</strong> {selectedTaskMaster.subtasks?.length || 0}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {/* Save / Cancel buttons */}
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                                <CommonButton size="small" onClick={handleSingleSave} loading={singleSaving} sx={{ px: 3 }}>
                                    Save & Start Task
                                </CommonButton>
                                <CommonButton variant="outlined" size="small" onClick={() => navigate('/admin/tasks/ongoing')}
                                    sx={{ bgcolor: 'transparent', color: '#ff5252', borderColor: '#ff5252', px: 3, '&:hover': { bgcolor: '#ffebee', borderColor: '#d32f2f', color: '#d32f2f' } }}>
                                    Cancel
                                </CommonButton>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    /* ══════════════════════════════════════════
                       SET RECURRENCE TASK FORM
                    ══════════════════════════════════════════ */
                    <Grid container spacing={3} alignItems={isMobile ? 'flex-start' : "center"}>
                        {/* Based On + Start Date (always visible) */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 1 : 0}>
                                <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary' }}>Based On <span style={{ color: 'red' }}>*</span></Typography>
                                <RadioGroup row value={basedOn} onChange={(e) => {
                                    setBasedOn(e.target.value as 'Task' | 'Client');
                                    setSelectedTask(''); setSingleClientName(''); setSelectedClientIds([]); setSelectedTaskIds([]);
                                }}>
                                    <FormControlLabel value="Task" control={<Radio size="small" sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }} />} label="Task" />
                                    <FormControlLabel value="Client" control={<Radio size="small" sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }} />} label="Client" />
                                </RadioGroup>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Start Date <span style={{ color: 'red' }}>*</span></Typography>
                                <TextField type="date" size="small" fullWidth value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)} />
                            </Box>
                        </Grid>

                        {/* ── Based On = Task ── */}
                        {basedOn === 'Task' && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Task <span style={{ color: 'red' }}>*</span></Typography>
                                        <Select size="small" fullWidth displayEmpty value={selectedTask}
                                            onChange={(e) => { setSelectedTask(e.target.value); setSelectedClientIds([]); }}>
                                            <MenuItem value=""><span>Choose a Task...</span></MenuItem>
                                            {taskMasters.map((t: TaskMasterData) => (
                                                <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Group Name</Typography>
                                        <Select size="small" fullWidth displayEmpty value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}>
                                            <MenuItem value=""><span>All Groups</span></MenuItem>
                                            {clientGroups.map((g: { _id: string; groupName: string }) => (
                                                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>IT Status</Typography>
                                        <Select size="small" fullWidth displayEmpty value={itStatus}
                                            onChange={(e) => setITStatus(e.target.value)}>
                                            <MenuItem value=""><span>All IT Statuses</span></MenuItem>
                                            {itStatuses.map((s: { _id: string; name: string }) => (
                                                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Constitution</Typography>
                                        <Select size="small" fullWidth displayEmpty value={subMaster}
                                            onChange={(e) => setSubMaster(e.target.value)}>
                                            <MenuItem value=""><span>All Constitutions</span></MenuItem>
                                            {subMasters.map((s: { _id: string; name: string }) => (
                                                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                {/* ✅ Fixed: Department also shown in Task mode */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Department</Typography>
                                        <Select size="small" fullWidth displayEmpty value={department}
                                            onChange={(e) => setDepartment(e.target.value)}>
                                            <MenuItem value=""><span>Choose a Department...</span></MenuItem>
                                            {departments.map(d => (
                                                <MenuItem key={d} value={d}>{d}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                            </>
                        )}

                        {/* ── Based On = Client ── */}
                        {basedOn === 'Client' && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Client <span style={{ color: 'red' }}>*</span></Typography>
                                        <Select size="small" fullWidth displayEmpty value={singleClientName}
                                            onChange={(e) => { setSingleClientName(e.target.value); setSelectedTaskIds([]); }}>
                                            <MenuItem value=""><span>Choose a Client...</span></MenuItem>
                                            {clients.map((c: Client) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Department</Typography>
                                        <Select size="small" fullWidth displayEmpty value={department}
                                            onChange={(e) => setDepartment(e.target.value)}>
                                            <MenuItem value=""><span>Choose a Department...</span></MenuItem>
                                            {departments.map(d => (
                                                <MenuItem key={d} value={d}>{d}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                            </>
                        )}

                        {/* Assigned To — recurrence form */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Assigned To</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    multiple
                                    displayEmpty
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                    renderValue={(selected) => {
                                        if ((selected as string[]).length === 0) return <span style={{ color: '#888' }}>Choose employee(s)...</span>;
                                        return (selected as string[]).map(id => {
                                            const emp = staffList.find((s: User) => s._id === id);
                                            return emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username : id;
                                        }).join(', ');
                                    }}
                                >
                                    <MenuItem value="" disabled><span>Choose employee(s)...</span></MenuItem>
                                    {staffList.map((emp: User) => (
                                        <MenuItem key={emp._id} value={emp._id}>
                                            <Checkbox size="small" checked={assignedTo.includes(emp._id)} />
                                            {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        {/* Infinite Applicability checkbox */}
                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" alignItems="center">
                                <Box sx={{ width: 140 }} />
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={infiniteApplicability}
                                            onChange={(e) => setInfiniteApplicability(e.target.checked)}
                                            size="small"
                                            sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }} />
                                    }
                                    label={
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography variant="body2" fontWeight="500" sx={{ color: '#764ba2' }}>Infinite Applicability</Typography>
                                            <Tooltip title="Task will auto-renew each cycle (e.g., monthly, yearly) forever until manually stopped.">
                                                <InfoIcon sx={{ fontSize: 16, color: '#667eea' }} />
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {/* ══════════════════════════════════════════
                RECURRENCE TASK — TWO PANEL TABLE
            ══════════════════════════════════════════ */}
            {!isSingleTask && (
                <Grid container spacing={3}>
                    {/* LEFT: New (eligible) items */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={1} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                            <Box sx={{
                                p: 1.5,
                                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <ListIcon fontSize="small" />
                                <Typography fontWeight="500">
                                    {basedOn === 'Task' ? `New Clients (${filteredClients.length})` : `New Tasks (${filteredTasks.length})`}
                                </Typography>
                            </Box>
                            <TableContainer sx={{ minHeight: 300, bgcolor: '#f8f9fa' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox size="small"
                                                    indeterminate={
                                                        basedOn === 'Task'
                                                            ? selectedClientIds.length > 0 && selectedClientIds.length < filteredClients.length
                                                            : selectedTaskIds.length > 0 && selectedTaskIds.length < filteredTasks.length
                                                    }
                                                    checked={
                                                        basedOn === 'Task'
                                                            ? filteredClients.length > 0 && selectedClientIds.length === filteredClients.length
                                                            : filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            if (basedOn === 'Task') setSelectedClientIds(filteredClients.map(c => c._id));
                                                            else setSelectedTaskIds(filteredTasks.map(t => t._id!));
                                                        } else {
                                                            setSelectedClientIds([]);
                                                            setSelectedTaskIds([]);
                                                        }
                                                    }} />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{basedOn === 'Task' ? 'Client Name' : 'Task Name'}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>{basedOn === 'Task' ? 'Group' : 'Frequency'}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {basedOn === 'Task' ? (
                                            filteredClients.length > 0 ? filteredClients.map((client: Client) => (
                                                <TableRow key={client._id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox size="small"
                                                            checked={selectedClientIds.includes(client._id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedClientIds([...selectedClientIds, client._id]);
                                                                else setSelectedClientIds(selectedClientIds.filter(id => id !== client._id));
                                                            }} />
                                                    </TableCell>
                                                    <TableCell>{client.name}</TableCell>
                                                    <TableCell>
                                                        {typeof client.groupName === 'object'
                                                            ? (client.groupName as { _id: string; groupName: string })?.groupName
                                                            : client.groupName || '—'}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                        {selectedTask ? 'All clients already have this task applied' : 'Select a task to see eligible clients'}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        ) : (
                                            filteredTasks.length > 0 ? filteredTasks.map((master: TaskMasterData) => (
                                                <TableRow key={master._id} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox size="small"
                                                            checked={selectedTaskIds.includes(master._id!)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedTaskIds([...selectedTaskIds, master._id!]);
                                                                else setSelectedTaskIds(selectedTaskIds.filter(id => id !== master._id));
                                                            }} />
                                                    </TableCell>
                                                    <TableCell>{master.taskName}</TableCell>
                                                    <TableCell>
                                                        <Chip label={master.frequency || 'One Time'} size="small" variant="outlined" color="primary" />
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                        {singleClientName ? 'All tasks already applied for this client' : 'Select a client to see eligible tasks'}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                {/* Apply to entire group (when group is selected in Task mode) */}
                                {basedOn === 'Task' && groupName && (
                                    <CommonButton
                                        variant="outlined"
                                        onClick={handleApplyGroup}
                                        startIcon={<GroupsIcon />}
                                        loading={applyMutation.isPending}
                                        disabled={!selectedTask}
                                        sx={{
                                            bgcolor: 'transparent',
                                            borderColor: '#764ba2', color: '#764ba2',
                                            '&:hover': { bgcolor: '#764ba215', borderColor: '#764ba2' }
                                        }}
                                    >
                                        Apply to Entire Group
                                    </CommonButton>
                                )}
                                {/* Apply to individually selected clients/tasks */}
                                <CommonButton onClick={handleApply} startIcon={<CheckCircleIcon />}
                                    loading={applyMutation.isPending}
                                    disabled={(basedOn === 'Task' ? selectedClientIds.length === 0 : selectedTaskIds.length === 0)}
                                    sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' } }}>
                                    Apply to Selected ({basedOn === 'Task' ? selectedClientIds.length : selectedTaskIds.length})
                                </CommonButton>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT: Already applied */}
                    <Grid size={{ xs: 12, md: 6 }}>
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
                                    <Typography fontWeight="500">Applied ({appliedTasks.length})</Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: 'white' }}>
                                    <UpIcon />
                                </IconButton>
                            </Box>
                            <TableContainer sx={{ minHeight: 400, bgcolor: '#f8f9fa' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>{basedOn === 'Task' ? 'Client Name' : 'Task Name'}</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {appliedTasks.map((at: TaskApplicabilityType) => {
                                            const isGroupRecord = !at.clientId && !!at.clientGroupId;
                                            const grp = at.clientGroupId as { _id: string; groupName: string } | undefined;
                                            const clientName = (at.clientId as Client)?.name;
                                            const displayName = basedOn === 'Task'
                                                ? (clientName || grp?.groupName || 'Unknown')
                                                : ((at.taskMasterId as TaskMasterData)?.taskName || 'Unknown');
                                            return (
                                                <TableRow key={at._id} hover sx={isGroupRecord ? { bgcolor: '#f5f0ff' } : {}}>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {displayName}
                                                            {isGroupRecord && (
                                                                <Chip
                                                                    label="Group"
                                                                    size="small"
                                                                    icon={<GroupsIcon style={{ fontSize: 12 }} />}
                                                                    sx={{ fontSize: '0.65rem', height: 18, bgcolor: '#764ba2', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={at.frequency} size="small" color="success" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>{new Date(at.startDate).toLocaleDateString('en-IN')}</TableCell>
                                                    <TableCell>
                                                        <Tooltip title="Remove applicability">
                                                            <IconButton size="small" color="error"
                                                                onClick={() => {
                                                                    if (at._id && window.confirm('Remove this task applicability?')) {
                                                                        removeMutation.mutate(at._id);
                                                                    }
                                                                }}>
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {appliedTasks.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                    No applied tasks found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default TaskApplicability;





