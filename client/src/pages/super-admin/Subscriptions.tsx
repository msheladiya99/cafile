import React, { useState } from 'react';
import {
    Box, Typography, Grid, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, CircularProgress, Alert, Button, Stack, Chip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle as CheckIcon, Edit as EditIcon, Tune as TuneIcon } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Plan {
    _id: string;
    name: 'Free' | 'Basic' | 'Standard' | 'Pro' | 'Enterprise' | 'Custom';
    yearlyPrice: number;
    limits: { clients: number; staff: number; storageGB: number };
    isActive: boolean;
}

// ── Color accent per plan position ──────────────────────────────────────────
const PLAN_ACCENTS = [
    { bg: 'linear-gradient(135deg, #e0e8ff 0%, #c7d2fe 100%)', text: '#4338ca' },
    { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', text: '#065f46' },
    { bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',  text: '#ffffff', dark: true },
    { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', text: '#92400e' },
];

const PlanCard = ({ plan, index, onEdit }: { plan: Plan; index: number; onEdit: (p: Plan) => void }) => {
    const accent = PLAN_ACCENTS[index % PLAN_ACCENTS.length];
    const isDark = !!accent.dark;

    const staffLabel  = plan.limits.staff  >= 99999 ? 'Unlimited' : plan.limits.staff;
    const clientLabel = plan.limits.clients >= 99999 ? 'Unlimited' : plan.limits.clients;

    return (
        <Box sx={{
            bgcolor: '#fff',
            borderRadius: '24px',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.22s ease',
            '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 20px 48px rgba(0,0,0,0.09)',
                border: '1px solid #e2e8f0',
            },
        }}>
            {/* Gradient header */}
            <Box sx={{ background: accent.bg, p: 3, pb: 3.5 }}>
                {/* Plan name pill */}
                <Box sx={{
                    display: 'inline-block',
                    bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)',
                    px: 2, py: 0.4,
                    borderRadius: '20px',
                    mb: 2.5,
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.06)',
                }}>
                    <Typography sx={{
                        fontWeight: 800, fontSize: '0.7rem',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: isDark ? '#fff' : accent.text,
                    }}>
                        {plan.name}
                    </Typography>
                </Box>

                {/* Price */}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 2.5 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: isDark ? '#fff' : '#111', lineHeight: 1 }}>₹</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: '3rem', color: isDark ? '#fff' : '#111', letterSpacing: '-2px', lineHeight: 1 }}>
                        {plan.yearlyPrice.toLocaleString('en-IN')}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }}>
                        /yr
                    </Typography>
                </Box>

                {/* Edit button */}
                <Box
                    onClick={() => onEdit(plan)}
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        bgcolor: isDark ? '#fff' : '#111',
                        color: isDark ? '#111' : '#fff',
                        py: 1.25, borderRadius: '14px',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                            bgcolor: isDark ? '#f1f5f9' : '#1e293b',
                            transform: 'scale(1.02)',
                        },
                    }}
                >
                    <EditIcon sx={{ fontSize: 16 }} />
                    Edit Configuration
                </Box>
            </Box>

            {/* Features list */}
            <Box sx={{ p: 3, flex: 1 }}>
                <Stack spacing={2}>
                    {[
                        `${staffLabel} Staff Limit`,
                        `${clientLabel} Client Limit`,
                        `${plan.limits.storageGB} GB Cloud Storage`,
                    ].map((feat) => (
                        <Box key={feat} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <CheckIcon sx={{ fontSize: 17, color: '#94a3b8', flexShrink: 0 }} />
                            <Typography sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.875rem' }}>
                                {feat}
                            </Typography>
                        </Box>
                    ))}
                </Stack>

                {/* Status badge */}
                <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid #f8fafc' }}>
                    <Chip
                        label={plan.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                            bgcolor: plan.isActive ? '#ecfdf5' : '#fff1f2',
                            color: plan.isActive ? '#10b981' : '#f43f5e',
                            fontWeight: 700, fontSize: '0.7rem',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const Subscriptions: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<Partial<Plan & { staff: number; clients: number; storageGB: number }>>({});

    const { data: plans, isLoading, error } = useQuery<Plan[]>({
        queryKey: ['superadmin_plans'],
        queryFn: async () => {
            const res = await api.get('/super-admin/plans');
            return res.data;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    });

    const updatePlanMutation = useMutation({
        mutationFn: async (updatedPlan: Partial<Plan>) => {
            return api.put(`/super-admin/plans/${updatedPlan._id}`, updatedPlan);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['superadmin_plans'] });
            setEditingPlan(null);
            toast.success('Plan configuration saved!');
        },
        onError: () => toast.error('Failed to save plan'),
    });

    const handleEditClick = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({ ...plan, ...plan.limits });
    };

    const handleSave = () => {
        if (editingPlan) {
            updatePlanMutation.mutate({
                _id: editingPlan._id,
                yearlyPrice: formData.yearlyPrice,
                limits: {
                    clients: Number(formData.clients),
                    staff: Number(formData.staff),
                    storageGB: Number(formData.storageGB),
                },
            });
        }
    };

    return (
        <Box className="sa-page">
            {/* ── Header ── */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TuneIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                        Platform Subscriptions
                    </Typography>
                </Box>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, ml: '47px' }}>
                    Configure pricing tiers and account limits for all CA firms on the platform.
                </Typography>
            </Box>

            {/* ── Plan Cards ── */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ borderRadius: '12px' }}>Failed to load subscription plans</Alert>
            ) : (
                <Grid container spacing={2.5}>
                    {plans?.map((plan, i) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={plan._id}>
                            <PlanCard plan={plan} index={i} onEdit={handleEditClick} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ── Summary strip ── */}
            {!isLoading && !error && plans && (
                <Box sx={{
                    mt: 3, bgcolor: '#fff', borderRadius: '16px',
                    border: '1px solid #f1f5f9', p: 2.5,
                    display: 'flex', gap: 4, flexWrap: 'wrap',
                }}>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Plans</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem' }}>{plans.length}</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Plans</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#10b981', fontSize: '1.25rem' }}>{plans.filter(p => p.isActive).length}</Typography>
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Highest Plan</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.25rem' }}>
                            ₹{Math.max(...plans.map(p => p.yearlyPrice)).toLocaleString('en-IN')}/yr
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ── Edit Dialog ── */}
            <Dialog
                open={!!editingPlan}
                onClose={() => setEditingPlan(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px', p: 0.5 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', pb: 1 }}>
                    Edit — {editingPlan?.name} Plan
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth type="number" label="Yearly Price (₹)"
                                value={formData.yearlyPrice || 0}
                                onChange={e => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth type="number" label="Staff Limit"
                                value={formData.staff || 0}
                                onChange={e => setFormData({ ...formData, staff: Number(e.target.value) })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                helperText="Use 99999 for unlimited"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth type="number" label="Client Limit"
                                value={formData.clients || 0}
                                onChange={e => setFormData({ ...formData, clients: Number(e.target.value) })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                                helperText="Use 99999 for unlimited"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth type="number" label="Storage Limit (GB)"
                                value={formData.storageGB || 0}
                                onChange={e => setFormData({ ...formData, storageGB: Number(e.target.value) })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                    <Button
                        onClick={() => setEditingPlan(null)}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={updatePlanMutation.isPending}
                        sx={{
                            bgcolor: '#1e293b', color: '#fff', fontWeight: 800,
                            borderRadius: '12px', px: 4, textTransform: 'none',
                            '&:hover': { bgcolor: '#0f172a' }, boxShadow: 'none',
                        }}
                    >
                        {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Subscriptions;
