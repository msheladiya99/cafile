import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

const mockLogs = [
    { id: 1, user: 'admin@demo.com', firm: 'Demo Firm (demo)', ip: '192.168.1.1', status: 'Success', date: new Date().toISOString() },
    { id: 2, user: 'superadmin', firm: 'PORTAL', ip: '10.0.0.5', status: 'Success', date: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, user: 'unknown@fake.com', firm: 'ABC (abc)', ip: '8.8.8.8', status: 'Failed', date: new Date(Date.now() - 7200000).toISOString() },
    { id: 4, user: 'staff@patel.com', firm: 'Patel & Co (patel)', ip: '192.168.1.4', status: 'Success', date: new Date(Date.now() - 86400000).toISOString() },
];

const Security: React.FC = () => {
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
                            {mockLogs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{log.user}</TableCell>
                                    <TableCell>{log.firm}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{log.ip}</TableCell>
                                    <TableCell>
                                        <Chip label={log.status} color={log.status === 'Success' ? 'success' : 'error'} size="small" sx={{ fontWeight: 700 }} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Failed Login Attempts</Typography>
                <Typography color="text.secondary">
                    You have 1 recent failed attempt. System will automatically temporarily block IPs after 5 consecutive failures.
                </Typography>
            </Paper>
        </Box>
    );
};

export default Security;
