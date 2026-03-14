import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from '@mui/material';
import {
    Add as AddIcon,
    List as ListIcon,
    KeyboardArrowUp as UpIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { clientGroupService } from '../../../services/clientGroupService';
import type { TaskMasterData, Client } from '../../../types';

export const TaskApplicability: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isSingleTask = searchParams.get('single') === 'true';

    // Recurrence Task State
    const [basedOn, setBasedOn] = useState<'Task' | 'Client'>('Task');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTask, setSelectedTask] = useState('');
    const [groupName, setGroupName] = useState('');
    const [itStatus, setITStatus] = useState('');
    const [subMaster, setSubMaster] = useState('');
    const [department, setDepartment] = useState('');
    const [infiniteApplicability, setInfiniteApplicability] = useState(true);

    // Single Task State
    const [singleGroupName, setSingleGroupName] = useState('');
    const [singleClientName, setSingleClientName] = useState('');
    const [singleTask, setSingleTask] = useState('');
    const [singleFrequency, setSingleFrequency] = useState('');
    const [singleYear, setSingleYear] = useState(new Date().getFullYear().toString());
    const [singleDepartment, setSingleDepartment] = useState('');

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

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];
    const departments = ['GST', 'Income Tax', 'Audit', 'Accounting', 'Compliance'];

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
                <Typography variant="h6" fontWeight="500">
                    {isSingleTask ? 'Start Single Task' : 'Set Recurrence Task'}
                </Typography>
                {!isSingleTask && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                            Vacant Client
                        </Button>
                        <Button variant="contained" size="small" startIcon={<AddIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                            Add New
                        </Button>
                        <Button variant="contained" size="small" startIcon={<ListIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                            List
                        </Button>
                    </Box>
                )}
            </Paper>

            {isSingleTask && (
                <Box sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)', p: 1, display: 'flex', justifyContent: 'flex-end', px: 2 }}>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{
                            bgcolor: '#764ba2',
                            fontSize: '0.75rem',
                            py: 0.5,
                            '&:hover': { bgcolor: '#667eea' }
                        }}
                    >
                        Add New
                    </Button>
                </Box>
            )}

            {/* Selection Form */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '0 0 8px 8px' }}>
                {isSingleTask ? (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Group Name</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleGroupName}
                                    onChange={(e) => setSingleGroupName(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose a Group...</em></MenuItem>
                                    {clientGroups.map((g: { _id: string; groupName: string }) => (
                                        <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Client Name <span style={{ color: 'red' }}>*</span></Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleClientName}
                                    onChange={(e) => setSingleClientName(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose a Client...</em></MenuItem>
                                    {clients.map((c: Client) => (
                                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Task <span style={{ color: 'red' }}>*</span></Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleTask}
                                    onChange={(e) => setSingleTask(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose a Task...</em></MenuItem>
                                    {taskMasters.map((t: TaskMasterData) => (
                                        <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Frequency</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleFrequency}
                                    onChange={(e) => setSingleFrequency(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose a Frequency...</em></MenuItem>
                                    {frequencies.map(f => (
                                        <MenuItem key={f} value={f}>{f}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Year <span style={{ color: 'red' }}>*</span></Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleYear}
                                    onChange={(e) => setSingleYear(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose Year...</em></MenuItem>
                                    {years.map(y => (
                                        <MenuItem key={y} value={y}>{y}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>Department</Typography>
                                <Select
                                    size="small"
                                    fullWidth
                                    displayEmpty
                                    value={singleDepartment}
                                    onChange={(e) => setSingleDepartment(e.target.value)}
                                >
                                    <MenuItem value=""><em>Choose a Department...</em></MenuItem>
                                    {departments.map(d => (
                                        <MenuItem key={d} value={d}>{d}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        bgcolor: '#667eea',
                                        px: 3,
                                        '&:hover': { bgcolor: '#764ba2' }
                                    }}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        bgcolor: '#ff5252',
                                        px: 3,
                                        '&:hover': { bgcolor: '#f44336' }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                ) : (
                    <Grid container spacing={3} alignItems="center">
                        {/* Always visible header fields */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Based On <span style={{ color: 'red' }}>*</span></Typography>
                                <RadioGroup
                                    row
                                    value={basedOn}
                                    onChange={(e) => setBasedOn(e.target.value as 'Task' | 'Client')}
                                >
                                    <FormControlLabel
                                        value="Task"
                                        control={<Radio size="small" sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }} />}
                                        label="Task"
                                    />
                                    <FormControlLabel
                                        value="Client"
                                        control={<Radio size="small" sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }} />}
                                        label="Client"
                                    />
                                </RadioGroup>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box display="flex" alignItems="center">
                                <Typography sx={{ width: 140, color: 'text.secondary' }}>Start Date <span style={{ color: 'red' }}>*</span></Typography>
                                <TextField
                                    type="date"
                                    size="small"
                                    fullWidth
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Box>
                        </Grid>

                        {/* Conditional Fields based on "Task" */}
                        {basedOn === 'Task' && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Task <span style={{ color: 'red' }}>*</span></Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={selectedTask}
                                            onChange={(e) => setSelectedTask(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose a Task...</em></MenuItem>
                                            {taskMasters.map((t: TaskMasterData) => (
                                                <MenuItem key={t._id || 'none'} value={t._id}>{t.taskName}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Group Name</Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose a Group...</em></MenuItem>
                                            {clientGroups.map((g: { _id: string; groupName: string }) => (
                                                <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>IT Status</Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={itStatus}
                                            onChange={(e) => setITStatus(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose IT Status...</em></MenuItem>
                                            {itStatuses.map((s: { _id: string; name: string }) => (
                                                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Sub Master</Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={subMaster}
                                            onChange={(e) => setSubMaster(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose a Sub Master...</em></MenuItem>
                                            {subMasters.map((s: { _id: string; name: string }) => (
                                                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                            </>
                        )}

                        {/* Conditional Fields based on "Client" */}
                        {basedOn === 'Client' && (
                            <>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Client <span style={{ color: 'red' }}>*</span></Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={singleClientName}
                                            onChange={(e) => setSingleClientName(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose a Client...</em></MenuItem>
                                            {clients.map((c: Client) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box display="flex" alignItems="center">
                                        <Typography sx={{ width: 140, color: 'text.secondary' }}>Department</Typography>
                                        <Select
                                            size="small"
                                            fullWidth
                                            displayEmpty
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                        >
                                            <MenuItem value=""><em>Choose a Department...</em></MenuItem>
                                            {departments.map(d => (
                                                <MenuItem key={d} value={d}>{d}</MenuItem>
                                            ))}
                                        </Select>
                                    </Box>
                                </Grid>
                            </>
                        )}

                        <Grid size={{ xs: 12 }}>
                            <Box display="flex" alignItems="center">
                                <Box sx={{ width: 140 }} />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={infiniteApplicability}
                                            onChange={(e) => setInfiniteApplicability(e.target.checked)}
                                            size="small"
                                            sx={{ color: '#667eea', '&.Mui-checked': { color: '#764ba2' } }}
                                        />
                                    }
                                    label={
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <Typography variant="body2" fontWeight="500" sx={{ color: '#764ba2' }}>Infinite Applicability.</Typography>
                                            <InfoIcon sx={{ fontSize: 16, color: '#667eea' }} />
                                        </Box>
                                    }
                                />
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {!isSingleTask && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{
                                p: 1.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <ListIcon fontSize="small" />
                                <Typography fontWeight="500">New Task</Typography>
                            </Box>
                            <TableContainer sx={{ minHeight: 200, bgcolor: '#f8f9fa' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', py: 1.5 }}>Client Not Found</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Table rows will go here */}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{
                                p: 1.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <ListIcon fontSize="small" />
                                    <Typography fontWeight="500">Applied</Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: 'white' }}>
                                    <UpIcon />
                                </IconButton>
                            </Box>
                            <TableContainer sx={{ minHeight: 200, bgcolor: '#f8f9fa' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', py: 1.5 }}>Client Not Found</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Table rows will go here */}
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
