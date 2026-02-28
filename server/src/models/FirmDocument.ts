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
}

const FirmDocumentSchema = new Schema<IFirmDocument>(
    {
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
