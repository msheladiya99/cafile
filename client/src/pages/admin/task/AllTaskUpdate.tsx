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
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Update as UpdateIcon,
    Description as TaskDetailsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import type { TaskMasterData, Client, User, TaskStatus, Subtask } from '../../../types';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export const AllTaskUpdate: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [employee, setEmployee] = useState('');
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

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!employee || !client || !task) {
                throw new Error('Please fill all required fields (Employee, Client, Task)');
            }

            // Parse time input: accepts "90" (minutes) or "1:30" (hours:minutes)
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
                clientId: client,
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
            toast.error(error.response?.data?.message || error.message || 'Failed to save update');
        }
    });

    const selectedTaskMaster = useMemo(() => {
        return taskMasters.find((t: TaskMasterData) => t._id === task);
    }, [task, taskMasters]);

    const subtasks = useMemo(() => {
        return selectedTaskMaster?.subtasks || [];
    }, [selectedTaskMaster]);

    const places = ['Office', 'Client Place', 'Home', 'Outstation', 'Other'];

    return (
        <Box sx={{ p: 0 }}>
            <Paper elevation={0} sx={{
                p: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <UpdateIcon />
                <Typography variant="h6" fontWeight="500">All Task Update</Typography>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* Date + Employee */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Date <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField type="date" size="small" fullWidth value={date} onChange={(e) => setDate(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Employee <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={employee} onChange={(e) => setEmployee(e.target.value)}>
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>
                                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Client + Year */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Client <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={client} onChange={(e) => setClient(e.target.value)}>
                                <MenuItem value=""><em>Choose a Client...</em></MenuItem>
                                {clients.map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Year <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Task + Subtask */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 1}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Task <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Box display="flex" width="100%" gap={1}>
                                <Select size="small" fullWidth displayEmpty value={task} onChange={(e) => { setTask(e.target.value); setSubtask(''); }}>
                                    <MenuItem value=""><em>Select an Option</em></MenuItem>
                                    {taskMasters.map((t: TaskMasterData) => (
                                        <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                    ))}
                                </Select>
                                <IconButton size="small" sx={{ bgcolor: '#8bc34a', color: 'white', borderRadius: 1, '&:hover': { bgcolor: '#7cb342' } }}>
                                    <TaskDetailsIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Subtask</Typography>
                            <Select size="small" fullWidth displayEmpty value={subtask} onChange={(e) => setSubtask(e.target.value)}>
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                                {subtasks.map((s: Subtask) => (
                                    <MenuItem key={s._id || s.name} value={s._id || s.name}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Place + Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Place <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth value={place} onChange={(e) => setPlace(e.target.value)}>
                                {places.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                                <MenuItem value=""><em>— No Change —</em></MenuItem>
                                {taskStatuses.map(s => (
                                    <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Time Spent */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems={isMobile ? 'flex-start' : 'center'} gap={isMobile ? 0.5 : 1}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem' }}>Time Spent</Typography>
                            <TextField
                                size="small"
                                fullWidth
                                value={timeSpent}
                                onChange={(e) => setTimeSpent(e.target.value)}
                                placeholder="Minutes (e.g. 90) or H:MM (e.g. 1:30)"
                                helperText="Enter minutes or hours:minutes"
                            />
                        </Box>
                    </Grid>

                    {/* Description */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} alignItems="flex-start" gap={isMobile ? 0.5 : 0}>
                            <Typography sx={{ width: isMobile ? '100%' : 140, color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>Description</Typography>
                            <TextField
                                multiline rows={2} size="small" fullWidth
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write task update notes here..."
                            />
                        </Box>
                    </Grid>

                    {/* Buttons */}
                    <Grid size={{ xs: 12 }} display="flex" justifyContent="center" gap={2} sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => saveMutation.mutate()}
                            disabled={saveMutation.isPending}
                            sx={{ bgcolor: '#4fc3f7', px: 4, '&:hover': { bgcolor: '#29b6f6' }, textTransform: 'none' }}
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setEmployee(''); setClient(''); setTask('');
                                setSubtask(''); setStatus(''); setTimeSpent('');
                                setDescription(''); setPlace('Office');
                            }}
                            sx={{ bgcolor: '#ff5252', px: 4, '&:hover': { bgcolor: '#ff1744' }, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AllTaskUpdate;
