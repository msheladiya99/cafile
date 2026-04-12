import { Worker, Job } from 'bullmq';
import { redisConnection, pushProgress } from './parse.queue';
import { BankStatement } from '../models/BankStatement';
import { parsePDF, detectBankName } from '../services/bankStatementParser';
import { aiParserService }           from '../services/aiParser.service';
import { validationService }          from '../services/validation.service';
import { ocrService }                 from '../services/ocr.service';
import { storageService }             from '../services/storage.service';
import type { ITransactionRow }       from '../models/BankStatement';

// ─── Per-bank confidence thresholds ──────────────────────────────────────────

const BANK_AI_THRESHOLD: Record<string, number> = {
    'HDFC Bank':                  80,
    'ICICI Bank':                 85,
    'State Bank of India (SBI)':  75,
    'Axis Bank':                  78,
    'Kotak Mahindra Bank':        80,
    'Punjab National Bank':       70,
    'Bank of Baroda':             70,
    'Jio Payments Bank':          72,
    'Paytm Payments Bank':        72,
    'Airtel Payments Bank':       72,
    DEFAULT:                      65,
};

function getAIThreshold(bankName: string): number {
    return BANK_AI_THRESHOLD[bankName] ?? BANK_AI_THRESHOLD.DEFAULT;
}

/**
 * Sorts transactions chronologically (ascending).
 * Standardizes date parsing to handle common Indian DMY formats.
 */
function sortTransactions(rows: ITransactionRow[]): ITransactionRow[] {
    const parseDMY = (d: string) => {
        if (!d) return 0;
        const parts = d.split('/');
        if (parts.length !== 3) return 0;
        const [dd, mm, yyyy] = parts;
        return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0;
    };
    
    const sorted = [...rows].sort((a, b) => parseDMY(a.date) - parseDMY(b.date));
    return sorted.map((r, i) => ({ ...r, rowIndex: i }));
}

// ─── AI Text Chunker ──────────────────────────────────────────────────────────
// Splits large text into ≤2000-line chunks, parses each with AI, merges results.

const CHUNK_SIZE = 2000; // lines per AI call

