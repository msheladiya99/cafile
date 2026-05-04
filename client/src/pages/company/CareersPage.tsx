import React from 'react';
import { Box, Container, Typography, Stack, Card, Chip, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import {
    Code as EngineerIcon,
    SupportAgent as SupportIcon,
    Campaign as MarketingIcon,
    DesignServices as DesignIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const openings = [
    {
        role: 'Full Stack Engineer (React + Node.js)',
        type: 'Full-Time · Remote',
        icon: <EngineerIcon sx={{ color: '#6366f1', fontSize: 28 }} />,
        desc: 'Build and scale the core My CA File platform. Work on React, TypeScript, Node.js, MongoDB, and cloud infrastructure.',
        tags: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    },
    {
        role: 'Customer Success Manager',
        type: 'Full-Time · Surat / Remote',
        icon: <SupportIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />,
        desc: 'Help CA firms onboard, get value, and grow with My CA File. You\'ll be the face of the product to our customers.',
        tags: ['SaaS', 'Onboarding', 'CA Knowledge', 'Communication'],
    },
    {
        role: 'Growth & SEO Specialist',
        type: 'Part-Time / Freelance',
        icon: <MarketingIcon sx={{ color: '#ec4899', fontSize: 28 }} />,
        desc: 'Drive organic growth for one of India\'s fastest-growing CA SaaS. SEO, content, and paid growth experiments.',
        tags: ['SEO', 'Content Marketing', 'Google Ads', 'Analytics'],
    },
    {
        role: 'Product Designer (UI/UX)',
        type: 'Contract / Full-Time',
        icon: <DesignIcon sx={{ color: '#f59e0b', fontSize: 28 }} />,
        desc: 'Design the next generation of our CA platform. Own the design system, user research, and shipped product UI.',
        tags: ['Figma', 'Design Systems', 'B2B SaaS', 'Prototyping'],
    },
];

const perks = [
    ['🏠', 'Remote-First', 'Work from anywhere in India. We believe great work doesn\'t need a fixed office.'],
    ['📈', 'Equity Opportunity', 'Early team members get equity. You grow when the company grows.'],
    ['🎓', 'Learning Budget', '₹30,000/year to spend on courses, books, and conferences.'],
    ['🏥', 'Health Insurance', 'Full medical coverage for you and your immediate family.'],
    ['🕐', 'Flexible Hours', 'We care about output, not hours. Work when you\'re most productive.'],
    ['🚀', 'Fast Growth', 'Join a startup that\'s growing 200% YoY. Your impact will be visible.'],
];

const CareersPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>Careers at My CA File | Jobs in CA SaaS Startup India</title>
                <meta name="description" content="Join My CA File — India's leading CA practice management SaaS. We're hiring engineers, designers, and growth specialists. Remote-first, equity, and fast growth." />
                <link rel="canonical" href="https://mycafile.in/careers" />
                
                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Careers at My CA File | Grow with us" />
                <meta property="og:description" content="Join our remote-first team building the future of CA practice software in India. Engineering, Growth, and Success roles." />
                <meta property="og:url" content="https://mycafile.in/careers" />
                <meta property="og:image" content="https://mycafile.in/og-careers.png" />
                
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Careers at My CA File | Jobs in India" />
                <meta name="twitter:description" content="Join our remote-first team building the future of CA practice software in India." />
                <meta name="twitter:image" content="https://mycafile.in/og-careers.png" />

                {/* Structured Data: BreadcrumbList */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://mycafile.in"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "Careers",
                                "item": "https://mycafile.in/careers"
                            }
                        ]
                    }
                `}
                </script>
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip label="We're Hiring" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800, mb: 3 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2, lineHeight: 1.1, mb: 3 }}>
                                Build the future of{' '}
                                <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    CA practices in India
                                </span>
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#64748b', lineHeight: 1.7, maxWidth: 600, mx: 'auto', fontWeight: 400, mb: 4 }}>
                                We're a small, ambitious team building SaaS for India's 300,000+ Chartered Accountants. If you love solving real problems for real users — we want you.
                            </Typography>
                            <Button variant="contained" href="#openings" 
                                sx={{ px: 5, py: 1.8, borderRadius: '12px', fontWeight: 800, textTransform: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                                See Open Roles
                            </Button>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Perks */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, textAlign: 'center', letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Why work at My CA File?</Typography>
                <Typography variant="body1" sx={{ color: '#64748b', textAlign: 'center', mb: 8, fontSize: '1.1rem' }}>We build different. We care about our team.</Typography>
                <Grid container spacing={3}>
                    {perks.map(([emoji, title, desc], i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 3.5, borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'none', height: '100%' }}>
                                <Typography sx={{ fontSize: '2rem', mb: 1.5 }}>{emoji}</Typography>
                                <Typography variant="subtitle1" fontWeight={800} color="#1e293b" mb={0.5}>{title}</Typography>
                                <Typography variant="body2" color="#64748b" lineHeight={1.7}>{desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Open Roles */}
            <Box id="openings" sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Open Positions</Typography>
                    <Stack spacing={3}>
                        {openings.map((job, i) => (
                            <Card key={i} sx={{ p: 4, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none', '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }, transition: 'all 0.2s' }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box sx={{ p: 1.5, bgcolor: '#f5f3ff', borderRadius: '12px' }}>{job.icon}</Box>
                                        <Box>
                                            <Typography variant="h6" fontWeight={800} color="#1e293b">{job.role}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{job.type}</Typography>
                                        </Box>
                                    </Stack>
                                    <Button onClick={() => navigate('/contact')} variant="outlined"
                                        endIcon={<ArrowIcon />}
                                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: '#6366f1', color: '#6366f1', whiteSpace: 'nowrap' }}>
                                        Apply Now
                                    </Button>
                                </Stack>
                                <Typography variant="body2" color="#64748b" sx={{ mt: 2, lineHeight: 1.7 }}>{job.desc}</Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1} mt={2}>
                                    {job.tags.map(tag => (
                                        <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 700, fontSize: '0.7rem' }} />
                                    ))}
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                    <Box sx={{ textAlign: 'center', mt: 8 }}>
                        <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>Don't see a fit? Send your profile anyway.</Typography>
                        <Button variant="contained" onClick={() => navigate('/contact')}
                            sx={{ px: 5, py: 1.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                            Send Open Application
                        </Button>
                    </Box>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default CareersPage;
