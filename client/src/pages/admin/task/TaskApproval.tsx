import React, { useState, useMemo } from 'react';
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
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Add as AddIcon,
    List as ListIcon,
    ExpandMore as ExpandMoreIcon,
    GetApp as ExcelIcon,
    CheckCircle as ApplyIcon,
    FactCheck as TaskIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { TaskMasterData, Client } from '../../../types';

export const TaskApproval: React.FC = () => {
    const [groupName, setGroupName] = useState('');
    const [subMaster, setSubMaster] = useState('');
    const [clientName, setClientName] = useState('');
    const [department, setDepartment] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [frequencyType, setFrequencyType] = useState('Sel...');
    const [frequency, setFrequency] = useState('');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [onClient, setOnClient] = useState('');
    const [createFrom, setCreateFrom] = useState('');

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());
    }, []);

    // Fetch data for dropdowns
    const { data: taskMasters = [] } = useQuery({
        queryKey: ['taskMasters'],
        queryFn: taskMasterService.getTaskMasters
    });

    const { data: clientGroups = [] } = useQuery({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: subMasters = [] } = useQuery<{ _id: string; name: string }[]>({
        queryKey: ['subMasters'],
        queryFn: adminService.getSubMasters
    });

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departments = ['Accounting', 'Audit', 'Taxation', 'Corporate', 'Consultancy', 'Other'];

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
                    <TaskIcon />
                    <Typography variant="h6" fontWeight="500">Task Approval</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        Add New
                    </Button>
                    <Button variant="contained" size="small" startIcon={<ListIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        List
                    </Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        Multi..
                    </Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                        Infinite Task Approval
                    </Button>
                </Box>
            </Paper>

            {/* Selection Form */}
            <Paper sx={{ p: 3, mb: 1, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={3}>
                    {/* First Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Group Name</Typography>
                            <Select size="small" fullWidth displayEmpty value={groupName} onChange={(e) => setGroupName(e.target.value)}>
                                <MenuItem value=""><em>Choose a Group...</em></MenuItem>
                                {clientGroups.map((g: { _id: string; groupName: string }) => (
                                    <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Sub Master</Typography>
                            <Select size="small" fullWidth displayEmpty value={subMaster} onChange={(e) => setSubMaster(e.target.value)}>
                                <MenuItem value=""><em>Choose a Sub Master...</em></MenuItem>
                                {subMasters.map((s: { _id: string; name: string }) => (
                                    <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
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
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Department</Typography>
                            <Select size="small" fullWidth displayEmpty value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <MenuItem value=""><em>Choose a Department...</em></MenuItem>
                                {departments.map((d) => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Third Row */}
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
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                            <Select size="small" sx={{ width: 100 }} value={frequencyType} onChange={(e) => setFrequencyType(e.target.value)}>
                                <MenuItem value="Sel...">Sel...</MenuItem>
                                <MenuItem value="Type">Type</MenuItem>
                            </Select>
                            <Select size="small" fullWidth displayEmpty value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                                <MenuItem value=""><em>Choose a Frequency...</em></MenuItem>
                                {frequencies.map(f => (
                                    <MenuItem key={f} value={f}>{f}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    {/* Fourth Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year</Typography>
                            <Select size="small" fullWidth displayEmpty value={year} onChange={(e) => setYear(e.target.value)}>
                                <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                {years.map(y => (
                                    <MenuItem key={y} value={y}>{y}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>On Client</Typography>
                            <Select size="small" fullWidth displayEmpty value={onClient} onChange={(e) => setOnClient(e.target.value)}>
                                <MenuItem value=""><em>Choose</em></MenuItem>
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </Select>
                        </Box>
                    </Grid>

                    {/* Fifth Row */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Create From</Typography>
                            <Select size="small" fullWidth displayEmpty value={createFrom} onChange={(e) => setCreateFrom(e.target.value)}>
                                <MenuItem value=""><em>Choose</em></MenuItem>
                                <MenuItem value="Recurrence">Recurrence</MenuItem>
                                <MenuItem value="Manual">Manual</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Accordion for appearing fields */}
            <Accordion sx={{ mb: 1, boxShadow: 1, borderRadius: '4px !important', bgcolor: '#e0e0e0' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <TaskIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography fontWeight="500">Fill All Appearing Fields</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'white' }}>
                    <Typography variant="body2" color="text.secondary">Detailed fields will appear here based on selection.</Typography>
                </AccordionDetails>
            </Accordion>

            {/* Results Table Section */}
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ 
                    p: 1.5, 
                    background: '#20a090', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ListIcon fontSize="small" />
                        <Typography fontWeight="500">Task Approval List</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                            <ExcelIcon fontSize="small" />
                        </IconButton>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<ApplyIcon />}
                            sx={{
                                bgcolor: '#00bcd4',
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: '#0097a7' }
                            }}
                        >
                            APPLY
                        </Button>
                        <IconButton size="small" sx={{ color: 'white' }}>
                            <ExpandMoreIcon />
                        </IconButton>
                    </Box>
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

export default TaskApproval;
