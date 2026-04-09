import { ITransactionRow } from '../models/BankStatement';

export interface ParseResult {
    rows: ITransactionRow[];
    bankName: string;
    accountNumber: string;
    statementPeriod: string;
    errors: string[];
    warnings: string[];
    processingMethod: 'pdf-parse' | 'ocr' | 'manual';
}

// ─── Universal Date Extractor ────────────────────────────────────────────────

function universalDate(raw: string): string | null {
    if (!raw) return null;
    const clean = raw.trim();
    
    // Patterns: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY, MMM DD, YYYY
    const dRe = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{1,2}\s+[A-Z][a-z]{2,}\s+\d{4})|([A-Z][a-z]{2,}\s+\d{1,2},?\s+\d{4})/;
    const m = clean.match(dRe);
    if (!m) return null;

    const dateStr = m[0];
    const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

    // Normalize to DD/MM/YYYY
    try {
        if (dateStr.includes('/') || dateStr.includes('-') && !/[a-zA-Z]/.test(dateStr)) {
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts[0].length === 4) return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`; // YYYY/MM/DD
            return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2].length === 2 ? '20' + parts[2] : parts[2]}`;
        }
        if (/[a-zA-Z]/.test(dateStr)) {
            const parts = dateStr.replace(',', '').split(/\s+/);
            const mIdx = parts.findIndex(p => months[p.toLowerCase().substring(0, 3)]);
            if (mIdx !== -1) {
                const day = parts.find((p, i) => i !== mIdx && /^\d{1,2}$/.test(p)) || '01';
                const year = parts.find((p, i) => i !== mIdx && /^\d{4}$/.test(p)) || '2024';
                return `${day.padStart(2, '0')}/${months[parts[mIdx].toLowerCase().substring(0, 3)]}/${year}`;
            }
        }
    } catch (e) {}
    return dateStr;
}

function parseAmt(s: string): number {
    return parseFloat(s.replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
}

// ─── Universal Layout Logic ──────────────────────────────────────────────────

export function parseLines(lines: string[]): ITransactionRow[] {
    const rows: ITransactionRow[] = [];
    interface Pending { date: string; desc: string; amounts: number[] }
    let current: Pending | null = null;
    let lastBalance = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line || /page \d+|generated on|statement/i.test(line)) continue;

        const date = universalDate(line);
        // Find all numbers in the line that look like currency (e.g. 1,234.50 or 500.00)
        const amounts = line.match(/(?:\d{1,3}(?:,\d{3})*|\d+)\.\d{2}/g)?.map(parseAmt) || [];

        if (date && line.startsWith(line.match(/^\d+/) ? line.match(/^\d+/)?.[0] || date : date)) {
            // New row detected
            if (current && current.amounts.length >= 2) {
                finalizeRow(current, rows, lastBalance);
                lastBalance = rows[rows.length - 1].balance;
            }
            current = { date, desc: line.replace(date, '').trim(), amounts };
        } else if (current) {
            // Append amounts if found on subsequent line
            if (amounts.length > 0) current.amounts.push(...amounts);
            // Append description
            if (amounts.length === 0) current.desc += ' ' + line;
        }
    }
    if (current) finalizeRow(current, rows, lastBalance);

    return rows;
}

function finalizeRow(p: { date: string; desc: string; amounts: number[] }, rows: ITransactionRow[], lastBal: number) {
    const amnts = p.amounts;
    if (amnts.length === 0) return;

    let dr = 0, cr = 0, bal = 0;

    // In 99% of bank statements, the LAST number is the Balance
    bal = amnts[amnts.length - 1];

    if (amnts.length >= 3) {
        // [Withdrawal, Deposit, Balance] or [Amt, ?, Balance]
        // We use the delta to be certain
        const val1 = amnts[0];
        const val2 = amnts[1];
        
        // If it's a 3-column layout (Dr, Cr, Bal), one of the first two is usually 0.00
        if (val1 > 0 && val2 === 0) dr = val1;
        else if (val2 > 0 && val1 === 0) cr = val2;
        else {
            // Heuristic if both > 0 (rare) or layout is different
            if (Math.abs(lastBal + val2 - bal) < 0.02) { cr = val2; dr = val1; }
            else if (Math.abs(lastBal - val1 - bal) < 0.02) { dr = val1; }
            else { cr = val2; }
        }
    } else if (amnts.length === 2) {
        // [Amount, Balance]
        const txAmt = amnts[0];
        if (rows.length > 0) {
            // Precision math: if balance increased, it's a credit
            if (bal > (lastBal + 0.01)) cr = txAmt;
            else dr = txAmt;
        } else {
            // Hard to tell for first row without opening balance, assume credit
            cr = txAmt;
        }
    } else {
        // Single number? Likely just a balance update or a single amount
        bal = amnts[0];
    }

    const cleanDesc = p.desc.replace(/vanguard|bank|statement|account|limited/gi, '').replace(/\s+/g, ' ').trim();

    rows.push({
        date: p.date,
        description: cleanDesc.substring(0, 200),
        debit: dr,
        credit: cr,
        balance: bal,
        category: categorize(cleanDesc),
        rowIndex: rows.length
    });
}

