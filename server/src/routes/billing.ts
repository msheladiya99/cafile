import { Router, Request, Response } from 'express';
import Service from '../models/Service';
import Invoice from '../models/Invoice';
import { authenticate as authMiddleware, requireAdmin, requireRoles } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// --- Service Routes (Admin only) ---

// Get all services
router.get('/services', authMiddleware, async (req: Request, res: Response) => {
    try {
        const services = await Service.find().sort({ name: 1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching services' });
    }
});

// Create service
router.post('/services', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const service = new Service(req.body);
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: 'Error creating service' });
    }
});

// Update service
router.put('/services/:id', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
    } catch (error) {
        res.status(400).json({ message: 'Error updating service' });
    }
});

// Delete service
router.delete('/services/:id', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json({ message: 'Service deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service' });
    }
});

// --- Invoice Routes ---

// Get all invoices (Admin) or client's invoices
router.get('/invoices', authMiddleware, async (req: any, res: Response) => {
    try {
        let query = {};
        if (req.user.role === 'CLIENT') {
            query = { clientId: req.user.clientId };
        } else {
            // Admin can filter by client
            if (req.query.clientId) {
                query = { clientId: req.query.clientId };
            }
        }

        const invoices = await Invoice.find(query)
            .populate('clientId', 'name email')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

// Get single invoice
router.get('/invoices/:id', authMiddleware, async (req: any, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('clientId', 'name email phone');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Security check for clients
        if (req.user.role === 'CLIENT' && invoice.clientId.toString() !== req.user.clientId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoice' });
    }
});

// Create invoice (Admin only)
router.post('/invoices', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: any, res: Response) => {
    try {
        // Generate invoice number if not provided (simple logic: INV-TIMESTAMP)
        if (!req.body.invoiceNumber) {
            req.body.invoiceNumber = `INV-${Date.now()}`;
        }

        req.body.createdBy = req.user.userId;

        const invoice = new Invoice(req.body);
        await invoice.save();
        res.status(201).json(invoice);
    } catch (error) {
        console.error('Invoice creation error:', error);
        res.status(400).json({ message: 'Error creating invoice' });
    }
});

// Add payment to invoice
router.post('/invoices/:id/payments', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        invoice.payments.push(req.body);
        await invoice.save(); // pre-save hook handles calculations
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: 'Error adding payment' });
    }
});

// Delete payment from invoice
router.delete('/invoices/:id/payments/:paymentId', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Remove payment
        const paymentIndex = invoice.payments.findIndex((p: any) => p._id.toString() === req.params.paymentId);
        if (paymentIndex === -1) return res.status(404).json({ message: 'Payment not found' });

        invoice.payments.splice(paymentIndex, 1);
        await invoice.save(); // pre-save hook recalculates totals
        res.json(invoice);
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(400).json({ message: 'Error deleting payment' });
    }
});

// Update invoice (Admin only)
router.put('/invoices/:id', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Update fields
        if (req.body.clientId) invoice.clientId = req.body.clientId;
        if (req.body.invoiceNumber) invoice.invoiceNumber = req.body.invoiceNumber;
        if (req.body.dueDate) invoice.dueDate = req.body.dueDate;
        if (req.body.issueDate) invoice.issueDate = req.body.issueDate;
        if (req.body.items) invoice.items = req.body.items;
        if (req.body.notes !== undefined) invoice.notes = req.body.notes;
        if (req.body.tax !== undefined) invoice.tax = req.body.tax;

        // Recalculate totals
        if (req.body.items || req.body.tax !== undefined) {
            const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
            invoice.subtotal = subtotal;
            invoice.totalAmount = subtotal + (invoice.tax || 0);
        }

        await invoice.save(); // pre-save hook will handle balance and status
        res.json(invoice);
    } catch (error) {
        console.error('Invoice update error:', error);
        res.status(400).json({ message: 'Error updating invoice' });
    }
});

// Update invoice status (Admin only)
router.patch('/invoices/:id/status', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ message: 'Error updating status' });
    }
});

