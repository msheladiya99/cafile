import React from 'react';
import { Box, Typography, Skeleton, Avatar, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
    LineChart, Line, Tooltip as ReTooltip, ResponsiveContainer, XAxis,
    PieChart, Pie, Cell,
} from 'recharts';
import {
    Business as BusinessIcon,
    People as PeopleIcon,
    AccountBalance as RevenueIcon,
    MonitorHeart as HealthIcon,
    TrendingUp as TrendIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';

interface DashboardFirm {
    _id: string;
    firmName: string;
    subdomain: string;
    plan: string;
    status: string;
    createdAt: string;
    email?: string;
}

interface DashboardData {
    widgets: Record<string, number | string>;
    charts: {
        firmRegistrations?: { month: string; count: number; revenue?: number }[];
        taskActivity?: { name: string; value: number }[];
        plansDistribution?: { name: string; value: number }[];
    };
    recentFirms: DashboardFirm[];
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, accent, loading, onClick }: {
    label: string; value?: number | string; sub?: string; icon: React.ReactNode;
    color: string; accent: string; loading?: boolean; onClick?: () => void;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                bgcolor: '#fff',
                borderRadius: '20px',
                p: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                border: '1px solid #f1f5f9',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.18s ease',
                '&:hover': onClick ? { boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transform: 'translateY(-2px)' } : {},
            }}
        >
            <Box sx={{
                width: 44, height: 44, borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: color, flexShrink: 0,
                '& svg': { fontSize: 22, color: accent },
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', mb: 0.25 }}>
                    {label}
                </Typography>
                {loading ? (
                    <Skeleton width={60} height={28} />
                ) : (
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                        {value ?? '—'}
                    </Typography>
                )}
                {sub && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.25, fontWeight: 500 }}>
                        {sub}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

// ── Plan Badge ────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
    trial:        { bg: '#f1f5f9', text: '#64748b' },
    basic:        { bg: '#eff6ff', text: '#2563eb' },
    professional: { bg: '#f5f3ff', text: '#7c3aed' },
    enterprise:   { bg: '#fef3c7', text: '#d97706' },
};
const PIE_COLORS = ['#6366f1', '#fb7185', '#fbbf24', '#2dd4bf'];

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ['super-admin-dashboard'],
        queryFn: async () => {
            const res = await api.get('/super-admin/dashboard');
            return res.data;
        },
        staleTime: 60_000,       // 1 min cache
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
    });

    const { widgets = {}, charts = {}, recentFirms = [] } = data || {};

    const stats = [
        {
            label: 'Registered Firms',
            value: widgets.totalFirms,
            sub: `${widgets.activeFirms || 0} active`,
            icon: <BusinessIcon />,
            color: '#eef2ff',
            accent: '#6366f1',
            path: '/super-admin/firms',
        },
        {
            label: 'Platform Clients',
            value: widgets.totalClients,
            sub: 'across all firms',
            icon: <PeopleIcon />,
            color: '#ecfdf5',
            accent: '#10b981',
            path: '/super-admin/firms',
        },
        {
            label: 'System Revenue',
            value: `₹${(widgets.totalRevenue as number || 0).toLocaleString('en-IN')}`,
            sub: 'estimated monthly',
            icon: <RevenueIcon />,
            color: '#fffbeb',
            accent: '#f59e0b',
            path: '/super-admin/subscriptions',
        },
        {
            label: 'Platform Health',
            value: 'Healthy',
            sub: `${widgets.totalTasks || 0} tasks tracked`,
            icon: <HealthIcon />,
            color: '#fdf2f8',
            accent: '#ec4899',
            path: '/super-admin/system-health',
        },
    ];

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <Box className="sa-page" sx={{ maxWidth: 1200 }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5, lineHeight: 1.2 }}>
                        {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 500, mt: 0.5, fontSize: '0.9rem' }}>
                        Here's what's happening on your platform today.
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: '#fff', border: '1px solid #f1f5f9',
                    borderRadius: '12px', px: 1.5, py: 0.75,
                }}>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10b981', animation: 'pulse 2s infinite' }} />
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: 0.5 }}>
                        All Systems Operational
                    </Typography>
                </Box>
            </Box>

            {/* ── Stat Cards ── */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 3,
            }}>
                {stats.map(s => (
                    <StatCard
                        key={s.label}
                        label={s.label}
                        value={s.value}
                        sub={s.sub}
                        icon={s.icon}
                        color={s.color}
                        accent={s.accent}
                        loading={isLoading}
                        onClick={() => navigate(s.path)}
                    />
                ))}
            </Box>

            {/* ── Main Content Grid ── */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' },
                gap: 2.5,
                mb: 2.5,
            }}>
                {/* Recent Firms Table */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc' }}>
                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                            Recent Registrations
                        </Typography>
                        <Box
                            onClick={() => navigate('/super-admin/firms')}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#6366f1', '&:hover': { opacity: 0.8 } }}
                        >
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>View all</Typography>
                            <ArrowIcon sx={{ fontSize: 14 }} />
                        </Box>
                    </Box>

                    {isLoading ? (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} height={40} sx={{ borderRadius: '8px' }} />)}
                        </Box>
                    ) : recentFirms.length === 0 ? (
                        <Box sx={{ p: 5, textAlign: 'center', color: '#94a3b8' }}>
                            <BusinessIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                            <Typography sx={{ fontWeight: 600 }}>No firms registered yet</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Firm', 'Subdomain', 'Plan', 'Registered', 'Status'].map(h => (
                                            <th key={h} style={{
                                                textAlign: 'left', padding: '10px 20px',
                                                color: '#94a3b8', fontSize: '0.7rem',
                                                fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.05em', whiteSpace: 'nowrap',
                                                borderBottom: '1px solid #f8fafc',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentFirms.map((firm: DashboardFirm, i) => {
                                        const planStyle = PLAN_COLORS[firm.plan?.toLowerCase()] || PLAN_COLORS.trial;
                                        return (
                                            <tr key={firm._id}
                                                style={{ borderBottom: i < recentFirms.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer' }}
                                                onClick={() => navigate(`/super-admin/firms/${firm._id}`)}
                                            >
                                                <td style={{ padding: '14px 20px' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{
                                                            width: 32, height: 32, borderRadius: '10px',
                                                            bgcolor: '#eef2ff', color: '#6366f1',
                                                            fontWeight: 800, fontSize: '0.85rem',
                                                        }}>
                                                            {firm.firmName?.charAt(0) || 'F'}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem', lineHeight: 1.2 }}>
                                                                {firm.firmName}
                                                            </Typography>
                                                            {firm.email && (
                                                                <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                                                    {firm.email}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', px: 1, py: 0.25, borderRadius: '6px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                                        {firm.subdomain}.mycafile.in
                                                    </Typography>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <Chip
                                                        label={firm.plan?.toUpperCase()}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: planStyle.bg, color: planStyle.text,
                                                            fontWeight: 700, fontSize: '0.68rem', height: 22,
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                        {new Date(firm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </Typography>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 0.75,
                                                        bgcolor: firm.status === 'active' ? '#ecfdf5' : '#fff1f2',
                                                        color: firm.status === 'active' ? '#10b981' : '#f43f5e',
                                                        px: 1.25, py: 0.35, borderRadius: '8px',
                                                    }}>
                                                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                        <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                            {firm.status === 'active' ? 'Live' : 'Suspended'}
                                                        </Typography>
                                                    </Box>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    )}
                </Box>

                {/* Right column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Growth chart */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box sx={{ width: 28, height: 28, bgcolor: '#eef2ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                                Growth Trend
                            </Typography>
                        </Box>
                        {isLoading ? (
                            <Skeleton height={120} sx={{ borderRadius: '12px' }} />
                        ) : (
                            <Box sx={{ height: 120 }}>
                                <ResponsiveContainer>
                                    <LineChart data={charts.firmRegistrations}>
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <ReTooltip contentStyle={{ borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 12 }} />
                                        <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </Box>

                    {/* Plans Distribution */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 2.5, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', mb: 2 }}>
                            Plans Distribution
                        </Typography>
                        {isLoading ? (
                            <Skeleton height={120} sx={{ borderRadius: '12px' }} />
                        ) : (
                            <>
                                <Box sx={{ height: 110, display: 'flex', justifyContent: 'center' }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={charts.plansDistribution}
                                                innerRadius={32}
                                                outerRadius={50}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {charts.plansDistribution?.map((_: unknown, i: number) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <ReTooltip contentStyle={{ borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, justifyContent: 'center' }}>
                                    {charts.plansDistribution?.map((d, i) => (
                                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                                                {d.name} ({d.value})
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Quick Stats Row ── */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: 2,
            }}>
                {[
                    { label: 'Total Users', value: widgets.totalUsers, color: '#eef2ff', text: '#6366f1' },
                    { label: 'Staff Members', value: widgets.totalStaff, color: '#ecfdf5', text: '#10b981' },
                    { label: 'Total Tasks', value: widgets.totalTasks, color: '#fffbeb', text: '#f59e0b' },
                    { label: 'Total Invoices', value: widgets.totalInvoices, color: '#fdf2f8', text: '#ec4899' },
                ].map(s => (
                    <Box key={s.label} sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 36, borderRadius: '4px', bgcolor: s.color, flexShrink: 0 }}>
                            <Box sx={{ width: '100%', height: '100%', borderRadius: '4px', bgcolor: s.text, opacity: 0.3 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>{s.label}</Typography>
                            {isLoading ? <Skeleton width={40} /> : (
                                <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>
                                    {(s.value as number)?.toLocaleString('en-IN') || 0}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </Box>
    );
};

export default SuperAdminDashboard;
