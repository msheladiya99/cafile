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
    CssBaseline,
    Avatar,
    Tooltip,
    Skeleton
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Folder as FolderIcon,
    Receipt as ReceiptIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    AccountBalance,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import settingsService from '../services/settingsService';
import { Helmet } from 'react-helmet-async';

const drawerWidth = 260;

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ClientLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, remainingTime } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [companyName, setCompanyName] = useState<string>('CA Office Portal');
    const [loadingName, setLoadingName] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await settingsService.getSettings();
                if (settings && settings.companyName) {
                    setCompanyName(settings.companyName);
                }
            } catch (error) {
                console.error('Failed to load company name', error);
            } finally {
                setLoadingName(false);
            }
        };
        fetchSettings();
    }, []);
    // ... (rest of the file until the header section)

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

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/client/dashboard' },
        { text: 'My Documents', icon: <FolderIcon />, path: '/client/files' },
        { text: 'My Invoices', icon: <ReceiptIcon />, path: '/client/invoices' },

    ];

    const drawer = (
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
                                <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'text.secondary', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
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
            <Helmet>
                <title>{companyName ? `${companyName} | Secure Client Portal` : 'CA Client Portal | Secure Document Access'}</title>
                <meta name="description" content="View your important invoices, files, and documents securely through the Client Portal." />
            </Helmet>
            <CssBaseline />
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
                    <AccountBalance sx={{ mr: 2 }} />
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {loadingName ? <Skeleton width={200} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : companyName}
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
                                {(user?.name || user?.username)?.charAt(0).toUpperCase() || 'U'}
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

                        <MenuItem onClick={() => navigate('/client/profile')} sx={{ py: 1.2, my: 0.5, mx: 1, borderRadius: 2 }}>
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
                {drawer}
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
                        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
                    },
                }}
            >
                {drawer}
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
