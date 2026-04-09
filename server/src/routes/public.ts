import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// POST /contact - Public endpoint for contact form
router.post('/contact', async (req: Request, res: Response) => {
    try {
        const { name, email, firm, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const targetEmail = process.env.EMAIL_USER || 'support@mycafile.in';

        await transporter.sendMail({
            from: `"${name}" <${process.env.EMAIL_USER}>`,
            replyTo: email,
            to: targetEmail,
            subject: `New Contact Inquiry from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h3 style="color: #6366f1;">New Contact Inquiry</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Firm:</strong> ${firm || 'N/A'}</p>
                    <p><strong>Message:</strong></p>
                    <p style="background: #f1f5f9; padding: 15px; border-radius: 8px;">${message.replace(/\n/g, '<br>')}</p>
                </div>
            `
        });

        res.json({ message: 'Message sent successfully' });
    } catch (err: any) {
        console.error('Contact form error:', err);
        res.status(500).json({ message: 'Failed to send message' });
    }
});

export default router;
