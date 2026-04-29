import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, Avatar, Chip, Checkbox,
    Collapse, CircularProgress, TextField, InputAdornment,
    Divider, Alert, Snackbar
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Shield as ShieldIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../../../services/staffService';
import type { User } from '../../../types';
import { CommonButton } from '../../../components/common/UIComponents';
import { toast } from 'react-hot-toast';

// ─── Permission Definition ───────────────────────────────────────────────────

interface PermissionItem {
    key: string;
    label: string;
    description: string;
}

interface PermissionGroup {
    group: string;
    icon: string;
    items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        group: 'Dashboard',
        icon: '📊',
        items: [
            { key: 'dashboard.view', label: 'View Dashboard', description: 'Access the main admin dashboard' },
        ]
    },
    {
        group: 'Clients',
        icon: '👥',
        items: [
            { key: 'client.view', label: 'View Clients', description: 'View client list and details' },
            { key: 'client.add', label: 'Add Client', description: 'Create new client records' },
            { key: 'client.edit', label: 'Edit Client', description: 'Modify existing client records' },
            { key: 'client.delete', label: 'Delete Client', description: 'Remove client records' },
            { key: 'client.group', label: 'Manage Groups', description: 'Create and manage client groups' },
            { key: 'client.ledger', label: 'View Ledger', description: 'Access client financial ledger' },
        ]
    },
    {
        group: 'Tasks',
        icon: '✅',
        items: [
            { key: 'task.view', label: 'View Tasks', description: 'View task list and details' },
            { key: 'task.master.view', label: 'View Task Master', description: 'Access task template list' },
            { key: 'task.master.create', label: 'Create Task Master', description: 'Create new task templates' },
            { key: 'task.master.edit', label: 'Edit Task Master', description: 'Edit task templates' },
            { key: 'task.master.delete', label: 'Delete Task Master', description: 'Delete task templates' },
            { key: 'task.applicability', label: 'Set Task Applicability', description: 'Apply tasks to clients (recurrence)' },
            { key: 'task.single', label: 'Start Single Task', description: 'Start a one-off task for a client' },
            { key: 'task.approve', label: 'Approve Tasks', description: 'Approve or reject completed tasks' },
            { key: 'task.transfer', label: 'Transfer Tasks', description: 'Transfer tasks between employees' },
            { key: 'task.information', label: 'Task Information', description: 'View full task information report' },
            { key: 'task.udin', label: 'UDIN List', description: 'Access UDIN certificate list' },
        ]
    },
    {
        group: 'Billing',
        icon: '🧾',
        items: [
            { key: 'billing.view', label: 'View Billing', description: 'View invoices and billing records' },
            { key: 'billing.create', label: 'Create Invoice', description: 'Generate new invoices' },
            { key: 'billing.edit', label: 'Edit Invoice', description: 'Modify existing invoices' },
            { key: 'billing.delete', label: 'Delete Invoice', description: 'Remove invoice records' },
        ]
    },
    {
        group: 'Employee Management',
        icon: '👤',
        items: [
            { key: 'employee.view', label: 'View Employees', description: 'View employee list and profiles' },
            { key: 'employee.add', label: 'Add Employee', description: 'Create new employee accounts' },
            { key: 'employee.edit', label: 'Edit Employee', description: 'Modify employee records' },
            { key: 'employee.delete', label: 'Delete Employee', description: 'Remove employee accounts' },
            { key: 'employee.attendance', label: 'Manage Attendance', description: 'View and manage attendance records' },
            { key: 'employee.timesheet', label: 'View Timesheets', description: 'Access employee timesheets' },
        ]
    },
    {
        group: 'DSC Management',
        icon: '🔐',
        items: [
            { key: 'dsc.view', label: 'View DSC', description: 'View DSC certificate records' },
            { key: 'dsc.add', label: 'Add DSC', description: 'Add new DSC entries' },
            { key: 'dsc.edit', label: 'Edit DSC', description: 'Modify DSC records' },
            { key: 'dsc.delete', label: 'Delete DSC', description: 'Remove DSC records' },
        ]
    },
    {
        group: 'Reports',
        icon: '📈',
        items: [
            { key: 'reports.view', label: 'View Reports', description: 'Access monthly and other reports' },
        ]
    },
    {
        group: 'Files & Documents',
        icon: '📁',
        items: [
            { key: 'files.view', label: 'View Files', description: 'Browse uploaded files and documents' },
            { key: 'files.upload', label: 'Upload Files', description: 'Upload files to the system' },
            { key: 'files.delete', label: 'Delete Files', description: 'Remove files from the system' },
            { key: 'files.register', label: 'File Register', description: 'Access the file register' },
        ]
    },
    {
        group: 'Reminders',
        icon: '🔔',
        items: [
            { key: 'reminders.view', label: 'View Reminders', description: 'See scheduled reminders' },
            { key: 'reminders.create', label: 'Create Reminders', description: 'Add new reminders' },
            { key: 'reminders.edit', label: 'Edit Reminders', description: 'Modify existing reminders' },
            { key: 'reminders.delete', label: 'Delete Reminders', description: 'Remove reminders' },
        ]
    },
    {
        group: 'Expenses',
        icon: '💰',
        items: [
            { key: 'expenses.view', label: 'View Expenses', description: 'View expense records and reports' },
            { key: 'expenses.create', label: 'Add Expense', description: 'Record new expenses' },
            { key: 'expenses.edit', label: 'Edit Expense', description: 'Modify expense entries' },
            { key: 'expenses.delete', label: 'Delete Expense', description: 'Remove expense records' },
            { key: 'expenses.settlement', label: 'Expense Settlement', description: 'Manage expense settlements and reimbursements' },
        ]
    },
    {
        group: 'Tax Notices',
        icon: '📜',
        items: [
            { key: 'notices.view', label: 'View Notices', description: 'View tax notices and replies' },
            { key: 'notices.create', label: 'Create Notice Reply', description: 'Generate tax notice replies using AI' },
        ]
    },
    {
        group: 'Bank Statement',
        icon: '🏦',
        items: [
            { key: 'bankstatement.view', label: 'Bank Statement Tool', description: 'Convert bank statements to Excel' },
            { key: 'bankstatement.history', label: 'Statement History', description: 'View past bank statement conversions' },
        ]
    },
    {
        group: 'CA Assistant AI',
        icon: '🤖',
        items: [
            { key: 'assistant.view', label: 'CA Assistant AI', description: 'Access the CA Assistant AI chat tool' },
        ]
    },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));

