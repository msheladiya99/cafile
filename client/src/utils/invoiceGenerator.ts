import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice } from '../services/billingService';
import { format } from 'date-fns';
import settingsService from '../services/settingsService';

export const generateInvoicePDF = async (invoice: Invoice) => {
    // Fetch company settings
    let companyName = 'CA OFFICE PORTAL';
    let companyAddress = '123 Business Street, Tech City, India';
    let companyEmail = 'contact@caoffice.com';
    let companyPhone = '+91 98765 43210';

    try {
        const settings = await settingsService.getSettings();
        companyName = settings.companyName || companyName;
        companyAddress = settings.address || companyAddress;
        companyEmail = settings.email || companyEmail;
        companyPhone = settings.phone || companyPhone;
    } catch (error) {
        console.warn('Failed to fetch company settings, using defaults:', error);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const padding = 15;

    // --- Colors (Premium Palette) ---
    const primaryColor: [number, number, number] = [30, 58, 138]; // Deep Blue
    const secondaryColor: [number, number, number] = [100, 116, 139]; // Slate Grey
    const borderColor: [number, number, number] = [226, 232, 240]; // Light Border

    // --- Header Section ---
    // Top Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // Branding
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Dark text
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, padding, 30);

    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');

    // Wrap long address text to multiple lines
    const maxAddressWidth = pageWidth - (padding * 2) - 60; // Leave space for right side content
    const addressLines = doc.splitTextToSize(companyAddress, maxAddressWidth);
    let currentY = 36;
    addressLines.forEach((line: string) => {
        doc.text(line, padding, currentY);
        currentY += 5; // Line spacing
    });

    doc.text(`${companyEmail} | ${companyPhone}`, padding, currentY);

    // Invoice Title & Status
    doc.setFontSize(36);
    doc.setTextColor(226, 232, 240); // Very light grey watermark-like
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - padding, 35, { align: 'right' });

    // Status Badge
    let statusColor: [number, number, number] = [100, 116, 139]; // Default Grey
    if (invoice.status === 'PAID') statusColor = [34, 197, 94]; // Green
    if (invoice.status === 'PENDING') statusColor = [234, 179, 8]; // Amber
    if (invoice.status === 'PARTIAL') statusColor = [59, 130, 246]; // Blue
    if (invoice.status === 'CANCELLED') statusColor = [239, 68, 68]; // Red

    const badgeWidth = 40;
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth - padding - badgeWidth, 45, badgeWidth, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.status, pageWidth - padding - (badgeWidth / 2), 50.5, { align: 'center' });

    // --- Divider ---
    doc.setLineWidth(0.5);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(padding, 60, pageWidth - padding, 60);

    // --- Details Grid ---
    let yPos = 75;

    // Left: Bill To
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', padding, yPos);

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Darker
    doc.setFont('helvetica', 'normal');
    yPos += 7;

    const clientName = typeof invoice.clientId === 'object' ? (invoice.clientId.name || invoice.clientId.username || 'Valued Client') : 'Valued Client';
    const clientAddress = typeof invoice.clientId === 'object' ? (invoice.clientId.address || '') : '';
    const clientEmail = typeof invoice.clientId === 'object' ? (invoice.clientId.email || '') : '';

    doc.setFont('helvetica', 'bold');
    doc.text(clientName, padding, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (clientAddress) {
        const addressLines = doc.splitTextToSize(clientAddress, 80);
        doc.text(addressLines, padding, yPos);
        yPos += (addressLines.length * 5);
    }
    if (clientEmail) {
        doc.text(clientEmail, padding, yPos);
    }

    // Right: Invoice Info
    yPos = 75;
    const rightColX = pageWidth / 2 + 20;

    const drawDetail = (label: string, value: string, y: number) => {
        doc.setFontSize(9);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), rightColX, y);

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(value, pageWidth - padding, y, { align: 'right' });
    };

    drawDetail('Invoice Number', invoice.invoiceNumber, yPos);
    drawDetail('Issue Date', format(new Date(invoice.issueDate), 'dd MMM yyyy'), yPos + 8);
    drawDetail('Due Date', format(new Date(invoice.dueDate), 'dd MMM yyyy'), yPos + 16);
    drawDetail('Total Amount', `INR ${invoice.totalAmount.toLocaleString()}`, yPos + 24);

    // --- Item Tables ---
    yPos += 35; // Space before table

    const tableColumn = ["Item Description", "Qty", "Rate", "Amount"];
    const tableRows = invoice.items.map(item => [
        { content: item.name + (item.description ? `\n${item.description}` : ''), styles: { minCellHeight: 10 } },
        item.quantity,
        `INR ${item.unitPrice.toLocaleString()}`,
        `INR ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'plain', // Clean look
        headStyles: {
            fillColor: [248, 250, 252], // Very light grey header
            textColor: secondaryColor,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 4
        },
        columnStyles: {
            0: { cellWidth: 'auto', valign: 'middle' },
            1: { cellWidth: 20, halign: 'center', valign: 'middle' },
            2: { cellWidth: 30, halign: 'right', valign: 'middle' },
            3: { cellWidth: 30, halign: 'right', valign: 'middle', fontStyle: 'bold' }
        },
        styles: {
            fontSize: 10,
            cellPadding: 5,
            textColor: [51, 65, 85], // Slate 700
            lineColor: borderColor,
            lineWidth: 0.1
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255]
        },
        margin: { left: padding, right: padding },
        didParseCell: (data) => {
            // Add border bottom to rows
            if (data.section === 'body') {
                data.cell.styles.lineWidth = { bottom: 0.1 };
                data.cell.styles.lineColor = borderColor;
            }
        }
    });

    // --- Totals Box ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const boxWidth = 90;
    const boxX = pageWidth - padding - boxWidth;

    // Background for totals
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(boxX, finalY, boxWidth, 45, 2, 2, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(boxX, finalY, boxWidth, 45, 2, 2, 'S');

    let totalY = finalY + 10;
    const marginR = pageWidth - padding - 5;
    const labelX = boxX + 5;

    // Helper for rows
    const drawTotalRow = (label: string, value: string, isTotal = false) => {
        doc.setFontSize(isTotal ? 12 : 10);
        doc.setTextColor(isTotal ? primaryColor[0] : secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        if (isTotal) doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

        doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
        doc.text(label, labelX, totalY);
        doc.text(value, marginR, totalY, { align: 'right' });
        totalY += isTotal ? 10 : 7;
    };

    drawTotalRow('Subtotal', `INR ${invoice.subtotal.toLocaleString()}`);
    drawTotalRow('Tax (18%)', `INR ${invoice.tax.toLocaleString()}`);

    // Line separator
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(labelX, totalY - 5, marginR, totalY - 5);

    drawTotalRow('Total Amount', `INR ${invoice.totalAmount.toLocaleString()}`, true);

    // Amount Due Highlight
    if (invoice.balanceAmount > 0) {
        doc.setTextColor(239, 68, 68); // Red
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Balance Due:', labelX, totalY);
        doc.text(`INR ${invoice.balanceAmount.toLocaleString()}`, marginR, totalY, { align: 'right' });
    } else {
        doc.setTextColor(34, 197, 94); // Green
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Fully Paid', marginR, totalY, { align: 'right' });
    }

    // --- Footer / Terms ---
    const bottomY = pageHeight - 40;

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions', padding, bottomY);

    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Payment is due within 15 days of invoice date.', padding, bottomY + 5);
    doc.text('2. Please include invoice number in payment reference.', padding, bottomY + 10);
    doc.text('3. This is a computer generated invoice.', padding, bottomY + 15);

    // Auth Signatory
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', pageWidth - padding, bottomY, { align: 'right' });

    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.line(pageWidth - padding - 40, bottomY + 15, pageWidth - padding, bottomY + 15);

    // Bottom Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

    // Save
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};
