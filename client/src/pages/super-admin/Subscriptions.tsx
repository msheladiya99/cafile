import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Button, Stack } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CheckIcon from '@mui/icons-material/Check';
import api from '../../services/api';

interface Plan {
    _id: string;
    name: 'trial' | 'basic' | 'professional' | 'enterprise';
    displayName: string;
    price: string;
    staffLimit: number;
    clientLimit: number;
    storageGB: number;
    tasks: string;
    isActive: boolean;
}

const Subscriptions: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<Partial<Plan>>({});

    const { data: plans, isLoading, error } = useQuery<Plan[]>({
        queryKey: ['plans'],
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
             queryClient.invalidateQueries({ queryKey: ['plans'] });
             setEditingPlan(null);
        }
    });

    const handleEditClick = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData(plan);
    };

    const handleSave = () => {
        if (editingPlan) {
            updatePlanMutation.mutate(formData);
        }
    };

    if (isLoading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 5 }}><Alert severity="error">Failed to load plans</Alert></Box>;

    const getPlanConfig = (name: string) => {
        if (name === 'professional' || name === 'basic') { // Middle vibe
            return {
                bg: 'linear-gradient(135deg, #e0e8ff 0%, #d4ddf6 100%)',
                btnClass: '#111',
                textColor: '#000',
            };
        }
        return {
            bg: '#f3f4f6',
            btnClass: '#111',
            textColor: '#000',
        };
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, mb: 10, bgcolor: '#fafafa', p: { xs: 2, md: 5 }, borderRadius: '40px' }}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
                 <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, color: '#000', letterSpacing: '-1.5px', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                      Subscription Management
                 </Typography>
                 <Typography variant="subtitle1" sx={{ color: '#4b5563', fontWeight: 600, fontSize: '1.1rem' }}>
                      Configure firm pricing tiers and access limits
                 </Typography>
            </Box>

            <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
                {plans?.map((plan) => {
                    const config = getPlanConfig(plan.name);
                    // Extracting the number and the period from a string like "₹999/mo" or "Free"
                    let priceMain = plan.price;
                    let priceSub = '';
                    if (plan.price.includes('/')) {
                        const parts = plan.price.split('/');
                        priceMain = parts[0];
                        priceSub = '/' + parts[1];
                    }
                    
                    return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan._id}>
                            <Card sx={{ 
                                height: '100%', 
                                borderRadius: '32px', 
                                border: '1px solid #e5e7eb',
                                bgcolor: '#ffffff',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', 
                                display: 'flex', 
                                flexDirection: 'column',
                                p: 1.5,
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-10px)',
                                    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.1)'
                                }
                            }}>
                                {/* Top colored box */}
                                <Box sx={{ 
                                    background: config.bg, 
                                    borderRadius: '24px', 
                                    p: 3, 
                                    pb: 4,
                                    mb: 1
                                }}>
                                    <Box sx={{ display: 'inline-block', bgcolor: '#fff', px: 2, py: 0.5, borderRadius: '12px', mb: 3 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#000', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                            {plan.displayName}
                                        </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, gap: 0.5 }}>
                                        <Typography sx={{ color: config.textColor, fontWeight: 900, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-2px' }}>
                                            {priceMain}
                                        </Typography>
                                        <Typography sx={{ color: '#4b5563', fontWeight: 700, fontSize: '1.2rem' }}>
                                            {priceSub}
                                        </Typography>
                                    </Box>

                                    <Typography sx={{ color: '#4b5563', fontWeight: 600, fontSize: '0.9rem', mb: 3 }}>
                                        Perfect for {plan.displayName} scale
                                    </Typography>

                                    <Button 
                                        fullWidth
                                        variant="contained"
                                        onClick={() => handleEditClick(plan)}
                                        sx={{ 
                                            bgcolor: config.btnClass,
                                            color: '#fff',
                                            py: 1.8,
                                            borderRadius: '20px',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                            '&:hover': {
                                                bgcolor: '#000',
                                                boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                                            }
                                        }}
                                    >
                                        Edit Details
                                    </Button>
                                </Box>

                                {/* Bottom features list */}
                                <Box sx={{ p: 3, pt: 1, flexGrow: 1 }}>
                                    <Stack spacing={2.5}>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <CheckIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                                            <Typography sx={{ color: '#111', fontWeight: 600, fontSize: '0.95rem' }}>
                                                {plan.staffLimit >= 99999 ? 'Unlimited' : plan.staffLimit} Staff Limit
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <CheckIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                                            <Typography sx={{ color: '#111', fontWeight: 600, fontSize: '0.95rem' }}>
                                                {plan.clientLimit >= 99999 ? 'Unlimited' : plan.clientLimit} Client Limit
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <CheckIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                                            <Typography sx={{ color: '#111', fontWeight: 600, fontSize: '0.95rem' }}>
                                                {plan.storageGB >= 1024 ? 'Unlimited' : `${plan.storageGB} GB`} Storage
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <CheckIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                                            <Typography sx={{ color: '#111', fontWeight: 600, fontSize: '0.95rem' }}>
                                                {plan.tasks} Tasks
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Editing Dialog */}
            <Dialog open={!!editingPlan} onClose={() => setEditingPlan(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Edit Plan: {editingPlan?.displayName}</DialogTitle>
                <DialogContent dividers>
                     <Grid container spacing={3} sx={{ mt: 1 }}>
                         <Grid size={{ xs: 12 }}>
                              <TextField fullWidth label="Display Name" value={formData.displayName || ''} onChange={e => setFormData({ ...formData, displayName: e.target.value })} />
                         </Grid>
                         <Grid size={{ xs: 12 }}>
                              <TextField fullWidth label="Price Display (e.g. ₹999/mo)" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth type="number" label="Staff Limit (use 99999 for unlimited)" value={formData.staffLimit || ''} onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth type="number" label="Client Limit (use 99999 for unlimited)" value={formData.clientLimit || ''} onChange={e => setFormData({ ...formData, clientLimit: Number(e.target.value) })} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth type="number" label="Storage Limit (GB)" value={formData.storageGB || ''} onChange={e => setFormData({ ...formData, storageGB: Number(e.target.value) })} />
                         </Grid>
                         <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField fullWidth label="Task Limit" value={formData.tasks || ''} onChange={e => setFormData({ ...formData, tasks: e.target.value })} />
                         </Grid>
                     </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditingPlan(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={updatePlanMutation.isPending} sx={{ fontWeight: 800 }}>
                        {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Subscriptions;
