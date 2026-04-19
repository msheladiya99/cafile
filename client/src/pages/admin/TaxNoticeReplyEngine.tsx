import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { AutoAwesome, ContentCopy, Download, Gavel, Save } from '@mui/icons-material';
import jsPDF from 'jspdf';
import { adminService } from '../../services/adminService';
import type { Client } from '../../types';
import { taxNoticeService } from '../../services/taxNoticeService';
import type { TaxNoticeRecord, TaxNoticeTemplate } from '../../services/taxNoticeService';

export const TaxNoticeReplyEngine: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [replyStyle, setReplyStyle] = useState<'Auto Reply' | 'Strong Legal Reply'>('Auto Reply');
    const [simpleMode, setSimpleMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [notice, setNotice] = useState<TaxNoticeRecord | null>(null);
    const [history, setHistory] = useState<TaxNoticeRecord[]>([]);
    const [templates, setTemplates] = useState<TaxNoticeTemplate[]>([]);
    const [similarCases, setSimilarCases] = useState<any[]>([]);
    const [templateName, setTemplateName] = useState('');

    const [subject, setSubject] = useState('');
    const [letterBody, setLetterBody] = useState('');
    const [legalReferencesText, setLegalReferencesText] = useState('');
    const [documentsText, setDocumentsText] = useState('');
    const [stepsText, setStepsText] = useState('');
    const [portalAction, setPortalAction] = useState('');

    useEffect(() => {
        adminService.getClients().then(setClients).catch(() => {});
        loadHistory();
        loadTemplates();
    }, []);

    const loadHistory = async () => {
        try {
            setHistory(await taxNoticeService.getHistory());
        } catch {
            // ignore
        }
    };

    const loadTemplates = async () => {
        try {
            setTemplates(await taxNoticeService.getTemplates());
        } catch {
            // ignore
        }
    };

    const bindEditableFields = (row: TaxNoticeRecord) => {
        setSubject(row.replyDraft.subject || '');
        setLetterBody(row.replyDraft.letter_body || '');
        setLegalReferencesText((row.replyDraft.legal_references || []).join('\n'));
        setDocumentsText((row.supportingDocuments || []).join('\n'));
        setStepsText((row.complianceStrategy?.step_by_step || []).join('\n'));
        setPortalAction(row.complianceStrategy?.portal_action || '');
    };

    const legalReferences = useMemo(
        () => legalReferencesText.split('\n').map((x) => x.trim()).filter(Boolean),
        [legalReferencesText]
    );
    const supportingDocuments = useMemo(
        () => documentsText.split('\n').map((x) => x.trim()).filter(Boolean),
        [documentsText]
    );
    const stepByStep = useMemo(
        () => stepsText.split('\n').map((x) => x.trim()).filter(Boolean),
        [stepsText]
    );

    const analyzeNotice = async () => {
        if (!selectedFile) {
            setError('Please upload a notice image/PDF first.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await taxNoticeService.uploadAnalyze(selectedFile, {
                clientId: selectedClient || undefined,
                replyStyle,
                includeSimpleExplanation: simpleMode,
            });
            setNotice(result.notice);
            setSimilarCases(result.similarCases || []);
            bindEditableFields(result.notice);
            setSuccess(result.duplicate ? 'Duplicate notice found. Existing draft loaded.' : 'Tax notice analyzed successfully.');
            await loadHistory();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Notice analysis failed.');
        } finally {
            setLoading(false);
        }
    };

    const saveDraft = async (status: 'draft' | 'reviewed') => {
        if (!notice) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const updated = await taxNoticeService.saveDraft(notice._id, {
                status,
                replyDraft: {
                    subject,
                    letter_body: letterBody,
                    legal_references: legalReferences,
                },
                supportingDocuments,
                complianceStrategy: {
                    step_by_step: stepByStep,
                    portal_action: portalAction,
                },
            });
            setNotice(updated);
            setSuccess(status === 'reviewed' ? 'Draft marked reviewed.' : 'Draft saved.');
            await loadHistory();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save draft.');
        } finally {
            setSaving(false);
        }
    };

    const loadFromHistory = async (id: string) => {
        setError('');
        try {
            const row = await taxNoticeService.getDetail(id);
            setNotice(row);
            bindEditableFields(row);
            setSimilarCases(await taxNoticeService.comparePrevious(id));
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load notice detail.');
        }
    };

    const copyReply = async () => {
        const text = `Subject: ${subject}\n\n${letterBody}\n\nLegal References:\n${legalReferences.map((x) => `- ${x}`).join('\n')}`;
        await navigator.clipboard.writeText(text);
        setSuccess('Reply copied to clipboard.');
    };

    const downloadWord = () => {
        const html = `
<html><body>
<h3>${subject}</h3>
<p style="white-space: pre-wrap;">${letterBody}</p>
<h4>Legal References</h4>
<ul>${legalReferences.map((x) => `<li>${x}</li>`).join('')}</ul>
<h4>Disclaimer</h4>
<p>This AI-generated draft is for assistance only. Final review by a qualified Chartered Accountant is required before submission.</p>
</body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tax-notice-reply.doc';
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(subject || 'Tax Notice Reply', 14, 14);
        const bodyLines = doc.splitTextToSize(letterBody || '', 180);
        doc.text(bodyLines, 14, 24);
        let y = 24 + bodyLines.length * 6 + 8;
        doc.text('Legal References:', 14, y);
        y += 6;
        for (const ref of legalReferences) {
            const lines = doc.splitTextToSize(`- ${ref}`, 180);
            doc.text(lines, 14, y);
            y += lines.length * 6;
        }
        y += 6;
        doc.setFontSize(10);
        doc.text(
            'This AI-generated draft is for assistance only. Final review by a qualified Chartered Accountant is required before submission.',
            14,
            y
        );
        doc.save('tax-notice-reply.pdf');
    };

    const saveTemplate = async () => {
        if (!notice || !templateName.trim()) {
            setError('Enter template name first.');
            return;
        }
        try {
            await taxNoticeService.createTemplate(notice._id, templateName.trim());
            setTemplateName('');
            setSuccess('Template saved.');
            await loadTemplates();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save template.');
        }
    };

    const applyTemplate = (template: TaxNoticeTemplate) => {
        setSubject(template.subject);
        setLetterBody(template.letterBody);
        setLegalReferencesText((template.legalReferences || []).join('\n'));
        setSuccess(`Template "${template.name}" applied to draft.`);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                AI Tax Notice Reply Engine
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Income Tax + GST notices with structured legal draft generation for CA workflows.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
                This AI-generated draft is for assistance only. Final review by a qualified Chartered Accountant is required before submission.
            </Alert>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Upload + Analyze Notice
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Client (optional)</InputLabel>
                                            <Select
                                                value={selectedClient}
                                                label="Client (optional)"
                                                onChange={(e) => setSelectedClient(e.target.value)}
                                            >
                                                <MenuItem value="">Not linked to client</MenuItem>
                                                {clients.map((client) => (
                                                    <MenuItem key={client._id} value={client._id}>{client.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Draft Mode</InputLabel>
                                            <Select
                                                value={replyStyle}
                                                label="Draft Mode"
                                                onChange={(e) => setReplyStyle(e.target.value as 'Auto Reply' | 'Strong Legal Reply')}
                                            >
                                                <MenuItem value="Auto Reply">Auto Reply</MenuItem>
                                                <MenuItem value="Strong Legal Reply">Strong Legal Reply</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                        Explain Notice in Simple Language
                                    </Typography>
                                    <Switch checked={simpleMode} onChange={(e) => setSimpleMode(e.target.checked)} />
                                </Paper>

                                <Button component="label" variant="outlined">
                                    {selectedFile ? selectedFile.name : 'Choose Notice File'}
                                    <input
                                        hidden
                                        type="file"
                                        accept=".pdf,image/jpeg,image/png,image/webp"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                                    onClick={analyzeNotice}
                                    disabled={loading}
                                >
                                    {loading ? 'Analyzing Notice...' : 'Generate Legal Reply Draft'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    {notice && (
                        <Card sx={{ borderRadius: 3, mt: 2 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Chip icon={<Gavel />} label={notice.noticeClassification.type} />
                                        <Chip color="primary" label={`Section: ${notice.noticeClassification.section_or_act || 'Not clearly specified in notice'}`} />
                                        <Chip label={`Risk: ${notice.riskAssessment.level}`} color={notice.riskAssessment.level === 'High' ? 'error' : notice.riskAssessment.level === 'Medium' ? 'warning' : 'success'} />
                                        <Chip label={`AI Confidence: ${notice.aiConfidenceScore}%`} />
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Issue Analysis</Typography>
                                                <Typography variant="body2"><strong>Core Issue:</strong> {notice.issueAnalysis.core_issue}</Typography>
                                                <Typography variant="body2"><strong>Legal Context:</strong> {notice.issueAnalysis.legal_context}</Typography>
                                                <Typography variant="body2"><strong>Possible Reason:</strong> {notice.issueAnalysis.possible_reason}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Deadline & Compliance Risk</Typography>
                                                <Typography variant="body2"><strong>Due Date:</strong> {notice.deadlineManagement.due_date || 'Not clearly specified in notice'}</Typography>
                                                <Typography variant="body2"><strong>Urgency:</strong> {notice.deadlineManagement.urgency}</Typography>
                                                <Typography variant="body2"><strong>Risk Reason:</strong> {notice.riskAssessment.reason}</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    {simpleMode && notice.explanationSimple && (
                                        <Alert severity="info">
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Explain Notice in Simple Language</Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{notice.explanationSimple}</Typography>
                                        </Alert>
                                    )}

                                    <TextField label="Subject" fullWidth size="small" value={subject} onChange={(e) => setSubject(e.target.value)} />
                                    <TextField label="Letter Body (Editable)" fullWidth multiline minRows={10} value={letterBody} onChange={(e) => setLetterBody(e.target.value)} />
                                    <TextField label="Legal References (one per line)" fullWidth multiline minRows={3} value={legalReferencesText} onChange={(e) => setLegalReferencesText(e.target.value)} />
                                    <TextField label="Supporting Documents (one per line)" fullWidth multiline minRows={3} value={documentsText} onChange={(e) => setDocumentsText(e.target.value)} />
                                    <TextField label="Compliance Steps (one per line)" fullWidth multiline minRows={3} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
                                    <TextField label="Portal Action Guidance" fullWidth multiline minRows={2} value={portalAction} onChange={(e) => setPortalAction(e.target.value)} />

                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button variant="contained" startIcon={<Save />} disabled={saving} onClick={() => saveDraft('draft')}>
                                            Save Draft
                                        </Button>
                                        <Button variant="contained" color="success" startIcon={<Save />} disabled={saving} onClick={() => saveDraft('reviewed')}>
                                            Mark Reviewed
                                        </Button>
                                        <Button variant="outlined" startIcon={<ContentCopy />} onClick={copyReply}>Copy</Button>
                                        <Button variant="outlined" startIcon={<Download />} onClick={downloadPDF}>Download PDF</Button>
                                        <Button variant="outlined" startIcon={<Download />} onClick={downloadWord}>Download Word</Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card sx={{ borderRadius: 3, mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Template Reuse</Typography>
                            <Stack spacing={1}>
                                <TextField
                                    size="small"
                                    label="Template Name"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                />
                                <Button variant="outlined" onClick={saveTemplate} disabled={!notice}>Save Current as Template</Button>
                                <Divider />
                                <List dense>
                                    {templates.length === 0 && <Typography variant="body2" sx={{ color: '#64748b' }}>No templates yet.</Typography>}
                                    {templates.map((t) => (
                                        <ListItem key={t._id} secondaryAction={<Button size="small" onClick={() => applyTemplate(t)}>Use</Button>}>
                                            <ListItemText primary={t.name} secondary={`${t.noticeType} • ${t.sectionOrAct}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3, mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Previous Case Comparison</Typography>
                            <List dense>
                                {similarCases.length === 0 && <Typography variant="body2" sx={{ color: '#64748b' }}>No similar past cases found yet.</Typography>}
                                {similarCases.map((c: any) => (
                                    <ListItem key={String(c._id)}>
                                        <ListItemText
                                            primary={c.originalFileName || 'Notice'}
                                            secondary={`${c.noticeClassification?.type || 'Other'} • ${c.noticeClassification?.section_or_act || ''}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Notice History</Typography>
                            <List dense>
                                {history.length === 0 && <Typography variant="body2" sx={{ color: '#64748b' }}>No notices analyzed yet.</Typography>}
                                {history.slice(0, 10).map((h) => (
                                    <ListItem key={h._id} secondaryAction={<Button size="small" onClick={() => loadFromHistory(h._id)}>Open</Button>}>
                                        <ListItemText
                                            primary={h.originalFileName}
                                            secondary={`${h.noticeClassification.type} • ${h.noticeClassification.section_or_act} • ${h.status}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
