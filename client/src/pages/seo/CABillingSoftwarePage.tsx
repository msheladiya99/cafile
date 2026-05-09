import React from 'react';
import { Box, Button, Container, Typography, Stack, Card, Chip, Divider, Link as MuiLink } from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    ReceiptLong as ReceiptIcon,
    Payments as PaymentsIcon,
    Description as InvoiceIcon,
    TrendingUp as TrendingIcon,
    Groups as GroupsIcon,
    Verified as VerifiedIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { FAQAccordion } from '../../components/FAQAccordion';

const ACCENT = '#059669';

const features = [
    { icon: <InvoiceIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Professional invoicing', desc: 'Create clear, GST-aware invoices your clients understand—aligned with the work logged in your practice.' },
    { icon: <PaymentsIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Collections visibility', desc: 'See what is outstanding per client and follow up before revenue leaks through the cracks.' },
    { icon: <ReceiptIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Ledger in one place', desc: 'Connect billing with client master data and tasks so partners see financial context next to compliance work.' },
    { icon: <GroupsIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Built for retainers & projects', desc: 'Whether you bill fixed monthly retainers or milestone projects, keep structure consistent across the firm.' },
    { icon: <TrendingIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Less spreadsheet risk', desc: 'Reduce copy-paste errors from Excel and WhatsApp by keeping invoices inside the same system as your team.' },
    { icon: <VerifiedIcon sx={{ color: ACCENT, fontSize: 28 }} />, title: 'Part of the full CA stack', desc: 'Works alongside client portal, document management, and reminders—billing is not an island.' },
];

const faqs = [
    { q: 'Is My CA File only billing software?', a: 'No. It is full CA office and practice management software. Billing is a core module so your invoices and collections stay tied to clients, tasks, and the portal.' },
    { q: 'Can we export or share invoices with clients?', a: 'Yes. Invoices can be shared through the platform and downloaded as needed so clients have a clear record of engagements.' },
    { q: 'Does billing integrate with client tasks?', a: 'Billing sits on the same client records as tasks and documents, so you see work completed and amounts due in one context.' },
    { q: 'Is this suitable for small CA firms?', a: 'Yes—from solo practitioners to multi-partner firms. You can start with essential billing workflows and expand as you grow.' },
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mycafile.in' },
        { '@type': 'ListItem', position: 2, name: 'CA Billing Software', item: 'https://www.mycafile.in/ca-billing-software' },
    ],
};

export const CABillingSoftwarePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>CA Billing &amp; Invoicing Software for Indian Firms | My CA File</title>
                <meta name="description" content="CA billing software for retainers, invoices, and collections—integrated with clients, tasks, and portal. Book a demo or start your free trial." />
                <meta name="keywords" content="CA billing software, CA invoicing software India, chartered accountant billing, tax consultant billing software, practice billing" />
                <link rel="canonical" href="https://www.mycafile.in/ca-billing-software" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="CA Billing &amp; Invoicing Software | My CA File" />
                <meta property="og:description" content="Invoice clients, track collections, and run billing inside your CA practice platform." />
                <meta property="og:url" content="https://www.mycafile.in/ca-billing-software" />
                <meta property="og:image" content="https://www.mycafile.in/faviconca.webp" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="CA Billing Software | My CA File" />
                <meta name="twitter:description" content="Integrated billing for CA firms—invoices, ledgers, and client portal in one place." />
                <meta name="twitter:image" content="https://www.mycafile.in/faviconca.webp" />
                <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
                <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
            </Helmet>

            <SiteNavbar />

            <Box sx={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center', maxWidth: 860, mx: 'auto' }}>
                            <Chip label="CA billing software" sx={{ bgcolor: '#d1fae5', color: '#047857', fontWeight: 800, mb: 3, fontSize: '0.8rem' }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '3.7rem' }, fontWeight: 1000, color: '#0f172a', lineHeight: 1.1, letterSpacing: -2, mb: 3 }}>
                                Billing and invoicing software{' '}
                                <span style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0d9488 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    for CA firms
                                </span>
                            </Typography>
                            <Typography variant="h5" component="p" sx={{ color: '#64748b', fontWeight: 500, mb: 4, lineHeight: 1.65, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                                Stop reconciling invoices in spreadsheets. My CA File ties billing to clients, work, and collections—so partners always know what is billed and what is pending.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                                <Button size="large" variant="contained" onClick={() => navigate('/contact')} sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', bgcolor: ACCENT, boxShadow: '0 15px 35px rgba(5,150,105,0.35)', '&:hover': { bgcolor: '#047857' } }}>
                                    Schedule consultation
                                </Button>
                                <Button size="large" variant="outlined" onClick={() => navigate('/superadmin')} sx={{ px: 5, py: 2, borderRadius: '14px', fontWeight: 800, textTransform: 'none', fontSize: '1.05rem', borderColor: '#cbd5e1', color: '#334155' }}>
                                    Start free trial
                                </Button>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2.5, fontWeight: 600 }}>See pricing anytime · <MuiLink component={Link} to="/pricing" sx={{ color: ACCENT, fontWeight: 700 }}>View plans</MuiLink></Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 2, maxWidth: 620, mx: 'auto' }}>
                                Part of the{' '}
                                <MuiLink component={Link} to="/ca-office-management-software" underline="hover" sx={{ color: ACCENT, fontWeight: 700 }}>CA office platform</MuiLink>
                                {' '}—also explore{' '}
                                <MuiLink component={Link} to="/ca-practice-management" underline="hover" sx={{ color: ACCENT, fontWeight: 700 }}>practice management</MuiLink>.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            <Box sx={{ bgcolor: '#0f172a', py: 3 }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
                        {[['Invoices', 'GST-aligned workflow'], ['Ledgers', 'Per client'], ['Portal', 'Client visibility']].map(([val, label]) => (
                            <Box key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#6ee7b7', fontWeight: 1000 }}>{val}</Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 14 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, fontSize: { xs: '1.75rem', md: '2.75rem' }, letterSpacing: -1 }}>
                        Why CA firms choose integrated billing
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
                        One page, one focus: <strong>CA billing software</strong> that fits how your office already runs.
                    </Typography>
                </Box>
                <Grid container spacing={4}>
                    {features.map((f, i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card sx={{ p: 4, borderRadius: '20px', height: '100%', border: '1px solid #f1f5f9', boxShadow: 'none', '&:hover': { boxShadow: '0 20px 40px rgba(0,0,0,0.06)', transform: 'translateY(-4px)' }, transition: 'all 0.3s' }}>
                                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ecfdf5', borderRadius: '12px', display: 'inline-flex' }}>{f.icon}</Box>
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

            <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', background: `linear-gradient(135deg, ${ACCENT} 0%, #0d9488 100%)` }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ color: 'white', fontWeight: 1000, mb: 2, fontSize: { xs: '1.75rem', md: '3rem' }, letterSpacing: -1 }}>
                        Get billing under control
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.88)', mb: 5, fontWeight: 400 }}>Book a demo or start your trial—see invoices and collections with your client work.</Typography>
                    <Button size="large" variant="contained" onClick={() => navigate('/contact')} sx={{ px: 8, py: 2.5, borderRadius: '16px', fontWeight: 800, textTransform: 'none', fontSize: '1.1rem', bgcolor: 'white', color: '#047857', '&:hover': { bgcolor: '#ecfdf5' } }}>
                        Book a demo
                    </Button>
                    <Stack direction="row" spacing={3} justifyContent="center" mt={3} flexWrap="wrap" useFlexGap>
                        {['Integrated with clients', 'Portal-ready', 'Built for India'].map(point => (
                            <Stack key={point} direction="row" spacing={0.5} alignItems="center">
                                <CheckIcon sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{point}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Container>
            </Box>

            <SiteFooter />
        </Box>
    );
};

export default CABillingSoftwarePage;
