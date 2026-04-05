import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stars as StarsIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import api from '../../services/api';

interface Plan {
    _id: string;
    name: 'Free' | 'Basic' | 'Standard' | 'Pro' | 'Enterprise' | 'Custom';
    yearlyPrice: number;
    limits: {
        clients: number;
        staff: number;
        storageGB: number;
    };
    isActive: boolean;
}

const ProductCard = ({ plan, onEdit }: { plan: Plan, onEdit: (p: Plan) => void }) => {
    const isPro = plan.name === 'Pro';
    const bgConfig = isPro ? 'linear-gradient(135deg, #e0e8ff 0%, #d4ddf6 100%)' : '#f3f4f6';
    const textColor = '#000';

    return (
        <Card sx={{ 
            height: '100%', borderRadius: '32px', border: '1px solid #e5e7eb', bgcolor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', p: 1.5,
            transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-10px)' }
        }}>
            <Box sx={{ background: bgConfig, borderRadius: '24px', p: 3, pb: 4, mb: 1 }}>
                <Box sx={{ display: 'inline-block', bgcolor: '#fff', px: 2, py: 0.5, borderRadius: '12px', mb: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>
                        {plan.name}
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, gap: 0.5 }}>
                    <Typography sx={{ fontWeight: 900, color: textColor, fontSize: '1.8rem' }}>₹</Typography>
                    <Typography sx={{ color: textColor, fontWeight: 900, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-2px' }}>
                        {plan.yearlyPrice.toLocaleString()}
                    </Typography>
                    <Typography sx={{ color: '#4b5563', fontWeight: 700, fontSize: '1.2rem' }}>
                        /yr
                    </Typography>
                </Box>

                <Button 
                    fullWidth variant="contained" onClick={() => onEdit(plan)}
                    sx={{ bgcolor: '#111', color: '#fff', py: 1.8, borderRadius: '20px', fontWeight: 800, '&:hover': { bgcolor: '#000' } }}
                >
                    Edit Configuration
                </Button>
            </Box>

            <Box sx={{ p: 3, pt: 1, flexGrow: 1 }}>
                <Stack spacing={2.5}>
                    {[
                        `${plan.limits.staff >= 99999 ? 'Unlimited' : plan.limits.staff} Staff Limit`,
                        `${plan.limits.clients >= 99999 ? 'Unlimited' : plan.limits.clients} Client Limit`,
                        `${plan.limits.storageGB} GB Cloud Storage`
                    ].map((feat, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" key={index}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#9ca3af', mt: 0.3 }} />
                            <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>{feat}</Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>
        </Card>
    );
};

const Subscriptions: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<Partial<Plan & { staff: number; clients: number; storageGB: number }>>({});

    const { data: plans, isLoading, error } = useQuery<Plan[]>({
        queryKey: ['superadmin_plans'],
        queryFn: async () => {
             const res = await api.get('/super-admin/plans');
             return res.data;
        }
    });

    const updatePlanMutation = useMutation({
        mutationFn: async (updatedPlan: Partial<Plan>) => {
             return api.put(`/super-admin/plans/${updatedPlan._id}`, updatedPlan);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['superadmin_plans'] });
             setEditingPlan(null);
        }
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
                    storageGB: Number(formData.storageGB) 
                }
            });
        }
    };

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 5 }}><Alert severity="error">Failed to load plans</Alert></Box>;

    return (
        <Box>
            <Box sx={{ textAlign: 'center', mb: 10 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', px: 3, py: 1, borderRadius: '12px', mb: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StarsIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                            Super Admin Control
                        </Typography>
                    </Stack>
                </Box>
                <Typography variant="h2" sx={{ fontWeight: 1000, color: '#0f172a', mb: 2, letterSpacing: -1.5, fontSize: { xs: '2.3rem', md: '3.5rem' }, lineHeight: 1.1 }}>
                    Manage Platform Subscriptions
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b', maxWidth: '700px', mx: 'auto', fontWeight: 500 }}>
                    Configure pricing tiers and account limits for all CA firms on the platform.
                </Typography>
            </Box>

            <Box sx={{ overflowX: 'auto', pb: 4, px: 2, mx: -2 }}>
                <Grid container spacing={3} wrap="nowrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
                    {plans?.map((plan) => (
                        <Grid key={plan._id} sx={{ flex: '0 0 auto', width: { xs: '300px', sm: '320px', md: 'calc(25% - 24px)' } }}>
                            <ProductCard plan={plan} onEdit={handleEditClick} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Dialog open={!!editingPlan} onClose={() => setEditingPlan(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '32px', p: 2 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', textAlign: 'center' }}>Modify {editingPlan?.name} Tier</DialogTitle>
                <DialogContent>
                     <Grid container spacing={3} sx={{ mt: 1 }}>
                         <Grid size={{ xs: 12 }}>
                              <TextField fullWidth type="number" label="Yearly Price (₹)" value={formData.yearlyPrice || 0} onChange={e => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth type="number" label="Staff Limit" value={formData.staff || 0} onChange={e => setFormData({ ...formData, staff: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth type="number" label="Client Limit" value={formData.clients || 0} onChange={e => setFormData({ ...formData, clients: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid size={{ xs: 12 }}>
                              <TextField fullWidth type="number" label="Storage Limit (GB)" value={formData.storageGB || 0} onChange={e => setFormData({ ...formData, storageGB: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                     </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 4, justifyContent: 'center' }}>
                    <Button onClick={() => setEditingPlan(null)} sx={{ color: '#94a3b8', fontWeight: 800 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={updatePlanMutation.isPending} sx={{ bgcolor: '#4f46e5', color: '#fff', fontWeight: 900, borderRadius: '16px', px: 6, py: 1.5 }}>
                        {updatePlanMutation.isPending ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
export default Subscriptions;
