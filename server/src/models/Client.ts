import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
    name?: string;
    proprietorName?: string;
    email: string;
    phone: string;
    createdAt: Date;
    // Identifiers & Grouping
    clientCode?: string;
    groupName?: mongoose.Types.ObjectId;
    itStatus?: mongoose.Types.ObjectId;
    masterType?: string;
    subMaster?: string;
    birthDate?: Date;

    // Contact & Location
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;

    // Additional Identifiers missing from old
    currency?: string;
    incorporationDateFrom?: Date;
    incorporationDateTo?: Date;
    licenceNo?: string;
    licenceAuthority?: string;
    trnNo?: string;
    description?: string;

    // Assignment & Status
    supportEmployee?: mongoose.Types.ObjectId;
    status?: boolean;
    financialYear?: string;

    // Alternate Contact
    altAddress?: string;
    altPhoneM?: string;
    altPhoneL?: string;
    altFax?: string;

    // Extra Fields
    extraField1?: string;
    extraField2?: string;
    extraField3?: string;
    extraField4?: string;
    extraField5?: string;
    extraField6?: string;
    extraField7?: string;

    // Google Drive folder IDs
    driveFolderId?: string;
    driveItrFolderId?: string;
    driveGstFolderId?: string;
    driveAccountingFolderId?: string;
    driveDocumentsFolderId?: string;
    driveNoticesFolderId?: string;

    // Identity & Compliance
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    clientType?: string;
    dscExpiry?: Date;
    complianceFlags?: string[];
    profileImageUrl?: string;

    // Office File Tracking
    physicalFileNumber?: string;
    rackLocation?: string;
    multipleContacts?: {
        name: string;
        designation: string;
        mobile: string;
        email: string;
        description: string;
        status: boolean;
    }[];
    legalDocuments?: {
        documentName: string;
        description: string;
        fileName: string;
    }[];
    firmId: mongoose.Types.ObjectId;
}

const clientSchema = new Schema<IClient>({
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        required: true,
        index: true
    },
    name: {
        type: String,
        trim: true
    },
    proprietorName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // New ClientMaster fields
    clientCode: { type: String, trim: true },
    groupName: { type: Schema.Types.ObjectId, ref: 'ClientGroup' },
    itStatus: { type: Schema.Types.ObjectId, ref: 'ITStatus' },
    masterType: { type: String, trim: true },
    subMaster: { type: String, trim: true },
    birthDate: { type: Date },

    address: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },

    currency: { type: String, trim: true },
    incorporationDateFrom: { type: Date },
    incorporationDateTo: { type: Date },
    licenceNo: { type: String, trim: true },
    licenceAuthority: { type: String, trim: true },
    trnNo: { type: String, trim: true },
    description: { type: String, trim: true },

    supportEmployee: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: Boolean, default: true },
    financialYear: { type: String, default: 'april-march' },

    altAddress: { type: String, trim: true },
    altPhoneM: { type: String, trim: true },
    altPhoneL: { type: String, trim: true },
    altFax: { type: String, trim: true },

    extraField1: { type: String, trim: true },
    extraField2: { type: String, trim: true },
    extraField3: { type: String, trim: true },
    extraField4: { type: String, trim: true },
    extraField5: { type: String, trim: true },
    extraField6: { type: String, trim: true },
    extraField7: { type: String, trim: true },

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
    driveDocumentsFolderId: {
        type: String
    },
    driveNoticesFolderId: {
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
    clientType: {
        type: String,
        trim: true,
        index: true
    },
    dscExpiry: {
        type: Date
    },
    complianceFlags: [{
        type: String,
        trim: true
    }],
    profileImageUrl: {
        type: String,
        trim: true
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
    },
    multipleContacts: [{
        name: { type: String, trim: true },
        designation: { type: String, trim: true },
        mobile: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        description: { type: String, trim: true },
        status: { type: Boolean, default: true }
    }],
    legalDocuments: [{
        documentName: { type: String, trim: true },
        description: { type: String, trim: true },
        fileName: { type: String, trim: true }
    }]
}, { timestamps: true });

// Index for faster queries
clientSchema.index({ firmId: 1, email: 1 });
clientSchema.index({ firmId: 1, name: 1 });
clientSchema.index({ firmId: 1, gstNumber: 1 });
clientSchema.index({ firmId: 1, clientType: 1, status: 1 });

export const Client = mongoose.model<IClient>('Client', clientSchema);
