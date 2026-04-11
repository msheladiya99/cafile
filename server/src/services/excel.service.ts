import ExcelJS from 'exceljs';
import { ITransactionRow } from '../models/BankStatement';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExcelOptions {
    clientName:      string;
    bankName?:       string;
    accountNumber?:  string;
    statementPeriod?: string;
    totalDebit:      number;
    totalCredit:     number;
    confidence?:     number;
    ocrUsed?:        boolean;
}

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const COLOR = {
    PRIMARY:    '667EEA',   // brand purple
    HEADER_BG:  '4F46E5',   // indigo header
    HEADER_FG:  'FFFFFF',
    DEBIT_BG:   'FEF2F2',   // light red
    DEBIT_FG:   'DC2626',
    CREDIT_BG:  'F0FDF4',   // light green
    CREDIT_FG:  '16A34A',
    ERROR_BG:   'FFFBEB',   // amber for errors
    SUSPICIOUS: 'FFF7ED',   // orange tint
    ALT_ROW:    'F8F9FF',   // alternate row
    BORDER:     'E2E8F0',
    TOTAL_BG:   'EFF6FF',
    FOOTER_BG:  'F1F5F9',
};

// ─── Excel Service ────────────────────────────────────────────────────────────

class ExcelService {

    /**
     * Generates a styled, multi-sheet Excel workbook.
     * Sheets: Transactions | Summary | Suspicious | Info
     */
    async generate(rows: ITransactionRow[], options: ExcelOptions): Promise<Buffer> {
        const wb = new ExcelJS.Workbook();

        wb.creator  = 'MyCAfile.com';
        wb.lastModifiedBy = 'MyCAfile.com';
        wb.created  = new Date();
        wb.modified = new Date();

        this.buildTransactionsSheet(wb, rows, options);
        this.buildSummarySheet(wb, rows, options);
        this.buildMonthlySummarySheet(wb, rows);
        this.buildSuspiciousSheet(wb, rows);
        this.buildInfoSheet(wb, options);

        const buffer = await wb.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    // ── Sheet 1: Transactions ─────────────────────────────────────────────────

    private buildTransactionsSheet(wb: ExcelJS.Workbook, rows: ITransactionRow[], opts: ExcelOptions): void {
        const ws = wb.addWorksheet('Transactions', {
            views: [{ state: 'frozen', ySplit: 3 }],  // freeze header rows
        });

        // ── Column definitions ────────────────────────────────────────────────
        ws.columns = [
            { key: 'sr',       width: 6  },
            { key: 'date',     width: 14 },
            { key: 'desc',     width: 45 },
            { key: 'debit',    width: 16 },
            { key: 'credit',   width: 16 },
            { key: 'balance',  width: 18 },
            { key: 'category', width: 20 },
            { key: 'sub',      width: 20 },
            { key: 'gst',      width: 8  },
            { key: 'conf',     width: 10 },
        ];

        // ── Row 1: Client/Bank info banner ────────────────────────────────────
        ws.mergeCells('A1:J1');
        const bannerCell = ws.getCell('A1');
        bannerCell.value = `${opts.clientName} — ${opts.bankName || 'Bank Statement'} | ${opts.statementPeriod || ''}`;
        bannerCell.font  = { bold: true, size: 13, color: { argb: COLOR.HEADER_FG } };
        bannerCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.HEADER_BG } };
        bannerCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 30;

