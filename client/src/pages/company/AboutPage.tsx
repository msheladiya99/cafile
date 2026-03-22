import React from 'react';
import { Box, Container, Typography, Stack, Card, Avatar, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import {
    ShieldOutlined,
    TrendingUp as GrowthIcon,
    Groups as TeamIcon,
    Lightbulb as MissionIcon,
} from '@mui/icons-material';

const team = [
    { name: 'Meet Sheladiya', role: 'Founder & CEO', bio: 'Built My CA File after seeing CA firms waste hours on spreadsheets and WhatsApp groups.', avatar: 'M' },
    { name: 'Engineering Team', role: 'Core Platform', bio: 'Our full-stack team ensures the platform is fast, secure, and always improving.', avatar: 'E' },
    { name: 'Customer Success', role: 'Support Team', bio: 'Dedicated to helping CA firms onboard and get maximum value from the platform.', avatar: 'C' },
];

const values = [
    { icon: <MissionIcon sx={{ color: '#6366f1', fontSize: 32 }} />, title: 'Built for CAs, by CAs', desc: 'Every feature is designed around the real workflows of Indian Chartered Accountants — not generic project management.' },
    { icon: <ShieldOutlined sx={{ color: '#6366f1', fontSize: 32 }} />, title: 'Security First', desc: 'Client data is encrypted at rest and in transit. Multi-tenant isolation means zero data crossover between firms.' },
    { icon: <GrowthIcon sx={{ color: '#6366f1', fontSize: 32 }} />, title: 'Grow with Your Firm', desc: 'From a solo practice to a 50-person CA firm — My CA File scales seamlessly with your business.' },
    { icon: <TeamIcon sx={{ color: '#6366f1', fontSize: 32 }} />, title: 'Team Empowerment', desc: 'Give every team member—managers, staff, interns—the right tools and the right access level.' },
];

const AboutPage: React.FC = () => {
    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>About Us | My CA File - CA Practice Management Software</title>
                <meta name="description" content="Learn about My CA File — the leading CA office management software built for Chartered Accountants in India. Our mission, team, and story." />
                <link rel="canonical" href="https://mycafile.in/about" />
                
                <meta property="og:type" content="article" />
                <meta property="og:title" content="About My CA File | Our Mission & Story" />
                <meta property="og:description" content="Modernizing CA practices across India with secure, automated practice management. Meet the team and learn our story." />
                <meta property="og:url" content="https://mycafile.in/about" />
                <meta property="og:image" content="https://mycafile.in/og-about.png" />
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip label="Our Story" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 800, mb: 3 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2, lineHeight: 1.1, mb: 3 }}>
                                We're on a mission to{' '}
                                <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    modernize CA practices
                                </span>{' '}across India
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#64748b', lineHeight: 1.7, maxWidth: 680, mx: 'auto', fontWeight: 400 }}>
                                My CA File was born from a simple frustration: India's Chartered Accountants are brilliant at their work, but buried under administrative chaos. We built the platform we wish had existed.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Stats */}
            <Box sx={{ bgcolor: '#0f172a', py: 5 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="center">
                        {[['2023', 'Year Founded'], ['500+', 'CA Firms'], ['50,000+', 'Clients Managed'], ['Surat, India', 'Headquarters']].map(([val, label]) => (
                            <Grid size={{ xs: 6, md: 3 }} key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ color: '#a5b4fc', fontWeight: 1000, mb: 0.5 }}>{val}</Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Story */}
            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 4, letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                    The Problem We Solved
                </Typography>
                <Stack spacing={3}>
                    {[
                        'Most CA firms in India track client compliance on Excel sheets — manually updated, error-prone, and impossible to share across teams.',
                        'Client documents come over WhatsApp, email, and phone calls. There\'s no single source of truth. Files get lost. Deadlines get missed.',
                        'Billing is done on tally, invoicing on Word — completely disconnected from the actual work being done for clients.',
                        'My CA File connects all of this: clients, tasks, documents, deadlines, team, and billing — in one secure, cloud-based platform built specifically for CA firms.',
                    ].map((text, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box sx={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.3 }}>
                                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>{i + 1}</Typography>
                            </Box>
                            <Typography variant="body1" sx={{ color: i === 3 ? '#1e293b' : '#64748b', fontWeight: i === 3 ? 700 : 400, lineHeight: 1.8, fontSize: '1.1rem' }}>{text}</Typography>
                        </Box>
                    ))}
                </Stack>
            </Container>

            {/* Values */}
            <Box sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Our Values</Typography>
                    <Grid container spacing={4}>
                        {values.map((v, i) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={i}>
                                <Card sx={{ p: 4, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f3ff', borderRadius: '12px', display: 'inline-flex' }}>{v.icon}</Box>
                                    <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>{v.title}</Typography>
                                    <Typography variant="body2" color="#64748b" lineHeight={1.7}>{v.desc}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Team */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>The Team Behind My CA File</Typography>
                <Grid container spacing={4} justifyContent="center">
                    {team.map((member, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center' }}>
                                <Avatar alt={member.name} sx={{ width: 72, height: 72, mx: 'auto', mb: 2, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', fontSize: '1.5rem', fontWeight: 800 }}>{member.avatar}</Avatar>
                                <Typography variant="h6" fontWeight={800} color="#1e293b">{member.name}</Typography>
                                <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, display: 'block', mb: 1.5 }}>{member.role}</Typography>
                                <Typography variant="body2" color="#64748b" lineHeight={1.7}>{member.bio}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <SiteFooter />
        </Box>
    );
};

export default AboutPage;