// ─── Component ────────────────────────────────────────────────────────────────

export const StaffPermissions: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [localPermissions, setLocalPermissions] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [searchPerm, setSearchPerm] = useState('');
    const [searchStaff, setSearchStaff] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const { data: staffList = [], isLoading } = useQuery<User[]>({
        queryKey: ['staff'],
        queryFn: staffService.getStaff
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
            staffService.updateStaff(id, { permissions }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setIsDirty(false);
            toast.success('Permissions saved successfully');
        },
        onError: () => {
            toast.error('Failed to save permissions');
        }
    });

    const selectedStaff = useMemo(() =>
        staffList.find(s => s._id === selectedStaffId),
        [staffList, selectedStaffId]
    );

    const filteredStaff = useMemo(() =>
        staffList.filter(s =>
            !searchStaff ||
            s.name?.toLowerCase().includes(searchStaff.toLowerCase()) ||
            s.username?.toLowerCase().includes(searchStaff.toLowerCase())
        ),
        [staffList, searchStaff]
    );

    const filteredGroups = useMemo(() => {
        if (!searchPerm) return PERMISSION_GROUPS;
        const q = searchPerm.toLowerCase();
        return PERMISSION_GROUPS
            .map(g => ({
                ...g,
                items: g.items.filter(i =>
                    i.label.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q)
                )
            }))
            .filter(g => g.items.length > 0 || g.group.toLowerCase().includes(q));
    }, [searchPerm]);

    const handleSelectStaff = (staff: User) => {
        setSelectedStaffId(staff._id);
        setLocalPermissions(staff.permissions || []);
        setIsDirty(false);
        setExpandedGroups({});
    };

    const togglePermission = (key: string) => {
        setLocalPermissions(prev => {
            const next = prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key];
            setIsDirty(true);
            return next;
        });
    };

    const toggleGroup = (groupKeys: string[]) => {
        const allChecked = groupKeys.every(k => localPermissions.includes(k));
        setLocalPermissions(prev => {
            const next = allChecked
                ? prev.filter(p => !groupKeys.includes(p))
                : [...new Set([...prev, ...groupKeys])];
            setIsDirty(true);
            return next;
        });
    };

    const selectAll = () => {
        setLocalPermissions(ALL_PERMISSION_KEYS);
        setIsDirty(true);
    };

    const clearAll = () => {
        setLocalPermissions([]);
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!selectedStaffId) return;
        updateMutation.mutate({ id: selectedStaffId, permissions: localPermissions });
    };

    const getGroupState = (groupKeys: string[]) => {
        const checked = groupKeys.filter(k => localPermissions.includes(k)).length;
        if (checked === 0) return 'none';
        if (checked === groupKeys.length) return 'all';
        return 'partial';
    };

    const getRoleColor = (role: string) => {
        const map: Record<string, string> = { ADMIN: '#ef4444', MANAGER: '#f59e0b', STAFF: '#6366f1', INTERN: '#10b981' };
        return map[role] || '#64748b';
    };

    return (
        <Box sx={{ p: 0, height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="#0f172a">Staff Permissions</Typography>
                        <Typography variant="body2" color="#64748b">Control what each team member can see and do</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Main Layout */}
            <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2, overflow: 'hidden' }}>

                {/* Left: Staff List */}
                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ color: '#64748b', fontSize: 18 }} />
                        <Typography fontWeight={700} fontSize="0.875rem" color="#0f172a">Team Members</Typography>
                        <Chip label={staffList.length} size="small" sx={{ ml: 'auto', height: 20, fontSize: '0.7rem', bgcolor: '#f1f5f9', color: '#475569' }} />
                    </Box>

                    <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="Search staff..."
                            value={searchStaff}
                            onChange={e => setSearchStaff(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>,
                                sx: { borderRadius: '8px', fontSize: '0.8rem', bgcolor: '#f8fafc' }
                            }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {isLoading ? (
                            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
                        ) : filteredStaff.length === 0 ? (
                            <Box textAlign="center" py={4} color="text.secondary" fontSize="0.8rem">No staff found</Box>
                        ) : (
                            filteredStaff.map(staff => {
                                const isSelected = selectedStaffId === staff._id;
                                const permCount = (staff.permissions || []).length;
                                return (
                                    <Box
                                        key={staff._id}
                                        onClick={() => handleSelectStaff(staff)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                                            cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                                            bgcolor: isSelected ? '#eef2ff' : 'transparent',
                                            borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                                            '&:hover': { bgcolor: isSelected ? '#eef2ff' : '#f8fafc' },
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: getRoleColor(staff.role), fontSize: '0.875rem', fontWeight: 700 }}>
                                            {(staff.name || staff.username || '?').charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box flex={1} minWidth={0}>
                                            <Typography fontSize="0.8rem" fontWeight={600} noWrap color="#1e293b">
                                                {staff.name || staff.username}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <Chip
                                                    label={staff.role}
                                                    size="small"
                                                    sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, px: 0.5, bgcolor: `${getRoleColor(staff.role)}20`, color: getRoleColor(staff.role) }}
                                                />
                                            </Box>
                                        </Box>
                                        {permCount > 0 ? (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '10px !important' }} />}
                                                label={permCount}
                                                size="small"
                                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700 }}
                                            />
                                        ) : (
                                            <Chip
                                                label="None"
                                                size="small"
                                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700 }}
                                            />
                                        )}
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </Paper>

                {/* Right: Permissions Panel */}
                <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!selectedStaff ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={1} gap={2} py={8} px={4} textAlign="center">
                            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LockIcon sx={{ color: '#94a3b8', fontSize: 32 }} />
                            </Box>
                            <Typography fontWeight={700} color="#334155">Select a Staff Member</Typography>
                            <Typography variant="body2" color="#64748b" maxWidth={300}>
                                Choose a team member from the left panel to view and manage their access permissions.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Staff Header */}
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ width: 44, height: 44, bgcolor: getRoleColor(selectedStaff.role), fontWeight: 700, fontSize: '1rem' }}>
                                    {(selectedStaff.name || selectedStaff.username || '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <Box flex={1}>
                                    <Typography fontWeight={700} color="#0f172a">{selectedStaff.name || selectedStaff.username}</Typography>
                                    <Box display="flex" gap={0.5} alignItems="center" mt={0.25}>
                                        <Chip label={selectedStaff.role} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${getRoleColor(selectedStaff.role)}20`, color: getRoleColor(selectedStaff.role) }} />
                                        <Typography variant="caption" color="#64748b">{selectedStaff.email || selectedStaff.username}</Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ textAlign: 'center', px: 2, py: 0.75, borderRadius: '10px', bgcolor: '#f1f5f9' }}>
                                        <Typography fontSize="1.25rem" fontWeight={800} color="#6366f1" lineHeight={1}>{localPermissions.length}</Typography>
                                        <Typography variant="caption" color="#64748b">of {ALL_PERMISSION_KEYS.length}</Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Toolbar */}
                            <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <TextField
                                    size="small"
                                    placeholder="Search permissions..."
                                    value={searchPerm}
                                    onChange={e => setSearchPerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>,
                                        sx: { borderRadius: '8px', fontSize: '0.8rem', bgcolor: '#f8fafc' }
                                    }}
                                    sx={{ flex: 1, minWidth: 200 }}
                                />
                                <CommonButton size="small" variant="outlined" onClick={selectAll}
                                    sx={{ color: '#6366f1', borderColor: '#c7d2fe', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' } }}>
                                    Select All
                                </CommonButton>
                                <CommonButton size="small" variant="outlined" onClick={clearAll}
                                    sx={{ color: '#dc2626', borderColor: '#fecaca', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}>
                                    Clear All
                                </CommonButton>
                                <CommonButton
                                    size="small"
                                    loading={updateMutation.isPending}
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    sx={{ minWidth: 100 }}
                                >
                                    <LockOpenIcon sx={{ fontSize: 16, mr: 0.5 }} /> Save
                                </CommonButton>
                            </Box>

                            {/* Permission List */}
                            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
                                {filteredGroups.map(group => {
                                    const groupKeys = group.items.map(i => i.key);
                                    const state = getGroupState(groupKeys);
                                    const isExpanded = expandedGroups[group.group] !== false; // default open

                                    return (
                                        <Paper key={group.group} variant="outlined" sx={{ mb: 1.5, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            {/* Group Header */}
                                            <Box
                                                sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', bgcolor: state === 'all' ? '#f0fdf4' : '#f8fafc', '&:hover': { bgcolor: state === 'all' ? '#dcfce7' : '#f1f5f9' }, transition: 'all 0.15s' }}
                                                onClick={() => setExpandedGroups(prev => ({ ...prev, [group.group]: !isExpanded }))}
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={state === 'all'}
                                                    indeterminate={state === 'partial'}
                                                    onClick={e => { e.stopPropagation(); toggleGroup(groupKeys); }}
                                                    sx={{ p: 0, color: '#6366f1', '&.Mui-checked': { color: '#6366f1' }, '&.MuiCheckbox-indeterminate': { color: '#6366f1' } }}
                                                />
                                                <Typography fontSize="1rem">{group.icon}</Typography>
                                                <Typography fontWeight={700} fontSize="0.875rem" color="#1e293b" flex={1}>{group.group}</Typography>
                                                <Chip
                                                    label={`${groupKeys.filter(k => localPermissions.includes(k)).length}/${groupKeys.length}`}
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: state === 'all' ? '#dcfce7' : '#f1f5f9', color: state === 'all' ? '#16a34a' : '#475569' }}
                                                />
                                                {isExpanded ? <ExpandLessIcon sx={{ fontSize: 18, color: '#64748b' }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: '#64748b' }} />}
                                            </Box>

                                            {/* Permission Items */}
                                            <Collapse in={isExpanded}>
                                                <Divider />
                                                {group.items.map((item, idx) => {
                                                    const isChecked = localPermissions.includes(item.key);
                                                    return (
                                                        <Box
                                                            key={item.key}
                                                            sx={{
                                                                px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5,
                                                                bgcolor: isChecked ? '#fafbff' : '#ffffff',
                                                                borderBottom: idx < group.items.length - 1 ? '1px solid #f8fafc' : 'none',
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: '#f8fafc' }
                                                            }}
                                                            onClick={() => togglePermission(item.key)}
                                                        >
                                                            <Checkbox
                                                                size="small"
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(item.key)}
                                                                onClick={e => e.stopPropagation()}
                                                                sx={{ p: 0, color: '#cbd5e1', '&.Mui-checked': { color: '#6366f1' } }}
                                                            />
                                                            <Box flex={1}>
                                                                <Typography fontSize="0.8rem" fontWeight={600} color={isChecked ? '#4338ca' : '#334155'}>{item.label}</Typography>
                                                                <Typography fontSize="0.7rem" color="#94a3b8">{item.description}</Typography>
                                                            </Box>
                                                            {isChecked && <CheckCircleIcon sx={{ fontSize: 16, color: '#6366f1', opacity: 0.7 }} />}
                                                        </Box>
                                                    );
                                                })}
                                            </Collapse>
                                        </Paper>
                                    );
                                })}

                                {filteredGroups.length === 0 && (
                                    <Box textAlign="center" py={6} color="text.secondary">
                                        <SearchIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                                        <Typography>No permissions match your search</Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Save Bar */}
                            {isDirty && (
                                <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                                    <Typography variant="body2" color="#92400e" fontWeight={600}>
                                        ⚠️ You have unsaved changes
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                        <CommonButton
                                            variant="outlined"
                                            size="small"
                                            onClick={() => { setLocalPermissions(selectedStaff.permissions || []); setIsDirty(false); }}
                                            sx={{ color: '#92400e', borderColor: '#fcd34d' }}
                                        >
                                            Discard
                                        </CommonButton>
                                        <CommonButton
                                            size="small"
                                            loading={updateMutation.isPending}
                                            onClick={handleSave}
                                        >
                                            Save Changes
                                        </CommonButton>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default StaffPermissions;