async function aiParseChunked(
    rawText:  string,
    bankName: string
): Promise<ITransactionRow[]> {
    const lines  = rawText.split('\n');
    const chunks: string[][] = [];

    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        chunks.push(lines.slice(i, i + CHUNK_SIZE));
    }

    console.log(`[AI Chunker] Text split into ${chunks.length} chunk(s) of ≤${CHUNK_SIZE} lines`);

    const allRows: ITransactionRow[] = [];

    for (let ci = 0; ci < chunks.length; ci++) {
        const chunkText = chunks[ci].join('\n');
        try {
            const result = await aiParserService.parseStatement(chunkText, false, bankName);
            const rows = result.transactions.map((t, idx): ITransactionRow => ({
                date:         t.date,
                description:  t.description,
                debit:        t.debit   != null ? Math.abs(t.debit)  : 0,
                credit:       t.credit  != null ? Math.abs(t.credit) : 0,
                balance:      t.balance != null ? t.balance : 0,
                category:     t.category    || 'Miscellaneous',
                subcategory:  t.subcategory || '',
                hasError:     t.confidence < 60,
                errorMessage: t.error_reason || '',
                confidence:   t.confidence,
                rowIndex:     allRows.length + idx,
            }));
            allRows.push(...rows);
            console.log(`[AI Chunker] Chunk ${ci + 1}/${chunks.length}: ${rows.length} rows`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[AI Chunker] Chunk ${ci + 1} failed: ${msg}`);
            // continue — partial results are better than none
        }
    }
    return allRows;
}

// ─── Duplicate row deduplication ─────────────────────────────────────────────

function deduplicateRows(rows: ITransactionRow[]): ITransactionRow[] {
    const seen = new Set<string>();
    return rows.filter(r => {
        const key = `${r.date}|${r.debit}|${r.credit}|${r.description.substring(0, 30)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ─── Worker ───────────────────────────────────────────────────────────────────

type ProcessingMethod = 'pdf-parse' | 'ocr' | 'manual' | 'ai';

export const parseWorker = new Worker(
    'bank-statement-parsing',

    async (job: Job) => {
        const { statementId, mimeType } = job.data as {
            statementId: string;
            mimeType:    string;
        };
        const startTime = Date.now();

        // Helper: emit SSE progress
        const progress = (step: string, label: string, pct: number) => {
            job.updateProgress(pct).catch(() => {});
            pushProgress(statementId, { step, label, progress: pct, timestamp: Date.now() });
        };

        const stmt = await BankStatement.findById(statementId);
        if (!stmt) throw new Error(`Statement ${statementId} not found`);

        try {
            stmt.status = 'processing';
            await stmt.save();

            // ── Step 1: Fetch file ─────────────────────────────────────────────
            progress('fetch', 'Fetching file...', 5);
            let buffer: Buffer;
            if (stmt.driveFileId) {
                buffer = await storageService.downloadFile(stmt.driveFileId);
            } else {
                throw new Error('No Drive file associated with this statement.');
            }

            // ── Step 2: PDF parse ──────────────────────────────────────────────
            progress('parse', 'Reading document...', 15);
            let rawText       = '';
            let ocrUsed       = false;
            let method: ProcessingMethod = 'pdf-parse';
            let extractedRows: ITransactionRow[] = [];

            if (!mimeType?.startsWith('image/')) {
                try {
                    const pdfResult = await parsePDF(buffer);
                    rawText = pdfResult.rawText || '';
                    stmt.bankName        = pdfResult.bankName;
                    stmt.accountNumber   = pdfResult.accountNumber   || '';
                    stmt.statementPeriod = pdfResult.statementPeriod || '';
                    stmt.processingErrors   = pdfResult.errors;
                    stmt.processingWarnings = pdfResult.warnings;
                } catch (pdfErr: unknown) {
                    const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
                    console.warn(`[Worker ${statementId}] pdf-parse failed: ${msg}`);
                }
            }

            // ── Step 3: OCR decision ───────────────────────────────────────────
            const needsOCR = ocrService.shouldTriggerOCR(rawText, mimeType || 'application/pdf');
            if (needsOCR) {
                progress('ocr', 'Running OCR (scanned document)...', 30);
                try {
                    const ocrResult = await ocrService.extractText(buffer, mimeType || 'application/pdf');
                    rawText   = ocrResult.text;
                    ocrUsed   = true;
                    method    = 'ocr';
                    stmt.metadata = {
                        ...stmt.metadata,
                        ocrEngine:    ocrResult.engine,
                        ocrPageCount: ocrResult.pageCount,
                    };
                    if (!stmt.bankName || stmt.bankName === 'UNKNOWN BANK') {
                        stmt.bankName = detectBankName(rawText);
                    }
                    console.log(`[Worker ${statementId}] OCR: ${ocrResult.pageCount} pages, conf ${ocrResult.confidence}%`);
                } catch (ocrErr: unknown) {
                    const msg = ocrErr instanceof Error ? ocrErr.message : String(ocrErr);
                    stmt.processingWarnings.push(`OCR failed: ${msg}`);
                }
            }

            // ── Step 4: Rule-based extraction ──────────────────────────────────
            progress('rule', 'Extracting transactions (rule engine)...', 45);
            if (rawText.trim()) {
                const { parseLines } = await import('../services/bankStatementParser');
                extractedRows = parseLines(rawText.split('\n'));
            }

            const errorRows = extractedRows.filter(r => r.hasError).length;
            const totalRows = extractedRows.length;
            const ruleConf  = totalRows > 0 ? Math.round((1 - errorRows / totalRows) * 100) : 0;
            const bankName  = stmt.bankName || 'Unknown';
            const aiThreshold = getAIThreshold(bankName);

            console.log(`[Worker ${statementId}] Rule: ${totalRows} rows, conf ${ruleConf}% (threshold: ${aiThreshold}% for ${bankName})`);

            // ── Step 5: AI fallback ────────────────────────────────────────────
            let overallConfidence = ruleConf;
            let aiNotes: string[] = [];
            const needsAI = totalRows === 0 || ruleConf < aiThreshold || ocrUsed;

            if (needsAI) {
                progress('ai', 'Running AI analysis (Gemini)...', 60);
                console.log(`[Worker ${statementId}] AI triggered (conf ${ruleConf}% < ${aiThreshold}%, ocrUsed=${ocrUsed})`);

                try {
                    let aiRows: ITransactionRow[];
                    const lineCount = rawText.split('\n').length;

                    if (lineCount > CHUNK_SIZE) {
                        // Large statement → chunked AI parse
                        progress('ai', `AI: processing ${Math.ceil(lineCount / CHUNK_SIZE)} chunks...`, 62);
                        aiRows = await aiParseChunked(rawText, bankName);
                    } else {
                        // Single AI call
                        const aiInput  = rawText.trim().length > 100 ? rawText : buffer.toString('base64');
                        const isImage  = rawText.trim().length < 100;
                        const aiMime   = isImage ? (mimeType || 'image/jpeg') : 'text/plain';
                        const aiResult = await aiParserService.parseStatement(aiInput, isImage, bankName, aiMime);

                        aiRows = aiResult.transactions.map((t, idx): ITransactionRow => ({
                            date:         t.date,
                            description:  t.description,
                            debit:        t.debit   != null ? Math.abs(t.debit)  : 0,
                            credit:       t.credit  != null ? Math.abs(t.credit) : 0,
                            balance:      t.balance != null ? t.balance : 0,
                            category:     t.category    || 'Miscellaneous',
                            subcategory:  t.subcategory || '',
                            hasError:     t.confidence < 60,
                            errorMessage: t.error_reason || '',
                            confidence:   t.confidence,
                            rowIndex:     idx,
                        }));

                        overallConfidence = aiResult.overall_confidence;
                        aiNotes           = aiResult.parsing_notes;

                        if (aiResult.bank_name && aiResult.bank_name !== 'UNKNOWN') {
                            stmt.bankName = aiResult.bank_name;
                        }
                        stmt.accountNumber   = aiResult.account_number   || stmt.accountNumber;
                        stmt.statementPeriod = aiResult.statement_period || stmt.statementPeriod;
                    }

                    // Use AI rows only if they are better than rule-based
                    if (aiRows.length >= extractedRows.length || ruleConf < 40) {
                        extractedRows = aiRows;
                    }

                    method = 'ai';
                    stmt.metadata = { ...stmt.metadata, aiProvider: 'gemini-1.5-flash' };
                    console.log(`[Worker ${statementId}] AI: ${extractedRows.length} rows, conf ${overallConfidence}%`);

                } catch (aiErr: unknown) {
                    const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
                    console.error(`[Worker ${statementId}] AI failed: ${msg}`);
                    stmt.processingErrors.push(`AI parsing failed: ${msg}`);
                }
            }

            // ── Step 6: Sorting + Deduplication + Validation ──────────────────────────
            progress('validate', 'Validating & cleaning data...', 78);
            
            extractedRows = sortTransactions(extractedRows);
            extractedRows = deduplicateRows(extractedRows);
            
            const validationResult = validationService.validate(extractedRows);
            const processedRows    = validationResult.rows;

            if (validationResult.suggestions.length > 0) {
                stmt.processingWarnings.push(`${validationResult.suggestions.length} auto-fix suggestion(s) available.`);
            }
            if (validationResult.missingRowAt.length > 0) {
                stmt.processingWarnings.push(`Possible missing rows at: ${validationResult.missingRowAt.join(', ')}`);
            }
            if (aiNotes.length > 0) {
                stmt.processingWarnings.push(...aiNotes);
            }

            // ── Step 7: Final save ─────────────────────────────────────────────
            progress('saving', 'Saving results...', 90);
            const totalDebit  = processedRows.reduce((s, r) => s + (r.debit  || 0), 0);
            const totalCredit = processedRows.reduce((s, r) => s + (r.credit || 0), 0);

            stmt.extractedRows      = processedRows;
            stmt.totalDebit         = Math.round(totalDebit  * 100) / 100;
            stmt.totalCredit        = Math.round(totalCredit * 100) / 100;
            stmt.transactionCount   = processedRows.length;
            stmt.processingMethod   = method;
            stmt.confidence         = overallConfidence;
            stmt.rowConfidences     = processedRows.map(r => r.confidence ?? 100);
            stmt.ocrUsed            = ocrUsed;
            stmt.suspiciousRowCount = validationResult.suspiciousRows.length;
            stmt.missingRowCount    = validationResult.missingRowAt.length;
            stmt.status             = 'completed';
            stmt.metadata           = { ...stmt.metadata, processingTimeMs: Date.now() - startTime };

            await stmt.save();
            progress('done', `Done! ${processedRows.length} transactions extracted.`, 100);
            console.log(`[Worker ${statementId}] ✅ ${method.toUpperCase()} in ${Date.now() - startTime}ms | ${processedRows.length} rows | conf ${overallConfidence}%`);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[Worker ${statementId}] ❌ Failed: ${msg}`);
            stmt.status = 'failed';
            stmt.processingErrors.push(msg || 'Unknown error during processing');
            await stmt.save();
            progress('error', `Processing failed: ${msg}`, 100);
            throw err;
        }
    },

    {
        connection:  redisConnection,
        concurrency: 3,
        stalledInterval: 30_000,
        maxStalledCount: 2,
    }
);

// ─── Worker events ────────────────────────────────────────────────────────────

parseWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed (${job?.attemptsMade}/${job?.opts?.attempts} attempts): ${err.message}`);
});

parseWorker.on('completed', job => {
    console.log(`[BullMQ] ✅ Job ${job.id} completed`);
});

parseWorker.on('error', err => {
    console.error('[BullMQ Worker Error]', err.message);
});