// Delete invoice (Admin only)
router.delete('/invoices/:id', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting invoice' });
    }
});

// Check client payment status for file access
router.get('/payment-status/:clientId', authMiddleware, async (req: any, res: Response) => {
    try {
        const { clientId } = req.params;

        // Security check: Clients can only check their own status
        if (req.user.role === 'CLIENT' && clientId !== req.user.clientId?.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find all invoices for this client
        const invoices = await Invoice.find({ clientId });

        // Calculate payment statistics
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
        const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING' || inv.status === 'PARTIAL');
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

        // Check for overdue invoices
        const now = new Date();
        const overdueInvoices = pendingInvoices.filter(inv => new Date(inv.dueDate) < now);

        // Determine file access status
        // Files are accessible if:
        // 1. No invoices exist (new client)
        // 2. All invoices are paid
        // 3. No overdue invoices (grace period for pending but not overdue)
        const hasFileAccess = totalInvoices === 0 ||
            (pendingInvoices.length === 0) ||
            (overdueInvoices.length === 0);

        res.json({
            hasFileAccess,
            totalInvoices,
            paidInvoices,
            pendingInvoices: pendingInvoices.length,
            overdueInvoices: overdueInvoices.length,
            totalOutstanding,
            overdueDetails: overdueInvoices.map(inv => ({
                invoiceNumber: inv.invoiceNumber,
                dueDate: inv.dueDate,
                balanceAmount: inv.balanceAmount,
            })),
        });
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ message: 'Error checking payment status' });
    }
});

