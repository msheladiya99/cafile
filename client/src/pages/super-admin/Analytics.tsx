import React from 'react';
import { Box, Typography, Skeleton, LinearProgress, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
    CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
    People as ClientsIcon,
    Business as FirmsIcon,
    Receipt as InvoiceIcon,
    CloudUpload as FilesIcon,
    TrendingUp as GrowthIcon,
    AssignmentTurnedIn as TaskDoneIcon,
    AttachMoney as RevenueIcon,
    Insights as InsightsIcon,
} from '@mui/icons-material';

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
    metrics: {
        totalClients: number;
        totalFirms: number;
        activeFirms: number;
        taskCompletionRate: string;
        taskCompletionPct: number;
        totalTasks: number;
        completedTasks: number;
        totalRevenue: number;
        totalFiles: number;
        totalInvoices: number;
    };
    history: { month: string; clients: number; revenue: number; files: number; firms: number }[];
    planDistribution: { name: string; value: number }[];
}

// ── Palette ──────────────────────────────────────────────────────────────────
const COLORS = {
    indigo:  '#6366f1',
    emerald: '#10b981',
    amber:   '#f59e0b',
    rose:    '#f43f5e',
    cyan:    '#06b6d4',
    violet:  '#8b5cf6',
};
const PIE_PALETTE = [COLORS.indigo, COLORS.emerald, COLORS.amber, COLORS.violet];

