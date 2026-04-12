import React, { useState, useEffect } from 'react';
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
    Menu as MenuIcon,
    AccountBalance,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AccountMenu from '../components/common/AccountMenu';
import settingsService from '../services/settingsService';
import { Helmet } from 'react-helmet-async';

const drawerWidth = 260;



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
