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
} from '@mui/material';
import {
    SwapHoriz as TransferIcon,
    Publish as TransferButtonIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../../services/adminService';
import type { User } from '../../../types';

export const TransferAllTask: React.FC = () => {
    const [transferFrom, setTransferFrom] = useState('');
    const [transferTo, setTransferTo] = useState('');
    const [description, setDescription] = useState('');

    const { data: staffUsers = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    const handleTransfer = () => {
        // Implementation for transferring all tasks
        console.log('Transferring all tasks from', transferFrom, 'to', transferTo);
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* Header */}
            <Paper elevation={0} sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <TransferIcon />
                    <Typography variant="h6" fontWeight="500">Transfer All Task</Typography>
                </Box>
                <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: 'rgba(0,0,0,0.3)' } }}>
                    List
                </Button>
            </Paper>

            {/* Transfer Form */}
            <Paper sx={{ p: 4, borderRadius: '0 0 8px 8px' }}>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Transfer From <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select 
                                size="small" 
                                fullWidth 
                                displayEmpty 
                                value={transferFrom} 
                                onChange={(e) => setTransferFrom(e.target.value)}
                            >
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box display="flex" alignItems="center">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem' }}>
                                Transfer To <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <Select 
                                size="small" 
                                fullWidth 
                                displayEmpty 
                                value={transferTo} 
                                onChange={(e) => setTransferTo(e.target.value)}
                            >
                                <MenuItem value=""><em>Choose Employee...</em></MenuItem>
                                {staffUsers.map((u: User) => (
                                    <MenuItem key={u._id} value={u._id}>{u.name || u.username}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box display="flex">
                            <Typography sx={{ width: 140, color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}>Description</Typography>
                            <TextField 
                                multiline 
                                rows={3} 
                                size="small" 
                                fullWidth 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }} display="flex" justifyContent="center" sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleTransfer}
                            startIcon={<TransferButtonIcon />}
                            sx={{
                                bgcolor: '#4fc3f7',
                                px: 4,
                                py: 1,
                                fontSize: '0.9rem',
                                '&:hover': { bgcolor: '#29b6f6' },
                                borderRadius: 1.5,
                                textTransform: 'none'
                            }}
                        >
                            Transfer
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default TransferAllTask;
