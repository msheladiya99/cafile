import mongoose, { Document, Schema } from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ICreditTransaction {
    statementId?: mongoose.Types.ObjectId;
    creditsUsed: number;
    type: 'statement' | 'bulk' | 'reprocess' | 'topup' | 'reset';
    description: string;
    timestamp: Date;
}

export interface ICreditLedger extends Document {
    firmId: mongoose.Types.ObjectId;
    planType: 'free' | 'pro' | 'enterprise';
    monthlyLimit: number;      // 5 / 100 / -1 (unlimited)
    usedThisMonth: number;
    totalAllotted: number;     // lifetime allotted
    totalUsed: number;         // lifetime used
    resetDate: Date;           // next monthly reset
    transactions: ICreditTransaction[];
    createdAt: Date;
    updatedAt: Date;
}

// ─── Defaults per plan ────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, number> = {
    free:       100,   // was 5 — increased for better UX
    pro:        500,
    enterprise: -1,   // unlimited
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const CreditTransactionSchema = new Schema<ICreditTransaction>({
    statementId:  { type: Schema.Types.ObjectId, ref: 'BankStatement' },
    creditsUsed:  { type: Number, required: true },
    type:         { type: String, enum: ['statement', 'bulk', 'reprocess', 'topup', 'reset'], required: true },
    description:  { type: String, default: '' },
    timestamp:    { type: Date, default: Date.now },
}, { _id: false });

const CreditLedgerSchema = new Schema<ICreditLedger>({
    firmId:        { type: Schema.Types.ObjectId, ref: 'Firm', required: true, unique: true },
    planType:      { type: String, enum: ['free', 'pro', 'enterprise'], default: 'enterprise' },
    monthlyLimit:  { type: Number, default: -1 },
    usedThisMonth: { type: Number, default: 0 },
    totalAllotted: { type: Number, default: -1 },
    totalUsed:     { type: Number, default: 0 },
    resetDate: {
        type:    Date,
        default: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1, 1);
            d.setHours(0, 0, 0, 0);
            return d;
        },
    },
    transactions: { type: [CreditTransactionSchema], default: [] },
}, { timestamps: true });

export const CreditLedger = mongoose.model<ICreditLedger>('CreditLedger', CreditLedgerSchema);
