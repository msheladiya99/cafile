import { Router, Response } from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { sendFirmMail, verifyFirmSmtp, renderTemplate } from '../services/emailService';

const router = Router();
router.use(authenticate);

import { Firm } from '../models/Firm';
import { EmailLog } from '../models/EmailLog';
import { sendEmail } from '../services/emailService';
import { queueEmail } from '../config/queue';
import { encrypt, decrypt } from '../utils/encryption';
import nodemailer from 'nodemailer';

// ─── Helper: get firm's smtp config ───────────────────────────────────────────
async function getFirmSmtp(req: AuthRequest) {
    const firmId = req.firmId || req.user?.firmId;
    const firm = await Firm.findById(firmId);
    return firm;
}

// ─── SMTP CONFIG (Admin only) ─────────────────────────────────────────────────

// GET SMTP config (password masked)
router.get('/smtp', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const firm = await getFirmSmtp(req);
        if (!firm || !firm.smtpHost) return res.json({ isConfigured: false, smtpEnabled: false });
        res.json({
            host: firm.smtpHost,
            port: firm.smtpPort,
            secure: firm.smtpSecure,
            user: firm.smtpUser,
            password: firm.smtpPass ? '••••••••' : '',
            fromName: firm.smtpFromName || firm.firmName || '',
            smtpEnabled: firm.smtpEnabled,
            isConfigured: true
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching SMTP config' });
    }
});

// SAVE SMTP config
router.put('/smtp', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;
        const { host, port, secure, user, password, smtpEnabled, fromName } = req.body;

        const firm = await Firm.findById(firmId);
        if (!firm) return res.status(404).json({ message: 'Firm not found' });

        firm.smtpHost = host?.trim();
        firm.smtpPort = parseInt(port) || 587;
        firm.smtpSecure = !!secure;
        firm.smtpUser = user?.trim();
        firm.smtpEnabled = !!smtpEnabled;
        firm.smtpFromName = fromName?.trim() || '';

        if (password && password !== '••••••••') {
            firm.smtpPass = encrypt(password);
        }

        await firm.save();
        res.json({ message: 'SMTP configuration saved', isConfigured: true });
    } catch (err) {
        res.status(500).json({ message: 'Error saving SMTP config' });
    }
});

// TEST SMTP connection
router.post('/smtp/test', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { testEmail, ...config } = req.body;
        const firm = await getFirmSmtp(req);
        
        // In case they pass config in body to test without saving first
        let testHost = config.host;
        let testPort = config.port;
        let testUser = config.user;
        let testPass = config.password;
        let testSecure = config.secure;
        let testFromName = config.fromName;

        if (!testHost) {
            if (!firm || !firm.smtpHost) return res.status(400).json({ message: 'SMTP not configured yet' });
            testHost = firm.smtpHost;
            testPort = firm.smtpPort;
            testUser = firm.smtpUser;
            testPass = decrypt(firm.smtpPass || '') || firm.smtpPass;
            testSecure = firm.smtpSecure;
            testFromName = firm.smtpFromName;
        }

        if (testPass === '••••••••') {
            testPass = decrypt(firm?.smtpPass || '') || firm?.smtpPass;
        }

        const transporter = nodemailer.createTransport({
            host: testHost,
            port: parseInt(testPort) || 587,
            secure: !!testSecure,
            auth: { user: testUser, pass: testPass },
            tls: { rejectUnauthorized: false }
        });

        // Test the connection
        await transporter.verify();

        // Actually send the test email
        const targetEmail = testEmail || testUser;
        const displayFromName = testFromName || firm?.firmName || 'CA Office Portal';
        
        await transporter.sendMail({
            from: `"${displayFromName}" <${testUser}>`,
            to: targetEmail,
            subject: '✅ SMTP Test – CA Office Portal',
            html: `<div style="font-family:sans-serif;padding:24px;max-width:500px">
              <h2 style="color:#4f46e5">🎉 SMTP Connection Successful!</h2>
              <p>Your SMTP configuration is working correctly.</p>
              <p><b>Host:</b> ${testHost}:${testPort}<br>
                 <b>From:</b> ${displayFromName} &lt;${testUser}&gt;</p>
              <p style="color:#555;font-size:13px">Sent by CA Office Portal</p>
            </div>`
        });

        res.json({ message: `SMTP Successful! Test email sent to ${targetEmail} ✅` });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// GET Email Analytics
router.get('/analytics', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const firmId = req.firmId || req.user?.firmId;

        const [sent, failed, fallback] = await Promise.all([
            EmailLog.countDocuments({ firmId, status: 'success' }),
            EmailLog.countDocuments({ firmId, status: 'failed' }),
            EmailLog.countDocuments({ firmId, status: 'fallback' })
        ]);

        // Get recent logs
        const recentLogs = await EmailLog.find({ firmId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('to subject status provider createdAt errorMessage')
            .lean();

        res.json({
            stats: { sent, failed, fallback },
            recentLogs
        });
    } catch (err: any) {
        res.status(500).json({ message: 'Error fetching email analytics', error: err.message });
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

        let queued = 0;

        for (const client of clients) {
            if (!client.email) continue;
            const variables = {
                clientName: client.name || '',
                name: client.name || '',
                email: client.email || '',
            };
            const renderedSubject = renderTemplate(subject, variables);
            const renderedBody = renderTemplate(body, variables);
            
            // Push to background queue
            await queueEmail({
                to: client.email,
                subject: renderedSubject,
                html: renderedBody,
                firmId: firmId
            });
            queued++;
        }

        res.json({ message: `Queued ${queued} emails to be sent in the background` });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// SEND to a single client
router.post('/send/client/:clientId', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { Client, EmailTemplate } = (req as any).models;
        const firmId = req.firmId || req.user?.firmId;

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
        
        await queueEmail({
            to: client.email,
            subject: renderTemplate(subject, variables),
            html: renderTemplate(body, variables),
            firmId: firmId
        });
        
        res.json({ message: 'Email queued successfully' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
