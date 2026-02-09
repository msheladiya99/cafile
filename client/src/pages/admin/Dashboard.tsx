import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
    Button,
    Grid,
    Skeleton,
    Fade
} from '@mui/material';
import {
    People as PeopleIcon,
    CloudUpload as UploadIcon,
    Folder as FolderIcon,
    TrendingUp,
    Event as EventIcon,
    NotificationsActive as NotificationsIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { reminderService } from '../../services/reminderService';
import type { Client } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    const { data: clients = [], isLoading: isLoadingClients } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
        queryKey: ['upcoming-reminders'],
        queryFn: reminderService.getUpcomingReminders
    });

    const upcomingReminders = reminders.slice(0, 5);
    const isLoading = isLoadingClients || isLoadingReminders;

    const statCards = [
        {
            title: 'Total Clients',
            value: clients.length,
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            color: '#667eea',
            bgColor: 'rgba(102, 126, 234, 0.1)',
        },
        {
            title: 'Files Uploaded',
            value: 0, // Placeholder
            icon: <FolderIcon sx={{ fontSize: 40 }} />,
            color: '#f093fb',
            bgColor: 'rgba(240, 147, 251, 0.1)',
        },
        {
            title: 'Active Reminders',
            value: reminders.length,
            icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
            color: '#4facfe',
            bgColor: 'rgba(79, 172, 254, 0.1)',
        },
    ];

    return (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5 }}>
            <Typography variant="h4" fontWeight="700" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
                Welcome to your CA Admin Panel
            </Typography>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 6
            }}>
                {statCards.map((card, index) => (
                    <Card
                        key={index}
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-5px)',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                            },
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h3" fontWeight="700" color={card.color}>
                                        {isLoading ? <Skeleton width="60%" /> : card.value}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: card.bgColor,
                                        color: card.color,
                                        flexShrink: 0
                                    }}
                                >
                                    {card.icon}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            height: '100%'
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Box>
                                <Typography variant="h6" fontWeight="700">
                                    Upcoming Deadlines
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Next 5 filing dates
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => navigate('/admin/reminders')}
                                sx={{ textTransform: 'none' }}
                            >
                                View All
                            </Button>
                        </Box>

                        <List disablePadding>
                            {isLoading ? (
                                [1, 2, 3].map((i) => (
                                    <Box key={i} sx={{ py: 2 }}>
                                        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                                    </Box>
                                ))
                            ) : upcomingReminders.length === 0 ? (
                                <Box py={3} textAlign="center">
                                    <Typography color="text.secondary">No upcoming deadlines.</Typography>
                                </Box>
                            ) : (
                                <Fade in={!isLoading}>
                                    <Box>
                                        {upcomingReminders.map((reminder, idx) => (
                                            <React.Fragment key={reminder._id}>
                                                <ListItem sx={{ px: 0, py: 2 }}>
                                                    <ListItemIcon sx={{ minWidth: 45 }}>
                                                        <Box sx={{
                                                            p: 1,
                                                            borderRadius: 1.5,
                                                            bgcolor: reminder.priority === 'HIGH' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                                                            color: reminder.priority === 'HIGH' ? '#f44336' : '#667eea'
                                                        }}>
                                                            <EventIcon fontSize="small" />
                                                        </Box>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                <Typography variant="body2" fontWeight="700">{reminder.title}</Typography>
                                                                <Chip
                                                                    label={new Date(reminder.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                                    size="small"
                                                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box display="flex" justifyContent="space-between" mt={0.5}>
                                                                <Typography variant="caption">{(reminder.clientId as Client).name}</Typography>
                                                                <Typography variant="caption" color={reminder.priority === 'HIGH' ? 'error.main' : 'text.secondary'} fontWeight={reminder.priority === 'HIGH' ? 600 : 400}>
                                                                    {reminder.reminderType} • {reminder.priority}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                {idx < upcomingReminders.length - 1 && <Divider component="li" />}
                                            </React.Fragment>
                                        ))}
                                    </Box>
                                </Fade>
                            )}
                        </List>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Common tasks for your CA office
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                            <Box
                                onClick={() => navigate('/admin/clients')}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    '&:hover': { transform: 'scale(1.02)' },
                                }}
                            >
                                <PeopleIcon />
                                <Box>
                                    <Typography variant="body1" fontWeight="700">Add New Client</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Create client account</Typography>
                                </Box>
                            </Box>
                            <Box
                                onClick={() => navigate('/admin/upload')}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    '&:hover': { transform: 'scale(1.02)' },
                                }}
                            >
                                <UploadIcon />
                                <Box>
                                    <Typography variant="body1" fontWeight="700">Upload Files</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Assign documents</Typography>
                                </Box>
                            </Box>
                            <Box
                                onClick={() => navigate('/admin/billing')}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    '&:hover': { transform: 'scale(1.02)' },
                                }}
                            >
                                <TrendingUp />
                                <Box>
                                    <Typography variant="body1" fontWeight="700">Billing & Invoices</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Manage payments</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

