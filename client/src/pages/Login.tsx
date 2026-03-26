import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Link,
    Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import Person from '@mui/icons-material/Person';
import Lock from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { reminderService } from '../services/reminderService';
import { clientService } from '../services/clientService';
import settingsService from '../services/settingsService';
import firmService from '../services/firmService';
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
    const [loadingMessage, setLoadingMessage] = useState('Signing in...');
    const [firm, setFirm] = useState<{ firmName: string; logo?: string; status: string } | null>(null);

    React.useEffect(() => {
        if (subdomain) {
            api.get('/firm/public')
                .then(res => {
                    setFirm(res.data);
                    if (res.data.status !== 'active') {
                        setError('This workspace is currently suspended.');
                    }
                })
                .catch(err => {
                    console.error('Firm check failed:', err);
                    setError('This firm does not exist. Please check the URL.');
                });
        }
    }, [subdomain]);

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

            queryClient.clear();

            const prefetchPromises: Promise<unknown>[] = [];

             if (data.user.role === 'SUPER_ADMIN') {
                setLoadingMessage('Fetching global analytics...');
                prefetchPromises.push(queryClient.prefetchQuery({
                    queryKey: ['super-admin-dashboard'],
                    queryFn: async () => {
                        const res = await api.get('/super-admin/dashboard');
                        return res.data;
                    }
                }));
            } else if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(data.user.role)) {
                setLoadingMessage('Loading firm workspace...');
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['firm'], queryFn: firmService.getFirm }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['settings'], queryFn: settingsService.getSettings }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['clients'], queryFn: adminService.getClients }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['upcoming-reminders'], queryFn: reminderService.getUpcomingReminders }));
            } else if (data.user.role === 'CLIENT') {
                setLoadingMessage('Accessing client portal...');
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['firm'], queryFn: firmService.getFirm }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['client-stats'], queryFn: clientService.getStats }));
                prefetchPromises.push(queryClient.prefetchQuery({ queryKey: ['client-reminders'], queryFn: clientService.getReminders }));
            }

            const delayPromise = new Promise(resolve => setTimeout(resolve, 600));

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

            if (!subdomain && data.user.role !== 'SUPER_ADMIN') {
                setError('Staff login is only available through your firm\'s unique subdomain.');
                authService.logout();
                return;
            }

            if (data.user.role === 'SUPER_ADMIN') {
                navigate('/super-admin/dashboard');
            } else if (['ADMIN', 'MANAGER', 'STAFF', 'INTERN'].includes(data.user.role)) {
                navigate('/admin/dashboard');
            } else {
                navigate('/client/dashboard');
            }
        } catch (err: unknown) {
            console.error('Login error:', err);
            const axiosError = err as AxiosError<{ message: string }>;
            const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Login failed. Please check your credentials.';
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
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(255,255,255,0.1)',
                zIndex: 1
            }
        }}>
            <Helmet>
                <title>Login | My CA File - CA Office Management Portal</title>
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://mycafile.in/login" />
                <meta name="description" content="Login to your My CA File workspace. Secure access for CA firms, staff, and clients." />
            </Helmet>

            {/* Blurred Background Shapes with Animation - Light Mode Pastels */}
            <Box sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}>
                <motion.div
                    animate={{
                        x: [0, 80, 0],
                        y: [0, -40, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #fbcfe8 0%, transparent 70%)', filter: 'blur(80px)', opacity: 0.6 }}
                />
                <motion.div
                    animate={{
                        x: [0, -60, 0],
                        y: [0, 100, 0],
                        scale: [1.1, 1, 1.1],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: '10%', right: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, #dbeafe 0%, transparent 70%)', filter: 'blur(100px)', opacity: 0.6 }}
                />
                <motion.div
                    animate={{
                        x: [0, 40, -40, 0],
                        y: [0, 40, 40, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '35%', left: '35%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #f3e8ff 0%, transparent 70%)', filter: 'blur(90px)', opacity: 0.5 }}
                />
            </Box>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{ zIndex: 10, width: '100%', maxWidth: 440, padding: '20px' }}
            >
                <Box sx={{ position: 'relative', textAlign: 'center' }}>
                    {/* Top Avatar */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: -65,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 130,
                            height: 130,
                            bgcolor: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            zIndex: 2,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                        }}
                    >
                        <Person sx={{ fontSize: 70, color: '#1e293b', opacity: 0.8 }} />
                    </Box>

                    {/* Login Card */}
                    <Box
                        sx={{
                            pt: 11,
                            pb: 5,
                            px: 5,
                            borderRadius: 10,
                            bgcolor: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.8)',
                            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                            color: '#1e293b'
                        }}
                    >
                        {/* Firm/Workspace Info */}
                        <Box mb={4} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" component="p" sx={{ letterSpacing: 2, opacity: 0.5, fontSize: '0.85rem', textTransform: 'uppercase', mb: 0.5 }}>
                                Workspace
                            </Typography>
                            <Typography 
                                variant="h5" 
                                component="h1" 
                                fontWeight="800" 
                                sx={{ 
                                    letterSpacing: -0.5, 
                                    color: '#1e1b4b',
                                    fontSize: '1.5rem' // Ensure consistent visual size
                                }}
                            >
                                {firm?.firmName || (subdomain ? subdomain.toUpperCase() : 'MY CA FILE')}
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 4, borderRadius: 2, bgcolor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    placeholder="Email ID"
                                    variant="standard"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    inputProps={{
                                        'aria-label': 'Email ID',
                                    }}
                                    InputProps={{
                                        disableUnderline: true,
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ m: 0 }}>
                                                <Box sx={{ bgcolor: '#f1f5f9', p: 1.8, mr: 0, display: 'flex', alignSelf: 'stretch', alignItems: 'center' }}>
                                                    <Person fontSize="small" sx={{ color: '#64748b' }} />
                                                </Box>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: 'rgba(248, 250, 252, 0.8)',
                                            color: '#1e293b',
                                            height: 54,
                                            paddingLeft: 0,
                                            overflow: 'hidden',
                                            fontSize: '1rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 2,
                                            '& input': { px: 2 },
                                            '& input::placeholder': { color: '#94a3b8', opacity: 1 },
                                        }
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    placeholder="Password"
                                    variant="standard"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    inputProps={{
                                        'aria-label': 'Password',
                                    }}
                                    InputProps={{
                                        disableUnderline: true,
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ m: 0 }}>
                                                <Box sx={{ bgcolor: '#f1f5f9', p: 1.8, mr: 0, display: 'flex', alignSelf: 'stretch', alignItems: 'center' }}>
                                                    <Lock fontSize="small" sx={{ color: '#64748b' }} />
                                                </Box>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: 'rgba(248, 250, 252, 0.8)',
                                            color: '#1e293b',
                                            height: 54,
                                            paddingLeft: 0,
                                            overflow: 'hidden',
                                            fontSize: '1rem',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 2,
                                            '& input': { px: 2 },
                                            '& input::placeholder': { color: '#94a3b8', opacity: 1 },
                                        }
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" sx={{ color: '#cbd5e1', '&.Mui-checked': { color: '#6366f1' } }} />}
                                        label={<Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>Remember me</Typography>}
                                    />
                                    <Link href="#" sx={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                                        Forgot Password?
                                    </Link>
                                </Box>
                            </Stack>

                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: -4 }}>
                                <Box
                                    component="button"
                                    type="submit"
                                    disabled={loading}
                                    sx={{
                                        border: 'none',
                                        outline: 'none',
                                        width: 180,
                                        height: 52,
                                        bgcolor: loading ? '#4f46e5' : '#6366f1',
                                        borderRadius: '0 0 26px 26px',
                                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        zIndex: 100,
                                        position: 'relative',
                                        '&:hover': {
                                            bgcolor: '#4f46e5',
                                            transform: loading ? 'none' : 'translateY(3px)',
                                        }
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        <Typography
                                            sx={{ 
                                                color: '#ffffff', 
                                                fontSize: '1rem', 
                                                fontWeight: 900, 
                                                letterSpacing: '2px',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            LOGIN
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Shadow effect - Closely tucked behind the main button */}
                    <Box sx={{ 
                        mx: 'auto', 
                        width: '45%', 
                        height: 30, 
                        bgcolor: 'rgba(99, 102, 241, 0.08)', 
                        borderRadius: '0 0 30px 30px',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        borderTop: 'none',
                        mt: -1,
                        zIndex: -1,
                    }} />
                </Box>

                {loading && (
                    <Typography variant="body2" align="center" sx={{ mt: 10, color: '#64748b', opacity: 0.8, fontWeight: 500 }}>
                        {loadingMessage}
                    </Typography>
                )}
            </motion.div>

            {/* SEO Text Footer (Transparent) */}
            <Box sx={{ position: 'fixed', bottom: 10, width: '100%', textAlign: 'center', opacity: 0.5, zIndex: 0 }}>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                    &copy; {new Date().getFullYear()} MyCAFile - Secure CA Office Management Portal
                </Typography>
            </Box>
        </Box>
    );
};
