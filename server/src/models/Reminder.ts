import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
    clientId: mongoose.Types.ObjectId;
    ruleId?: mongoose.Types.ObjectId;
    cycleKey?: string;
    title: string;
    description: string;
    dueDate: Date;
    reminderType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
    notifyBefore: number; // Days before due date to send notification
    notificationSent: boolean;
    lastSentAt?: Date;
    nextReminderAt?: Date;
    escalationLevel: number;
    generatedBy: 'MANUAL' | 'RULE_ENGINE' | 'DSC_CRON';
    completedAt?: Date;
    completedByActionId?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const ReminderSchema: Schema = new Schema(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        ruleId: {
            type: Schema.Types.ObjectId,
            ref: 'ReminderRule',
            index: true,
        },
        cycleKey: {
            type: String,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        reminderType: {
            type: String,
            enum: ['ITR', 'GST', 'TDS', 'DSC', 'ACCOUNTING', 'OTHER'],
            required: true,
        },
        priority: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH'],
            default: 'MEDIUM',
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'OVERDUE'],
            default: 'PENDING',
        },
        notifyBefore: {
            type: Number,
            default: 7, // Notify 7 days before due date
        },
        notificationSent: {
            type: Boolean,
            default: false,
        },
        lastSentAt: {
            type: Date,
        },
        nextReminderAt: {
            type: Date,
            index: true,
        },
        escalationLevel: {
            type: Number,
            default: 0,
            min: 0,
        },
        generatedBy: {
            type: String,
            enum: ['MANUAL', 'RULE_ENGINE', 'DSC_CRON'],
            default: 'MANUAL',
            index: true,
        },
        completedAt: {
            type: Date,
        },
        completedByActionId: {
            type: Schema.Types.ObjectId,
            ref: 'ClientAction',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
ReminderSchema.index({ clientId: 1, dueDate: 1 });
ReminderSchema.index({ status: 1, dueDate: 1 });
// Compound index for /upcoming and /overdue endpoints (firmId + status + dueDate)
ReminderSchema.index({ firmId: 1, status: 1, dueDate: 1 });
ReminderSchema.index(
    { firmId: 1, clientId: 1, ruleId: 1, cycleKey: 1 },
    { unique: true, partialFilterExpression: { ruleId: { $exists: true }, cycleKey: { $exists: true } } }
);
ReminderSchema.index({ firmId: 1, status: 1, nextReminderAt: 1 });

export default mongoose.model<IReminder>('Reminder', ReminderSchema);
