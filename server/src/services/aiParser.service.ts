import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AITransaction {
    date: string;
    description: string;
    debit: number | null;
    credit: number | null;
    balance: number | null;
    category: string;
    subcategory: string;
    confidence: number;       // 0–100 per row
    error_reason: string | null;
}

export interface AIParseResult {
    bank_name: string;
    account_number: string | null;
    statement_period: string | null;
    overall_confidence: number;   // 0–100 overall
    transactions: AITransaction[];
    parsing_notes: string[];      // warnings/issues the AI noticed
}

// ─── Bank-specific column hints (injected into prompts) ───────────────────────
// This dramatically improves accuracy for known banks.

const BANK_COLUMN_HINTS: Record<string, string> = {
    'HDFC Bank': 'Columns: Date | Narration | Chq/Ref No | Value Dt | Withdrawal Amt (Dr) | Deposit Amt (Cr) | Closing Balance',
    'State Bank of India (SBI)': 'Columns: Txn Date | Value Date | Description | Ref No./Cheque No. | Debit | Credit | Balance',
    'ICICI Bank': 'Columns: S No. | Transaction Date | Value Date | Transaction Remarks | Cheque Number | Withdrawal Amount (INR ) | Deposit Amount (INR ) | Balance (INR )',
    'Axis Bank': 'Columns: Tran Date | CHQNO | Particulars | Debit | Credit | Balance',
    'Kotak Mahindra Bank': 'Columns: Date | Description | Chq/Ref Number | Value Date | Withdrawal | Deposit | Balance',
    'Punjab National Bank': 'Columns: Date | Particulars | Cheque No. | Debit | Credit | Balance',
    'Bank of Baroda': 'Columns: Date | Cheque No | Narration | Debit | Credit | Balance',
    'Canara Bank': 'Columns: Date | Transaction Details | Chq. No. | Debit | Credit | Balance',
    'Union Bank of India': 'Columns: Date | Transaction Id | Description | Chq No. | Debit | Credit | Balance',
    'IndusInd Bank': 'Columns: Date | Transaction Details | Cheque No. | Debit (₹) | Credit (₹) | Balance (₹)',
    'Yes Bank': 'Columns: Date | Transaction Date | Narration | Reference No. | Debit | Credit | Balance',
    'Federal Bank': 'Columns: Date | Particulars | Cheque No. | Debit | Credit | Balance',
};

// ─── AI Parser Service ────────────────────────────────────────────────────────

class AIParserService {
    private genAI: GoogleGenerativeAI;

    private readonly GENERATION_CONFIG: GenerationConfig = {
        responseMimeType: 'application/json',
        temperature:       0.1,        // low = deterministic, good for extraction
        maxOutputTokens:   8192,
    };

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables');
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // ── Main parse method ─────────────────────────────────────────────────────

    /**
     * Parses a bank statement from raw text or base64 image data.
     * Returns a structured result with per-row confidence scores.
     */
    async parseStatement(
        input: string,
        isImage: boolean = false,
        bankName: string = 'Unknown',
        mimeType: string = 'image/jpeg'
    ): Promise<AIParseResult> {

        const model = this.genAI.getGenerativeModel(
            { model: 'gemini-1.5-flash', generationConfig: this.GENERATION_CONFIG },
            { apiVersion: 'v1' }
        );

        const prompt = this.buildPrompt(bankName);

        let result;
        if (isImage) {
            result = await model.generateContent([
                prompt,
                { inlineData: { data: input, mimeType } },
            ]);
        } else {
            result = await model.generateContent([prompt, input]);
        }

        const text = result.response.text();

        let parsed: AIParseResult;
        try {
            parsed = JSON.parse(text);
        } catch {
            console.error('[AI Parser] Failed to parse JSON response:', text.substring(0, 500));
            throw new Error('AI returned malformed JSON. Input may be too complex or truncated.');
        }

        // Validate & sanitize the AI output before returning
        return this.sanitizeResult(parsed, bankName);
    }

    // ── Prompt builder ────────────────────────────────────────────────────────

