import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme,
    Avatar,
    Tooltip,
    Collapse,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    CloudUpload as UploadIcon,
    Folder as FolderIcon,
    Logout as LogoutIcon,
    AccountBalance,
    NotificationsActive as ReminderIcon,
    Receipt as ReceiptIcon,
    Menu as MenuIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    Inventory as InventoryIcon,
    Assignment as AssignmentIcon,
    ExpandLess,
    ExpandMore,
    Business as BusinessIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';
import firmService from '../services/firmService';
import { useQuery } from '@tanstack/react-query';

const drawerWidth = 240;

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin, remainingTime } = useAuth();
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

    const menuItems = [
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
            ]
        },
        { text: 'Tasks', icon: <AssignmentIcon />, path: '/admin/tasks' },
        { text: 'Reminders', icon: <ReminderIcon />, path: '/admin/reminders' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/admin/billing' },
        { text: 'Upload Files', icon: <UploadIcon />, path: '/admin/upload' },
        { text: 'Manage Files', icon: <FolderIcon />, path: '/admin/files' },
        { text: 'File Register', icon: <InventoryIcon />, path: '/admin/fileregister' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                            sx={{
                                height: 32,
                                width: 'auto',
                                mr: 2,
                                display: { xs: 'none', sm: 'block' },
                                borderRadius: 1,
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
                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={anchorEl !== null}
                        onClose={() => setAnchorEl(null)}
                        onClick={() => setAnchorEl(null)}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.1))',
                                mt: 1.5,
                                width: 240,
                                borderRadius: 3,
                                border: '1px solid rgba(0,0,0,0.08)',
                                '&:before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor: 'background.paper',
                                    transform: 'translateY(-50%) rotate(45deg)',
                                    zIndex: 0,
                                    borderLeft: '1px solid rgba(0,0,0,0.08)',
                                    borderTop: '1px solid rgba(0,0,0,0.08)',
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {/* Simplified Clean Header */}
                        <Box sx={{ px: 2.5, py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, color: 'text.primary' }}>
                                        {user?.name || user?.username}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                                        {user?.role}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    ml: 1,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 1.5,
                                    bgcolor: remainingTime < 300 ? 'rgba(211, 47, 47, 0.08)' : 'rgba(102, 126, 234, 0.08)',
                                    color: remainingTime < 300 ? 'error.main' : 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                        {formatTime(remainingTime)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Divider sx={{ opacity: 0.6 }} />

                        <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/profile'); }} sx={{ py: 1.2, my: 0.5, mx: 1, borderRadius: 2 }}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Settings</Typography>
                        </MenuItem>

                        <MenuItem onClick={handleLogout} sx={{ py: 1.2, mb: 0.5, mx: 1, borderRadius: 2, color: 'error.main' }}>
                            <ListItemIcon sx={{ color: 'error.main' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
                        </MenuItem>
                    </Menu>
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
