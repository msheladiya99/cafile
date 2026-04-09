import mongoose, { Document, Schema } from 'mongoose';

export interface ITransactionRow {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    category?: string;
    hasError?: boolean;
    errorMessage?: string;
    rowIndex?: number;
}

export interface IBankStatement extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    originalFileName: string;
    fileUrl?: string;
    bankName?: string;
    accountNumber?: string;
    statementPeriod?: string;
    extractedRows: ITransactionRow[];
    excelUrl?: string;
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    processingErrors: string[];
    processingWarnings: string[];
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
    processingMethod: 'pdf-parse' | 'ocr' | 'manual';
    createdAt: Date;
    updatedAt: Date;
}

const TransactionRowSchema = new Schema<ITransactionRow>({
    date: { type: String, default: '' },
    description: { type: String, default: '' },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    category: { type: String, default: '' },
    hasError: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
    rowIndex: { type: Number },
}, { _id: false });

const BankStatementSchema = new Schema<IBankStatement>({
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        required: true,
        index: true,
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true,
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalFileName: { type: String, required: true },
    fileUrl: { type: String },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    statementPeriod: { type: String, default: '' },
    extractedRows: { type: [TransactionRowSchema], default: [] },
    excelUrl: { type: String },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded',
    },
    processingErrors: {
        type: [String],
        default: [],
    },
    processingWarnings: {
        type: [String],
        default: [],
    },
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    processingMethod: {
        type: String,
        enum: ['pdf-parse', 'ocr', 'manual'],
        default: 'pdf-parse',
    },
}, {
    timestamps: true,
    suppressReservedKeysWarning: true,
});

BankStatementSchema.index({ firmId: 1, clientId: 1, createdAt: -1 });

export const BankStatement = mongoose.model<IBankStatement>('BankStatement', BankStatementSchema);
