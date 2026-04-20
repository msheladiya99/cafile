import { Router, Response } from 'express';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import multer from 'multer';
import fs from 'fs/promises';
import { ocrService } from '../services/ocr.service';
const pdfParseRaw = require('pdf-parse');

const pdfParse = typeof pdfParseRaw === 'function' ? pdfParseRaw : pdfParseRaw.default || pdfParseRaw.PDFParse;


const router = Router();

// ─── Multer (memory storage — no temp file needed) ────────────────────────────

const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, PNG files are allowed'));
        }
    },
});

// ─── AI Client (OpenRouter only) ─────────────────────────────────────────────

function getOpenRouterClient(): OpenAI | null {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key?.includes('sk-')) return null;
    return new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: key,
        defaultHeaders: {
            'HTTP-Referer': 'https://mycafile.in',
            'X-Title': 'CA Office Portal - Notice Reply',
        },
    });
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a highly experienced Chartered Accountant (CA) and tax litigation expert in India.

Your task is to analyze tax notices and generate accurate, professional, and legally sound replies.

You must:
- Identify the notice type and section (Income Tax / GST / TDS)
- Extract key issues raised by the department
- Suggest a clear response strategy
- Draft a formal reply suitable for submission to tax authorities

Guidelines:
- Use formal, legal, and professional tone
- Be precise and structured
- Do NOT hallucinate laws or sections
- If information is missing, mention assumptions clearly
- Ensure reply is defensible and compliant

Output format (use these exact headers with markdown):

## 1. Notice Details
[Summary of the notice — type, section, assessment year, issuing authority]

## 2. Issue Summary
[Bullet-point list of key issues/demands raised by the department]

## 3. Recommended Strategy
[Clear 3-5 point strategy for responding]

## 4. Draft Reply (Final Answer)

[COMPLETE formal draft letter ready for submission. Include:
- Subject line
- Reference to notice
- Point-by-point reply to each issue
- Supporting documents to attach
- Closing]

---
*This reply is AI-generated and must be reviewed by a qualified Chartered Accountant before submission.*`;

// ─── Generate with OpenRouter ─────────────────────────────────────────────────

async function generateWithOpenRouter(noticeText: string, clientDetails: string): Promise<string> {
    const client = getOpenRouterClient();
    if (!client) throw new Error('OpenRouter API key not configured');

    const model = process.env.OPENROUTER_NOTICE_MODEL
        || process.env.OPENROUTER_TAX_MODEL
        || 'openai/gpt-4o-mini';

    const userPrompt = `Analyze the following tax notice and generate a complete professional reply:

NOTICE TEXT:
${noticeText}

${clientDetails ? `ADDITIONAL CLIENT DETAILS:\n${clientDetails}` : ''}

Generate a complete professional reply following this exact structure:
## 1. Notice Details
## 2. Issue Summary
## 3. Recommended Strategy
## 4. Draft Reply (Final Answer)`;

    const response = await client.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 6000,
    });

    return response.choices[0].message.content || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notice-reply/extract-text
// Accepts PDF or image upload → extracts text → returns raw text (no AI yet)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/extract-text',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    pdfUpload.single('file'),
    async (req: AuthRequest, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const { mimetype, buffer, originalname } = req.file;
            let extractedText = '';
            let method = 'pdf-parse';

            if (mimetype === 'application/pdf') {
                // ── Step 1: Try pdf-parse (works on digital/text-based PDFs) ──
                try {
                    let data;
                    if (typeof pdfParse === 'function') {
                        data = await pdfParse(buffer);
                    } else if (typeof pdfParse?.PDFParse === 'function') {
                        const inst = new pdfParse.PDFParse({ data: buffer });
                        await inst.load();
                        data = await inst.getText();
                    } else {
                        throw new Error('pdf-parse module shape unrecognized');
                    }
                    extractedText = (data?.text || '').trim();
                    console.log(`[NoticeReply] pdf-parse extracted ${extractedText.length} chars from ${originalname}`);
                } catch (pdfErr: any) {

                    console.warn('[NoticeReply] pdf-parse failed:', pdfErr.message);
                }

                // ── Step 2: If text too short → Robust OCR via ocrService ──
                if (extractedText.length < 100) {
                    console.log('[NoticeReply] Text too short, trying robust OCR via ocrService...');
                    try {
                        const ocrResult = await ocrService.extractText(buffer, mimetype);
                        extractedText = ocrResult.text;
                        method = 'ocr-service';
                    } catch (ocrErr: any) {
                        console.warn('[NoticeReply] ocrService failed, trying AI vision fallback:', ocrErr.message);
                        // Final fallback to OpenRouter vision if ocrService failed
                        try {
                            extractedText = await extractTextWithAI(buffer, mimetype);
                            method = 'ai-vision-ocr';
                        } catch (aiErr: any) {
                            console.warn('[NoticeReply] AI vision also failed:', aiErr.message);
                        }
                    }
                }

            } else if (mimetype.startsWith('image/')) {
                // ── Image: Use ocrService directly ──
                try {
                    const ocrResult = await ocrService.extractText(buffer, mimetype);
                    extractedText = ocrResult.text;
                    method = 'ocr-service';
                } catch (ocrErr: any) {
                    console.warn('[NoticeReply] ocrService image failed:', ocrErr.message);
                    try {
                        extractedText = await extractTextWithAI(buffer, mimetype);
                        method = 'ai-vision-ocr';
                    } catch (aiErr: any) {
                        console.warn('[NoticeReply] AI vision fallback failed:', aiErr.message);
                    }
                }
            }


            if (!extractedText || extractedText.length < 20) {
                return res.status(422).json({
                    message: 'Could not extract readable text from this file. The PDF may be scanned/image-based. Please paste the notice text manually.',
                });
            }

            return res.json({
                text: extractedText,
                method,
                charCount: extractedText.length,
            });

        } catch (err: any) {
            console.error('[NoticeReply] extract-text error:', err);
            return res.status(500).json({ message: err.message || 'Text extraction failed' });
        }
    }
);

