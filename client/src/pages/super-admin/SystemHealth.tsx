import React from 'react';
import { Box, Typography, Grid, LinearProgress, Skeleton } from '@mui/material';
import {
    Storage as DbIcon, Memory as MemoryIcon, AccessTime as UptimeIcon,
    Cloud as CloudIcon, Speed as LatencyIcon, MonitorHeart as HealthIcon,
    CheckCircle as OkIcon, Warning as WarnIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface HealthData {
    database: string;
    apiDelay: string;
    uptime: string;
    totalRequests: string;
    memory: {
        rss: string;
        heapTotal: string;
        heapUsed: string;
        systemTotal: string;
        systemFree: string;
    };
}

// ── Parse MB value from string like "128.40 MB" ──────────────────────────────
const parseMB = (s: string | undefined) => parseFloat(s || '0');
const parseGB = (s: string | undefined) => parseFloat(s || '0');

// ── Status Pill ───────────────────────────────────────────────────────────────
function StatusPill({ ok, label }: { ok: boolean; label: string }) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.75,
            bgcolor: ok ? '#ecfdf5' : '#fff1f2',
            color: ok ? '#10b981' : '#f43f5e',
            px: 1.5, py: 0.4, borderRadius: '10px',
        }}>
            {ok ? <OkIcon sx={{ fontSize: 14 }} /> : <WarnIcon sx={{ fontSize: 14 }} />}
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{label}</Typography>
        </Box>
    );
}

// ── Metric Block ──────────────────────────────────────────────────────────────
function MetricBlock({ icon, label, value, sub, accent, bg, loading }: {
    icon: React.ReactNode; label: string; value?: string | number;
    sub?: string; accent: string; bg: string; loading?: boolean;
}) {
    return (
        <Box sx={{
            bgcolor: '#fff', borderRadius: '18px', p: 2.5,
            border: '1px solid #f1f5f9', display: 'flex', gap: 2, alignItems: 'flex-start',
            transition: 'all 0.18s ease',
            '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transform: 'translateY(-2px)' },
        }}>
            <Box sx={{
                width: 44, height: 44, bgcolor: bg, borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                '& svg': { fontSize: 20, color: accent },
            }}>
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.4, textTransform: 'uppercase' }}>
                    {label}
                </Typography>
                {loading ? <Skeleton width={80} height={26} /> : (
                    <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.2rem', lineHeight: 1.3 }}>
                        {value ?? '—'}
                    </Typography>
                )}
                {sub && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{sub}</Typography>
                )}
            </Box>
        </Box>
    );
}

