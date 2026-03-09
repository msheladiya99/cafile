import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export interface SectionProps {
    title: string;
    icon: React.ReactElement<{ sx?: Record<string, unknown> }>;
    children?: React.ReactNode;
}

export const Section = ({ title, icon, children }: SectionProps) => (
    <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {React.cloneElement(icon, { sx: { width: 20, height: 20, color: 'text.secondary' } })}
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            {children}
        </Box>
    </Paper>
);

export interface FilterRowProps {
    label: string;
    required?: boolean;
    helperText?: string;
    children: React.ReactNode;
}

export const FilterRow = ({ label, required, helperText, children }: FilterRowProps) => {
    const childIsElement = React.isValidElement(children);
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                <Typography sx={{ width: { xs: '100%', sm: '160px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, pt: { xs: 0, sm: childIsElement && (children as React.ReactElement<{ multiline?: boolean }>).props.multiline ? 1 : 0 }, flexShrink: 0 }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <Box sx={{ flex: 1, width: '100%' }}>
                    {children}
                </Box>
            </Box>
            {helperText && (
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                    <Box sx={{ width: { xs: 0, sm: '160px' }, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block', fontSize: '0.75rem' }}>
                        <strong style={{ marginRight: '4px' }}>NOTE!</strong> {helperText}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
    <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
                <Typography variant="h5" fontWeight="600">{title}</Typography>
                {description && (
                    <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {actions}
                </Box>
            )}
        </Box>
    </Paper>
);

export const PageContainer = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
        {children}
    </Box>
);

export const ContentContainer = ({ children }: { children: React.ReactNode }) => (
    <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden', bgcolor: '#f8fafc', p: 3 }}>
        {children}
    </Paper>
);
