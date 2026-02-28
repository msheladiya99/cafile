import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrency extends Document {
    currencyCode: string;
    currencyName: string;
    rate: number;
    isDefault: boolean;
    status: boolean;
}

const CurrencySchema = new Schema<ICurrency>(
    {
        currencyCode: { type: String, required: true, unique: true, uppercase: true },
        currencyName: { type: String, required: true },
        rate: { type: Number, required: true, default: 1 },
        isDefault: { type: Boolean, default: false },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);