function categorize(d: string): string {
    const desc = d.toLowerCase();
    
    // 1. Income & Salary
    if (/salary|sal\/|sal-|payroll|remuneration|bonus|stipend/.test(desc)) return 'Salary';
    if (/interest|int\.?pd|int cr|tds refund/.test(desc)) return 'Interest/Income';
    if (/dividend/.test(desc)) return 'Investment Income';

    // 2. Compliance & Taxes
    if (/gst|igst|cgst|sgst|gstn|tax|tds|income tax|advance tax|it dept|challan|prof tax/.test(desc)) return 'Tax/GST';

    // 3. Investments & Savings
    if (/mutual fund|mf-|sip|zerodha|groww|upstox|angelone|stocks|securities|nse|bse/.test(desc)) return 'Investments';
    if (/insurance|lic|hdfc life|icici pru|max life|premium|tata aia/.test(desc)) return 'Insurance';
    if (/fd|fixed deposit|rd|recurring/.test(desc)) return 'Savings/FD';

    // 4. Transport & Travel
    if (/uber|ola|rapido|irctc|railway|indigo|air india|makemytrip|cleartrip|goibibo/.test(desc)) return 'Travel/Transport';
    if (/petrol|fuel|diesel|hpcl|bpcl|iocl|filling station/.test(desc)) return 'Fuel';

    // 5. Food & Shopping
    if (/amazon|flipkart|myntra|jiomart|bigbasket|blinkit|zepto/.test(desc)) return 'Shopping';
    if (/zomato|swiggy|uber eats|mcdonald|starbucks|domino|kfc|restaurant|bakery/.test(desc)) return 'Food & Dining';

    // 6. Bills & Utilities
    if (/airtel|jio|vodafone|vi |recharge|electricity|bescom|tneb|water bill|gas |broadband/.test(desc)) return 'Utility Bills';
    if (/netflix|prime video|hotstar|spotify|bookmyshow/.test(desc)) return 'Entertainment';

    // 7. Finance & Loans
    if (/emi|loan|mortgage|housing loan|car loan|credit card|cc payment/.test(desc)) return 'EMI/Loan';
    if (/atm|cash wdl|cash withdrawal/.test(desc)) return 'Cash';

    // 8. Health & Education
    if (/apollo|pharmacy|hospital|clinic|medical|lab|diagnostics/.test(desc)) return 'Medical';
    if (/fees|school|college|tuition|edtech|unacademy|byju/.test(desc)) return 'Education';

    // 9. Generic Transfers
    if (/neft|rtgs|imps|upi|transfer|trf|tfr/.test(desc)) return 'Transfer';

    return 'Miscellaneous';
}

// ─── PDF Integration ─────────────────────────────────────────────────────────

export async function parsePDF(buffer: Buffer): Promise<ParseResult> {
    const errors: string[] = [];
    try {
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: buffer, verbosity: 0 });
        await parser.load();
        const text = (await parser.getText())?.text || '';

        const bankMatch = text.match(/(?:HDFC|SBI|ICICI|AXIS|KOTAK|JIO|PUNJAB NATIONAL|UNION BANK|YES BANK|INDUSIND|CITI|HSBC|STANDARD CHARTERED)/i);
        const bankName = bankMatch ? bankMatch[0].toUpperCase() : 'Generic Bank';

        const rows = parseLines(text.split('\n'));
        
        if (rows.length === 0) errors.push("No transaction data found. If this is a scanned PDF (image), please use a digital PDF or CSV instead.");

        return {
            rows,
            bankName,
            accountNumber: text.match(/acc(?:ount)?\s*(?:no|num|#)?[:.\s]*(\d{9,18})/i)?.[1] || '',
            statementPeriod: '',
            errors,
            warnings: [],
            processingMethod: 'pdf-parse'
        };
    } catch (e: any) {
        return { rows: [], bankName: '', accountNumber: '', statementPeriod: '', errors: [e.message], warnings: [], processingMethod: 'pdf-parse' };
    }
}

export async function parseCSV(buffer: Buffer): Promise<ParseResult> {
    const rows = parseLines(buffer.toString().split('\n'));
    return { rows, bankName: 'CSV Import', accountNumber: '', statementPeriod: '', errors: [], warnings: [], processingMethod: 'manual' };
}

export function computeTotals(rows: ITransactionRow[]) {
    return {
        totalDebit: Math.round(rows.reduce((s, r) => s + r.debit, 0) * 100) / 100,
        totalCredit: Math.round(rows.reduce((s, r) => s + r.credit, 0) * 100) / 100
    };
}
