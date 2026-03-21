import React, { useState } from 'react';
import { Box, Container, Typography, Stack, Card, Chip, Button, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../../components/SiteLayout';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Send as SendIcon,
} from '@mui/icons-material';

const ContactPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', firm: '', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
            <Helmet>
                <title>Contact Us | My CA File - CA Practice Management Software</title>
                <meta name="description" content="Contact the My CA File team. Get a demo, ask a question, or start your free trial. We respond within 24 hours." />
                <link rel="canonical" href="https://www.mycafile.in/contact" />
            </Helmet>

            <SiteNavbar />

            {/* Hero */}
            <Box sx={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%)', py: { xs: 8, md: 10 } }}>
                <Container maxWidth="md">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Chip label="Get in Touch" sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 800, mb: 3 }} />
                            <Typography variant="h1" sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2, lineHeight: 1.1, mb: 2 }}>
                                We'd love to hear from you
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 400, lineHeight: 1.7 }}>
                                Whether you have a question, need a demo, or want to share feedback — our team responds within 24 hours.
                            </Typography>
                        </Box>
                    </motion.div>
                </Container>
            </Box>

            {/* Content */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                <Grid container spacing={6}>
                    {/* Contact Info */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, bgcolor: '#f5f3ff', borderRadius: '12px' }}>
                                        <EmailIcon sx={{ color: '#6366f1', fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="#1e293b">Email Us</Typography>
                                        <Typography variant="body2" color="#6366f1" sx={{ fontWeight: 600 }}>support@mycafile.in</Typography>
                                    </Box>
                                </Stack>
                            </Card>

                            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: '12px' }}>
                                        <PhoneIcon sx={{ color: '#16a34a', fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="#1e293b">WhatsApp Support</Typography>
                                        <Typography variant="body2" color="#16a34a" sx={{ fontWeight: 600 }}>+91 98765 43210</Typography>
                                    </Box>
                                </Stack>
                            </Card>

                            <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: '12px' }}>
                                        <LocationIcon sx={{ color: '#f97316', fontSize: 24 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={800} color="#1e293b">Office</Typography>
                                        <Typography variant="body2" color="#64748b">Surat, Gujarat, India</Typography>
                                    </Box>
                                </Stack>
                            </Card>

                            <Card sx={{ p: 3, borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: 'none' }}>
                                <Typography variant="subtitle1" fontWeight={800} color="white" mb={1}>Response Time</Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
                                    We respond to all inquiries within <strong style={{ color: 'white' }}>24 hours</strong> — usually much faster during business hours (9 AM – 7 PM IST).
                                </Typography>
                            </Card>
                        </Stack>
                    </Grid>

                    {/* Contact Form */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            {submitted ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography sx={{ fontSize: '3rem', mb: 2 }}>✅</Typography>
                                    <Typography variant="h5" fontWeight={800} color="#1e293b" mb={1}>Message Sent!</Typography>
                                    <Typography variant="body1" color="#64748b">We'll get back to you within 24 hours. Check your email for confirmation.</Typography>
                                </Box>
                            ) : (
                                <Box component="form" onSubmit={handleSubmit}>
                                    <Typography variant="h5" fontWeight={800} color="#1e293b" mb={4}>Send us a message</Typography>
                                    <Grid container spacing={2.5}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField fullWidth label="Your Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField fullWidth label="Email Address" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField fullWidth label="CA Firm Name (Optional)" value={form.firm} onChange={e => setForm({ ...form, firm: e.target.value })}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TextField fullWidth label="Message" multiline rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                                placeholder="Tell us about your firm, how many clients you manage, and what you're looking for..."
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <Button type="submit" variant="contained" size="large" fullWidth endIcon={<SendIcon />}
                                                sx={{ py: 1.8, borderRadius: '12px', fontWeight: 800, textTransform: 'none', fontSize: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                                                Send Message
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            <SiteFooter />
        </Box>
    );
};

export default ContactPage;
