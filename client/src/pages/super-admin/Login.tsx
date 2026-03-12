import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const SuperAdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const { login: setAuth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Use the direct axios for the special super admin model route
            const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/super-admin/login`, { email, password });
            setAuth(res.data.token, res.data.user);
            navigate('/super-admin/dashboard');
        } catch (err: unknown) {
            const errorMessage = axios.isAxiosError(err)
                ? err.response?.data?.message
                : 'Login failed. Please check your credentials.';
            setError(errorMessage || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f0f2f5' }}>
            <Paper sx={{ p: 5, width: '100%', maxWidth: 400, borderRadius: 3, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: '#FF4B2B' }}>SUPER ADMIN</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Access Management Control Panel</Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="Email Address" variant="outlined" sx={{ mb: 3 }}
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    <TextField fullWidth label="Password" type="password" variant="outlined" sx={{ mb: 4 }}
                        value={password} onChange={e => setPassword(e.target.value)} required />

                    <Button fullWidth type="submit" variant="contained" size="large" disableElevation
                        disabled={loading}
                        sx={{ py: 1.5, fontWeight: 800, bgcolor: '#FF4B2B', '&:hover': { bgcolor: '#e63e20' } }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                    </Button>
                </form>

                <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.secondary' }}>
                    Authorized Personnel Only.
                </Typography>
            </Paper>
        </Box>
    );
};

export default SuperAdminLogin;
