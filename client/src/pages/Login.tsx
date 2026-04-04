import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    TextField,
    Typography,
    Alert,
    Checkbox,
    FormControlLabel,
    Link,
} from '@mui/material';
import { Building2, Shield, Users, BarChart3 } from 'lucide-react';
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
import { CommonButton } from '../components/common/UIComponents';

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
        <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            <Helmet>
                <title>Login | My CA File - CA Office Management Portal</title>
                <meta name="robots" content="noindex, nofollow" />
                <link rel="canonical" href="https://mycafile.in/login" />
                <meta name="description" content="Login to your My CA File workspace. Secure access for CA firms, staff, and clients." />
            </Helmet>

            {/* Left Panel */}
            <Box
                sx={{
                    display: { xs: 'none', lg: 'flex' },
                    width: '50%',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: { lg: 6, xl: 8 },
                    background: 'linear-gradient(135deg, hsl(213, 56%, 24%) 0%, hsl(213, 56%, 16%) 100%)',
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Building2 size={40} color="hsl(210, 40%, 98%)" />
                        <Typography variant="h4" fontWeight="bold" sx={{ color: 'hsl(210, 40%, 98%)' }}>
                            {firm?.firmName || (subdomain ? subdomain.toUpperCase() : 'Kumar & Associates')}
                        </Typography>
                    </Box>
                    <Typography sx={{ color: 'hsl(210, 40%, 80%)', fontSize: '1.125rem', mt: 0.5 }}>
                        Chartered Accountants
                    </Typography>
                </Box>

                <Box sx={{ '& > *:not(:last-child)': { mb: 4 }, mt: -8 }}>
                    <Typography variant="h5" fontWeight="600" sx={{ color: 'hsl(210, 40%, 98%)', mb: 3 }}>
                        Trusted Financial Excellence Since 1995
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {[
                            { icon: Shield, text: 'Secure & Compliant Platform' },
                            { icon: Users, text: 'Manage Clients Effortlessly' },
                            { icon: BarChart3, text: 'Real-time Financial Insights' },
                        ].map(({ icon: Icon, text }) => (
                            <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    height: 48,
                                    width: 48,
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'hsla(210, 40%, 98%, 0.1)'
                                }}>
                                    <Icon size={24} color="hsl(210, 40%, 98%)" />
                                </Box>
                                <Typography sx={{ fontSize: '1.125rem', color: 'hsl(210, 40%, 90%)' }}>
                                    {text}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Typography sx={{ fontSize: '0.875rem', color: 'hsl(210, 40%, 60%)' }}>
                    © {new Date().getFullYear()} {firm?.firmName || 'Kumar & Associates'}. All rights reserved.
                </Typography>
            </Box>

            {/* Right Panel */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 4, sm: 8 }, bgcolor: '#ffffff' }}>
                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    {/* Mobile Branding */}
                    <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <Building2 size={32} color="#0f172a" />
                        <Typography variant="h5" fontWeight="bold" color="#0f172a">
                            {firm?.firmName || (subdomain ? subdomain.toUpperCase() : 'Kumar & Associates')}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: '#0f172a', mb: 1, fontSize: '2rem', letterSpacing: '-0.02em' }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1rem', mt: 1 }}>
                            Sign in to your account to continue
                        </Typography>
                    </Box>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box>
                            <Typography component="label" htmlFor="email1" sx={{ display: 'block', mb: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                Email Address
                            </Typography>
                            <TextField
                                id="email1"
                                fullWidth
                                placeholder="you@company.com"
                                variant="outlined"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                size="small"
                                InputProps={{
                                    sx: { 
                                        borderRadius: '6px', 
                                        height: 44, 
                                        bgcolor: '#ffffff',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#0f172a', borderWidth: '1px' },
                                        fontSize: '0.875rem',
                                        color: '#0f172a'
                                    }
                                }}
                            />
                        </Box>

                        <Box>
                            <Typography component="label" htmlFor="password1" sx={{ display: 'block', mb: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                Password
                            </Typography>
                            <TextField
                                id="password1"
                                fullWidth
                                type="password"
                                placeholder="••••••••"
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                size="small"
                                InputProps={{
                                    sx: { borderRadius: '6px', height: 44, bgcolor: '#ffffff', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#cbd5e1' }, '&.Mui-focused fieldset': { borderColor: '#0f172a', borderWidth: '1px' }, fontSize: '0.875rem', color: '#0f172a', letterSpacing: password ? '0.2em' : 'normal' }
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        id="remember1" 
                                        size="small" 
                                        sx={{ 
                                            color: '#cbd5e1', 
                                            padding: '4px 8px 4px 4px',
                                            '&.Mui-checked': { color: '#0f172a' } 
                                        }} 
                                    />
                                }
                                label={<Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>Remember me</Typography>}
                                sx={{ m: 0 }}
                            />
                            <Link href="#" sx={{ fontSize: '0.875rem', color: '#475569', textDecoration: 'none', '&:hover': { color: '#0f172a' } }}>
                                Forgot password?
                            </Link>
                        </Box>

                                                <Box
                            component="button"
                            type="submit"
                            disabled={loading}
                            sx={{
                                mt: 1,
                                width: '100%',
                                height: 44,
                                bgcolor: '#0f172a',
                                color: '#ffffff',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s ease',
                                '&:hover': { bgcolor: '#1e293b' },
                                '&:disabled': { bgcolor: '#94a3b8', cursor: 'not-allowed' }
                            }}
                        >
                            {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Sign In'}
                        </Box>
                        
                        {loading && (
                            <Typography variant="body2" align="center" sx={{ color: '#64748b', fontWeight: 500, mt: 1 }}>
                                {loadingMessage}
                            </Typography>
                        )}
                    </Box>

                    <Typography align="center" sx={{ mt: 4, fontSize: '0.875rem', color: '#64748b' }}>
                        Don't have an account?{' '}
                        <Link href="#" sx={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            Contact Admin
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Login;
