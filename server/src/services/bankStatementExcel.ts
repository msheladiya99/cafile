import ExcelJS from 'exceljs';
import type { Cell } from 'exceljs';
import { ITransactionRow } from '../models/BankStatement';

export interface ExcelOptions {
    clientName: string;
    bankName: string;
    accountNumber?: string;
    statementPeriod?: string;
    totalDebit: number;
    totalCredit: number;
}

/**
 * Generates a professionally formatted Excel file from transaction rows.
 * Returns a Buffer of the .xlsx file.
 */
export async function generateExcel(rows: ITransactionRow[], options: ExcelOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'CA Office Portal';
    workbook.lastModifiedBy = 'CA Office Portal';
    workbook.created = new Date();
    workbook.modified = new Date();

    // ─── Main Transactions Sheet ─────────────────────────────────────────────

    const sheet = workbook.addWorksheet('Bank Statement', {
        properties: { tabColor: { argb: 'FF667EEA' } },
        pageSetup: {
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
        },
    });

    // ─── Header Block ────────────────────────────────────────────────────────

    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Bank Statement — ${options.clientName}`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF667EEA' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:E2');
    const subCell = sheet.getCell('A2');
    subCell.value = `${options.bankName}${options.accountNumber ? ' | A/C: ' + options.accountNumber : ''}${options.statementPeriod ? ' | Period: ' + options.statementPeriod : ''}`;
    subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF555555' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // ─── Column Definitions ───────────────────────────────────────────────────

    sheet.columns = [
        { key: 'date', width: 14 },
        { key: 'description', width: 45 },
        { key: 'debit', width: 16 },
        { key: 'credit', width: 16 },
        { key: 'balance', width: 18 },
    ];

    // ─── Column Headers ───────────────────────────────────────────────────────

    const headerRow = sheet.getRow(3);
    const headers = ['Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'];

    headers.forEach((h, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = h;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A5568' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF667EEA' } },
            bottom: { style: 'medium', color: { argb: 'FF667EEA' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
    });
    headerRow.height = 22;

    // ─── Data Rows ────────────────────────────────────────────────────────────

    rows.forEach((row, idx) => {
        const r = sheet.addRow({
            date: row.date,
            description: row.description,
            debit: row.debit || null,
            credit: row.credit || null,
            balance: row.balance || null,
        });

        const isAlt = idx % 2 === 0;
        const bgColor = row.hasError ? 'FFFFEBEE' : isAlt ? 'FFFAFBFF' : 'FFFFFFFF';

        r.eachCell({ includeEmpty: true }, (cell: Cell, colNumber: number) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { name: 'Arial', size: 10 };
            cell.border = {
                bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } },
                left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
                right: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            };

            if (colNumber === 1) {
                // Date
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colNumber === 2) {
                // Description
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            } else if (colNumber >= 3) {
                // Amounts
                cell.numFmt = '#,##0.00';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
                if (colNumber === 3 && row.debit > 0) {
                    cell.font = { name: 'Arial', size: 10, color: { argb: 'FFCC0000' } };
                } else if (colNumber === 4 && row.credit > 0) {
                    cell.font = { name: 'Arial', size: 10, color: { argb: 'FF006600' } };
                }
            }
        });
        r.height = 18;
    });

    // ─── Totals Row ───────────────────────────────────────────────────────────

    const totalsRow = sheet.addRow({
        date: '',
        description: 'TOTAL',
        debit: options.totalDebit,
        credit: options.totalCredit,
        balance: '',
    });

    totalsRow.eachCell({ includeEmpty: true }, (cell: Cell, colNumber: number) => {
        cell.font = { name: 'Arial', size: 11, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF667EEA' } },
            bottom: { style: 'medium', color: { argb: 'FF667EEA' } },
        };

        if (colNumber === 2) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }

        if (colNumber === 3) {
            cell.numFmt = '#,##0.00';
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFCC0000' } };
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (colNumber === 4) {
            cell.numFmt = '#,##0.00';
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF006600' } };
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
    });
    totalsRow.height = 22;

    // ─── Summary Sheet ────────────────────────────────────────────────────────

    const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: 'FF764BA2' } },
    });

    summarySheet.columns = [
        { key: 'label', width: 30 },
        { key: 'value', width: 25 },
    ];

    const summaryTitle = summarySheet.getRow(1);
    summarySheet.mergeCells('A1:B1');
    summaryTitle.getCell(1).value = 'Bank Statement Summary';
    summaryTitle.getCell(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    summaryTitle.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF764BA2' } };
    summaryTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitle.height = 28;

    const summaryData = [
        ['Client Name', options.clientName],
        ['Bank Name', options.bankName],
        ['Account Number', options.accountNumber || 'N/A'],
        ['Statement Period', options.statementPeriod || 'N/A'],
        ['Total Transactions', rows.length],
        ['Total Debit (₹)', options.totalDebit],
        ['Total Credit (₹)', options.totalCredit],
        ['Net Flow (₹)', options.totalCredit - options.totalDebit],
        ['Generated On', new Date().toLocaleDateString('en-IN')],
    ];

    summaryData.forEach(([label, value], idx) => {
        const r = summarySheet.addRow({ label, value });
        const isAlt = idx % 2 === 0;
        r.eachCell({ includeEmpty: true }, (cell: Cell, colNumber: number) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'FFF8F0FF' : 'FFFFFFFF' } };
            cell.font = { name: 'Arial', size: 10, bold: colNumber === 1 };
            cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } };
            cell.alignment = { horizontal: colNumber === 2 ? 'right' : 'left', vertical: 'middle' };

            if (colNumber === 2 && typeof value === 'number' && (label as string).includes('₹')) {
                cell.numFmt = '#,##0.00';
                if ((label as string).includes('Debit')) cell.font = { ...cell.font, color: { argb: 'FFCC0000' } };
                if ((label as string).includes('Credit')) cell.font = { ...cell.font, color: { argb: 'FF006600' } };
                if ((label as string).includes('Net')) {
                    const net = options.totalCredit - options.totalDebit;
                    cell.font = { ...cell.font, color: { argb: net >= 0 ? 'FF006600' : 'FFCC0000' } };
                }
            }
        });
        r.height = 20;
    });

    // ─── Export Buffer ────────────────────────────────────────────────────────

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
