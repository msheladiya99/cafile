import { ITransactionRow } from '../models/BankStatement';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface AutoFixSuggestion {
    rowIndex: number;
    field:         'debit' | 'credit' | 'balance';
    currentValue:  number;
    suggestedValue: number;
    reason:        string;
    confidence:    number;    // 0–100: how confident is the fix?
}

export interface ValidationResult {
    rows:            ITransactionRow[];
    errors:          ValidationError[];
    suggestions:     AutoFixSuggestion[];
    suspiciousRows:  number[];
    missingRowAt:    number[];  // indices BEFORE which a gap is likely
    autoFixCount:    number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Tolerance for floating-point rounding errors in Indian bank PDF exports
const BALANCE_TOLERANCE = 0.06;

// If balance jumps by more than this without a transaction, flag a missing row
const MISSING_ROW_THRESHOLD = 1000;

// Suspicious amount thresholds for CA red-flag alerts
const LARGE_ROUND_AMOUNT = 50_000;

// ─── Validation Service ───────────────────────────────────────────────────────

class ValidationService {

    /**
     * Full validation pipeline — runs all checks and returns a rich result.
     * Called from parse.worker.ts after extraction.
     */
    validate(rows: ITransactionRow[]): ValidationResult {
        if (rows.length === 0) {
            return { rows, errors: [], suggestions: [], suspiciousRows: [], missingRowAt: [], autoFixCount: 0 };
        }

        const errors:      ValidationError[]    = [];
        const suggestions: AutoFixSuggestion[]  = [];
        const suspiciousRows: number[]          = [];
        const missingRowAt: number[]            = [];

        // Pass 1: normalize
        let processedRows = this.normalize(rows);

        // Pass 2: balance chain verification + auto-fix collection
        const chainResult = this.validateBalanceChain(processedRows);
        processedRows = chainResult.rows;
        errors.push(...chainResult.errors);
        suggestions.push(...chainResult.suggestions);
        missingRowAt.push(...chainResult.missingRowAt);

        // Pass 3: duplicate detection
        processedRows = this.detectDuplicates(processedRows);

        // Pass 4: suspicious transaction flagging
        const flagged = this.detectSuspicious(processedRows);
        processedRows = flagged.rows;
        suspiciousRows.push(...flagged.suspiciousIndices);

        return {
            rows:           processedRows,
            errors,
            suggestions,
            suspiciousRows,
            missingRowAt,
            autoFixCount:   0, // set to actual count after applying fixes
        };
    }

    /**
     * Applies auto-fix suggestions to rows.
     * Called when the user confirms "Apply Suggestions" in the UI.
     */
    applyFixes(rows: ITransactionRow[], suggestions: AutoFixSuggestion[]): ITransactionRow[] {
        const updated = [...rows];
        for (const fix of suggestions) {
            const row = updated[fix.rowIndex];
            if (!row) continue;
            (row as any)[fix.field] = fix.suggestedValue;
            row.autoFixed = true;
            row.hasError  = false;
            row.errorMessage = '';
        }
        return updated;
    }

    // ── normalize ─────────────────────────────────────────────────────────────

    normalize(rows: ITransactionRow[]): ITransactionRow[] {
        return rows.map((row, idx) => ({
            ...row,
            debit:    Math.abs(row.debit   || 0),
            credit:   Math.abs(row.credit  || 0),
            balance:  row.balance || 0,
            rowIndex: idx,
        }));
    }

    // ── validateBalanceChain ──────────────────────────────────────────────────

