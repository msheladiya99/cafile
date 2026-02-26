import mongoose, { Document, Schema } from 'mongoose';

export interface IITStatus extends Document {
    name: string;
    description?: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const itStatusSchema = new Schema<IITStatus>(
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

export const ITStatus = mongoose.model<IITStatus>('ITStatus', itStatusSchema);
