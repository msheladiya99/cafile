import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentMethod = 'CASH' | 'BANK' | 'UPI' | 'CARD';
export type ExpenseType = 'OFFICE' | 'TRAVEL' | 'UTILITY' | 'SALARY' | 'MISC';
export type BillableStatus = 'BILLABLE' | 'NON_BILLABLE';

export interface IExpense extends Document {
    expenseId: string; // Auto / Manual
    date: Date;
    expenseType: ExpenseType;
    paymentMethod: PaymentMethod;
    referenceNo?: string; // Transaction ID / Bill No
    
    // Vendor Details
    vendorName?: string;
    vendorContact?: string;
    vendorGst?: string;
    vendorAddress?: string;

    // Financials
    category: string;
    description?: string;
    amount: number; // Subtotal
    taxAmount: number;
    totalAmount: number; // Auto Calculate

    // Allocation
    clientName?: string;
    projectWork?: string;
    billableStatus: BillableStatus;

    // Workflow
    paidBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId;
    status: ExpenseStatus;
    remarks?: string;
    receiptUrl?: string;
    
    // Reimbursement (if paid by staff and needs to be cleared by firm)
    reimbursementStatus: 'NOT_APPLICABLE' | 'PENDING' | 'REIMBURSED';
    reimbursedAt?: Date;
    reimbursedBy?: mongoose.Types.ObjectId;

    firmId: mongoose.Types.ObjectId;
    multiFirmId?: mongoose.Types.ObjectId;
    
    yearWise: string;
    monthWise: string;
    financialYear: string;
    createdAt: Date;
    updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
    expenseId: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    expenseType: { 
        type: String, 
        enum: ['OFFICE', 'TRAVEL', 'UTILITY', 'SALARY', 'MISC'], 
        default: 'OFFICE' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['CASH', 'BANK', 'UPI', 'CARD'], 
        default: 'CASH' 
    },
    referenceNo: { type: String, trim: true },
    
    vendorName: { type: String, trim: true },
    vendorContact: { type: String, trim: true },
    vendorGst: { type: String, trim: true },
    vendorAddress: { type: String, trim: true },

    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    clientName: { type: String, trim: true },
    projectWork: { type: String, trim: true },
    billableStatus: { 
        type: String, 
        enum: ['BILLABLE', 'NON_BILLABLE'], 
        default: 'NON_BILLABLE' 
    },

    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED'], 
        default: 'PENDING' 
    },
    remarks: { type: String, trim: true },
    receiptUrl: { type: String },

    reimbursementStatus: {
        type: String,
        enum: ['NOT_APPLICABLE', 'PENDING', 'REIMBURSED'],
        default: 'NOT_APPLICABLE'
    },
    reimbursedAt: { type: Date },
    reimbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    multiFirmId: { type: Schema.Types.ObjectId, ref: 'MultiFirm', index: true },
    
    yearWise: { type: String },
    monthWise: { type: String },
    financialYear: { type: String, index: true }
}, {
    timestamps: true
});

// Calculate yearWise, monthWise and financialYear before saving if not provided
expenseSchema.pre('save', async function (this: IExpense) {
    if (this.date) {
        const d = new Date(this.date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12
        
        this.yearWise = `${year}`;
        this.monthWise = `${year}-${String(month).padStart(2, '0')}`;
        
        // Calculate Financial Year (Apr-Mar)
        if (month < 4) {
            this.financialYear = `${year - 1}-${String(year).slice(-2)}`;
        } else {
            this.financialYear = `${year}-${String(year + 1).slice(-2)}`;
        }
    }
});

// Indexes for performance
expenseSchema.index({ firmId: 1, date: -1 });
expenseSchema.index({ yearWise: 1, monthWise: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ status: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
