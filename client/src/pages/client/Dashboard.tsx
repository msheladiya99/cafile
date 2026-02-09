import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Chip,
    Button,
    Container,
    Stack,
    Skeleton,
    Fade
} from '@mui/material';
import {
    Folder as FolderIcon,
    EventNote,
    CheckCircleOutline,
    TrendingUp,
    AccountBalance,
    ReceiptLong
} from '@mui/icons-material';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

export const ClientDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: statsData = [], isLoading: isLoadingStats } = useQuery({
        queryKey: ['client-stats'],
        queryFn: clientService.getStats
    });

    const { data: remindersData = [], isLoading: isLoadingReminders } = useQuery({
        queryKey: ['client-reminders'],
        queryFn: clientService.getReminders
    });

    const reminders = remindersData.filter(r => r.status !== 'COMPLETED');
    const isLoading = isLoadingStats || isLoadingReminders;

    // Process stats
    const stats = { ITR: 0, GST: 0, ACCOUNTING: 0 };
    statsData.forEach((stat: any) => {
        if (stat._id === 'ITR' || stat._id === 'GST' || stat._id === 'ACCOUNTING') {
            stats[stat._id as keyof typeof stats] = stat.count;
        }
    });

    const statCards = [
        {
            title: 'ITR Returns',
            value: stats.ITR,
            icon: <ReceiptLong sx={{ fontSize: 40 }} />,
            color: '#fff',
            bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            shadow: '0 10px 20px -5px rgba(102, 126, 234, 0.4)',
        },
        {
            title: 'GST Returns',
            value: stats.GST,
            icon: <TrendingUp sx={{ fontSize: 40 }} />,
            color: '#fff',
            bgColor: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
            shadow: '0 10px 20px -5px rgba(11, 163, 96, 0.4)',
        },
        {
            title: 'Accounting',
            value: stats.ACCOUNTING,
            icon: <AccountBalance sx={{ fontSize: 40 }} />,
            color: '#fff',
            bgColor: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
            shadow: '0 10px 20px -5px rgba(255, 94, 98, 0.4)',
        },
    ];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header Section */}
            <Box mb={5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{
                        background: 'linear-gradient(45deg, #1a237e 30%, #534bae 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                    }}>
                        Welcome back, {user?.name || user?.username || 'Client'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                        Here's your financial overview and recent updates
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<FolderIcon />}
                    onClick={() => navigate('/client/files')}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                >
                    View All Documents
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} mb={5}>
                {statCards.map((card, index) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index} {...({ item: true } as any)}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                height: '100%',
                                background: card.bgColor,
                                boxShadow: card.shadow,
                                color: card.color,
                                transition: 'all 0.3s ease',
                                border: 'none',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: typeof card.shadow === 'string' ? `0 20px 40px -10px ${card.shadow.replace('0.4', '0.6')}` : 'none'
                                },
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ width: '100%' }}>
                                        <Typography variant="subtitle1" fontWeight="600" sx={{ opacity: 0.9 }}>
                                            {card.title}
                                        </Typography>
                                        <Typography variant="h3" fontWeight="800" sx={{ mt: 2 }}>
                                            {isLoading ? <Skeleton width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} /> : card.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        flexShrink: 1
                                    }}>
                                        {card.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={4}>
                {/* Main Content Area */}
                <Grid size={{ xs: 12, lg: 8 }} {...({ item: true } as any)}>
                    <Typography variant="h6" fontWeight="700" mb={3}>Quick Shortcuts</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                        <Paper
                            onClick={() => navigate('/client/files')}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', color: '#667eea' }}>
                                <FolderIcon />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="700">My Documents</Typography>
                                <Typography variant="body2" color="text.secondary">View and upload files</Typography>
                            </Box>
                        </Paper>

                        <Paper
                            onClick={() => navigate('/client/invoices')}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(11, 163, 96, 0.1)', color: '#0ba360' }}>
                                <ReceiptLong />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="700">Billing</Typography>
                                <Typography variant="body2" color="text.secondary">Check your invoices</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* Right Column: Reminders */}
                <Grid size={{ xs: 12, lg: 4 }} {...({ item: true } as any)}>
                    <Typography variant="h6" fontWeight="700" mb={3}>Upcoming Tasks</Typography>
                    <Stack spacing={2}>
                        {isLoading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={100} sx={{ borderRadius: 3 }} />)
                        ) : reminders.length === 0 ? (
                            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                                <CheckCircleOutline color="success" sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                <Typography color="text.secondary" fontWeight="500">You're all caught up!</Typography>
                            </Paper>
                        ) : (
                            <Fade in={!isLoading}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {reminders.map((reminder) => (
                                        <Paper key={reminder._id} elevation={0} sx={{
                                            p: 2.5,
                                            borderRadius: 3,
                                            border: '1px solid',
                                            borderColor: reminder.status === 'OVERDUE' ? 'error.light' : 'divider',
                                            bgcolor: reminder.status === 'OVERDUE' ? 'error.50' : 'background.paper'
                                        }}>
                                            <Box display="flex" justifyContent="space-between" mb={1} alignItems="flex-start">
                                                <Chip label={reminder.reminderType} size="small" color="primary" sx={{ borderRadius: 1, height: 24 }} />
                                                {reminder.priority === 'HIGH' && <Chip label="High" size="small" color="error" sx={{ borderRadius: 1, height: 24 }} />}
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>{reminder.title}</Typography>
                                            <Box display="flex" alignItems="center" gap={1} color={reminder.status === 'OVERDUE' ? 'error.main' : 'text.secondary'}>
                                                <EventNote fontSize="small" />
                                                <Typography variant="caption" fontWeight="600">
                                                    Due: {new Date(reminder.dueDate).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Box>
                            </Fade>
                        )}
                    </Stack>
                </Grid>
            </Grid>


        </Container>
    );
};
