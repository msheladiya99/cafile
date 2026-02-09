import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Document {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
    isActive: boolean;
    expiresAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const noticeSchema = new Schema<INotice>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['INFO', 'WARNING', 'URGENT', 'SUCCESS'],
        default: 'INFO'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient querying of active notices
noticeSchema.index({ isActive: 1, expiresAt: 1 });

export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
