import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { sendFirmMail, verifyFirmSmtp, renderTemplate } from '../services/emailService';

const router = Router();
router.use(authenticate);

// ─── Helper: get firm's smtp config ───────────────────────────────────────────
async function getFirmSmtp(req: AuthRequest) {
    const { Settings } = (req as any).models;
    const firmId = req.firmId || req.user?.firmId;
    const settings = await Settings.findOne({ firmId }).lean();
    return settings?.smtp;
}

// ─── SMTP CONFIG (Admin only) ─────────────────────────────────────────────────

// GET SMTP config (password masked)
router.get('/smtp', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const smtp = await getFirmSmtp(req);
        if (!smtp) return res.json({ isConfigured: false });
        res.json({ ...smtp, password: smtp.password ? '••••••••' : '' });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching SMTP config' });
    }
});

// SAVE SMTP config
router.put('/smtp', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Settings } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const { host, port, secure, user, password, fromName } = req.body;

        if (!host || !user || !fromName) {
            return res.status(400).json({ message: 'Host, Email (user) and Display Name are required' });
        }

        let settings = await Settings.findOne({ firmId });
        if (!settings) settings = await Settings.create({ firmId });

        settings.smtp = {
            host: host.trim(),
            port: parseInt(port) || 587,
            secure: !!secure,
            user: user.trim(),
            // Keep existing password if empty string sent (masked placeholder)
            password: password && password !== '••••••••' ? password : (settings.smtp?.password || ''),
            fromName: fromName.trim(),
            isConfigured: true,
        };
        await settings.save();
        res.json({ message: 'SMTP configuration saved', isConfigured: true });
    } catch (err) {
        res.status(500).json({ message: 'Error saving SMTP config' });
    }
});

// TEST SMTP connection
router.post('/smtp/test', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testEmail } = req.body;
        const smtp = await getFirmSmtp(req);
        if (!smtp?.isConfigured) return res.status(400).json({ message: 'SMTP not configured yet' });

        // Send a test email
        const result = await sendFirmMail(
            smtp,
            testEmail || smtp.user,
            '✅ SMTP Test – CA Office Portal',
            `<div style="font-family:sans-serif;padding:24px;max-width:500px">
              <h2 style="color:#4f46e5">🎉 SMTP Connection Successful!</h2>
              <p>Your SMTP configuration is working correctly.</p>
              <p><b>Host:</b> ${smtp.host}:${smtp.port}<br>
                 <b>From:</b> ${smtp.fromName} &lt;${smtp.user}&gt;</p>
              <p style="color:#555;font-size:13px">Sent by CA Office Portal</p>
            </div>`
        );
        if (result.success) {
            res.json({ message: `Test email sent to ${testEmail || smtp.user}` });
        } else {
            res.status(500).json({ message: result.error || 'Failed to send test email' });
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

// GET all templates
router.get('/templates', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const templates = await EmailTemplate.find({ firmId }).lean();
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching templates' });
    }
});

// CREATE template
router.post('/templates', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const { name, slug, subject, body, isActive } = req.body;
        const template = await EmailTemplate.create({ firmId, name, slug, subject, body, isActive: isActive ?? true });
        res.status(201).json(template);
    } catch (err: any) {
        if (err.code === 11000) return res.status(400).json({ message: 'A template with this slug already exists' });
        res.status(500).json({ message: 'Error creating template' });
    }
});

// UPDATE template
router.put('/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const { name, slug, subject, body, isActive } = req.body;
        const template = await EmailTemplate.findOneAndUpdate(
            { _id: req.params.id, firmId },
            { name, slug, subject, body, isActive },
            { new: true }
        );
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: 'Error updating template' });
    }
});

// DELETE template
router.delete('/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        await EmailTemplate.findOneAndDelete({ _id: req.params.id, firmId });
        res.json({ message: 'Template deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting template' });
    }
});

// ─── SEND EMAILS ──────────────────────────────────────────────────────────────

// SEND to all clients (bulk)
router.post('/send/bulk', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Client, EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const smtp = await getFirmSmtp(req);
        if (!smtp?.isConfigured) return res.status(400).json({ message: 'SMTP not configured. Go to Settings → Email Configuration first.' });

        const { templateId, subject: customSubject, body: customBody, clientIds } = req.body;

        // Get email content (from template or custom)
        let subject: string, body: string;
        if (templateId) {
            const template = await EmailTemplate.findOne({ _id: templateId, firmId }).lean();
            if (!template) return res.status(404).json({ message: 'Template not found' });
            subject = template.subject;
            body = template.body;
        } else {
            subject = customSubject;
            body = customBody;
        }
        if (!subject || !body) return res.status(400).json({ message: 'Subject and body are required' });

        // Get clients
        const query: any = { firmId };
        if (clientIds?.length) query._id = { $in: clientIds };
        const clients = await Client.find(query).select('name email').lean();

        const results = { sent: 0, failed: 0, errors: [] as string[] };

        for (const client of clients) {
            if (!client.email) continue;
            const variables = {
                clientName: client.name || '',
                name: client.name || '',
                email: client.email || '',
            };
            const renderedSubject = renderTemplate(subject, variables);
            const renderedBody = renderTemplate(body, variables);
            const result = await sendFirmMail(smtp, client.email, renderedSubject, renderedBody);
            if (result.success) results.sent++;
            else { results.failed++; results.errors.push(`${client.name}: ${result.error}`); }
        }

        res.json({ message: `Done. Sent: ${results.sent}, Failed: ${results.failed}`, ...results });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// SEND to a single client
router.post('/send/client/:clientId', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Client, EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;
        const smtp = await getFirmSmtp(req);
        if (!smtp?.isConfigured) return res.status(400).json({ message: 'SMTP not configured' });

        const client = await Client.findOne({ _id: req.params.clientId, firmId }).lean();
        if (!client) return res.status(404).json({ message: 'Client not found' });
        if (!client.email) return res.status(400).json({ message: 'Client has no email address' });

        const { templateId, subject: customSubject, body: customBody, variables: extraVars } = req.body;
        let subject: string, body: string;
        if (templateId) {
            const template = await EmailTemplate.findOne({ _id: templateId, firmId }).lean();
            if (!template) return res.status(404).json({ message: 'Template not found' });
            subject = template.subject;
            body = template.body;
        } else {
            subject = customSubject;
            body = customBody;
        }

        const variables = { clientName: client.name, name: client.name, email: client.email, ...(extraVars || {}) };
        const result = await sendFirmMail(smtp, client.email, renderTemplate(subject, variables), renderTemplate(body, variables));
        if (result.success) res.json({ message: 'Email sent successfully' });
        else res.status(500).json({ message: result.error });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
