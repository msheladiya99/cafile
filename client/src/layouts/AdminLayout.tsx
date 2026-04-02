import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import UploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import AccountBalance from '@mui/icons-material/AccountBalance';
import ReminderIcon from '@mui/icons-material/NotificationsActive';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MenuIcon from '@mui/icons-material/Menu';
import ReportsIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import GppGoodIcon from '@mui/icons-material/GppGood';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';
import firmService from '../services/firmService';
import { useQuery } from '@tanstack/react-query';
import AccountMenu from '../components/common/AccountMenu';

const drawerWidth = 240;

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin, isStaffMember, isIntern, remainingTime } = useAuth();
    const isEmployee = isStaffMember || isIntern;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    // Fetch firm details and settings using React Query
    const { data: firm } = useQuery({
        queryKey: ['firm'],
        queryFn: firmService.getFirm,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: settingsService.getSettings,
        staleTime: 5 * 60 * 1000,
    });

    const companyName = firm?.firmName || settings?.companyName || 'CA Admin Panel';
    const logoUrl = (firm?.showLogo !== false && (firm?.logoUrl || settings?.logoUrl)) ? (firm?.logoUrl || settings?.logoUrl) : null;
    const handleMenuToggle = (text: string) => {
        setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
    };



    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Employee-only sidebar (STAFF / INTERN): stripped-down view
    const employeeMenuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
        {
            text: 'Task',
            icon: <AssignmentIcon />,
            children: [
                { text: 'Task Dashboard', path: '/admin/tasks' },
                { text: 'Ongoing Task', path: '/admin/tasks/ongoing' },
            ]
        },
        {
            text: 'Employee',
            icon: <PersonIcon />,
            children: [
                { text: 'Emp Task Schedule', path: '/admin/employee/tasks' },
                {
                    text: 'Time Sheet',
                    children: [
                        { text: 'Entry Wise', path: '/admin/employee/timesheet/entry' },
                        { text: 'Subtask Wise', path: '/admin/employee/timesheet/subtask' },
                        { text: 'Task Wise', path: '/admin/employee/timesheet/task' },
                    ]
                },
                {
                    text: 'Emp Attendance',
                    children: [
                        { text: 'Add Attendance', path: '/admin/employee/attendance/add' },
                        { text: 'Attendance List', path: '/admin/employee/attendance/list' },
                    ]
                },
            ]
        },
    ];

    const menuItems = isEmployee ? employeeMenuItems : [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
        ...(isAdmin ? [{ text: 'Firm Master', icon: <BusinessIcon />, path: '/admin/firm-master' }] : []),
        { text: 'Reports', icon: <ReportsIcon />, path: '/admin/reports' },
        {
            text: 'Client',
            icon: <PeopleIcon />,
            children: [
                { text: 'Add Group + List', path: '/admin/client/add-group' },
                { text: 'Client Master', path: '/admin/client/master' },
                { text: 'Client List', path: '/admin/client/list' },
                { text: 'Client Contact Detail', path: '/admin/client/contact-detail' },
                ...(isAdmin ? [{ text: 'Client Ledger', path: '/admin/client-ledger' }] : []),
            ]
        },
        {
            text: 'Employee',
            icon: <PersonIcon />,
            children: [
                { text: 'Employee Master', path: '/admin/employee/master' },
                { text: 'Employee List', path: '/admin/employee/list' },
                { text: 'Emp Task Schedule', path: '/admin/employee/tasks' },
                {
                    text: 'Time Sheet',
                    children: [
                        { text: 'Entry Wise', path: '/admin/employee/timesheet/entry' },
                        { text: 'Subtask Wise', path: '/admin/employee/timesheet/subtask' },
                        { text: 'Task Wise', path: '/admin/employee/timesheet/task' },
                    ]
                },
                { text: 'Free Employee List', path: '/admin/employee/free-list' },
                { text: 'Employee Login Detail', path: '/admin/employee/login-detail' },
                {
                    text: 'Emp Attendance',
                    children: [
                        { text: 'Add Attendance', path: '/admin/employee/attendance/add' },
                        { text: 'Attendance List', path: '/admin/employee/attendance/list' },
                    ]
                },
                { text: 'Form 108', path: '/admin/employee/form108' },
            ]
        },
        {
            text: 'Task',
            icon: <AssignmentIcon />,
            children: [
                { text: 'Task Dashboard', path: '/admin/tasks' },
                {
                    text: 'Task Master',
                    children: [
                        { text: 'Add Task', path: '/admin/task-master/add' },
                        { text: 'Task List', path: '/admin/task-master/list' },
                        { text: 'Task Category', path: '/admin/task-category' },
                    ]
                },
                {
                    text: 'Task Applicability',
                    children: [
                        { text: 'Set Recurrence Task', path: '/admin/task-applicability' },
                        { text: 'Start Single Task', path: '/admin/task-applicability?single=true' },
                    ]
                },
                {
                    text: 'Task Approval',
                    children: [
                        { text: 'Task Approval', path: '/admin/tasks/approval' },
                        { text: 'Approved Task List', path: '/admin/tasks/approved-list' },
                        { text: 'Update Approved Task', path: '/admin/tasks/update-approved' },
                    ]
                },
                {
                    text: 'Transfer Task',
                    children: [
                        { text: 'Transfer Single Task', path: '/admin/tasks/transfer-single' },
                        { text: 'Transfer All Task', path: '/admin/tasks/transfer-all' },
                    ]
                },
                { text: 'Task Cycle Detail', path: '/admin/tasks/cycle-detail' },
                { text: 'Task Information', path: '/admin/tasks/information' },
                { text: 'All Task Update', path: '/admin/tasks/all-update' },
                { text: 'Ongoing Task', path: '/admin/tasks/ongoing' },
                { text: 'UDIN List', path: '/admin/tasks/udin-list' },
            ]
        },
        { text: 'Reminders', icon: <ReminderIcon />, path: '/admin/reminders' },
        { text: 'DSC Management', icon: <GppGoodIcon />, path: '/admin/dsc' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/admin/billing' },
        { text: 'Upload Files', icon: <UploadIcon />, path: '/admin/upload' },
        { text: 'Manage Files', icon: <FolderIcon />, path: '/admin/files' },
        { text: 'File Register', icon: <InventoryIcon />, path: '/admin/fileregister' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuItemClick = (path: string) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const drawerContent = (
        <>
            <Toolbar />
            <Box sx={{ overflow: 'auto', mt: 2, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                <List>
                    {menuItems.map((item) => (
                        <React.Fragment key={item.text}>
                            {item.children ? (
                                <>
                                    <ListItem disablePadding sx={{ mb: 0.5, px: 1 }}>
                                        <ListItemButton
                                            onClick={() => handleMenuToggle(item.text)}
                                            sx={{
                                                borderRadius: 1.5,
                                                py: 1,
                                                ...(item.children.some(c => location.pathname === c.path) && {
                                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                                                    color: '#667eea',
                                                    '& .MuiListItemIcon-root': {
                                                        color: '#667eea',
                                                    },
                                                }),
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                                            {openMenus[item.text] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                                        </ListItemButton>
                                    </ListItem>
                                    <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.children.map((child: { text: string; path?: string; children?: { text: string; path: string }[] }) => (
                                                <React.Fragment key={child.text}>
                                                    {child.children ? (
                                                        <>
                                                            <ListItem disablePadding sx={{ mb: 0.5, pl: 3, pr: 1 }}>
                                                                <ListItemButton
                                                                    onClick={() => handleMenuToggle(child.text)}
                                                                    sx={{ py: 0.6, borderRadius: 1.5 }}
                                                                >
                                                                    <ListItemText primary={child.text} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }} />
                                                                    {openMenus[child.text] ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                                                                </ListItemButton>
                                                            </ListItem>
                                                            <Collapse in={openMenus[child.text]} timeout="auto" unmountOnExit>
                                                                <List component="div" disablePadding>
                                                                    {child.children.map((subChild: { text: string; path: string }) => (
                                                                        <ListItem key={subChild.text} disablePadding sx={{ mb: 0.5, pl: 5, pr: 1 }}>
                                                                            <ListItemButton
                                                                                selected={location.pathname === subChild.path}
                                                                                onClick={() => handleMenuItemClick(subChild.path)}
                                                                                sx={{
                                                                                    py: 0.6,
                                                                                    borderRadius: 1.5,
                                                                                    '&.Mui-selected': {
                                                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                                        color: 'white',
                                                                                        '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)' },
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
                                                                selected={location.pathname === child.path}
                                                                onClick={() => handleMenuItemClick(child.path!)}
                                                                sx={{
                                                                    py: 0.6,
                                                                    borderRadius: 1.5,
                                                                    '&.Mui-selected': {
                                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                        color: 'white',
                                                                        '&:hover': {
                                                                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
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
                                        selected={location.pathname === item.path}
                                        onClick={() => handleMenuItemClick(item.path!)}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            '&.Mui-selected': {
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                '& .MuiListItemIcon-root': {
                                                    color: 'white',
                                                },
                                                '&:hover': {
                                                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                                    </ListItemButton>
                                </ListItem>
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Box>
        </>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    {logoUrl ? (
                        <Box
                            component="img"
                            src={logoUrl}
                            alt={`${companyName} Logo`}
                            sx={{
                                height: 32,
                                width: 'auto',
                                mr: 2,
                                display: { xs: 'none', sm: 'block' },
                                borderRadius: 1.5,
                                objectFit: 'contain',
                                bgcolor: 'white',
                                p: 0.5
                            }}
                        />
                    ) : (
                        <AccountBalance sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} />
                    )}
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {companyName}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                        {user?.name || user?.username}
                    </Typography>
                    <Tooltip title="Account settings">
                        <IconButton
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            size="small"
                            sx={{ ml: 2 }}
                            aria-controls={anchorEl ? 'account-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={anchorEl ? 'true' : undefined}
                        >
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'white',
                                    color: '#667eea',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'A'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <AccountMenu
                        anchorEl={anchorEl}
                        open={anchorEl !== null}
                        onClose={() => setAnchorEl(null)}
                        user={user}
                        logout={logout}
                        remainingTime={remainingTime}
                    />
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
                        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
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
                        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2, md: 3 },
                    background: '#f5f7fa',
                    minHeight: '100vh',
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` }
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};
