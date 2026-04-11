import { ImageAnnotatorClient } from '@google-cloud/vision';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// ─── OCR Service ──────────────────────────────────────────────────────────────
// Handles text extraction from scanned PDFs and images using Google Vision API.
// Triggered automatically when pdf-parse yields insufficient text.

const TEXT_THRESHOLD = 200;      // minimum meaningful characters
const DATE_PATTERN = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/;
const AMOUNT_PATTERN = /\d{1,3}(?:,\d{2,3})*\.\d{2}/;

export interface OCRResult {
    text: string;
    confidence: number;       // 0-100, average Vision API confidence
    pageCount: number;
    engine: 'google-vision';
}

class OCRService {

    private client: ImageAnnotatorClient | null = null;

    private getClient(): ImageAnnotatorClient {
        if (!this.client) {

            if (process.env.GOOGLE_VISION_KEY_FILE) {
                // ✅ Option 1: Explicit service account JSON key file (local dev)
                this.client = new ImageAnnotatorClient({
                    keyFilename: process.env.GOOGLE_VISION_KEY_FILE,
                });

            } else if (process.env.GOOGLE_VISION_CLIENT_EMAIL && process.env.GOOGLE_VISION_PRIVATE_KEY) {
                // ✅ Option 2: Env vars (production — no JSON file needed)
                const privateKey = process.env.GOOGLE_VISION_PRIVATE_KEY.replace(/\\n/g, '\n');
                this.client = new ImageAnnotatorClient({
                    credentials: {
                        client_email: process.env.GOOGLE_VISION_CLIENT_EMAIL,
                        private_key:  privateKey,
                    },
                });

            } else {
                // ✅ Option 3: Fallback to Google Drive service account credentials
                const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
                const privateKey  = (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

                if (clientEmail && privateKey.includes('BEGIN PRIVATE KEY')) {
                    this.client = new ImageAnnotatorClient({
                        credentials: { client_email: clientEmail, private_key: privateKey },
                    });
                } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                    this.client = new ImageAnnotatorClient();
                } else {
                    throw new Error(
                        'Google Vision: No credentials found. ' +
                        'Set GOOGLE_VISION_CLIENT_EMAIL + GOOGLE_VISION_PRIVATE_KEY in production, ' +
                        'or GOOGLE_VISION_KEY_FILE in development.'
                    );
                }
            }
        }
        return this.client;
    }

    // ── Public: Should we trigger OCR? ────────────────────────────────────────

    /**
     * Determines if OCR should be triggered based on existing extracted text.
     * True when:
     *   1. MimeType is an image (always use Vision for images)
     *   2. PDF text is too short (scanned/image-based PDF)
     *   3. Text exists but has no numeric patterns (no dates or amounts found)
     */
    shouldTriggerOCR(extractedText: string, mimeType: string): boolean {
        if (mimeType.startsWith('image/')) return true;

        const clean = extractedText.trim();
        if (clean.length < TEXT_THRESHOLD) return true;

        const hasDate = DATE_PATTERN.test(clean);
        const hasAmount = AMOUNT_PATTERN.test(clean);
        if (!hasDate || !hasAmount) return true;

        return false;
    }

    // ── Public: Main extraction entry point ───────────────────────────────────

    /**
     * Extracts text from a file buffer using Google Vision OCR.
     * Supports: PDF (converted to images page-by-page), JPG, PNG, WEBP.
     */
    async extractText(buffer: Buffer, mimeType: string): Promise<OCRResult> {
        console.log(`[OCR] Starting extraction for mimeType: ${mimeType}`);

        if (mimeType === 'application/pdf') {
            return await this.extractFromPDF(buffer);
        } else if (mimeType.startsWith('image/')) {
            return await this.extractFromImage(buffer, mimeType);
        }

        throw new Error(`Unsupported mimeType for OCR: ${mimeType}`);
    }

    // ── Private: PDF handling ─────────────────────────────────────────────────

    private async extractFromPDF(pdfBuffer: Buffer): Promise<OCRResult> {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-pdf-'));

        try {
            // Use Google Vision's built-in PDF support via GCS,
            // OR convert each page to image and call Vision per-page.
            // We use the direct in-memory approach for small files (< 50 pages).
            const pages = await this.pdfToImages(pdfBuffer, tmpDir);

            if (pages.length === 0) {
                return { text: '', confidence: 0, pageCount: 0, engine: 'google-vision' };
            }

            const pageResults = await Promise.all(
                pages.map(p => this.callVisionAPI(p))
            );

            const fullText = pageResults.map(r => r.text).join('\n');
            const avgConf = pageResults.reduce((s, r) => s + r.confidence, 0) / pageResults.length;

            return {
                text: fullText,
                confidence: Math.round(avgConf),
                pageCount: pages.length,
                engine: 'google-vision',
            };
        } finally {
            // Always clean up temp images
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
        }
    }