    validateBalanceChain(rows: ITransactionRow[]): {
        rows: ITransactionRow[];
        errors: ValidationError[];
        suggestions: AutoFixSuggestion[];
        missingRowAt: number[];
    } {
        const errors:      ValidationError[]   = [];
        const suggestions: AutoFixSuggestion[] = [];
        const missingRowAt: number[]           = [];

        if (rows.length === 0) return { rows, errors, suggestions, missingRowAt };

        // Opening balance inference: reverse-compute what the opening balance was
        const firstRow = rows[0];
        let lastBalance = firstRow.balance + (firstRow.debit || 0) - (firstRow.credit || 0);

        const updated = rows.map((row, idx) => {
            const isOpeningBal  = /opening|balance\s+b\/f|brought\s+forward/i.test(row.description);
            const expectedBalance = Math.round((lastBalance - (row.debit || 0) + (row.credit || 0)) * 100) / 100;
            const diff = Math.abs(row.balance - expectedBalance);

            if (diff > BALANCE_TOLERANCE && !(idx === 0 && isOpeningBal)) {

                // ── Auto-fix attempt ─────────────────────────────────────────

                // Case A: Rounding error (diff < 1.00) — fix balance
                if (diff < 1.00) {
                    suggestions.push({
                        rowIndex:       idx,
                        field:          'balance',
                        currentValue:   row.balance,
                        suggestedValue: expectedBalance,
                        reason:         `Rounding correction (off by ₹${diff.toFixed(2)})`,
                        confidence:     95,
                    });
                }

                // Case B: Debit/Credit may be swapped
                const swappedBalance = Math.round((lastBalance - (row.credit || 0) + (row.debit || 0)) * 100) / 100;
                if (Math.abs(row.balance - swappedBalance) < BALANCE_TOLERANCE) {
                    suggestions.push({
                        rowIndex:       idx,
                        field:          'debit',
                        currentValue:   row.debit,
                        suggestedValue: row.credit || 0,
                        reason:         'Debit and Credit appear to be swapped',
                        confidence:     85,
                    });
                }

                // Missing row detection: if the gap is large, a row might be missing
                if (Math.abs(row.balance - lastBalance) > MISSING_ROW_THRESHOLD && row.debit === 0 && row.credit === 0) {
                    missingRowAt.push(idx);
                }

                errors.push({
                    rowIndex: idx,
                    field:    'balance',
                    message:  `Balance mismatch at row ${idx + 1}. Expected ₹${expectedBalance.toFixed(2)}, got ₹${row.balance.toFixed(2)}.`,
                });

                lastBalance = row.balance;
                return { ...row, hasError: true, errorMessage: `Balance mismatch. Expected ₹${expectedBalance.toFixed(2)}` };
            }

            lastBalance = row.balance;
            return { ...row, hasError: false, errorMessage: '' };
        });

        return { rows: updated, errors, suggestions, missingRowAt };
    }

    // ── detectDuplicates ──────────────────────────────────────────────────────

    detectDuplicates(rows: ITransactionRow[]): ITransactionRow[] {
        const seen = new Set<string>();
        return rows.map(row => {
            const key = `${row.date}|${row.description.toLowerCase().trim()}|${row.debit}|${row.credit}`;
            if (seen.has(key)) {
                return {
                    ...row,
                    hasError:     true,
                    suspicious:   true,
                    errorMessage: (row.errorMessage ? row.errorMessage + ' ' : '') + 'Potential duplicate transaction.',
                };
            }
            seen.add(key);
            return row;
        });
    }

    // ── detectSuspicious ──────────────────────────────────────────────────────

    /**
     * Flags transactions that a CA should double-check:
     * 1. Large round-number transactions (₹50,000+ in even thousands)
     * 2. Same-day credit+debit for the same amount (possible circular transfer)
     * 3. Same description transacted more than 3 times in a month
     */
    detectSuspicious(rows: ITransactionRow[]): {
        rows: ITransactionRow[];
        suspiciousIndices: number[];
    } {
        const suspiciousIndices: number[] = [];
        const updated = [...rows];

        // Map: "YYYY-MM" → { debitMap, creditMap }
        const sameDayDebit  = new Map<string, number>();
        const sameDayCred   = new Map<string, number>();
        const descCount     = new Map<string, number>();

        for (let i = 0; i < updated.length; i++) {
            const row = updated[i];
            let flagged = false;
            const reasons: string[] = [];

            // Rule 1: Large round number
            const txAmt = row.debit || row.credit;
            if (txAmt && txAmt >= LARGE_ROUND_AMOUNT && txAmt % 1000 === 0) {
                reasons.push(`Large round amount ₹${txAmt.toLocaleString('en-IN')}`);
                flagged = true;
            }

            // Rule 2: Same-day equal debit+credit (circular)
            const dayKey = row.date;
            if (row.debit > 0) {
                sameDayDebit.set(dayKey, (sameDayDebit.get(dayKey) || 0) + row.debit);
            }
            if (row.credit > 0) {
                sameDayCred.set(dayKey, (sameDayCred.get(dayKey) || 0) + row.credit);
            }
            const dayDebit = sameDayDebit.get(dayKey) || 0;
            const dayCred  = sameDayCred.get(dayKey)  || 0;
            if (Math.abs(dayDebit - dayCred) < 1 && dayDebit > 10_000) {
                reasons.push('Equal debit+credit on same day (possible circular transfer)');
                flagged = true;
            }

            // Rule 3: Repeated description
            const descKey = row.description.toLowerCase().substring(0, 40);
            descCount.set(descKey, (descCount.get(descKey) || 0) + 1);
            if ((descCount.get(descKey) || 0) > 4) {
                reasons.push('Same narration repeated more than 4 times');
                flagged = true;
            }

            if (flagged) {
                suspiciousIndices.push(i);
                updated[i] = {
                    ...row,
                    suspicious:   true,
                    errorMessage: (row.errorMessage || '') + (reasons.length ? ` [Suspicious: ${reasons.join(', ')}]` : ''),
                };
            }
        }

        return { rows: updated, suspiciousIndices };
    }
}

export const validationService = new ValidationService();
