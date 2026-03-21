import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
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
    Business as BusinessIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    Subscriptions as SubscriptionsIcon,
    VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SuperAdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, remainingTime } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/super-admin/dashboard' },
        { text: 'Firm Management', icon: <BusinessIcon />, path: '/super-admin/firms' },
        { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/super-admin/subscriptions' },
        { text: 'Global Analytics', icon: <ReportsIcon />, path: '/super-admin/analytics' },
        { text: 'System Health', icon: <SettingsIcon />, path: '/super-admin/system-health' },
        { text: 'Security', icon: <VpnKeyIcon />, path: '/super-admin/security' },
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
                                    borderRadius: 1.5,
                                    py: 1,
                                    '&.Mui-selected': {
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                        color: 'white',
                                        '& .MuiListItemIcon-root': {
                                            color: 'white',
                                        },
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
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
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', // Distinct Indigo/Blue theme for Super Admin
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
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800 }}>
                        MY CA FILE | SUPER ADMIN
                    </Typography>

                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.15)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        mr: 2
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                            SECURE SESSION: {formatTime(remainingTime)}
                        </Typography>
                    </Box>

                    <Tooltip title="Admin Account">
                        <IconButton
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            size="small"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#4f46e5', fontWeight: 'bold' }}>
                                S
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.1))',
                                mt: 1.5,
                                width: 200,
                                borderRadius: 2
                            }
                        }}
                    >
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <ListItemIcon sx={{ color: 'error.main' }}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#fafafa',
                        borderRight: '1px solid rgba(0,0,0,0.05)'
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    bgcolor: '#f4f6f8',
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};
