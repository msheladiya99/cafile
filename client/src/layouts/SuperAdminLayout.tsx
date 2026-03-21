import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Tooltip,
    Tabs,
    Tab,
    Container,
    Badge,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Search as SearchIcon,
    ChatBubbleOutline as ChatIcon,
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Business as BusinessIcon,
    Subscriptions as SubscriptionsIcon,
    Assessment as ReportsIcon,
    Settings as SettingsIcon,
    VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/super-admin/dashboard' },
        { text: 'Firms', icon: <BusinessIcon />, path: '/super-admin/firms' },
        { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/super-admin/subscriptions' },
        { text: 'Analytics', icon: <ReportsIcon />, path: '/super-admin/analytics' },
        { text: 'Health', icon: <SettingsIcon />, path: '/super-admin/system-health' },
        { text: 'Security', icon: <VpnKeyIcon />, path: '/super-admin/security' },
    ];

    // Find active tab index based on current path - improved to catch subpages
    const currentTabIndex = menuItems.findIndex(item => 
        location.pathname === item.path || (item.path !== '/super-admin/dashboard' && location.pathname.startsWith(item.path))
    );
    const tabValue = currentTabIndex === -1 ? false : currentTabIndex;

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        navigate(menuItems[newValue].path);
    };

    const handleMobileMenuClick = (path: string) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ bgcolor: '#eef2ff', minHeight: '100vh', pb: 10 }}>
            <AppBar 
                position="static" 
                elevation={0} 
                sx={{ 
                    bgcolor: 'transparent', 
                    color: '#1e293b', 
                    pt: 2, 
                    px: { xs: 2, md: 5 } 
                }}
            >
                <Container maxWidth="xl" sx={{ p: '0 !important' }}>
                    <Toolbar sx={{ justifyContent: 'space-between', bgcolor: '#fff', borderRadius: '24px', px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isMobile && (
                                <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                                    <MenuIcon />
                                </IconButton>
                            )}
                            <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                bgcolor: '#6366f1', 
                                borderRadius: '10px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transform: 'rotate(-10deg)',
                                cursor: 'pointer'
                            }} onClick={() => navigate('/super-admin/dashboard')}>
                                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>S</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 1000, color: '#4f46e5', mt: 0.5, letterSpacing: -1 }}>mycafile</Typography>
                        </Box>

                        {!isMobile && (
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange}
                                centered
                                sx={{ 
                                    '& .MuiTabs-indicator': { height: 0 },
                                    '& .MuiTab-root': {
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        color: '#94a3b8',
                                        minWidth: 100,
                                        borderRadius: '14px',
                                        m: 0.5,
                                        transition: 'all 0.2s ease',
                                        '&.Mui-selected': {
                                            bgcolor: '#f1f5f9',
                                            color: '#1e293b'
                                        },
                                        '&:hover': {
                                            color: '#6366f1'
                                        }
                                    }
                                }}
                            >
                                {menuItems.map((item, index) => (
                                    <Tab key={index} label={item.text} />
                                ))}
                            </Tabs>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <IconButton size="small" sx={{ color: '#94a3b8' }}><SearchIcon /></IconButton>
                            <IconButton size="small" sx={{ color: '#94a3b8' }}>
                                <Badge variant="dot" color="error"><ChatIcon /></Badge>
                            </IconButton>
                            <Tooltip title="Admin Account">
                                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                                    <Avatar sx={{ width: 32, height: 32, border: '2px solid #f1f5f9', bgcolor: '#6366f1', fontSize: '0.8rem', fontWeight: 800 }}>S</Avatar>
                                </IconButton>
                            </Tooltip>
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{
                                elevation: 0,
                                sx: { mt: 1.5, minWidth: 200, borderRadius: '20px', filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.08))', overflow: 'visible' }
                            }}
                        >
                            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Super Admin</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>admin@mycafile.in</Typography>
                            </Box>
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', mx: 1, borderRadius: '12px', my: 1 }}>
                                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>Logout</Typography>
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                PaperProps={{ sx: { width: 280, borderRadius: '0 32px 32px 0', p: 2 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, px: 1 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff', fontWeight: 900 }}>S</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -1 }}>mycafile</Typography>
                </Box>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton 
                                onClick={() => handleMobileMenuClick(item.path)}
                                selected={location.pathname.startsWith(item.path)}
                                sx={{ borderRadius: '12px', '&.Mui-selected': { bgcolor: '#f1f5f9', color: '#1e293b' } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 800, fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Box sx={{ mt: 'auto', p: 2, bgcolor: '#f8fafc', borderRadius: '16px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', display: 'block', mb: 1 }}>SESSION TIME</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: 'monospace', color: '#6366f1' }}>{formatTime(remainingTime)}</Typography>
                </Box>
            </Drawer>

            <Container maxWidth="xl" sx={{ mt: 2 }}>
                <Box sx={{ 
                    bgcolor: '#fff', 
                    borderRadius: '48px', 
                    minHeight: '85vh',
                    p: { xs: 2.5, md: 6 },
                    boxShadow: '0 20px 60px rgba(0,0,0,0.02)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Background decorative shapes like Sheeld */}
                    <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', bgcolor: '#f5f3ff', zIndex: 0 }} />
                    <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', bgcolor: '#eff6ff', zIndex: 0 }} />

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                            <Box sx={{ 
                                bgcolor: '#f8fafc', 
                                px: 2.5, 
                                py: 1, 
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                border: '1px solid #f1f5f9'
                            }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 2s infinite' }} />
                                <Typography variant="caption" sx={{ fontWeight: 900, color: '#475569', letterSpacing: 1.5 }}>
                                    SECURE SESSION: {formatTime(remainingTime)}
                                </Typography>
                            </Box>
                        </Box>
                        <Outlet />
                    </Box>
                </Box>
            </Container>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </Box>
    );
};
