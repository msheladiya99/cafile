import React from 'react';
import { Box, Container, Typography, Stack, Breadcrumbs, Link } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>Privacy Policy | My CA File - Secure CA Practice Management</title>
                <meta name="description" content="Learn how My CA File protects your CA firm's data. Our privacy policy outlines data encryption, multi-tenant isolation, and our commitment to security." />
                <link rel="canonical" href="https://www.mycafile.in/privacy-policy" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            <SiteNavbar />

            <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 10 }, borderBottom: '1px solid #e2e8f0' }}>
                <Container maxWidth="md">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 4 }}>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Home</Link>
                        <Typography color="text.primary" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Privacy Policy</Typography>
                    </Breadcrumbs>
                    <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2, mb: 3 }}>
                        Privacy Policy
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.7 }}>
                        Last updated: March 15, 2026
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
                <Stack spacing={6}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>1. Introduction</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            At My CA File, we take the security and privacy of your CA firm's data extremely seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our practice management platform.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>2. Data Encrypton & Security</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem', mb: 2 }}>
                            We implement enterprise-grade security measures to protect sensitive financial and personal data:
                        </Typography>
                        <Stack spacing={2}>
                            {[
                                'AES-256 bit encryption for data at rest.',
                                'SSL/TLS encryption for all data in transit.',
                                'Multi-tenant isolation ensuring no firm can access another firm\'s data.',
                                'Regular automated backups and disaster recovery protocols.'
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
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>3. Information We Collect</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            We only collect information necessary to provide our services, including firm details, staff information, and client contact meta-data. All client documents are stored securely and are only accessible by authorized users of your firm.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>4. Third-Party Sharing</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            We do not sell, trade, or otherwise transfer your data to outside parties. Your data belongs to you. We only share meta-data with essential service providers (like cloud storage and email services) strictly for operational purposes.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 3 }}>5. Contact Us</Typography>
                        <Typography variant="body1" sx={{ color: '#475569', lineHeight: 1.8, fontSize: '1.05rem' }}>
                            If you have any questions regarding this Privacy Policy, please use the contact page and our privacy team will respond.
                        </Typography>
                    </Box>
                </Stack>
            </Container>

            <SiteFooter />
        </Box>
    );
};

export default PrivacyPolicyPage;
