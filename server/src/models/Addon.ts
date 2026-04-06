import mongoose, { Document, Schema } from 'mongoose';

export interface IAddon extends Document {
    name: string;
    description: string;
    // Legacy fields
    type?: 'STORAGE' | 'DATABASE' | 'WHATSAPP' | 'REPORTS' | 'DSC';
    yearlyPrice?: number;
    value?: number;
    // New UI fields
    price: number;
    icon: string;
    color: string;
    isActive: boolean;
}

const addonSchema = new Schema<IAddon>(
    {
        name:        { type: String, required: true },
        description: { type: String, required: true },
        type:        { type: String, enum: ['STORAGE', 'DATABASE', 'WHATSAPP', 'REPORTS', 'DSC'] },
        yearlyPrice: { type: Number },
        value:       { type: Number },
        // New fields
        price:       { type: Number, default: 0 },
        icon:        { type: String, default: 'Bolt' },
        color:       { type: String, default: 'Indigo' },
        isActive:    { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Addon = mongoose.model<IAddon>('Addon', addonSchema);
