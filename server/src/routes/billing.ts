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

export default router;
