import React from 'react';
import { Box, Button, Container, Typography, Stack, Card, Chip, Divider, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Groups as GroupsIcon,
    PeopleAlt as PeopleIcon,
    Folder as FolderIcon,
    BarChart as AnalyticsIcon,
    Receipt as BillingIcon,
    NotificationsActive as AlertIcon,
    CheckCircle as CheckIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { FAQAccordion } from '../../components/FAQAccordion';

const features = [
    { icon: <GroupsIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Multi-Firm Management', desc: 'Manage multiple branch offices or sister firms under one master account. Isolated data, unified control.' },
    { icon: <PeopleIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Client Management', desc: 'Centralized client records with contact details, documents, billing history, and task logs — all linked.' },
    { icon: <AlertIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Compliance Reminders', desc: 'Auto-alerts for GST, ITR, Audit, ROC deadlines. Your team and clients stay informed automatically.' },
    { icon: <FolderIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Document Vault', desc: 'A secure, organized document storage system linked to each client. Google Drive integration included.' },
    { icon: <BillingIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Billing & Invoicing', desc: 'Generate professional invoices, track payments, and manage client ledgers without separate software.' },
    { icon: <AnalyticsIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />, title: 'Practice Analytics', desc: 'Understand which clients are most profitable, which tasks take longest, and how your team performs.' },
];

const testimonials = [
    { name: 'CA Rajesh Mehra', firm: 'Mehra & Associates, Surat', comment: 'Managing 3 offices and 800+ clients was chaotic before My CA File. Now it\'s seamless.', rating: 5 },
    { name: 'CA Sneha Patel', firm: 'Patel & Co., Ahmedabad', comment: 'The billing and client portal alone saved us 10+ hours a week. Worth every rupee.', rating: 5 },
    { name: 'CA Priya Shah', firm: 'Shah Partners, Mumbai', comment: 'Finally a software made for Indian CAs. The compliance reminders are a lifesaver during ITR season.', rating: 5 },
];

const faqs = [
    { q: 'What is CA practice management software?', a: 'CA practice management software helps Chartered Accountant firms organize their clients, compliance tasks, documents, billing, and team workflows in one place — replacing spreadsheets, WhatsApp, and fragmented tools.' },
    { q: 'Is My CA File suitable for small CA firms?', a: 'Absolutely. My CA File is designed to scale — from solo practitioners with 20 clients to large firms with 5 partners and 1000+ clients. You pay for what you need.' },
    { q: 'Does it include client billing?', a: 'Yes. You can create invoices, track payments, and maintain a full ledger per client. Invoices are GST-compliant and can be downloaded as PDFs.' },
    { q: 'Can clients log in to see their own data?', a: 'Yes. Each firm gets a branded subdomain (e.g., yourfirm.mycafile.in). Clients can log in to view their documents, invoices, and task status.' },
];

export const CAPracticeManagementPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>CA Practice Management Software India | My CA File</title>
                <meta name="description" content="Best CA practice management software in India. Manage clients, compliance, billing, documents, and team tasks for your CA firm. Trusted by 500+ firms. Free 14-day trial." />
                <meta name="keywords" content="CA practice management software, CA office management software India, practice management for chartered accountants, best CA software India, CA firm management tool" />
                <link rel="canonical" href="https://www.mycafile.in/ca-practice-management" />
                
                <meta property="og:type" content="website" />
                <meta property="og:title" content="CA Practice Management Software India | My CA File" />
                <meta property="og:description" content="The #1 practice management software for CA firms in India. Clients, compliance, billing, and team — all in one place." />
                <meta property="og:url" content="https://www.mycafile.in/ca-practice-management" />
                <meta property="og:image" content="https://www.mycafile.in/og-practice.png" />
                
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="CA Practice Management Software India | My CA File" />
                <meta name="twitter:description" content="The #1 practice management software for CA firms in India. Clients, compliance, billing, and team — all in one place." />
                <meta name="twitter:image" content="https://www.mycafile.in/og-practice.png" />

                {/* Structured Data: FAQPage */}
                <script type="application/ld+json">
                {`
                    {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What is CA practice management software?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "CA practice management software helps Chartered Accountant firms organize their clients, compliance tasks, documents, billing, and team workflows in one place — replacing spreadsheets and fragmented tools."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Is My CA File suitable for small CA firms?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Absolutely. My CA File is designed to scale — from solo practitioners with 20 clients to large firms with partners and 1000+ clients."
                                }
                            }
                        ]
                    }
                `}
                </script>

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
                                "item": "https://www.mycafile.in/"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "CA Practice Management",
                                "item": "https://www.mycafile.in/ca-practice-management"
                            }
                        ]
                    }
                `}
                </script>
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center', maxWidth: 860, mx: 'auto' }}>
                            <Chip label="#1 CA Practice Management Software" sx={{ bgcolor: '#fae8ff', color: '#a21caf', fontWeight: 800, mb: 3, fontSize: '0.8rem', letterSpacing: 0.5 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3.8rem' }, fontWeight: 1000, color: '#0f172a', lineHeight: 1.1, letterSpacing: -2, mb: 3 }}>
                                The Complete{' '}
                                <span style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    CA Practice Management
                                </span>{' '}Platform
                            </Typography>
                            <Typography variant="h5" sx={{ color: '#64748b', fontWeight: 500, mb: 5, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                From client onboarding to compliance tracking, billing, and document management — My CA File is the all-in-one practice management software designed exclusively for Indian Chartered Accountants.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', boxShadow: '0 15px 35px rgba(139,92,246,0.3)' }}>
                                    Start for Free
                                </Button>
                                <Button size="large" variant="outlined" onClick={() => navigate('/')}
                                    sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: '#d4d4d8' }}>
                                    See All Features
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2.5, fontWeight: 600 }}>14-day free trial • No credit card • Cancel anytime</Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Stats */}
            <Box sx={{ bgcolor: '#0f172a', py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
                        {[['500+', 'CA Firms'], ['50,000+', 'Clients Managed'], ['₹40Cr+', 'Invoices Generated'], ['4.9/5', 'Rating by CAs']].map(([val, label]) => (
                            <Box key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ color: '#d8b4fe', fontWeight: 1000 }}>{val}</Typography>
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
                        Built for every part of your practice
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
                        Replace 5 different tools with one platform your entire team will actually use.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9', boxShadow: 'none', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' }, transition: 'all 0.3s' }}>
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#faf5ff', borderRadius: '12px', display: 'inline-flex' }}>{f.icon}</Box>
                                <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>{f.title}</Typography>
                                <Typography variant="body2" color="#64748b" lineHeight={1.7}>{f.desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Testimonials */}
            <Box sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.5rem' }, letterSpacing: -1 }}>
                        Trusted by CA Firms Across India
                    </Typography>
                    <Grid container spacing={4}>
                        {testimonials.map((t, i) => (
                            <Grid size={{ xs: 12, md: 4 }} key={i}>
                                <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                    <Stack direction="row" spacing={0.5} mb={2}>
                                        {Array.from({ length: t.rating }).map((_, j) => <StarIcon key={j} sx={{ color: '#f59e0b', fontSize: 18 }} />)}
                                    </Stack>
                                    <Typography variant="body1" color="#475569" fontStyle="italic" lineHeight={1.7} mb={3}>"{t.comment}"</Typography>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: '#8b5cf6', width: 44, height: 44, fontWeight: 800 }}>{t.name.charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">{t.name}</Typography>
                                            <Typography variant="caption" color="#64748b">{t.firm}</Typography>
                                        </Box>
                                    </Stack>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* FAQ */}
            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.5rem' }, letterSpacing: -1 }}>
                    Frequently Asked Questions
                </Typography>
                <FAQAccordion faqs={faqs} />
            </Container>

            {/* CTA */}
            <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 1000, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' }, letterSpacing: -1 }}>
                        Take control of your CA practice
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 5, fontWeight: 400 }}>Start free. No credit card. Get set up in under 5 minutes.</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button size="large" variant="contained" onClick={() => navigate('/superadmin')}
                            sx={{ px: 8, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem', bgcolor: 'white', color: '#8b5cf6', '&:hover': { bgcolor: '#faf5ff' } }}>
                            Start Your Free Trial
                        </Button>
                    </Stack>
                    <Stack direction="row" spacing={3} justifyContent="center" mt={3}>
                        {['No credit card', 'Free 14-day trial', '500+ CA firms'].map(point => (
                            <Stack key={point} direction="row" spacing={0.5} alignItems="center">
                                <CheckIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{point}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default CAPracticeManagementPage;
