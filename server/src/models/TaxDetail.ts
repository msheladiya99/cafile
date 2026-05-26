import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxDetail extends Document {
    name: string;
    percentageType: 'Percentage' | 'Fixed';
    percentageValue: number;
    isDefault: boolean;
    status: boolean;
    firmId: mongoose.Types.ObjectId;
    branchFirmId?: string;
}

const TaxDetailSchema = new Schema<ITaxDetail>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        branchFirmId: { type: String, default: 'primary', index: true },
        name: { type: String, required: true },
        percentageType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
        percentageValue: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const TaxDetail = mongoose.model<ITaxDetail>('TaxDetail', TaxDetailSchema);
