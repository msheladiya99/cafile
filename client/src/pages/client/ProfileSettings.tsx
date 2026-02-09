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
} from '@mui/material';
import {
    Person as PersonIcon,
    Lock as LockIcon,
    History as HistoryIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { profileService, type UserProfile } from '../../services/profileService';
import { ActivityLog } from '../../components/ActivityLog';

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
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
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
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);

            // Populate form
            if (data.clientId) {
                setName(data.clientId.name);
                setEmail(data.clientId.email);
                setPhone(data.clientId.phone);
            } else {
                // For admin/staff
                setName(data.name || '');
                setEmail(data.email || '');
                setPhone(data.phone || '');
            }
            setUsername(data.username);

        } catch (error: unknown) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);
        setProfileLoading(true);

        try {
            await profileService.updateProfile({ name, email, phone, username });
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            await loadProfile();
        } catch (error: any) {
            setProfileMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validation
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setPasswordLoading(true);

        try {
            await profileService.changePassword(currentPassword, newPassword);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Typography variant="h4" fontWeight="700" gutterBottom>
                Profile & Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
                Manage your account settings and preferences
            </Typography>

            <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)' }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab icon={<PersonIcon />} label="Profile" iconPosition="start" />
                    <Tab icon={<LockIcon />} label="Password" iconPosition="start" />
                    <Tab icon={<HistoryIcon />} label="Activity Log" iconPosition="start" />
                </Tabs>

                {/* Profile Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ px: 3 }}>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                            Personal Information
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Update your personal details
                        </Typography>

                        {profileMessage && (
                            <Alert severity={profileMessage.type} sx={{ mb: 3 }}>
                                {profileMessage.text}
                            </Alert>
                        )}

                        <form onSubmit={handleUpdateProfile}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        helperText="Use unique username"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Role"
                                        value={profile?.role || ''}
                                        disabled
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={profileLoading}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            textTransform: 'none',
                                            px: 4,
                                        }}
                                    >
                                        {profileLoading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Box>
                </TabPanel>

                {/* Password Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ px: 3 }}>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                            Change Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Ensure your password is strong and secure
                        </Typography>

                        {passwordMessage && (
                            <Alert severity={passwordMessage.type} sx={{ mb: 3 }}>
                                {passwordMessage.text}
                            </Alert>
                        )}

                        <form onSubmit={handleChangePassword}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}></Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        helperText="Minimum 6 characters"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<LockIcon />}
                                        disabled={passwordLoading}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            textTransform: 'none',
                                            px: 4,
                                        }}
                                    >
                                        {passwordLoading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Box>
                </TabPanel>

                {/* Activity Log Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ px: 3 }}>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                            Activity Log
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            View your recent account activity
                        </Typography>
                        <ActivityLog />
                    </Box>
                </TabPanel>
            </Paper>
        </Box>
    );
};
