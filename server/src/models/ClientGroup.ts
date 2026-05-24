import mongoose, { Document, Schema } from 'mongoose';

export interface IClientGroup extends Document {
    groupName: string;
    address?: string;
    description?: string;
    status: boolean;
    email: string;
    mobileNumber: string;
    groupPersonName?: string;
    createdAt: Date;
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const clientGroupSchema = new Schema<IClientGroup>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        groupName: {
            type: String,
            required: [true, 'Group Name is required'],
            trim: true,
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
            lowercase: true,
            trim: true,
        },
        mobileNumber: {
            type: String,
            required: [true, 'Mobile Number is required'],
            trim: true,
        },
        groupPersonName: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

clientGroupSchema.index({ firmId: 1, groupName: 1 }, { unique: true });

export const ClientGroup = mongoose.model<IClientGroup>('ClientGroup', clientGroupSchema);
