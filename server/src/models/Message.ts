import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
    fileId?: mongoose.Types.ObjectId; // Reference to existing file in File collection
    fileName: string;
    fileType: string; // MIME type
    fileSize: number; // in bytes
    fileUrl: string; // S3 URL or local path
    thumbnailUrl?: string; // For image previews
    storageType?: 'local' | 'drive';
    driveFileId?: string;
}

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    senderModel: 'User';
    receiverId: mongoose.Types.ObjectId;
    receiverModel: 'User';
    clientId?: mongoose.Types.ObjectId; // For grouping messages by client
    subject: string;
    message: string;
    attachments?: IAttachment[]; // File attachments
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    senderModel: {
        type: String,
        required: true,
        default: 'User'
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverModel: {
        type: String,
        required: true,
        default: 'User'
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: false,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    attachments: [{
        fileId: {
            type: Schema.Types.ObjectId,
            ref: 'File'
        },
        fileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        fileUrl: {
            type: String,
            required: true
        },
        thumbnailUrl: {
            type: String
        },
        storageType: {
            type: String,
            enum: ['local', 'drive'],
            default: 'local'
        },
        driveFileId: {
            type: String
        }
    }],
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
messageSchema.index({ clientId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
