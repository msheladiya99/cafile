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
} from '@mui/material';
import {
    Update as UpdateIcon,
    Description as TaskDetailsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import type { TaskMasterData, Client, User } from '../../../types';

export const AllTaskUpdate: React.FC = () => {
    const [date, setDate] = useState('14-Mar-2026');
    const [employee, setEmployee] = useState('');
    const [client, setClient] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [task, setTask] = useState('');
    const [subtask, setSubtask] = useState('');
    const [place, setPlace] = useState('Office');
    const [status, setStatus] = useState('');
    const [timeSpentType, setTimeSpentType] = useState('Direct Time');
    const [timeSpent, setTimeSpent] = useState('');
    const [description, setDescription] = useState('');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // Fetch data for dropdowns
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

    const places = ['Office', 'Client Place', 'Home', 'Outstation', 'Other'];

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
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

            {/* Form Section */}
            <Paper sx={{ p: 4, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Date <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField 
                                size="small" 
                                fullWidth 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Employee <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={employee} onChange={(e) => setEmployee(e.target.value)}>
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
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
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Year <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Row 3 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Task <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={task} onChange={(e) => setTask(e.target.value)}>
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                            <IconButton size="small" sx={{ bgcolor: '#8bc34a', color: 'white', borderRadius: 1, '&:hover': { bgcolor: '#7cb342' } }}>
                                <TaskDetailsIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Subtask <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth displayEmpty value={subtask} onChange={(e) => setSubtask(e.target.value)}>
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                            </Select>
                        </Box>
                    </Grid>

                    {/* Row 4 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Place <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" fullWidth value={place} onChange={(e) => setPlace(e.target.value)}>
                                {places.map(p => (
                                    <MenuItem key={p} value={p}>{p}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                            <Select size="small" fullWidth displayEmpty value={status} onChange={(e) => setStatus(e.target.value)}>
                                <MenuItem value=""><em>Select Status</em></MenuItem>
                            </Select>
                        </Box>
                    </Grid>

                    {/* Row 5 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Time Spent <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select size="small" sx={{ width: 140 }} value={timeSpentType} onChange={(e) => setTimeSpentType(e.target.value)}>
                                <MenuItem value="Direct Time">Direct Time</MenuItem>
                            </Select>
                            <TextField 
                                size="small" 
                                fullWidth 
                                value={timeSpent} 
                                onChange={(e) => setTimeSpent(e.target.value)}
                            />
                        </Box>
                    </Grid>

                    {/* Row 6 */}
                    <Grid size={{ xs: 12 }}>
                        <Box display="flex">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>Description</Typography>
                            <TextField 
                                multiline 
                                rows={2} 
                                size="small" 
                                fullWidth 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write task description here..."
                            />
                        </Box>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid size={{ xs: 12 }} display="flex" justifyContent="center" gap={2} sx={{ mt: 2 }}>
                        <Button 
                            variant="contained" 
                            sx={{ 
                                bgcolor: '#4fc3f7', 
                                px: 4, 
                                py: 0.8,
                                '&:hover': { bgcolor: '#29b6f6' },
                                textTransform: 'none'
                            }}
                        >
                            Save
                        </Button>
                        <Button 
                            variant="contained" 
                            sx={{ 
                                bgcolor: '#ff5252', 
                                px: 4, 
                                py: 0.8,
                                '&:hover': { bgcolor: '#ff1744' },
                                textTransform: 'none'
                            }}
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
