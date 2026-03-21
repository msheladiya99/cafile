import React, { useState } from 'react';
import { Box, Typography, Grid, Card, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert, Button, Stack, CardContent } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle as CheckCircleIcon,
    Stars as StarsIcon
} from '@mui/icons-material';
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

const ProductCard = ({ plan, onEdit }: { plan: Plan, onEdit: (p: Plan) => void }) => {
    const isProfessional = plan.name === 'professional';
    const bgConfig = isProfessional 
        ? 'linear-gradient(135deg, #e0e8ff 0%, #d4ddf6 100%)' 
        : '#f3f4f6';
    const btnClass = '#111';
    const textColor = '#000';

    // Extracting price parts (e.g., "₹999/mo")
    let priceSymbol = '';
    let priceValue = plan.price;
    let pricePeriod = '';

    if (plan.price.includes('₹')) {
        priceSymbol = '₹';
        priceValue = plan.price.replace('₹', '');
    }
    
    if (priceValue.includes('/')) {
        const parts = priceValue.split('/');
        priceValue = parts[0];
        pricePeriod = '/' + parts[1];
    }

    return (
        <Card sx={{ 
            height: '100%', 
            borderRadius: '32px', 
            border: '1px solid #e5e7eb',
            bgcolor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', 
            display: 'flex', 
            flexDirection: 'column',
            p: 1.5,
            position: 'relative',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
                transform: 'translateY(-10px)',
                boxShadow: '0 30px 60px -15px rgba(0,0,0,0.1)'
            }
        }}>
            {/* Top colored box */}
            <Box sx={{ 
                background: bgConfig, 
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
                    <Typography sx={{ fontWeight: 900, color: textColor, fontSize: '1.8rem' }}>{priceSymbol}</Typography>
                    <Typography sx={{ color: textColor, fontWeight: 900, fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-2px' }}>
                        {priceValue}
                    </Typography>
                    <Typography sx={{ color: '#4b5563', fontWeight: 700, fontSize: '1.2rem' }}>
                        {pricePeriod}
                    </Typography>
                </Box>

                <Typography sx={{ color: '#4b5563', fontWeight: 600, fontSize: '0.9rem', mb: 3 }}>
                    Perfect for {plan.displayName} level requirements.
                </Typography>

                <Button 
                    fullWidth
                    variant="contained"
                    onClick={() => onEdit(plan)}
                    sx={{ 
                        bgcolor: btnClass,
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
                    Edit Configuration
                </Button>
            </Box>

            {/* Bottom features list */}
            <Box sx={{ p: 3, pt: 1, flexGrow: 1 }}>
                <Stack spacing={2.5}>
                    {[
                        `${plan.staffLimit >= 99999 ? 'Unlimited' : plan.staffLimit} Staff Limit`,
                        `${plan.clientLimit >= 99999 ? 'Unlimited' : plan.clientLimit} Client Limit`,
                        `${plan.storageGB} GB Cloud Storage`,
                        `${plan.tasks} Tasks Configuration`
                    ].map((feat, index) => (
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" key={index}>
                            <CheckCircleIcon sx={{ fontSize: 18, color: '#9ca3af', mt: 0.3 }} />
                            <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.95rem' }}>
                                {feat}
                            </Typography>
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

    return (
        <Box>
            <Box sx={{ textAlign: 'center', mb: 10 }}>
                <Box sx={{ 
                    display: 'inline-flex', 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 2, 
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                    color: 'white', 
                    px: 3, 
                    py: 1, 
                    borderRadius: '12px', 
                    mb: 4,
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <StarsIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                            Super Admin Control
                        </Typography>
                    </Stack>
                </Box>
                
                <Typography variant="h2" sx={{ 
                    fontWeight: 1000, 
                    color: '#0f172a', 
                    mb: 2, 
                    letterSpacing: -1.5, 
                    fontSize: { xs: '2.3rem', md: '3.5rem' },
                    lineHeight: 1.1
                }}>
                    Manage Platform Subscriptions
                </Typography>
                
                <Typography variant="h6" sx={{ color: '#64748b', maxWidth: '700px', mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                    Configure pricing tiers and account limits for all CA firms on the platform.
                </Typography>
            </Box>

            <Box sx={{ 
                overflowX: 'auto', 
                pb: 4, 
                px: 2,
                mx: -2,
                '&::-webkit-scrollbar': { display: 'none' }, // clean look
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
                <Grid container spacing={3} wrap="nowrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
                    {plans?.map((plan) => (
                        <Grid key={plan._id} sx={{ flex: '0 0 auto', width: { xs: '300px', sm: '320px', md: 'calc(25% - 24px)' } }}>
                            <ProductCard plan={plan} onEdit={handleEditClick} />
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Editing Dialog */}
            <Dialog 
                open={!!editingPlan} 
                onClose={() => setEditingPlan(null)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '32px', p: 2 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', textAlign: 'center' }}>
                    Modify {editingPlan?.displayName} Tier
                </DialogTitle>
                <DialogContent>
                     <Grid container spacing={3} sx={{ mt: 1 }}>
                         <Grid xs={12}>
                              <TextField fullWidth label="Display Name" value={formData.displayName || ''} onChange={e => setFormData({ ...formData, displayName: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid xs={12}>
                              <TextField fullWidth label="Price Display (e.g. ₹999/mo)" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid xs={12} sm={6}>
                              <TextField fullWidth type="number" label="Staff Limit" value={formData.staffLimit || ''} onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid xs={12} sm={6}>
                              <TextField fullWidth type="number" label="Client Limit" value={formData.clientLimit || ''} onChange={e => setFormData({ ...formData, clientLimit: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid xs={12} sm={6}>
                              <TextField fullWidth type="number" label="Storage Limit (GB)" value={formData.storageGB || ''} onChange={e => setFormData({ ...formData, storageGB: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                         <Grid xs={12} sm={6}>
                              <TextField fullWidth label="Task Limit" value={formData.tasks || ''} onChange={e => setFormData({ ...formData, tasks: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />
                         </Grid>
                     </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 4, justifyContent: 'center' }}>
                    <Button onClick={() => setEditingPlan(null)} sx={{ color: '#94a3b8', fontWeight: 800 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSave} 
                        disabled={updatePlanMutation.isPending} 
                        sx={{ 
                            bgcolor: '#4f46e5', 
                            color: '#fff', 
                            fontWeight: 900, 
                            borderRadius: '16px', 
                            px: 6,
                            py: 1.5,
                            '&:hover': { bgcolor: '#4338ca' }
                        }}
                    >
                        {updatePlanMutation.isPending ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Subscriptions;
