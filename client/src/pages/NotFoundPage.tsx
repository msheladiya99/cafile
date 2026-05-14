import React from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { SiteFooter, SiteNavbar } from '../components/SiteLayout';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <Helmet>
        <title>Page Not Found | My CA File</title>
        <meta
          name="description"
          content="The My CA File page you requested could not be found. Explore CA practice management, pricing, support, and product resources."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <SiteNavbar />
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ color: '#6366f1', fontWeight: 900, letterSpacing: 2 }}>
          404
        </Typography>
        <Typography
          variant="h1"
          sx={{ mt: 1, fontSize: { xs: '2.4rem', md: '4rem' }, fontWeight: 1000, color: '#0f172a', letterSpacing: -2 }}
        >
          This page is missing
        </Typography>
        <Typography sx={{ mt: 2, color: '#64748b', fontSize: '1.05rem', lineHeight: 1.8 }}>
          The link may be old, moved, or typed incorrectly. These pages can get you back to the right place.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 5 }}>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ borderRadius: '10px', px: 4, py: 1.4, fontWeight: 800 }}>
            Go Home
          </Button>
          <Button variant="outlined" onClick={() => navigate('/ca-practice-management')} sx={{ borderRadius: '10px', px: 4, py: 1.4, fontWeight: 800 }}>
            View Features
          </Button>
          <Button variant="outlined" onClick={() => navigate('/contact')} sx={{ borderRadius: '10px', px: 4, py: 1.4, fontWeight: 800 }}>
            Contact Support
          </Button>
        </Stack>
      </Container>
      <SiteFooter />
    </Box>
  );
};

export default NotFoundPage;