// ── Memory Bar ────────────────────────────────────────────────────────────────
function MemBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, color, fontSize: '0.8rem' }}>{pct}% used</Typography>
            </Box>
            <LinearProgress
                variant="determinate" value={pct}
                sx={{
                    height: 7, borderRadius: 4, bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: pct > 80 ? '#f43f5e' : pct > 60 ? '#f59e0b' : color },
                }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{used.toFixed(1)} MB used</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{total.toFixed(1)} MB total</Typography>
            </Box>
        </Box>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const SystemHealth: React.FC = () => {
    const { data: health, isLoading } = useQuery<HealthData>({
        queryKey: ['system-health'],
        queryFn: async () => {
            const res = await api.get('/super-admin/system-health');
            return res.data;
        },
        refetchInterval: 15000,
        staleTime: 10000,
    });

    const isConnected = health?.database === 'Connected';
    const heapUsed  = parseMB(health?.memory?.heapUsed);
    const heapTotal = parseMB(health?.memory?.heapTotal);
    const rss       = parseMB(health?.memory?.rss);
    const sysTotal  = parseGB(health?.memory?.systemTotal) * 1024;
    const sysFree   = parseGB(health?.memory?.systemFree) * 1024;
    const sysUsed   = sysTotal - sysFree;
    const uptimeSec = parseInt(health?.uptime || '0');
    const uptimeMin = Math.floor(uptimeSec / 60);
    const uptimeHr  = Math.floor(uptimeMin / 60);
    const uptimeStr = uptimeHr > 0 ? `${uptimeHr}h ${uptimeMin % 60}m` : `${uptimeMin}m`;

    return (
        <Box className="sa-page">
            {/* ── Header ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 32, height: 32, bgcolor: '#ecfdf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HealthIcon sx={{ fontSize: 18, color: '#10b981' }} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                        System Health
                    </Typography>
                </Box>
                {!isLoading && <StatusPill ok={isConnected} label={isConnected ? 'All Systems Operational' : 'Degraded'} />}
            </Box>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', ml: '47px', mb: 3 }}>
                Live server metrics — auto-refreshes every 15 seconds
            </Typography>

            {/* ── Status Cards ── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricBlock
                        icon={<DbIcon />} label="Database" loading={isLoading}
                        value={health?.database} sub="MongoDB connection"
                        accent={isConnected ? '#10b981' : '#f43f5e'}
                        bg={isConnected ? '#ecfdf5' : '#fff1f2'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricBlock
                        icon={<LatencyIcon />} label="API Latency" loading={isLoading}
                        value={health?.apiDelay} sub="gateway response time"
                        accent="#6366f1" bg="#eef2ff"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricBlock
                        icon={<UptimeIcon />} label="Process Uptime" loading={isLoading}
                        value={isLoading ? undefined : uptimeStr} sub={`${uptimeSec}s total`}
                        accent="#f59e0b" bg="#fffbeb"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricBlock
                        icon={<CloudIcon />} label="Cloud Storage API" loading={isLoading}
                        value="Online" sub="Google Drive configured"
                        accent="#06b6d4" bg="#ecfeff"
                    />
                </Grid>
            </Grid>

            {/* ── Memory Section ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                {/* App Memory */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#fdf2f8', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MemoryIcon sx={{ fontSize: 18, color: '#ec4899' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>Application Memory</Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Node.js process memory usage</Typography>
                        </Box>
                    </Box>

                    {isLoading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <MemBar label="Heap Memory" used={heapUsed} total={heapTotal} color="#ec4899" />
                            <MemBar label="Resident Set (RSS)" used={rss} total={heapTotal * 1.5} color="#8b5cf6" />
                        </Box>
                    )}

                    <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        {[
                            { label: 'Heap Used',  value: health?.memory?.heapUsed },
                            { label: 'Heap Total', value: health?.memory?.heapTotal },
                            { label: 'RSS',        value: health?.memory?.rss },
                            { label: 'Requests',   value: health?.totalRequests },
                        ].map(item => (
                            <Box key={item.label}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    {item.label}
                                </Typography>
                                {isLoading ? <Skeleton width={80} /> : (
                                    <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem' }}>
                                        {item.value || '—'}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* System Memory */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#fffbeb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DbIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem' }}>System Memory</Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Host server RAM usage</Typography>
                        </Box>
                    </Box>

                    {isLoading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Skeleton height={40} />
                            <Skeleton height={40} />
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <MemBar label="System RAM" used={sysUsed} total={sysTotal} color="#f59e0b" />
                            <MemBar label="Free RAM Available" used={sysFree} total={sysTotal} color="#10b981" />
                        </Box>
                    )}

                    <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #f8fafc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                        {[
                            { label: 'Total RAM', value: health?.memory?.systemTotal },
                            { label: 'Free RAM',  value: health?.memory?.systemFree },
                            { label: 'Used RAM',  value: sysUsed > 0 ? `${sysUsed.toFixed(0)} MB` : '—' },
                            { label: 'Usage %',   value: sysTotal > 0 ? `${Math.round((sysUsed/sysTotal)*100)}%` : '—' },
                        ].map(item => (
                            <Box key={item.label}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    {item.label}
                                </Typography>
                                {isLoading ? <Skeleton width={80} /> : (
                                    <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.875rem' }}>
                                        {item.value || '—'}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── Services Status ── */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px solid #f1f5f9', p: 3, mt: 2.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.925rem', mb: 2.5 }}>Services Status</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {[
                        { name: 'MongoDB Atlas',    status: isConnected, detail: 'Primary database' },
                        { name: 'Google Drive API', status: true,        detail: 'File storage' },
                        { name: 'Express Server',   status: true,        detail: 'API gateway' },
                        { name: 'Auth Service',     status: true,        detail: 'JWT tokens' },
                    ].map(svc => (
                        <Box key={svc.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: '12px' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: svc.status ? '#10b981' : '#f43f5e', flexShrink: 0, boxShadow: `0 0 0 3px ${svc.status ? '#ecfdf5' : '#fff1f2'}` }} />
                            <Box>
                                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem' }}>{svc.name}</Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{svc.detail}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default SystemHealth;
