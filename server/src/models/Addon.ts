import mongoose, { Document, Schema } from 'mongoose';

export interface IAddon extends Document {
    name: string;
    description: string;
    type: 'STORAGE' | 'DATABASE' | 'WHATSAPP' | 'REPORTS' | 'DSC';
    yearlyPrice: number;
    value?: number; // e.g., 50 for 50GB storage
    isActive: boolean;
}

const addonSchema = new Schema<IAddon>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        type: { 
            type: String, 
            enum: ['STORAGE', 'DATABASE', 'WHATSAPP', 'REPORTS', 'DSC'],
            required: true
        },
        yearlyPrice: { type: Number, required: true },
        value: { type: Number },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Addon = mongoose.model<IAddon>('Addon', addonSchema);
