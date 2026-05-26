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
    showLogo?: boolean;
    firmId: mongoose.Types.ObjectId;

    // New separate fields for branch firms
    partners?: any[];
    additionalBanks?: any[];
    invoiceTerms?: string;
    invoiceTemplate?: string;
    extraFieldLabels?: string[];
}

const MultiFirmSchema = new Schema<IMultiFirm>(
    {
        firmId: {
            type: Schema.Types.ObjectId,
            ref: 'Firm',
            required: true,
            index: true
        },
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
        showLogo: { type: Boolean, default: true },

        // Separate fields
        partners: {
            type: [
                new Schema({
                    name: { type: String, required: true },
                    designation: { type: String, default: 'Partner' },
                    icaiMembershipNo: String,
                    joiningDate: Date,
                    signatureImageUrl: String,
                    status: { type: Boolean, default: true },
                })
            ],
            default: []
        },
        additionalBanks: {
            type: [
                new Schema({
                    bankName: { type: String, required: true },
                    bankBranch: String,
                    accountHolderName: String,
                    accountNumber: { type: String, required: true },
                    ifscCode: String,
                    ibanNo: String,
                    swiftCode: String,
                    micrCode: String,
                })
            ],
            default: []
        },
        invoiceTerms: String,
        invoiceTemplate: { type: String, default: 'template1' },
        extraFieldLabels: { type: [String], default: ['', '', '', '', '', '', ''] },
    },
    { timestamps: true }
);

// Add unique index for firmId and firmName
MultiFirmSchema.index({ firmId: 1, firmName: 1 }, { unique: true });

export const MultiFirm = mongoose.model<IMultiFirm>('MultiFirm', MultiFirmSchema);
