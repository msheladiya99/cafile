import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    MenuItem,
    Select,
    Grid,
    TextField,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Update as UpdateIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { TaskMasterData, Client, User, TaskStatus, Subtask, ClientGroup } from '../../../types';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export const AllTaskUpdate: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [employee, setEmployee] = useState('');
    const [groupName, setGroupName] = useState('');
    const [client, setClient] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [task, setTask] = useState('');
    const [subtask, setSubtask] = useState('');
    const [place, setPlace] = useState('Office');
    const [status, setStatus] = useState<TaskStatus | ''>('');
    const [timeSpent, setTimeSpent] = useState('');
    const [description, setDescription] = useState('');

    const taskStatuses: TaskStatus[] = [
        'PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED',
        'DONE', 'CANCELLED', 'ON_HOLD', 'PENDING_FROM_CLIENT',
        'PENDING_FROM_DEPARTMENT', 'REJECTED'
    ];

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: clientGroups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const filteredClients = useMemo(() => {
        if (!groupName) return clients;
        return clients.filter((c: Client) => {
            const g = c.groupName;
            const gId = typeof g === 'object' ? (g as { _id: string })?._id : g;
            return gId === groupName;
        });
    }, [clients, groupName]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!employee || !task) {
                throw new Error('Please fill all required fields (Employee, Task)');
            }

            let timeSpentMinutes = 0;
            if (timeSpent) {
                if (timeSpent.includes(':')) {
                    const [h, m] = timeSpent.split(':').map(Number);
                    timeSpentMinutes = (h || 0) * 60 + (m || 0);
                } else {
                    timeSpentMinutes = parseInt(timeSpent) || 0;
                }
            }

            const selectedSubtask = subtasks.find((s: Subtask) => s._id === subtask || s.name === subtask);

            const response = await api.post('/tasks/bulk-update', {
                employeeId: employee,
                clientId: client || undefined,
                taskMasterId: task,
                year,
                status: status || undefined,
                timeSpentMinutes,
                description,
                place,
                subtaskName: selectedSubtask?.name,
                date,
            });
            return response.data;
        },
        onSuccess: (data: { message: string }) => {
            toast.success(data.message || 'Task updated successfully');
            setDescription('');
            setTimeSpent('');
            setStatus('');
        },
        onError: (error: { response?: { data?: { message?: string } }; message?: string }) => {
            const msg = error.response?.data?.message || error.message || 'Failed to save update';
            toast.error(msg, { duration: 5000 });
        }
    });

    const selectedTaskMaster = taskMasters.find((t: TaskMasterData) => t._id === task);
    const subtasks = selectedTaskMaster?.subtasks || [];

    const places = ['Office', 'Client Place', 'Home', 'Outstation', 'Other'];

    return (
        <Box sx={{ p: 0 }}>
            <Paper elevation={0} sx={{
                p: 2.5,
                bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                color: '#1e293b',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}>
                <UpdateIcon sx={{ color: '#6366f1' }} />
                <Box>
                    <Typography variant="h6" fontWeight="600" sx={{ lineHeight: 1.2 }}>All Task Update</Typography>
                    <Typography variant="caption" color="text.secondary">Fast update status and record time entries for assigned tasks</Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
                <Grid container spacing={3}>
                    {/* Date + Employee */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Date <span style={{ color: '#ef4444' }}>*</span></Typography>
                            <TextField type="date" size="small" fullWidth value={date} onChange={(e) => setDate(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Employee <span style={{ color: '#ef4444' }}>*</span></Typography>
                            <Select size="small" fullWidth displayEmpty value={employee} onChange={(e) => setEmployee(e.target.value)}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">Choose Employee...</MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>
                                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.username} ({u.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Group + Client */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName}
                                onChange={(e) => { setGroupName(e.target.value); setClient(''); }}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Groups</MenuItem>
                                {[...clientGroups].sort((a, b) => (a.groupName || '').localeCompare(b.groupName || '')).map((g: ClientGroup) => (
                                    <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Client</Typography>
                            <Select size="small" fullWidth displayEmpty value={client} onChange={(e) => setClient(e.target.value)}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">Choose a Client...</MenuItem>
                                {[...filteredClients].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Task + Year */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Task <span style={{ color: '#ef4444' }}>*</span></Typography>
                            <Select size="small" fullWidth displayEmpty value={task} onChange={(e) => { setTask(e.target.value); setSubtask(''); }}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">Select an Option</MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Year <span style={{ color: '#ef4444' }}>*</span></Typography>
                            <Select size="small" fullWidth value={year} onChange={(e) => setYear(e.target.value)}
                                sx={{ borderRadius: '8px' }}>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Subtask + Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Subtask</Typography>
                            <Select size="small" fullWidth displayEmpty value={subtask} onChange={(e) => setSubtask(e.target.value)}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">Select an Option</MenuItem>
                                {subtasks.map((s: Subtask) => (
                                    <MenuItem key={s._id || s.name} value={s._id || s.name}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— No Change —</MenuItem>
                                {taskStatuses.map(s => (
                                    <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Place + Time Spent */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Place <span style={{ color: '#ef4444' }}>*</span></Typography>
                            <Select size="small" fullWidth value={place} onChange={(e) => setPlace(e.target.value)}
                                sx={{ borderRadius: '8px' }}>
                                {places.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500 }}>Time Spent</Typography>
                            <TextField
                                size="small" fullWidth value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)}
                                placeholder="e.g. 90 or 1:30"
                                helperText="Log time in minutes or H:MM"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Grid>

                    {/* Description */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems="flex-start">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontWeight: 500, mt: 1 }}>Description</Typography>
                            <TextField
                                multiline rows={2} size="small" fullWidth
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the work done..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            />
                        </Box>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{
                            mt: 4, pt: 3, borderTop: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'center', gap: 2
                        }}>
                            <Button
                                variant="contained"
                                onClick={() => saveMutation.mutate()}
                                disabled={saveMutation.isPending}
                                sx={{
                                    bgcolor: '#6366f1', px: 6, height: 42,
                                    borderRadius: '10px', fontWeight: 600,
                                    boxShadow: '0 4px 6px -1px rgb(99 102 241 / 0.4)',
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#4f46e5' }
                                }}
                            >
                                {saveMutation.isPending ? 'Syncing...' : 'Save Update'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEmployee(''); setClient(''); setTask('');
                                    setSubtask(''); setStatus(''); setTimeSpent('');
                                    setDescription(''); setPlace('Office'); setGroupName('');
                                }}
                                sx={{
                                    px: 4, height: 42, borderRadius: '10px',
                                    color: '#64748b', borderColor: '#cbd5e1',
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AllTaskUpdate;





