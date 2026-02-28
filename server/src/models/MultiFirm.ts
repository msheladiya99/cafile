import mongoose, { Document, Schema } from 'mongoose';

export interface IMultiFirm extends Document {
    // Basic Info
    firmName: string;
    shortName?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    mobile?: string;
    phoneL?: string;
    email?: string;
    firmType?: string;

    // Bank Detail
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    ibanNo?: string;
    swiftCode?: string;
    micrCode?: string;

    // Other Detail
    panNumber?: string;
    gstin?: string;
    licenceNo?: string;
    licenceAuthority?: string;
    invoicePrefix?: string;
    status: boolean;

    // Extra Fields
    extraField1?: string;
    extraField2?: string;
    extraField3?: string;
    extraField4?: string;
    extraField5?: string;
    extraField6?: string;
    extraField7?: string;

    // Support
    supportEmails?: string;
    supportMobile?: string;

    // Images
    logoUrl?: string;
    signImageUrl?: string;
}

const MultiFirmSchema = new Schema<IMultiFirm>(
    {
        firmName: { type: String, required: true },
        shortName: String,
        address: String,
        country: { type: String, default: 'India' },
        state: String,
        city: String,
        postalCode: String,
        mobile: String,
        phoneL: String,
        email: String,
        firmType: String,
        bankName: String,
        bankBranch: String,
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        ibanNo: String,
        swiftCode: String,
        micrCode: String,
        panNumber: String,
        gstin: String,
        licenceNo: String,
        licenceAuthority: String,
        invoicePrefix: { type: String, default: 'INV-' },
        status: { type: Boolean, default: true },
        extraField1: String,
        extraField2: String,
        extraField3: String,
        extraField4: String,
        extraField5: String,
        extraField6: String,
        extraField7: String,
        supportEmails: String,
        supportMobile: String,
        logoUrl: String,
        signImageUrl: String,
    },
    { timestamps: true }
);

export const MultiFirm = mongoose.model<IMultiFirm>('MultiFirm', MultiFirmSchema);
