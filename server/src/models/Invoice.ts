import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoiceItem {
    serviceId?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface IPayment {
    amount: number;
    date: Date;
    method: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
    transactionId?: string;
    note?: string;
}

export interface IInvoice extends Document {
    invoiceNumber: string;
    clientId: mongoose.Types.ObjectId;
    items: IInvoiceItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
    dueDate: Date;
    issueDate: Date;
    payments: IPayment[];
    notes?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true },
});

const PaymentSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: {
        type: String,
        enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'],
        required: true
    },
    transactionId: { type: String },
    note: { type: String },
});

const InvoiceSchema: Schema = new Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        items: [InvoiceItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        balanceAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED'],
            default: 'PENDING',
        },
        dueDate: {
            type: Date,
            required: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        payments: [PaymentSchema],
        notes: {
            type: String,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-calculate balance before saving
InvoiceSchema.pre('save', function () {
    const invoice = this as any;
    invoice.paidAmount = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    // Do not override CANCELLED status with auto-calculation
    if (invoice.status === 'CANCELLED') {
        return;
    }

    if (invoice.paidAmount === 0) {
        invoice.status = 'PENDING';
    } else if (invoice.balanceAmount <= 0) {
        invoice.status = 'PAID';
        invoice.balanceAmount = 0;
    } else {
        invoice.status = 'PARTIAL';
    }
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
