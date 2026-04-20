import mongoose, { Document, Schema } from 'mongoose';

export interface IAssistantNote extends Document {
    userId: mongoose.Types.ObjectId;
    firmId?: mongoose.Types.ObjectId;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const assistantNoteSchema = new Schema<IAssistantNote>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
}, { timestamps: true });

export const AssistantNote = mongoose.model<IAssistantNote>('AssistantNote', assistantNoteSchema);
