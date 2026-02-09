import React from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    loading?: boolean;
    height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    children,
    loading = false,
    height = 300,
}) => {
    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                height: '100%',
                width: '100%',
            }}
        >
            <Typography variant="h6" fontWeight="700" gutterBottom>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                    {subtitle}
                </Typography>
            )}
            <Box
                sx={{
                    height,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {loading ? (
                    <CircularProgress />
                ) : (
                    children
                )}
            </Box>
        </Paper>
    );
};
