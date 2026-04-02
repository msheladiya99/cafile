import mongoose, { Schema, Document } from 'mongoose';

export type DSCStatus = 'active' | 'expiring_soon' | 'expired';

export interface IDSCAuditLog {
    accessedBy: mongoose.Types.ObjectId;
    accessedAt: Date;
    ipAddress: string;
    action: 'VIEW_PASSWORD' | 'UPDATE' | 'CREATE' | 'DELETE';
}

export interface IDSC extends Document {
    clientId: mongoose.Types.ObjectId;
    firmId: mongoose.Types.ObjectId;

    // DSC Details
    dscNumber: string;
    holderName: string;
    issueDate: Date;
    expiryDate: Date;
    dscClass?: string; // Class 2, Class 3
    dscType?: string;  // Signing, Encryption
    issuingAuthority?: string;
    purpose?: string;

    // Status
    dscStatus: DSCStatus;
    reminderSent30: boolean;
    reminderSent7: boolean;
    reminderSentExpiry: boolean;

    // Encrypted password (AES-256-CBC via existing encrypt/decrypt utils)
    dscPasswordEncrypted?: string; // stored as "iv:encrypted"

    // Audit trail
    auditLog: IDSCAuditLog[];

    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema = new Schema({
    accessedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: 'unknown' },
    action: {
        type: String,
        enum: ['VIEW_PASSWORD', 'UPDATE', 'CREATE', 'DELETE'],
        required: true
    }
}, { _id: false });

const DSCSchema = new Schema<IDSC>({
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    firmId:   { type: Schema.Types.ObjectId, ref: 'Firm',   required: true, index: true },

    dscNumber:        { type: String, required: true, trim: true },
    holderName:       { type: String, required: true, trim: true },
    issueDate:        { type: Date, required: true },
    expiryDate:       { type: Date, required: true, index: true },
    dscClass:         { type: String, trim: true },
    dscType:          { type: String, trim: true },
    issuingAuthority: { type: String, trim: true },
    purpose:          { type: String, trim: true },

    dscStatus:           { type: String, enum: ['active', 'expiring_soon', 'expired'], default: 'active', index: true },
    reminderSent30:      { type: Boolean, default: false },
    reminderSent7:       { type: Boolean, default: false },
    reminderSentExpiry:  { type: Boolean, default: false },

    // NEVER expose raw — only encrypted blob stored here
    dscPasswordEncrypted: { type: String, select: false }, // hidden by default

    auditLog: [AuditLogSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound index for fast firm + expiry queries (used by cron)
DSCSchema.index({ firmId: 1, expiryDate: 1 });
DSCSchema.index({ firmId: 1, dscStatus: 1 });

export const DSC = mongoose.model<IDSC>('DSC', DSCSchema);
