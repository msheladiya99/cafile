import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, TextField, Switch, FormControlLabel,
    Button, Tabs, Tab, Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Alert, CircularProgress, Tooltip, Divider, Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
    isConfigured?: boolean;
    smtpEnabled?: boolean;
}

interface EmailTemplate {
    _id?: string;
    name: string;
    slug: string;
    subject: string;
    body: string;
    isActive: boolean;
}

// ─── Default 5 templates ──────────────────────────────────────────────────────
const DEFAULT_TEMPLATES: Omit<EmailTemplate, '_id'>[] = [
    {
        name: 'Client Welcome',
        slug: 'client_welcome',
        subject: 'Welcome to {{companyName}} – Your Account Details',
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#4f46e5">Welcome, {{clientName}}! 🎉</h2>
  <p>Your account has been created successfully at <b>{{companyName}}</b>.</p>
  <div style="background:#f0f4ff;padding:16px;border-radius:8px;margin:16px 0">
    <b>Username:</b> {{username}}<br>
    <b>Password:</b> {{password}}<br>
    <b>Portal:</b> <a href="{{portalUrl}}">{{portalUrl}}</a>
  </div>
  <p>Please login and change your password. Contact us if you need help.</p>
  <p>Regards,<br><b>{{companyName}}</b></p>
</div>`,
        isActive: true,
    },
    {
        name: 'Task Assigned',
        slug: 'task_assigned',
        subject: 'Task Assigned: {{taskName}}',
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#059669">New Task Assigned 📋</h2>
  <p>Dear {{clientName}},</p>
  <p>A new task has been assigned for your account:</p>
  <div style="background:#f0fdf4;padding:16px;border-radius:8px;border-left:4px solid #059669;margin:16px 0">
    <b>Task:</b> {{taskName}}<br>
    <b>Due Date:</b> {{dueDate}}<br>
    <b>Assigned To:</b> {{assignedTo}}
  </div>
  <p>We will keep you updated on the progress.</p>
  <p>Regards,<br><b>{{companyName}}</b></p>
</div>`,
        isActive: true,
    },
    {
        name: 'Payment Reminder',
        slug: 'payment_reminder',
        subject: 'Payment Reminder – {{companyName}}',
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#d97706">Payment Reminder 💰</h2>
  <p>Dear {{clientName}},</p>
  <p>This is a friendly reminder that the following payment is due:</p>
  <div style="background:#fffbeb;padding:16px;border-radius:8px;border-left:4px solid #d97706;margin:16px 0">
    <b>Amount:</b> ₹{{amount}}<br>
    <b>Due Date:</b> {{dueDate}}<br>
    <b>Invoice No:</b> {{invoiceNo}}
  </div>
  <p>Please make the payment at the earliest to avoid any interruption in services.</p>
  <p>Regards,<br><b>{{companyName}}</b></p>
</div>`,
        isActive: true,
    },
    {
        name: 'Document Ready',
        slug: 'document_ready',
        subject: '{{documentType}} is Ready – {{companyName}}',
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#7c3aed">Document Ready 📄</h2>
  <p>Dear {{clientName}},</p>
  <p>Your <b>{{documentType}}</b> for {{year}} is ready and has been uploaded to your portal.</p>
  <div style="background:#f5f3ff;padding:16px;border-radius:8px;border-left:4px solid #7c3aed;margin:16px 0">
    <b>Document:</b> {{documentType}}<br>
    <b>Financial Year:</b> {{year}}<br>
    <b>Category:</b> {{category}}
  </div>
  <p>Login to your portal to view and download the document.</p>
  <p>Regards,<br><b>{{companyName}}</b></p>
</div>`,
        isActive: true,
    },
    {
        name: 'General Announcement',
        slug: 'general_announcement',
        subject: 'Important Update from {{companyName}}',
        body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#0891b2">Important Update 📢</h2>
  <p>Dear {{clientName}},</p>
  <p>{{message}}</p>
  <p>If you have any questions, please feel free to contact us.</p>
  <p>Regards,<br><b>{{companyName}}</b></p>
</div>`,
        isActive: true,
    },
];

const AVAILABLE_VARS: Record<string, string[]> = {
    client_welcome: ['{{clientName}}', '{{username}}', '{{password}}', '{{portalUrl}}', '{{companyName}}'],
    task_assigned: ['{{clientName}}', '{{taskName}}', '{{dueDate}}', '{{assignedTo}}', '{{companyName}}'],
    payment_reminder: ['{{clientName}}', '{{amount}}', '{{dueDate}}', '{{invoiceNo}}', '{{companyName}}'],
    document_ready: ['{{clientName}}', '{{documentType}}', '{{year}}', '{{category}}', '{{companyName}}'],
    general_announcement: ['{{clientName}}', '{{message}}', '{{companyName}}'],
};

// ─── Component ────────────────────────────────────────────────────────────────
export const EmailSettings: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [smtp, setSmtp] = useState<SmtpConfig>({ host: '', port: 587, secure: false, user: '', password: '', fromName: '', smtpEnabled: false });
    const [smtpLoading, setSmtpLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [smtpAlert, setSmtpAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [editDialog, setEditDialog] = useState<{ open: boolean; template: EmailTemplate | null }>({ open: false, template: null });
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Load SMTP config
    useEffect(() => {
        api.get('/email/smtp').then(r => setSmtp(prev => ({ ...prev, ...r.data }))).catch(() => {});
    }, []);

    // Load templates
    const loadTemplates = () => {
        setTemplatesLoading(true);
        api.get('/email/templates').then(r => setTemplates(r.data)).catch(() => {}).finally(() => setTemplatesLoading(false));
    };
    useEffect(() => { loadTemplates(); }, []);

    const handleSaveSmtp = async () => {
        setSmtpLoading(true);
        setSmtpAlert(null);
        try {
            await api.put('/email/smtp', smtp);
            setSmtpAlert({ type: 'success', msg: 'SMTP configuration saved successfully!' });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setSmtpAlert({ type: 'error', msg: err.response?.data?.message || 'Failed to save' });
        } finally { setSmtpLoading(false); }
    };

    const handleTestMail = async () => {
        setTestLoading(true);
        setSmtpAlert(null);
        try {
            const r = await api.post('/email/smtp/test', { testEmail });
            setSmtpAlert({ type: 'success', msg: r.data.message });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setSmtpAlert({ type: 'error', msg: err.response?.data?.message || 'Test failed' });
        } finally { setTestLoading(false); }
    };

    const handleSeedDefaults = async () => {
        setSaving(true);
        try {
            for (const tmpl of DEFAULT_TEMPLATES) {
                await api.post('/email/templates', tmpl).catch(() => {});
            }
            await loadTemplates();
            setAlert({ type: 'success', msg: 'Default templates added!' });
        } catch { setAlert({ type: 'error', msg: 'Error adding templates' }); }
        finally { setSaving(false); }
    };

    const handleSaveTemplate = async (tmpl: EmailTemplate) => {
        setSaving(true);
        setAlert(null);
        try {
            if (tmpl._id) {
                await api.put(`/email/templates/${tmpl._id}`, tmpl);
            } else {
                await api.post('/email/templates', tmpl);
            }
            await loadTemplates();
            setEditDialog({ open: false, template: null });
            setAlert({ type: 'success', msg: 'Template saved!' });
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            setAlert({ type: 'error', msg: err.response?.data?.message || 'Error saving template' });
        } finally { setSaving(false); }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        await api.delete(`/email/templates/${id}`).catch(() => {});
        loadTemplates();
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex' }}>
                    <EmailIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Email Configuration</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure your SMTP server and manage email templates
                    </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                    <Chip
                        icon={smtp.isConfigured ? <CheckCircleIcon /> : <WarningAmberIcon />}
                        label={smtp.isConfigured ? 'SMTP Active' : 'Not Configured'}
                        color={smtp.isConfigured ? 'success' : 'warning'}
                        size="small"
                    />
                </Box>
            </Box>

            {alert && <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>{alert.msg}</Alert>}

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab icon={<SettingsIcon />} iconPosition="start" label="SMTP Setup" id="tab-smtp" />
                <Tab icon={<EmailIcon />} iconPosition="start" label="Email Templates" id="tab-templates" />
            </Tabs>

            {/* ─── SMTP Config Tab ─── */}
            {tab === 0 && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} mb={3}>SMTP Server Settings</Typography>

                                {smtpAlert && (
                                    <Alert severity={smtpAlert.type} onClose={() => setSmtpAlert(null)} sx={{ mb: 2 }}>
                                        {smtpAlert.msg}
                                    </Alert>
                                )}

                                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <FormControlLabel
                                        control={<Switch checked={smtp.smtpEnabled || false} onChange={e => setSmtp(p => ({ ...p, smtpEnabled: e.target.checked }))} />}
                                        label={
                                            <Box>
                                                <Typography variant="body1" fontWeight={600}>Use Custom SMTP</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    If turned OFF, emails will be sent using the system default (Resend).
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <TextField label="SMTP Host" fullWidth size="small"
                                            placeholder="smtp.gmail.com"
                                            value={smtp.host} onChange={e => setSmtp(p => ({ ...p, host: e.target.value }))} disabled={!smtp.smtpEnabled} />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField label="Port" fullWidth size="small" type="number"
                                            placeholder="587"
                                            value={smtp.port} onChange={e => setSmtp(p => ({ ...p, port: +e.target.value }))} disabled={!smtp.smtpEnabled} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField label="Display Name (From Name)" fullWidth size="small"
                                            placeholder="Lalit Hirpara & Co."
                                            value={smtp.fromName} onChange={e => setSmtp(p => ({ ...p, fromName: e.target.value }))} disabled={!smtp.smtpEnabled} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField label="Email Address (Login)" fullWidth size="small" type="email"
                                            placeholder="yourcompany@gmail.com"
                                            value={smtp.user} onChange={e => setSmtp(p => ({ ...p, user: e.target.value }))} disabled={!smtp.smtpEnabled} />
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <TextField label="App Password" fullWidth size="small" type="password"
                                            placeholder="Gmail App Password (not your Google password)"
                                            value={smtp.password} onChange={e => setSmtp(p => ({ ...p, password: e.target.value }))} disabled={!smtp.smtpEnabled} />
                                    </Grid>
                                     <Grid size={{ xs: 12 }}>
                                        <FormControlLabel
                                            control={<Switch checked={smtp.secure} onChange={e => setSmtp(p => ({ ...p, secure: e.target.checked, port: e.target.checked ? 465 : 587 }))} disabled={!smtp.smtpEnabled} />}
                                            label={`Use SSL/TLS (Port ${smtp.secure ? 465 : 587}) — ${smtp.secure ? 'Port 465 for SSL' : 'Port 587 for STARTTLS'}`}
                                        />
                                    </Grid>
                                </Grid>

                                <Stack direction="row" gap={2} mt={3}>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSmtp}
                                        disabled={smtpLoading} sx={{ borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                                        {smtpLoading ? <CircularProgress size={18} color="inherit" /> : 'Save Configuration'}
                                    </Button>
                                </Stack>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="subtitle1" fontWeight={600} mb={2}>Send Test Email</Typography>
                                <Stack direction="row" gap={2}>
                                    <TextField label="Test Email Address" size="small" sx={{ flex: 1 }}
                                        placeholder="yourname@example.com"
                                        value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                                    <Button variant="outlined" startIcon={<SendIcon />} onClick={handleTestMail}
                                        disabled={testLoading || !smtp.isConfigured}
                                        sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
                                        {testLoading ? <CircularProgress size={18} /> : 'Send Test'}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Quick guide */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, background: '#fafafa' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} mb={2}>📖 Quick Setup Guide</Typography>
                                <Typography variant="body2" color="text.secondary" mb={1}><b>For Gmail:</b></Typography>
                                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                                    <li>Enable 2-Factor Authentication</li>
                                    <li>Go to Google Account → Security</li>
                                    <li>Search "App Passwords"</li>
                                    <li>Create app password for "Mail"</li>
                                    <li>Use that 16-character password here</li>
                                    <li>Host: <code>smtp.gmail.com</code>, Port: 587</li>
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary" mb={1}><b>For Outlook/Microsoft:</b></Typography>
                                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                                    <li>Host: <code>smtp.office365.com</code></li>
                                    <li>Port: 587, STARTTLS</li>
                                    <li>Use your Office 365 credentials</li>
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary" mb={1}><b>For Custom Domain:</b></Typography>
                                <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
                                    <li>Ask your hosting provider for SMTP details</li>
                                    <li>Host, Port, Email, Password</li>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* ─── Templates Tab ─── */}
            {tab === 1 && (
                <Box>
                    <Stack direction="row" alignItems="center" mb={3} gap={2}>
                        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                            Email Templates
                            <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                                ({templates.length} templates)
                            </Typography>
                        </Typography>
                        {templates.length === 0 && (
                            <Button variant="outlined" onClick={handleSeedDefaults} disabled={saving}>
                                Add 5 Default Templates
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => setEditDialog({ open: true, template: { name: '', slug: '', subject: '', body: '', isActive: true } })}
                            sx={{ borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                            New Template
                        </Button>
                    </Stack>

                    {templatesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : templates.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                            <EmailIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
                            <Typography variant="h6">No templates yet</Typography>
                            <Typography variant="body2">Click "Add 5 Default Templates" to get started quickly</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {templates.map(tmpl => (
                                <Grid size={{ xs: 12, md: 6 }} key={tmpl._id}>
                                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:hover': { borderColor: '#6366f1' }, transition: 'all 0.2s' }}>
                                        <CardContent sx={{ pb: '12px !important' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography fontWeight={600}>{tmpl.name}</Typography>
                                                        <Chip label={tmpl.isActive ? 'Active' : 'Inactive'} size="small"
                                                            color={tmpl.isActive ? 'success' : 'default'} />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" noWrap>
                                                        Subject: {tmpl.subject}
                                                    </Typography>
                                                    <Chip label={`#${tmpl.slug}`} size="small" variant="outlined" sx={{ mt: 1, fontSize: '0.7rem' }} />
                                                </Box>
                                                <Stack direction="row">
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => setEditDialog({ open: true, template: tmpl })}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(tmpl._id!)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {/* ─── Edit Template Dialog ─── */}
            <TemplateDialog
                open={editDialog.open}
                template={editDialog.template}
                onClose={() => setEditDialog({ open: false, template: null })}
                onSave={handleSaveTemplate}
                saving={saving}
            />
        </Box>
    );
};

