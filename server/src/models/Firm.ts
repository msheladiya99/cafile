import mongoose, { Document, Schema } from 'mongoose';

export interface IFirm extends Document {
    firmName: string;
    subdomain: string;
    email: string;
    plan: 'trial' | 'basic' | 'professional' | 'enterprise';
    status: 'active' | 'suspended';
    mobile?: string;
    logo?: string;
    googleDriveRootFolderId?: string;
    googleDriveType: 'app' | 'personal';
    maxAdmins: number;
    dbType: 'default' | 'personal';
    mongoUri?: string;
    dbName?: string;
    createdAt: Date;
    updatedAt: Date;
}

const firmSchema = new Schema<IFirm>(
    {
        firmName: {
            type: String,
            required: true,
            trim: true
        },
        subdomain: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        plan: {
            type: String,
            enum: ['trial', 'basic', 'professional', 'enterprise'],
            default: 'trial'
        },
        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active'
        },
        mobile: String,
        logo: String,
        googleDriveRootFolderId: String,
        googleDriveType: {
            type: String,
            enum: ['app', 'personal'],
            default: 'app'
        },
        maxAdmins: {
            type: Number,
            default: 5,
            min: 1,
            max: 5
        },
        dbType: {
            type: String,
            enum: ['default', 'personal'],
            default: 'default'
        },
        mongoUri: String,
        dbName: String
    },
    { timestamps: true }
);

// Index for tenant middleware lookups (subdomain + status is the most frequent query)
firmSchema.index({ subdomain: 1, status: 1 });

export const Firm = mongoose.model<IFirm>('Firm', firmSchema);

