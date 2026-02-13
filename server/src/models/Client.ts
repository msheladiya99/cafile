import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
    name: string;
    email: string;
    phone: string;
    createdAt: Date;
    // Google Drive folder IDs
    driveFolderId?: string;
    driveItrFolderId?: string;
    driveGstFolderId?: string;
    driveAccountingFolderId?: string;
    // Identity & Compliance
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    // Office File Tracking
    physicalFileNumber?: string;
    rackLocation?: string;
}

const clientSchema = new Schema<IClient>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    driveFolderId: {
        type: String
    },
    driveItrFolderId: {
        type: String
    },
    driveGstFolderId: {
        type: String
    },
    driveAccountingFolderId: {
        type: String
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    aadharNumber: {
        type: String,
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Office File Tracking
    physicalFileNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    rackLocation: {
        type: String,
        trim: true
    }
});

// Add indexes for faster searching
clientSchema.index({ name: 1 });
clientSchema.index({ phone: 1 });

export const Client = mongoose.model<IClient>('Client', clientSchema);
