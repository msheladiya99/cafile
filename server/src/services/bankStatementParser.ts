import { ITransactionRow } from '../models/BankStatement';

// ─────────────────────────────────────────────────────────────────────────────
// ParseResult interface
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
    rows: ITransactionRow[];
    bankName: string;
    accountNumber: string;
    statementPeriod: string;
    errors: string[];
    warnings: string[];
    processingMethod: 'pdf-parse' | 'ocr' | 'manual';
    rawText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK DETECTION — IFSC-Priority System
// NEVER detect from transaction descriptions (UPI, Paytm, Jio, etc.)
// ─────────────────────────────────────────────────────────────────────────────

const IFSC_MAP: Record<string, string> = {
    // Public Sector Banks
    SBIN: 'State Bank of India (SBI)',
    PUNB: 'Punjab National Bank',
    UBIN: 'Union Bank of India',
    BKID: 'Bank of India',
    CNRB: 'Canara Bank',
    IOBA: 'Indian Overseas Bank',
    IDIB: 'Indian Bank',
    BARB: 'Bank of Baroda',
    MAHB: 'Bank of Maharashtra',
    UCBA: 'UCO Bank',
    PSIB: 'Punjab & Sind Bank',
    // Major Private Banks
    HDFC: 'HDFC Bank',
    ICIC: 'ICICI Bank',
    UTIB: 'Axis Bank',
    KKBK: 'Kotak Mahindra Bank',
    YESB: 'Yes Bank',
    INDB: 'IndusInd Bank',
    FDRL: 'Federal Bank',
    RATN: 'RBL Bank',
    KVBL: 'Karur Vysya Bank',
    SIBL: 'South Indian Bank',
    DLXB: 'Dhanlaxmi Bank',
    DCBL: 'DCB Bank',
    // New-Age & Small Finance Banks
    IDFC: 'IDFC First Bank',
    IDFB: 'IDFC First Bank',
    AUBL: 'AU Small Finance Bank',
    ESAF: 'ESAF Small Finance Bank',
    JANA: 'Jana Small Finance Bank',
    UJVN: 'Ujjivan Small Finance Bank',
    NKGS: 'Navi Bank',
    // Payments Banks
    PAYT: 'Paytm Payments Bank',
    JIOP: 'Jio Payments Bank',
    AIRP: 'Airtel Payments Bank',
    FINO: 'Fino Payments Bank',
    // Foreign Banks
    CITI: 'Citibank',
    HSBC: 'HSBC Bank',
    SCBL: 'Standard Chartered',
    DEUT: 'Deutsche Bank',
};

