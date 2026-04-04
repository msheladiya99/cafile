import React from 'react';
import { Box, Paper, Typography, InputBase, Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// ─── Section ──────────────────────────────────────────────────────────────────
export interface SectionProps {
    title: string;
    icon?: React.ReactElement<{ sx?: Record<string, unknown> }>;
    children?: React.ReactNode;
    actions?: React.ReactNode;
    noPad?: boolean;
}

export const Section = ({ title, icon, children, actions, noPad }: SectionProps) => (
    <Paper
        elevation={0}
        sx={{
            mb: 2.5,
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            bgcolor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
    >
        {/* Section header row */}
        <Box
            sx={{
                px: 2.5,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f3f4f6',
                bgcolor: '#fafafa'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {icon && React.cloneElement(icon, { sx: { width: 14, height: 14, color: '#64748b' } })}
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                    {title}
                </Typography>
            </Box>
            {actions && <Box>{actions}</Box>}
        </Box>
        <Box sx={noPad ? {} : { p: { xs: 2, md: 3 } }}>{children}</Box>
    </Paper>
);

// ─── FilterRow ─────────────────────────────────────────────────────────────────
export interface FilterRowProps {
    label: string;
    required?: boolean;
    helperText?: string;
    children: React.ReactNode;
    inputId?: string;
    labelId?: string;
}

export const FilterRow = ({ label, required, helperText, children, inputId, labelId }: FilterRowProps) => {
    const childIsElement = React.isValidElement(children);
    return (
        <Box sx={{ mb: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 0.5, sm: 0 },
                }}
            >
                <Typography
                    component="label"
                    htmlFor={inputId}
                    id={labelId}
                    sx={{
                        width: { xs: '100%', sm: '160px' },
                        color: '#475569',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        pt: {
                            xs: 0,
                            sm:
                                childIsElement &&
                                (children as React.ReactElement<{ multiline?: boolean }>).props.multiline
                                    ? 1
                                    : 0,
                        },
                        flexShrink: 0,
                        cursor: inputId ? 'pointer' : 'default',
                    }}
                >
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </Typography>
                <Box sx={{ flex: 1, width: '100%' }}>{children}</Box>
            </Box>
            {helperText && (
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                    <Box sx={{ width: { xs: 0, sm: '160px' }, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />
                    <Typography
                        variant="caption"
                        sx={{
                            bgcolor: '#fee2e2',
                            color: '#ef4444',
                            px: 1, py: 0.25,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}
                    >
                        {helperText}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// ─── PageHeader ────────────────────────────────────────────────────────────────
export interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}

export const PageHeader = ({
    title,
    description,
    actions,
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
}: PageHeaderProps) => (
    <Box sx={{ mb: 3 }}>
        {/* Title row */}
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
                mb: (onSearchChange) ? 2 : 0,
            }}
        >
            <Box>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', md: '1.875rem' },
                        color: '#0f172a',
                        letterSpacing: '-0.025em',
                    }}
                >
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontSize: '0.875rem' }}>
                        {description}
                    </Typography>
                )}
            </Box>

            {actions && (
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {actions}
                </Box>
            )}
        </Box>

        {/* Search row */}
        {onSearchChange && (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        px: 1.5,
                        py: 0.85,
                        flex: { xs: 1, sm: '0 1 400px' },
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        '&:focus-within': { borderColor: '#94a3b8', boxShadow: '0 0 0 4px rgba(226, 232, 240, 0.4)' },
                    }}
                >
                    <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', flexShrink: 0 }} />
                    <InputBase
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        sx={{ flex: 1, fontSize: '0.875rem', color: '#1e293b' }}
                    />
                </Box>
            </Box>
        )}
    </Box>
);

// ─── PageContainer ─────────────────────────────────────────────────────────────
export const PageContainer = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        {children}
    </Box>
);

// ─── ContentContainer ──────────────────────────────────────────────────────────
export const ContentContainer = ({ children }: { children: React.ReactNode }) => (
    <Box>{children}</Box>
);

// ─── CommonButton ─────────────────────────────────────────────────────────────
export interface CommonButtonProps extends ButtonProps {
    loading?: boolean;
    target?: string;
    rel?: string;
    component?: React.ElementType;
}

export const CommonButton = ({ variant = 'contained', size = 'medium', loading, children, sx, ...props }: CommonButtonProps) => (
    <Button
        variant={variant}
        size={size}
        disabled={loading || props.disabled}
        sx={{
            // Dynamic bgcolor based on variant
            bgcolor: variant === 'contained' ? '#6366f1' : 'transparent',
            color: variant === 'contained' ? 'white' : (variant === 'outlined' ? '#6366f1' : 'inherit'),
            borderColor: variant === 'outlined' ? '#6366f1' : 'transparent',
            textTransform: 'none',
            borderRadius: '8px', 
            // Consistent Sizing
            px: size === 'small' ? 2 : (size === 'large' ? 4 : 3),
            py: size === 'small' ? 0.6 : (size === 'large' ? 1.2 : 0.8),
            fontWeight: 700,
            fontSize: size === 'small' ? '0.8125rem' : '0.875rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: 'fit-content',
            '&:hover': {
                bgcolor: variant === 'contained' ? '#4f46e5' : (variant === 'outlined' ? 'rgba(99, 102, 241, 0.04)' : 'rgba(0, 0, 0, 0.04)'),
                borderColor: variant === 'outlined' ? '#4338ca' : 'transparent',
                boxShadow: variant === 'contained' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                transform: 'translateY(-1px)',
            },
            '&:active': {
                transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
                bgcolor: variant === 'contained' ? '#e2e8f0' : 'transparent',
                color: '#94a3b8',
                borderColor: variant === 'outlined' ? '#e2e8f0' : 'transparent',
            },
            ...sx
        }}
        {...props}
    >
        {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
        {children}
    </Button>
);
