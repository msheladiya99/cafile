import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { BankStatement } from '../models/BankStatement';
import { parsePDF, detectBankName } from '../services/bankStatementParser';
import { aiParserService } from '../services/aiParser.service';
import { validationService } from '../services/validation.service';
import { ocrService } from '../services/ocr.service';
import { storageService } from '../services/storage.service';

// ─── Config ───────────────────────────────────────────────────────────────────

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Confidence threshold below which AI is triggered
const AI_CONFIDENCE_THRESHOLD = 60;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const parseWorker = new Worker('bank-statement-parsing', async (job: Job) => {

    const { statementId, mimeType } = job.data;
    const startTime = Date.now();

    const stmt = await BankStatement.findById(statementId);
    if (!stmt) throw new Error(`Statement ${statementId} not found in database`);

    try {
        stmt.status = 'processing';
        await stmt.save();

        // ── 1. Fetch file buffer ───────────────────────────────────────────────
        let buffer: Buffer;
        if (stmt.driveFileId) {
            console.log(`[Worker ${statementId}] Fetching from Drive: ${stmt.driveFileId}`);
            buffer = await storageService.downloadFile(stmt.driveFileId);
        } else {
            throw new Error('No Drive file ID associated with this statement.');
        }

        // ── 2. Extract text (pdf-parse first) ────────────────────────────────
        let rawText   = '';
        let ocrUsed   = false;
        let method: IBankStatement_ProcessingMethod  = 'pdf-parse';
        let extractedRows: import('../models/BankStatement').ITransactionRow[] = [];

        if (mimeType === 'application/pdf' || !mimeType?.startsWith('image/')) {
            try {
                const pdfResult = await parsePDF(buffer);
                rawText = pdfResult.rawText || '';

                // Copy initial parser results
                stmt.bankName         = pdfResult.bankName;
                stmt.accountNumber    = pdfResult.accountNumber || '';
                stmt.statementPeriod  = pdfResult.statementPeriod || '';
                stmt.processingErrors = pdfResult.errors;
                stmt.processingWarnings = pdfResult.warnings;

            } catch (pdfErr: any) {
                console.warn(`[Worker ${statementId}] pdf-parse failed: ${pdfErr.message}`);
            }
        }

        // ── 3. OCR Decision ───────────────────────────────────────────────────
        if (ocrService.shouldTriggerOCR(rawText, mimeType || 'application/pdf')) {
            console.log(`[Worker ${statementId}] OCR triggered (text length: ${rawText.length}, mime: ${mimeType})`);

            try {
                const ocrResult = await ocrService.extractText(buffer, mimeType || 'application/pdf');
                rawText  = ocrResult.text;
                ocrUsed  = true;
                method   = 'ocr';

                stmt.metadata = {
                    ...stmt.metadata,
                    ocrEngine:   ocrResult.engine,
                    ocrPageCount: ocrResult.pageCount,
                };

                // Re-detect bank from OCR text if still unknown
                if (!stmt.bankName || stmt.bankName === 'UNKNOWN BANK') {
                    stmt.bankName = detectBankName(rawText);
                }

                console.log(`[Worker ${statementId}] OCR complete. Pages: ${ocrResult.pageCount}, Confidence: ${ocrResult.confidence}%`);

            } catch (ocrErr: any) {
                console.error(`[Worker ${statementId}] OCR failed: ${ocrErr.message}`);
                stmt.processingWarnings.push(`OCR failed: ${ocrErr.message}. Falling back to AI text-only.`);
            }
        }

        // ── 4. Rule-based extraction ──────────────────────────────────────────
        if (rawText.trim()) {
            const { parseLines } = await import('../services/bankStatementParser');
            extractedRows = parseLines(rawText.split('\n'));
        }

        const errorRows  = extractedRows.filter(r => r.hasError).length;
        const totalRows  = extractedRows.length;
        const errorRate  = totalRows > 0 ? errorRows / totalRows : 1;
        const ruleConf   = totalRows > 0 ? Math.round((1 - errorRate) * 100) : 0;

        console.log(`[Worker ${statementId}] Rule-based: ${totalRows} rows, ${errorRows} errors, conf: ${ruleConf}%`);

        // ── 5. AI Fallback Decision ───────────────────────────────────────────
        let overallConfidence = ruleConf;
        let aiParsingNotes: string[] = [];

        const needsAI = totalRows === 0 || ruleConf < AI_CONFIDENCE_THRESHOLD;

        if (needsAI) {
            console.log(`[Worker ${statementId}] Triggering AI (confidence ${ruleConf}% < threshold ${AI_CONFIDENCE_THRESHOLD}%)`);

            try {
                // Use OCR'd text if available, otherwise try base64 image
                const aiInput   = rawText.trim().length > 100 ? rawText : buffer.toString('base64');
                const isImage   = rawText.trim().length < 100;
                const aiMime    = isImage ? (mimeType || 'image/jpeg') : 'text/plain';

                const aiResult = await aiParserService.parseStatement(
                    aiInput, isImage, stmt.bankName || 'Unknown', aiMime
                );

                extractedRows = aiResult.transactions.map((t, idx) => ({
                    date:           t.date,
                    description:    t.description,
                    debit:          t.debit   != null ? Math.abs(t.debit)   : 0,
                    credit:         t.credit  != null ? Math.abs(t.credit)  : 0,
                    balance:        t.balance != null ? t.balance : 0,
                    category:       t.category    || 'Miscellaneous',
                    subcategory:    t.subcategory || '',
                    hasError:       t.confidence < 60,
                    errorMessage:   t.error_reason || '',
                    confidence:     t.confidence,
                    rowIndex:       idx,
                }));

                overallConfidence = aiResult.overall_confidence;
                aiParsingNotes    = aiResult.parsing_notes;

                // Update metadata from AI
                if (aiResult.bank_name && aiResult.bank_name !== 'UNKNOWN') {
                    stmt.bankName = aiResult.bank_name;
                }
                stmt.accountNumber   = aiResult.account_number   || stmt.accountNumber;
                stmt.statementPeriod = aiResult.statement_period || stmt.statementPeriod;

                method = 'ai';
                stmt.metadata = {
                    ...stmt.metadata,
                    aiProvider: 'gemini-1.5-flash',
                };

                console.log(`[Worker ${statementId}] AI: ${extractedRows.length} rows, conf: ${overallConfidence}%`);

            } catch (aiErr: any) {
                console.error(`[Worker ${statementId}] AI parsing failed: ${aiErr.message}`);
                stmt.processingErrors.push(`AI parsing failed: ${aiErr.message}`);
            }
        }

        // ── 6. Validation Pipeline ────────────────────────────────────────────
        const validationResult = validationService.validate(extractedRows);
        let processedRows      = validationResult.rows;

        // Collect suggestions as warnings for UI
        if (validationResult.suggestions.length > 0) {
            stmt.processingWarnings.push(
                `${validationResult.suggestions.length} auto-fix suggestion(s) available. Review in the editor.`
            );
        }

        if (validationResult.missingRowAt.length > 0) {
            stmt.processingWarnings.push(
                `Possible missing rows detected at positions: ${validationResult.missingRowAt.join(', ')}`
            );
        }

        if (aiParsingNotes.length > 0) {
            stmt.processingWarnings.push(...aiParsingNotes);
        }

        // ── 7. Compute totals ─────────────────────────────────────────────────
        const totalDebit  = processedRows.reduce((s, r) => s + (r.debit  || 0), 0);
        const totalCredit = processedRows.reduce((s, r) => s + (r.credit || 0), 0);
        const rowConfidences = processedRows.map(r => r.confidence ?? 100);

        // ── 8. Final save ─────────────────────────────────────────────────────
        stmt.extractedRows    = processedRows;
        stmt.totalDebit       = Math.round(totalDebit  * 100) / 100;
        stmt.totalCredit      = Math.round(totalCredit * 100) / 100;
        stmt.transactionCount = processedRows.length;
        stmt.processingMethod = method;
        stmt.confidence       = overallConfidence;
        stmt.rowConfidences   = rowConfidences;
        stmt.ocrUsed          = ocrUsed;
        stmt.suspiciousRowCount = validationResult.suspiciousRows.length;
        stmt.missingRowCount  = validationResult.missingRowAt.length;
        stmt.status           = 'completed';
        stmt.metadata = {
            ...stmt.metadata,
            processingTimeMs: Date.now() - startTime,
        };

        await stmt.save();
        console.log(`[Worker ${statementId}] ✅ Done via ${method} in ${Date.now() - startTime}ms`);

    } catch (err: any) {
        console.error(`[Worker ${statementId}] ❌ Failed:`, err.message);
        stmt.status = 'failed';
        stmt.processingErrors.push(err.message || 'Unknown error during background processing');
        await stmt.save();
        throw err;
    }

}, { connection, concurrency: 3 });

// ─── Worker events ────────────────────────────────────────────────────────────

parseWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} permanently failed: ${err.message}`);
});

parseWorker.on('completed', job => {
    console.log(`[BullMQ] Job ${job.id} completed.`);
});

// ─── Type alias (local use) ───────────────────────────────────────────────────
type IBankStatement_ProcessingMethod = 'pdf-parse' | 'ocr' | 'manual' | 'ai';