    private buildPrompt(bankName: string): string {
        const columnHint = BANK_COLUMN_HINTS[bankName]
            ? `\nKNOWN FORMAT FOR ${bankName.toUpperCase()}: ${BANK_COLUMN_HINTS[bankName]}`
            : '';

        return `
You are a CA-grade Indian bank statement parser with expert knowledge of all major Indian banks.
You ALWAYS return valid JSON matching the exact schema below.
${columnHint}

TASK: Extract ALL transactions from the provided bank statement content.

STRICT RULES:
1. DATE: Normalize ALL dates to "DD/MM/YYYY" format ONLY. Never use any other format.
2. AMOUNTS: Return decimal numbers (no commas). Use null if genuinely absent.
3. BALANCE: Always extract the running/closing balance for EACH row. Never null if visible.
4. DESCRIPTION: Remove long alphanumeric IDs (>8 chars), timestamps (HH:MM:SS), and "/DR/" "/CR/" prefixes. Keep: merchant name, counterparty, payment mode.
5. CATEGORY: Use one of these exact values: Salary | Income | Transfer | UPI Transfer | NEFT Transfer | RTGS Transfer | IMPS Transfer | EMI/Loan | Tax/GST | Insurance | Investments | Rent | Food & Dining | Travel | Shopping | Medical | Education | Utility Bills | Fuel | ATM | Cash | Cheque | Savings/FD | Miscellaneous
6. SUBCATEGORY: A more specific label (e.g., "HDFC Life", "Swiggy", "Electricity")
7. CONFIDENCE (per row): 0-100. Assign lower confidence when:
   - Date is ambiguous or approximated
   - Amount has to be inferred (only one amount column, no separate debit/credit)
   - Balance does not math-check with previous row
8. ERROR_REASON: If confidence < 70, briefly explain why (e.g., "balance mismatch", "date ambiguous")
9. OVERALL_CONFIDENCE: Average of all row confidences, from 0-100.
10. NEVER invent transactions. Only extract what is explicitly visible.
11. NEVER skip a transaction row even if partially readable.

OUTPUT JSON SCHEMA (STRICT — no extra keys, no missing keys):
{
  "bank_name": "Full bank name (e.g., HDFC Bank) or UNKNOWN if not found",
  "account_number": "XXXXXXXXX (last 4 digits unmasked if visible) or null",
  "statement_period": "DD/MM/YYYY - DD/MM/YYYY or null",
  "overall_confidence": <integer 0-100>,
  "parsing_notes": ["any issues you noticed, e.g., 'page 3 text was unclear'"],
  "transactions": [
    {
      "date": "DD/MM/YYYY",
      "description": "Clean description",
      "debit": <number or null>,
      "credit": <number or null>,
      "balance": <number or null>,
      "category": "<from allowed list>",
      "subcategory": "<specific label>",
      "confidence": <integer 0-100>,
      "error_reason": "<string or null>"
    }
  ]
}
`.trim();
    }

    // ── Output sanitizer ──────────────────────────────────────────────────────

    private sanitizeResult(raw: any, bankName: string): AIParseResult {
        const transactions: AITransaction[] = (raw.transactions || []).map((t: any, idx: number) => ({
            date:         typeof t.date === 'string' ? t.date : '',
            description:  typeof t.description === 'string' ? t.description.substring(0, 250) : '',
            debit:        typeof t.debit === 'number' ? Math.abs(t.debit) : null,
            credit:       typeof t.credit === 'number' ? Math.abs(t.credit) : null,
            balance:      typeof t.balance === 'number' ? t.balance : null,
            category:     typeof t.category === 'string' ? t.category : 'Miscellaneous',
            subcategory:  typeof t.subcategory === 'string' ? t.subcategory : '',
            confidence:   typeof t.confidence === 'number' ? Math.min(100, Math.max(0, Math.round(t.confidence))) : 70,
            error_reason: t.error_reason || null,
        }));

        const overallConf = transactions.length > 0
            ? Math.round(transactions.reduce((s, t) => s + t.confidence, 0) / transactions.length)
            : 0;

        return {
            bank_name:          typeof raw.bank_name === 'string' ? raw.bank_name : bankName,
            account_number:     raw.account_number || null,
            statement_period:   raw.statement_period || null,
            overall_confidence: typeof raw.overall_confidence === 'number'
                                    ? raw.overall_confidence
                                    : overallConf,
            transactions,
            parsing_notes:      Array.isArray(raw.parsing_notes) ? raw.parsing_notes : [],
        };
    }
}

export const aiParserService = new AIParserService();
