import mongoose, { Document, Schema } from 'mongoose';

export interface IReminder extends Document {
    clientId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    dueDate: Date;
    reminderType: 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
    notifyBefore: number; // Days before due date to send notification
    notificationSent: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ReminderSchema: Schema = new Schema(
    {
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
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
            enum: ['ITR', 'GST', 'ACCOUNTING', 'OTHER'],
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

export default mongoose.model<IReminder>('Reminder', ReminderSchema);
