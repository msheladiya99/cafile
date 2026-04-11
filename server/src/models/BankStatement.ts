import mongoose, { Document, Schema } from 'mongoose';

// ─── Transaction Row ──────────────────────────────────────────────────────────

export interface ITransactionRow {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    category?: string;
    subcategory?: string;
    gstApplicable?: boolean;
    isTaxDeductible?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    autoFixed?: boolean;
    suspicious?: boolean;
    confidence?: number;          // 0–100: per-row AI confidence
    rowIndex?: number;
}

// ─── Bank Statement Document ──────────────────────────────────────────────────

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
    processingMethod: 'pdf-parse' | 'ocr' | 'manual' | 'ai';
    fileHash?: string;
    driveFileId?: string;
    mimeType?: string;
    // ── NEW fields ─────────────────────────────────────────────────────────────
    confidence: number;           // 0–100: overall extraction confidence
    rowConfidences: number[];     // per-row confidence array (parallel to extractedRows)
    ocrUsed: boolean;             // true if Google Vision OCR was triggered
    autoFixApplied: boolean;      // true if auto-fix suggestions were applied
    templateId?: string;          // matched BankTemplate._id (future)
    suspiciousRowCount: number;   // number of flagged suspicious rows
    missingRowCount: number;      // estimated number of gaps in balance chain
    creditConsumed: boolean;      // true once 1 credit deducted from firm
    metadata?: {
        aiProvider?: string;
        tokenUsage?: number;
        ocrEngine?: string;
        ocrPageCount?: number;
        processingTimeMs?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const TransactionRowSchema = new Schema<ITransactionRow>({
    date:             { type: String,  default: '' },
    description:      { type: String,  default: '' },
    debit:            { type: Number,  default: 0 },
    credit:           { type: Number,  default: 0 },
    balance:          { type: Number,  default: 0 },
    category:         { type: String,  default: '' },
    subcategory:      { type: String,  default: '' },
    gstApplicable:    { type: Boolean, default: false },
    isTaxDeductible:  { type: Boolean, default: false },
    hasError:         { type: Boolean, default: false },
    errorMessage:     { type: String,  default: '' },
    autoFixed:        { type: Boolean, default: false },
    suspicious:       { type: Boolean, default: false },
    confidence:       { type: Number,  default: 100 },
    rowIndex:         { type: Number },
}, { _id: false });

const BankStatementSchema = new Schema<IBankStatement>({
    firmId: {
        type: Schema.Types.ObjectId, ref: 'Firm',
        required: true, index: true,
    },
    clientId: {
        type: Schema.Types.ObjectId, ref: 'Client',
        required: true, index: true,
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true },
    fileUrl:          { type: String },
    fileHash:         { type: String, index: true },
    driveFileId:      { type: String },
    mimeType:         { type: String },
    bankName:         { type: String, default: '' },
    accountNumber:    { type: String, default: '' },
    statementPeriod:  { type: String, default: '' },
    extractedRows:    { type: [TransactionRowSchema], default: [] },
    excelUrl:         { type: String },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded',
    },
    processingErrors:   { type: [String], default: [] },
    processingWarnings: { type: [String], default: [] },
    totalDebit:         { type: Number, default: 0 },
    totalCredit:        { type: Number, default: 0 },
    transactionCount:   { type: Number, default: 0 },
    processingMethod: {
        type: String,
        enum: ['pdf-parse', 'ocr', 'manual', 'ai'],
        default: 'pdf-parse',
    },
    // ── NEW fields ─────────────────────────────────────────────────────────────
    confidence:          { type: Number,  default: 0 },
    rowConfidences:      { type: [Number], default: [] },
    ocrUsed:             { type: Boolean, default: false },
    autoFixApplied:      { type: Boolean, default: false },
    templateId:          { type: String },
    suspiciousRowCount:  { type: Number,  default: 0 },
    missingRowCount:     { type: Number,  default: 0 },
    creditConsumed:      { type: Boolean, default: false },
    metadata: {
        aiProvider:        String,
        tokenUsage:        Number,
        ocrEngine:         String,
        ocrPageCount:      Number,
        processingTimeMs:  Number,
    },
}, {
    timestamps: true,
    suppressReservedKeysWarning: true,
});

BankStatementSchema.index({ firmId: 1, clientId: 1, fileHash: 1 }, { unique: true, sparse: true });
BankStatementSchema.index({ firmId: 1, clientId: 1, createdAt: -1 });
BankStatementSchema.index({ firmId: 1, status: 1 });

export const BankStatement = mongoose.model<IBankStatement>('BankStatement', BankStatementSchema);
