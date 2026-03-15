import React from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    IconButton,
    Paper,
    Divider,
    TextField
} from '@mui/material';
import {
    Menu as MenuIcon,
    ShieldOutlined,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    Groups as GroupsIcon,
    Storage as StorageIcon,
    Language as LanguageIcon,
    CloudDone as CloudIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const LandingPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    const features = [
        {
            title: 'Multi-Tenant Architecture',
            desc: 'Isolated environments for every CA firm with dedicated subdomains and secure data partitioning.',
            icon: <CloudIcon sx={{ fontSize: 40, color: '#667eea' }} />
        },
        {
            title: 'Practice Management',
            desc: 'Complete suite for managing clients, staff, tasks, and attendance in one unified dashboard.',
            icon: <GroupsIcon sx={{ fontSize: 40, color: '#764ba2' }} />
        },
        {
            title: 'Secure Document Vault',
            desc: 'Regulatory-grade document storage integrated with Google Drive for seamless file management.',
            icon: <SecurityIcon sx={{ fontSize: 40, color: '#667eea' }} />
        },
        {
            title: 'Automated Compliance',
            desc: 'Track ITR, GST, and Audit deadlines with intelligent reminders and automated status tracking.',
            icon: <SpeedIcon sx={{ fontSize: 40, color: '#764ba2' }} />
        },
        {
            title: 'Subdomain System',
            desc: 'Professional white-labeled experience with automatic subdomain generation for your firm.',
            icon: <LanguageIcon sx={{ fontSize: 40, color: '#667eea' }} />
        },
        {
            title: 'Billing & Invoicing',
            desc: 'Create professional invoices, track payments, and manage client ledgers with ease.',
            icon: <StorageIcon sx={{ fontSize: 40, color: '#764ba2' }} />
        }
    ];

    return (
        <Box sx={{ bgcolor: 'white', minHeight: '100vh', overflowX: 'hidden' }}>
            <Helmet>
                <title>My CA File - Premium CA Office Management SaaS</title>
                <meta name="description" content="The ultimate practice management platform for Chartered Accountants. Manage firms, clients, tasks, and documents securely." />
            </Helmet>

            {/* Navbar */}
            <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ bgcolor: '#667eea', p: 0.5, borderRadius: 1 }}>
                                <ShieldOutlined sx={{ color: 'white', fontSize: 24 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={900} color="#1e1b4b" sx={{ letterSpacing: -1 }}>
                                My CA File
                            </Typography>
                        </Stack>

                        {!isMobile && (
                            <Stack direction="row" spacing={3} alignItems="center">
                                {['Features', 'Solutions', 'Pricing', 'Contact'].map((item) => (
                                    <Typography key={item} variant="body2" fontWeight={700} sx={{ cursor: 'pointer', color: '#6b7280', '&:hover': { color: '#667eea' } }}>
                                        {item}
                                    </Typography>
                                ))}
                                <Button variant="outlined" onClick={() => navigate('/login')} sx={{ borderRadius: 2, fontWeight: 800 }}>
                                    Login
                                </Button>
                                <Button variant="contained" onClick={() => navigate('/login')} sx={{ borderRadius: 2, fontWeight: 800, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                    Start Free Trial
                                </Button>
                            </Stack>
                        )}

                        {isMobile && (
                            <IconButton color="inherit" sx={{ color: '#1e1b4b' }}>
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{
                pt: { xs: 8, md: 12 },
                pb: { xs: 10, md: 20 },
                position: 'relative',
                background: 'linear-gradient(180deg, #f8faff 0%, white 100%)'
            }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        <Grid size={{ xs: 12, md: 7 }}>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <Typography variant="overline" sx={{ color: '#667eea', fontWeight: 900, letterSpacing: 2 }}>
                                    POWERING MODERN PRACTICE
                                </Typography>
                                <Typography variant="h1" sx={{
                                    fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                                    fontWeight: 900,
                                    color: '#1e1b4b',
                                    lineHeight: 1.1,
                                    mb: 3,
                                    letterSpacing: -2
                                }}>
                                    Manage Your CA Firm <br />
                                    <span style={{ color: '#667eea' }}>With Precision.</span>
                                </Typography>
                                <Typography variant="h5" sx={{ color: '#6b7280', mb: 5, lineHeight: 1.6, fontWeight: 500 }}>
                                    The all-in-one SaaS platform designed specifically for Chartered Accountants. Streamline operations, automate compliance, and scale your practice securely.
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button size="large" variant="contained" onClick={() => navigate('/login')} sx={{
                                        px: 4,
                                        py: 2,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
                                    }}>
                                        Get Started Now
                                    </Button>
                                    <Button size="large" variant="outlined" sx={{
                                        px: 4,
                                        py: 2,
                                        borderRadius: 3,
                                        fontSize: '1.1rem',
                                        fontWeight: 800,
                                        borderColor: '#e5e7eb',
                                        color: '#1e1b4b'
                                    }}>
                                        Watch Demo
                                    </Button>
                                </Stack>
                            </motion.div>
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, delay: 0.2 }}
                            >
                                <Box sx={{ position: 'relative' }}>
                                    <Box
                                        component="img"
                                        src="/landing-hero.png"
                                        sx={{
                                            width: '100%',
                                            borderRadius: 10,
                                            boxShadow: '0 40px 80px rgba(0,0,0,0.1)',
                                            zIndex: 2,
                                            position: 'relative'
                                        }}
                                    />
                                    {/* Abstract Circle decoration */}
                                    <Box sx={{
                                        position: 'absolute',
                                        width: '120%',
                                        height: '120%',
                                        top: '-10%',
                                        left: '-10%',
                                        background: 'radial-gradient(circle, rgba(102,126,234,0.05) 0%, transparent 70%)',
                                        zIndex: 1
                                    }} />
                                </Box>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Box sx={{ py: 15 }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="overline" sx={{ color: '#667eea', fontWeight: 900, letterSpacing: 2 }}>
                            CORE CAPABILITIES
                        </Typography>
                        <Typography variant="h2" sx={{ fontWeight: 900, color: '#1e1b4b', letterSpacing: -1 }}>
                            Everything You Need to <br /> Scale Your practice.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <Card sx={{
                                        height: '100%',
                                        borderRadius: 6,
                                        p: 2,
                                        bgcolor: 'white',
                                        border: '1px solid #f0f0f0',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                                        '&:hover': { boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }
                                    }}>
                                        <CardContent>
                                            <Box sx={{ mb: 3 }}>
                                                {feature.icon}
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#1e1b4b' }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#6b7280', lineHeight: 1.7 }}>
                                                {feature.desc}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Stats Section */}
            <Box sx={{ py: 10, bgcolor: '#1e1b4b', color: 'white' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} sx={{ textAlign: 'center' }}>
                        {[
                            { label: 'Active Firms', val: '500+' },
                            { label: 'Files Managed', val: '1M+' },
                            { label: 'Uptime', val: '99.9%' },
                            { label: 'Support', val: '24/7' }
                        ].map((stat, i) => (
                            <Grid size={{ xs: 6, md: 3 }} key={i}>
                                <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, color: '#667eea' }}>{stat.val}</Typography>
                                <Typography variant="h6" sx={{ opacity: 0.7, fontWeight: 700 }}>{stat.label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CTA Section */}
            <Box sx={{ py: 15, textAlign: 'center' }}>
                <Container maxWidth="sm">
                    <Paper elevation={0} sx={{
                        p: 6,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                        color: 'white'
                    }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, letterSpacing: -1 }}>
                            Ready to transform your practice?
                        </Typography>
                        <Typography variant="h6" sx={{ mb: 5, opacity: 0.8, fontWeight: 500 }}>
                            Join hundreds of top CA firms using My CA File to manage their operations.
                        </Typography>
                        <Button size="large" variant="contained" onClick={() => navigate('/login')} sx={{
                            px: 5,
                            py: 2,
                            borderRadius: 3,
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            bgcolor: 'white',
                            color: '#1e1b4b',
                            '&:hover': { bgcolor: '#f9fafb' }
                        }}>
                            Get Started Free
                        </Button>
                    </Paper>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 10, bgcolor: '#f9fafb', borderTop: '1px solid #f0f0f0' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
                                <Box sx={{ bgcolor: '#667eea', p: 0.5, borderRadius: 1 }}>
                                    <ShieldOutlined sx={{ color: 'white', fontSize: 24 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={900} color="#1e1b4b">
                                    My CA File
                                </Typography>
                            </Stack>
                            <Typography variant="body1" sx={{ color: '#6b7280', mb: 4 }}>
                                The ultimate practice management software for Chartered Accountants in India. High security, multi-tenant.
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Product</Typography>
                            <Stack spacing={2}>
                                {['Features', 'Updates', 'Security', 'Enterprise'].map(item => (
                                    <Typography key={item} variant="body2" sx={{ color: '#6b7280', cursor: 'pointer' }}>{item}</Typography>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Company</Typography>
                            <Stack spacing={2}>
                                {['About', 'Careers', 'Contact', 'Blog'].map(item => (
                                    <Typography key={item} variant="body2" sx={{ color: '#6b7280', cursor: 'pointer' }}>{item}</Typography>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Subscribe</Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>Get the latest updates in your inbox.</Typography>
                            <Stack direction="row" spacing={1}>
                                <TextField placeholder="Email" size="small" fullWidth sx={{ bgcolor: 'white' }} />
                                <Button variant="contained" sx={{ px: 3, fontWeight: 800 }}>Join</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 8 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                            © 2026 My CA File. All rights reserved. Built for Chartered Accountants.
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Typography variant="body2" sx={{ color: '#6b7280', cursor: 'pointer' }}>Privacy Policy</Typography>
                            <Typography variant="body2" sx={{ color: '#6b7280', cursor: 'pointer' }}>Terms of Service</Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};