// ─── Template Edit Dialog ─────────────────────────────────────────────────────
const TemplateDialog: React.FC<{
    open: boolean;
    template: EmailTemplate | null;
    onClose: () => void;
    onSave: (t: EmailTemplate) => void;
    saving: boolean;
}> = ({ open, template, onClose, onSave, saving }) => {
    const [form, setForm] = useState<EmailTemplate>({ name: '', slug: '', subject: '', body: '', isActive: true });

    useEffect(() => {
        if (template && template._id !== form._id) setForm(template);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template]);

    const vars = AVAILABLE_VARS[form.slug] || ['{{clientName}}', '{{companyName}}'];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
                {form._id ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Template Name" fullWidth size="small" value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Client Welcome" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField label="Slug (unique key)" fullWidth size="small" value={form.slug}
                            onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                            placeholder="e.g. client_welcome" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField label="Email Subject" fullWidth size="small" value={form.subject}
                            onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                            placeholder="e.g. Welcome to {{companyName}}" />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                                Click to copy variable:
                            </Typography>
                            {vars.map(v => (
                                <Chip key={v} label={v} size="small" variant="outlined"
                                    icon={<ContentCopyIcon sx={{ fontSize: '13px !important' }} />}
                                    onClick={() => navigator.clipboard.writeText(v)}
                                    sx={{ cursor: 'pointer', fontSize: '0.72rem', '&:hover': { borderColor: '#6366f1' } }} />
                            ))}
                        </Box>
                        <TextField label="Email Body (HTML supported)" fullWidth multiline rows={10} value={form.body}
                            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                            inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={<Switch checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />}
                            label="Active" />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={() => onSave(form)} disabled={saving || !form.name || !form.slug || !form.subject || !form.body}
                    startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Save Template
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmailSettings;
