import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface IAssistantChat extends Document {
    userId: mongoose.Types.ObjectId;
    firmId?: mongoose.Types.ObjectId;
    title: string;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const assistantChatSchema = new Schema<IAssistantChat>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm' },
    title: { type: String, default: 'New Chat' },
    messages: [messageSchema],
}, { timestamps: true });

export const AssistantChat = mongoose.model<IAssistantChat>('AssistantChat', assistantChatSchema);
