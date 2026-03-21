import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
    name: 'trial' | 'basic' | 'professional' | 'enterprise';
    displayName: string;
    price: string;
    staffLimit: number;
    clientLimit: number;
    storageGB: number;
    tasks: string;
    isActive: boolean;
}

const planSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            required: true,
            enum: ['trial', 'basic', 'professional', 'enterprise'],
            unique: true
        },
        displayName: { type: String, required: true },
        price: { type: String, required: true },
        staffLimit: { type: Number, required: true },
        clientLimit: { type: Number, required: true },
        storageGB: { type: Number, required: true },
        tasks: { type: String, default: 'Unlimited' },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
