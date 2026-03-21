import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface SecurityLog {
    id: string;
    user: string;
    firm: string;
    ip: string;
    status: string;
    date: string;
    details: string;
}

const Security: React.FC = () => {
    const { data: logs, isLoading } = useQuery<SecurityLog[]>({
        queryKey: ['security-logs'],
        queryFn: async () => {
            const res = await api.get('/super-admin/security-logs');
            return res.data;
        },
        staleTime: 5000,
    });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    const failedCount = logs?.filter(l => l.status === 'Failed').length || 0;

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Platform Security Logs</Typography>

            <Paper sx={{ p: 4, borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Authentication Activity</Typography>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>User / Attempt</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Target Firm</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell>{new Date(log.date).toLocaleString('en-IN')}</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {log.user}
                                            {log.status === 'Failed' && (
                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 400 }}>
                                                    {log.details}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{log.firm}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={log.status} 
                                                color={log.status === 'Success' ? 'success' : 'error'} 
                                                size="small" 
                                                sx={{ fontWeight: 700 }} 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        No security logs found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Recent Failed Login Attempts</Typography>
                {failedCount > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#fff5f5' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>User/Identifier</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#c53030' }}>IP address</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs && logs.filter(l => l.status === 'Failed').slice(0, 10).map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{new Date(log.date).toLocaleString('en-IN')}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.user}</Typography>
                                            <Typography variant="caption" color="text.secondary">{log.details}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography color="text.secondary">
                        Great! No recent failed login attempts detected. System automatically blocks suspicious IPs after 5 failures.
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Security;
