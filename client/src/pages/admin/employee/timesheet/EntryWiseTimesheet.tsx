import React, { useState, useCallback } from 'react';
import {
    Box, Paper, Typography, MenuItem, Select, FormControl,
    TextField, CircularProgress, Grid, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert
} from '@mui/material';
import {
    FormatListBulleted as ListIcon,
    Clear as ClearIcon,
    AccessTime as TimeIcon,
    Search as SearchIcon,
    Timer as TimerIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import { clientGroupService } from '../../../../services/clientGroupService';
import { taskService } from '../../../../services/taskService';
import type { Client, User } from '../../../../types';
import { CommonButton } from '../../../../components/common/UIComponents';

const fmtDuration = (minutes: number) => {
    if (!minutes) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDateTime = (dt: string | Date | undefined) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusColor: Record<string, string> = {
    PENDING: '#f59e0b', IN_PROCESS: '#3b82f6', PENDING_FOR_APPROVAL: '#8b5cf6',
    APPROVED: '#10b981', DONE: '#22c55e', CANCELLED: '#ef4444',
    ON_HOLD: '#6b7280', REJECTED: '#dc2626', PENDING_FROM_CLIENT: '#f97316',
    PENDING_FROM_DEPARTMENT: '#e879f9'
};

const priorityColor: Record<string, string> = {
    LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626'
};

interface FilterState {
    groupName: string; clientName: string; task: string;
    frequency: string; year: string;
    status: string; dateFrom: string; dateTo: string;
}

const empty: FilterState = {
    groupName: '', clientName: '', task: '', frequency: '',
    year: '', status: '', dateFrom: '', dateTo: ''
};

interface TimesheetEntry {
    entryId?: string;
    taskId?: string;
    taskTitle: string;
    frequency?: string;
    client?: Client;
    clientGroup?: { _id: string; groupName: string };
    assignedTo: User[];
    startTime: string;
    endTime: string;
    durationMinutes: number;
    taskStatus: string;
    taskPriority: string;
    isOverdue?: boolean;
}

export const EntryWiseTimesheet: React.FC = () => {
    const [filterData, setFilterData] = useState<FilterState>(empty);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: groups = [], isLoading: loadingGroups } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: tasks = [], isLoading: loadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.getTasks() });

    const frequencies = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'];
    const years = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
    const statuses = ['PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED', 'DONE', 'CANCELLED', 'ON_HOLD'];

    const handleChange = (field: keyof FilterState) => (e: { target: { value: unknown } }) => {
        setFilterData(prev => ({ ...prev, [field]: e.target.value as string }));
    };

    const handleSearch = () => setActiveFilters({ ...filterData });

    const handleClear = () => {
        setFilterData(empty);
        setActiveFilters(null);
    };

    const buildParams = useCallback((f: FilterState) => ({
        clientGroupId: f.groupName || undefined,
        clientId: f.clientName || undefined,
        taskMasterId: f.task || undefined,
        frequency: f.frequency || undefined,
        year: f.year || undefined,
        status: f.status || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        view: 'entry' as const
    }), []);

    const { data: timesheetData, isLoading: loadingSheet, error } = useQuery({
        queryKey: ['timesheet-entry', activeFilters],
        queryFn: () => taskService.getTimesheet(buildParams(activeFilters!)),
        enabled: !!activeFilters
    });

    const sheet = timesheetData as { rows: TimesheetEntry[] };
    const rows = sheet?.rows || [];
    const totalMinutes = rows.reduce((s: number, r: TimesheetEntry) => s + (r.durationMinutes || 0), 0);

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Paper sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <TimerIcon />
                        <Typography variant="h5" fontWeight="600">Entry Wise Timesheet</Typography>
                    </Box>
                    {rows.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="700">{rows.length}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85 }}>Entries</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="700">{fmtDuration(totalMinutes)}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85 }}>Total Time</Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={2.5} alignItems="flex-end">
                    {/* Group */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Group Name</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.groupName} onChange={handleChange('groupName')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Groups</MenuItem>
                                {loadingGroups ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    groups.map((g: { _id: string; groupName: string }) => <MenuItem key={g._id} value={g._id}>{g.groupName}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Client */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Client</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.clientName} onChange={handleChange('clientName')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Clients</MenuItem>
                                {loadingClients ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    clients.map((c: Client) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Task */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Task</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.task} onChange={handleChange('task')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Tasks</MenuItem>
                                {loadingTasks ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    tasks.map((t: { _id: string; title: string }) => <MenuItem key={t._id} value={t._id}>{t.title}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Frequency */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Frequency</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.frequency} onChange={handleChange('frequency')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Frequencies</MenuItem>
                                {frequencies.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Year */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Year</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.year} onChange={handleChange('year')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Years</MenuItem>
                                {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Status */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Status</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.status} onChange={handleChange('status')} sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {statuses.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Date Range */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Date Range (Start Time)</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField size="small" type="date" value={filterData.dateFrom} onChange={handleChange('dateFrom')} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <Box sx={{ px: 1, color: 'text.secondary', fontSize: 12, whiteSpace: 'nowrap' }}>to</Box>
                            <TextField size="small" type="date" value={filterData.dateTo} onChange={handleChange('dateTo')} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Box>
                    </Grid>

                    {/* Buttons */}
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                            <CommonButton variant="outlined" color="error" onClick={handleClear} startIcon={<ClearIcon />} sx={{ borderRadius: '8px' }}>Clear</CommonButton>
                            <CommonButton variant="contained" onClick={handleSearch} startIcon={<SearchIcon />}
                                sx={{ borderRadius: '8px', bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                                Search
                            </CommonButton>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results */}
            <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#1e293b', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListIcon fontSize="small" />
                    <Typography variant="h6" fontWeight="600">Time Entries</Typography>
                    {rows.length > 0 && (
                        <Chip label={`${rows.length} entries · ${fmtDuration(totalMinutes)}`} size="small"
                            sx={{ ml: 1, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4338ca' }, color: 'white', fontWeight: 600 }} />
                    )}
                </Box>

                {!activeFilters && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>Set filters and click Search to load timesheet entries</Typography>
                    </Box>
                )}

                {activeFilters && loadingSheet && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <CircularProgress size={36} />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading entries...</Typography>
                    </Box>
                )}

                {activeFilters && error && (
                    <Box sx={{ p: 3 }}>
                        <Alert severity="error">Failed to load timesheet data. Please try again.</Alert>
                    </Box>
                )}

                {activeFilters && !loadingSheet && !error && rows.length === 0 && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <TimeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>No time entries found for the selected filters</Typography>
                    </Box>
                )}

                {!loadingSheet && rows.length > 0 && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Task</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Start Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>End Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Duration</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Priority</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row: TimesheetEntry, idx: number) => (
                                    <TableRow key={row.entryId || `${row.taskId}-${idx}`}
                                        sx={{ '&:hover': { bgcolor: '#f5f7ff' }, borderLeft: row.isOverdue ? '3px solid #ef4444' : '3px solid transparent' }}>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ maxWidth: 220 }}>
                                            <Typography fontSize={13} fontWeight={600} noWrap>{row.taskTitle}</Typography>
                                            {row.frequency && <Typography fontSize={11} color="text.secondary">{row.frequency}</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            {row.client ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <BusinessIcon sx={{ fontSize: 14, color: '#667eea' }} />
                                                    <Typography fontSize={12}>{row.client.name}</Typography>
                                                </Box>
                                            ) : row.clientGroup ? (
                                                <Typography fontSize={12} color="text.secondary">{row.clientGroup.groupName}</Typography>
                                            ) : <Typography fontSize={12} color="text.disabled">—</Typography>}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateTime(row.startTime)}</TableCell>
                                        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDateTime(row.endTime)}</TableCell>
                                        <TableCell>
                                            <Chip label={fmtDuration(row.durationMinutes)} size="small"
                                                icon={<TimeIcon style={{ fontSize: 12 }} />}
                                                sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700, fontSize: 11 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.taskStatus?.replace(/_/g, ' ')} size="small"
                                                sx={{ bgcolor: statusColor[row.taskStatus] + '22', color: statusColor[row.taskStatus], fontWeight: 600, fontSize: 10 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.taskPriority} size="small"
                                                sx={{ bgcolor: priorityColor[row.taskPriority] + '22', color: priorityColor[row.taskPriority], fontWeight: 600, fontSize: 10 }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Summary Row */}
                                <TableRow sx={{ bgcolor: '#f0f0ff', fontWeight: 700 }}>
                                    <TableCell colSpan={5} sx={{ fontWeight: 700, color: '#667eea' }}>Total</TableCell>
                                    <TableCell>
                                        <Chip label={fmtDuration(totalMinutes)} size="small"
                                            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, color: 'white', fontWeight: 700 }} />
                                    </TableCell>
                                    <TableCell colSpan={2} />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};





