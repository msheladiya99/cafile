import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxDetail extends Document {
    name: string;
    percentageType: 'Percentage' | 'Fixed';
    percentageValue: number;
    isDefault: boolean;
    status: boolean;
}

const TaxDetailSchema = new Schema<ITaxDetail>(
    {
        name: { type: String, required: true },
        percentageType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
        percentageValue: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const TaxDetail = mongoose.model<ITaxDetail>('TaxDetail', TaxDetailSchema);
