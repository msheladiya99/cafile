import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Button,
    Grid,
    Fade,
    Tooltip,
    IconButton,
    TextField,
    Avatar
} from '@mui/material';
import {
    People as PeopleIcon,
    CloudUpload as UploadIcon,
    TrendingUp,
    Event as EventIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Assignment as AssignmentIcon,
    PieChart as PieChartIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';
import { reminderService } from '../../services/reminderService';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

interface ToDoItem {
    id: number;
    text: string;
    completed: boolean;
}

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [viewDate, setViewDate] = useState(new Date());

    const [tasks, setTasks] = useState<ToDoItem[]>(() => {
        try {
            const saved = localStorage.getItem('adminToDos');
            return saved ? JSON.parse(saved) : [
                { id: 1, text: 'Review pending GST filings', completed: false },
                { id: 2, text: 'Send invoice reminders', completed: true },
            ];
        } catch (error) {
            console.error('Failed to parse tasks from local storage', error);
            return [
                { id: 1, text: 'Review pending GST filings', completed: false },
                { id: 2, text: 'Send invoice reminders', completed: true },
            ];
        }
    });
    const [newTask, setNewTask] = useState('');

    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: adminService.getClients
    });

    const { data: reminders = [] } = useQuery({
        queryKey: ['upcoming-reminders'],
        queryFn: reminderService.getUpcomingReminders
    });


    // Save tasks to LocalStorage whenever they change
    useEffect(() => {
        localStorage.setItem('adminToDos', JSON.stringify(tasks));
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
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5 }}>
            {/* Header Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="800" sx={{ background: 'linear-gradient(45deg, #2c3e50, #3498db)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome to your CA Admin Panel
                    </Typography>
                </Box>
                <Chip
                    label="FY 2025-26"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>

            {/* Top Stats Row */}
            <Grid container spacing={3} mb={6}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Clients</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: '#2c3e50' }}>{clients.length}</Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(52, 152, 219, 0.1)', color: '#3498db', width: 56, height: 56 }}>
                            <PeopleIcon />
                        </Avatar>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Pending Tasks</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: '#e67e22' }}>{reminders.length}</Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', width: 56, height: 56 }}>
                            <AssignmentIcon />
                        </Avatar>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>Filings Done</Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ color: '#27ae60' }}>85%</Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', width: 56, height: 56 }}>
                            <PieChartIcon />
                        </Avatar>
                    </Paper>
                </Grid>
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
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f093fb' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">GSTR-3B</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    20th, 22nd, 24th
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                                    <Typography variant="caption" fontSize="0.7rem" color="text.secondary">TDS/TCS</Typography>
                                </Box>
                                <Typography variant="caption" fontSize="0.7rem" fontWeight={600} color="text.primary">
                                    7th, 30th
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
                            Common tasks for your CA office
                        </Typography>

                        {/* Always 2 Columns for Better Grid */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: { xs: 2, md: 2 }
                        }}>
                            <Box
                                onClick={() => navigate('/admin/clients')}
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
                                    <PeopleIcon sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Add Client
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                onClick={() => navigate('/admin/reminders')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(250, 112, 154, 0.4)',
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
                                    <EventIcon sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Reminder
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                onClick={() => navigate('/admin/upload')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)',
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
                                    <UploadIcon sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Upload
                                    </Typography>
                                </Box>
                            </Box>

                            <Box
                                onClick={() => navigate('/admin/billing')}
                                sx={{
                                    p: { xs: 2, md: 2 },
                                    borderRadius: 2.5,
                                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                    boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
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
                                    <TrendingUp sx={{ fontSize: { xs: 24, md: 24 } }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" fontWeight="700" sx={{ mb: 0.5 }}>
                                        Invoice
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
                                Smart To-Do
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Daily admin tasks
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

                        <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '100%' }}>
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
        </Box>
    );
};
