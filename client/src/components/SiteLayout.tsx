import React from 'react';
import { Box, Button, Container, Typography, Stack, Divider, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { ShieldOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const SiteNavbar: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ py: 2, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, bgcolor: 'white', zIndex: 100 }}>
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate('/')}
                role="button"
                aria-label="My CA File - Go to homepage"
            >
                <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', p: 0.8, borderRadius: '10px', display: 'flex' }}>
                    <ShieldOutlined sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Typography variant="h6" fontWeight={900} color="#1e1b4b" sx={{ letterSpacing: -1 }}>My CA File</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
                <Button variant="text" onClick={() => navigate('/')} sx={{ color: '#4b5563', fontWeight: 700, textTransform: 'none', display: { xs: 'none', sm: 'flex' } }}>Home</Button>
                <Button variant="text" onClick={() => navigate('/ca-practice-management')} sx={{ color: '#4b5563', fontWeight: 700, textTransform: 'none', display: { xs: 'none', md: 'flex' } }}>Features</Button>
                <Button variant="contained" onClick={() => navigate('/superadmin')}
                    sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', px: 3 }}>
                    Start Free
                </Button>
            </Stack>
        </Box>
    );
};

export const SiteFooter: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', py: 8 }}>
            <Container maxWidth="lg">
                <Grid container spacing={6}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ mb: 2, cursor: 'pointer' }}
                            onClick={() => navigate('/')}
                            role="button"
                            aria-label="My CA File - Go to homepage"
                        >
                            <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', p: 0.8, borderRadius: '10px', display: 'flex' }}>
                                <ShieldOutlined sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={900} color="#1e1b4b" sx={{ letterSpacing: -1 }}>My CA File</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8, mb: 3, maxWidth: 280 }}>
                            The ultimate practice management software for Chartered Accountants in India.
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            {['LinkedIn', 'Twitter', 'YouTube'].map(s => (
                                <Typography key={s} variant="caption" sx={{ color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>{s}</Typography>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 3 }}>Solutions</Typography>
                        <Stack spacing={2}>
                            <Typography variant="body2" onClick={() => navigate('/gst-software-india')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>GST Software</Typography>
                            <Typography variant="body2" onClick={() => navigate('/itr-filing-software')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>ITR Software</Typography>
                            <Typography variant="body2" onClick={() => navigate('/ca-practice-management')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Practice Management</Typography>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 3 }}>Company</Typography>
                        <Stack spacing={2}>
                            <Typography variant="body2" onClick={() => navigate('/about')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>About</Typography>
                            <Typography variant="body2" onClick={() => navigate('/careers')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Careers</Typography>
                            <Typography variant="body2" onClick={() => navigate('/contact')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Contact</Typography>
                            <Typography variant="body2" onClick={() => navigate('/press')} sx={{ color: '#64748b', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Press</Typography>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 1000, mb: 2 }}>Newsletter</Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>Get the latest updates on tax compliance and software features.</Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField placeholder="Enter your email" size="small" fullWidth sx={{ bgcolor: 'white', '& fieldset': { borderRadius: '10px' } }} />
                            <Button variant="contained" sx={{ px: 3, borderRadius: '10px', bgcolor: '#1e293b', fontWeight: 800, textTransform: 'none', whiteSpace: 'nowrap' }}>Join</Button>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 6, borderColor: '#e2e8f0' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        © 2026 My CA File. All rights reserved. Made with ❤️ for CA firms in India.
                    </Typography>
                    <Stack direction="row" spacing={4}>
                        <Typography variant="caption" onClick={() => navigate('/press')} sx={{ color: '#94a3b8', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Privacy Policy</Typography>
                        <Typography variant="caption" onClick={() => navigate('/press')} sx={{ color: '#94a3b8', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}>Terms of Service</Typography>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
};
