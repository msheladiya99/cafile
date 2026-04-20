import mongoose, { Document, Schema } from 'mongoose';

export interface IAssistantDocument extends Document {
    userId: mongoose.Types.ObjectId;
    firmId?: mongoose.Types.ObjectId;
    title: string;
    fileUrl?: string;
    mimeType?: string;
    textContext?: string;
    summary?: string;
    isProcessed: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const assistantDocumentSchema = new Schema<IAssistantDocument>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    title: { type: String, required: true },
    fileUrl: { type: String },
    mimeType: { type: String },
    textContext: { type: String },
    summary: { type: String },
    isProcessed: { type: Boolean, default: false },
    tags: [{ type: String }],
}, { timestamps: true });

export const AssistantDocument = mongoose.model<IAssistantDocument>('AssistantDocument', assistantDocumentSchema);
