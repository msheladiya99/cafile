import mongoose, { Document, Schema } from 'mongoose';

export interface ISubMaster extends Document {
    name: string;
    description?: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const subMasterSchema = new Schema<ISubMaster>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export const SubMaster = mongoose.model<ISubMaster>('SubMaster', subMasterSchema);
