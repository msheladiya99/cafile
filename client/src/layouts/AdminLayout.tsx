import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, IconButton, 
    ListItem, ListItemButton, ListItemIcon, ListItemText, 
    useMediaQuery, Avatar, Collapse, useTheme, Fab, Fade
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Folder as FolderIcon,
    Receipt as ReceiptIcon,
    Menu as MenuIcon,
    Assessment as ReportsIcon,
    Assignment as AssignmentIcon,
    ExpandLess,
    ExpandMore,
    Business as BusinessIcon,
    Person as PersonIcon,
    GppGood as GppGoodIcon,
    Email as EmailIcon,
    AccountBalance as BankIcon,
    Gavel as GavelIcon,
    AccountBalanceWallet as WalletIcon,
    AutoAwesome as AssistantIcon,
    KeyboardArrowUp as UpIcon,
    NotificationsActive as RemindersIcon,
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
    const { user, logout, isAdmin, remainingTime, hasPermission, hasAnyPermission } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        const checkScrollTop = () => {
            if (!showScroll && window.scrollY > 300) {
                setShowScroll(true);
            } else if (showScroll && window.scrollY <= 300) {
                setShowScroll(false);
            }
        };
        window.addEventListener('scroll', checkScrollTop);
        return () => window.removeEventListener('scroll', checkScrollTop);
    }, [showScroll]);

    const scrollTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const companyName = 'CA Admin Panel';

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Helper: check if a menu item is visible for the current user
    const isItemVisible = React.useCallback((item: MenuItemDef): boolean => {
        // Admins & Super Admins see everything
        if (isAdmin) return true;
        // No perm restriction → visible to all staff
        if (!item.perm) return true;
        // Single perm
        if (typeof item.perm === 'string') return hasPermission(item.perm);
        // Array of perms — visible if user has ANY
        return hasAnyPermission(item.perm);
    }, [isAdmin, hasPermission, hasAnyPermission]);

    const rawMenuItems = React.useMemo(() => [
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
            perm: ['employee.view', 'employee.add', 'employee.edit', 'employee.delete', 'employee.attendance', 'employee.timesheet'],
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
                    perm: ['task.master.view', 'task.master.create', 'task.master.edit', 'task.master.delete'],
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
                { text: 'Ongoing Task', path: '/admin/tasks/ongoing', perm: 'task.view' },
                { text: 'UDIN List', path: '/admin/tasks/udin-list', perm: 'task.udin' },
            ]
        },
        { text: 'DSC Management', icon: <GppGoodIcon />, path: '/admin/dsc', perm: 'dsc.view' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/admin/billing', perm: 'billing.view' },
        {
            text: 'Files & Documents',
            icon: <FolderIcon />,
            perm: ['files.view', 'files.upload', 'files.register'],
            children: [
                { text: 'Upload Files', path: '/admin/upload', perm: 'files.upload' },
                { text: 'Manage Files', path: '/admin/files', perm: 'files.view' },
                { text: 'File Register', path: '/admin/fileregister', perm: 'files.register' },
            ]
        },
        { text: 'Reminders', icon: <RemindersIcon />, path: '/admin/reminders', perm: 'reminders.view' },
        ...(isAdmin ? [{ text: 'Email Configuration', icon: <EmailIcon />, path: '/admin/email-settings' }] : []),
        {
            text: 'Bank Statement',
            icon: <BankIcon />,
            perm: ['bankstatement.view', 'bankstatement.history'],
            children: [
                { text: 'Bank Statement → Excel', path: '/admin/bank-statement', perm: 'bankstatement.view' },
                { text: 'Statement History', path: '/admin/bank-statement/history', perm: 'bankstatement.history' },
            ]
        },
        { text: 'Expenses', icon: <WalletIcon />, path: '/admin/expenses', perm: 'expenses.view' },
        { text: 'Notice Reply AI', icon: <GavelIcon />, path: '/admin/notice-reply', perm: 'notices.view' },
        { text: 'CA Assistant AI', icon: <AssistantIcon />, path: '/admin/assistant', perm: 'assistant.view' },
    ], [isAdmin]);

    // Filter menu items (and their children) based on user permissions
    const filterMenuItems = React.useCallback((items: MenuItemDef[]): MenuItemDef[] => {
        return items
            .filter(isItemVisible)
            .map(item => {
                if (!item.children) return item;
                const visibleChildren = item.children
                    .filter(isItemVisible)
                    .map(child => {
                        if (!child.children) return child;
                        const visibleSubChildren = child.children.filter(isItemVisible);
                        return { ...child, children: visibleSubChildren };
                    })
                    .filter(child => !child.children || child.children.length > 0);
                return { ...item, children: visibleChildren };
            })
            .filter(item => !item.children || item.children.length > 0);
    }, [isItemVisible]);

    const menuItems = React.useMemo(
        () => filterMenuItems(rawMenuItems),
        [rawMenuItems, filterMenuItems]
    );

    // Collect all descendant menu-key names (for nested dropdowns)
    const getAllDescendantKeys = React.useCallback((items: MenuItemDef[]): string[] => {
        const keys: string[] = [];
        for (const item of items) {
            if (item.children) {
                keys.push(item.text);
                keys.push(...getAllDescendantKeys(item.children));
            }
        }
        return keys;
    }, []);

    const handleMenuToggle = React.useCallback((text: string) => {
        setOpenMenus(prev => {
            // If already open → just close it (and collapse all its nested children)
            if (prev[text]) {
                // Find this item's children in the tree and close them too
                const findItem = (items: MenuItemDef[]): MenuItemDef | null => {
                    for (const item of items) {
                        if (item.text === text) return item;
                        if (item.children) {
                            const found = findItem(item.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const target = findItem(menuItems);
                const keysToClose = [text, ...(target?.children ? getAllDescendantKeys(target.children) : [])];
                const next = { ...prev };
                keysToClose.forEach(k => { next[k] = false; });
                return next;
            }

            // Opening: find which top-level parent this item belongs to,
            // close ALL siblings of that parent (and their descendants).
            const findTopLevelParent = (items: MenuItemDef[], target: string): string | null => {
                for (const item of items) {
                    if (item.text === target) return item.text; // it IS top-level
                    if (item.children) {
                        const found = item.children.some(c => {
                            if (c.text === target) return true;
                            return c.children?.some(sc => sc.text === target);
                        });
                        if (found) return item.text;
                    }
                }
                return null;
            };

            const topLevelParentText = findTopLevelParent(menuItems, text);
            const next = { ...prev };

            // Close all other top-level dropdowns and their descendants
            menuItems.forEach(item => {
                if (item.children && item.text !== topLevelParentText) {
                    // Close this sibling and all its nested dropdowns
                    const keysToClose = [item.text, ...getAllDescendantKeys(item.children)];
                    keysToClose.forEach(k => { next[k] = false; });
                }
            });

            next[text] = true;
            return next;
        });
    }, [menuItems, getAllDescendantKeys]);


    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Keep a stable ref to menuItems so the auto-open effect can read it
    // without having it as a reactive dependency (which caused re-open loops)
    const menuItemsRef = React.useRef(menuItems);
    menuItemsRef.current = menuItems;

    // Track the last path that triggered auto-open so we don't re-run on
    // user-initiated toggles (which don't change the path)
    const lastAutoOpenedPath = React.useRef('');

    // Auto-open active menus — ONLY when the URL path changes (navigation)
    React.useEffect(() => {
        const fullPath = `${location.pathname}${location.search}`;

        // Skip if this path was already processed — prevents re-opening when
        // the user manually closes a dropdown while staying on the same page
        if (fullPath === lastAutoOpenedPath.current) return;
        lastAutoOpenedPath.current = fullPath;

        setOpenMenus(prev => {
            const newOpenMenus: { [key: string]: boolean } = { ...prev };
            let changed = false;

            menuItemsRef.current.forEach(item => {
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
    }, [location.pathname, location.search]); // ← intentionally excludes menuItems

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
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                        {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')} left
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

            <Fade in={showScroll}>
                <Fab 
                    color="primary" 
                    size="small" 
                    onClick={scrollTop}
                    aria-label="scroll back to top"
                    sx={{ 
                        position: 'fixed', 
                        bottom: 30, 
                        right: 30, 
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                        bgcolor: '#6366f1',
                        '&:hover': { bgcolor: '#4f46e5' }
                    }}
                >
                    <UpIcon />
                </Fab>
            </Fade>
        </Box>
    );
};
