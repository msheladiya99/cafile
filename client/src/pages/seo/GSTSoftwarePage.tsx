import React from 'react';
import { Box, Button, Container, Typography, Stack, Card, Divider, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    CheckCircle as CheckCircleIcon,
    Speed as SpeedIcon,
    NotificationsActive as AlertIcon,
    AssessmentOutlined as ReportIcon,
    Groups as GroupsIcon,
    VerifiedUserOutlined as SecurityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { FAQAccordion } from '../../components/FAQAccordion';

const features = [
    { icon: <AlertIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'Automated GST Reminders', desc: 'Never miss a GSTR-1, GSTR-3B, GSTR-9 deadline. Auto-alerts for every client, every month.' },
    { icon: <ReportIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'GST Return Tracker', desc: 'Track filing status for all clients on a single dashboard. Know who\'s filed and who\'s pending instantly.' },
    { icon: <GroupsIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'Multi-Client GST Management', desc: 'Manage GST compliance for 100s of clients simultaneously under one secure platform.' },
    { icon: <SpeedIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'Task Assignment & Tracking', desc: 'Assign GST work to team members, track progress, and approve completed tasks with an audit trail.' },
    { icon: <SecurityIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'Secure Client Portal', desc: 'Give each client a branded portal to upload GST documents securely, reducing follow-up time.' },
    { icon: <CheckCircleIcon sx={{ color: '#6366f1', fontSize: 28 }} />, title: 'Billing & Invoicing', desc: 'Generate GST-compliant invoices for your own clients directly from the platform.' },
];

const faqs = [
    { q: 'Is My CA File a GST filing software?', a: 'My CA File is a GST practice management software for CA firms. It helps you track, manage, and coordinate GST return filing for all your clients — but the actual filing is done on the GST portal. It\'s the layer of organization that makes your filing workflow faster.' },
    { q: 'How many clients can I manage?', a: 'Plans support unlimited clients. You can manage GST compliance for small practitioners with 20 clients to large CA firms with 1000+ clients on the same platform.' },
    { q: 'Is my client\'s data secure?', a: 'Yes. Each firm\'s data is completely isolated. We use enterprise-grade encryption and role-based access control so your staff only sees what they need to.' },
    { q: 'Do you support multiple GST numbers per client?', a: 'Yes. A single client can have multiple GSTINs, and each can be tracked independently with its own deadline and task history.' },
];

export const GSTSoftwarePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>GST Software for CA Firms India | My CA File</title>
                <meta name="description" content="Best GST practice management software for Chartered Accountants in India. Track GSTR-1, GSTR-3B, GSTR-9 deadlines, manage 1000+ clients, and automate workflows. Try free." />
                <meta name="keywords" content="GST software India, GST management software for CA, GST return tracking, GSTR-1 tracker, CA GST software, GST compliance tool India" />
                <link rel="canonical" href="https://www.mycafile.in/gst-software-india" />
                
                <meta property="og:type" content="website" />
                <meta property="og:title" content="GST Software for CA Firms India | My CA File" />
                <meta property="og:description" content="Best GST practice management software for Chartered Accountants. Track returns, manage deadlines, and automate workflows." />
                <meta property="og:url" content="https://www.mycafile.in/gst-software-india" />
                <meta property="og:image" content="https://www.mycafile.in/og-gst.png" />
                
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="GST Software for CA Firms India | My CA File" />
                <meta name="twitter:description" content="Best GST practice management software for Chartered Accountants. Track returns, manage deadlines, and automate workflows." />
                <meta name="twitter:image" content="https://www.mycafile.in/og-gst.png" />

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
                                "name": "GST Software",
                                "item": "https://www.mycafile.in/gst-software-india"
                            }
                        ]
                    }
                `}
                </script>
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto' }}>
                            <Chip label="GST Management Software" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 800, mb: 3, fontSize: '0.8rem', letterSpacing: 1 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3.8rem' }, fontWeight: 1000, color: '#0f172a', lineHeight: 1.1, letterSpacing: -2, mb: 3 }}>
                                GST Software Built for{' '}
                                <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    CA Firms in India
                                </span>
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 500, mb: 5, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                Stop using spreadsheets to track GST returns. My CA File gives you a unified dashboard to manage GSTR-1, GSTR-3B, and GSTR-9 deadlines for every client — automatically.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 15px 35px rgba(99,102,241,0.3)' }}>
                                    Start for Free
                                </Button>
                                <Button size="large" variant="outlined" onClick={() => navigate('/')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: '#d4d4d8' }}>
                                    See All Features
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2.5, fontWeight: 600 }}>No credit card required • Free 14-day trial • Setup in 5 minutes</Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Social Proof Bar */}
            <Box sx={{ bgcolor: '#0f172a', py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
                        {[['500+', 'CA Firms Trust Us'], ['50,000+', 'GST Returns Tracked'], ['99.9%', 'Platform Uptime'], ['< 5 min', 'Setup Time']].map(([val, label]) => (
                            <Box key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ color: '#a5b4fc', fontWeight: 1000 }}>{val}</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Features Grid */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 14 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, fontSize: { xs: '1.75rem', md: '2.75rem' }, letterSpacing: -1 }}>
                        Everything you need to manage GST compliance
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
                        From deadline tracking to client communication — My CA File handles your entire GST workflow.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9', boxShadow: 'none', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' }, transition: 'all 0.3s' }}>
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f3ff', borderRadius: '12px', display: 'inline-flex' }}>{f.icon}</Box>
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

            {/* Final CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 1000, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' }, letterSpacing: -1 }}>
                        Ready to simplify GST management?
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, fontWeight: 400 }}>Join 500+ CA firms already using My CA File.</Typography>
                    <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                        sx={{ px: 8, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem', bgcolor: 'white', color: '#6366f1', '&:hover': { bgcolor: '#f5f3ff' } }}>
                        Start Your Free Trial
                    </Button>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default GSTSoftwarePage;
