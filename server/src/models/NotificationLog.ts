import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationLog extends Document {
    firmId: mongoose.Types.ObjectId;
    reminderId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    ruleId?: mongoose.Types.ObjectId;
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
    recipient: string;
    subject?: string;
    message: string;
    status: 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';
    provider?: string;
    error?: string;
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    reminderId: { type: Schema.Types.ObjectId, ref: 'Reminder', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'ReminderRule', index: true },
    channel: { type: String, enum: ['WHATSAPP', 'EMAIL', 'SMS'], required: true },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['QUEUED', 'SENT', 'FAILED', 'SKIPPED'], default: 'QUEUED', index: true },
    provider: { type: String, trim: true },
    error: { type: String, trim: true },
    sentAt: { type: Date }
}, { timestamps: true });

NotificationLogSchema.index({ firmId: 1, createdAt: -1 });
NotificationLogSchema.index({ reminderId: 1, channel: 1, createdAt: -1 });

export default mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
