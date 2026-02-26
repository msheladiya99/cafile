import mongoose, { Document, Schema } from 'mongoose';

export interface IClientGroup extends Document {
    groupName: string;
    address?: string;
    description?: string;
    status: boolean;
    email: string;
    mobileNumber: string;
    gstin?: string;
    createdAt: Date;
    updatedAt: Date;
}

const clientGroupSchema = new Schema<IClientGroup>(
    {
        groupName: {
            type: String,
            required: [true, 'Group Name is required'],
            trim: true,
            unique: true,
        },
        address: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: [true, 'Mobile Number is required'],
            trim: true,
        },
        gstin: {
            type: String,
            trim: true,
            uppercase: true,
        },
    },
    {
        timestamps: true,
    }
);

export const ClientGroup = mongoose.model<IClientGroup>('ClientGroup', clientGroupSchema);
