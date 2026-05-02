import mongoose, { Document, Schema } from 'mongoose';

export interface IClientAction extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    reminderId?: mongoose.Types.ObjectId;
    ruleId?: mongoose.Types.ObjectId;
    actionType: 'DOCUMENT_UPLOADED' | 'TASK_COMPLETED' | 'CLIENT_RESPONDED' | 'NO_RESPONSE' | 'MANUAL_OVERRIDE';
    source: 'CLIENT_PORTAL' | 'ADMIN' | 'SYSTEM';
    notes?: string;
    metadata?: Record<string, unknown>;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ClientActionSchema = new Schema<IClientAction>({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    reminderId: { type: Schema.Types.ObjectId, ref: 'Reminder', index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'ReminderRule', index: true },
    actionType: {
        type: String,
        enum: ['DOCUMENT_UPLOADED', 'TASK_COMPLETED', 'CLIENT_RESPONDED', 'NO_RESPONSE', 'MANUAL_OVERRIDE'],
        required: true,
        index: true
    },
    source: { type: String, enum: ['CLIENT_PORTAL', 'ADMIN', 'SYSTEM'], default: 'SYSTEM' },
    notes: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ClientActionSchema.index({ firmId: 1, clientId: 1, createdAt: -1 });
ClientActionSchema.index({ reminderId: 1, actionType: 1 });

export default mongoose.model<IClientAction>('ClientAction', ClientActionSchema);
