import React, { useState, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button, TextField, Select, MenuItem,
    Grid, Checkbox, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, CircularProgress, Chip,
    InputAdornment, useMediaQuery, useTheme
} from '@mui/material';
import {
    Close as CloseIcon,
    Search as SearchIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { taskMasterService } from '../../../services/taskMasterService';
import { adminService } from '../../../services/adminService';
import { staffService } from '../../../services/staffService';
import { taskService } from '../../../services/taskService';
import type { TaskMasterData, Client, User } from '../../../types';

interface AddTaskModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIES = ['All', 'GST', 'Income Tax', 'MCA', 'Other', 'Accounting', 'Audit', 'Compliance'];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, onSuccess }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const queryClient = useQueryClient();

    // Data Fetches
    const { data: taskMasters = [], isLoading: loadingTasks } = useQuery({ queryKey: ['taskMasters'], queryFn: taskMasterService.getTaskMasters, enabled: open });
    const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients, enabled: open });
    const { data: staffList = [] } = useQuery({ queryKey: ['staff'], queryFn: staffService.getStaff, enabled: open });

    // Form State
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [taskType, setTaskType] = useState<string>('');
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [frequency, setFrequency] = useState<string>('');
    const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('');

    // Client Selection State
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
    const [clientAssignees, setClientAssignees] = useState<Record<string, string[]>>({});

    const years = useMemo(() => {
        const cur = new Date().getFullYear();
        return Array.from({ length: 6 }, (_, i) => (cur - 2 + i).toString());
    }, []);

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly', 'One Time'];

    // Derive auto-filled frequency from selected task type (user can still override)
    const effectiveFrequency = useMemo(() => {
        if (frequency) return frequency; // user has manually selected
        if (taskType) {
            const tm = taskMasters.find((t: TaskMasterData) => t._id === taskType);
            return tm?.frequency || '';
        }
        return '';
    }, [frequency, taskType, taskMasters]);

    // Filter Task Masters by Category
    const filteredTasks = useMemo(() => {
        if (selectedCategory === 'All') return taskMasters;
        return taskMasters.filter((t: TaskMasterData) =>
            t.department?.toLowerCase() === selectedCategory.toLowerCase() ||
            (selectedCategory === 'Other' && !CATEGORIES.includes(t.department || ''))
        );
    }, [taskMasters, selectedCategory]);

    // Filter Clients by Search
    const displayedClients = useMemo(() => {
        let sorted = [...clients];
        if (clientSearch) {
            const s = clientSearch.toLowerCase();
            sorted = sorted.filter((c: Client) =>
                c.name?.toLowerCase().includes(s) ||
                c.tradeName?.toLowerCase().includes(s) ||
                c.fileNo?.toLowerCase().includes(s)
            );
        }
        return sorted;
    }, [clients, clientSearch]);

    // Derived Selection logic
    const isAllSelected = displayedClients.length > 0 && selectedClients.size === displayedClients.length;
    const isIndeterminate = selectedClients.size > 0 && selectedClients.size < displayedClients.length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSet = new Set<string>();
            displayedClients.forEach((c: Client) => newSet.add(c._id));
            setSelectedClients(newSet);
        } else {
            setSelectedClients(new Set());
        }
    };

    const handleSelectClient = (clientId: string, checked: boolean) => {
        const newSet = new Set(selectedClients);
        if (checked) newSet.add(clientId);
        else newSet.delete(clientId);
        setSelectedClients(newSet);
    };

    const handleAssigneeChange = (clientId: string, userIds: string[]) => {
        setClientAssignees(prev => ({ ...prev, [clientId]: userIds }));
    };

    // Mutation
    const bulkCreateMutation = useMutation({
        mutationFn: taskService.createBulkTasks,
        onSuccess: (data) => {
            toast.success(`✅ ${data.message}`);
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to create tasks');
        }
    });

    const handleSave = () => {
        if (!taskType || !targetDate || !year) {
            toast.error('Please fill all required fields (Task Type, Target Date, Year).');
            return;
        }
        if (selectedClients.size === 0) {
            toast.error('Please select at least one client.');
            return;
        }

        const tm = taskMasters.find((t: TaskMasterData) => t._id === taskType);
        if (!tm) return;

        const baseTask = {
            title: tm.taskName,
            description: description || tm.description,
            category: 'CLIENT_WORK' as const,
            priority: 'MEDIUM' as const,
            targetDate,
            estimatedHours: tm.estimatedHours || 1,
            checklist: (tm.subtasks || []).map(s => s.name),
            billingAmount: tm.billingAmount || 0,
            taskMasterId: tm._id,
            department: tm.department,
            frequency: effectiveFrequency || frequency || 'One Time',
            year
        };

        const clientsPayload = Array.from(selectedClients).map(clientId => ({
            clientId,
            assignedTo: clientAssignees[clientId] || []
        }));

        bulkCreateMutation.mutate({ baseTask, clients: clientsPayload });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
            {/* Header */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3, py: 2, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', p: 1, borderRadius: 2, display: 'flex' }}><AddIcon /></Box>
                        <Typography variant="h6" fontWeight={800}>Add Task (Bulk Create)</Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '70vh' }}>
                {/* Left Panel: Form Details */}
                <Box sx={{ flex: 1, p: 3, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>

                    {/* Category Buttons */}
                    <Box mb={3}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Category *</Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {CATEGORIES.map(cat => (
                                <Chip
                                    key={cat} label={cat}
                                    onClick={() => { setSelectedCategory(cat); setTaskType(''); }}
                                    sx={{
                                        fontWeight: 600, borderRadius: 2,
                                        bgcolor: selectedCategory === cat ? '#667eea' : 'white',
                                        color: selectedCategory === cat ? 'white' : '#475569',
                                        border: '1px solid', borderColor: selectedCategory === cat ? '#667eea' : '#cbd5e1',
                                        '&:hover': { bgcolor: selectedCategory === cat ? '#764ba2' : '#f1f5f9' }
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Task Type */}
                    <Box mb={3}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Task Type *</Typography>
                        <Select size="small" fullWidth displayEmpty value={taskType} onChange={e => setTaskType(e.target.value as string)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                            <MenuItem value="" disabled><em>Select a task...</em></MenuItem>
                            {filteredTasks.map((t: TaskMasterData) => (
                                <MenuItem key={t._id} value={t._id}>{t.taskName} {t.frequency ? `(${t.frequency})` : ''}</MenuItem>
                            ))}
                        </Select>
                    </Box>

                    {/* Period & Target Date */}
                    <Grid container spacing={2} mb={3}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Year *</Typography>
                            <Select size="small" fullWidth value={year} onChange={e => setYear(e.target.value as string)} sx={{ bgcolor: 'white', borderRadius: 2 }}>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Period / Freq</Typography>
                            <Select size="small" fullWidth value={effectiveFrequency} onChange={e => setFrequency(e.target.value as string)} displayEmpty sx={{ bgcolor: 'white', borderRadius: 2 }}>
                                <MenuItem value=""><em>Default...</em></MenuItem>
                                {frequencies.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                            </Select>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Due Date *</Typography>
                            <TextField type="date" size="small" fullWidth value={targetDate} onChange={e => setTargetDate(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 2 }} />
                        </Grid>
                    </Grid>

                    {/* Description */}
                    <Box mb={3}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1} display="block">Description / Remarks</Typography>
                        <TextField
                            multiline rows={4} fullWidth size="small"
                            placeholder="Add task notes, guidelines, or specific instructions here..."
                            value={description} onChange={e => setDescription(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: 2 }}
                        />
                    </Box>
                </Box>

                {/* Right Panel: Client Selection */}
                <Box sx={{ flex: 1.2, p: 3, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight={800} color="#334155">
                            Select Clients ({selectedClients.size}/{displayedClients.length})
                        </Typography>
                    </Box>

                    {/* Client Toolbar */}
                    <Box display="flex" gap={2} mb={2} alignItems="center">
                        <TextField
                            size="small" fullWidth placeholder="Search by name, file no, or trade name..."
                            value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                            }}
                            sx={{ borderRadius: 2, bgcolor: '#f1f5f9' }}
                        />
                    </Box>

                    {/* Client Table */}
                    <TableContainer sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 2, overflowY: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ bgcolor: '#f8fafc' }}>
                                        <Checkbox
                                            size="small" indeterminate={isIndeterminate} checked={isAllSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, p: 1.5 }}>Client Details</TableCell>
                                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, p: 1.5 }}>Working User (Assignee)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadingClients ? (
                                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                                ) : displayedClients.length > 0 ? (
                                    displayedClients.map((client: Client) => {
                                        const cId = client._id;
                                        const isSelected = selectedClients.has(cId);
                                        const assignees = clientAssignees[cId] || [];

                                        return (
                                            <TableRow key={cId} hover selected={isSelected} sx={{ '&.Mui-selected': { bgcolor: '#eff6ff' } }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox size="small" checked={isSelected} onChange={(e) => handleSelectClient(cId, e.target.checked)} />
                                                </TableCell>
                                                <TableCell sx={{ p: 1.5 }}>
                                                    <Typography variant="body2" fontWeight={700} color="#1e293b">{client.name}</Typography>
                                                    <Box display="flex" gap={1} mt={0.5}>
                                                        {client.fileNo && <Chip label={`#${client.fileNo}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                                        {client.tradeName && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>{client.tradeName}</Typography>}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ p: 1.5 }}>
                                                    <Select
                                                        size="small" fullWidth multiple displayEmpty
                                                        value={assignees} disabled={!isSelected}
                                                        onChange={(e) => handleAssigneeChange(cId, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                                                        renderValue={(selected) => {
                                                            if (!selected || selected.length === 0) return <Typography variant="caption" color="text.disabled">Select working user...</Typography>;
                                                            return (
                                                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                                    {(selected as string[]).map(id => {
                                                                        const emp = staffList.find((s: User) => s._id === id);
                                                                        return <Chip key={id} label={emp ? emp.username || emp.name : id} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />;
                                                                    })}
                                                                </Box>
                                                            );
                                                        }}
                                                        sx={{ bgcolor: isSelected ? 'white' : 'transparent', borderRadius: 1.5, minHeight: 32, fontSize: '0.8rem' }}
                                                    >
                                                        {staffList.map((emp: User) => (
                                                            <MenuItem key={emp._id} value={emp._id} sx={{ fontSize: '0.85rem' }}>
                                                                <Checkbox size="small" checked={assignees.includes(emp._id)} />
                                                                {emp.name || emp.username}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">No clients found.</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{ p: 2.5, bgcolor: 'white', borderTop: '1px solid #e2e8f0', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {selectedClients.size} clients selected. Duplicates for the exact period will be skipped automatically.
                </Typography>
                <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={bulkCreateMutation.isPending || loadingTasks}
                    sx={{
                        textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4,
                        bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }
                    }}
                >
                    {bulkCreateMutation.isPending ? 'Creating Tasks...' : 'Create Tasks'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
