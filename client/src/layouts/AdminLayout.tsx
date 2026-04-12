import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, List, Typography, IconButton,
    ListItem, ListItemButton, ListItemIcon, ListItemText, 
    Avatar, Collapse, Skeleton
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Menu as MenuIcon,
    Assessment as ReportsIcon,
    Inventory as InventoryIcon,
    ExpandLess,
    ExpandMore,
    Business as BusinessIcon,
    Person as PersonIcon,
    GppGood as GppGoodIcon,
    Email as EmailIcon,
    AccountBalance as BankIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';
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
    const { user, logout, isAdmin, remainingTime } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

    const { data: settings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['company-settings'],
        queryFn: settingsService.getSettings,
        staleTime: 10 * 60 * 1000,
    });

    const companyName = settings?.companyName || 'CA Office Portal';

    const handleMenuToggle = (text: string) => {
        setOpenMenus(prev => ({ ...prev, [text]: !prev[text] }));
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };


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
            ]
        },
        {
            text: 'Bank Statement',
            icon: <BankIcon />,
            perm: 'bank_statement.view',
            children: [
                { text: 'Parser Tool', path: '/admin/bank-statement', perm: 'bank_statement.view' },
            ]
        },
        { text: 'Digital Signature', icon: <GppGoodIcon />, path: '/admin/digital-signature', perm: 'digital_signature.view' },
        { text: 'Mailbox', icon: <EmailIcon />, path: '/admin/mailbox', perm: 'mailbox.view' },
        { text: 'Inventory', icon: <InventoryIcon />, path: '/admin/inventory', perm: 'inventory.view' }
    ], [isAdmin]);

    const renderMenuItem = (item: MenuItemDef) => {
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openMenus[item.text] || false;
        const isSelected = item.path ? location.pathname === item.path : false;

        return (
            <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                    <ListItemButton
                        onClick={() => hasChildren ? handleMenuToggle(item.text) : item.path && navigate(item.path)}
                        selected={isSelected}
                        sx={{
                            minHeight: 44,
                            px: 2,
                            borderRadius: '10px',
                            mx: 1,
                            color: isSelected ? 'primary.main' : '#444',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.12)' },
                                '& .MuiListItemIcon-root': { color: 'primary.main' },
                                '& .MuiTypography-root': { fontWeight: 600 },
                            },
                        }}
                    >
                        {item.icon && (
                            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                        )}
                        <ListItemText 
                            primary={item.text} 
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} 
                        />
                        {hasChildren && (isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                    </ListItemButton>
                </ListItem>
                {hasChildren && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 3 }}>
                            {item.children?.map(child => (
                                <ListItemButton
                                    key={child.text}
                                    onClick={() => child.path && navigate(child.path)}
                                    selected={location.pathname === child.path}
                                    sx={{
                                        minHeight: 36,
                                        borderRadius: '8px',
                                        mb: 0.5,
                                        mx: 1,
                                        '&.Mui-selected': {
                                            bgcolor: 'transparent',
                                            color: 'primary.main',
                                            '& .MuiTypography-root': { fontWeight: 600 },
                                        },
                                    }}
                                >
                                    <ListItemText 
                                        primary={child.text} 
                                        primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 400 }} 
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    </Collapse>
                )}
            </React.Fragment>
        );
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, mt: 8 }}>
                <List>
                    {menuItems.map(item => renderMenuItem(item))}
                </List>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }} onClick={(e) => setAnchorEl(e.currentTarget)}>
                 <ListItemButton sx={{ borderRadius: '12px', p: 1 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#2c3e50', fontWeight: 'bold' }}>
                        {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'A'}
                    </Avatar>
                    <Box sx={{ ml: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name || user?.username}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
                    </Box>
                </ListItemButton>
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
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="Open sidebar menu"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                     <img src="/faviconca.webp" alt="Logo" style={{ width: 32, height: 32, marginRight: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: -0.5 }}>
                         {isLoadingSettings ? (
                            <Skeleton 
                                variant="text" 
                                width={200} 
                                animation="wave" 
                                sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }} 
                            />
                        ) : companyName}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' }, opacity: 0.9 }}>
                            Admin Panel
                        </Typography>
                        <Avatar
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{ 
                                width: 36, 
                                height: 36, 
                                bgcolor: 'rgba(255,255,255,0.2)', 
                                color: '#fff', 
                                cursor: 'pointer',
                                border: '2px solid rgba(255,255,255,0.1)',
                                fontSize: '0.875rem',
                                fontWeight: 'bold'
                            }}
                        >
                            {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'A'}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: '#fff',
                        borderRight: 'none',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: '#fff',
                        borderRight: '1px solid rgba(0,0,0,0.08)',
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
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Toolbar />
                <Box sx={{ mt: 2, flexGrow: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};
