import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import firmService from '../services/firmService';
import type { Invoice } from '../services/billingService';

export const generateInvoicePDF = async (invoice: Invoice) => {
    // Fetch company settings
    let companyName = 'CA OFFICE PORTAL';
    let companyAddress = '123 Business Street, Tech City, India';
    let companyEmail = 'contact@caoffice.com';
    let companyPhone = '+91 98765 43210';

    let invoiceTemplate = 'template1';
    let invoiceTerms = '1. Payment is due within 15 days of invoice date.\n2. Please include invoice number in payment reference.\n3. This is a computer generated invoice.';

    try {
        if (invoice.multiFirmId && typeof invoice.multiFirmId === 'object') {
            // Use multi-firm branding details
            const mf = invoice.multiFirmId;
            companyName = mf.firmName || companyName;
            companyAddress = mf.address || companyAddress;
            companyEmail = mf.email || companyEmail;
            companyPhone = mf.mobile || mf.phoneL || companyPhone;
            if (mf.invoiceTemplate) invoiceTemplate = mf.invoiceTemplate;
            if (mf.invoiceTerms) invoiceTerms = mf.invoiceTerms;
        } else {
            // Use Primary FirmMaster as branding source
            const firmData = await firmService.getFirm();
            companyName = firmData.firmName || companyName;
            companyAddress = firmData.address || companyAddress;
            companyEmail = firmData.email || companyEmail;
            companyPhone = firmData.mobile || firmData.phoneL || companyPhone;
            if (firmData.invoiceTemplate) invoiceTemplate = firmData.invoiceTemplate;
            if (firmData.invoiceTerms) invoiceTerms = firmData.invoiceTerms;
        }
    } catch (error) {
        console.warn('Failed to fetch company settings, using defaults:', error);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const padding = 15;

    // --- Colors (Premium Palette) ---
    const getPrimaryColor = (): [number, number, number] => {
        switch (invoiceTemplate) {
            case 'template2': return [102, 126, 234]; // Purple
            case 'template3': return [15, 23, 42];   // Midnight Blue-Black
            case 'template4': return [67, 56, 202];  // Royal Indigo
            default: return [30, 58, 138];          // Standard Blue
        }
    };
    const primaryColor = getPrimaryColor();
    const secondaryColor: [number, number, number] = [100, 116, 139]; 
    const borderColor: [number, number, number] = [226, 232, 240]; 
    const accentColor: [number, number, number] = invoiceTemplate === 'template4' ? [180, 83, 9] : primaryColor; 

    // --- Template 3 Layout: Midnight Sidebar ---
    if (invoiceTemplate === 'template3') {
        const sidebarWidth = 65;
        // Sidebar background
        doc.setFillColor(15, 23, 42); // Midnight
        doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

        // Sidebar Branding
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, 10, 30);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225); // Light slate text
        const sidebarTextWidth = sidebarWidth - 20;
        const addressLines = doc.splitTextToSize(companyAddress, sidebarTextWidth);
        let currentY = 40;
        addressLines.forEach((line: string) => {
            doc.text(line, 10, currentY);
            currentY += 5;
        });
        doc.text(companyEmail, 10, currentY + 5);
        doc.text(companyPhone, 10, currentY + 10);

        // Sidebar Bottom Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('INVOICE TO:', 10, 100);

        const mainStartX = sidebarWidth + 10;
        
        // Header in main area
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(36);
        doc.text('INVOICE', mainStartX, 30);

        // Status
        let statusColor: [number, number, number] = [100, 116, 139];
        if (invoice.status === 'PAID') statusColor = [34, 197, 94];
        if (invoice.status === 'PENDING') statusColor = [234, 179, 8];
        const badgeWidth = 35;
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(mainStartX, 35, badgeWidth, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(invoice.status, mainStartX + (badgeWidth/2), 39, { align: 'center' });

        // Invoice Meta
        const metaY = 75;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('NUMBER', mainStartX, metaY);
        doc.text('DATE', mainStartX + 40, metaY);
        doc.text('DUE DATE', mainStartX + 80, metaY);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.invoiceNumber, mainStartX, metaY + 6);
        doc.text(format(new Date(invoice.issueDate), 'dd MMM yyyy'), mainStartX + 40, metaY + 6);
        doc.text(format(new Date(invoice.dueDate), 'dd MMM yyyy'), mainStartX + 80, metaY + 6);

        // Client Info (drawn in main area)
        const isGroupBilling = invoice.billingType === 'CLIENT_GROUP';
        const billedEntity = isGroupBilling ? invoice.clientGroupId : invoice.clientId;
        const clientName = typeof billedEntity === 'object' && billedEntity ? (billedEntity.groupName || billedEntity.name || billedEntity.username || 'Valued Client') : 'Valued Client';
        const clientAddress = typeof billedEntity === 'object' && billedEntity ? (billedEntity.address || '') : '';

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(clientName, mainStartX, 107);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const cadLines = doc.splitTextToSize(clientAddress, 80);
        doc.text(cadLines, mainStartX, 112);

        // Table and Totals
        let yPos = 135;
        const tableColumn = ["Item Description", "Qty", "Rate", "Amount"];
        const tableRows = invoice.items.map(item => [
            { content: item.name + (item.description ? `\n${item.description}` : ''), styles: { minCellHeight: 10 } },
            item.quantity,
            `INR ${item.unitPrice.toLocaleString()}`,
            `INR ${item.amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: yPos, theme: 'plain',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'left' },
            styles: { fontSize: 9, cellPadding: 4, textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.1 },
            margin: { left: mainStartX, right: padding }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const boxX = mainStartX + 40;
        const boxWidth = pageWidth - padding - boxX;
        
        doc.setFillColor(248, 250, 252);
        doc.rect(boxX, finalY, boxWidth, 40, 'F');
        
        let ty = finalY + 8;
        const drawR = (l: string, v: string, bold = false) => {
            doc.setFontSize(bold ? 11 : 9);
            doc.setTextColor(bold ? 15 : 100, bold ? 23 : 116, bold ? 42 : 139);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.text(l, boxX + 5, ty);
            doc.text(v, pageWidth - padding - 5, ty, { align: 'right' });
            ty += 7;
        };
        drawR('Subtotal', `INR ${invoice.subtotal.toLocaleString()}`);
        drawR('Tax (18%)', `INR ${invoice.tax.toLocaleString()}`);
        doc.setDrawColor(226, 232, 240);
        doc.line(boxX + 5, ty - 3, pageWidth - padding - 5, ty - 3);
        drawR('Total Amount', `INR ${invoice.totalAmount.toLocaleString()}`, true);
        if(invoice.balanceAmount > 0) drawR('Balance Due', `INR ${invoice.balanceAmount.toLocaleString()}`, true);

    } else {
        // --- Template 1, 2, 4 Logic ---
        // Header Section
        if (invoiceTemplate === 'template4') {
            doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.rect(0, 0, pageWidth, 2, 'F');
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 2, pageWidth, 5, 'F');
        } else {
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 6, 'F');
        }

        // Branding
        doc.setFontSize(24);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, padding, 30);

        doc.setFontSize(10);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont('helvetica', 'normal');

        const addressLines = doc.splitTextToSize(companyAddress, pageWidth - (padding * 2) - 80);
        let currentY = 36;
        addressLines.forEach((line: string) => {
            doc.text(line, padding, currentY);
            currentY += 5;
        });
        doc.text(`${companyEmail} | ${companyPhone}`, padding, currentY);

        // Title
        const titleText = (invoiceTemplate === 'template2' || invoiceTemplate === 'template4') ? 'TAX INVOICE' : 'INVOICE';
        doc.setFontSize(36);
        doc.setTextColor(226, 232, 240);
        doc.setFont('helvetica', 'bold');
        doc.text(titleText, pageWidth - padding, 35, { align: 'right' });

        // Status Badge
        let statusColor: [number, number, number] = [100, 116, 139];
        if (invoice.status === 'PAID') statusColor = [34, 197, 94];
        if (invoice.status === 'PENDING') statusColor = [234, 179, 8];
        if (invoice.status === 'PARTIAL') statusColor = [59, 130, 246];

        const badgeWidth = 40;
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(pageWidth - padding - badgeWidth, 45, badgeWidth, 8, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(invoice.status, pageWidth - padding - (badgeWidth / 2), 50.5, { align: 'center' });

        // Divider
        doc.setLineWidth(invoiceTemplate === 'template4' ? 1 : 0.5);
        doc.setDrawColor(invoiceTemplate === 'template4' ? accentColor[0] : borderColor[0], 
                         invoiceTemplate === 'template4' ? accentColor[1] : borderColor[1], 
                         invoiceTemplate === 'template4' ? accentColor[2] : borderColor[2]);
        doc.line(padding, 60, pageWidth - padding, 60);

        // Details
        let yPos = 75;
        doc.setFontSize(10);
        doc.setTextColor(invoiceTemplate === 'template4' ? accentColor[0] : secondaryColor[0], 
                         invoiceTemplate === 'template4' ? accentColor[1] : secondaryColor[1], 
                         invoiceTemplate === 'template4' ? accentColor[2] : secondaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO', padding, yPos);

        const isGroupBilling = invoice.billingType === 'CLIENT_GROUP';
        const billedEntity = isGroupBilling ? invoice.clientGroupId : invoice.clientId;
        const clientName = typeof billedEntity === 'object' && billedEntity ? (billedEntity.groupName || billedEntity.name || billedEntity.username || 'Valued Client') : 'Valued Client';
        const clientAddress = typeof billedEntity === 'object' && billedEntity ? (billedEntity.address || '') : '';

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(clientName, padding, yPos + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(clientAddress, 80), padding, yPos + 12);

        // Right Info
        const rightX = pageWidth / 2 + 20;
        const drawD = (l: string, v: string, y: number) => {
            doc.setFontSize(9);
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(l, rightX, y);
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text(v, pageWidth - padding, y, { align: 'right' });
        };
        drawD('INVOICE NO', invoice.invoiceNumber, yPos);
        drawD('DATE', format(new Date(invoice.issueDate), 'dd MMM yyyy'), yPos + 8);
        drawD('DUE DATE', format(new Date(invoice.dueDate), 'dd MMM yyyy'), yPos + 16);

        // Table
        yPos = 110;
        const tableColumn = ["Item Description", "Qty", "Rate", "Amount"];
        const tableRows = invoice.items.map(item => [
            item.name + (item.description ? `\n${item.description}` : ''),
            item.quantity,
            item.unitPrice.toLocaleString(),
            item.amount.toLocaleString()
        ]);

        autoTable(doc, {
            head: [tableColumn], body: tableRows, startY: yPos, theme: 'plain',
            headStyles: { 
                fillColor: invoiceTemplate === 'template4' ? [255, 251, 235] : [248, 250, 252], 
                textColor: invoiceTemplate === 'template4' ? accentColor : secondaryColor,
                fontStyle: 'bold'
            },
            styles: { fontSize: 10, cellPadding: 5, textColor: [51, 65, 85], lineColor: borderColor, lineWidth: 0.1 },
            margin: { left: padding, right: padding }
        });

        // Totals Box
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const boxWidth = 90;
        const boxX = pageWidth - padding - boxWidth;
        doc.setFillColor(invoiceTemplate === 'template4' ? 255 : 248, invoiceTemplate === 'template4' ? 251 : 250, invoiceTemplate === 'template4' ? 235 : 252); 
        doc.roundedRect(boxX, finalY, boxWidth, 40, 2, 2, 'F');
        doc.setDrawColor(invoiceTemplate === 'template4' ? accentColor[0] : borderColor[0], 
                         invoiceTemplate === 'template4' ? accentColor[1] : borderColor[1], 
                         invoiceTemplate === 'template4' ? accentColor[2] : borderColor[2]);
        doc.roundedRect(boxX, finalY, boxWidth, 40, 2, 2, 'S');

        let ty = finalY + 10;
        const drawRow = (l: string, v: string, bold = false) => {
            doc.setFontSize(bold ? 11 : 9);
            doc.setTextColor(bold ? primaryColor[0] : secondaryColor[0], bold ? primaryColor[1] : secondaryColor[1], bold ? primaryColor[2] : secondaryColor[2]);
            doc.text(l, boxX + 5, ty);
            doc.text(v, pageWidth - padding - 5, ty, { align: 'right' });
            ty += bold ? 10 : 7;
        };
        drawRow('Subtotal', `INR ${invoice.subtotal.toLocaleString()}`);
        drawRow('Tax (18%)', `INR ${invoice.tax.toLocaleString()}`);
        drawRow('Grand Total', `INR ${invoice.totalAmount.toLocaleString()}`, true);
    }

    // --- Common Footer ---
    const bottomY = pageHeight - 35;
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions', padding, bottomY);
    doc.setFontSize(7);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(invoiceTerms, 120), padding, bottomY+5);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', pageWidth - padding, bottomY, { align: 'right' });
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.line(pageWidth - padding - 40, bottomY + 10, pageWidth - padding, bottomY + 10);

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};
