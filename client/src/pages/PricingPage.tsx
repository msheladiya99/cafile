import { useState } from 'react';
import { 
  Box, Typography, Container, Grid, Card, CardContent, 
  Button, List, ListItem, ListItemIcon, ListItemText, Chip,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, alpha
} from '@mui/material';
import { Zap, Shield, BarChart3, Globe, Lock, Headphones, Plus, LayoutGrid, Minus, Check, Rocket, RefreshCw, CreditCard, Users, Clock, Award, Star } from "lucide-react";


import StarIcon from '@mui/icons-material/Star';

import { Helmet } from 'react-helmet-async';
import { SiteNavbar, SiteFooter } from '../components/SiteLayout';

// Colors from screenshot
const colors = {
    bg: '#fdfdfd',
    primary: '#3b82f6', // Bright blue
    secondary: '#f59e0b', // Yellow/Orange
    accent: '#8b5cf6', // Vibrant purple
    dark: '#0f172a',
    textMain: '#1e293b',
    textSub: '#64748b',
    border: '#e2e8f0',
    checkBg: '#dcfce7',
    checkColor: '#10b981'
};

export const PricingPage = () => {
    const [withCloud, setWithCloud] = useState(false);

    const defaultPlans = [
        {
            name: 'Starter',
            subtitle: 'Get started with the basics.',
            price: 0,
            limits: { clients: 10, staff: 1, storage: 0 },
            features: ['Client Management (basic)', 'Task Management', 'Internal Collaboration', 'Basic Portal', 'Email Notifications'],
            withCloud: false,
            highlight: false,
            buttonText: 'Get Started Free'
        },
        {
            name: 'Professional',
            subtitle: 'For simple workflows.',
            price: 4999,
            limits: { clients: 300, staff: 2, storage: 0 },
            features: ['Client Management', 'Basic Billing', 'Limited Auto Task', 'Email Reminders', 'Basic Portal'],
            withCloud: false,
            highlight: false,
            buttonText: 'Choose Plan'
        },
        {
            name: 'Enterprise',
            subtitle: 'Perfect for growing firms.',
            price: 6999,
            limits: { clients: 1000, staff: 10, storage: 0 },
            features: ['Full Billing System', 'Auto Task Generator', 'SMS Reminders', 'Client Portal', 'Role-based access'],
            withCloud: false,
            highlight: true,
            badge: 'Most Popular',
            buttonText: 'Choose Plan'
        },
        {
            name: 'Pro Cloud',
            subtitle: 'For simple workflows on cloud.',
            price: 6499,
            limits: { clients: 500, staff: 5, storage: 100 },
            features: ['Advanced Billing + GST', 'Limited Auto Task', 'Email Reminders', 'Client Login', '100GB Cloud Storage'],
            withCloud: true,
            highlight: false,
            buttonText: 'Choose Plan'
        },
        {
            name: 'Enterprise Cloud',
            subtitle: 'Perfect for growing firms.',
            price: 9999,
            limits: { clients: 1000, staff: 10, storage: 300 },
            features: ['Full Billing System', 'Auto Task Generator', 'All Reminders', 'Client Portal', '300GB Cloud Storage'],
            withCloud: true,
            highlight: true,
            badge: 'Most Popular',
            buttonText: 'Choose Plan'
        }
    ];

    type AddonColor = 'primary' | 'highlight' | 'accent' | 'gold';
    const addonColorMap: Record<AddonColor, {bg: string, text: string, border: string, hoverBorder: string}> = {
      primary: { bg: alpha('#3b82f6', 0.08), text: '#3b82f6', border: alpha('#3b82f6', 0.15), hoverBorder: alpha('#3b82f6', 0.4) },
      highlight: { bg: alpha('#10b981', 0.08), text: '#10b981', border: alpha('#10b981', 0.15), hoverBorder: alpha('#10b981', 0.4) },
      accent: { bg: alpha('#8b5cf6', 0.08), text: '#8b5cf6', border: alpha('#8b5cf6', 0.15), hoverBorder: alpha('#8b5cf6', 0.4) },
      gold: { bg: alpha('#f59e0b', 0.08), text: '#f59e0b', border: alpha('#f59e0b', 0.15), hoverBorder: alpha('#f59e0b', 0.4) },
    };

    const addons = [
        { name: 'Priority Processing', desc: 'High performance processing with dedicated compute resources.', price: '₹2000', icon: Zap, color: 'primary' },
        { name: 'Advanced Security', desc: 'SOC2 compliance, audit logs, and threat prevention.', price: '₹3500', icon: Shield, color: 'highlight' },
        { name: 'Analytics Pro', desc: 'Custom dashboards, exports, and real-time tracking.', price: '₹1999', icon: BarChart3, color: 'accent' },
        { name: 'Personal Database', desc: 'Dedicated MongoDB instance for maximum security.', price: '₹5000', icon: Lock, color: 'primary' },
        { name: 'WhatsApp API', desc: 'Automated messaging and communication with clients.', price: '₹2999', icon: Globe, color: 'gold' },
        { name: 'Premium Support', desc: 'Dedicated account manager with 24/7 SLA.', price: '₹1499', icon: Headphones, color: 'accent' },
    ];

    const featuresBoxes = [
        { title: 'Launch in minutes', desc: 'Intuitive setup wizard and pre-built templates get you running fast.', icon: Rocket },
        { title: 'No lock-in contracts', desc: 'Cancel or switch plans anytime. We earn your loyalty, not hold you in.', icon: RefreshCw },
        { title: '30-day money-back', desc: 'Not satisfied? Full refund within 30 days, no questions asked.', icon: CreditCard },
        { title: 'Built for teams', desc: 'Real-time collaboration, roles, and shared workspaces built-in.', icon: Users },
        { title: '99.99% uptime SLA', desc: 'Enterprise-grade reliability across multiple global data centers.', icon: Clock },
        { title: 'Award-winning support', desc: '24/7 world-class support with average 2-hour response time.', icon: Award },
    ];

    const filteredPlans = defaultPlans.filter(p => p.withCloud === withCloud);

    const digitalOfferShipping = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
            '@type': 'MonetaryAmount',
            value: '0',
            currency: 'INR',
        },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY',
            },
            transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 0,
                unitCode: 'DAY',
            },
        },
    };
    const digitalReturnPolicy = {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnPolicyUrl: 'https://www.mycafile.in/terms-of-service',
    };
    const pricingOffer = (name: string, price: string) => ({
        '@type': 'Offer' as const,
        name,
        price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: 'https://www.mycafile.in/pricing',
        // Google merchant docs expect shippingDetails as an array of OfferShippingDetails
        shippingDetails: [{ ...digitalOfferShipping }],
        hasMerchantReturnPolicy: { ...digitalReturnPolicy },
    });

    const pricingProductLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'My CA File Practice Management Software',
        description:
            'Premium CA Office Management Software for Indian Chartered Accountants. Manage ITR, GST, and team workflows.',
        // Favicon first — must resolve with HTTP 200 for rich results; og image is secondary
        image: [
            {
                '@type': 'ImageObject',
                url: 'https://www.mycafile.in/faviconca.webp',
            },
            'https://www.mycafile.in/og-pricing.png',
        ],
        brand: { '@type': 'Brand', name: 'My CA File' },
        offers: [
            pricingOffer('Starter Plan', '0'),
            pricingOffer('Professional Plan', '4999'),
            pricingOffer('Enterprise Plan', '6999'),
            pricingOffer('Pro Cloud Plan', '6499'),
            pricingOffer('Enterprise Cloud Plan', '9999'),
        ],
    };

    const pricingBreadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.mycafile.in/',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Pricing',
                item: 'https://www.mycafile.in/pricing',
            },
        ],
    };

    const handleSubscribe = (planName: string) => {
        alert(`Redirecting to subscribe for ${planName} plan...`);
    };



    return (
        <Box sx={{ bgcolor: colors.bg, minHeight: '100vh', width: '100%', overflowX: 'hidden', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
            <Helmet>
                <title>Pricing Plans for CA Office Management Software | My CA File</title>
                <meta name="description" content="Affordable pricing for the best CA practice management software in India. Free trial available for small firms. Scale up to Enterprise and Cloud plans for large firms." />
                <meta name="keywords" content="CA software price, practice management software cost, My CA File plans, CA office software India pricing" />
                <link rel="canonical" href="https://www.mycafile.in/pricing" />

                <meta property="og:type" content="website" />
                <meta property="og:title" content="Pricing Plans for CA Office Management Software | My CA File" />
                <meta property="og:description" content="Transparent, scaling pricing for Indian CA firms. Start for free and grow your practice with automation." />
                <meta property="og:url" content="https://www.mycafile.in/pricing" />
                <meta property="og:image" content="https://www.mycafile.in/og-pricing.png" />
                
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="My CA File Pricing | Affordable CA Software" />
                <meta name="twitter:description" content="Best value practice management software for CA firms in India." />
                <meta name="twitter:image" content="https://www.mycafile.in/og-pricing.png" />

                <script type="application/ld+json">{JSON.stringify(pricingProductLd)}</script>
                <script type="application/ld+json">{JSON.stringify(pricingBreadcrumbLd)}</script>
            </Helmet>
            <SiteNavbar />
            
            <Box sx={{ pb: 10, pt: { xs: 8, md: 12 } }}>
                <Container maxWidth="lg">
                    {/* Header */}
                    <Box textAlign="center" mb={10}>
                        <Chip label={<Typography variant="caption" fontWeight="bold" color={colors.primary}>✨ Pricing plans</Typography>} sx={{ bgcolor: '#eff6ff', mb: 3 }} />
                        <Typography variant="h1" fontWeight="800" sx={{ color: colors.textMain, fontSize: { xs: '2.5rem', md: '3.8rem' }, letterSpacing: '-1px' }}>
                            Choose your <Box component="span" sx={{ color: colors.primary }}>perfect</Box> plan
                        </Typography>
                        <Typography variant="h6" sx={{ color: colors.textSub, mt: 2, fontWeight: 400 }}>
                            Transparent pricing with no hidden fees. Start free, scale as you grow.
                        </Typography>
                        
                        <Box display="inline-flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="center" mt={5} sx={{ bgcolor: '#f1f5f9', p: 0.5, borderRadius: { xs: '20px', sm: '50px' }, width: { xs: '100%', sm: 'auto' }, gap: { xs: 1, sm: 0 } }}>
                            <Button 
                                onClick={() => setWithCloud(false)}
                                sx={{ 
                                    borderRadius: '50px', px: 4, py: 1, textTransform: 'none', fontWeight: 'bold', border: 'none',
                                    color: !withCloud ? '#000' : colors.textSub,
                                    bgcolor: !withCloud ? '#fff' : 'transparent',
                                    width: { xs: '100%', sm: 'auto' },
                                    boxShadow: !withCloud ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
                                    '&:hover': { bgcolor: !withCloud ? '#fff' : 'transparent' }
                                }}
                            >
                                Without Cloud
                            </Button>
                            <Button 
                                onClick={() => setWithCloud(true)}
                                sx={{ 
                                    borderRadius: '50px', px: 4, py: 1, textTransform: 'none', fontWeight: 'bold', border: 'none',
                                    color: withCloud ? '#000' : colors.textSub,
                                    bgcolor: withCloud ? '#fff' : 'transparent',
                                    width: { xs: '100%', sm: 'auto' },
                                    boxShadow: withCloud ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
                                    '&:hover': { bgcolor: withCloud ? '#fff' : 'transparent' }
                                }}
                            >
                                With Cloud
                            </Button>
                        </Box>
                    </Box>

                    {/* Pricing Cards */}
                    <Grid container spacing={4} justifyContent="center" alignItems="flex-start">
                        {filteredPlans.map((plan) => {
                            const isHi = plan.highlight;
                            const textColor = isHi ? '#fff' : colors.textMain;
                            const subTextColor = isHi ? alpha('#fff', 0.8) : colors.textSub;
                            const borderCol = isHi ? 'transparent' : colors.border;
                            const bgCol = isHi ? `linear-gradient(to bottom, #9333ea, #7e22ce)` : '#fff';
                            
                            return (
                                <Grid size={{ xs: 12, md: 4 }} key={plan.name} sx={{ mt: { xs: plan.badge ? 4 : 0, md: plan.badge ? -2 : 0 } }}>
                                    <Card sx={{ 
                                        height: '100%', 
                                        display: 'flex', flexDirection: 'column', 
                                        borderRadius: '24px',
                                        background: bgCol,
                                        boxShadow: isHi ? '0 20px 40px rgba(139, 92, 246, 0.25)' : '0 10px 30px rgba(0,0,0,0.03)',
                                        border: `1px solid ${borderCol}`,
                                        position: 'relative',
                                        overflow: 'visible',
                                        pt: plan.badge ? 2 : 0,
                                        mt: plan.badge ? -2 : 0
                                    }}>
                                        {plan.badge && (
                                            <Box sx={{
                                                position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                                                bgcolor: colors.secondary, color: '#fff',
                                                px: 2.5, py: 0.5, borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', gap: 0.5,
                                                boxShadow: `0 4px 10px ${alpha(colors.secondary, 0.4)}`
                                            }}>
                                                <StarIcon sx={{ fontSize: 14 }} />
                                                {plan.badge}
                                            </Box>
                                        )}
                                        <CardContent sx={{ p: {xs: 4, md: 5}, flexGrow: 1 }}>
                                            <Typography variant="h6" fontWeight="800" color={textColor} mb={1}>
                                                {plan.name}
                                            </Typography>
                                            <Typography variant="body2" color={subTextColor} sx={{ minHeight: 40, lineHeight: 1.6 }}>
                                                {plan.subtitle}
                                            </Typography>
                                            <Box display="flex" alignItems="baseline" sx={{ mt: 2, mb: 5 }}>
                                                <Typography variant="h3" fontWeight="800" color={textColor} sx={{ letterSpacing: '-1px' }}>
                                                    ₹{plan.price.toLocaleString()}
                                                </Typography>
                                                <Typography variant="subtitle1" color={subTextColor} sx={{ ml: 1 }}>
                                                    {plan.price === 0 ? 'forever' : '/year'}
                                                </Typography>
                                            </Box>
    
                                            <List disablePadding sx={{ mb: 5 }}>
                                                <ListItem disablePadding sx={{ mb: 2 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <Box sx={{ bgcolor: isHi ? alpha('#fff', 0.2) : alpha(colors.accent, 0.1), borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={12} color={isHi ? '#fff' : colors.accent} strokeWidth={4} />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText primary={`${plan.limits.clients} clients`} primaryTypographyProps={{ variant: 'body2', color: textColor, fontWeight: 500 }} />
                                                </ListItem>
                                                <ListItem disablePadding sx={{ mb: 2 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <Box sx={{ bgcolor: isHi ? alpha('#fff', 0.2) : alpha(colors.accent, 0.1), borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={12} color={isHi ? '#fff' : colors.accent} strokeWidth={4} />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText primary={`${plan.limits.staff} staff users`} primaryTypographyProps={{ variant: 'body2', color: textColor, fontWeight: 500 }} />
                                                </ListItem>
                                                {plan.limits.storage > 0 && (
                                                    <ListItem disablePadding sx={{ mb: 2 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <Box sx={{ bgcolor: isHi ? alpha('#fff', 0.2) : alpha(colors.accent, 0.1), borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Check size={12} color={isHi ? '#fff' : colors.accent} strokeWidth={4} />
                                                            </Box>
                                                        </ListItemIcon>
                                                        <ListItemText primary={`${plan.limits.storage}GB Storage`} primaryTypographyProps={{ variant: 'body2', color: textColor, fontWeight: 500 }} />
                                                    </ListItem>
                                                )}
                                                {plan.features.map((feat, idx) => {
                                                    const isNo = feat.startsWith('No ');
                                                    return (
                                                    <ListItem key={idx} disablePadding sx={{ mb: 2 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            {isNo ? <Minus size={16} color={subTextColor} /> : <Box sx={{ bgcolor: isHi ? alpha('#fff', 0.2) : alpha(colors.accent, 0.1), borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color={isHi ? '#fff' : colors.accent} strokeWidth={4} /></Box>}
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primary={feat === 'Task Management' || feat === 'Client Management (basic)' ? feat.replace(' (basic)', '') : feat} 
                                                            primaryTypographyProps={{ variant: 'body2', color: isNo ? subTextColor : textColor, fontWeight: 500 }} 
                                                        />
                                                    </ListItem>
                                                )})}
                                            </List>

                                            <Button 
                                                fullWidth 
                                                variant="contained" 
                                                onClick={() => handleSubscribe(plan.name)}
                                                sx={{ 
                                                    mt: 'auto', py: 1.5, borderRadius: '50px', fontWeight: '800', textTransform: 'none',
                                                    bgcolor: isHi ? '#fff' : '#fff',
                                                    color: isHi ? colors.accent : colors.textMain,
                                                    border: `1px solid ${isHi ? 'transparent' : colors.border}`,
                                                    boxShadow: 'none',
                                                    '&:hover': { bgcolor: isHi ? alpha('#fff', 0.9) : '#f8fafc', boxShadow: 'none' }
                                                }}
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Addons */}
                    <Box mt={16}>
                        <Box textAlign="center" mb={10}>
                            <Box display="inline-flex" alignItems="center" gap={1} px={2} py={1} borderRadius="50px" sx={{ bgcolor: addonColorMap.accent.bg, border: `1px solid ${addonColorMap.accent.border}`, mb: 3 }}>
                                <Plus size={16} color={addonColorMap.accent.text} />
                                <Typography variant="caption" fontWeight="bold" color={addonColorMap.accent.text} textTransform="uppercase">Add-ons</Typography>
                            </Box>
                            <Typography variant="h3" fontWeight="800" sx={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
                                Powerful <Box component="span" sx={{ color: colors.primary }}>add-ons</Box>
                            </Typography>
                            <Typography variant="h6" color={colors.textSub} mt={2} fontWeight="400" sx={{ maxWidth: 600, mx: 'auto' }}>
                                Supercharge your plan with specialized features.
                            </Typography>
                        </Box>
                        
                        <Grid container spacing={3}>
                            {addons.map((addon) => {
                                const c = addonColorMap[addon.color as AddonColor];
                                return (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={addon.name}>
                                    <Paper sx={{ 
                                        p: 3.5, borderRadius: '24px', border: `1px solid ${colors.border}`, boxShadow: 'none', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                            borderColor: c.hoverBorder,
                                            '& .addon-icon': { transform: 'scale(1.1)' },
                                            '& .addon-btn': { opacity: 1, transform: 'translateY(0)' }
                                        }
                                    }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Box className="addon-icon" sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s' }}>
                                                <addon.icon size={20} />
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography variant="h6" fontWeight="bold" color={c.text}>{addon.price}</Typography>
                                                <Typography variant="caption" color={colors.textSub} fontWeight="500">/yr</Typography>
                                            </Box>
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight="bold" color={colors.textMain} mb={1}>{addon.name}</Typography>
                                        <Typography variant="body2" color={colors.textSub} sx={{ mb: 2, minHeight: 40, lineHeight: 1.6 }}>{addon.desc}</Typography>
                                        <Button 
                                            className="addon-btn" 
                                            disableRipple 
                                            sx={{ 
                                                p: 0, minWidth: 'auto', color: c.text, textTransform: 'none', fontWeight: 'bold', 
                                                opacity: 0, transform: 'translateY(4px)', transition: 'all 0.3s',
                                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                            }}
                                        >
                                            <Plus size={16} style={{ marginRight: 6 }} /> Add to plan
                                        </Button>
                                    </Paper>
                                </Grid>
                            )})}
                        </Grid>
                    </Box>

                    {/* Compare Plans */}
                    <Box mt={16} position="relative">
                        <Box sx={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: { xs: 300, md: 600 }, height: { xs: 300, md: 600 }, bgcolor: alpha(colors.primary, 0.03),
                            borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0
                        }} />

                        <Box position="relative" maxWidth="lg" mx="auto">
                            <Box textAlign="center" mb={10}>
                                <Box display="inline-flex" alignItems="center" gap={1} px={2} py={1} borderRadius="50px" sx={{ bgcolor: alpha(colors.primary, 0.08), border: `1px solid ${alpha(colors.primary, 0.15)}`, mb: 3 }}>
                                    <LayoutGrid size={16} color={colors.primary} />
                                    <Typography variant="caption" fontWeight="bold" color={colors.primary}>Compare</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="800" sx={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
                                    Compare <Box component="span" sx={{ color: colors.primary }}>plans</Box>
                                </Typography>
                                <Typography variant="h6" color={colors.textSub} mt={2} fontWeight="400" sx={{ maxWidth: 600, mx: 'auto' }}>
                                    Detailed feature comparison to find the right fit.
                                </Typography>
                            </Box>

                            <TableContainer sx={{ 
                                border: `1px solid ${colors.border}`, 
                                borderRadius: '16px', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
                                bgcolor: '#fff',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                <Table sx={{ minWidth: 800 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ borderBottom: `1px solid ${colors.border}`, py: 2.5, pl: 4, width: '40%' }}>
                                                <Typography variant="caption" fontWeight="bold" color={colors.textSub} textTransform="uppercase" letterSpacing={1}>Features</Typography>
                                            </TableCell>
                                            {defaultPlans.map(plan => (
                                                <TableCell key={plan.name} align="center" sx={{ borderBottom: `1px solid ${colors.border}`, py: 2.5 }}>
                                                    <Typography variant="subtitle2" fontWeight="bold" color={plan.highlight ? colors.accent : colors.textMain}>
                                                        {plan.name}
                                                    </Typography>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[
                                            { label: 'Clients', getVal: (p: typeof defaultPlans[0]) => p.limits.clients < 9999 ? p.limits.clients : 'Unlimited' },
                                            { label: 'Storage', getVal: (p: typeof defaultPlans[0]) => p.limits.storage > 0 ? `${p.limits.storage} GB` : false },
                                            { label: 'Team members', getVal: (p: typeof defaultPlans[0]) => p.limits.staff < 999 ? p.limits.staff : 'Unlimited' },
                                            { label: 'Client Management', getVal: (p: typeof defaultPlans[0]) => p.name === 'Starter' ? 'Basic' : p.name.includes('Enterprise') ? 'Client Portal' : 'Login Panel' },
                                            { label: 'Task Generator', getVal: (p: typeof defaultPlans[0]) => p.name === 'Starter' ? 'Manual' : p.name === 'Professional' ? 'Limited Auto' : 'Advanced Auto' },
                                            { label: 'Billing System', getVal: (p: typeof defaultPlans[0]) => p.name === 'Starter' ? false : p.name === 'Professional' ? 'Basic' : p.name.includes('Enterprise') ? 'Full System' : 'Adv + GST' },
                                            { label: 'Reminders', getVal: (p: typeof defaultPlans[0]) => p.name === 'Starter' ? false : p.name === 'Professional' ? 'Email' : p.name === 'Pro Cloud' ? 'Email + WA' : 'All Channels' },
                                            { label: 'DSC Tracking', getVal: (p: typeof defaultPlans[0]) => p.name === 'Starter' ? false : p.name.includes('Enterprise') || p.name === 'Pro Cloud' ? 'Expiry Auto' : 'Basic' },
                                            { label: 'Role-based access', getVal: (p: typeof defaultPlans[0]) => p.name.includes('Enterprise') },
                                            { label: 'Dedicated Support', getVal: (p: typeof defaultPlans[0]) => p.name.includes('Enterprise') },
                                        ].map((row, i) => (
                                            <TableRow 
                                                key={row.label}
                                                sx={{ 
                                                    bgcolor: i % 2 === 0 ? '#f8fafc' : 'transparent',
                                                    transition: 'background-color 0.2s',
                                                    '&:hover': { bgcolor: alpha(colors.textSub, 0.05) }
                                                }}
                                            >
                                                <TableCell sx={{ borderBottom: `1px solid ${alpha(colors.border, 0.4)}`, pl: 4, py: 2 }}>
                                                    <Typography variant="body2" fontWeight="600" color={colors.textMain}>{row.label}</Typography>
                                                </TableCell>
                                                {defaultPlans.map(plan => {
                                                    const val = row.getVal(plan);
                                                    return (
                                                        <TableCell align="center" key={plan.name} sx={{ borderBottom: `1px solid ${alpha(colors.border, 0.4)}`, py: 2 }}>
                                                            {typeof val === 'boolean' ? (
                                                                val ? (
                                                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: alpha(colors.checkColor, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto' }}>
                                                                        <Check size={14} color={colors.checkColor} />
                                                                    </Box>
                                                                ) : (
                                                                    <Minus size={16} color={alpha(colors.textSub, 0.3)} style={{ margin: 'auto' }} />
                                                                )
                                                            ) : (
                                                                <Typography variant="body2" fontWeight="500" color={colors.textMain}>{val}</Typography>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>

                    {/* Why Choose Us */}
                    <Box mt={20} mb={10} position="relative" sx={{ overflow: 'hidden' }}>
                        <Box sx={{
                            position: 'absolute', bottom: 0, left: '33%', transform: 'translateX(-50%)',
                            width: { xs: 250, md: 500 }, height: { xs: 250, md: 500 }, bgcolor: alpha(colors.primary, 0.04),
                            borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
                        }} />
                        <Box sx={{
                            position: 'absolute', top: 0, right: '25%', transform: 'translateX(50%)',
                            width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 }, bgcolor: alpha(colors.secondary, 0.04),
                            borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
                        }} />

                        <Box position="relative" maxWidth="lg" mx="auto">
                             <Box textAlign="center" mb={10}>
                                <Box display="inline-flex" alignItems="center" gap={1} px={2} py={1} borderRadius="50px" sx={{ bgcolor: alpha(colors.secondary, 0.08), border: `1px solid ${alpha(colors.secondary, 0.15)}`, mb: 3 }}>
                                    <Star size={16} color={colors.secondary} />
                                    <Typography variant="caption" fontWeight="bold" color={colors.secondary}>Benefits</Typography>
                                </Box>
                                <Typography variant="h3" fontWeight="800" sx={{ color: colors.textMain, letterSpacing: '-0.5px' }}>
                                    Why teams <Box component="span" sx={{ color: colors.secondary }}>choose us</Box>
                                </Typography>
                                <Typography variant="h6" color={colors.textSub} mt={2} fontWeight="400" sx={{ maxWidth: 600, mx: 'auto' }}>
                                    Every plan includes powerful features designed for CA service providers.
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={4}>
                                {featuresBoxes.map((feat, idx) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                        <Paper 
                                            className="group"
                                            sx={{ 
                                                position: 'relative',
                                                p: 4, 
                                                borderRadius: '24px', 
                                                border: `1px solid ${colors.border}`, 
                                                bgcolor: '#fff',
                                                boxShadow: 'none', 
                                                height: '100%',
                                                transition: 'all 0.5s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
                                                }
                                            }}>
                                            <Box sx={{ 
                                                width: 56, height: 56, borderRadius: '16px', 
                                                background: `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(colors.secondary, 0.08)} 100%)`, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                                                transition: 'transform 0.3s',
                                                '.group:hover &': {
                                                    transform: 'scale(1.1)'
                                                }
                                            }}>
                                                <feat.icon size={24} color={colors.primary} />
                                            </Box>
                                            <Typography variant="h6" fontWeight="bold" color={colors.textMain} mb={1.5}>{feat.title}</Typography>
                                            <Typography variant="body2" color={colors.textSub} lineHeight={1.7}>{feat.desc}</Typography>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>

                            {/* CTA Banner */}
                            <Box mt={20} textAlign="center">
                                <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#fff', border: `1px solid ${colors.border}`, borderRadius: '24px', px: {xs: 4, md: 8}, py: {xs: 5, md: 6}, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                                    <Typography variant="h4" fontWeight="800" color={colors.textMain} mb={2}>
                                        Ready to get started?
                                    </Typography>
                                    <Typography variant="body1" color={colors.textSub} mb={4} maxWidth={450}>
                                        Join thousands of teams already building with us.
                                    </Typography>
                                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} width={{ xs: '100%', sm: 'auto' }}>
                                        <Button disableRipple variant="contained" sx={{ 
                                            background: `linear-gradient(to right, ${colors.primary}, #60a5fa)`, 
                                            color: '#fff', borderRadius: '12px', px: 4, py: 1.5, 
                                            textTransform: 'none', fontWeight: 'bold', 
                                            boxShadow: `0 4px 14px 0 ${alpha(colors.primary, 0.39)}`, 
                                            '&:hover': { opacity: 0.9, boxShadow: `0 6px 20px rgba(0,118,255,0.23)` } 
                                        }}>
                                            Start Free Trial
                                        </Button>
                                        <Button disableRipple variant="outlined" sx={{ 
                                            borderColor: colors.border, color: colors.textMain, 
                                            borderRadius: '12px', px: 4, py: 1.5, 
                                            textTransform: 'none', fontWeight: 'bold', 
                                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } 
                                        }}>
                                            Talk to Sales
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>
            <SiteFooter />
        </Box>
    );
};
export default PricingPage;
