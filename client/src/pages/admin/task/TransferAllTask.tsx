import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    MenuItem,
    Select,
    Grid,
    TextField,
    Avatar,
} from '@mui/material';
import { 
    Users, 
    ArrowRightLeft, 
    Send, 
    FileText, 
    ListFilter,
    ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import type { User } from '../../../types';
import toast from 'react-hot-toast';

export const TransferAllTask: React.FC = () => {
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const handleTransfer = async () => {
        if (!transferFrom || !transferTo) {
            toast.error('Please select both employees');
            return;
        }
        if (transferFrom === transferTo) {
            toast.error('Source and destination employees cannot be the same');
            return;
        }

        setIsSubmitting(true);
        try {
            // Implementation for transferring all tasks
            console.log('Transferring all tasks from', transferFrom, 'to', transferTo);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
            toast.success('All tasks have been successfully transferred');
            setDescription('');
        } catch {
            toast.error('Failed to transfer tasks. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <Box sx={{ p: 0, maxWidth: 1000, mx: 'auto' }}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Header Section */}
                <Box sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-end'
                }}>
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 700, 
                                color: '#1e293b', 
                                mb: 1,
                                letterSpacing: '-0.02em'
                            }}
                        >
                            Transfer All Tasks
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                            <Users size={16} />
                            <Typography variant="body2">
                                Bulk reassign tasks between team members effortlessly
                            </Typography>
                        </Box>
                    </Box>
                    <Button 
                        variant="outlined" 
                        startIcon={<ListFilter size={18} />}
                        sx={{ 
                            borderRadius: '12px',
                            textTransform: 'none',
                            borderColor: '#e2e8f0',
                            color: '#64748b',
                            '&:hover': {
                                bgcolor: '#f8fafc',
                                borderColor: '#cbd5e1'
                            }
                        }}
                    >
                        View Recent Transfers
                    </Button>
                </Box>

                {/* Main Card */}
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, 
                        borderRadius: '24px', 
                        border: '1px solid #e2e8f0',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                    }}
                >
                    <Grid container spacing={6} alignItems="center">
                        {/* Selector Sections */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        From Employee <span style={{ color: '#ef4444' }}>*</span>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Select the employee who is currently assigned the tasks</Typography>
                                </Box>
                                <Select 
                                    size="medium" 
                                    fullWidth 
                                    displayEmpty 
                                    value={transferFrom} 
                                    onChange={(e) => setTransferFrom(e.target.value)}
                                    sx={{ 
                                        borderRadius: '16px',
                                        bgcolor: '#ffffff',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '2px' }
                                    }}
                                >
                                    <MenuItem value="" disabled>Choose Source...</MenuItem>
                                    {staffUsers.map((u: User) => (
                                        <MenuItem key={u._id} value={u._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#e0f2fe', color: '#0369a1' }}>
                                                    {(u.name || u.username || '?').charAt(0)}
                                                </Avatar>
                                                {u.name || u.username}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </motion.div>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Box 
                                sx={{ 
                                    p: 1.5, 
                                    borderRadius: '50%', 
                                    bgcolor: '#eff6ff', 
                                    color: '#3b82f6',
                                    display: 'flex',
                                    boxShadow: '0 0 0 4px #f8fafc'
                                }}
                            >
                                <ArrowRightLeft size={24} />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        To Employee <span style={{ color: '#ef4444' }}>*</span>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">Select the employee who will receive all these tasks</Typography>
                                </Box>
                                <Select 
                                    size="medium" 
                                    fullWidth 
                                    displayEmpty 
                                    value={transferTo} 
                                    onChange={(e) => setTransferTo(e.target.value)}
                                    sx={{ 
                                        borderRadius: '16px',
                                        bgcolor: '#ffffff',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '2px' }
                                    }}
                                >
                                    <MenuItem value="" disabled>Choose Destination...</MenuItem>
                                    {staffUsers.map((u: User) => (
                                        <MenuItem key={u._id} value={u._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#f0fdf4', color: '#15803d' }}>
                                                    {(u.name || u.username || '?').charAt(0)}
                                                </Avatar>
                                                {u.name || u.username}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </motion.div>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <motion.div variants={itemVariants}>
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FileText size={18} color="#64748b" />
                                    <Typography sx={{ fontWeight: 600, color: '#475569' }}>Description / Reason</Typography>
                                </Box>
                                <TextField 
                                    multiline 
                                    rows={4} 
                                    placeholder="Briefly describe the reason for this transfer (optional)"
                                    fullWidth 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            bgcolor: '#ffffff',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '2px' }
                                        }
                                    }}
                                />
                            </motion.div>
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleTransfer}
                                    disabled={isSubmitting || !transferFrom || !transferTo}
                                    startIcon={isSubmitting ? null : <Send size={18} />}
                                    sx={{
                                        background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                        px: 6,
                                        py: 1.75,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        borderRadius: '14px',
                                        textTransform: 'none',
                                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                                        '&:hover': {
                                            background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
                                            boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.4)',
                                            transform: 'translateY(-2px)'
                                        },
                                        '&:active': {
                                            transform: 'translateY(0)'
                                        },
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&.Mui-disabled': {
                                            background: '#e2e8f0',
                                            color: '#94a3b8'
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Processing...' : 'Transfer All Tasks'}
                                </Button>
                                {!transferFrom || !transferTo ? (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Complete the required fields to enable transfer
                                    </Typography>
                                ) : (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                        You are about to transfer all active tasks to the selected recipient
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Footer Info */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        This action will move all tasks, including history and attachments. <ChevronRight size={14} />
                    </Typography>
                </Box>
            </motion.div>
        </Box>
    );
};

export default TransferAllTask;






