import React from 'react';
import { Box, Button, Container, Typography, Stack, Card, Chip, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    CheckCircle as CheckCircleIcon,
    AssignmentTurnedIn as TaskIcon,
    NotificationsActive as AlertIcon,
    BarChart as AnalyticsIcon,
    FolderOpen as FolderIcon,
    VerifiedUserOutlined as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { FAQAccordion } from '../../components/FAQAccordion';

const features = [
    { icon: <TaskIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'ITR Status Tracker', desc: 'Track filing status of each client\'s ITR — pending, in-progress, e-verified — all on one screen.' },
    { icon: <AlertIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'Deadline Alerts', desc: 'Automated reminders for ITR due dates so you and your team never miss a filing deadline again.' },
    { icon: <FolderIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'Document Collection', desc: 'A client portal that allows clients to upload Form 16, bank statements, and proof — no WhatsApp chaos.' },
    { icon: <AnalyticsIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'Month-wise Reports', desc: 'See how many ITRs were filed each month, by each employee, with detailed performance dashboards.' },
    { icon: <CheckCircleIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'Task Assignment', desc: 'Assign ITR preparation, review, and filing to specific team members with clear accountability.' },
    { icon: <SecurityIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />, title: 'Secure & Audit-Ready', desc: 'Every action is logged. Client data is encrypted. Your firm stays protected and audit-ready.' },
];

const faqs = [
    { q: 'Is My CA File an ITR filing platform?', a: 'No — My CA File is an ITR workflow management tool for CA firms. It helps you organize, track, and coordinate your team\'s ITR preparation and filing tasks. The actual filing happens on the Income Tax portal.' },
    { q: 'Can I track old year ITRs too?', a: 'Yes. You can create tasks for any assessment year, track their status, and maintain a full history of ITR filings for each client.' },
    { q: 'Does it support corporate ITR (ITR-6, ITR-7)?', a: 'Yes. You can tag and categorize ITR tasks by type (ITR-1 through ITR-7) and manage them all under the same client profile.' },
    { q: 'How does the client portal work?', a: 'Each client gets access to a branded subdomain portal (e.g., yourfirm.mycafile.in). They upload documents, you get notified, and the task automatically moves to the next stage.' },
];

export const ITRSoftwarePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>ITR Filing Software for CA Firms India | My CA File</title>
                <meta name="description" content="Manage ITR filing for 1000+ clients with My CA File. Track ITR status, automate reminders, collect documents, and assign tasks to your team. Best ITR management software for CA firms in India." />
                <meta name="keywords" content="ITR filing software India, income tax return management software, ITR tracker for CA, CA ITR software, best ITR software for chartered accountants" />
                <link rel="canonical" href="https://www.mycafile.in/itr-filing-software" />
                
                <meta property="og:type" content="website" />
                <meta property="og:title" content="ITR Filing Software for CA Firms India | My CA File" />
                <meta property="og:description" content="Manage ITR filing for 1000+ clients. Automate deadlines, collect documents, and assign team tasks." />
                <meta property="og:url" content="https://www.mycafile.in/itr-filing-software" />
                <meta property="og:image" content="https://www.mycafile.in/og-itr.png" />
                
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="ITR Filing Software for CA Firms India | My CA File" />
                <meta name="twitter:description" content="Manage ITR filing for 1000+ clients. Automate deadlines, collect documents, and assign team tasks." />
                <meta name="twitter:image" content="https://www.mycafile.in/og-itr.png" />

                {/* Breadcrumb Schema */}
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
                                "item": "https://www.mycafile.in"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "ITR Software",
                                "item": "https://www.mycafile.in/itr-filing-software"
                            }
                        ]
                    }
                `}
                </script>
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center', maxWidth: 840, mx: 'auto' }}>
                            <Chip label="ITR Management Software" sx={{ bgcolor: '#e0f2fe', color: '#0ea5e9', fontWeight: 800, mb: 3, fontSize: '0.8rem', letterSpacing: 1 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3.8rem' }, fontWeight: 1000, color: '#0f172a', lineHeight: 1.1, letterSpacing: -2, mb: 3 }}>
                                Manage ITR Filing for{' '}
                                <span style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    All Your Clients
                                </span>{' '}at Scale
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 500, mb: 5, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                My CA File is the ITR workflow management software built for Indian CA firms. Track every client's tax return — from document collection to e-verification — in one place.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', boxShadow: '0 15px 35px rgba(14,165,233,0.3)' }}>
                                    Start for Free
                                </Button>
                                <Button size="large" variant="outlined" onClick={() => navigate('/')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: '#d4d4d8' }}>
                                    View All Features
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2.5, fontWeight: 600 }}>Free 14-day trial • No credit card • Used by 500+ CA firms</Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Stats */}
            <Box sx={{ bgcolor: '#0f172a', py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
                        {[['1M+', 'ITRs Tracked'], ['500+', 'CA Firms'], ['60%', 'Time Saved on ITR Prep'], ['4.9/5', 'CA Rating']].map(([val, label]) => (
                            <Box key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ color: '#7dd3fc', fontWeight: 1000 }}>{val}</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Features */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 14 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, fontSize: { xs: '1.75rem', md: '2.75rem' }, letterSpacing: -1 }}>
                        Your complete ITR management toolkit
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
                        Everything from document collection to deadline tracking — purpose-built for Indian CA firms.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9', boxShadow: 'none', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' }, transition: 'all 0.3s' }}>
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0f9ff', borderRadius: '12px', display: 'inline-flex' }}>{f.icon}</Box>
                                <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>{f.title}</Typography>
                                <Typography variant="body2" color="#64748b" lineHeight={1.7}>{f.desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* FAQ */}
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.5rem' }, letterSpacing: -1 }}>
                        Frequently Asked Questions
                    </Typography>
                    <FAQAccordion faqs={faqs} />
                </Container>

            {/* CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 1000, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' }, letterSpacing: -1 }}>
                        Start managing ITRs smarter today
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, fontWeight: 400 }}>500+ CA firms across India trust My CA File for ITR season.</Typography>
                    <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                        sx={{ px: 8, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem', bgcolor: 'white', color: '#0ea5e9', '&:hover': { bgcolor: '#f0f9ff' } }}>
                        Start Your Free Trial
                    </Button>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default ITRSoftwarePage;
