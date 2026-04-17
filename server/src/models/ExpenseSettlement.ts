import mongoose, { Schema, Document } from 'mongoose';

export type SettlementStatus = 'OPEN' | 'SETTLED' | 'PARTIAL';

export interface ISettlementPartner {
    userId: mongoose.Types.ObjectId;
    name: string;
    sharePercent: number;       // e.g., 50
    shareAmount: number;        // Calculated: totalExpense * sharePercent / 100
    amountPaid: number;         // What this partner has actually paid so far
    balance: number;            // shareAmount - amountPaid (negative = overpaid, positive = owes)
}

export interface IExpenseSettlement extends Document {
    settlementId: string;
    year: string;               // e.g., "2024-25" (financial year)
    totalExpense: number;       // Sum of all APPROVED expenses for that year
    partners: ISettlementPartner[];
    status: SettlementStatus;
    settledOn?: Date;
    settledBy?: mongoose.Types.ObjectId;
    paymentMode?: string;
    paymentReference?: string;
    notes?: string;
    firmId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const partnerSchema = new Schema<ISettlementPartner>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' }, // optional — external partners may not have a user account
    name: { type: String, required: true },
    sharePercent: { type: Number, required: true, min: 0, max: 100 },
    shareAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
}, { _id: false });

const settlementSchema = new Schema<IExpenseSettlement>({
    settlementId: { type: String, required: true },
    year: { type: String, required: true },             // "2024-25"
    totalExpense: { type: Number, required: true },
    partners: [partnerSchema],
    status: {
        type: String,
        enum: ['OPEN', 'SETTLED', 'PARTIAL'],
        default: 'OPEN'
    },
    settledOn: { type: Date },
    settledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentMode: { type: String },
    paymentReference: { type: String },
    notes: { type: String },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
}, { timestamps: true });

settlementSchema.index({ firmId: 1, year: 1 });

export const ExpenseSettlement = mongoose.model<IExpenseSettlement>('ExpenseSettlement', settlementSchema);
