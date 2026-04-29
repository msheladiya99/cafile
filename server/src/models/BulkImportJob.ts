import mongoose, { Schema, Document } from 'mongoose';

export interface IBulkImportJob extends Document {
    firmId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalRecords: number;
    processedRecords: number;
    successfulRecords: number;
    failedRecords: number;
    importErrors: string[];
    payload: any[];
    createdAt: Date;
    updatedAt: Date;
}

const BulkImportJobSchema = new Schema({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    totalRecords: { type: Number, default: 0 },
    processedRecords: { type: Number, default: 0 },
    successfulRecords: { type: Number, default: 0 },
    failedRecords: { type: Number, default: 0 },
    importErrors: [{ type: String }],
    payload: [{ type: Schema.Types.Mixed }] // Store the raw excel data here
}, { timestamps: true });

export const BulkImportJob = mongoose.model<IBulkImportJob>('BulkImportJob', BulkImportJobSchema);