// Get client-wise ledger (Complete financial history)
router.get('/client-ledger', authMiddleware, requireRoles(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
    try {
        const { clientId, startDate, endDate, staffId } = req.query;

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.createdAt = { $gte: new Date(startDate as string) };
        }
        if (endDate) {
            dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate as string) };
        }

        // Get all clients or specific client
        const clientFilter: any = {};
        if (clientId) {
            clientFilter._id = clientId;
        }

        const Client = mongoose.model('Client');
        const clients = await Client.find(clientFilter).select('name email phone address').lean();

        // Get ledger for each client
        let clientLedgers = await Promise.all(
            clients.map(async (client: any) => {
                const invoiceFilter: any = {
                    clientId: client._id,
                    ...dateFilter
                };

                // Filter by staff if provided
                if (staffId) {
                    invoiceFilter.createdBy = staffId;
                }

                const invoices = await Invoice.find(invoiceFilter)
                    .sort({ createdAt: -1 })
                    .lean();

                // Calculate financial metrics
                const totalInvoices = invoices.length;
                const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
                const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

                // Status breakdown
                const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
                const partialInvoices = invoices.filter(inv => inv.status === 'PARTIAL').length;
                const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING').length;
                const cancelledInvoices = invoices.filter(inv => inv.status === 'CANCELLED').length;

                // Overdue calculation
                const now = new Date();
                const overdueInvoices = invoices.filter(inv =>
                    inv.status !== 'PAID' &&
                    inv.status !== 'CANCELLED' &&
                    new Date(inv.dueDate) < now
                );
                const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

                // Payment history (all payments from all invoices)
                const allPayments: any[] = [];
                invoices.forEach(invoice => {
                    invoice.payments.forEach((payment: any) => {
                        allPayments.push({
                            ...payment,
                            invoiceNumber: invoice.invoiceNumber,
                            invoiceId: invoice._id,
                            invoiceDate: invoice.issueDate
                        });
                    });
                });
                allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                // Last payment info
                const lastPayment = allPayments.length > 0 ? allPayments[0] : null;

                // Average payment time (days from invoice to full payment)
                const fullyPaidInvoices = invoices.filter(inv => inv.status === 'PAID');
                let avgPaymentDays = 0;
                if (fullyPaidInvoices.length > 0) {
                    const totalDays = fullyPaidInvoices.reduce((sum, inv) => {
                        const issueDate = new Date(inv.issueDate);
                        const lastPaymentDate = inv.payments.length > 0
                            ? new Date(inv.payments[inv.payments.length - 1].date)
                            : issueDate;
                        const days = Math.floor((lastPaymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
                        return sum + days;
                    }, 0);
                    avgPaymentDays = Math.round(totalDays / fullyPaidInvoices.length);
                }

                // Ledger entries (chronological list of all transactions)
                const ledgerEntries: any[] = [];

                invoices.forEach(invoice => {
                    // Invoice entry
                    ledgerEntries.push({
                        date: invoice.issueDate,
                        type: 'INVOICE',
                        description: `Invoice ${invoice.invoiceNumber}`,
                        invoiceNumber: invoice.invoiceNumber,
                        invoiceId: invoice._id,
                        debit: invoice.totalAmount, // Amount owed
                        credit: 0,
                        balance: 0, // Will calculate running balance
                        status: invoice.status,
                        dueDate: invoice.dueDate,
                        items: invoice.items
                    });

                    // Payment entries
                    invoice.payments.forEach((payment: any) => {
                        ledgerEntries.push({
                            date: payment.date,
                            type: 'PAYMENT',
                            description: `Payment - ${payment.method}${payment.reference ? ` (${payment.reference})` : ''}`,
                            invoiceNumber: invoice.invoiceNumber,
                            invoiceId: invoice._id,
                            paymentId: payment._id,
                            debit: 0,
                            credit: payment.amount, // Amount paid
                            balance: 0, // Will calculate running balance
                            method: payment.method,
                            reference: payment.reference
                        });
                    });
                });

                // Sort ledger entries by date (oldest first for running balance)
                ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                // Calculate running balance
                let runningBalance = 0;
                ledgerEntries.forEach(entry => {
                    runningBalance += entry.debit - entry.credit;
                    entry.balance = runningBalance;
                });

                // Reverse for display (newest first)
                ledgerEntries.reverse();

                return {
                    client: {
                        _id: client._id,
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        address: client.address
                    },
                    summary: {
                        totalInvoices,
                        totalBilled,
                        totalPaid,
                        totalDue,
                        totalOverdue,
                        paidInvoices,
                        partialInvoices,
                        pendingInvoices,
                        cancelledInvoices,
                        overdueInvoices: overdueInvoices.length,
                        avgPaymentDays,
                        lastPaymentDate: lastPayment?.date || null,
                        lastPaymentAmount: lastPayment?.amount || 0,
                        paymentRate: totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0
                    },
                    ledgerEntries,
                    invoices: invoices.map(inv => ({
                        _id: inv._id,
                        invoiceNumber: inv.invoiceNumber,
                        issueDate: inv.issueDate,
                        dueDate: inv.dueDate,
                        totalAmount: inv.totalAmount,
                        paidAmount: inv.paidAmount,
                        balanceAmount: inv.balanceAmount,
                        status: inv.status,
                        items: inv.items,
                        payments: inv.payments,
                        notes: inv.notes
                    })),
                    paymentHistory: allPayments
                };
            })
        );

        // If filtering by staff, remove empty ledgers to reduce noise
        if (staffId) {
            clientLedgers = clientLedgers.filter(cl => cl.summary.totalInvoices > 0);
        }

        // Sort by total due (descending)
        clientLedgers.sort((a, b) => b.summary.totalDue - a.summary.totalDue);

        // Overall summary
        const overallSummary = {
            totalClients: clientLedgers.length,
            totalBilled: clientLedgers.reduce((sum, cl) => sum + cl.summary.totalBilled, 0),
            totalPaid: clientLedgers.reduce((sum, cl) => sum + cl.summary.totalPaid, 0),
            totalDue: clientLedgers.reduce((sum, cl) => sum + cl.summary.totalDue, 0),
            totalOverdue: clientLedgers.reduce((sum, cl) => sum + cl.summary.totalOverdue, 0),
            clientsWithDues: clientLedgers.filter(cl => cl.summary.totalDue > 0).length,
            clientsWithOverdue: clientLedgers.filter(cl => cl.summary.totalOverdue > 0).length
        };

        res.json({
            clientLedgers,
            overallSummary,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error('Get client ledger error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
