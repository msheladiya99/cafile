import mongoose, { Document, Schema } from 'mongoose';

export interface IFirmDocument extends Document {
    documentName: string;
    documentNumber?: string;
    description?: string;
    fileUrl?: string;
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: Date;
    firmId: mongoose.Types.ObjectId;
    branchFirmId?: string;
}

const FirmDocumentSchema = new Schema<IFirmDocument>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        branchFirmId: { type: String, default: 'primary', index: true },
        documentName: { type: String, required: true },
        documentNumber: String,
        description: String,
        fileUrl: String,
        fileId: String,
        fileName: String,
        fileSize: Number,
    },
    { timestamps: true }
);

export const FirmDocument = mongoose.model<IFirmDocument>('FirmDocument', FirmDocumentSchema);
