import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';
    firmId?: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    lastLogin?: Date;
    createdAt: Date;
    permissions: string[];
    name?: string;
    email?: string;
    phone?: string;

    // Employee Master Fields
    status?: boolean;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    mobileNumber?: string;
    birthDate?: string;
    designation?: string;
    joiningDate?: string;
    monthlySalary?: string;
    ratePerHours?: string;
    leavingDate?: string;
    reference?: string;
    description?: string;
    emergencyFirstName?: string;
    emergencyLastName?: string;
    emergencyRelationship?: string;
    emergencyPhone?: string;
    field1?: string;
    field2?: string;
    field3?: string;
    field4?: string;
    field5?: string;
    field6?: string;
    field7?: string;

    // Other Details
    pfNumber?: string;
    esiNumber?: string;
    aadharNumber?: string;
    drivingLicenceNo?: string;

    passport?: boolean;
    passportNo?: string;
    passportAuthority?: string;
    passportDateFrom?: string;
    passportDateTo?: string;

    visa?: boolean;
    visaNo?: string;
    visaAuthority?: string;
    visaDateFrom?: string;
    visaDateTo?: string;

    eid?: boolean;
    eidNo?: string;
    eidAuthority?: string;
    eidDateFrom?: string;
    eidDateTo?: string;

    bankName?: string;
    bankBranch?: string;
    accountNo?: string;
    accountHolderName?: string;
    ifscCode?: string;
    bankAddress?: string;

    documents?: Array<{
        documentType: string;
        date: string;
        documentFormat: string;
        fileLocation: string;
        fileLabel: string;
        description: string;
        returnable: boolean;
        fileName?: string;
        driveFileId?: string;
        driveWebViewLink?: string;
    }>;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'INTERN', 'CLIENT'],
        required: true
    },
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        default: null
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    permissions: {
        type: [String],
        default: []
    },
    name: {
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
    // Employee Master Fields
    status: { type: Boolean, default: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    employeeCode: { type: String, trim: true },
    address: { type: String, trim: true },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    birthDate: { type: String, trim: true },
    designation: { type: String, trim: true },
    joiningDate: { type: String, trim: true },
    monthlySalary: { type: String, trim: true },
    ratePerHours: { type: String, trim: true },
    leavingDate: { type: String, trim: true },
    reference: { type: String, trim: true },
    description: { type: String, trim: true },
    emergencyFirstName: { type: String, trim: true },
    emergencyLastName: { type: String, trim: true },
    emergencyRelationship: { type: String, trim: true },
    emergencyPhone: { type: String, trim: true },
    field1: { type: String, trim: true },
    field2: { type: String, trim: true },
    field3: { type: String, trim: true },
    field4: { type: String, trim: true },
    field5: { type: String, trim: true },
    field6: { type: String, trim: true },
    field7: { type: String, trim: true },

    // Other Details
    pfNumber: { type: String, trim: true },
    esiNumber: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    drivingLicenceNo: { type: String, trim: true },

    passport: { type: Boolean, default: false },
    passportNo: { type: String, trim: true },
    passportAuthority: { type: String, trim: true },
    passportDateFrom: { type: String, trim: true },
    passportDateTo: { type: String, trim: true },

    visa: { type: Boolean, default: false },
    visaNo: { type: String, trim: true },
    visaAuthority: { type: String, trim: true },
    visaDateFrom: { type: String, trim: true },
    visaDateTo: { type: String, trim: true },

    eid: { type: Boolean, default: false },
    eidNo: { type: String, trim: true },
    eidAuthority: { type: String, trim: true },
    eidDateFrom: { type: String, trim: true },
    eidDateTo: { type: String, trim: true },

    bankName: { type: String, trim: true },
    bankBranch: { type: String, trim: true },
    accountNo: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    bankAddress: { type: String, trim: true },

    documents: [{
        documentType: { type: String, trim: true },
        date: { type: String, trim: true },
        documentFormat: { type: String, trim: true },
        fileLocation: { type: String, trim: true },
        fileLabel: { type: String, trim: true },
        description: { type: String, trim: true },
        returnable: { type: Boolean, default: true },
        fileName: { type: String, trim: true },
        driveFileId: { type: String, trim: true },
        driveWebViewLink: { type: String, trim: true }
    }]
});

// Add compound index for multi-tenancy
userSchema.index({ username: 1, firmId: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