        // ── Row 2: Column headers ─────────────────────────────────────────────
        const headers = ['Sr.', 'Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)', 'Category', 'Sub-Category', 'GST?', 'Confidence'];
        const headerRow = ws.getRow(2);
        headers.forEach((h, i) => {
            const cell   = headerRow.getCell(i + 1);
            cell.value   = h;
            cell.font    = { bold: true, color: { argb: COLOR.HEADER_FG }, size: 10 };
            cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.PRIMARY } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border  = this.border();
        });
        headerRow.height = 22;

        // ── Rows 3+: Data ─────────────────────────────────────────────────────
        rows.forEach((row, idx) => {
            const r = ws.addRow({
                sr:       idx + 1,
                date:     row.date,
                desc:     row.description,
                debit:    row.debit   > 0 ? row.debit   : null,
                credit:   row.credit  > 0 ? row.credit  : null,
                balance:  row.balance,
                category: row.category    || '',
                sub:      row.subcategory || '',
                gst:      row.gstApplicable ? '✓' : '',
                conf:     row.confidence != null ? `${row.confidence}%` : '',
            });

            // Determine row background
            let bg = idx % 2 === 0 ? 'FFFFFF' : COLOR.ALT_ROW;
            if (row.hasError)   bg = COLOR.ERROR_BG;
            if (row.suspicious) bg = COLOR.SUSPICIOUS;

            r.eachCell(cell => {
                cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.border = this.border();
                cell.font   = { size: 9 };
                cell.alignment = { vertical: 'middle', wrapText: false };
            });

            // Amount formatting
            const debitCell  = r.getCell('debit');
            const creditCell = r.getCell('credit');
            const balCell    = r.getCell('balance');

            [debitCell, creditCell, balCell].forEach(c => {
                c.numFmt = '₹#,##,##0.00;-₹#,##,##0.00';
                c.alignment = { horizontal: 'right' };
            });

            if (row.debit > 0)  { debitCell.font  = { color: { argb: COLOR.DEBIT_FG }, size: 9 }; }
            if (row.credit > 0) { creditCell.font = { color: { argb: COLOR.CREDIT_FG }, size: 9 }; }
        });

        // ── Totals row ────────────────────────────────────────────────────────
        const totalRow = ws.addRow({
            sr:      '',
            date:    '',
            desc:    'TOTAL',
            debit:   opts.totalDebit,
            credit:  opts.totalCredit,
            balance: opts.totalCredit - opts.totalDebit,
        });
        totalRow.eachCell(cell => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.TOTAL_BG } };
            cell.border = this.border();
            cell.font   = { bold: true, size: 9 };
        });
        totalRow.getCell('debit').numFmt   = '₹#,##,##0.00';
        totalRow.getCell('credit').numFmt  = '₹#,##,##0.00';
        totalRow.getCell('balance').numFmt = '₹#,##,##0.00';
        totalRow.getCell('desc').alignment = { horizontal: 'right' };

        // Auto-filter on header row
        ws.autoFilter = { from: 'A2', to: 'J2' };
    }

    // ── Sheet 2: Summary ──────────────────────────────────────────────────────

    private buildSummarySheet(wb: ExcelJS.Workbook, rows: ITransactionRow[], opts: ExcelOptions): void {
        const ws = wb.addWorksheet('Summary', {
            views: [{ state: 'frozen', ySplit: 1 }],
        });

        ws.columns = [
            { key: 'cat',    width: 28 },
            { key: 'txns',   width: 12 },
            { key: 'debit',  width: 18 },
            { key: 'credit', width: 18 },
            { key: 'net',    width: 18 },
        ];

        // Header
        const headerRow = ws.getRow(1);
        ['Category', 'Transactions', 'Total Debit (₹)', 'Total Credit (₹)', 'Net (₹)'].forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font  = { bold: true, color: { argb: COLOR.HEADER_FG } };
            cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.HEADER_BG } };
            cell.border = this.border();
            cell.alignment = { horizontal: 'center' };
        });

        // Aggregate by category
        const catMap = new Map<string, { count: number; debit: number; credit: number }>();
        for (const row of rows) {
            const cat = row.category || 'Miscellaneous';
            const existing = catMap.get(cat) || { count: 0, debit: 0, credit: 0 };
            catMap.set(cat, {
                count:  existing.count + 1,
                debit:  existing.debit  + (row.debit  || 0),
                credit: existing.credit + (row.credit || 0),
            });
        }

        // Sort by total debit descending
        const sorted = [...catMap.entries()].sort((a, b) => b[1].debit - a[1].debit);

        sorted.forEach(([cat, data], idx) => {
            const r = ws.addRow({
                cat,
                txns:   data.count,
                debit:  data.debit  > 0 ? data.debit  : null,
                credit: data.credit > 0 ? data.credit : null,
                net:    data.credit - data.debit,
            });
            const bg = idx % 2 === 0 ? 'FFFFFF' : COLOR.ALT_ROW;
            r.eachCell(c => {
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                c.border = this.border();
                c.font   = { size: 9 };
            });
            ['debit', 'credit', 'net'].forEach(key => {
                r.getCell(key).numFmt    = '₹#,##,##0.00';
                r.getCell(key).alignment = { horizontal: 'right' };
            });
        });

        ws.autoFilter = { from: 'A1', to: 'E1' };
    }

    // ── Sheet 3: Monthly Summary ────────────────────────────────────────────────────

    private buildMonthlySummarySheet(wb: ExcelJS.Workbook, rows: ITransactionRow[]): void {
        const ws = wb.addWorksheet('📅 Monthly Summary', {
            views: [{ state: 'frozen', ySplit: 1 }],
        });

        ws.columns = [
            { key: 'month',  width: 18 },
            { key: 'txns',   width: 14 },
            { key: 'debit',  width: 18 },
            { key: 'credit', width: 18 },
            { key: 'net',    width: 18 },
        ];

        // Header row
        const hdr = ws.getRow(1);
        ['Month', 'Transactions', 'Total Debit (₹)', 'Total Credit (₹)', 'Net Flow (₹)'].forEach((h, i) => {
            const cell = hdr.getCell(i + 1);
            cell.value = h;
            cell.font  = { bold: true, color: { argb: COLOR.HEADER_FG } };
            cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F766E' } }; // teal
            cell.border = this.border();
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        hdr.height = 22;

        // Aggregate by YYYY-MM
        const monthMap = new Map<string, { count: number; debit: number; credit: number }>();

        for (const row of rows) {
            // Parse DD/MM/YYYY
            const parts = (row.date || '').split('/');
            if (parts.length !== 3) continue;
            const [dd, mm, yyyy] = parts;
            const key   = `${yyyy}-${mm}`;
            const label = new Date(`${yyyy}-${mm}-01`).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
            const existing = monthMap.get(key) || { count: 0, debit: 0, credit: 0 };
            monthMap.set(key, {
                count:  existing.count  + 1,
                debit:  existing.debit  + (row.debit  || 0),
                credit: existing.credit + (row.credit || 0),
            });
            // Store label separately — indexed by key for lookup
            (monthMap as any).__labels = (monthMap as any).__labels || {};
            (monthMap as any).__labels[key] = label;
        }

        // Sort chronologically
        const sorted = [...monthMap.entries()]
            .filter(([k]) => k !== '__labels')
            .sort((a, b) => a[0].localeCompare(b[0]));

        let totalDebit = 0, totalCredit = 0, totalTxns = 0;

        sorted.forEach(([key, data], idx) => {
            const label = ((monthMap as any).__labels?.[key]) || key;
            const r = ws.addRow({
                month:  label,
                txns:   data.count,
                debit:  data.debit  > 0 ? data.debit  : null,
                credit: data.credit > 0 ? data.credit : null,
                net:    data.credit - data.debit,
            });

            totalDebit  += data.debit;
            totalCredit += data.credit;
            totalTxns   += data.count;

            const bg = idx % 2 === 0 ? 'FFFFFF' : 'F0FDFA';
            r.eachCell(c => {
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                c.border = this.border();
                c.font   = { size: 9 };
            });
            ['debit', 'credit', 'net'].forEach(k => {
                r.getCell(k).numFmt    = '₹#,##,##0.00';
                r.getCell(k).alignment = { horizontal: 'right' };
            });

            // Colour net cell
            const netCell = r.getCell('net');
            const net = data.credit - data.debit;
            netCell.font = { size: 9, color: { argb: net >= 0 ? COLOR.CREDIT_FG : COLOR.DEBIT_FG }, bold: true };
        });

        // Totals row
        const totRow = ws.addRow({
            month:  'TOTAL',
            txns:   totalTxns,
            debit:  totalDebit,
            credit: totalCredit,
            net:    totalCredit - totalDebit,
        });
        totRow.eachCell(c => {
            c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.TOTAL_BG } };
            c.border = this.border();
            c.font   = { bold: true, size: 10 };
        });
        ['debit', 'credit', 'net'].forEach(k => {
            totRow.getCell(k).numFmt    = '₹#,##,##0.00';
            totRow.getCell(k).alignment = { horizontal: 'right' };
        });

        ws.autoFilter = { from: 'A1', to: 'E1' };
    }

    // ── Sheet 4: Suspicious Rows ─────────────────────────────────────────────────

    private buildSuspiciousSheet(wb: ExcelJS.Workbook, rows: ITransactionRow[]): void {
        const ws = wb.addWorksheet('🚨 Suspicious', {});

        ws.columns = [
            { key: 'sr',     width: 6  },
            { key: 'date',   width: 14 },
            { key: 'desc',   width: 45 },
            { key: 'debit',  width: 16 },
            { key: 'credit', width: 16 },
            { key: 'balance',width: 16 },
            { key: 'reason', width: 55 },
        ];

        const headerRow = ws.getRow(1);
        ['Sr.', 'Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)', 'Flag Reason'].forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font  = { bold: true, color: { argb: COLOR.HEADER_FG } };
            cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DC2626' } };
            cell.border = this.border();
        });

        const suspicious = rows.filter(r => r.suspicious || r.hasError);
        if (suspicious.length === 0) {
            const noteRow = ws.addRow({ sr: '', date: '', desc: '✅ No suspicious transactions found.', debit: null, credit: null, balance: null, reason: '' });
            noteRow.getCell('desc').font = { italic: true, color: { argb: COLOR.CREDIT_FG } };
            return;
        }

        suspicious.forEach((row, idx) => {
            const r = ws.addRow({
                sr:      idx + 1,
                date:    row.date,
                desc:    row.description,
                debit:   row.debit   > 0 ? row.debit   : null,
                credit:  row.credit  > 0 ? row.credit  : null,
                balance: row.balance,
                reason:  row.errorMessage || '',
            });
            r.eachCell(c => {
                c.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.ERROR_BG } };
                c.border = this.border();
                c.font   = { size: 9 };
            });
            ['debit', 'credit', 'balance'].forEach(k => {
                r.getCell(k).numFmt    = '₹#,##,##0.00';
                r.getCell(k).alignment = { horizontal: 'right' };
            });
        });
    }

    // ── Sheet 4: Info ─────────────────────────────────────────────────────────

    private buildInfoSheet(wb: ExcelJS.Workbook, opts: ExcelOptions): void {
        const ws = wb.addWorksheet('Info');
        ws.columns = [{ key: 'label', width: 28 }, { key: 'value', width: 40 }];

        const info = [
            ['Client',          opts.clientName],
            ['Bank',            opts.bankName         || '—'],
            ['Account Number',  opts.accountNumber    || '—'],
            ['Statement Period',opts.statementPeriod  || '—'],
            ['Total Debit',     `₹${opts.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
            ['Total Credit',    `₹${opts.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
            ['Net Flow',        `₹${(opts.totalCredit - opts.totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
            ['AI Confidence',   opts.confidence != null ? `${opts.confidence}%` : '—'],
            ['OCR Used',        opts.ocrUsed ? 'Yes (Google Vision)' : 'No'],
            ['Generated By',    'MyCAfile.com'],
            ['Generated At',    new Date().toLocaleString('en-IN')],
        ];

        for (const [label, value] of info) {
            const r = ws.addRow({ label, value });
            r.getCell('label').font = { bold: true, size: 10 };
            r.getCell('value').font = { size: 10 };
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private border(): Partial<ExcelJS.Borders> {
        const thin: ExcelJS.BorderStyle = 'thin';
        const style = { style: thin, color: { argb: COLOR.BORDER } };
        return { top: style, left: style, bottom: style, right: style };
    }
}

export const excelService = new ExcelService();
