import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
    name: string;
    description: string;
    basePrice: number;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const ServiceSchema: Schema = new Schema(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            enum: ['ITR', 'GST', 'ACCOUNTING', 'OTHER'],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IService>('Service', ServiceSchema);
