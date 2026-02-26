import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Select,
    MenuItem,
} from '@mui/material';
import {
    FormatListBulleted as FormatListBulletedIcon,
} from '@mui/icons-material';

interface FilterRowProps {
    label: string;
    children: React.ReactNode;
}

const FilterRow = ({ label, children }: FilterRowProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ width: { xs: '100%', sm: '150px' }, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
            {label}
        </Typography>
        <Box sx={{ flex: 1, width: '100%' }}>
            {children}
        </Box>
    </Box>
);

export const CancelClientTask: React.FC = () => {
    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="600">Cancel Client Task</Typography>
                </Box>
            </Paper>

            {/* Filters Section */}
            <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0, md: 4 } }}>
                    {/* Left Column */}
                    <Box sx={{ flex: 1 }}>
                        <FilterRow label="Group Name">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Group...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Task">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Task...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Year">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose Year...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Reporting Manager">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose Employee...</MenuItem>
                            </Select>
                        </FilterRow>
                    </Box>

                    {/* Right Column */}
                    <Box sx={{ flex: 1 }}>
                        <FilterRow label="Client Name">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Choose a Client...</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Frequency">
                            <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: 'text.secondary' }}>
                                <MenuItem value="" disabled>Select an Option</MenuItem>
                            </Select>
                        </FilterRow>
                        <FilterRow label="Approved/Not">
                            <Select fullWidth size="small" defaultValue="all" sx={{ borderRadius: 1.5 }}>
                                <MenuItem value="all">Select ALL</MenuItem>
                            </Select>
                        </FilterRow>
                    </Box>
                </Box>
            </Paper>

            {/* List Section */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormatListBulletedIcon fontSize="small" />
                        <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.25rem' }}>List</Typography>
                    </Box>
                </Box>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        No Record Found
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};
