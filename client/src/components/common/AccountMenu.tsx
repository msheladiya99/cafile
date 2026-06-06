import React from 'react';
import { 
    Box, 
    Typography, 
    Divider, 
    Menu, 
    MenuItem, 
    ListItemIcon,
    Stack,
    Avatar,
    alpha
} from '@mui/material';
import {
    SettingsOutlined as SettingsIcon,
    CreditCardOutlined as BillingIcon,
    StarBorderOutlined as PlansIcon,
    LogoutOutlined as SignOutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import type { User } from '../../types';

interface AccountMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    user: User | null;
    logout: () => void;
    remainingTime?: number;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ 
    anchorEl, 
    open, 
    onClose, 
    user, 
    logout,
}) => {
    const navigate = useNavigate();

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
            disableScrollLock
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(12px 12px 32px rgba(0,0,0,0.1))',
                    mb: 1.5,
                    ml: 0, 
                    width: 260,
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    '& .MuiMenuItem-root': {
                        py: 1.25,
                        px: 2.5,
                        gap: 1.5,
                        transition: 'all 0.15s',
                        '&:hover': {
                            bgcolor: '#f8fafc',
                        },
                        '& .MuiListItemIcon-root': {
                            minWidth: 'auto',
                            color: '#64748b',
                        },
                        '& .MuiTypography-root': {
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#475569',
                        }
                    }
                },
            }}
        >
            <Stack spacing={0}>
                {/* User Info Header */}
                <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar 
                        sx={{ 
                            width: 48, 
                            height: 48, 
                            bgcolor: '#1a1a1a', 
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                        }}
                    >
                        {(user?.name || user?.username)?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: '#111', fontSize: '1rem', mb: 0.1 }}>
                            {user?.name || user?.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>
                            {user?.email || 'Individual Member'}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ borderColor: '#f1f5f9' }} />

                {/* Navigation Items (STRICTLY ONLY PLANS, BILLING, SETTINGS) */}
                <Box sx={{ py: 1 }}>
                    {user?.role !== 'SUPER_ADMIN' && user?.role !== 'CLIENT' && (
                        <>
                            <MenuItem onClick={() => { onClose(); navigate('/admin/subscription'); }}>
                                <ListItemIcon><PlansIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                                <Typography>Plans</Typography>
                            </MenuItem>
                            <MenuItem onClick={() => { onClose(); navigate('/admin/billing'); }}>
                                <ListItemIcon><BillingIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                                <Typography>Billing</Typography>
                            </MenuItem>
                        </>
                    )}
                    <MenuItem onClick={() => { onClose(); navigate(getProfilePath()); }}>
                        <ListItemIcon><SettingsIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                        <Typography>Settings</Typography>
                    </MenuItem>
                </Box>


                <Divider sx={{ borderColor: '#f1f5f9' }} />

                <MenuItem 
                    onClick={handleLogout} 
                    sx={{ 
                        my: 0.5,
                        '&:hover': { bgcolor: alpha('#ef4444', 0.05) },
                        '& .MuiTypography-root': { color: '#ef4444 !important' },
                        '& .MuiListItemIcon-root': { color: '#ef4444 !important' }
                    }}
                >
                    <ListItemIcon><SignOutIcon sx={{ fontSize: 20 }} /></ListItemIcon>
                    <Typography>Log out</Typography>
                </MenuItem>
            </Stack>
        </Menu>
    );
};

export default AccountMenu;
