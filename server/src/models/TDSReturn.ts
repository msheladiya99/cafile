import mongoose, { Schema, Document } from 'mongoose';

export interface ITDSReturn extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;      // Deductor (linked client)

    formType: '24Q' | '26Q' | '27Q' | '27EQ';
    financialYear: string;                  // '2024-25'
    assessmentYear: string;                 // '2025-26'
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';

    // Filing Status
    status: 'not_filed' | 'filed' | 'revised' | 'processed' | 'correction_filed';
    filingDate?: Date;
    acknowledgementNo?: string;
    tokenNo?: string;
    provisionalReceiptNo?: string;

    // Revision tracking
    isRevised: boolean;
    originalReturnId?: mongoose.Types.ObjectId;
    revisionNo: number;

    // Totals (computed from entries)
    totalDeductions: number;
    totalTDSAmount: number;
    totalChallanAmount: number;
    totalEntries: number;

    // Deadline
    dueDate: Date;
    isOverdue: boolean;

    // Late filing
    lateFilingFee?: number;   // u/s 234E
    interest234A?: number;    // Interest for late filing

    remarks?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TDSReturnSchema = new Schema<ITDSReturn>({
    firmId:   { type: Schema.Types.ObjectId, ref: 'Firm',   required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },

    formType: {
        type: String,
        enum: ['24Q', '26Q', '27Q', '27EQ'],
        required: true
    },
    financialYear:  { type: String, required: true, trim: true },
    assessmentYear: { type: String, trim: true },
    quarter: {
        type: String,
        enum: ['Q1', 'Q2', 'Q3', 'Q4'],
        required: true
    },

    status: {
        type: String,
        enum: ['not_filed', 'filed', 'revised', 'processed', 'correction_filed'],
        default: 'not_filed',
        index: true
    },
    filingDate:            { type: Date },
    acknowledgementNo:    { type: String, trim: true },
    tokenNo:              { type: String, trim: true },
    provisionalReceiptNo: { type: String, trim: true },

    isRevised:       { type: Boolean, default: false },
    originalReturnId: { type: Schema.Types.ObjectId, ref: 'TDSReturn' },
    revisionNo:      { type: Number, default: 0 },

    totalDeductions:    { type: Number, default: 0 },
    totalTDSAmount:     { type: Number, default: 0 },
    totalChallanAmount: { type: Number, default: 0 },
    totalEntries:       { type: Number, default: 0 },

    dueDate:    { type: Date, required: true },
    isOverdue:  { type: Boolean, default: false },

    lateFilingFee: { type: Number, default: 0 },
    interest234A:  { type: Number, default: 0 },

    remarks:   { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound indexes
TDSReturnSchema.index({ firmId: 1, financialYear: 1, quarter: 1 });
TDSReturnSchema.index({ firmId: 1, clientId: 1, financialYear: 1, formType: 1, quarter: 1 });
TDSReturnSchema.index({ firmId: 1, status: 1 });

export const TDSReturn = mongoose.model<ITDSReturn>('TDSReturn', TDSReturnSchema);
