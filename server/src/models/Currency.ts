import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrency extends Document {
    currencyCode: string;
    currencyName: string;
    rate: number;
    isDefault: boolean;
    status: boolean;
    firmId: mongoose.Types.ObjectId;
    branchFirmId?: string;
}

const CurrencySchema = new Schema<ICurrency>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
        branchFirmId: { type: String, default: 'primary', index: true },
        currencyCode: { type: String, required: true, uppercase: true },
        currencyName: { type: String, required: true },
        rate: { type: Number, required: true, default: 1 },
        isDefault: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CurrencySchema.index({ firmId: 1, branchFirmId: 1, currencyCode: 1 }, { unique: true });

export const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);
