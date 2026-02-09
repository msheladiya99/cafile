import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Container,
    Alert,
    CircularProgress,
    Grid,
    Divider,
    Stack,
    IconButton,
    Avatar,
    Tooltip,
    Fade
} from '@mui/material';
import {
    Business as BusinessIcon,
    Save as SaveIcon,
    Refresh as RefreshIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Home as HomeIcon,
    Image as ImageIcon,
    CheckCircle as CheckIcon,
    ContactPage as PreviewIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import settingsService, { type CompanySettings } from '../../services/settingsService';

export const CompanySettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<CompanySettings>({
        companyName: '',
        address: '',
        email: '',
        phone: '',
        logoUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await settingsService.getSettings();
            setSettings(data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to load company settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof CompanySettings) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSettings({
            ...settings,
            [field]: event.target.value
        });
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const updated = await settingsService.updateSettings(settings);
            setSettings(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to save company settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}
            >
                <CircularProgress size={50} thickness={4} sx={{ color: '#667eea' }} />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 3 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <BusinessIcon color="primary" sx={{ fontSize: 28 }} />
                            <Typography variant="overline" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 2 }}>
                                Administration
                            </Typography>
                        </Stack>
                        <Typography variant="h3" fontWeight={800} sx={{ color: '#1a202c', mb: 1 }}>
                            Company Settings
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={400}>
                            Identity & Contact Management
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                        <Tooltip title="Reload from server">
                            <IconButton onClick={fetchSettings} disabled={saving}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                <Grid container spacing={4}>
                    {/* Left Column: Form Settings */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                {success && (
                                    <Fade in={success}>
                                        <Alert
                                            severity="success"
                                            icon={<CheckIcon />}
                                            sx={{ borderRadius: 3, fontWeight: 600 }}
                                        >
                                            Changes saved successfully!
                                        </Alert>
                                    </Fade>
                                )}
                                {error && (
                                    <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
                                )}

                                <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', overflow: 'visible' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <BusinessIcon color="primary" />
                                            Business Identity
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Legal Business Name"
                                                    value={settings.companyName}
                                                    onChange={handleChange('companyName')}
                                                    required
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' },
                                                        '& .MuiInputLabel-root': { fontWeight: 500 }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Business Location / Address"
                                                    value={settings.address}
                                                    onChange={handleChange('address')}
                                                    required
                                                    multiline
                                                    rows={4}
                                                    InputProps={{
                                                        startAdornment: <HomeIcon sx={{ mr: 1.5, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' },
                                                        '& .MuiInputLabel-root': { fontWeight: 500 }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <EmailIcon color="primary" />
                                            Contact Channels
                                        </Typography>

                                        <Grid container spacing={3}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Official Email"
                                                    type="email"
                                                    value={settings.email}
                                                    onChange={handleChange('email')}
                                                    required
                                                    InputProps={{
                                                        startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'action.active' }} />
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' },
                                                        '& .MuiInputLabel-root': { fontWeight: 500 }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <TextField
                                                    fullWidth
                                                    label="Public Phone Number"
                                                    value={settings.phone}
                                                    onChange={handleChange('phone')}
                                                    required
                                                    InputProps={{
                                                        startAdornment: <PhoneIcon sx={{ mr: 1.5, color: 'action.active' }} />
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' },
                                                        '& .MuiInputLabel-root': { fontWeight: 500 }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <ImageIcon color="primary" />
                                            Brand Assets
                                        </Typography>

                                        <TextField
                                            fullWidth
                                            label="Public Logo URL"
                                            value={settings.logoUrl || ''}
                                            onChange={handleChange('logoUrl')}
                                            placeholder="https://yourwebsite.com/logo.png"
                                            InputProps={{
                                                startAdornment: <ImageIcon sx={{ mr: 1.5, color: 'action.active' }} />
                                            }}
                                            helperText="Provide a direct link to your transparent logo for invoices"
                                            sx={{
                                                '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f8fafc' },
                                                '& .MuiInputLabel-root': { fontWeight: 500 }
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={saving}
                                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                        sx={{
                                            borderRadius: 4,
                                            px: 6,
                                            py: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        {saving ? 'Processing...' : 'Deploy Changes'}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </Grid>

                    {/* Right Column: Live Preview */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={4} sx={{ position: { lg: 'sticky' }, top: 24 }}>
                            {/* Visual Preview */}
                            <Card sx={{
                                borderRadius: 5,
                                background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
                                color: 'white',
                                boxShadow: '0 15px 45px rgba(0,0,0,0.15)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <Box sx={{
                                    position: 'absolute',
                                    top: -20,
                                    right: -20,
                                    width: 150,
                                    height: 150,
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '50%'
                                }} />

                                <CardContent sx={{ p: 4 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 6 }}>
                                        <Avatar
                                            src={settings.logoUrl || ''}
                                            sx={{
                                                width: 60,
                                                height: 60,
                                                background: settings.logoUrl ? 'white' : 'rgba(255,255,255,0.1)',
                                                borderRadius: 3,
                                                p: settings.logoUrl ? 1 : 0
                                            }}
                                        >
                                            {!settings.logoUrl && <BusinessIcon sx={{ color: 'white' }} />}
                                        </Avatar>
                                        <PreviewIcon sx={{ opacity: 0.3 }} />
                                    </Stack>

                                    <Typography variant="h5" fontWeight={800} sx={{ mb: 1, lineHeight: 1.2 }}>
                                        {settings.companyName || 'Your Company Name'}
                                    </Typography>

                                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <HomeIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                                            <Typography variant="body2" sx={{ opacity: 0.8, whiteSpace: 'pre-line' }}>
                                                {settings.address || 'Business address will appear here...'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <EmailIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                {settings.email || 'contact@yourbrand.com'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <PhoneIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                {settings.phone || '+91 0000 00000'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Box sx={{ mt: 5, textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ opacity: 0.3, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase' }}>
                                            Official Business Brand
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>

                            {/* Help Alert */}
                            <Alert
                                severity="info"
                                icon={<InfoIcon />}
                                sx={{
                                    borderRadius: 4,
                                    bgcolor: '#ebf8ff',
                                    color: '#2b6cb0',
                                    '& .MuiAlert-icon': { color: '#3182ce' }
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} gutterBottom>
                                    Invoice Integration
                                </Typography>
                                <Typography variant="caption" sx={{ lineHeight: 1.5, display: 'block' }}>
                                    Any changes made here will be instantly reflected on all generated invoices, email footers, and portal headers.
                                </Typography>
                            </Alert>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};
