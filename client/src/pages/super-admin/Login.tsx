import React, { useState } from 'react';
import axios from 'axios';
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
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../services/api';
import { Helmet } from 'react-helmet-async';

const SuperAdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const { login: setAuth } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/super-admin/login`, { email, password });

            // Artificial delay for loading experience
            await new Promise(resolve => setTimeout(resolve, 600));

            setAuth(res.data.token, res.data.user);
            navigate('/super-admin/dashboard');
        } catch (err: unknown) {
            console.error('Super admin login error:', err);
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message
                : 'Login failed. Please check your credentials.';
            setError(errorMessage || 'Login failed.');
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
                <title>Super Admin Login | MyCAFile</title>
                <meta name="robots" content="noindex, nofollow" />
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
                    alt="Super Admin Access Illustration"
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
                <Box sx={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 70%)',
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
                                <Box sx={{ bgcolor: '#4f46e5', p: 0.6, borderRadius: 1.2, display: 'flex' }}>
                                    <ShieldOutlined sx={{ color: 'white', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h6" component="h2" fontWeight="800" color="#312e81" sx={{ letterSpacing: -0.5 }}>
                                    MY CA FILE
                                </Typography>
                            </Box>

                            <Typography variant="h2" component="h1" fontWeight="900" sx={{ mb: 1, color: '#1e1b4b', fontSize: { xs: '2rem', sm: '2.5rem', md: '2.75rem' }, letterSpacing: -1, lineHeight: 1.1 }}>
                                Super Admin
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                                Sign in to master control panel
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
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    InputProps={{
                                        sx: {
                                            borderRadius: 4,
                                            height: 56,
                                            bgcolor: '#f9fafb',
                                            '& fieldset': { borderColor: '#e5e7eb' },
                                            '&:hover fieldset': { borderColor: '#4f46e5' },
                                            '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                                            transition: 'all 0.2s'
                                        }
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    placeholder="Password"
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
                                            '&:hover fieldset': { borderColor: '#4f46e5' },
                                            '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
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
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                        color: 'white',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
                                            transform: 'scale(1.02)'
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                                </Button>

                                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem', mt: 2, px: 2, display: 'block' }}>
                                    Authorized Personnel Only. Access is monitored and logged.
                                </Typography>

                                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                                        <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            Privacy Policy
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                            Terms of Use
                                        </Typography>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                </motion.div>
            </Box>
        </Box >
    );
};

export default SuperAdminLogin;
