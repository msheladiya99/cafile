import React, { useState, useCallback } from 'react';
import {
    Box, Paper, Typography, MenuItem, Select, FormControl,
    Button, TextField, CircularProgress, Grid, Chip, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tooltip, Alert, LinearProgress
} from '@mui/material';
import {
    FormatListBulleted as ListIcon, Clear as ClearIcon,
    Search as SearchIcon,
    CheckCircle as CheckIcon, HourglassEmpty as PendingIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../../services/adminService';
import type { User } from '../../../../types';
import { clientGroupService } from '../../../../services/clientGroupService';
import { staffService } from '../../../../services/staffService';
import { taskService } from '../../../../services/taskService';

const fmtHours = (h: number) => (h === 0 ? '0h' : h < 1 ? `${Math.round(h * 60)}m` : `${h.toFixed(1)}h`);
const fmtDate = (dt: string | Date | undefined) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusColor: Record<string, string> = {
    PENDING: '#f59e0b', IN_PROCESS: '#3b82f6', PENDING_FOR_APPROVAL: '#8b5cf6',
    APPROVED: '#10b981', DONE: '#22c55e', CANCELLED: '#ef4444',
    ON_HOLD: '#6b7280', REJECTED: '#dc2626', PENDING_FROM_CLIENT: '#f97316',
    PENDING_FROM_DEPARTMENT: '#e879f9'
};

interface FilterState {
    groupName: string; clientName: string; task: string; frequency: string;
    reportingManager: string; year: string; status: string; approvalStatus: string;
    dateFrom: string; dateTo: string;
}
const empty: FilterState = {
    groupName: '', clientName: '', task: '', frequency: '',
    reportingManager: '', year: '', status: '', approvalStatus: '',
    dateFrom: '', dateTo: ''
};

export const TaskWiseTimesheet: React.FC = () => {
    const [filterData, setFilterData] = useState<FilterState>(empty);
    const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);

    const { data: clients = [], isLoading: loadingClients } = useQuery({ queryKey: ['clients'], queryFn: adminService.getClients });
    const { data: groups = [], isLoading: loadingGroups } = useQuery({ queryKey: ['clientGroups'], queryFn: clientGroupService.getGroups });
    const { data: staff = [], isLoading: loadingStaff } = useQuery({ queryKey: ['staff'], queryFn: staffService.getStaff });
    const { data: tasks = [], isLoading: loadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => taskService.getTasks() });

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
        reportingManager: f.reportingManager || undefined,
        year: f.year || undefined,
        status: f.status || undefined,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        view: 'task' as const
    }), []);

    const { data: timesheetData, isLoading: loadingSheet, error } = useQuery({
        queryKey: ['timesheet-task', activeFilters],
        queryFn: () => taskService.getTimesheet(buildParams(activeFilters!)),
        enabled: !!activeFilters
    });

    const sheet = timesheetData as any;
    const rows: any[] = sheet?.rows || [];
    const summary = sheet?.summary;

    const filteredRows = activeFilters?.approvalStatus
        ? rows.filter((r: any) => {
            if (activeFilters.approvalStatus === 'Approved') return r.taskStatus === 'APPROVED' || r.taskStatus === 'DONE';
            if (activeFilters.approvalStatus === 'Pending') return r.taskStatus === 'PENDING_FOR_APPROVAL';
            if (activeFilters.approvalStatus === 'Rejected') return r.taskStatus === 'REJECTED';
            return true;
        })
        : rows;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckIcon />
                        <Typography variant="h5" fontWeight="600">Task Wise Timesheet</Typography>
                    </Box>
                    {summary && (
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            {[
                                { label: 'Tasks', value: summary.totalTasks },
                                { label: 'Est. Hours', value: `${summary.totalEstimatedHours}h` },
                                { label: 'Actual Hours', value: `${summary.totalActualHours}h` },
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
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Reporting Manager</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.reportingManager} onChange={handleChange('reportingManager')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Managers</MenuItem>
                                {loadingStaff ? <MenuItem disabled><CircularProgress size={16} /></MenuItem> :
                                    staff.filter((s: User) => ['ADMIN', 'MANAGER', 'STAFF'].includes(s.role))
                                        .map((s: User) => <MenuItem key={s._id} value={s._id}>{s.name} ({s.role})</MenuItem>)}
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
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Status</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.status} onChange={handleChange('status')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All Statuses</MenuItem>
                                {statuses.map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.5, fontWeight: 500 }}>Approval Status</Typography>
                        <FormControl size="small" fullWidth>
                            <Select displayEmpty value={filterData.approvalStatus} onChange={handleChange('approvalStatus')} sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="">All</MenuItem>
                                {['Pending', 'Approved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
                    <Typography variant="h6" fontWeight="600">Task List</Typography>
                    {filteredRows.length > 0 && (
                        <Chip label={`${filteredRows.length} tasks`} size="small"
                            sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                    )}
                </Box>

                {!activeFilters && (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>Set filters and click Search to view task-wise timesheet</Typography>
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
                        <PendingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" fontWeight={500}>No tasks found for the selected filters</Typography>
                    </Box>
                )}

                {!loadingSheet && filteredRows.length > 0 && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea', minWidth: 200 }}>Task</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Client</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Assigned To</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Est. Hrs</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Actual Hrs</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea', minWidth: 100 }}>Progress</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Eff. %</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Target Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#667eea' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRows.map((row: any, idx: number) => (
                                    <TableRow key={row.taskId}
                                        sx={{ '&:hover': { bgcolor: '#f5f7ff' }, borderLeft: row.isOverdue ? '3px solid #ef4444' : '3px solid transparent' }}>
                                        <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{idx + 1}</TableCell>
                                        <TableCell sx={{ maxWidth: 240 }}>
                                            <Typography fontSize={13} fontWeight={600} noWrap>{row.taskTitle}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3, flexWrap: 'wrap' }}>
                                                {row.frequency && <Chip label={row.frequency} size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#f3f4f6' }} />}
                                                {row.timerRunning && <Chip label="🟢 LIVE" size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#dcfce7', color: '#15803d' }} />}
                                                {row.revisionCount > 0 && <Chip label={`${row.revisionCount} revisions`} size="small" sx={{ fontSize: 9, height: 16, bgcolor: '#fef3c7', color: '#92400e' }} />}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {row.client ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <BusinessIcon sx={{ fontSize: 14, color: '#667eea' }} />
                                                    <Typography fontSize={12}>{row.client.name}</Typography>
                                                </Box>
                                            ) : row.clientGroup ? (
                                                <Typography fontSize={12} color="text.secondary">{row.clientGroup.groupName}</Typography>
                                            ) : <Typography fontSize={12} color="text.disabled">Internal</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {(row.assignedTo as any[])?.slice(0, 3).map((u: any) => (
                                                    <Tooltip key={u._id} title={`${u.name || u.username} (${u.role})`}>
                                                        <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: '#667eea' }}>
                                                            {(u.name || u.username || '?')[0].toUpperCase()}
                                                        </Avatar>
                                                    </Tooltip>
                                                ))}
                                                {(row.assignedTo as any[])?.length > 3 && (
                                                    <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: '#764ba2' }}>
                                                        +{(row.assignedTo as any[]).length - 3}
                                                    </Avatar>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={600}>{row.estimatedHours}h</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} fontWeight={700} color={row.totalHours > row.estimatedHours ? '#ef4444' : '#22c55e'}>
                                                {fmtHours(row.totalHours)}
                                            </Typography>
                                            {row.timerRunning && (
                                                <Typography fontSize={10} color="#15803d">+{row.liveMinutes}m live</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 100 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={row.progressPercentage}
                                                    sx={{ flex: 1, height: 6, borderRadius: 3,
                                                        bgcolor: '#e5e7eb',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: row.progressPercentage === 100 ? '#22c55e' : '#667eea',
                                                            borderRadius: 3
                                                        }
                                                    }}
                                                />
                                                <Typography fontSize={11} fontWeight={600} color="text.secondary">{row.progressPercentage}%</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {row.efficiency !== null ? (
                                                <Chip label={`${Math.min(row.efficiency, 999)}%`} size="small"
                                                    sx={{
                                                        bgcolor: row.efficiency >= 100 ? '#dcfce7' : '#fef3c7',
                                                        color: row.efficiency >= 100 ? '#15803d' : '#92400e',
                                                        fontWeight: 700, fontSize: 11
                                                    }} />
                                            ) : <Typography fontSize={11} color="text.disabled">—</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize={12} color={row.isOverdue ? '#ef4444' : 'text.primary'} fontWeight={row.isOverdue ? 700 : 400}>
                                                {fmtDate(row.targetDate)}
                                            </Typography>
                                            {row.isOverdue && <Typography fontSize={10} color="#ef4444">Overdue</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={row.taskStatus?.replace(/_/g, ' ')} size="small"
                                                sx={{ bgcolor: statusColor[row.taskStatus] + '22', color: statusColor[row.taskStatus], fontWeight: 600, fontSize: 10 }} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Summary Row */}
                                {summary && (
                                    <TableRow sx={{ bgcolor: '#f0f0ff' }}>
                                        <TableCell colSpan={4} sx={{ fontWeight: 700, color: '#667eea' }}>Total ({filteredRows.length} tasks)</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{summary.totalEstimatedHours}h</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>{summary.totalActualHours}h</TableCell>
                                        <TableCell colSpan={4} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};
