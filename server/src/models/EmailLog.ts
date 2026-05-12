import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
    firmId?: mongoose.Types.ObjectId;
    to: string;
    subject: string;
    status: 'success' | 'failed' | 'fallback';
    provider: 'smtp' | 'resend' | 'firm_smtp' | 'system_smtp';
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: false // if sent globally
        },
        to: {
            type: String,
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'fallback'],
            required: true
        },
        provider: {
            type: String,
            enum: ['smtp', 'resend', 'firm_smtp', 'system_smtp'],
            required: true
        },
        errorMessage: {
            type: String
        }
    },
    { timestamps: true }
);

emailLogSchema.index({ firmId: 1, createdAt: -1 });

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);