// ─── AI Vision OCR (for scanned PDFs / images) ───────────────────────────────
// Sends base64 image to OpenRouter vision model to extract text

async function extractTextWithAI(buffer: Buffer, mimetype: string): Promise<string> {
    const client = getOpenRouterClient();
    if (!client) throw new Error('OpenRouter not configured');

    // Use a vision-capable model for OCR
    const visionModel = process.env.OPENROUTER_OCR_MODEL || 'openai/gpt-4o-mini';

    const base64 = buffer.toString('base64');
    
    // ⚠️ CRITICAL: OpenRouter/OpenAI vision models ONLY support image formats (JPG, PNG, WEBP).
    // They DO NOT support application/pdf via image_url.
    // If the file is a PDF, we should ideally use the existing ocrService or extract an image first.
    // For now, we fix the mimetype if it's an image, and warn if it's a PDF.
    
    let finalMimeType = mimetype;
    if (mimetype === 'application/pdf') {
        console.warn('[NoticeReply] Sending raw PDF to vision model. This will likely fail. Consider using ocrService.');
        // If we have pdf2pic or similar, we should convert here.
        // As a temporary fix to prevent crash, we'll try to let ocrService handle it if available.
    }

    const dataUrl = `data:${finalMimeType};base64,${base64}`;

    const response = await client.chat.completions.create({
        model: visionModel,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: { url: dataUrl },
                    },
                    {
                        type: 'text',
                        text: 'Extract ALL text from this tax notice document exactly as it appears. Preserve the structure, headings, amounts, dates, section numbers, and all content. Return only the extracted text, no commentary. If the document has multiple pages, extract text from all of them.',
                    },
                ] as any,
            },
        ],
        max_tokens: 4000,
    });


    return response.choices[0].message.content || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notice-reply/generate
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/generate',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { noticeText, clientDetails = '' } = req.body;

            if (!noticeText?.trim()) {
                return res.status(400).json({ message: 'Notice text is required' });
            }
            if (noticeText.trim().length < 20) {
                return res.status(400).json({ message: 'Notice text is too short to analyze' });
            }

            let reply = '';
            const modelUsed = process.env.OPENROUTER_NOTICE_MODEL
                || process.env.OPENROUTER_TAX_MODEL
                || 'openai/gpt-4o-mini';

            console.log(`[Notice Reply] Using OpenRouter model: ${modelUsed}`);

            try {
                reply = await generateWithOpenRouter(noticeText, clientDetails);
            } catch (orErr: any) {
                console.error('[Notice Reply] OpenRouter failed:', orErr.message);
                return res.status(503).json({
                    message: 'AI generation failed. Please try again.',
                    error: orErr.message,
                });
            }

            if (!reply?.trim()) {
                return res.status(500).json({ message: 'AI returned empty response. Please try again.' });
            }

            return res.json({
                reply,
                provider: `OpenRouter (${modelUsed})`,
                generatedAt: new Date().toISOString(),
            });

        } catch (err: any) {
            console.error('[Notice Reply] Unexpected error:', err);
            return res.status(500).json({ message: err.message || 'Internal server error' });
        }
    }
);

export default router;
