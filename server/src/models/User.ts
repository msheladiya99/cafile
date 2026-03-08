import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';
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
    documents?: Array<{
        documentType: string;
        date: string;
        documentFormat: string;
        fileLocation: string;
        fileLabel: string;
        description: string;
        returnable: boolean;
    }>;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN', 'CLIENT'],
        required: true
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
    documents: [{
        documentType: { type: String, trim: true },
        date: { type: String, trim: true },
        documentFormat: { type: String, trim: true },
        fileLocation: { type: String, trim: true },
        fileLabel: { type: String, trim: true },
        description: { type: String, trim: true },
        returnable: { type: Boolean, default: true }
    }]
});

export const User = mongoose.model<IUser>('User', userSchema);