    /**
     * Converts each PDF page to a high-res PNG image using pdf2pic.
     * Falls back to sending the raw PDF buffer to Vision if pdf2pic is unavailable.
     */
    private async pdfToImages(pdfBuffer: Buffer, tmpDir: string): Promise<Buffer[]> {
        try {
            // Dynamic import to avoid hard failure if pdf2pic/GM not installed
            const { fromBuffer } = await import('pdf2pic');

            const convert = fromBuffer(pdfBuffer, {
                density: 200,         // DPI — high enough for OCR accuracy
                saveFilename: 'page',
                savePath: tmpDir,
                format: 'png',
                width: 2480,        // A4 width at 200 DPI
                height: 3508,        // A4 height at 200 DPI
            });

            // Convert all pages (-1 = all)
            const results = await convert.bulk(-1, { responseType: 'buffer' });

            const buffers: Buffer[] = [];
            for (const result of results) {
                if (result.buffer) {
                    const preprocessed = await this.preprocessImage(result.buffer);
                    buffers.push(preprocessed);
                }
            }
            return buffers;

        } catch (err: any) {
            // pdf2pic failed (likely GM/Ghostscript not installed).
            // Fall back: send raw PDF directly to Vision API
            // Vision API natively supports PDFs up to 5 pages.
            console.warn('[OCR] pdf2pic unavailable, sending raw PDF to Vision:', err.message);
            return [pdfBuffer];
        }
    }

    // ── Private: Image handling ───────────────────────────────────────────────

    private async extractFromImage(imageBuffer: Buffer, mimeType: string): Promise<OCRResult> {
        const preprocessed = await this.preprocessImage(imageBuffer);
        const result = await this.callVisionAPI(preprocessed, mimeType);
        return { ...result, pageCount: 1, engine: 'google-vision' };
    }

    /**
     * Preprocesses an image for better OCR accuracy:
     * - Convert to greyscale (reduces noise)
     * - Boost contrast (helps with faded bank statement prints)
     * - Sharpen (helps with slightly blurry camera photos of statements)
     */
    private async preprocessImage(buffer: Buffer): Promise<Buffer> {
        try {
            return await sharp(buffer)
                .greyscale()
                .normalise()                    // auto-level histogram
                .sharpen({ sigma: 1.5 })        // light sharpening
                .linear(1.2, -(128 * 0.2))     // boost contrast
                .png()
                .toBuffer();
        } catch {
            // If sharp fails, return original
            return buffer;
        }
    }

    // ── Private: Vision API call ──────────────────────────────────────────────

    private async callVisionAPI(
        buffer: Buffer,
        mimeType?: string
    ): Promise<{ text: string; confidence: number }> {
        const client = this.getClient();

        const content = buffer.toString('base64');

        const request = {
            image: { content },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        };

        try {
            const [response] = await client.annotateImage(request as any);

            const fullText = response.fullTextAnnotation?.text || '';

            // Compute average word-level confidence
            let totalConf = 0;
            let wordCount = 0;
            for (const page of response.fullTextAnnotation?.pages || []) {
                for (const block of page.blocks || []) {
                    for (const para of block.paragraphs || []) {
                        for (const word of para.words || []) {
                            if (word.confidence != null) {
                                totalConf += word.confidence;
                                wordCount++;
                            }
                        }
                    }
                }
            }

            const confidence = wordCount > 0 ? Math.round((totalConf / wordCount) * 100) : 70;

            return { text: this.cleanOCRText(fullText), confidence };

        } catch (err: any) {
            console.error('[OCR] Vision API error:', err.message);
            throw new Error(`Google Vision OCR failed: ${err.message}`);
        }
    }

    // ── Private: Text cleaning ────────────────────────────────────────────────

    /**
     * Cleans raw OCR output:
     * - Remove form-feed characters
     * - Normalize whitespace within lines
     * - Fix common OCR confusion (O→0, l→1 in numeric contexts)
     */
    private cleanOCRText(raw: string): string {
        return raw
            .replace(/\f/g, '\n')
            .replace(/['']/g, "'")
            .replace(/[""]/g, '"')
            // Fix common digit mis-reads in numeric positions
            .replace(/(?<=\d)[Oo](?=\d)/g, '0')
            .replace(/(?<=\d)[Il](?=\d)/g, '1')
            // Normalize line endings
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Collapse excessive blank lines
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
}

export const ocrService = new OCRService();
