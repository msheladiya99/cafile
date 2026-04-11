import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';
import { checkCredits, deductCredits } from '../middleware/checkCredits';
import { BankStatement } from '../models/BankStatement';
import { CreditLedger, PLAN_LIMITS } from '../models/CreditLedger';
import { excelService } from '../services/excel.service';
import { computeTotals, parseLines } from '../services/bankStatementParser';
import { validationService } from '../services/validation.service';
import { storageService } from '../services/storage.service';
import { enqueueParsingTask, drainProgress } from '../queues/parse.queue';
import crypto from 'crypto';

const router = Router();

// ─── Multer Config ────────────────────────────────────────────────────────────

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 30 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'text/csv', 'image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, CSV, JPG, PNG files are allowed'));
        }
    },
});

// ─── Temp dir for legacy compat ───────────────────────────────────────────────

const EXCEL_DIR = path.join(process.cwd(), 'tmp', 'bank-excel');
fs.mkdir(EXCEL_DIR, { recursive: true }).catch(() => {});

// ─── Helper ───────────────────────────────────────────────────────────────────

function getModels(req: AuthRequest) {
    return (req as any).models || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /upload-process
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/upload-process',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    checkCredits(1),
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
        try {
            const { clientId } = req.body;
            if (!req.file)   return res.status(400).json({ message: 'No file uploaded' });
            if (!clientId)   return res.status(400).json({ message: 'clientId is required' });

            const { Client } = getModels(req);
            let clientData = null;
            if (Client) {
                clientData = await Client.findOne({ _id: clientId, firmId: req.firmId });
                if (!clientData) return res.status(404).json({ message: 'Client not found' });
            }

            // Duplicate detection via MD5 hash
            const hash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
            const existing = await BankStatement.findOne({ firmId: req.firmId, clientId, fileHash: hash });

            if (existing) {
                return res.status(200).json({
                    message:     'Duplicate detected. Returning existing statement.',
                    id:          existing._id,
                    status:      existing.status,
                    isDuplicate: true,
                    rows:        existing.extractedRows,
                    bankName:    existing.bankName,
                    confidence:  existing.confidence,
                });
            }

            // Upload to Google Drive
            const driveResult = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                clientData?.pan,
                clientData?.name
            );

            const statement = new BankStatement({
                firmId:           req.firmId,
                clientId,
                uploadedBy:       req.user!._id,
                originalFileName: req.file.originalname,
                fileHash:         hash,
                fileUrl:          driveResult.url,
                driveFileId:      driveResult.fileId,
                mimeType:         req.file.mimetype,
                status:           'uploaded',
            });

            await statement.save();

            // Deduct credit immediately (pre-paid model)
            await deductCredits(req, (statement._id as any).toString(), 'statement');

            // Enqueue background job
            await enqueueParsingTask({
                statementId:       (statement._id as any).toString(),
                firmId:            req.firmId!.toString(),
                clientId:          clientId.toString(),
                fileBufferBase64:  '',
                fileName:          req.file.originalname,
                mimeType:          req.file.mimetype,
            });

            return res.status(202).json({
                message:    'Upload successful. Processing started in background.',
                id:         statement._id,
                status:     'processing',
            });

        } catch (err: any) {
            console.error('[Route] upload-process error:', err);
            return res.status(500).json({ message: err.message || 'Upload failed' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /progress/:id  — Server-Sent Events for real-time parse progress
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/progress/:id',
    authenticate,
    async (req: AuthRequest, res: Response) => {
        const id = String(req.params.id);

        // SSE headers
        res.setHeader('Content-Type',  'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection',    'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');  // for nginx
        res.flushHeaders();

        const send = (data: object) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Poll progress store every 600ms for up to 5 minutes
        const MAX_WAIT_MS = 5 * 60 * 1000;
        const POLL_MS     = 600;
        let elapsed = 0;
        let done    = false;

        const tick = setInterval(async () => {
            elapsed += POLL_MS;

            // Drain any pending events from the worker
            const events = drainProgress(id);
            for (const evt of events) {
                send(evt);
                if (evt.step === 'done' || evt.step === 'error') {
                    done = true;
                }
            }

            // If not received from worker yet, check DB status as fallback
            if (!done) {
                try {
                    const stmt = await BankStatement.findById(id).select('status confidence transactionCount').lean();
                    if (stmt?.status === 'completed') {
                        send({ step: 'done', label: `Done! ${stmt.transactionCount} transactions extracted.`, progress: 100 });
                        done = true;
                    } else if (stmt?.status === 'failed') {
                        send({ step: 'error', label: 'Processing failed. Please try again.', progress: 100 });
                        done = true;
                    }
                } catch { /* ignore */ }
            }

            if (done || elapsed >= MAX_WAIT_MS) {
                clearInterval(tick);
                res.end();
            }
        }, POLL_MS);

        // Cleanup on client disconnect
        req.on('close', () => {
            clearInterval(tick);
            res.end();
        });
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /  — List all statements for the firm (for history page)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { clientId, status, page = '1', limit = '20' } = req.query as Record<string, string>;
            const filter: Record<string, unknown> = { firmId: req.firmId };
            if (clientId) filter.clientId = clientId;
            if (status)   filter.status   = status;

            const skip  = (parseInt(page) - 1) * parseInt(limit);
            const total = await BankStatement.countDocuments(filter);
            const statements = await BankStatement
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-extractedRows -rowConfidences')
                .lean();

            return res.json({ data: statements, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return res.status(500).json({ message: msg });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/:id/reprocess',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const stmt = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!stmt) return res.status(404).json({ message: 'Statement not found' });
            if (!stmt.driveFileId) return res.status(400).json({ message: 'No Drive file associated.' });

            stmt.status = 'uploaded';
            stmt.processingErrors = [];
            stmt.processingWarnings = [];
            await stmt.save();

            await enqueueParsingTask({
                statementId:      (stmt._id as any).toString(),
                firmId:           stmt.firmId.toString(),
                clientId:         stmt.clientId.toString(),
                fileBufferBase64: '',
                fileName:         stmt.originalFileName,
                mimeType:         stmt.mimeType || 'application/pdf',
            });

            return res.json({ message: 'Reprocessing started.', id: stmt._id });
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /:id/remap  — Column Mapper: re-parse with user-defined column indices
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/:id/remap',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { columnMapping, rawText } = req.body;
            // columnMapping: { date: 0, description: 1, debit: 3, credit: 4, balance: 5 }

            if (!columnMapping || !rawText) {
                return res.status(400).json({ message: 'columnMapping and rawText are required' });
            }

            const stmt = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!stmt) return res.status(404).json({ message: 'Statement not found' });

            // Parse the raw text lines using user-provided column mapping
            const lines = (rawText as string).split('\n');
            const rows = parseWithMapping(lines, columnMapping);

            // Run validation
            const validationResult = validationService.validate(rows);

            const { totalDebit, totalCredit } = computeTotals(validationResult.rows);
            stmt.extractedRows    = validationResult.rows;
            stmt.totalDebit       = totalDebit;
            stmt.totalCredit      = totalCredit;
            stmt.transactionCount = validationResult.rows.length;
            stmt.processingMethod = 'manual';
            stmt.status           = 'completed';
            await stmt.save();

            return res.json({
                message:     'Remapped successfully',
                rowCount:    validationResult.rows.length,
                errors:      validationResult.errors.length,
                suggestions: validationResult.suggestions.length,
                rows:        validationResult.rows,
            });

        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /:id/apply-fixes — Apply auto-fix suggestions
// ─────────────────────────────────────────────────────────────────────────────

router.post(
    '/:id/apply-fixes',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { suggestions } = req.body;
            if (!Array.isArray(suggestions)) return res.status(400).json({ message: 'suggestions must be an array' });

            const stmt = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!stmt) return res.status(404).json({ message: 'Statement not found' });

            const fixed = validationService.applyFixes(stmt.extractedRows as any, suggestions);
            const { totalDebit, totalCredit } = computeTotals(fixed);

            stmt.extractedRows   = fixed;
            stmt.totalDebit      = totalDebit;
            stmt.totalCredit     = totalCredit;
            stmt.autoFixApplied  = true;
            await stmt.save();

            return res.json({ message: `${suggestions.length} fix(es) applied`, rows: fixed });

        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /:id — Get statement with confidence data
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!statement) return res.status(404).json({ message: 'Bank statement not found' });
            return res.json(statement);
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /client/:clientId — List statements (no rows)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/client/:clientId',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statements = await BankStatement.find({ clientId: req.params.clientId, firmId: req.firmId })
                .sort({ createdAt: -1 })
                .select('-extractedRows -rowConfidences')
                .lean();
            return res.json(statements);
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /:id/rows — Update rows manually
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
    '/:id/rows',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const { rows } = req.body;
            if (!Array.isArray(rows)) return res.status(400).json({ message: 'rows must be an array' });

            const statement = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!statement) return res.status(404).json({ message: 'Bank statement not found' });

            const { totalDebit, totalCredit } = computeTotals(rows);
            statement.extractedRows    = rows;
            statement.totalDebit       = totalDebit;
            statement.totalCredit      = totalCredit;
            statement.transactionCount = rows.length;
            statement.status           = 'completed';
            await statement.save();

            return res.json({ message: 'Rows updated', totalDebit, totalCredit, transactionCount: rows.length });
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /:id/download-excel — Multi-sheet Excel via excelService
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/:id/download-excel',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER', 'STAFF']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOne({ _id: req.params.id, firmId: req.firmId });
            if (!statement) return res.status(404).json({ message: 'Bank statement not found' });
            if (statement.extractedRows.length === 0) return res.status(400).json({ message: 'No extracted rows to export' });

            const { Client } = getModels(req);
            let clientName = 'Client';
            if (Client) {
                const client = await Client.findById(statement.clientId).lean();
                if (client) clientName = (client as any).name || 'Client';
            }

            const excelBuffer = await excelService.generate(statement.extractedRows as any, {
                clientName,
                bankName:        statement.bankName     || 'Bank',
                accountNumber:   statement.accountNumber,
                statementPeriod: statement.statementPeriod,
                totalDebit:      statement.totalDebit,
                totalCredit:     statement.totalCredit,
                confidence:      statement.confidence,
                ocrUsed:         statement.ocrUsed,
            });

            const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeClientName}_bank_statement.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', excelBuffer.length);
            return res.send(excelBuffer);

        } catch (err: any) {
            console.error('[Route] Excel generation error:', err);
            return res.status(500).json({ message: err.message || 'Excel generation failed' });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /credits/balance — Firm's current credit balance
// ─────────────────────────────────────────────────────────────────────────────

router.get(
    '/credits/balance',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER']),
    async (req: AuthRequest, res: Response) => {
        try {
            let ledger = await CreditLedger.findOne({ firmId: req.firmId });
            if (!ledger) {
                ledger = await CreditLedger.create({
                    firmId: req.firmId,
                    planType: 'free',
                    monthlyLimit: PLAN_LIMITS.free,
                });
            }

            const now = new Date();
            // Auto-reset check
            if (now >= ledger.resetDate) {
                ledger.usedThisMonth = 0;
                ledger.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                await ledger.save();
            }

            const remaining = ledger.monthlyLimit === -1
                ? -1
                : ledger.monthlyLimit - ledger.usedThisMonth;

            return res.json({
                planType:      ledger.planType,
                monthlyLimit:  ledger.monthlyLimit,
                usedThisMonth: ledger.usedThisMonth,
                remaining:     remaining,
                resetsOn:      ledger.resetDate,
            });
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /:id
// ─────────────────────────────────────────────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRoles(['ADMIN', 'MANAGER']),
    async (req: AuthRequest, res: Response) => {
        try {
            const statement = await BankStatement.findOneAndDelete({ _id: req.params.id, firmId: req.firmId });
            if (!statement) return res.status(404).json({ message: 'Bank statement not found' });
            return res.json({ message: 'Bank statement deleted' });
        } catch (err: any) {
            return res.status(500).json({ message: err.message });
        }
    }
);

// ─── Helper: parse CSV/text lines with user-defined column mapping ─────────────

function parseWithMapping(
    lines: string[],
    mapping: { date?: number; description?: number; debit?: number; credit?: number; balance?: number }
): any[] {
    const { universalDate, parseAmt, cleanDescription, categorize } = require('../services/bankStatementParser');
    const rows: any[] = [];

    // Find data start (skip until we see a line with a valid date in the date column)
    let started = false;

    for (const raw of lines) {
        const cols = raw.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;

        const dateRaw = mapping.date != null ? (cols[mapping.date] || '') : '';
        const date    = universalDate(dateRaw);
        if (!date) {
            if (!started) continue;  // skip header lines
            continue;
        }
        started = true;

        rows.push({
            date,
            description: cleanDescription(mapping.description != null ? (cols[mapping.description] || '') : ''),
            debit:       parseAmt(mapping.debit  != null ? (cols[mapping.debit]  || '') : ''),
            credit:      parseAmt(mapping.credit != null ? (cols[mapping.credit] || '') : ''),
            balance:     parseAmt(mapping.balance != null ? (cols[mapping.balance] || '') : ''),
            category:    categorize(mapping.description != null ? (cols[mapping.description] || '') : ''),
            hasError:    false,
            rowIndex:    rows.length,
        });
    }

    return rows;
}

export default router;
