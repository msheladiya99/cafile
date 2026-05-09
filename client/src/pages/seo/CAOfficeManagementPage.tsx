import React from 'react';
import { Box, Button, Container, Typography, Stack, Card, Chip, Divider, Link as MuiLink } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Business as BusinessIcon,
    ReceiptLong as ReceiptIcon,
    Badge as BadgeIcon,
    AccountBalance as BankIcon,
    Groups as GroupsIcon,
    Hub as HubIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { FAQAccordion } from '../../components/FAQAccordion';

const ACCENT = '#0d9488';
const ACCENT2 = '#6366f1';

const features = [
    { icon: <HubIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'One system for the whole office', desc: 'GST, ITR, clients, billing, DSC, expenses, and tasks live in one workflow—no more switching between Excel, WhatsApp, and five different apps.' },
    { icon: <GroupsIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Client & employee roles', desc: 'Granular permissions for partners, managers, and staff. Clients get a secure portal for documents and invoices.' },
    { icon: <ReceiptIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Billing aligned with work', desc: 'Raise GST-compliant invoices, track collections, and connect billing to client tasks and ledgers.' },
    { icon: <BadgeIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'DSC & compliance rhythm', desc: 'Organize DSC usage and compliance calendars so filings and notices do not slip through the cracks.' },
    { icon: <BankIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Office finance & utilities', desc: 'Track office expenses, partner splits, and use tools like bank-statement conversion to save repetitive data entry.' },
    { icon: <BusinessIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Built for Indian CA firms', desc: 'Designed around how Indian CA offices actually operate—multi-client, multi-return, and deadline-heavy.' },
];

const faqs = [
    { q: 'What is CA office management software?', a: 'CA office management software brings together client work, GST and ITR workflows, billing, documents, team tasks, and client communication in one platform—so your firm runs as a single digital office instead of disconnected tools.' },
    { q: 'How is this different from generic project management tools?', a: 'My CA File is purpose-built for Chartered Accountants: client masters, compliance reminders, GST and ITR task patterns, billing, DSC, and a client portal match how CA firms work in India—not generic kanban boards.' },
    { q: 'Can we start small and add modules later?', a: 'Yes. Firms typically begin with clients and tasks, then deepen billing, portal, and automation usage. The platform scales from a single practitioner to multi-partner offices.' },
    { q: 'Is client data isolated and secure?', a: 'Each firm’s data is logically separated with role-based access. Staff only see what their permissions allow, and clients only see their own portal content.' },
];

const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
};

const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mycafile.in/' },
        { '@type': 'ListItem', position: 2, name: 'CA Office Management Software', item: 'https://www.mycafile.in/ca-office-management-software' },
    ],
};

export const CAOfficeManagementPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>CA Office Management Software for Indian CA Firms | My CA File</title>
                <meta name="description" content="Run GST, ITR, clients, billing, DSC, and office operations in one secure CA office platform. Book a demo or start your free trial with My CA File." />
                <meta name="keywords" content="CA office management software, CA firm software India, chartered accountant office software, tax consultant software, CA digital office" />
                <link rel="canonical" href="https://www.mycafile.in/ca-office-management-software" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="CA Office Management Software for Indian CA Firms | My CA File" />
                <meta property="og:description" content="All-in-one CA office platform: clients, GST, ITR, billing, portal, and workflows—built for Indian CA firms." />
                <meta property="og:url" content="https://www.mycafile.in/ca-office-management-software" />
                <meta property="og:image" content="https://www.mycafile.in/faviconca.webp" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="CA Office Management Software | My CA File" />
                <meta name="twitter:description" content="Digitize your CA office with one platform for compliance, clients, and billing." />
                <meta name="twitter:image" content="https://www.mycafile.in/faviconca.webp" />
                <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
            </Helmet>

            <SiteNavbar />

            <Box sx={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #eef2ff 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center', maxWidth: 880, mx: 'auto' }}>
                            <Chip label="CA office management software" sx={{ bgcolor: '#ccfbf1', color: '#0f766e', fontWeight: 800, mb: 3, fontSize: '0.8rem', letterSpacing: 0.3 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3.75rem' }, fontWeight: 1000, color: '#0f172a', lineHeight: 1.1, letterSpacing: -2, mb: 3 }}>
                                CA office management software{' '}
                                <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    built for Indian CA firms
                                </span>
                            </Typography>
                            <Typography variant="h5" component="p" sx={{ color: '#64748b', fontWeight: 500, mb: 4, lineHeight: 1.65, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                                My CA File is the smart CA office platform for GST, ITR, client management, billing, DSC, expenses, and client portal—so your team delivers faster with fewer errors.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 1 }}>
                                <Button size="large" variant="contained" onClick={() => navigate('/contact')} sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', bgcolor: ACCENT, boxShadow: '0 15px 35px rgba(13,148,136,0.35)', '&:hover': { bgcolor: '#0f766e' } }}>
                                    Book a demo
                                </Button>
                                <Button size="large" variant="outlined" onClick={() => navigate('/superadmin')} sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: '#cbd5e1', color: '#334155' }}>
                                    Start free trial
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2, fontWeight: 600 }}>14-day trial · No credit card · Setup in minutes</Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 3, maxWidth: 640, mx: 'auto', lineHeight: 1.7 }}>
                                Explore{' '}
                                <MuiLink component={Link} to="/ca-practice-management" underline="hover" sx={{ color: ACCENT2, fontWeight: 700 }}>practice management</MuiLink>,{' '}
                                <MuiLink component={Link} to="/gst-software-india" underline="hover" sx={{ color: ACCENT2, fontWeight: 700 }}>GST</MuiLink>,{' '}
                                <MuiLink component={Link} to="/ca-billing-software" underline="hover" sx={{ color: ACCENT2, fontWeight: 700 }}>billing</MuiLink>, and{' '}
                                <MuiLink component={Link} to="/pricing" underline="hover" sx={{ color: ACCENT2, fontWeight: 700 }}>pricing</MuiLink>.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            <Box sx={{ bgcolor: '#0f172a', py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
                        {[['All-in-one', 'GST · ITR · Clients'], ['Role-based', 'Staff & portal'], ['India-first', 'CA workflows']].map(([val, label]) => (
                            <Box key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#5eead4', fontWeight: 1000 }}>{val}</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 14 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, fontSize: { xs: '1.75rem', md: '2.75rem' }, letterSpacing: -1 }}>
                        Digital transformation for your CA office
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 640, mx: 'auto' }}>
                        Replace a patchwork of spreadsheets and chat threads with one CA office stack your whole team can rely on.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9', boxShadow: 'none', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' }, transition: 'all 0.3s' }}>
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdfa', borderRadius: '12px', display: 'inline-flex' }}>{f.icon}</Box>
                                <Typography variant="h6" component="h3" fontWeight={800} color="#1e293b" mb={1}>{f.title}</Typography>
                                <Typography variant="body2" color="#64748b" lineHeight={1.7}>{f.desc}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, textAlign: 'center', fontSize: { xs: '1.75rem', md: '2.5rem' }, letterSpacing: -1 }}>
                    Frequently asked questions
                </Typography>
                <FAQAccordion faqs={faqs} />
            </Container>

            <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: `linear-gradient(135deg, ${ACCENT} 0%, #6366f1 100%)` }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 1000, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' }, letterSpacing: -1 }}>
                        Ready to modernize your CA office?
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.88)', mb: 5, fontWeight: 400 }}>Schedule a consultation or start your trial today.</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button size="large" variant="contained" onClick={() => navigate('/contact')} sx={{ px: 6, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', bgcolor: 'white', color: '#0f766e', '&:hover': { bgcolor: '#f0fdfa' } }}>
                            Contact sales
                        </Button>
                        <Button size="large" variant="outlined" onClick={() => navigate('/superadmin')} sx={{ px: 6, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: 'rgba(255,255,255,0.7)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                            Start free trial
                        </Button>
                    </Stack>
                    <Stack direction="row" spacing={3} justifyContent="center" mt={3} flexWrap="wrap" useFlexGap>
                        {['Trusted by CA firms', 'India-focused compliance', 'Secure client portal'].map(point => (
                            <Stack key={point} direction="row" spacing={0.5} alignItems="center">
                                <CheckIcon sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{point}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default CAOfficeManagementPage;
