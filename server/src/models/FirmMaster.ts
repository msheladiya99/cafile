import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner {
    name: string;
    designation: string;
    icaiMembershipNo?: string;
    joiningDate?: Date;
    signatureImageUrl?: string;
    status: boolean;
}

export interface IFirmMaster extends Document {
    // Basic Form
    firmName: string;
    shortName?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    mobile?: string;
    email?: string;
    phoneL?: string;
    firmType?: string;

    // Bank Details
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    ibanNo?: string;
    swiftCode?: string;
    micrCode?: string;
    panNumber?: string;

    // Other Details
    firmZone?: string;
    clientCodePrefix?: string;
    invoicePrefix?: string;

    // Email IDs
    invoiceEmails?: string;
    supportEmails?: string;
    supportMobile?: string;

    // Timer Settings
    autoCloseHours?: number;

    // Firm Logo & Signature
    logoUrl?: string;
    signatureImageUrl?: string;

    // Registration Details
    gstin?: string;
    membershipNo?: string;
    membershipDate?: Date;
    frnNo?: string;
    frnDate?: Date;
    licenceNo?: string;
    licenceAuthority?: string;

    // Social Networking
    website?: string;
    facebook?: string;
    twitter?: string;
    googlePlus?: string;
    pmsAppUrl?: string;

    // Extra Fields
    extraField1?: string;
    extraField2?: string;
    extraField3?: string;
    extraField4?: string;
    extraField5?: string;
    extraField6?: string;
    extraField7?: string;

    // Partners
    partners: IPartner[];

    // New Fields
    invoiceTerms?: string;
    invoiceTemplate?: string; // e.g. 'template1', 'template2'
    extraFieldLabels?: string[]; // Array of strings for labels of extra fields 1-7
    showLogo?: boolean;
    updatedAt?: Date;
}

const PartnerSchema = new Schema<IPartner>({
    name: { type: String, required: true },
    designation: { type: String, default: 'Partner' },
    icaiMembershipNo: String,
    joiningDate: Date,
    signatureImageUrl: String,
    status: { type: Boolean, default: true },
});

const FirmMasterSchema = new Schema<IFirmMaster>(
    {
        firmName: { type: String, required: true },
        shortName: String,
        address: String,
        country: { type: String, default: 'India' },
        state: String,
        city: String,
        postalCode: String,
        mobile: String,
        email: String,
        phoneL: String,
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

        firmZone: String,
        clientCodePrefix: { type: String, default: 'CA' },
        invoicePrefix: { type: String, default: 'INV-' },

        invoiceEmails: String,
        supportEmails: String,
        supportMobile: String,

        autoCloseHours: { type: Number, default: 10 },

        logoUrl: String,
        signatureImageUrl: String,

        gstin: String,
        membershipNo: String,
        membershipDate: Date,
        frnNo: String,
        frnDate: Date,
        licenceNo: String,
        licenceAuthority: String,

        website: String,
        facebook: String,
        twitter: String,
        googlePlus: String,
        pmsAppUrl: String,

        extraField1: String,
        extraField2: String,
        extraField3: String,
        extraField4: String,
        extraField5: String,
        extraField6: String,
        extraField7: String,

        invoiceTerms: String,
        invoiceTemplate: { type: String, default: 'template1' },
        extraFieldLabels: { type: [String], default: ['', '', '', '', '', '', ''] },
        showLogo: { type: Boolean, default: true },
        partners: [PartnerSchema],
    },
    { timestamps: true }
);

export const FirmMaster = mongoose.model<IFirmMaster>('FirmMaster', FirmMasterSchema);
