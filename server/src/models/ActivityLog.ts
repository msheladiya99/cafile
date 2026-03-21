import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    firmId?: mongoose.Types.ObjectId;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    details?: string;
}

const activityLogSchema = new Schema<IActivityLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGIN', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE']
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    details: {
        type: String
    }
});

// Index for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ firmId: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
