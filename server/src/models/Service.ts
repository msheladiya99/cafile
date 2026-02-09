import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
    name: string;
    description: string;
    basePrice: number;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
    {
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
