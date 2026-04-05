import React from 'react';
import { Box, Container, Typography, Stack, Breadcrumbs, Link } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>Terms of Service | My CA File - CA Practice Management SaaS</title>
                <meta name="description" content="Read the official terms and conditions for using My CA File software. Information on subscription plans, data ownership, and acceptable use." />
                <link rel="canonical" href="https://mycafile.in/terms-of-service" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            <SiteNavbar />

            <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 10 }, borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="md">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 4 }}>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Home</Link>
                        <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Terms of Service</Typography>
                    </Breadcrumbs>
                    <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2, mb: 3 }}>
                        Terms of Service
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.7 }}>
                        Last updated: March 15, 2026
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
                <Stack spacing={6}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>1. Agreement to Terms</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            By creating an account on My CA File, you agree to abide by these Terms of Service. If you are entering into these terms on behalf of a CA firm or company, you represent that you have the authority to bind that entity to these terms.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>2. Subscription & Payments</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem', mb: 2 }}>
                            We offer various subscription tiers for CA firms:
                        </Typography>
                        <Stack spacing={2}>
                            {[
                                'Fees are billed annually or monthly based on the selected plan.',
                                'All fees are exclusive of GST, which will be added at checkout.',
                                'No refunds are issued for cancellations during a billing cycle.',
                                'We reserve the right to change fees upon 30 days notice.'
                            ].map((text, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Box sx={{ minWidth: 24, height: 24, borderRadius: '50%', bgcolor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', mt: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 900 }}>{i + 1}</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.6 }}>{text}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>3. Data Ownership</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            You and your firm retain all rights, title, and interest in and to all data you upload to the platform. By using the platform, you grant us a limited license to host and process that data strictly to provide the service.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>4. Acceptable Use</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            Users are prohibited from using My CA File for any illegal purposes or for hosting malicious content. We reserve the right to suspend any account found in violation of these terms.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>5. Contact Us</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            If you have any questions regarding these Terms, you may contact us at support@mycafile.in.
                        </Typography>
                    </Box>
                </Stack>
            </Container>

            <SiteFooter />
        </Box>
    );
};

export default TermsOfServicePage;
