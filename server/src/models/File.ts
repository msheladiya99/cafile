import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
    clientId: mongoose.Types.ObjectId;
    year?: string;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS';
    month?: string;
    docType?: string;
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
    // Google Drive fields
    driveFileId?: string;
    driveWebViewLink?: string;
    storedIn: 'local' | 'drive';
    // Smart Organization fields
    tags: string[];
    isStarred: boolean;
    isArchived: boolean;
    notes?: string;
    lastModified: Date;
}

const fileSchema = new Schema<IFile>({
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        index: true
    },
    year: {
        type: String,
        required: false
    },
    category: {
        type: String,
        enum: ['ITR', 'GST', 'ACCOUNTING', 'USER_DOCS'],
        required: true
    },
    month: {
        type: String,
        required: false
    },
    docType: {
        type: String,
        required: false
    },
    fileName: {
        type: String,
        required: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    driveFileId: {
        type: String,
        sparse: true
    },
    driveWebViewLink: {
        type: String
    },
    storedIn: {
        type: String,
        enum: ['local', 'drive'],
        default: 'local'
    },
    // Smart Organization fields
    tags: {
        type: [String],
        default: [],
        index: true
    },
    isStarred: {
        type: Boolean,
        default: false,
        index: true
    },
    isArchived: {
        type: Boolean,
        default: false,
        index: true
    },
    notes: {
        type: String,
        default: ''
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
fileSchema.index({ clientId: 1, year: 1, category: 1 });

export const File = mongoose.model<IFile>('File', fileSchema);
