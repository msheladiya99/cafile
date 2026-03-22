import React from 'react';
import { Box, Typography, Button, Avatar, Stack, Dialog, Fade, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AccessTime as ClockIcon, 
    Bolt as BoltIcon, 
    Login as LoginIcon, 
    Home as HomeIcon,
    Shield as ShieldIcon
} from '@mui/icons-material';

interface SessionExpiredModalProps {
    open: boolean;
    onClose: () => void;
    onLogin: () => void;
    onHome: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ open, onClose, onLogin, onHome }) => {
    const [currentTime] = React.useState(() => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));

    return (
        <AnimatePresence>
            {open && (
                <Dialog
                    open={open}
                    onClose={onClose}
                    TransitionComponent={Fade}
                    TransitionProps={{ timeout: 500 }}
                    PaperProps={{
                        sx: {
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                            maxWidth: '400px',
                            width: '100%',
                            m: 2,
                            overflow: 'visible'
                        }
                    }}
                    slotProps={{
                        backdrop: {
                            sx: {
                                backdropFilter: 'blur(8px)',
                                bgcolor: 'rgba(0, 0, 0, 0.8)'
                            }
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <Box sx={{ 
                            bgcolor: '#141414', 
                            borderRadius: '32px', 
                            p: 3, 
                            color: 'white',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 1 }}>
                                    SYSTEM ALERT
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                    <ClockIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{currentTime}</Typography>
                                </Stack>
                            </Stack>

                            {/* User Info Section */}
                            <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar sx={{ 
                                        width: 64, 
                                        height: 64, 
                                        bgcolor: '#222',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <ShieldIcon sx={{ color: '#667eea', fontSize: 32 }} />
                            </Avatar>
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                Session Timed Out
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#667eea', animation: 'pulse 2s infinite' }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                                    Automatically Logged Out
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Action Buttons */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={onLogin}
                                startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.5,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                Login
                            </Button>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={onHome}
                                startIcon={<HomeIcon sx={{ fontSize: 18 }} />}
                                sx={{
                                    bgcolor: '#667eea',
                                    color: 'white',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    py: 1.5,
                                    '&:hover': { bgcolor: '#5568d3' }
                                }}
                            >
                                Home
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Style for Pulse animation */}
                    <style>
                        {`
                            @keyframes pulse {
                                0% { opacity: 0.4; transform: scale(1); }
                                50% { opacity: 1; transform: scale(1.2); }
                                100% { opacity: 0.4; transform: scale(1); }
                            }
                        `}
                    </style>
                </Box>

                {/* Bottom Accent Bar */}
                <Box sx={{ 
                    mt: -2,
                    px: 2,
                    position: 'relative',
                    zIndex: -1
                }}>
                    <Box sx={{ 
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', 
                        borderBottomLeftRadius: '24px', 
                        borderBottomRightRadius: '24px',
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        boxShadow: '0 10px 20px rgba(102, 126, 234, 0.2)'
                    }}>
                        <BoltIcon sx={{ color: 'white', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Your security is our priority
                        </Typography>
                    </Box>
                </Box>
                    </motion.div>
                </Dialog>
            )}
        </AnimatePresence>
    );
};

export default SessionExpiredModal;
