import React from 'react';
import { Box, Container, Typography, Stack, Card, Chip, Button, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { Download as DownloadIcon, OpenInNew as LinkIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const pressReleases = [
    {
        date: 'March 2026',
        title: 'My CA File Reaches 500+ CA Firms Across India in Its First Year',
        tag: 'Milestone',
        summary: 'My CA File announces a major milestone — over 500 Chartered Accountant firms across 12 Indian states now use the platform to manage clients, compliance, and billing.',
    },
    {
        date: 'January 2026',
        title: 'My CA File Launches White-Label Subdomain Portal for CA Firms',
        tag: 'Product Launch',
        summary: 'CA firms can now give their clients a fully branded experience at their own subdomain (e.g., yourfirm.mycafile.in), allowing seamless document sharing and task tracking.',
    },
    {
        date: 'October 2025',
        title: 'My CA File Beta Opens to First 100 CA Partners in Surat',
        tag: 'Launch',
        summary: 'My CA File opens its private beta to 100 CA firms in Surat, receiving overwhelming positive response and validation from the CA community in Gujarat.',
    },
];

const mediaLogos = [
    { name: 'YourStory', desc: 'India\'s Leading Startup Media' },
    { name: 'Inc42', desc: 'Indian Startups & Business News' },
    { name: 'Economic Times', desc: 'Financial & Business Daily' },
    { name: 'CNBC TV18', desc: 'Business Television' },
];

const brandAssets = [
    { label: 'My CA File Logo (PNG)', format: 'PNG · 1200x400px' },
    { label: 'My CA File Logo (SVG)', format: 'SVG · Vector' },
    { label: 'Brand Guidelines PDF', format: 'PDF · 2.1 MB' },
    { label: 'Product Screenshots Pack', format: 'ZIP · 8.4 MB' },
];

const PressPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>Press & Media | My CA File - CA SaaS Startup India</title>
                <meta name="description" content="My CA File press room. Read our latest news, download brand assets, and get in touch with the media team. India's leading CA practice management SaaS." />
                <link rel="canonical" href="https://mycafile.in/press" />

                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Press & Media | My CA File News" />
                <meta property="og:description" content="Official press releases and media assets for My CA File. Stay updated with our growth and product launches." />
                <meta property="og:url" content="https://mycafile.in/press" />
                <meta property="og:image" content="https://mycafile.in/og-press.png" />

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
                                "name": "Press",
                                "item": "https://mycafile.in/press"
                            }
                        ]
                    }
                `}
                </script>
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', py: { xs: 8, md: 12 } }}>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip label="Press Room" sx={{ bgcolor: 'rgba(99,102,241,0.3)', color: '#a5b4fc', fontWeight: 800, mb: 3 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 1000, color: 'white', letterSpacing: -2, lineHeight: 1.1, mb: 3 }}>
                                My CA File in the News
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 580, mx: 'auto', fontWeight: 400, mb: 5 }}>
                                Download our brand assets, read our press releases, and get in touch with our media team.
                            </Typography>
                            <Button variant="contained" onClick={() => navigate('/contact')}
                                sx={{ px: 5, py: 1.8, borderRadius: '12px', fontWeight: 800, textTransform: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                                Contact Media Team
                            </Button>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Key Stats */}
            <Box sx={{ bgcolor: '#f8fafc', py: 6 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="center">
                        {[['2023', 'Founded'], ['500+', 'CA Firms'], ['50,000+', 'Clients Managed'], ['Surat', 'Headquarters']].map(([val, label]) => (
                            <Grid size={{ xs: 6, md: 3 }} key={label} sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ color: '#6366f1', fontWeight: 1000, mb: 0.5 }}>{val}</Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{label}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Press Releases */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 8, letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Latest News</Typography>
                <Stack spacing={3}>
                    {pressReleases.map((p, i) => (
                        <Card key={i} sx={{ p: 4, borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none', '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }, transition: 'all 0.2s' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Chip label={p.tag} size="small" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 800, fontSize: '0.7rem' }} />
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>{p.date}</Typography>
                                </Stack>
                                <Button endIcon={<LinkIcon sx={{ fontSize: 16 }} />} size="small"
                                    sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'none', fontSize: '0.8rem' }}>
                                    Read Full Release
                                </Button>
                            </Stack>
                            <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1.5}>{p.title}</Typography>
                            <Typography variant="body2" color="#64748b" lineHeight={1.7}>{p.summary}</Typography>
                        </Card>
                    ))}
                </Stack>
            </Container>

            {/* Media Coverage */}
            <Box sx={{ bgcolor: '#f8fafc', py: { xs: 8, md: 10 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, textAlign: 'center', letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
                        As Featured In
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', textAlign: 'center', mb: 8, fontSize: '1rem' }}>
                        Coverage from India's leading business and startup media.
                    </Typography>
                    <Grid container spacing={3} justifyContent="center">
                        {mediaLogos.map((media, i) => (
                            <Grid size={{ xs: 6, md: 3 }} key={i}>
                                <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="h6" fontWeight={900} color="#1e293b" mb={0.5}>{media.name}</Typography>
                                    <Typography variant="caption" color="#94a3b8" fontWeight={600}>{media.desc}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Brand Assets */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, letterSpacing: -1, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>Brand Assets</Typography>
                <Typography variant="body1" sx={{ color: '#64748b', mb: 6, fontSize: '1rem' }}>
                    Please use these official assets when writing about My CA File.
                </Typography>
                <Grid container spacing={3}>
                    {brandAssets.map((asset, i) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="#1e293b">{asset.label}</Typography>
                                        <Typography variant="caption" color="#94a3b8">{asset.format}</Typography>
                                    </Box>
                                    <Button startIcon={<DownloadIcon />} size="small" variant="outlined"
                                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', borderColor: '#e2e8f0', color: '#64748b' }}>
                                        Download
                                    </Button>
                                </Stack>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ my: 8 }} />

                {/* Media Contact */}
                <Card sx={{ p: 5, borderRadius: '24px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: 'none', textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={1000} color="white" mb={1.5}>Media Inquiries</Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, maxWidth: 500, mx: 'auto', lineHeight: 1.7 }}>
                        For press inquiries, interview requests, or partnership opportunities — reach out to our media team directly.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <Button variant="contained" onClick={() => navigate('/contact')}
                            sx={{ px: 5, py: 1.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none', bgcolor: 'white', color: '#6366f1', '&:hover': { bgcolor: '#f5f3ff' } }}>
                            Contact Media Team
                        </Button>
                        <Button variant="outlined"
                            sx={{ px: 5, py: 1.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none', borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                            press@mycafile.in
                        </Button>
                    </Stack>
                </Card>
            </Container>

            <SiteFooter />
        </Box>
    );
};

export default PressPage;