// Header-level bank name patterns — intentionally strict to avoid UPI false positives
const HEADER_BANK_PATTERNS: Array<[RegExp, string]> = [
    // Public Sector Banks
    [/\bstate\s+bank\s+of\s+india\b/i, 'State Bank of India (SBI)'],
    [/\bSBI\b(?!\s+NEFT|\s+A\/C|\s+account|\s+ref|\s+UPI)/i, 'State Bank of India (SBI)'],
    [/\bpunjab\s+national\s+bank\b/i, 'Punjab National Bank'],
    [/\bunion\s+bank\s+of\s+india\b/i, 'Union Bank of India'],
    [/\bbank\s+of\s+india\b/i, 'Bank of India'],
    [/\bcanara\s+bank\b/i, 'Canara Bank'],
    [/\bindian\s+overseas\s+bank\b/i, 'Indian Overseas Bank'],
    [/\bindian\s+bank\b/i, 'Indian Bank'],
    [/\bbank\s+of\s+baroda\b/i, 'Bank of Baroda'],
    [/\bbank\s+of\s+maharashtra\b/i, 'Bank of Maharashtra'],
    [/\buco\s+bank\b/i, 'UCO Bank'],
    [/\bpunjab\s+&?\s*sind\s+bank\b/i, 'Punjab & Sind Bank'],
    // Private Banks
    [/\bHDFC\s+bank\b/i, 'HDFC Bank'],
    [/\bICICI\s+bank\b/i, 'ICICI Bank'],
    [/\baxis\s+bank\b/i, 'Axis Bank'],
    [/\bkotak\s+mahindra\s+bank\b/i, 'Kotak Mahindra Bank'],
    [/\bkotak\s+bank\b/i, 'Kotak Mahindra Bank'],
    [/\byes\s+bank\b/i, 'Yes Bank'],
    [/\bindusind\s+bank\b/i, 'IndusInd Bank'],
    [/\bfederal\s+bank\b/i, 'Federal Bank'],
    [/\brbl\s+bank\b/i, 'RBL Bank'],
    [/\bkarur\s+vysya\s+bank\b/i, 'Karur Vysya Bank'],
    [/\bsouth\s+indian\s+bank\b/i, 'South Indian Bank'],
    [/\bdhanlaxmi\s+bank\b/i, 'Dhanlaxmi Bank'],
    [/\bdcb\s+bank\b/i, 'DCB Bank'],
    // New-Age & Small Finance Banks
    [/\bidfc\s+first\s+bank\b/i, 'IDFC First Bank'],
    [/\bau\s+small\s+finance\s+bank\b/i, 'AU Small Finance Bank'],
    [/\besaf\s+small\s+finance\s+bank\b/i, 'ESAF Small Finance Bank'],
    [/\bjana\s+small\s+finance\s+bank\b/i, 'Jana Small Finance Bank'],
    [/\bujjivan\s+small\s+finance\s+bank\b/i, 'Ujjivan Small Finance Bank'],
    // Payments Banks
    [/\bpaytm\s+payments?\s+bank\b/i, 'Paytm Payments Bank'],
    [/\bjio\s+payments?\s+bank\b/i, 'Jio Payments Bank'],
    [/\bJPB\b/i, 'Jio Payments Bank'],
    [/\bairtel\s+payments?\s+bank\b/i, 'Airtel Payments Bank'],
    [/\bfino\s+payments?\s+bank\b/i, 'Fino Payments Bank'],
    // Foreign Banks
    [/\bcitibank\b/i, 'Citibank'],
    [/\bhsbc\s+bank\b/i, 'HSBC Bank'],
    [/\bstandard\s+chartered\b/i, 'Standard Chartered'],
    [/\bdeutsche\s+bank\b/i, 'Deutsche Bank'],
    [/\bbank\s+of\s+baroda\b/i, 'Bank of Baroda'],
    [/\bcentral\s+bank\s+of\s+india\b/i, 'Central Bank of India'],
    [/\bidbi\s+bank\b/i, 'IDBI Bank'],
    [/\bkotak\b/i, 'Kotak Mahindra Bank'],
    [/\bbandhan\s+bank\b/i, 'Bandhan Bank'],
    [/\bcity\s+union\s+bank\b/i, 'City Union Bank'],
    [/\bkarur\s+vysya\b/i, 'Karur Vysya Bank'],
];

/**
 * Extract bank name from statement text.
 * Priority: IFSC code → Header/title patterns → Fuzzy full-text scan → UNKNOWN BANK
 */
