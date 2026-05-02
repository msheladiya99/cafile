import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageTemplate extends Document {
    firmId: mongoose.Types.ObjectId;
    name: string;
    complianceType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
    tone: 'NORMAL' | 'OVERDUE' | 'MISSED';
    subject?: string;
    body: string;
    isDefault: boolean;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    name: { type: String, required: true, trim: true },
    complianceType: {
        type: String,
        enum: ['ITR', 'GST', 'TDS', 'DSC', 'ACCOUNTING', 'OTHER'],
        required: true,
        index: true
    },
    channel: { type: String, enum: ['WHATSAPP', 'EMAIL', 'SMS'], required: true },
    tone: { type: String, enum: ['NORMAL', 'OVERDUE', 'MISSED'], default: 'NORMAL' },
    subject: { type: String, trim: true },
    body: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

MessageTemplateSchema.index({ firmId: 1, complianceType: 1, channel: 1, tone: 1, isActive: 1 });
MessageTemplateSchema.index({ firmId: 1, name: 1 }, { unique: true });

export default mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
