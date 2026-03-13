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
    TableRow,
    Checkbox,
    FormControlLabel,
    TextField,
} from '@mui/material';
import {
    List as ListIcon,
    SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import type { TaskMasterData, Client, User } from '../../../types';

export const TransferTask: React.FC = () => {
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [subTask, setSubTask] = useState('');
    const [frequencyType, setFrequencyType] = useState('Sel...');
    const [frequency, setFrequency] = useState('');
    const [description, setDescription] = useState('');
    const [removeFromCurrent, setRemoveFromCurrent] = useState(false);

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

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <TransferIcon />
                    <Typography variant="h6" fontWeight="500">Transfer Task</Typography>
                </Box>
                <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                    List
                </Button>
            </Paper>

            {/* Transfer Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* First Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Transfer From</Typography>
                            <Select size="small" fullWidth displayEmpty value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Transfer To</Typography>
                            <Select size="small" fullWidth displayEmpty value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                                <MenuItem value=""><em>None selected</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Second Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Client Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={clientName} onChange={(e) => setClientName(e.target.value)}>
                                <MenuItem value=""><em>Choose a Client...</em></MenuItem>
                                {clients.map((c: Client) => (
                                    <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}>
                                <MenuItem value=""><em>Choose a Task...</em></MenuItem>
                                {taskMasters.map((t: TaskMasterData) => (
                                    <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Third Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Sub Task</Typography>
                            <Select size="small" fullWidth displayEmpty value={subTask} onChange={(e) => setSubTask(e.target.value)}>
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                                {/* Subtasks would be populated based on selected task */}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                            <Select size="small" sx={{ width: 100 }} value={frequencyType} onChange={(e) => setFrequencyType(e.target.value)}>
                                <MenuItem value="Sel...">Sel...</MenuItem>
                                <MenuItem value="Type">Type</MenuItem>
                            </Select>
                            <Select size="small" fullWidth displayEmpty value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value=""><em>Select an Option</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Fourth Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>Description</Typography>
                            <TextField 
                                multiline 
                                rows={2} 
                                size="small" 
                                fullWidth 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" height="100%">
                            <Box sx={{ width: 140 }} />
                            <FormControlLabel 
                                control={
                                    <Checkbox 
                                        size="small"
                                        checked={removeFromCurrent}
                                        onChange={(e) => setRemoveFromCurrent(e.target.checked)}
                                        sx={{ color: '#20a090', '&.Mui-checked': { color: '#20a090' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Remove From Current Employee</Typography>}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Job List Section */}
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ 
                    p: 1.5, 
                    background: '#20a090', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <ListIcon fontSize="small" />
                    <Typography fontWeight="500">Job List</Typography>
                </Box>
                <TableContainer sx={{ minHeight: 150, bgcolor: '#f8f9fa' }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell align="center" colSpan={10} sx={{ color: 'text.secondary', py: 6 }}>
                                    No Record Found
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TransferTask;