export function detectBankName(text: string): string {
    // 1. Find ALL IFSC codes in the document (not just first)
    const ifscMatches = [...text.matchAll(/\b([A-Z]{4})\d{7}\b/g)];
    for (const m of ifscMatches) {
        const prefix = m[1].toUpperCase();
        if (IFSC_MAP[prefix]) return IFSC_MAP[prefix];
    }

    // 2. Scan first 50 lines (expanded from 30 — some banks have long headers)
    const lines = text.split('\n');
    const headerText = lines.slice(0, 50).join('\n');
    for (const [pattern, name] of HEADER_BANK_PATTERNS) {
        if (pattern.test(headerText)) return name;
    }

    // 3. Full-text scan — skip lines that look like transaction descriptions
    for (const [pattern, name] of HEADER_BANK_PATTERNS) {
        const lineIdx = lines.findIndex(l => pattern.test(l));
        if (lineIdx === -1) continue;
        const line = lines[lineIdx];
        // Reject if this looks like a transaction narration, not a bank header
        const isNarration = /upi|neft|imps|rtgs|ref\s*no|txn\s*id|transfer\s+to|payment\s+to|deposited/i.test(line)
                         && lineIdx > 15;
        if (!isNarration) return name;
    }

    // 4. Short-form standalone bank name (only in first 50 lines)
    const shortPatterns: Array<[RegExp, string]> = [
        [/\bHDFC\b/i,    'HDFC Bank'],
        [/\bICICI\b/i,   'ICICI Bank'],
        [/\bSBI\b/i,     'State Bank of India (SBI)'],
        [/\bAxis\b/i,    'Axis Bank'],
        [/\bKotak\b/i,   'Kotak Mahindra Bank'],
        [/\bPNB\b/i,     'Punjab National Bank'],
        [/\bUBI\b/i,     'Union Bank of India'],
        [/\bBOI\b/i,     'Bank of India'],
        [/\bBOB\b/i,     'Bank of Baroda'],
        [/\bIOB\b/i,     'Indian Overseas Bank'],
        [/\bIDFC\b/i,    'IDFC First Bank'],
        [/\bIDBI\b/i,    'IDBI Bank'],
        [/\bYes\s+Bank\b/i, 'Yes Bank'],
        [/\bBandhan\b/i, 'Bandhan Bank'],
        [/\bAU\s+Bank\b/i, 'AU Small Finance Bank'],
        [/\bFederal\b/i, 'Federal Bank'],
    ];
    for (const [pattern, name] of shortPatterns) {
        if (pattern.test(headerText)) return name;
    }

    return 'UNKNOWN BANK';
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE NORMALIZER — Strict DD/MM/YYYY output
// Accepts: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD MMM YYYY, MMM DD YYYY
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

export function universalDate(raw: string): string | null {
    if (!raw) return null;
    const clean = raw.trim().replace(/\b[Oo](?=\d)|(?<=\d)[Oo]\b/g, '0');

    const validYear = (y: string) => {
        const n = parseInt(y.length === 2 ? '20' + y : y);
        return n >= 2000 && n <= 2035;
    };

    // Pattern 1: YYYY-MM-DD (ISO) — at or near start of line
    const isoMatch = clean.match(/(?:^|\s)(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        if (validYear(y) && parseInt(m) >= 1 && parseInt(m) <= 12 && parseInt(d) >= 1 && parseInt(d) <= 31) {
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
    }

    // Pattern 2: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = clean.match(/(?:^|\s)(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const fullYear = y.length === 2 ? '20' + y : y;
        if (!validYear(fullYear)) return null;
        const dNum = parseInt(d), mNum = parseInt(m);
        if (dNum < 1 || dNum > 31 || mNum < 1 || mNum > 31) return null;
        if (dNum > 12 && mNum <= 12) return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${fullYear}`;
        if (mNum > 12 && dNum <= 12) return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${fullYear}`;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${fullYear}`;
    }

    // Pattern 3: DD MMM YYYY (e.g. 01 Apr 2024)
    const dmmyMatch = clean.match(/(?:^|\s)(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-,](\d{4})\b/);
    if (dmmyMatch) {
        const [, d, mon, y] = dmmyMatch;
        const mCode = MONTH_MAP[mon.toLowerCase().substring(0, 3)];
        if (mCode && validYear(y)) return `${d.padStart(2, '0')}/${mCode}/${y}`;
    }

    // Pattern 4: MMM DD, YYYY (e.g. Apr 01, 2024)
    const mdyMatch = clean.match(/(?:^|\s)([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/);
    if (mdyMatch) {
        const [, mon, d, y] = mdyMatch;
        const mCode = MONTH_MAP[mon.toLowerCase().substring(0, 3)];
        if (mCode && validYear(y)) return `${d.padStart(2, '0')}/${mCode}/${y}`;
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AMOUNT PARSER
// ─────────────────────────────────────────────────────────────────────────────

export function parseAmt(s: string): number {
    if (!s) return 0;
    const corrected = s.replace(/[Il]/g, '1').replace(/[Oo]/g, '0');
    const val = parseFloat(corrected.replace(/,/g, '').replace(/[^\d.\-]/g, ''));
    return isNaN(val) ? 0 : val;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION CLEANER
// ─────────────────────────────────────────────────────────────────────────────

const TRANSACTION_TYPE_PATTERNS: Array<[RegExp, string]> = [
    [/\bUPI\b/i, 'UPI Transfer'],
    [/\bNEFT\b/i, 'NEFT Transfer'],
    [/\bRTGS\b/i, 'RTGS Transfer'],
    [/\bIMPS\b/i, 'IMPS Transfer'],
    [/\bNACH\b/i, 'NACH Debit'],
    [/\bENACH\b/i, 'eNACH Debit'],
    [/\bATM\b/i, 'ATM Withdrawal'],
    [/\bCASH\s+WD(?:L|RAWAL)?\b/i, 'Cash Withdrawal'],
    [/\bCASH\s+DEP(?:OSIT)?\b/i, 'Cash Deposit'],
    [/\bPOS\b/i, 'POS Purchase'],
    [/\bEMI\b/i, 'EMI Payment'],
    [/\bSALARY\b|\bSAL[\/\s]CR\b/i, 'Salary Credit'],
    [/\bINTEREST\s+CR(?:EDIT)?\b|\bINT\.?\s*CR\b/i, 'Interest Credit'],
    [/\bCHQ\b|\bCHEQUE\b/i, 'Cheque Payment'],
    [/\bDD\b/i, 'Demand Draft'],
    [/\bMB\b/i, 'Mobile Banking'],
    [/\bNB\b/i, 'Net Banking'],
    [/\bSWEEP\b/i, 'Sweep Transfer'],
    [/\bRD\s+INST(?:ALLMENT)?\b/i, 'RD Installment'],
    [/\bFD\s+CREAT(?:ION)?\b/i, 'FD Creation'],
    [/\bFD\s+MATUR(?:ITY)?\b/i, 'FD Maturity'],
    [/\bREFUND\b/i, 'Refund'],
    [/\bCHARGE\b|\bFEE\b/i, 'Bank Charges'],
];

const MERCHANT_PATTERNS: Array<[RegExp, string]> = [
    [/paytmqr|paytm\s*qr/i, 'Paytm QR'],
    [/paytm/i, 'Paytm'],
    [/phonepe/i, 'PhonePe'],
    [/gpay|googlepay/i, 'Google Pay'],
    [/amazon(?:pay)?/i, 'Amazon'],
    [/flipkart/i, 'Flipkart'],
    [/zomato/i, 'Zomato'],
    [/swiggy/i, 'Swiggy'],
    [/uber/i, 'Uber'],
    [/ola\b/i, 'Ola'],
    [/irctc/i, 'IRCTC'],
    [/airtel/i, 'Airtel'],
    [/jio(?!mart)/i, 'Jio'],
    [/jiomart/i, 'JioMart'],
    [/blinkit|grofers/i, 'Blinkit'],
    [/bigbasket/i, 'BigBasket'],
    [/netflix/i, 'Netflix'],
    [/spotify/i, 'Spotify'],
    [/zerodha/i, 'Zerodha'],
    [/groww/i, 'Groww'],
    [/lic(?:\s|$)/i, 'LIC'],
    [/hdfc\s+life/i, 'HDFC Life'],
];

export function cleanDescription(raw: string): string {
    if (!raw) return '';

    let desc = raw
        .replace(/\b\d{8,}\b/g, '')
        .replace(/[\w.\-]+@[\w.\-]+/g, '')
        .replace(/\b\d{2}:\d{2}:\d{2}\b/g, '')
        .replace(/\b(?:INB|IB|MB|CR|DR|TRF|TRANSFER|REF|TXN|TRAN|REMARKS|NARRATION|PARTICULARS)\b/gi, '')
        .replace(/[|\/\\]{2,}/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    let txType = '';
    for (const [pattern, label] of TRANSACTION_TYPE_PATTERNS) {
        if (pattern.test(desc)) {
            txType = label;
            desc = desc.replace(pattern, '').trim();
            break;
        }
    }

    let merchantName = '';
    for (const [pattern, label] of MERCHANT_PATTERNS) {
        if (pattern.test(desc)) {
            merchantName = label;
            break;
        }
    }

    let result = '';
    if (txType && merchantName) {
        result = `${txType} - ${merchantName}`;
    } else if (txType) {
        const remaining = desc
            .replace(/\b\d+\b/g, '')
            .replace(/[^a-zA-Z\s\-]/g, '')
            .replace(/\b(?:to|from|by|via|the|and|or|of)\b/gi, '')
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 2)
            .slice(0, 4)
            .join(' ');
        result = remaining ? `${txType} - ${remaining}` : txType;
    } else if (merchantName) {
        result = merchantName;
    } else {
        result = desc
            .replace(/\b\d+\b/g, '')
            .replace(/[^a-zA-Z\s\-]/g, '')
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 2)
            .slice(0, 5)
            .join(' ');
    }

    return result.substring(0, 200) || raw.substring(0, 200);
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIZER — 50+ transaction types
// ─────────────────────────────────────────────────────────────────────────────

export function categorize(desc: string): string {
    const d = desc.toLowerCase();

    if (/salary|sal[\s\/\-]|payroll|remuneration|bonus|stipend/.test(d)) return 'Salary';
    if (/interest|int[\.\s]?pd|int[\.\s]?cr|tds\s*refund/.test(d)) return 'Interest/Income';
    if (/dividend/.test(d)) return 'Investment Income';
    if (/rent\s*received|rental\s*income/.test(d)) return 'Rental Income';
    if (/gst|igst|cgst|sgst|gstn|tds|income\s*tax|advance\s*tax|it\s*dept|challan|prof\s*tax/.test(d)) return 'Tax/GST';
    if (/mutual\s*fund|mf[\s\-]|sip|zerodha|groww|upstox|angelone|stocks|securities|nse|bse/.test(d)) return 'Investments';
    if (/insurance|lic|hdfc\s*life|icici\s*pru|max\s*life|premium|tata\s*aia/.test(d)) return 'Insurance';
    if (/\bfd\b|\bfixed\s*deposit\b|\brd\b|\brecurring\s*deposit\b/.test(d)) return 'Savings/FD';
    if (/\bppf\b|\bepf\b|\bnps\b|national\s*pension/.test(d)) return 'Provident Fund';
    if (/uber|ola\b|rapido|irctc|railway|indigo|air\s*india|makemytrip|cleartrip|goibibo/.test(d)) return 'Travel/Transport';
    if (/petrol|fuel|diesel|hpcl|bpcl|iocl|filling\s*station/.test(d)) return 'Fuel';
    if (/fastag|toll/.test(d)) return 'Toll/FASTag';
    if (/atm\s*wdl|atm\s*withdrawal|cash\s*wd|cash\s*withdrawal/.test(d)) return 'Cash Withdrawal';
    if (/\batm\b/.test(d)) return 'ATM';
    if (/amazon|flipkart|myntra|jiomart|bigbasket|blinkit|zepto|meesho/.test(d)) return 'Shopping';
    if (/zomato|swiggy|uber\s*eats|mcdonald|starbucks|domino|kfc|restaurant|bakery|cafe/.test(d)) return 'Food & Dining';
    if (/airtel|jio|vodafone|vi\s+|recharge|electricity|bescom|tneb|water\s*bill|gas\s*bill|broadband/.test(d)) return 'Utility Bills';
    if (/netflix|prime\s*video|hotstar|spotify|bookmyshow|zee5/.test(d)) return 'Entertainment';
    if (/emi|loan|mortgage|housing\s*loan|car\s*loan|credit\s*card|cc\s*payment/.test(d)) return 'EMI/Loan';
    if (/cheque|chq\b/.test(d)) return 'Cheque';
    if (/apollo|pharmacy|hospital|clinic|medical|lab|diagnostics/.test(d)) return 'Medical';
    if (/fees|school|college|tuition|edtech|unacademy|byju|coursera/.test(d)) return 'Education';
    if (/neft/.test(d)) return 'NEFT Transfer';
    if (/rtgs/.test(d)) return 'RTGS Transfer';
    if (/\bimps\b/.test(d)) return 'IMPS Transfer';
    if (/\bupi\b/.test(d)) return 'UPI Transfer';
    if (/transfer|trf\b|tfr\b/.test(d)) return 'Transfer';

    return 'Miscellaneous';
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBIT/CREDIT RESOLVER — Balance-delta verification
// ─────────────────────────────────────────────────────────────────────────────

interface PendingRow {
    date: string;
    rawDesc: string;
    amounts: number[];
}

function resolveDebitCredit(
    amounts: number[],
    lastBalance: number,
    isFirst: boolean
): { debit: number; credit: number; balance: number; hasError: boolean } {
    if (amounts.length === 0) return { debit: 0, credit: 0, balance: 0, hasError: true };

    const bal = amounts[amounts.length - 1];

    if (amounts.length >= 3) {
        const val1 = amounts[0];
        const val2 = amounts[1];
        if (val1 === 0 && val2 > 0) return { debit: 0, credit: val2, balance: bal, hasError: false };
        if (val2 === 0 && val1 > 0) return { debit: val1, credit: 0, balance: bal, hasError: false };
        const delta = bal - lastBalance;
        if (Math.abs(delta - val2) < 0.02) return { debit: 0, credit: val2, balance: bal, hasError: false };
        if (Math.abs(delta + val1) < 0.02) return { debit: val1, credit: 0, balance: bal, hasError: false };
        if (Math.abs(delta - val1) < 0.02) return { debit: 0, credit: val1, balance: bal, hasError: false };
        if (Math.abs(delta + val2) < 0.02) return { debit: val2, credit: 0, balance: bal, hasError: false };
        return { debit: val1, credit: 0, balance: bal, hasError: true };
    }

    if (amounts.length === 2) {
        const txAmt = amounts[0];
        const delta = bal - lastBalance;
        if (!isFirst) {
            if (Math.abs(delta - txAmt) < 0.02) return { debit: 0, credit: txAmt, balance: bal, hasError: false };
            if (Math.abs(delta + txAmt) < 0.02) return { debit: txAmt, credit: 0, balance: bal, hasError: false };
            return delta > 0
                ? { debit: 0, credit: txAmt, balance: bal, hasError: false }
                : { debit: txAmt, credit: 0, balance: bal, hasError: false };
        }
        return { debit: 0, credit: txAmt, balance: bal, hasError: false };
    }

    return { debit: 0, credit: 0, balance: amounts[0], hasError: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL LINE PARSER
// ─────────────────────────────────────────────────────────────────────────────

export function parseLines(lines: string[]): ITransactionRow[] {
    const rows: ITransactionRow[] = [];
    let current: PendingRow | null = null;
    let lastBalance = 0;

    // Indian number format: 1,23,456.78 or 1,234.56 or 12345.67
    const amountPattern = /(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/g;

    // Skip obvious header/footer-only lines
    const skipPattern = /^\s*(?:page\s+\d+|sl\.?\s*no\.?|sr\.?\s*no\.?|s\.?\s*no\.?|transaction\s+id|value\s+date|stmt\s+of\s+acct|account\s+statement|generated\s+on|print\s+date|branch\s+name|ifsc\s+code|micr\s+code|customer\s+id|customer\s+name|for\s+details\s+please\s+visit|opening\s+balance|closing\s+balance|brought\s+forward|carried\s+forward|ob\s*[:—]|cb\s*[:—])\s*$/i;

    // Patterns that indicate a line is an opening/closing balance row (not a real tx)
    // NOTE: Keep these strict — avoid matching real transaction reference text
    const openingClosingPattern = /\b(?:opening\s+balance|closing\s+balance|carry\s*forward|brought\s*forward)\b/i;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || skipPattern.test(line)) continue;

        const date = universalDate(line);
        const amounts = (line.match(amountPattern) || []).map(parseAmt);

        // Skip lines that are opening/closing balance markers
        if (date && openingClosingPattern.test(line)) {
            // Capture balance for delta calculations but don't emit a row
            if (amounts.length > 0) lastBalance = amounts[amounts.length - 1];
            continue;
        }

        if (date) {
            // Finalize previous pending row
            if (current && current.amounts.length >= 1) {
                const { debit, credit, balance, hasError } = resolveDebitCredit(
                    current.amounts, lastBalance, rows.length === 0
                );
                lastBalance = balance;
                rows.push({
                    date: current.date,
                    description: cleanDescription(current.rawDesc),
                    debit,
                    credit,
                    balance,
                    category: categorize(current.rawDesc),
                    hasError,
                    errorMessage: hasError ? 'Low confidence — manual review recommended' : '',
                    rowIndex: rows.length,
                });
            }

            // Strip date/amount tokens to get description
            const descPart = line
                .replace(/\b\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}\b/g, '')
                .replace(/\b\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}\b/g, '')
                .replace(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g, '')
                .replace(/\b[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}\b/g, '')
                .replace(/(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/g, '')
                .replace(/\b(?:Dr|Cr|DR|CR)\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            current = { date, rawDesc: descPart, amounts };

        } else if (current) {
            if (amounts.length > 0) {
                current.amounts.push(...amounts);
                const textOnly = line
                    .replace(/(?:\d{1,3}(?:,\d{2,3})*|\d+)\.\d{2}/g, '')
                    .replace(/\b(?:Dr|Cr|DR|CR)\b/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (textOnly.length > 2 && !/^\d+$/.test(textOnly)) {
                    current.rawDesc += ' ' + textOnly;
                }
            } else if (line.length > 2) {
                current.rawDesc += ' ' + line;
            }
        }
    }

    // Flush final row
    if (current && current.amounts.length >= 1) {
        const { debit, credit, balance, hasError } = resolveDebitCredit(
            current.amounts, lastBalance, rows.length === 0
        );
        rows.push({
            date: current.date,
            description: cleanDescription(current.rawDesc),
            debit,
            credit,
            balance,
            category: categorize(current.rawDesc),
            hasError,
            errorMessage: hasError ? 'Low confidence — manual review recommended' : '',
            rowIndex: rows.length,
        });
    }

    return cleanRows(rows);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-PARSE GARBAGE ROW FILTER
// Only removes rows that are clearly NOT real transactions:
//   - Empty description
//   - description = only numbers
//   - First OR last row where BOTH debit AND credit are 0 (pure balance sentinel)
//   - First OR last row where description is a bare bank/brand name AND amount is tiny
// ⚠️ Rules ONLY apply positionally (first/last) to avoid killing real middle-of-statement rows
// ─────────────────────────────────────────────────────────────────────────────

// Bank/payment brand short-names used as sentinel row descriptions in PDF headers/footers.
// ONLY checked for first or last row — never for middle rows.
const BANK_BRAND_DESCRIPTIONS = new Set([
    'jio', 'jiop', 'airtel', 'paytm', 'fino', 'phonepe', 'googlepay', 'gpay',
    'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank', 'indusind', 'federal',
    'idfc', 'au', 'navi', 'rbl', 'dcb', 'kvb', 'sibl', 'uco', 'pnb', 'bob',
    'canara', 'union bank', 'bank of india', 'indian bank', 'hsbc', 'citi',
    'jio payments bank', 'jio payments', 'paytm payments bank', 'airtel payments bank',
    'fino payments bank',
]);

function isGarbageRow(row: ITransactionRow, index: number, all: ITransactionRow[]): boolean {
    const desc = row.description.toLowerCase().trim();
    const isFirst = index === 0;
    const isLast  = index === all.length - 1;
    const isBoundary = isFirst || isLast;

    // 1. Always: description is empty
    if (!desc) return true;

    // 2. Always: description is purely numeric/symbolic after cleaning (no real text)
    if (/^[\d\s\.\,\-\/]+$/.test(desc)) return true;

    // 3. First or last ONLY: zero debit AND zero credit — pure balance marker row
    //    (e.g. opening balance line that slipped through line-level skip)
    if (isBoundary && row.debit === 0 && row.credit === 0 && row.balance > 0) return true;

    // 4. First or last ONLY: bare bank/brand name with no real transaction amount
    //    A ₹1 Jio recharge is a VALID transaction even at boundary,
    //    but a row with description = 'Jio' AND debit+credit = 0 is just a balance sentinel.
    if (isBoundary && BANK_BRAND_DESCRIPTIONS.has(desc) && row.debit === 0 && row.credit === 0) return true;

    return false;
}

function cleanRows(rows: ITransactionRow[]): ITransactionRow[] {
    const filtered = rows.filter((r, i, arr) => !isGarbageRow(r, i, arr));
    // Re-index
    return filtered.map((r, i) => ({ ...r, rowIndex: i }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT NUMBER EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

function extractAccountNumber(text: string): string {
    const patterns = [
        /acc(?:ount)?\s*(?:no|num|number|#)?[:.:\s]*(\d{9,18})/i,
        /a\/c\s*(?:no|num)?[:.:\s]*(\d{9,18})/i,
        /account\s+number\s*:?\s*(\d{9,18})/i,
        /\b(\d{9,18})\b/,
    ];
    for (const p of patterns) {
        const m = text.match(p);
        if (m) return m[1];
    }
    return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// STATEMENT PERIOD EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

function extractPeriod(text: string): string {
    const m = text.match(
        /(?:from|period)[:\s]+(\d{1,2}[\s\/\-][A-Za-z\d]{1,9}[\s\/\-]\d{2,4})\s*(?:to|-|–)\s*(\d{1,2}[\s\/\-][A-Za-z\d]{1,9}[\s\/\-]\d{2,4})/i
    );
    if (m) {
        const from = universalDate(m[1]) || m[1];
        const to = universalDate(m[2]) || m[2];
        return `${from} - ${to}`;
    }
    return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF PARSER — supports both old and new pdf-parse API shapes
// ─────────────────────────────────────────────────────────────────────────────

export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        let text = '';
        try {
            const pdfModule = require('pdf-parse');
            if (typeof pdfModule === 'function') {
                const data = await pdfModule(buffer);
                text = data?.text || '';
            } else if (typeof pdfModule?.PDFParse === 'function') {
                const inst = new pdfModule.PDFParse({ data: buffer, verbosity: 0 });
                await inst.load();
                const result = await inst.getText();
                text = result?.text || '';
            } else if (typeof pdfModule?.default === 'function') {
                const data = await pdfModule.default(buffer);
                text = data?.text || '';
            } else {
                throw new Error('pdf-parse module has unrecognized export shape');
            }
        } catch (pdfErr: any) {
            errors.push(`PDF parsing error: ${pdfErr.message}`);
            return { rows: [], bankName: 'UNKNOWN BANK', accountNumber: '', statementPeriod: '', errors, warnings, processingMethod: 'pdf-parse', rawText: '' };
        }

        if (!text.trim()) {
            errors.push('PDF appears to be scanned/image-based. No text extracted. Please use a digital PDF or CSV instead.');
            return { rows: [], bankName: 'UNKNOWN BANK', accountNumber: '', statementPeriod: '', errors, warnings, processingMethod: 'pdf-parse', rawText: '' };
        }

        const bankName = detectBankName(text);
        if (bankName === 'UNKNOWN BANK') {
            warnings.push('Bank name could not be identified from IFSC or header. Marked as UNKNOWN BANK.');
        }

        const rows = parseLines(text.split('\n'));
        const errorRows = rows.filter(r => r.hasError).length;
        if (errorRows > 0) {
            warnings.push(`${errorRows} row(s) have low-confidence debit/credit detection and are flagged for review.`);
        }
        if (rows.length === 0) {
            errors.push('No transaction rows could be extracted. PDF may have unsupported layout.');
        }

        return {
            rows,
            bankName,
            accountNumber: extractAccountNumber(text),
            statementPeriod: extractPeriod(text),
            errors,
            warnings,
            processingMethod: 'pdf-parse',
            rawText: text,
        };
    } catch (e: any) {
        return { rows: [], bankName: 'UNKNOWN BANK', accountNumber: '', statementPeriod: '', errors: [e.message || 'Unknown parse error'], warnings: [], processingMethod: 'pdf-parse', rawText: '' };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER
// ─────────────────────────────────────────────────────────────────────────────

export async function parseCSV(buffer: Buffer): Promise<ParseResult> {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n');

    const headerText = lines.slice(0, 10).join('\n');
    const bankName = detectBankName(headerText);
    const accountNumber = extractAccountNumber(headerText);
    const statementPeriod = extractPeriod(headerText);

    const headerRowIdx = lines.findIndex(l =>
        /date/i.test(l) && (/debit|withdrawal/i.test(l) || /credit|deposit/i.test(l))
    );

    if (headerRowIdx !== -1) {
        const headers = lines[headerRowIdx].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const dateIdx = headers.findIndex(h => /date/.test(h));
        const descIdx = headers.findIndex(h => /narration|description|particulars|remarks/.test(h));
        const debitIdx = headers.findIndex(h => /debit|withdrawal|dr/.test(h));
        const creditIdx = headers.findIndex(h => /credit|deposit|cr/.test(h));
        const balanceIdx = headers.findIndex(h => /balance/.test(h));

        if (dateIdx !== -1 && balanceIdx !== -1) {
            const rows: ITransactionRow[] = [];
            for (let i = headerRowIdx + 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
                if (cols.length < 3) continue;
                const date = universalDate(cols[dateIdx] || '');
                if (!date) continue;
                const debit = debitIdx !== -1 ? parseAmt(cols[debitIdx] || '') : 0;
                const credit = creditIdx !== -1 ? parseAmt(cols[creditIdx] || '') : 0;
                const balance = balanceIdx !== -1 ? parseAmt(cols[balanceIdx] || '') : 0;
                const rawDesc = descIdx !== -1 ? cols[descIdx] : '';
                rows.push({
                    date,
                    description: cleanDescription(rawDesc),
                    debit,
                    credit,
                    balance,
                    category: categorize(rawDesc),
                    hasError: false,
                    rowIndex: rows.length,
                });
            }
            return {
                rows,
                bankName,
                accountNumber,
                statementPeriod,
                errors: rows.length === 0 ? ['No data rows found in CSV after header.'] : [],
                warnings: [],
                processingMethod: 'manual',
            };
        }
    }

    const rows = parseLines(lines);
    return {
        rows,
        bankName,
        accountNumber,
        statementPeriod,
        errors: rows.length === 0 ? ['Could not parse CSV. Ensure it has Date, Debit/Credit, Balance columns.'] : [],
        warnings: [],
        processingMethod: 'manual',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTALS CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export function computeTotals(rows: ITransactionRow[]) {
    return {
        totalDebit: Math.round(rows.reduce((s, r) => s + (r.debit || 0), 0) * 100) / 100,
        totalCredit: Math.round(rows.reduce((s, r) => s + (r.credit || 0), 0) * 100) / 100,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON EXPORT HELPER — strict spec output format
// ─────────────────────────────────────────────────────────────────────────────

export function toJSON(result: ParseResult): object {
    return {
        bank_name: result.bankName,
        account_number: result.accountNumber || null,
        statement_period: result.statementPeriod || null,
        transactions: result.rows.map(r => ({
            date: r.date || null,
            particular: r.description,
            debit: (r.debit && r.debit > 0) ? r.debit : null,
            credit: (r.credit && r.credit > 0) ? r.credit : null,
            balance: r.balance ?? null,
        })),
    };
}
