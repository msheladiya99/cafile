import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Group as GroupIcon,
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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';

const drawerWidth = 260;

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isAdmin } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [companyName, setCompanyName] = useState('CA Admin Panel');

    // Fetch company name from settings
    useEffect(() => {
        const fetchCompanyName = async () => {
            try {
                const settings = await settingsService.getSettings();
                if (settings.companyName) {
                    setCompanyName(settings.companyName);
                }
            } catch (error) {
                console.error('Error fetching company name:', error);
            }
        };
        fetchCompanyName();
    }, []);



    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
        { text: 'Reports', icon: <ReportsIcon />, path: '/admin/reports' },
        { text: 'Clients', icon: <PeopleIcon />, path: '/admin/clients' },
        ...(isAdmin ? [{ text: 'Staff', icon: <GroupIcon />, path: '/admin/staff' }] : []),


        { text: 'Reminders', icon: <ReminderIcon />, path: '/admin/reminders' },
        { text: 'Billing', icon: <ReceiptIcon />, path: '/admin/billing' },
        { text: 'Upload Files', icon: <UploadIcon />, path: '/admin/upload' },
        { text: 'Manage Files', icon: <FolderIcon />, path: '/admin/files' },
        { text: 'File Register', icon: <InventoryIcon />, path: '/admin/fileregister' },
        ...(isAdmin ? [{ text: 'Company Settings', icon: <SettingsIcon />, path: '/admin/settings' }] : []),
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
            <Box sx={{ overflow: 'auto', mt: 2 }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => handleMenuItemClick(item.path)}
                                sx={{
                                    borderRadius: 2,
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
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
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
                    <AccountBalance sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                width: 220,
                                borderRadius: 2,
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
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                                {user?.name || user?.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {user?.role}
                            </Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/profile'); }} sx={{ py: 1.5 }}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            Settings
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
                            <ListItemIcon sx={{ color: 'error.main' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Logout
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
