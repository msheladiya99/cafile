import mongoose, { Document, Schema } from 'mongoose';

export interface IFirmSubscription {
    planId: mongoose.Types.ObjectId;
    status: 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'expired' | 'trialing';
    startDate: Date;
    endDate: Date;
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
}

export interface IFirmAddon {
    addonId: mongoose.Types.ObjectId;
    quantity: number;
    purchaseDate: Date;
    expiryDate: Date;
    razorpaySubscriptionId?: string;
}

export interface IFirm extends Document {
    firmName: string;
    subdomain: string;
    email: string;
    plan: string; // The name of the Plan (e.g. Free, Basic, Pro)
    status: 'active' | 'suspended';
    mobile?: string;
    logo?: string;
    googleDriveRootFolderId?: string;
    googleDriveType: 'app' | 'personal';
    maxAdmins: number;
    dbType: 'default' | 'personal';
    mongoUri?: string;
    dbName?: string;
    
    // SaaS Subscription System
    subscription?: IFirmSubscription;
    addons: IFirmAddon[];
    
    // Email Configuration
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string; // Encrypted
    smtpSecure?: boolean;
    smtpEnabled?: boolean;
    smtpFromName?: string;

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
            default: 'Starter' // Reference to Plan.name
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
            default: 1, // Defaulting to Free plan
            min: 1
        },
        dbType: {
            type: String,
            enum: ['default', 'personal'],
            default: 'default'
        },
        mongoUri: String,
        dbName: String,
        
        // SaaS Fields
        subscription: {
            planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
            status: { 
                type: String, 
                enum: ['active', 'past_due', 'unpaid', 'cancelled', 'expired', 'trialing'],
                default: 'trialing'
            },
            startDate: Date,
            endDate: Date,
            razorpaySubscriptionId: String,
            razorpayCustomerId: String
        },
        addons: [{
            addonId: { type: Schema.Types.ObjectId, ref: 'Addon' },
            quantity: { type: Number, default: 1 },
            purchaseDate: { type: Date, default: Date.now },
            expiryDate: Date,
            razorpaySubscriptionId: String
        }],
        
        // Custom Email Configuration
        smtpHost: String,
        smtpPort: Number,
        smtpUser: String,
        smtpPass: String,
        smtpSecure: { type: Boolean, default: false },
        smtpEnabled: { type: Boolean, default: false },
        smtpFromName: String
    },
    { timestamps: true }
);

// Index for tenant middleware lookups (subdomain + status is the most frequent query)
firmSchema.index({ subdomain: 1, status: 1 });

export const Firm = mongoose.model<IFirm>('Firm', firmSchema);
