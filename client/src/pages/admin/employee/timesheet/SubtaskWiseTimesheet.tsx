import React, { useState, useCallback } from 'react';
import {
    Box, Paper, Typography, MenuItem, Select, FormControl,
    Button, TextField, CircularProgress, Grid, Chip, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Accordion, AccordionSummary, AccordionDetails, Tooltip, Alert, LinearProgress
} from '@mui/material';
import {
    FormatListBulleted as ListIcon, Clear as ClearIcon,
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon, AccountTree as SubtaskIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { clientGroupService } from '../../../../services/clientGroupService';
import { staffService } from '../../../../services/staffService';
import { taskService } from '../../../../services/taskService';
import { masterService } from '../../../../services/masterService';

const fmtHours = (h: number) => (h === 0 ? '0h' : h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`);
const fmtDate = (dt: string | Date | undefined) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusColor: Record<string, string> = {
    PENDING: '#f59e0b', IN_PROCESS: '#3b82f6', PENDING_FOR_APPROVAL: '#8b5cf6',
    APPROVED: '#10b981', DONE: '#22c55e', CANCELLED: '#ef4444',
    ON_HOLD: '#6b7280', REJECTED: '#dc2626', PENDING_FROM_CLIENT: '#f97316',
    PENDING_FROM_DEPARTMENT: '#e879f9'
};
const priorityColor: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626' };

// Subtask category colours (cycle through)
const categoryColors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

interface FilterState {
    groupName: string; clientName: string; task: string; frequency: string;
    subTask: string; year: string; employee: string; status: string;
    dateFrom: string; dateTo: string;
}
const empty: FilterState = {
    groupName: '', clientName: '', task: '', frequency: '',
    subTask: '', year: '', employee: '', status: '', dateFrom: '', dateTo: ''
};

export const SubtaskWiseTimesheet: React.FC = () => {
    const [filterData, setFilterData] = useState<FilterState>(empty);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: groups = [], isLoading: loadingGroups } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: staff = [], isLoading: loadingStaff } = useQuery({ queryKey: ['staff'], queryFn: staffService.getStaff });
    const { data: tasks = [], isLoading: loadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.getTasks() });
    const { data: subMasters = [], isLoading: loadingSubMasters } = useQuery({ queryKey: ['subMasters'], queryFn: masterService.getSubMasters });

    const frequencies = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    const years = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
    const statuses = ['PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED', 'DONE', 'CANCELLED', 'ON_HOLD'];

    const handleChange = (field: keyof FilterState) => (e: { target: { value: unknown } }) => {
        setFilterData(prev => ({ ...prev, [field]: e.target.value as string }));
    };

    const handleSearch = () => setActiveFilters({ ...filterData });
    const handleClear = () => { setFilterData(empty); setActiveFilters(null); };

    const buildParams = useCallback((f: FilterState) => ({
        clientGroupId: f.groupName || undefined,
        clientId: f.clientName || undefined,
        taskMasterId: f.task || undefined,
        frequency: f.frequency || undefined,
        assignedTo: f.employee || undefined,
        year: f.year || undefined,
        status: f.status || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        view: 'subtask' as const
    }), []);

    const { data: timesheetData, isLoading: loadingSheet, error } = useQuery({
        queryKey: ['timesheet-subtask', activeFilters],
        queryFn: () => taskService.getTimesheet(buildParams(activeFilters!)),
        enabled: !!activeFilters
    });

    const sheet = timesheetData as any;
    const allRows: any[] = sheet?.rows || [];

    // Group tasks by their category (used as "subtask" grouping since tasks don't have subTask field directly)
    // If a subMaster filter is selected, filter by matching checklist items
    const selectedSubMaster = activeFilters?.subTask
        ? (subMasters as any[]).find((sm: any) => sm._id === activeFilters.subTask)
        : null;

    const filteredRows = selectedSubMaster
        ? allRows.filter((r: any) =>
            (r.checklist || []).some((c: any) =>
                c.text?.toLowerCase().includes(selectedSubMaster.name?.toLowerCase())
            )
        )
        : allRows;

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const row of filteredRows) {
        const key = row.category || 'OTHER';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
    }
    const groupKeys = Object.keys(grouped).sort();

    const totalActualHours = filteredRows.reduce((s: number, r: any) => s + (r.totalHours || 0), 0);
    const totalEstHours = filteredRows.reduce((s: number, r: any) => s + (r.estimatedHours || 0), 0);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <SubtaskIcon />
                        <Typography variant="h5" fontWeight="600">Subtask Wise Timesheet</Typography>
                    </Box>
                    {filteredRows.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            {[
                                { label: 'Tasks', value: filteredRows.length },
                                { label: 'Categories', value: groupKeys.length },
                                { label: 'Est. Hours', value: `${Math.round(totalEstHours * 100) / 100}h` },
                                { label: 'Actual Hours', value: `${Math.round(totalActualHours * 100) / 100}h` },
                            ].map(s => (
                                <Box key={s.label} sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight="700">{s.value}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.85 }}>{s.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={2.5} alignItems="flex-end">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Group Name</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.groupName} onChange={handleChange('groupName')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Groups</MenuItem>
                                {loadingGroups ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    groups.map((g: any) => <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Client</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.clientName} onChange={handleChange('clientName')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Clients</MenuItem>
                                {loadingClients ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    clients.map((c: any) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Task</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.task} onChange={handleChange('task')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Tasks</MenuItem>
                                {loadingTasks ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    tasks.map((t: any) => <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Frequency</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.frequency} onChange={handleChange('frequency')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Frequencies</MenuItem>
                                {frequencies.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Sub Task</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.subTask} onChange={handleChange('subTask')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Sub Tasks</MenuItem>
                                {loadingSubMasters ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    (subMasters as any[]).map((sm: any) => <MenuItem key={sm._id} value={sm._id}>{sm.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Year</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.year} onChange={handleChange('year')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Years</MenuItem>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Employee</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.employee} onChange={handleChange('employee')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Employees</MenuItem>
                                {loadingStaff ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    staff.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name} {s.role ? `(${s.role})` : ''}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Status</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.status} onChange={handleChange('status')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {statuses.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Date Range</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField size="small" type="date" value={filterData.dateFrom} onChange={handleChange('dateFrom')} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            <Box sx={{ px: 1, color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}>to</Box>
                            <TextField size="small" type="date" value={filterData.dateTo} onChange={handleChange('dateTo')} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                            <Button variant="outlined" color="error" onClick={handleClear} startIcon={<ClearIcon />} sx={{ borderRadius: 1.5 }}>Clear</Button>
                            <Button variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}
                                sx={{ borderRadius: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                Search
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListIcon fontSize="small" />
                    <Typography variant="h6" fontWeight="600">Subtask Wise Summary</Typography>
                    {filteredRows.length > 0 && (
                        <Chip label={`${groupKeys.length} categories · ${filteredRows.length} tasks`} size="small"
                            sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                    )}
                </Box>

                {!activeFilters && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>Set filters and click Search to view subtask-wise timesheet</Typography>
                    </Box>
                )}

                {activeFilters && loadingSheet && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <CircularProgress size={36} />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading tasks...</Typography>
                    </Box>
                )}

                {activeFilters && error && (
                    <Box sx={{ p: 3 }}><Alert severity="error">Failed to load timesheet data.</Alert></Box>
                )}

                {activeFilters && !loadingSheet && !error && filteredRows.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <SubtaskIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>No tasks found for the selected filters</Typography>
                    </Box>
                )}

                {!loadingSheet && filteredRows.length > 0 && (
                    <Box sx={{ p: 2 }}>
                        {groupKeys.map((category, catIdx) => {
                            const catRows = grouped[category];
                            const catActual = catRows.reduce((s: number, r: any) => s + (r.totalHours || 0), 0);
                            const catEst = catRows.reduce((s: number, r: any) => s + (r.estimatedHours || 0), 0);
                            const color = categoryColors[catIdx % categoryColors.length];

                            return (
                                <Accordion key={category} defaultExpanded={catIdx === 0}
                                    sx={{ mb: 1.5, borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}
                                        sx={{ bgcolor: color + '15', borderLeft: `4px solid ${color}`, '&:hover': { bgcolor: color + '22' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 2, flexWrap: 'wrap' }}>
                                            <Typography fontWeight={700} fontSize={14} color={color}>
                                                {category.replace(/_/g, ' ')}
                                            </Typography>
                                            <Chip label={`${catRows.length} tasks`} size="small"
                                                sx={{ bgcolor: color + '22', color, fontWeight: 600, fontSize: 11 }} />
                                            <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography fontSize={13} fontWeight={700}>{Math.round(catEst * 100) / 100}h</Typography>
                                                    <Typography fontSize={10} color="text.secondary">Estimated</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography fontSize={13} fontWeight={700} color={catActual > catEst ? '#ef4444' : '#22c55e'}>
                                                        {Math.round(catActual * 100) / 100}h
                                                    </Typography>
                                                    <Typography fontSize={10} color="text.secondary">Actual</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 0 }}>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>#</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea', minWidth: 160 }}>Task</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Client</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Assigned To</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Est.</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Actual</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea', minWidth: 90 }}>Progress</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Target</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#667eea' }}>Priority</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {catRows.map((row: any, idx: number) => (
                                                        <TableRow key={row.taskId}
                                                            sx={{ '&:hover': { bgcolor: '#f5f7ff' }, borderLeft: row.isOverdue ? `3px solid #ef4444` : `3px solid ${color}40` }}>
                                                            <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{idx + 1}</TableCell>
                                                            <TableCell sx={{ maxWidth: 200 }}>
                                                                <Typography fontSize={12} fontWeight={600} noWrap>{row.taskTitle}</Typography>
                                                                {row.frequency && <Typography fontSize={10} color="text.secondary">{row.frequency}</Typography>}
                                                                {row.timerRunning && <Chip label="🟢 LIVE" size="small" sx={{ fontSize: 8, height: 14, bgcolor: '#dcfce7', color: '#15803d' }} />}
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.client ? (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <BusinessIcon sx={{ fontSize: 12, color: '#667eea' }} />
                                                                        <Typography fontSize={11}>{row.client.name}</Typography>
                                                                    </Box>
                                                                ) : row.clientGroup ? (
                                                                    <Typography fontSize={11} color="text.secondary">{row.clientGroup.groupName}</Typography>
                                                                ) : <Typography fontSize={11} color="text.disabled">Internal</Typography>}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                    {(row.assignedTo as any[])?.slice(0, 2).map((u: any) => (
                                                                        <Tooltip key={u._id} title={u.name || u.username}>
                                                                            <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: color }}>
                                                                                {(u.name || u.username || '?')[0].toUpperCase()}
                                                                            </Avatar>
                                                                        </Tooltip>
                                                                    ))}
                                                                    {(row.assignedTo as any[])?.length > 2 && (
                                                                        <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: '#764ba2' }}>
                                                                            +{(row.assignedTo as any[]).length - 2}
                                                                        </Avatar>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography fontSize={11} fontWeight={600}>{row.estimatedHours}h</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography fontSize={11} fontWeight={700}
                                                                    color={row.totalHours > row.estimatedHours ? '#ef4444' : '#22c55e'}>
                                                                    {fmtHours(row.totalHours)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ minWidth: 90 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <LinearProgress
                                                                        variant="determinate"
                                                                        value={row.progressPercentage}
                                                                        sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#e5e7eb',
                                                                            '& .MuiLinearProgress-bar': { bgcolor: row.progressPercentage === 100 ? '#22c55e' : color, borderRadius: 3 }
                                                                        }}
                                                                    />
                                                                    <Typography fontSize={10} fontWeight={600} color="text.secondary">{row.progressPercentage}%</Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography fontSize={11} color={row.isOverdue ? '#ef4444' : 'text.primary'} fontWeight={row.isOverdue ? 700 : 400}>
                                                                    {fmtDate(row.targetDate)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label={row.taskStatus?.replace(/_/g, ' ')} size="small"
                                                                    sx={{ bgcolor: statusColor[row.taskStatus] + '22', color: statusColor[row.taskStatus], fontWeight: 600, fontSize: 9 }} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label={row.taskPriority} size="small"
                                                                    sx={{ bgcolor: priorityColor[row.taskPriority] + '22', color: priorityColor[row.taskPriority], fontWeight: 600, fontSize: 9 }} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Category subtotal */}
                                                    <TableRow sx={{ bgcolor: color + '10' }}>
                                                        <TableCell colSpan={4} sx={{ fontWeight: 700, fontSize: 11, color }}>
                                                            Subtotal — {category.replace(/_/g, ' ')} ({catRows.length} tasks)
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>{Math.round(catEst * 100) / 100}h</TableCell>
                                                        <TableCell sx={{ fontWeight: 700, fontSize: 11, color: catActual > catEst ? '#ef4444' : '#22c55e' }}>
                                                            {Math.round(catActual * 100) / 100}h
                                                        </TableCell>
                                                        <TableCell colSpan={4} />
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}

                        {/* Grand Total */}
                        <Box sx={{ mt: 2, p: 2, background: 'linear-gradient(135deg, #667eea11 0%, #764ba211 100%)', borderRadius: 2, border: '1px solid #667eea33', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography fontSize={12} color="text.secondary">Total Tasks</Typography>
                                <Typography fontSize={18} fontWeight={700} color="#667eea">{filteredRows.length}</Typography>
                            </Box>
                            <Box>
                                <Typography fontSize={12} color="text.secondary">Total Estimated</Typography>
                                <Typography fontSize={18} fontWeight={700}>{Math.round(totalEstHours * 100) / 100}h</Typography>
                            </Box>
                            <Box>
                                <Typography fontSize={12} color="text.secondary">Total Actual</Typography>
                                <Typography fontSize={18} fontWeight={700} color={totalActualHours > totalEstHours ? '#ef4444' : '#22c55e'}>
                                    {Math.round(totalActualHours * 100) / 100}h
                                </Typography>
                            </Box>
                            <Box>
                                <Typography fontSize={12} color="text.secondary">Categories</Typography>
                                <Typography fontSize={18} fontWeight={700} color="#8b5cf6">{groupKeys.length}</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};
