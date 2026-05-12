import mongoose, { Schema, Document } from 'mongoose';

export interface ITDSEntry extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;      // Deductor (linked client)

    // Deductee Details
    deducteeName: string;
    deducteePAN: string;
    deducteeType: 'individual' | 'company' | 'firm' | 'huf' | 'other';

    // Section & Nature
    section: string;            // '192' | '194A' | '194C' | '194H' | '194I' | '194IA' | '194J' | '194Q' | '195' | 'OTHER'
    sectionLabel: string;       // Human-readable: 'Salary', 'Interest on Securities', etc.
    nature: 'salary' | 'non_salary' | 'tcs';
    formType: '24Q' | '26Q' | '27Q' | '27EQ';

    // Amounts
    grossAmount: number;
    tdsRate: number;
    tdsAmount: number;
    surcharge: number;
    educationCess: number;
    totalTax: number;

    // Dates
    deductionDate: Date;
    paymentDate?: Date;

    // Challan Info
    challanNo?: string;
    bsrCode?: string;
    challanDate?: Date;
    challanStatus: 'pending' | 'paid' | 'overdue';

    // Period
    financialYear: string;      // '2024-25', '2025-26'
    assessmentYear: string;     // '2025-26', '2026-27'
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    month: number;              // 1-12

    // Certificate
    certificateNo?: string;
    certificateDate?: Date;
    certificateIssued: boolean;

    remarks?: string;

    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// Map sections to human-readable labels
export const TDS_SECTIONS: Record<string, string> = {
    '192':   'Salary',
    '193':   'Interest on Securities',
    '194':   'Dividends',
    '194A':  'Interest (other than securities)',
    '194B':  'Winnings from Lottery/Crossword',
    '194C':  'Payment to Contractors',
    '194D':  'Insurance Commission',
    '194H':  'Commission/Brokerage',
    '194I':  'Rent',
    '194IA': 'Transfer of Immovable Property',
    '194IB': 'Rent by Individual/HUF',
    '194J':  'Professional/Technical Fees',
    '194K':  'Income from Units',
    '194N':  'Cash Withdrawal',
    '194O':  'E-commerce Participants',
    '194Q':  'Purchase of Goods',
    '194R':  'Benefit/Perquisite',
    '194S':  'Transfer of Virtual Digital Asset',
    '195':   'NRI Payments',
    '206C':  'TCS — Tax Collected at Source',
    'OTHER': 'Other',
};

const TDSEntrySchema = new Schema<ITDSEntry>({
    firmId:   { type: Schema.Types.ObjectId, ref: 'Firm',   required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },

    deducteeName: { type: String, required: true, trim: true },
    deducteePAN:  { type: String, required: true, trim: true, uppercase: true },
    deducteeType: {
        type: String,
        enum: ['individual', 'company', 'firm', 'huf', 'other'],
        default: 'individual'
    },

    section:      { type: String, required: true, trim: true },
    sectionLabel: { type: String, trim: true },
    nature: {
        type: String,
        enum: ['salary', 'non_salary', 'tcs'],
        default: 'non_salary'
    },
    formType: {
        type: String,
        enum: ['24Q', '26Q', '27Q', '27EQ'],
        required: true
    },

    grossAmount:   { type: Number, required: true, default: 0 },
    tdsRate:       { type: Number, required: true, default: 0 },
    tdsAmount:     { type: Number, required: true, default: 0 },
    surcharge:     { type: Number, default: 0 },
    educationCess: { type: Number, default: 0 },
    totalTax:      { type: Number, required: true, default: 0 },

    deductionDate: { type: Date, required: true },
    paymentDate:   { type: Date },

    challanNo:     { type: String, trim: true },
    bsrCode:       { type: String, trim: true },
    challanDate:   { type: Date },
    challanStatus: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending',
        index: true
    },

    financialYear:  { type: String, required: true, trim: true },
    assessmentYear: { type: String, trim: true },
    quarter: {
        type: String,
        enum: ['Q1', 'Q2', 'Q3', 'Q4'],
        required: true
    },
    month: { type: Number, min: 1, max: 12, required: true },

    certificateNo:      { type: String, trim: true },
    certificateDate:    { type: Date },
    certificateIssued:  { type: Boolean, default: false },

    remarks:   { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound indexes for fast queries
TDSEntrySchema.index({ firmId: 1, financialYear: 1, quarter: 1 });
TDSEntrySchema.index({ firmId: 1, clientId: 1, financialYear: 1 });
TDSEntrySchema.index({ firmId: 1, challanStatus: 1 });
TDSEntrySchema.index({ firmId: 1, section: 1 });

export const TDSEntry = mongoose.model<ITDSEntry>('TDSEntry', TDSEntrySchema);
