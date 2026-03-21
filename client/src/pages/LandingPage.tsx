import React from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    Stack,
    Card,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    IconButton,
    Paper,
    Divider,
    TextField,
    Avatar,
    Rating,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Menu as MenuIcon,
    ShieldOutlined,
    Speed as SpeedIcon,
    Groups as GroupsIcon,
    Language as LanguageIcon,
    CloudDone as CloudIcon,
    CheckCircle as CheckCircleIcon,
    ReceiptLong as ReceiptIcon,
    Stars as StarsIcon,
    LockOutlined as LockOutlinedIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const MotionBox = motion(Box);

export const LandingPage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const toggleMobileMenu = (open: boolean) => () => {
        setMobileMenuOpen(open);
    };

    const navItems = [
        { name: 'Solutions', id: 'solutions' },
        { name: 'Features', id: 'features' },
        { name: 'Testimonials', id: 'testimonials' },
        { name: 'Pricing', id: 'pricing' }
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const solutions = [
        {
            title: 'Manage Multiple Firms',
            desc: 'Isolated data environments for every branch or sister concern under one master login.',
            icon: <GroupsIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
            bgColor: '#f5f3ff'
        },
        {
            title: 'Automated Compliance',
            desc: 'Real-time tracking for ITR, GST, and Audit deadlines with intelligent reminders.',
            icon: <SpeedIcon sx={{ fontSize: 32, color: '#ec4899' }} />,
            bgColor: '#fdf2f8'
        },
        {
            title: 'White-Labeled Experience',
            desc: 'Custom subdomains and branding for your CA practice to impress your clients.',
            icon: <LanguageIcon sx={{ fontSize: 32, color: '#0ea5e9' }} />,
            bgColor: '#f0f9ff'
        }
    ];

    const testimonials = [
        {
            name: 'CA Rajesh Mehra',
            firm: 'Mehra & Associates, Varachha, Surat',
            comment: "The multi-tenant isolation is revolutionary. Each of our branches operates seamlessly without data overlaps. A must-have for large firms in Surat.",
            avatar: '/ca-review-1.webp',
            reviewId: 1,
            rating: 5
        },
        {
            name: 'CA Sneha Patel',
            firm: 'Patel & Co., Vesu, Surat',
            comment: "Managing 1000+ ITR filings used to be a headache. With the automated tracking, our efficiency has spiked by over 60%. Highly recommend!",
            avatar: '/ca-review-2.webp',
            reviewId: 2,
            rating: 5
        },
        {
            name: 'CA Amit Shah',
            firm: 'Shah & Partners, Adajan, Surat',
            comment: "The document vault and billing system are game changers. We've moved 100% of our client documentation to My CA File safely.",
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
            reviewId: 3,
            rating: 4.5
        }
    ];

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>
            <Helmet>
                <title>My CA File | Best CA Practice Management Software for Indian Firms</title>
                <meta name="description" content="Ultimate office portal for Chartered Accountants in India. Manage ITR, GST, Audits, Billing and Clients with a secure, multi-tenant SaaS platform built for professional CA firms." />
                <meta name="keywords" content="CA Practice Management Software, GST Software for CA, ITR Filing Tool for CA India, CA Firm Office Management, My CA File Surat, Accountant Portal India, SaaS for CA" />
                <link rel="canonical" href="https://www.mycafile.in" />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://www.mycafile.in" />
                <meta property="og:title" content="My CA File | Premium CA Practice Management Software" />
                <meta property="og:description" content="Scale your CA firm with My CA File. Manage clients, compliance, and team workflows in one secure platform." />
                <meta property="og:image" content="https://www.mycafile.in/og-image.webp" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://www.mycafile.in" />
                <meta property="twitter:title" content="My CA File | Premium CA Practice Management Software" />
                <meta property="twitter:description" content="Scale your CA firm with My CA File. Manage clients, compliance, and team workflows in one secure platform." />
            </Helmet>

            {/* Premium Blurred Navbar */}
            <AppBar position="fixed" elevation={0} sx={{
                bgcolor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
            }}>
                <Container maxWidth="lg">
                    <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => window.scrollTo(0, 0)}
                            role="button"
                            aria-label="Home - Scroll to top"
                        >
                            <Box sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                p: 0.8,
                                borderRadius: '12px',
                                display: 'flex'
                            }}>
                                <ShieldOutlined sx={{ color: 'white', fontSize: 26 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={1000} color="#1e1b4b" sx={{ letterSpacing: -1.5, display: { xs: 'none', sm: 'block' } }}>
                                My CA File
                            </Typography>
                        </Stack>

                        {!isMobile && (
                            <Stack direction="row" spacing={4} alignItems="center">
                                {navItems.map((item) => (
                                    <Typography key={item.name} variant="body2" fontWeight={700} onClick={() => scrollToSection(item.id)} sx={{
                                        cursor: 'pointer',
                                        color: '#4b5563',
                                        '&:hover': { color: '#6366f1' },
                                        transition: 'color 0.2s'
                                    }}>
                                        {item.name}
                                    </Typography>
                                ))}
                                <Button
                                    variant="text"
                                    onClick={() => navigate('/superadmin')}
                                    sx={{ color: '#1e1b4b', fontWeight: 800, textTransform: 'none' }}
                                >
                                    Log In
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/superadmin')}
                                    sx={{
                                        borderRadius: '12px',
                                        px: 3,
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)'
                                    }}
                                >
                                    Try it Free
                                </Button>
                            </Stack>
                        )}

                        {isMobile && (
                            <IconButton color="inherit" onClick={toggleMobileMenu(true)} sx={{ color: '#1e1b4b' }} aria-label="open mobile menu">
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Toolbar>
                </Container>

                {/* Mobile Drawer */}
                <Drawer
                    anchor="right"
                    open={mobileMenuOpen}
                    onClose={toggleMobileMenu(false)}
                    PaperProps={{
                        sx: { width: '280px', p: 2 }
                    }}
                >
                    <Box sx={{ mb: 4, mt: 2, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={1000} color="#1e1b4b">
                            My CA File
                        </Typography>
                    </Box>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.name} disablePadding>
                                <ListItemButton onClick={() => { scrollToSection(item.id); setMobileMenuOpen(false); }} sx={{ borderRadius: '12px', mb: 1 }}>
                                    <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 700, color: '#4b5563' }} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                        <Divider sx={{ my: 2 }} />
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/superadmin')} sx={{ borderRadius: '12px', mb: 1, bgcolor: '#f3f4f6' }}>
                                <ListItemText primary="Log In" primaryTypographyProps={{ fontWeight: 800, color: '#1e1b4b' }} />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => navigate('/superadmin')}
                                sx={{
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    color: 'white'
                                }}
                            >
                                <ListItemText primary="Try it Free" primaryTypographyProps={{ fontWeight: 800 }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Drawer>
            </AppBar>

            {/* Background Blobs for Aesthetic */}
            <Box sx={{ position: 'relative', pt: 15, overflow: 'hidden' }}>
                <Box sx={{
                    position: 'absolute',
                    top: -200,
                    right: -200,
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                    zIndex: -1
                }} />
                <Box sx={{
                    position: 'absolute',
                    top: 200,
                    left: -300,
                    width: 800,
                    height: 800,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)',
                    zIndex: -1
                }} />

                <Container maxWidth="lg">
                    {/* Hero Section */}
                    <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Typography variant="overline" sx={{
                                color: '#6366f1',
                                fontWeight: 900,
                                letterSpacing: 3,
                                bgcolor: '#f5f3ff',
                                px: 2,
                                py: 0.5,
                                borderRadius: 10,
                                mb: 3,
                                display: 'inline-block'
                            }}>
                                OVER 500+ FIRMS TRUSTED
                            </Typography>
                            <Typography variant="h1" sx={{
                                fontSize: { xs: '2.2rem', md: '4.5rem' },
                                fontWeight: 1000,
                                color: '#0f172a',
                                lineHeight: { xs: 1.2, md: 1.1 },
                                mb: 3,
                                letterSpacing: { xs: -1, md: -2.5 }
                            }}>
                                Best CA practice <br />
                                <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    management
                                </span> software for Indian CA firms
                            </Typography>
                            <Typography variant="h5" sx={{
                                color: '#64748b',
                                maxWidth: '700px',
                                mx: 'auto',
                                mb: 6,
                                px: { xs: 2, sm: 0 },
                                fontSize: { xs: '0.95rem', md: '1.5rem' },
                                lineHeight: 1.6,
                                fontWeight: 500
                            }}>
                                The world's simplest and fastest platform for CA firms. Manage ITR, GST, Billing, and Team Collaboration in one unified dashboard.
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 10, px: { xs: 4, sm: 0 } }}>
                                <Button
                                    size={isMobile ? "medium" : "large"}
                                    variant="contained"
                                    onClick={() => navigate('/superadmin')}
                                    sx={{
                                        px: { xs: 3, md: 5 },
                                        py: { xs: 1.5, md: 2 },
                                        borderRadius: '16px',
                                        fontSize: { xs: '0.95rem', md: '1.1rem' },
                                        fontWeight: 1000,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.25)',
                                        '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s' }
                                    }}
                                >
                                    Get Started Free
                                </Button>
                                <Button
                                    size={isMobile ? "medium" : "large"}
                                    variant="outlined"
                                    sx={{
                                        px: { xs: 3, md: 5 },
                                        py: { xs: 1.5, md: 2 },
                                        borderRadius: '16px',
                                        fontSize: { xs: '0.95rem', md: '1.1rem' },
                                        fontWeight: 1000,
                                        textTransform: 'none',
                                        borderColor: '#e2e8f0',
                                        color: '#1e293b',
                                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                                    }}
                                >
                                    Watch Video
                                </Button>
                            </Stack>
                        </motion.div>

                        {/* Large Hero Image Mockup */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            style={{ position: 'relative' }}
                        >
                            <Box sx={{
                                position: 'relative',
                                mx: 'auto',
                                maxWidth: '1000px',
                                perspective: '1000px'
                            }}>
                                <img
                                    src="/landing-hero-new.webp"
                                    alt="My CA File Dashboard Mockup - CA Practice Management Software"
                                    fetchPriority="high"
                                    loading="eager"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '24px',
                                        boxShadow: '0 50px 100px -20px rgba(15, 23, 42, 0.15)',
                                        border: '1px solid rgba(255,255,255,0.8)',
                                        zIndex: 2,
                                        position: 'relative'
                                    }}
                                />
                                {/* Decorative elements behind image */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: -30,
                                    left: '10%',
                                    width: '80%',
                                    height: '40px',
                                    bgcolor: 'rgba(99, 102, 241, 0.3)',
                                    filter: 'blur(50px)',
                                    zIndex: 1
                                }} />
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Solutions Grid */}
                    <Box id="solutions" sx={{ py: { xs: 10, md: 15 } }}>
                        <Box sx={{ textAlign: 'center', mb: 8 }}>
                            <Typography variant="h3" sx={{
                                fontWeight: 1000,
                                color: '#0f172a',
                                mb: 2,
                                letterSpacing: -1,
                                fontSize: { xs: '1.75rem', md: '3rem' }
                            }}>
                                Solution made for you
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: '#64748b',
                                fontSize: { xs: '0.9rem', md: '1.1rem' },
                                maxWidth: 600,
                                mx: 'auto',
                                px: { xs: 2, sm: 0 }
                            }}>
                                Our innovative solution is specifically designed to streamline your CA practice workflow, boost efficiency, and eliminate distractions.
                            </Typography>
                        </Box>

                        <Grid container spacing={4}>
                            {solutions.map((sol, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <MotionBox
                                        whileHover={{ y: -10 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        sx={{
                                            p: { xs: 3, md: 4 },
                                            height: '100%',
                                            borderRadius: '24px',
                                            bgcolor: sol.bgColor,
                                            border: '1px solid rgba(0,0,0,0.02)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 64,
                                            height: 64,
                                            borderRadius: '16px',
                                            bgcolor: 'white',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.03)'
                                        }}>
                                            {sol.icon}
                                        </Box>
                                        <Typography variant="h5" sx={{
                                            fontWeight: 1000,
                                            color: '#1e293b',
                                            fontSize: { xs: '1.25rem', md: '1.5rem' }
                                        }}>
                                            {sol.title}
                                        </Typography>
                                        <Typography variant="body1" sx={{
                                            color: '#475569',
                                            lineHeight: 1.7,
                                            fontSize: { xs: '0.875rem', md: '1rem' }
                                        }}>
                                            {sol.desc}
                                        </Typography>
                                    </MotionBox>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Detailed Feature 1 */}
                    <Grid id="features" container spacing={{ xs: 6, md: 8 }} alignItems="center" sx={{ py: 10 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 900, letterSpacing: 2 }}>
                                DATA FOCUS
                            </Typography>
                            <Typography variant="h2" sx={{
                                fontWeight: 1000,
                                color: '#0f172a',
                                mb: 3,
                                mt: 1,
                                letterSpacing: { xs: -1, md: -2 },
                                lineHeight: { xs: 1.2, md: 1.1 },
                                fontSize: { xs: '1.8rem', md: '3.75rem' }
                            }}>
                                Analyze your data <br /> with powerful tools
                            </Typography>
                            <Typography variant="body1" sx={{
                                color: '#64748b',
                                fontSize: { xs: '0.9rem', md: '1.2rem' },
                                mb: 4,
                                lineHeight: 1.7
                            }}>
                                Track client compliance health across all firms in real-time. Our advanced dashboard provides insights that help you stay ahead of regulatory deadlines.
                            </Typography>
                            <Stack spacing={2.5}>
                                {
                                    [
                                        { text: 'Dynamic Compliance Tracker', icon: <CheckCircleIcon sx={{ color: '#6366f1' }} /> },
                                        { text: 'Automated Billing & Reporting', icon: <CheckCircleIcon sx={{ color: '#6366f1' }} /> },
                                        { text: 'Secure PDF Generation', icon: <CheckCircleIcon sx={{ color: '#6366f1' }} /> }
                                    ].map((item, i) => (
                                        <Stack direction="row" spacing={1.5} alignItems="center" key={i}>
                                            {item.icon}
                                            <Typography variant="body1" sx={{
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                fontSize: { xs: '0.9rem', md: '1rem' }
                                            }}>{item.text}</Typography>
                                        </Stack>
                                    ))
                                }
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{
                                p: 2,
                                bgcolor: '#f8fafc',
                                borderRadius: '32px',
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <Box
                                    component="img"
                                    src="/landing-analytics.webp"
                                    alt="Client Compliance Analytics Dashboard - My CA File"
                                    sx={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}
                                />
                                <Box sx={{
                                    position: 'absolute',
                                    top: -40,
                                    right: -20,
                                    bgcolor: 'white',
                                    p: 3,
                                    borderRadius: '24px',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                                    display: { xs: 'none', lg: 'block' }
                                }}>
                                    <Stack spacing={1}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 900 }}>EFFICIENCY BOOST</Typography>
                                        <Typography variant="h4" sx={{ color: '#22c55e', fontWeight: 1000 }}>+84%</Typography>
                                    </Stack>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Testimonials */}
                    <Box id="testimonials" sx={{ py: 15, textAlign: 'center' }}>
                        <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 900, letterSpacing: 2, fontSize: '0.75rem' }}>
                            CLIENT STORIES
                        </Typography>
                        <Typography variant="h3" sx={{
                            fontWeight: 1000,
                            color: '#0f172a',
                            mb: { xs: 4, md: 8 },
                            letterSpacing: -1,
                            fontSize: { xs: '1.75rem', md: '3rem' }
                        }}>
                            Trusted by Surat's Leading CA Firms
                        </Typography>

                        <Grid container spacing={4}>
                            {testimonials.map((test, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                    <Card sx={{
                                        borderRadius: '24px',
                                        p: { xs: 3, md: 4 },
                                        height: '100%',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                        '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.08)', transform: 'translateY(-5px)' },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        textAlign: 'left'
                                    }}>
                                        <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                                            <Avatar src={test.avatar} alt={`${test.name} - ${test.firm}`} sx={{ width: 56, height: 56, border: '2px solid #6366f1' }} />
                                            <Box>
                                                <Typography variant="subtitle1" sx={{
                                                    fontWeight: 800,
                                                    color: '#1e293b',
                                                    fontSize: { xs: '0.9rem', md: '1rem' }
                                                }}>{test.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{test.firm}</Typography>
                                            </Box>
                                        </Stack>
                                        <Rating value={test.rating} precision={0.5} readOnly sx={{ color: '#f59e0b', mb: 2 }} />
                                        <Typography variant="body1" sx={{
                                            color: '#475569',
                                            fontStyle: 'italic',
                                            lineHeight: 1.7,
                                            fontSize: { xs: '0.85rem', md: '1rem' }
                                        }}>
                                            "{test.comment}"
                                        </Typography>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* CA SaaS Subscription Pricing Section */}
                    <Box id="pricing" sx={{ py: 15, bgcolor: '#fbfbfb', borderRadius: '40px', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #ffffff, #f7f6f4)', pointerEvents: 'none' }} />
                        
                        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                            <Box sx={{ textAlign: 'center', mb: 10 }}>
                                <Box sx={{ 
                                    display: 'inline-flex', 
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    gap: 2, 
                                    background: 'linear-gradient(135deg, #FF602E 0%, #FF6FB5 100%)', 
                                    color: 'white', 
                                    px: 3, 
                                    py: 1, 
                                    borderRadius: '12px', 
                                    mb: 4,
                                    boxShadow: '0 8px 16px rgba(255, 96, 46, 0.15)'
                                }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <StarsIcon sx={{ fontSize: 18 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                            Special Launch Pricing
                                        </Typography>
                                    </Stack>
                                </Box>
                                
                                <Typography variant="h2" sx={{ 
                                    fontWeight: 1000, 
                                    color: '#0f172a', 
                                    mb: 2, 
                                    letterSpacing: -1.5, 
                                    fontSize: { xs: '2.5rem', md: '3.75rem' },
                                    lineHeight: 1.1
                                }}>
                                    Simple Pricing for Modern CA Firms
                                </Typography>
                                
                                <Typography variant="h6" sx={{ color: '#64748b', maxWidth: '700px', mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                                    Manage clients, automate compliance, and grow your CA practice with ease.
                                </Typography>
                            </Box>

                            <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                                {[
                                    {
                                        name: 'Starter Plan',
                                        tagline: 'Ideal for newly set up firms',
                                        price: '299',
                                        period: 'month',
                                        features: [
                                            'Manage up to 50 clients',
                                            'GST, ITR & Compliance tracking',
                                            'Automated reminders',
                                            'Secure client data storage',
                                            'Email support'
                                        ],
                                        cta: 'Start Now',
                                        recommended: false,
                                        badge: null
                                    },
                                    {
                                        name: 'Professional Plan',
                                        tagline: 'Powerful features for growing firms',
                                        price: '599',
                                        period: 'month',
                                        features: [
                                            'Manage up to 150 clients',
                                            'GST, ITR, ROC modules',
                                            'Advanced reports & analytics',
                                            'Client portal access',
                                            'Priority 24/7 support'
                                        ],
                                        cta: 'Upgrade Now',
                                        recommended: true,
                                        badge: 'Most Popular'
                                    },
                                    {
                                        name: 'Enterprise Plan',
                                        tagline: 'Ultimate automation for large firms',
                                        price: '999',
                                        period: 'month',
                                        features: [
                                            'Unlimited clients',
                                            'Full automation suite',
                                            'Team management & hierarchy',
                                            'White-label branding',
                                            'WhatsApp + Call support',
                                            'Dedicated account manager'
                                        ],
                                        cta: 'Get Started',
                                        recommended: false,
                                        badge: 'Best Value'
                                    }
                                ].map((plan, i) => (
                                    <Grid size={{ xs: 12, md: 4 }} key={i}>
                                        <Card sx={{
                                            p: { xs: 4, md: 5 },
                                            borderRadius: '32px',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'all 0.4s ease',
                                            border: plan.recommended ? '2px solid #FF602E' : '1px solid #e2e8f0',
                                            position: 'relative',
                                            transform: plan.recommended ? { md: 'scale(1.03)' } : 'none',
                                            boxShadow: plan.recommended ? '0 30px 60px rgba(0,0,0,0.08)' : '0 10px 30px rgba(0,0,0,0.02)',
                                            '&:hover': {
                                                transform: plan.recommended ? { md: 'scale(1.05) translateY(-5px)' } : 'translateY(-5px)',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.1)'
                                            }
                                        }}>
                                            {plan.badge && (
                                                <Box sx={{ 
                                                    position: 'absolute', 
                                                    top: -16, 
                                                    left: '50%', 
                                                    transform: 'translateX(-50%)', 
                                                    bgcolor: plan.recommended ? '#FF602E' : '#1e293b', 
                                                    color: 'white', 
                                                    px: 3, 
                                                    py: 0.8, 
                                                    borderRadius: 10, 
                                                    fontSize: '0.75rem', 
                                                    fontWeight: 900,
                                                    letterSpacing: 1,
                                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                                }}>
                                                    {plan.badge.toUpperCase()}
                                                </Box>
                                            )}
                                            
                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="h5" sx={{ fontWeight: 1000, color: '#0f172a', mb: 1 }}>{plan.name}</Typography>
                                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{plan.tagline}</Typography>
                                            </Box>

                                            <Box sx={{ mb: 5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>₹</Typography>
                                                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#1e293b', fontSize: '3.5rem', letterSpacing: -2 }}>
                                                        {plan.price}
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>/{plan.period}</Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                                                    Billed monthly
                                                </Typography>
                                            </Box>

                                            <Stack spacing={2.2} sx={{ mb: 6, flexGrow: 1 }}>
                                                {plan.features.map((feat, j) => (
                                                    <Stack direction="row" spacing={1.5} alignItems="flex-start" key={j}>
                                                        <CheckCircleIcon sx={{ fontSize: 18, color: plan.recommended ? '#FF602E' : '#22c55e', mt: 0.3 }} />
                                                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.4 }}>{feat}</Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>

                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => navigate('/superadmin')}
                                                sx={{
                                                    borderRadius: '16px',
                                                    py: 2,
                                                    fontSize: '1rem',
                                                    fontWeight: 900,
                                                    textTransform: 'none',
                                                    background: plan.recommended ? 'linear-gradient(135deg, #FF602E 0%, #E25529 100%)' : '#1e293b',
                                                    color: 'white',
                                                    boxShadow: plan.recommended ? '0 10px 30px rgba(255, 96, 46, 0.25)' : 'none',
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        background: plan.recommended ? 'linear-gradient(135deg, #E25529 0%, #FF602E 100%)' : '#000',
                                                        transform: 'scale(1.02)'
                                                    }
                                                }}
                                            >
                                                {plan.cta}
                                            </Button>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Trust & Verification Signals */}
                            <Box sx={{ mt: 10, textAlign: 'center' }}>
                                <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 700, mb: 4 }}>
                                    Trusted by 100+ CA firms across India
                                </Typography>
                                <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                                    {[
                                        { label: '100% Secure & Confidential', icon: <ShieldOutlined sx={{ fontSize: 20 }} /> },
                                        { label: 'Built for Indian Tax System', icon: <LanguageIcon sx={{ fontSize: 20 }} /> },
                                        { label: 'ISO 27001 Certified Data', icon: <LockOutlinedIcon sx={{ fontSize: 20 }} /> }
                                    ].map((item, i) => (
                                        <Grid size={{ xs: 12, md: 4 }} key={i}>
                                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: '#4b5563', justifyContent: 'center' }}>
                                                <Box sx={{ color: '#FF602E' }}>{item.icon}</Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.label}</Typography>
                                            </Stack>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Container>
                    </Box>



                    {/* Stats Section moved below pricing */}
                    <Paper elevation={0} sx={{
                        py: 8,
                        px: 4,
                        borderRadius: '40px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: 'white',
                        textAlign: 'center',
                        mb: 15,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                        <Grid container spacing={4} sx={{ position: 'relative' }}>
                            {[
                                { label: 'Active Firms', val: '500+', icon: <GroupsIcon sx={{ fontSize: 40 }} /> },
                                { label: 'Files Managed', val: '1M+', icon: <CloudIcon sx={{ fontSize: 40 }} /> },
                                { label: 'Invoices Paid', val: '₹40Cr+', icon: <ReceiptIcon sx={{ fontSize: 40 }} /> },
                                { label: 'Uptime', val: '99.9%', icon: <SpeedIcon sx={{ fontSize: 40 }} /> }
                            ].map((stat, i) => (
                                <Grid size={{ xs: 6, md: 3 }} key={i}>
                                    <Box sx={{ mb: 2, color: '#6366f1' }}>{stat.icon}</Box>
                                    <Typography variant="h4" sx={{ fontWeight: 1000, mb: 1 }}>{stat.val}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700 }}>{stat.label}</Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Final CTA */}
                    <Box sx={{ py: 10, textAlign: 'center', mb: 10 }}>
                        <Typography variant="h2" sx={{
                            fontWeight: 1000,
                            color: '#0f172a',
                            mb: 4,
                            letterSpacing: -2,
                            fontSize: { xs: '1.8rem', md: '3.75rem' }
                        }}>
                            Ready to scale your <br /> practice?
                        </Typography>
                        <Button
                            size={isMobile ? "medium" : "large"}
                            variant="contained"
                            onClick={() => navigate('/superadmin')}
                            sx={{
                                px: { xs: 5, md: 10 },
                                py: { xs: 1.5, md: 2.5 },
                                borderRadius: '20px',
                                fontSize: { xs: '1rem', md: '1.2rem' },
                                fontWeight: 1000,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                boxShadow: '0 20px 50px rgba(99, 102, 241, 0.3)',
                            }}
                        >
                            Get Started Now
                        </Button>
                        <Typography variant="body2" sx={{
                            mt: 3,
                            color: '#64748b',
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', md: '0.875rem' }
                        }}>
                            No credit card required • 14-day free trial • Cancel anytime
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ py: 10, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', p: 0.8, borderRadius: '10px' }}>
                                    <ShieldOutlined sx={{ color: 'white', fontSize: 24 }} />
                                </Box>
                                <Typography variant="h6" fontWeight={1000} color="#1e1b4b">
                                    My CA File
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 300, lineHeight: 1.8, mb: 4 }}>
                                The ultimate practice management software for Chartered Accountants in India. High security, multi-tenant, and purpose-built.
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                {['LinkedIn', 'Twitter', 'YouTube'].map(social => (
                                    <Typography key={social} variant="caption" sx={{ fontWeight: 800, cursor: 'pointer', color: '#1e293b' }}>{social}</Typography>
                                ))}
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 6, md: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 3 }}>Solutions</Typography>
                            <Stack spacing={2}>
                                <Typography variant="body2" onClick={() => navigate('/gst-software-india')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>GST Software</Typography>
                                <Typography variant="body2" onClick={() => navigate('/itr-filing-software')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>ITR Software</Typography>
                                <Typography variant="body2" onClick={() => navigate('/ca-practice-management')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Practice Management</Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Security</Typography>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 6, md: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 3 }}>Company</Typography>
                            <Stack spacing={2}>
                                <Typography variant="body2" onClick={() => navigate('/about')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>About</Typography>
                                <Typography variant="body2" onClick={() => navigate('/careers')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Careers</Typography>
                                <Typography variant="body2" onClick={() => navigate('/contact')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Contact</Typography>
                                <Typography variant="body2" onClick={() => navigate('/press')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Press</Typography>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 3 }}>Newsletter</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>Get the latest updates on tax compliance and software features.</Typography>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    placeholder="Enter your email"
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    sx={{ bgcolor: 'white', '& fieldset': { borderRadius: '12px' } }}
                                />
                                <Button variant="contained" sx={{ px: 3, borderRadius: '12px', bgcolor: '#1e293b', fontWeight: 800 }}>Join</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 8, borderColor: '#e2e8f0' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            © 2026 My CA File. All rights reserved. Created for Chartered Accountants in Surat, Gujarat.
                        </Typography>
                        <Stack direction="row" spacing={4}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Privacy Policy</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Terms of Service</Typography>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};
