import mongoose, { Document, Schema } from 'mongoose';

export interface IITStatus extends Document {
    name: string;
    description?: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const itStatusSchema = new Schema<IITStatus>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
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
    },
    {
        timestamps: true,
    }
);

export const ITStatus = mongoose.model<IITStatus>('ITStatus', itStatusSchema);
