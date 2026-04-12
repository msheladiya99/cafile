import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import OpenAI from 'openai';

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
    private genAI: GoogleGenerativeAI | null = null;
    private openRouter: OpenAI | null = null;

    private readonly GEMINI_CONFIG: GenerationConfig = {
        temperature:       0.1,
        maxOutputTokens:   8192,
        responseMimeType: 'application/json',
    };

    constructor() {
        const orKey = process.env.OPENROUTER_API_KEY;
        if (orKey && orKey.includes('sk-')) {
            this.openRouter = new OpenAI({
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: orKey,
                defaultHeaders: {
                    "HTTP-Referer": "https://ca-office-portal.com",
                    "X-Title": "CA Office Portal",
                }
            });
            console.log('[AI Parser] Initialized with OpenRouter');
        }

        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            console.log('[AI Parser] Initialized with Direct Gemini');
        }
        
        if (!this.openRouter && !this.genAI) {
            console.warn('[AI Parser] No API keys found for OpenRouter or Gemini');
        }
    }

    // ── Main parse method ─────────────────────────────────────────────────────

    async parseStatement(
        input: string,
        isImage: boolean = false,
        bankName: string = 'Unknown',
        mimeType: string = 'image/jpeg'
    ): Promise<AIParseResult> {
        const prompt = this.buildPrompt(bankName);

        if (this.openRouter) {
            try {
                return await this.parseWithOpenRouter(prompt, input, isImage, mimeType, bankName);
            } catch (err: any) {
                console.warn('[AI Parser] OpenRouter failed, falling back to Gemini:', err.message);
                if (!this.genAI) throw err;
            }
        }

        if (this.genAI) {
            return await this.parseWithGemini(prompt, input, isImage, mimeType, bankName);
        }

        throw new Error('AI extraction unavailable: No API keys configured.');
    }

    private async parseWithOpenRouter(
        prompt: string,
        input: string,
        isImage: boolean,
        mimeType: string,
        bankName: string
    ): Promise<AIParseResult> {
        console.log('[AI Parser] Routing via OpenRouter (Gemini Flash)');
        
        const messages: any[] = [{ role: 'user', content: [{ type: 'text', text: prompt }] }];
        
        if (isImage) {
            messages[0].content.push({
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${input}` }
            });
        } else {
            messages[0].content.push({ type: 'text', text: input });
        }

        const response = await this.openRouter!.chat.completions.create({
            model: 'google/gemini-flash-1.5',
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });

        const text = response.choices[0].message.content || '{}';
        return this.sanitizeResult(JSON.parse(text), bankName);
    }

    private async parseWithGemini(
        prompt: string,
        input: string,
        isImage: boolean,
        mimeType: string,
        bankName: string
    ): Promise<AIParseResult> {
        console.log('[AI Parser] Routing via Direct Gemini');
        const model = this.genAI!.getGenerativeModel(
            { model: 'gemini-1.5-flash', generationConfig: this.GEMINI_CONFIG },
            { apiVersion: 'v1beta' }
        );

        let result;
        if (isImage) {
            result = await model.generateContent([
                prompt,
                { inlineData: { data: input, mimeType } },
            ]);
        } else {
            result = await model.generateContent([prompt, input]);
        }

        return this.sanitizeResult(JSON.parse(result.response.text()), bankName);
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
1. BANK_NAME: Detect the full bank name. SCAN FOR IFSC CODES (e.g., SBIN, HDFC, ICIC, UTIB) at the start or end of the document to guarantee accuracy. If the rule-based input says "Unknown", prioritize your own find via IFSC.
2. DATE: Normalize ALL dates to "DD/MM/YYYY" format ONLY. Never use any other format.
3. AMOUNTS: Return decimal numbers (no commas). Use null if genuinely absent.
4. BALANCE: Always extract the running/closing balance for EACH row. Never null if visible.
5. DESCRIPTION: Remove long alphanumeric IDs (>8 chars), timestamps (HH:MM:SS), and "/DR/" "/CR/" prefixes. Keep: merchant name, counterparty, payment mode.
6. CATEGORY: Use one of these exact values: Salary | Income | Transfer | UPI Transfer | NEFT Transfer | RTGS Transfer | IMPS Transfer | EMI/Loan | Tax/GST | Insurance | Investments | Rent | Food & Dining | Travel | Shopping | Medical | Education | Utility Bills | Fuel | ATM | Cash | Cheque | Savings/FD | Miscellaneous
7. SUBCATEGORY: A more specific label (e.g., "HDFC Life", "Swiggy", "Electricity")
8. CONFIDENCE (per row): 0-100. Assign lower confidence when:
   - Date is ambiguous or approximated
   - Amount has to be inferred (only one amount column, no separate debit/credit)
   - Balance does not math-check with previous row
9. ERROR_REASON: If confidence < 70, briefly explain why (e.g., "balance mismatch", "date ambiguous")
10. OVERALL_CONFIDENCE: Average of all row confidences, from 0-100.
11. NEVER invent transactions. Only extract what is explicitly visible.
12. NEVER skip a transaction row even if partially readable.
13. IFSC_CODE: If you find an IFSC code, list it in the parsing_notes.
14. EXCLUDE summary rows: Do NOT include rows that represent "Closing Balance", "Opening Balance", "Total", or "Statement Period" in the transactions array. These are summaries, not individual transactions.

OUTPUT JSON SCHEMA (STRICT — no extra keys, no missing keys):
{
  "bank_name": "Full bank name (e.g., HDFC Bank) or UNKNOWN if not found",
  "account_number": "XXXXXXXXX (last 4 digits unmasked if visible) or null",
  "statement_period": "DD/MM/YYYY - DD/MM/YYYY or null",
  "overall_confidence": <integer 0-100>,
  "parsing_notes": ["any issues you noticed, plus detected IFSC if found"],
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
