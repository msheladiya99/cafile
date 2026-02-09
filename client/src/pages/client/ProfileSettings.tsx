import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    Divider,
    CircularProgress,
    Tab,
    Tabs,
    Snackbar,
    LinearProgress,
    IconButton,
    InputAdornment,
    Zoom,
} from '@mui/material';
import {
    Person as PersonIcon,
    Lock as LockIcon,
    History as HistoryIcon,
    Save as SaveIcon,
    Visibility,
    VisibilityOff,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldCheck, Fingerprint, User, Mail, Smartphone, Hash } from 'lucide-react';
import { profileService, type UserProfile } from '../../services/profileService';
import { ActivityLog } from '../../components/ActivityLog';
import { AxiosError } from 'axios';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Box sx={{ py: 3 }}>{children}</Box>
                </motion.div>
            )}
        </div>
    );
}

export const ProfileSettings: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Profile form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        type: 'info'
    });

    const loadProfile = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);

            if (data.clientId) {
                setName(data.clientId.name);
                setEmail(data.clientId.email);
                setPhone(data.clientId.phone);
            } else {
                setName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
            }
            setUsername(data.username);
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                showSnackbar(error.response?.data?.message || 'Error loading profile', 'error');
            } else {
                showSnackbar('Error loading profile', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        // Simple password strength calculator
        let strength = 0;
        if (newPassword.length >= 6) strength += 25;
        if (/[A-Z]/.test(newPassword)) strength += 25;
        if (/[0-9]/.test(newPassword)) strength += 25;
        if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
        setPasswordStrength(strength);
    }, [newPassword]);

    const showSnackbar = (message: string, type: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, type });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            await profileService.updateProfile({ name, email, phone, username });
            showSnackbar('Profile updated successfully!', 'success');
            await loadProfile();
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                showSnackbar(error.response?.data?.message || 'Failed to update profile', 'error');
            } else {
                showSnackbar('Failed to update profile', 'error');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            showSnackbar('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showSnackbar('Passwords do not match', 'error');
            return;
        }

        setPasswordLoading(true);

        try {
            await profileService.changePassword(currentPassword, newPassword);
            showSnackbar('Password changed successfully!', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                showSnackbar(error.response?.data?.message || 'Failed to change password', 'error');
            } else {
                showSnackbar('Failed to change password', 'error');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 25) return 'error';
        if (passwordStrength <= 50) return 'warning';
        if (passwordStrength <= 75) return 'info';
        return 'success';
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh" gap={2}>
                <CircularProgress size={48} thickness={4} sx={{ color: '#667eea' }} />
                <Typography variant="body2" color="text.secondary" className="animate-pulse">
                    Loading your profile...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 1200, mx: 'auto' }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight="800" gutterBottom sx={{
                    background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    Account Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your personal information and security preferences
                </Typography>
            </Box>

            <Paper sx={{
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, newValue) => setTabValue(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            px: 2,
                            '& .MuiTab-root': {
                                py: 2,
                                minHeight: 64,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                            }
                        }}
                    >
                        <Tab icon={<PersonIcon />} label="Personal Info" iconPosition="start" />
                        <Tab icon={<LockIcon />} label="Security" iconPosition="start" />
                        <Tab icon={<HistoryIcon />} label="Activity Log" iconPosition="start" />
                    </Tabs>
                </Box>

                <Box sx={{ p: { xs: 2, md: 4 } }}>
                    {/* Profile Tab */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={{
                                    position: 'relative',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    bgcolor: 'background.paper',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    pb: 3
                                }}>
                                    {/* Cover Placeholder */}
                                    <Box sx={{
                                        height: 100,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        opacity: 0.8
                                    }} />

                                    <Box sx={{ textAlign: 'center', mt: -6 }}>
                                        <Box sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            bgcolor: 'white',
                                            color: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2,
                                            fontSize: '2.5rem',
                                            fontWeight: 800,
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                            border: '4px solid white',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            {name ? name.charAt(0).toUpperCase() : username.charAt(0).toUpperCase()}
                                        </Box>
                                        <Typography variant="h6" fontWeight="800" sx={{ color: '#1a202c' }}>{name || username}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>{profile?.role}</Typography>

                                        <Divider sx={{ mx: 3, my: 2 }} />

                                        <Box sx={{ px: 3, textAlign: 'left' }}>
                                            <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>Account Status</Typography>
                                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.main', display: 'flex' }}>
                                                        <ShieldCheck size={14} />
                                                    </Box>
                                                    <Typography variant="body2" fontWeight="600">Active Account</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(102, 126, 234, 0.1)', color: 'primary.main', display: 'flex' }}>
                                                        <CalendarIcon sx={{ fontSize: 14 }} />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">Member since 2026</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 3, p: 3, borderRadius: 4, bgcolor: 'rgba(102, 126, 234, 0.03)', border: '1px dashed rgba(102, 126, 234, 0.3)' }}>
                                    <Typography variant="subtitle2" fontWeight="700" color="primary.main" gutterBottom>Profile Tip</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        Keeping your contact information up to date ensures you receive important notifications and invoices on time.
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, md: 8 }}>
                                <form onSubmit={handleUpdateProfile}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <User size={18} color="#667eea" /> Basic Details
                                            </Typography>
                                            <Grid container spacing={2.5}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Full Name"
                                                        variant="outlined"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        InputProps={{
                                                            sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <BadgeIcon sx={{ fontSize: 20, color: 'text.secondary', opacity: 0.7 }} />
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Username"
                                                        variant="outlined"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        InputProps={{
                                                            sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Hash size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Smartphone size={18} color="#667eea" /> Contact Information
                                            </Typography>
                                            <Grid container spacing={2.5}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Email Address"
                                                        type="email"
                                                        variant="outlined"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        InputProps={{
                                                            sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <Mail size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Phone Number"
                                                        variant="outlined"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        InputProps={{
                                                            sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <PhoneIcon sx={{ fontSize: 20, color: 'text.secondary', opacity: 0.7 }} />
                                                                </InputAdornment>
                                                            )
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box sx={{
                                            p: 2.5,
                                            borderRadius: 3,
                                            bgcolor: 'rgba(0,0,0,0.02)',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight="700">Confirm Changes</Typography>
                                                <Typography variant="caption" color="text.secondary">Make sure your details are correct before saving</Typography>
                                            </Box>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={profileLoading}
                                                startIcon={profileLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                                sx={{
                                                    background: 'black',
                                                    color: 'white',
                                                    textTransform: 'none',
                                                    px: 4,
                                                    py: 1,
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                    '&:hover': {
                                                        background: '#333',
                                                    }
                                                }}
                                            >
                                                {profileLoading ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </Box>
                                    </Box>
                                </form>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Password Tab */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 7 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', color: 'primary.main', display: 'flex' }}>
                                        <KeyRound size={20} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="800">Password Management</Typography>
                                        <Typography variant="body2" color="text.secondary">Secure your account with a strong, unique password</Typography>
                                    </Box>
                                </Box>

                                <form onSubmit={handleChangePassword}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                        <TextField
                                            fullWidth
                                            label="Current Password"
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            InputProps={{
                                                sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LockIcon sx={{ fontSize: 20, color: 'text.secondary', opacity: 0.7 }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} edge="end">
                                                            {showPasswords.current ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />

                                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

                                        <Grid container spacing={2.5}>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="New Password"
                                                    type={showPasswords.new ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    InputProps={{
                                                        sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Fingerprint size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} edge="end">
                                                                    {showPasswords.new ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, sm: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Confirm New Password"
                                                    type={showPasswords.confirm ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    InputProps={{
                                                        sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' },
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <ShieldCheck size={18} style={{ color: 'rgba(0,0,0,0.4)' }} />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: (
                                                            <InputAdornment position="end">
                                                                <IconButton onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} edge="end">
                                                                    {showPasswords.confirm ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                                                </IconButton>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Box sx={{
                                            p: 2.5,
                                            borderRadius: 4,
                                            bgcolor: 'rgba(0,0,0,0.02)',
                                            border: '1px solid rgba(0,0,0,0.05)'
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="700">Password Strength</Typography>
                                                    <Typography variant="caption" sx={{
                                                        px: 1,
                                                        py: 0.2,
                                                        borderRadius: 1,
                                                        bgcolor: `${getStrengthColor()}.light`,
                                                        color: `${getStrengthColor()}.main`,
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Very Strong'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" fontWeight="700" color="text.secondary">{passwordStrength}%</Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={passwordStrength}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'rgba(0,0,0,0.05)',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        background: passwordStrength <= 25
                                                            ? 'linear-gradient(90deg, #ff4d4d 0%, #ff9494 100%)'
                                                            : passwordStrength <= 50
                                                                ? 'linear-gradient(90deg, #ffa502 0%, #ffca28 100%)'
                                                                : passwordStrength <= 75
                                                                    ? 'linear-gradient(90deg, #2e86de 0%, #54a0ff 100%)'
                                                                    : 'linear-gradient(90deg, #2ecc71 0%, #a29bfe 100%)'
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic' }}>
                                                * Requirement: Minimum 8 characters with numbers and symbols.
                                            </Typography>
                                        </Box>

                                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                disabled={passwordLoading}
                                                sx={{
                                                    background: 'black',
                                                    color: 'white',
                                                    textTransform: 'none',
                                                    px: 6,
                                                    py: 1.5,
                                                    borderRadius: 2,
                                                    fontWeight: 800,
                                                    fontSize: '0.95rem',
                                                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                                                    '&:hover': {
                                                        background: '#333',
                                                        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                                                    }
                                                }}
                                            >
                                                <AnimatePresence mode="wait">
                                                    {passwordLoading ? (
                                                        <motion.div
                                                            key="loading"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                                                        >
                                                            <CircularProgress size={18} color="inherit" thickness={6} />
                                                            Securing...
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="idle"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                                        >
                                                            Update Security
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </Button>
                                        </Box>
                                    </Box>
                                </form>
                            </Grid>

                            <Grid size={{ xs: 12, md: 5 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(102, 126, 234, 0.03)',
                                        border: '1px solid rgba(102, 126, 234, 0.1)'
                                    }}>
                                        <Typography variant="subtitle2" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ShieldCheck size={18} color="#667eea" /> Security Checklist
                                        </Typography>
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {[
                                                { label: 'Use at least 8 characters', checked: newPassword.length >= 8 },
                                                { label: 'Include uppercase letters', checked: /[A-Z]/.test(newPassword) },
                                                { label: 'Include numbers', checked: /[0-9]/.test(newPassword) },
                                                { label: 'Include special characters', checked: /[^A-Za-z0-9]/.test(newPassword) },
                                            ].map((item, i) => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{
                                                        width: 18,
                                                        height: 18,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: item.checked ? 'success.main' : 'rgba(0,0,0,0.05)',
                                                        color: 'white',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        <CheckCircleIcon sx={{ fontSize: 12 }} />
                                                    </Box>
                                                    <Typography variant="body2" color={item.checked ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: item.checked ? 600 : 400 }}>
                                                        {item.label}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>

                                    <Paper sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        boxShadow: 'none',
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        bgcolor: 'rgba(0,0,0,0.01)'
                                    }}>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 2 }}>Device Activity</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            You are currently signed in on this Windows device.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            sx={{
                                                textTransform: 'none',
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                borderColor: 'rgba(0,0,0,0.2)',
                                                color: 'text.primary',
                                                '&:hover': {
                                                    borderColor: 'black',
                                                    bgcolor: 'rgba(0,0,0,0.02)'
                                                }
                                            }}
                                        >
                                            View All Sessions
                                        </Button>
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Activity Log Tab */}
                    <TabPanel value={tabValue} index={2}>
                        <ActivityLog />
                    </TabPanel>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                TransitionComponent={Zoom}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.type}
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        fontWeight: 600,
                        width: '100%',
                        minWidth: 300
                    }}
                    iconMapping={{
                        success: <CheckCircleIcon fontSize="inherit" />,
                        error: <ErrorIcon fontSize="inherit" />,
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