// ── Shared tooltip style ──────────────────────────────────────────────────────
const TOOLTIP_STYLE = { borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' };

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent, bg, loading }: {
    label: string; value?: string | number; sub?: string;
    icon: React.ReactNode; accent: string; bg: string; loading?: boolean;
}) {
    return (
        <Box sx={{
            bgcolor: '#fff', borderRadius: '20px', p: 2.5,
            border: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 2,
            transition: 'all 0.18s ease',
            '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transform: 'translateY(-2px)' },
        }}>
            <Box sx={{
                width: 44, height: 44, borderRadius: '14px', bgcolor: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                '& svg': { fontSize: 20, color: accent },
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', mb: 0.25, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {label}
                </Typography>
                {loading ? <Skeleton width={60} height={28} /> : (
                    <Typography sx={{ fontSize: '1.45rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                        {value ?? '—'}
                    </Typography>
                )}
                {sub && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, mt: 0.25 }}>{sub}</Typography>
                )}
            </Box>
        </Box>
    );
}

// ── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, height = 220 }: {
    title: string; subtitle?: string; children: React.ReactNode; height?: number;
}) {
    return (
        <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 3, height: '100%' }}>
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>{title}</Typography>
                {subtitle && <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.25 }}>{subtitle}</Typography>}
            </Box>
            <Box sx={{ height }}>{children}</Box>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const Analytics: React.FC = () => {
    const { data, isLoading } = useQuery<AnalyticsData>({
        queryKey: ['super-admin-analytics'],
        queryFn: async () => {
            const res = await api.get('/super-admin/analytics');
            return res.data;
        },
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    const metrics = data?.metrics;
    const history = data?.history || [];
    const planDist = data?.planDistribution || [];

    const stats = [
        { label: 'Total Clients',      value: metrics?.totalClients,  sub: 'across all firms',            icon: <ClientsIcon />,  accent: COLORS.indigo,  bg: '#eef2ff' },
        { label: 'Active Firms',        value: `${metrics?.activeFirms || 0} / ${metrics?.totalFirms || 0}`, sub: 'active/registered', icon: <FirmsIcon />,    accent: COLORS.emerald, bg: '#ecfdf5' },
        { label: 'Platform Revenue',    value: `₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`, sub: 'estimated MRR',      icon: <RevenueIcon />,  accent: COLORS.amber,   bg: '#fffbeb' },
        { label: 'Task Completion',     value: metrics?.taskCompletionRate, sub: `${metrics?.completedTasks || 0} of ${metrics?.totalTasks || 0} tasks`, icon: <TaskDoneIcon />, accent: COLORS.violet, bg: '#f5f3ff' },
        { label: 'Total Files',         value: metrics?.totalFiles,    sub: 'uploaded to cloud',           icon: <FilesIcon />,    accent: COLORS.cyan,    bg: '#ecfeff' },
        { label: 'Total Invoices',      value: metrics?.totalInvoices, sub: 'platform-wide',               icon: <InvoiceIcon />,  accent: COLORS.rose,    bg: '#fff1f2' },
    ];

    return (
        <Box className="sa-page">
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <InsightsIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                        </Box>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                            Global Analytics
                        </Typography>
                    </Box>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', mt: 0.5, ml: '47px' }}>
                        Platform-wide usage, growth, and performance metrics
                    </Typography>
                </Box>
                <Chip
                    label="Last 6 Months"
                    size="small"
                    sx={{ bgcolor: '#f8fafc', border: '1px solid #f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.72rem' }}
                />
            </Box>

            {/* ── KPI Cards ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
                {stats.map(s => (
                    <StatCard key={s.label} {...s} loading={isLoading} />
                ))}
            </Box>

            {/* ── Task Progress Bar ── */}
            {!isLoading && metrics && (
                <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>Overall Task Completion</Typography>
                            <Typography sx={{ fontWeight: 800, color: COLORS.violet, fontSize: '0.875rem' }}>{metrics.taskCompletionRate}</Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={metrics.taskCompletionPct}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: COLORS.violet } }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 800, color: COLORS.emerald, fontSize: '1.2rem' }}>{metrics.completedTasks}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Done</Typography>
                        </Box>
                        <Box sx={{ width: 1, bgcolor: '#f1f5f9' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 800, color: COLORS.rose, fontSize: '1.2rem' }}>{(metrics.totalTasks || 0) - (metrics.completedTasks || 0)}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Pending</Typography>
                        </Box>
                        <Box sx={{ width: 1, bgcolor: '#f1f5f9' }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.2rem' }}>{metrics.totalTasks}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Total</Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* ── Charts Row 1 ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                {/* Client Growth Area Chart */}
                <ChartCard title="Client Growth" subtitle="New clients added per month" height={220}>
                    {isLoading ? <Skeleton height={220} sx={{ borderRadius: '12px' }} /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={COLORS.indigo} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <ReTooltip contentStyle={TOOLTIP_STYLE} />
                                <Area type="monotone" dataKey="clients" stroke={COLORS.indigo} strokeWidth={2.5} fill="url(#clientGrad)" dot={{ r: 3, fill: COLORS.indigo, strokeWidth: 0 }} activeDot={{ r: 5 }} name="New Clients" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Revenue Trend Area Chart */}
                <ChartCard title="Revenue Trend" subtitle="Cumulative monthly revenue (₹)" height={220}>
                    {isLoading ? <Skeleton height={220} sx={{ borderRadius: '12px' }} /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={COLORS.amber} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <ReTooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`₹${(v as number ?? 0).toLocaleString('en-IN')}`, 'Revenue']} />
                                <Area type="monotone" dataKey="revenue" stroke={COLORS.amber} strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: COLORS.amber, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Revenue (₹)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </Box>

            {/* ── Charts Row 2 ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '2fr 1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
                {/* File Uploads Bar Chart */}
                <ChartCard title="File Uploads" subtitle="Monthly file uploads to cloud storage" height={210}>
                    {isLoading ? <Skeleton height={210} sx={{ borderRadius: '12px' }} /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <ReTooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="files" name="Files" radius={[6, 6, 0, 0]}
                                    fill={COLORS.cyan}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* New Firms Bar Chart */}
                <ChartCard title="Firm Registrations" subtitle="Monthly new firm signups" height={210}>
                    {isLoading ? <Skeleton height={210} sx={{ borderRadius: '12px' }} /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history} barSize={22}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <ReTooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="firms" name="New Firms" radius={[6, 6, 0, 0]} fill={COLORS.emerald} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Plan Distribution Pie */}
                <ChartCard title="Plan Distribution" subtitle="Firms by subscription plan" height={210}>
                    {isLoading ? <Skeleton height={210} sx={{ borderRadius: '12px' }} /> : planDist.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                            <Typography sx={{ fontSize: '0.8rem' }}>No data yet</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Box sx={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={planDist} innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                                            {planDist.map((_: unknown, i: number) => (
                                                <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                                            ))}
                                        </Pie>
                                        <ReTooltip contentStyle={TOOLTIP_STYLE} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
                                {planDist.map((d: { name: string; value: number }, i: number) => (
                                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PIE_PALETTE[i % PIE_PALETTE.length], flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
                                            {d.name} ({d.value})
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </ChartCard>
            </Box>

            {/* ── Combined Line Chart Row ── */}
            <ChartCard title="Platform Overview" subtitle="Clients & revenue trends combined over 6 months" height={240}>
                {isLoading ? <Skeleton height={240} sx={{ borderRadius: '12px', mt: 1 }} /> : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <ReTooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                            <Line yAxisId="left"  type="monotone" dataKey="clients" name="New Clients" stroke={COLORS.indigo} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.indigo, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke={COLORS.amber}  strokeWidth={2.5} dot={{ r: 3, fill: COLORS.amber, strokeWidth: 0 }}  activeDot={{ r: 5 }} />
                            <Line yAxisId="left"  type="monotone" dataKey="files"   name="File Uploads" stroke={COLORS.cyan}   strokeWidth={2.5} dot={{ r: 3, fill: COLORS.cyan, strokeWidth: 0 }}   activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* ── Summary Table ── */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', mt: 2.5, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GrowthIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                    <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>Monthly Breakdown</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                {['Month', 'New Clients', 'New Firms', 'File Uploads', 'Revenue (₹)'].map(h => (
                                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                [1,2,3,4,5,6].map(i => (
                                    <tr key={i}><td colSpan={5} style={{ padding: '10px 20px' }}><Skeleton /></td></tr>
                                ))
                            ) : history.map((row, i) => (
                                <tr key={row.month} style={{ borderBottom: i < history.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                                    <td style={{ padding: '12px 20px' }}>
                                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{row.month}</Typography>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: Math.max(4, row.clients * 6), height: 4, bgcolor: COLORS.indigo, borderRadius: 2, maxWidth: 60 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{row.clients}</Typography>
                                        </Box>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: Math.max(4, row.firms * 8), height: 4, bgcolor: COLORS.emerald, borderRadius: 2, maxWidth: 60 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{row.firms}</Typography>
                                        </Box>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                            <Box sx={{ width: Math.max(4, row.files * 6), height: 4, bgcolor: COLORS.cyan, borderRadius: 2, maxWidth: 60 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>{row.files}</Typography>
                                        </Box>
                                    </td>
                                    <td style={{ padding: '12px 20px' }}>
                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: row.revenue > 0 ? '#f59e0b' : '#94a3b8' }}>
                                            ₹{row.revenue.toLocaleString('en-IN')}
                                        </Typography>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            </Box>
        </Box>
    );
};

export default Analytics;
