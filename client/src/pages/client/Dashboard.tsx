import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Folder as FolderIcon,
    EventNote,
    CheckCircleOutline,
    TrendingUp,
    AccountBalance,
    ReceiptLong,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon
} from '@mui/icons-material';
import { clientService } from '../../services/clientService';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
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
    Fade,
    IconButton,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';

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

    const [viewDate, setViewDate] = React.useState(new Date());
    const [tasks, setTasks] = React.useState<{ id: number; text: string; completed: boolean }[]>(() => {
        try {
            const saved = localStorage.getItem('clientToDos');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: 'Upload March GST documents', completed: false },
                { id: 2, text: 'Review pending invoice', completed: false },
            ];
        } catch (error) {
            console.error('Failed to parse tasks from local storage', error);
            return [];
        }
    });
    const [newTask, setNewTask] = React.useState('');


    // Save tasks to LocalStorage whenever they change
    React.useEffect(() => {
        localStorage.setItem('clientToDos', JSON.stringify(tasks));
    }, [tasks]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([{ id: Date.now(), text: newTask, completed: false }, ...tasks]);
        setNewTask('');
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    // Helper function to get deadline info
    const getDeadlineInfo = (date: number) => {
        // GST Deadlines
        if (date === 11) return { type: 'GSTR-1', period: 'Monthly', color: '#667eea' };
        if (date === 13) return { type: 'GSTR-1', period: 'Quarterly', color: '#764ba2' };
        if (date === 20) return { type: 'GSTR-3B', period: 'Monthly', color: '#f093fb' };
        if (date === 22) return { type: 'GSTR-3B', period: 'Quarterly (22nd)', color: '#f5576c' };
        if (date === 24) return { type: 'GSTR-3B', period: 'Quarterly (24th)', color: '#f5576c' };

        // TDS/TCS Deadlines
        if (date === 7) return { type: 'TDS/TCS', period: 'Payment (Monthly)', color: '#10b981' };
        if (date === 30) return { type: 'TDS Return', period: 'Quarterly Filing', color: '#059669' };

        return null;
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setViewDate(new Date());
    };

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
                <Chip
                    label={`FY 2025-26`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
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

            {/* Main Content Grid: Calendar + Quick Actions + To-Do List (Equal Heights) */}
            <Grid container spacing={3} mb={6}>

                {/* 1. Mini GST Compliance Calendar */}
                <Grid size={{ xs: 12, md: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2.5} display="flex" alignItems="center" justifyContent="space-between">
                            <IconButton onClick={handlePrevMonth} size="small">
                                <ChevronLeftIcon />
                            </IconButton>
                            <Box textAlign="center" onClick={handleToday} sx={{ cursor: 'pointer' }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                        mb: 0.5
                                    }}
                                >
                                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    sx={{ fontSize: '0.7rem' }}
                                >
                                    GST Filing Deadlines
                                </Typography>
                            </Box>
                            <IconButton onClick={handleNextMonth} size="small">
                                <ChevronRightIcon />
                            </IconButton>
                        </Box>

                        <Box>
                            {/* Day Headers */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 0.5,
                                mb: 1
                            }}>
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                                    <Box
                                        key={day}
                                        sx={{
                                            textAlign: 'center',
                                            py: 0.75,
                                            fontWeight: 600,
                                            fontSize: '0.6rem',
                                            color: 'text.disabled',
                                            letterSpacing: '0.3px'
                                        }}
                                    >
                                        {day}
                                    </Box>
                                ))}
                            </Box>

                            {/* Calendar Dates */}
                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 0.5
                            }}>
                                {(() => {
                                    const today = new Date();
                                    const year = viewDate.getFullYear();
                                    const month = viewDate.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const todayDate = today.getDate();
                                    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

                                    const dates = [];

                                    for (let i = 0; i < firstDay; i++) {
                                        dates.push(
                                            <Box key={`empty-${i}`} sx={{ aspectRatio: '1', minHeight: 36 }} />
                                        );
                                    }

                                    for (let date = 1; date <= daysInMonth; date++) {
                                        const isToday = isCurrentMonth && date === todayDate;
                                        const deadlineInfo = getDeadlineInfo(date);
                                        const isGSTDeadline = deadlineInfo !== null;

                                        let bgColor = 'transparent';
                                        let textColor = 'text.primary';
                                        let hoverBg = 'rgba(0,0,0,0.04)';

                                        if (isToday) {
                                            bgColor = '#FF6B35';
                                            textColor = 'white';
                                            hoverBg = '#FF5722';
                                        } else if (isGSTDeadline) {
                                            bgColor = `${deadlineInfo.color}15`;
                                            hoverBg = `${deadlineInfo.color}30`;
                                        }

                                        const dateCell = (
                                            <Box
                                                key={date}
                                                sx={{
                                                    aspectRatio: '1',
                                                    minHeight: 36,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: isToday ? '50%' : 1.5,
                                                    bgcolor: bgColor,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    '&:hover': {
                                                        bgcolor: hoverBg,
                                                        transform: isGSTDeadline ? 'scale(1.15)' : 'scale(1.05)',
                                                        boxShadow: isGSTDeadline ? `0 4px 12px ${deadlineInfo.color}40` : 'none',
                                                        zIndex: 10
                                                    },
                                                    position: 'relative'
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={isToday ? 700 : isGSTDeadline ? 600 : 400}
                                                    color={textColor}
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        lineHeight: 1
                                                    }}
                                                >
                                                    {date}
                                                </Typography>
                                                {isGSTDeadline && !isToday && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 4,
                                                            width: 3,
                                                            height: 3,
                                                            borderRadius: '50%',
                                                            bgcolor: deadlineInfo.color
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        );

                                        if (isGSTDeadline) {
                                            dates.push(
                                                <Tooltip
                                                    key={date}
                                                    enterTouchDelay={0}
                                                    title={
                                                        <Box sx={{ p: 0.5 }}>
                                                            <Typography variant="caption" fontWeight={700} display="block">
                                                                {deadlineInfo.type}
                                                            </Typography>
                                                            <Typography variant="caption" fontSize="0.65rem" display="block">
                                                                {deadlineInfo.period} Filing
                                                            </Typography>
                                                            <Typography variant="caption" fontSize="0.65rem" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                                                                Due: {date} {viewDate.toLocaleDateString('en-US', { month: 'short' })}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    arrow
                                                    placement="top"
                                                    componentsProps={{
                                                        tooltip: {
                                                            sx: {
                                                                bgcolor: deadlineInfo.color,
                                                                '& .MuiTooltip-arrow': {
                                                                    color: deadlineInfo.color,
                                                                },
                                                                boxShadow: `0 4px 12px ${deadlineInfo.color}60`,
                                                                borderRadius: 2
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {dateCell}
                                                </Tooltip>
                                            );
                                        } else {
                                            dates.push(dateCell);
                                        }
                                    }

                                    return dates;
                                })()}
                            </Box>
                        </Box>

                        <Box sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75
                        }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FF6B35' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Today</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    {new Date().getDate()}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#667eea' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">GSTR-1</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    11th, 13th
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 2. Quick Actions Panel */}
                <Grid size={{ xs: 12, md: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: { xs: 2.5, md: 3 },
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={3}>
                            Common tasks for clients
                        </Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: { xs: 2, md: 2 }
                        }}>
                            <Box
                                onClick={() => navigate('/client/files')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FolderIcon sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        My Documents
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                onClick={() => navigate('/client/invoices')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(11, 163, 96, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(11, 163, 96, 0.4)',
                                    },
                                }}
                            >
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ReceiptLong sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        My Invoices
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* 3. Smart To-Do List Section */}
                <Grid size={{ xs: 12, md: 4 }} display="flex">
                    <Paper
                        sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                            background: '#ffffff',
                            width: '100%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box mb={2}>
                            <Typography variant="h6" fontWeight="700" gutterBottom>
                                My Tasks
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Personal to-do list
                            </Typography>
                        </Box>

                        <form onSubmit={handleAddTask}>
                            <Box display="flex" gap={1} mb={2}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Add task..."
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        sx: { borderRadius: 2, fontSize: '0.9rem' }
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    type="submit"
                                    sx={{
                                        borderRadius: 2,
                                        minWidth: 'auto',
                                        px: 2,
                                        background: 'linear-gradient(45deg, #11998e 30%, #38ef7d 90%)',
                                    }}
                                >
                                    <AddIcon />
                                </Button>
                            </Box>
                        </form>

                        <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '200px' }}>
                            {tasks.length === 0 ? (
                                <Box py={4} textAlign="center" color="text.secondary">
                                    <Typography variant="caption">No tasks yet.</Typography>
                                </Box>
                            ) : (
                                tasks.map((task) => (
                                    <Fade in key={task.id}>
                                        <ListItem
                                            sx={{
                                                px: 1.5,
                                                py: 0.5,
                                                mb: 1,
                                                borderRadius: 2,
                                                bgcolor: task.completed ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,1)',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.04)',
                                                    transform: 'translateX(3px)'
                                                }
                                            }}
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete" onClick={() => deleteTask(task.id)} size="small" color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }} onClick={() => toggleTask(task.id)}>
                                                <IconButton size="small" color={task.completed ? "success" : "default"}>
                                                    {task.completed ? <CheckCircleIcon fontSize="small" /> : <UncheckedIcon fontSize="small" />}
                                                </IconButton>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            textDecoration: task.completed ? 'line-through' : 'none',
                                                            color: task.completed ? 'text.secondary' : 'text.primary',
                                                            fontWeight: task.completed ? 400 : 500,
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        {task.text}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </Fade>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};
