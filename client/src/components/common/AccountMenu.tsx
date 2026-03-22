import React from 'react';
import { 
    Box, 
    Typography, 
    Divider, 
    Avatar, 
    Menu, 
    MenuItem, 
    ListItemIcon,
    Stack,
    Switch,
    alpha
} from '@mui/material';
import {
    PersonOutline as PersonIcon,
    SettingsOutlined as SettingsIcon,
    HelpOutline as HelpIcon,
    LogoutOutlined as LogoutIcon,
    Star as StarIcon,
    ExtensionOutlined as IntegrationsIcon,
    GroupsOutlined as CommunityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface AccountMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    user: any;
    logout: () => void;
    remainingTime?: number;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ 
    anchorEl, 
    open, 
    onClose, 
    user, 
    logout,
    remainingTime
}) => {
    const navigate = useNavigate();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLogout = () => {
        onClose();
        logout();
        navigate('/login');
    };

    const getProfilePath = () => {
        if (user?.role === 'SUPER_ADMIN') return '/super-admin/profile';
        if (user?.role === 'CLIENT') return '/client/profile';
        return '/admin/profile';
    };

    return (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={onClose}
            onClick={onClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.1))',
                    mt: 1.5,
                    width: 300,
                    borderRadius: '24px',
                    border: '1px solid rgba(0,0,0,0.04)',
                    p: 1.5,
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
        >
            {/* Header section */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                    sx={{ 
                        width: 48, 
                        height: 48, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 10px rgba(118, 75, 162, 0.2)'
                    }}
                >
                    {(user?.name || user?.username)?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        {user?.name || user?.username}
                    </Typography>
                    <Typography variant="caption" noWrap color="text.secondary" sx={{ fontWeight: 500, display: 'block', opacity: 0.7 }}>
                        {user?.email || `${user?.username}@firm.com`}
                    </Typography>
                </Box>
            </Box>

            {/* Upgrade Banner */}
            <Box sx={{ 
                mx: 1, 
                mb: 2, 
                mt: 1,
                p: 1.5, 
                borderRadius: '16px',
                background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #f43f5e 100%)',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        p: 0.5, 
                        borderRadius: '8px',
                        display: 'flex'
                    }}>
                        <StarIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Upgrade profile</Typography>
                </Box>
                <Box sx={{ 
                    bgcolor: 'white', 
                    color: 'black', 
                    px: 1, 
                    py: 0.2, 
                    borderRadius: '8px',
                    fontSize: '0.65rem',
                    fontWeight: 900
                }}>
                    PRO
                </Box>
            </Box>

            <Stack spacing={0.5}>
                <MenuItem onClick={() => { onClose(); navigate(getProfilePath()); }} sx={{ borderRadius: '12px', py: 1 }}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>User Profile</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => { onClose(); toast.success('Integrations coming soon!'); }} sx={{ borderRadius: '12px', py: 1 }}>
                    <ListItemIcon>
                        <IntegrationsIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Integrations</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => { onClose(); navigate(getProfilePath()); }} sx={{ borderRadius: '12px', py: 1 }}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Settings</Typography>
                </MenuItem>

                <MenuItem onClick={() => { onClose(); toast.success('Community feature coming soon!'); }} sx={{ borderRadius: '12px', py: 1 }}>
                    <ListItemIcon>
                        <CommunityIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Community</Typography>
                </MenuItem>

                <MenuItem onClick={() => { onClose(); navigate('/contact'); }} sx={{ borderRadius: '12px', py: 1 }}>
                    <ListItemIcon>
                        <HelpIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Help Center</Typography>
                </MenuItem>

                {/* Dark Mode Toggle placeholder */}
                <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                            <SettingsIcon fontSize="small" sx={{ opacity: 0.6 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Dark Mode</Typography>
                    </Stack>
                    <Switch size="small" disabled />
                </Box>
            </Stack>

            <Divider sx={{ my: 1.5, opacity: 0.1 }} />

            {/* Logout section */}
            <Box sx={{ px: 0.5 }}>
                <MenuItem 
                    onClick={handleLogout} 
                    sx={{ 
                        borderRadius: '16px', 
                        py: 1.5,
                        bgcolor: alpha('#ef4444', 0.08),
                        color: '#ef4444',
                        '&:hover': {
                            bgcolor: alpha('#ef4444', 0.12),
                        }
                    }}
                >
                    <ListItemIcon sx={{ color: '#ef4444' }}>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>Logout Profile</Typography>
                    {remainingTime !== undefined && (
                         <Box sx={{ ml: 'auto', px: 1, py: 0.2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                {formatTime(remainingTime)}
                            </Typography>
                         </Box>
                    )}
                </MenuItem>
            </Box>
        </Menu>
    );
};

export default AccountMenu;
