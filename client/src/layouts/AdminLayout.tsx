import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, IconButton, 
    ListItem, ListItemButton, ListItemIcon, ListItemText, 
    useMediaQuery, Avatar, Collapse, useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    CloudUpload as UploadIcon,
    Folder as FolderIcon,
    NotificationsActive as ReminderIcon,
    Receipt as ReceiptIcon,
    Menu as MenuIcon,
    Assessment as ReportsIcon,
    Inventory as InventoryIcon,
    Assignment as AssignmentIcon,
    ExpandLess,
    ExpandMore,
    Business as BusinessIcon,
    Person as PersonIcon,
    GppGood as GppGoodIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

import AccountMenu from '../components/common/AccountMenu';

const drawerWidth = 240;

interface MenuItemDef {
    text: string;
    icon?: React.ReactNode;
    path?: string;
    perm?: string | string[];
    children?: MenuItemDef[];
}

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin, isStaffMember, isIntern, remainingTime, userPermissions } = useAuth();
    const isEmployee = isStaffMember || isIntern; // STAFF or INTERN — permission-gated
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    const companyName = 'CA Admin Panel';

    const handleMenuToggle = (text: string) => {
        setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
    };



    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const menuItems = React.useMemo(() => [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard', perm: 'dashboard.view' },
        ...(isAdmin ? [{ text: 'Firm Master', icon: <BusinessIcon />, path: '/admin/firm-master' }] : []),
        { text: 'Reports', icon: <ReportsIcon />, path: '/admin/reports', perm: 'reports.view' },
        {
            text: 'Client',
            icon: <PeopleIcon />,
            perm: ['client.view', 'client.add', 'client.edit', 'client.delete', 'client.group', 'client.ledger'],
            children: [
                { text: 'Add Group + List', path: '/admin/client/add-group', perm: 'client.group' },
                { text: 'Client Master', path: '/admin/client/master', perm: 'client.add' },
                { text: 'Client List', path: '/admin/client/list', perm: 'client.view' },
                { text: 'Client Contact Detail', path: '/admin/client/contact-detail', perm: 'client.view' },
                ...(isAdmin ? [{ text: 'Client Ledger', path: '/admin/client-ledger', perm: 'client.ledger' }] : []),
            ]
        },
        {
            text: 'Employee',
            icon: <PersonIcon />,
            perm: ['employee.view', 'employee.add', 'employee.edit', 'employee.attendance', 'employee.timesheet'],
            children: [
                { text: 'Employee Master', path: '/admin/employee/master', perm: 'employee.add' },
                { text: 'Employee List', path: '/admin/employee/list', perm: 'employee.view' },
                { text: 'Emp Task Schedule', path: '/admin/employee/tasks', perm: 'employee.view' },
                {
                    text: 'Time Sheet',
                    perm: ['employee.timesheet'],
                    children: [
                        { text: 'Entry Wise', path: '/admin/employee/timesheet/entry', perm: 'employee.timesheet' },
                        { text: 'Subtask Wise', path: '/admin/employee/timesheet/subtask', perm: 'employee.timesheet' },
                        { text: 'Task Wise', path: '/admin/employee/timesheet/task', perm: 'employee.timesheet' },
                    ]
                },
                { text: 'Free Employee List', path: '/admin/employee/free-list', perm: 'employee.view' },
                { text: 'Employee Login Detail', path: '/admin/employee/login-detail', perm: 'employee.view' },
                {
                    text: 'Emp Attendance',
                    perm: ['employee.attendance'],
                    children: [
                        { text: 'Add Attendance', path: '/admin/employee/attendance/add', perm: 'employee.attendance' },
                        { text: 'Attendance List', path: '/admin/employee/attendance/list', perm: 'employee.attendance' },
                    ]
                },
                { text: 'Form 108', path: '/admin/employee/form108', perm: 'employee.view' },
                ...(isAdmin ? [{ text: 'Staff Permissions', path: '/admin/employee/permissions' }] : []),
            ]
        },
        {
            text: 'Task',
            icon: <AssignmentIcon />,
            perm: ['task.view', 'task.master.view', 'task.applicability', 'task.single', 'task.approve', 'task.transfer', 'task.information', 'task.udin'],
            children: [
                { text: 'Task Dashboard', path: '/admin/tasks', perm: 'task.view' },
                {
                    text: 'Task Master',
                    perm: ['task.master.view', 'task.master.create', 'task.master.edit'],
                    children: [
                        { text: 'Add Task', path: '/admin/task-master/add', perm: 'task.master.create' },
                        { text: 'Task List', path: '/admin/task-master/list', perm: 'task.master.view' },
                        { text: 'Task Category', path: '/admin/task-category', perm: 'task.master.view' },
                    ]
                },
                {
                    text: 'Task Applicability',
                    perm: ['task.applicability', 'task.single'],
                    children: [
                        { text: 'Set Recurrence Task', path: '/admin/task-applicability', perm: 'task.applicability' },
                        { text: 'Start Single Task', path: '/admin/task-applicability?single=true', perm: 'task.single' },
                    ]
                },
                {
                    text: 'Task Approval',
                    perm: ['task.approve'],
                    children: [
                        { text: 'Task Approval', path: '/admin/tasks/approval', perm: 'task.approve' },
                        { text: 'Approved Task List', path: '/admin/tasks/approved-list', perm: 'task.approve' },
                        { text: 'Update Approved Task', path: '/admin/tasks/update-approved', perm: 'task.approve' },
                    ]
                },
                {
                    text: 'Transfer Task',
                    perm: ['task.transfer'],
                    children: [
                        { text: 'Transfer Single Task', path: '/admin/tasks/transfer-single', perm: 'task.transfer' },
                        { text: 'Transfer All Task', path: '/admin/tasks/transfer-all', perm: 'task.transfer' },
                    ]
                },
                { text: 'Task Cycle Detail', path: '/admin/tasks/cycle-detail', perm: 'task.view' },
                { text: 'Task Information', path: '/admin/tasks/information', perm: 'task.information' },
                { text: 'All Task Update', path: '/admin/tasks/all-update', perm: 'task.view' },
                { text: 'Ongoing Task', path: '/admin/tasks/ongoing', perm: 'task.view' },
                { text: 'UDIN List', path: '/admin/tasks/udin-list', perm: 'task.udin' },
            ]
        },
        { text: 'DSC Management', icon: <GppGoodIcon />, path: '/admin/dsc' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/admin/billing' },
        { text: 'Upload Files', icon: <UploadIcon />, path: '/admin/upload' },
        { text: 'Manage Files', icon: <FolderIcon />, path: '/admin/files' },
        { text: 'File Register', icon: <InventoryIcon />, path: '/admin/fileregister' },
        ...(isAdmin ? [{ text: 'Email Configuration', icon: <EmailIcon />, path: '/admin/email-settings' }] : []),
    ], [isAdmin]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Auto-open active menus
    React.useEffect(() => {
        const fullPath = `${location.pathname}${location.search}`;
        
        setOpenMenus(prev => {
            const newOpenMenus: { [key: string]: boolean } = { ...prev };
            let changed = false;

            menuItems.forEach(item => {
                if (item.children) {
                    const isActive = item.children.some(c => 
                        fullPath === c.path || (c.children && c.children.some(sc => fullPath === sc.path))
                    );
                    if (isActive && !newOpenMenus[item.text]) {
                        newOpenMenus[item.text] = true;
                        changed = true;
                    }
                    
                    item.children.forEach(child => {
                        if (child.children) {
                            const isChildActive = child.children.some(sc => fullPath === sc.path);
                            if (isChildActive && !newOpenMenus[child.text]) {
                                newOpenMenus[child.text] = true;
                                changed = true;
                            }
                        }
                    });
                }
            });

            return changed ? newOpenMenus : prev;
        });
    }, [location.pathname, location.search, menuItems]);

    const handleMenuItemClick = (path: string) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sidebar Header (Logo / Brand) */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <img src="/faviconca.webp" alt="Logo" style={{ width: 32, height: 32, marginRight: '12px', objectFit: 'contain' }} />
                <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a' }}>
                    {companyName}
                </Typography>
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none', px: 1 }}>
                <List>
                    {menuItems.map((item) => (
                        <React.Fragment key={item.text}>
                            {item.children ? (
                                <>
                                    <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
                                        <ListItemButton
                                            onClick={() => handleMenuToggle(item.text)}
                                            sx={{
                                                borderRadius: '24px',
                                                py: 1,
                                                color: '#333',
                                                '&:hover': { background: 'rgba(255,255,255,0.4)' },
                                                ...(item.children.some(c => `${location.pathname}${location.search}` === c.path || (c.children && c.children.some(sc => `${location.pathname}${location.search}` === sc.path))) && {
                                                    background: '#ffffff',
                                                    color: '#000',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                    '& .MuiListItemIcon-root': {
                                                        color: '#000',
                                                    },
                                                }),
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                                            {openMenus[item.text] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                                        </ListItemButton>
                                    </ListItem>
                                    <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.children.map((child: MenuItemDef) => (
                                                <React.Fragment key={child.text}>
                                                    {child.children ? (
                                                        <>
                                                            <ListItem disablePadding sx={{ mb: 0.5, pl: 3, pr: 1 }}>
                                                                <ListItemButton
                                                                    onClick={() => handleMenuToggle(child.text)}
                                                                    selected={child.children.some(sc => `${location.pathname}${location.search}` === sc.path)}
                                                                    sx={{ 
                                                                        py: 0.6, 
                                                                        borderRadius: 1.5,
                                                                        '&.Mui-selected': {
                                                                            bgcolor: 'rgba(255, 255, 255, 0.5)',
                                                                            color: '#000',
                                                                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.6)' }
                                                                        }
                                                                    }}
                                                                >
                                                                    <ListItemText primary={child.text} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }} />
                                                                    {openMenus[child.text] ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                                                                </ListItemButton>
                                                            </ListItem>
                                                            <Collapse in={openMenus[child.text]} timeout="auto" unmountOnExit>
                                                                <List component="div" disablePadding>
                                                                    {child.children!.map((subChild: MenuItemDef) => (
                                                                        <ListItem key={subChild.text} disablePadding sx={{ mb: 0.5, pl: 5, pr: 1 }}>
                                                                            <ListItemButton
                                                                                selected={`${location.pathname}${location.search}` === subChild.path}
                                                                                onClick={() => handleMenuItemClick(subChild.path!)}
                                                                                sx={{
                                                                                    py: 0.6,
                                                                                    borderRadius: '24px',
                                                                                    color: '#444',
                                                                                    '&:hover': { background: 'rgba(255,255,255,0.4)' },
                                                                                    '&.Mui-selected': {
                                                                                        background: '#ffffff',
                                                                                        color: '#000',
                                                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                                                        '&:hover': { background: '#ffffff' },
                                                                                    },
                                                                                }}
                                                                            >
                                                                                <ListItemText primary={subChild.text} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }} />
                                                                            </ListItemButton>
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Collapse>
                                                        </>
                                                    ) : (
                                                        <ListItem disablePadding sx={{ mb: 0.5, pl: 3, pr: 1 }}>
                                                            <ListItemButton
                                                                selected={`${location.pathname}${location.search}` === child.path}
                                                                onClick={() => handleMenuItemClick(child.path!)}
                                                                sx={{
                                                                    py: 0.6,
                                                                    borderRadius: '24px',
                                                                    color: '#444',
                                                                    '&:hover': { background: 'rgba(255,255,255,0.4)' },
                                                                    '&.Mui-selected': {
                                                                        background: '#ffffff',
                                                                        color: '#000',
                                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                                        '&:hover': {
                                                                            background: '#ffffff',
                                                                        },
                                                                    },
                                                                }}
                                                            >
                                                                <ListItemText primary={child.text} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }} />
                                                            </ListItemButton>
                                                        </ListItem>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </Collapse>
                                </>
                            ) : (
                                <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
                                    <ListItemButton
                                        selected={`${location.pathname}${location.search}` === item.path}
                                        onClick={() => handleMenuItemClick(item.path!)}
                                        sx={{
                                            borderRadius: '24px',
                                            py: 1,
                                            color: '#333',
                                            '&:hover': { background: 'rgba(255,255,255,0.4)' },
                                            '&.Mui-selected': {
                                                background: '#ffffff',
                                                color: '#000',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                '& .MuiListItemIcon-root': {
                                                    color: '#000',
                                                },
                                                '&:hover': {
                                                    background: '#ffffff',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Box>

            {/* Account Settings at Bottom */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { background: 'rgba(0,0,0,0.02)' } }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
                    sx={{ width: 36, height: 36, bgcolor: '#222', color: '#ffffff', fontWeight: 'bold', fontSize: '0.875rem' }}
                >
                    {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
                <Box sx={{ ml: 1.5, flexGrow: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {user?.name || user?.username}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: '#666', textTransform: 'capitalize' }}>
                        {user?.role?.toLowerCase() || 'User'}
                    </Typography>
                </Box>
            </Box>
             <AccountMenu
                anchorEl={anchorEl}
                open={anchorEl !== null}
                onClose={() => setAnchorEl(null)}
                user={user}
                logout={logout}
                remainingTime={remainingTime}
            />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Mobile Only AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    display: { xs: 'flex', md: 'none' },
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: '#ffffff',
                    color: '#1a1a1a',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="Open sidebar menu"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <img src="/faviconca.webp" alt="Logo" style={{ width: 28, height: 28, marginLeft: '8px', objectFit: 'contain' }} />
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'linear-gradient(180deg, #e3f0ef 0%, #f4f7f8 100%)',
                        borderRight: 'none',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'linear-gradient(180deg, #e3f0ef 0%, #f4f7f8 100%)',
                        borderRight: 'none',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, sm: 2.5, md: 3 },
                    background: '#f5f7fa',
                    minHeight: '100vh',
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <Toolbar sx={{ display: { md: 'none' } }} />
                <Outlet />
            </Box>
        </Box>
    );
};
