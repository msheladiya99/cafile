import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    Visibility,
    VisibilityOff,
    ShieldOutlined,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { reminderService } from '../services/reminderService';
import { clientService } from '../services/clientService';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Helmet } from 'react-helmet-async';
import { getSubdomain } from '../utils/subdomain';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const queryClient = useQueryClient();
    const subdomain = getSubdomain();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await authService.login({ username, password });
            login(data.token, data.user);

            // Clear cache and prefetch data for a smooth transition
            queryClient.clear();

            const prefetchPromises: Promise<unknown>[] = [];

            if (data.user.role === 'SUPER_ADMIN') {
                prefetchPromises.push(queryClient.prefetchQuery({
                    queryKey: ['super-admin-dashboard'],
                    queryFn: async () => {
                        const res = await api.get('/super-admin/dashboard');
                        return res.data;
                    }
                }));
            } else if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(data.user.role)) {
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['clients'], queryFn: adminService.getClients }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['upcoming-reminders'], queryFn: reminderService.getUpcomingReminders }));
            } else if (data.user.role === 'CLIENT') {
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['client-stats'], queryFn: clientService.getStats }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['client-reminders'], queryFn: clientService.getReminders }));
            }

            // Artificial delay for loading experience (600ms for snappier feel)
            const delayPromise = new Promise(resolve => setTimeout(resolve, 600));

            // Pre-load the component code to speed up rendering
            const preloadComponent = () => {
                if (data.user.role === 'SUPER_ADMIN') {
                    import('../pages/super-admin/Dashboard');
                } else if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(data.user.role)) {
                    import('../pages/admin/Dashboard');
                } else {
                    import('../pages/client/Dashboard');
                }
            };
            preloadComponent();

            await Promise.all([...prefetchPromises, delayPromise]);

            if (data.user.role === 'SUPER_ADMIN') {
                navigate('/super-admin/dashboard');
            } else if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(data.user.role)) {
                navigate('/admin/dashboard');
            } else {
                navigate('/client/dashboard');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Invalid credentials';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            bgcolor: '#f8faff',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <Helmet>
                <title>Login | MyCAFile - CA Office Portal</title>
                <link rel="canonical" href="https://www.mycafile.in/login" />
                <meta name="description" content="Access your MyCAFile workspace. Secure practice management for Chartered Accountants and tax professionals." />
            </Helmet>

            {/* Left Panel - Illustration (Hidden on Mobile) */}
            <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                sx={{
                    width: { md: '55%' },
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    component="img"
                    src="/login-illustration.webp"
                    alt="My CA File - CA Office Management Software Illustration"
                    sx={{
                        maxWidth: '90%',
                        maxHeight: '80vh',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.08))',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        zIndex: 2
                    }}
                />
                {/* Decorative Elements */}
                <Box sx={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
                    zIndex: 1,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }} />
            </Box>

            {/* Right Panel - Login Card */}
            <Box
                sx={{
                    flex: 1,
                    width: { xs: '100%', md: '45%' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    zIndex: 3
                }}
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    style={{ width: '100%', maxWidth: 500 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 4 },
                            width: '100%',
                            maxWidth: 480,
                            borderRadius: 8,
                            bgcolor: 'white',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.05)',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Box sx={{ bgcolor: subdomain ? '#1e3a5f' : '#667eea', p: 0.6, borderRadius: 1.2, display: 'flex' }}>
                                    <ShieldOutlined sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h6" component="h2" fontWeight="800" color="#312e81" sx={{ letterSpacing: -0.5 }}>
                                    {subdomain ? `${subdomain.toUpperCase()} PORTAL` : 'CA Office Portal'}
                                </Typography>
                            </Box>

                            <Typography variant="h2" component="h1" fontWeight="900" sx={{ mb: 1, color: '#1e1b4b', fontSize: { xs: '2rem', sm: '2.5rem', md: '2.75rem' }, letterSpacing: -1, lineHeight: 1.1 }}>
                                {subdomain ? 'Firm Login' : 'Admin Login'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                                {subdomain ? `Sign in to ${subdomain} workspace` : 'Sign in to management panel'}
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 4, bgcolor: '#fef2f2' }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    placeholder="Email address"
                                    name="username"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    InputProps={{
                                        sx: {
                                            borderRadius: 4,
                                            height: 56,
                                            bgcolor: '#f9fafb',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#667eea' },
                                            '&.Mui-focused fieldset': { borderColor: '#667eea' },
                                            transition: 'all 0.2s'
                                        }
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    placeholder="Password"
                                    name="password"
                                    autoComplete="current-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            borderRadius: 4,
                                            height: 56,
                                            bgcolor: '#f9fafb',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#667eea' },
                                            '&.Mui-focused fieldset': { borderColor: '#667eea' },
                                            transition: 'all 0.2s'
                                        }
                                    }}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    disableElevation
                                    sx={{
                                        py: 2,
                                        mt: 2,
                                        borderRadius: 4,
                                        fontSize: '1rem',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                            transform: 'scale(1.02)'
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                                </Button>

                                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', mt: 2, px: 2, display: 'block' }}>
                                    By signing in, you agree to our <span style={{ color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>Privacy Policy</span>.
                                </Typography>

                                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Forgot your details? <span style={{ color: '#667eea', fontWeight: 800, cursor: 'pointer' }}>Contact Admin</span>
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                                        <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            About Portal
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            Security
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#667eea', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            Help Center
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* SEO Hidden Content - Helps Google understand site features */}
                                <Box sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', pointerEvents: 'none' }}>
                                    <h3>Features of CA Office Portal</h3>
                                    <ul>
                                        <li>Multi-firm management for Chartered Accountants</li>
                                        <li>Secure document storage and ITR/GST filing tracking</li>
                                        <li>Client ledger management and automated billing</li>
                                        <li>Employee task scheduling and performance analytics</li>
                                        <li>Real-time reminders and notifications</li>
                                    </ul>
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                </motion.div>
            </Box>
        </Box >
    );
};
