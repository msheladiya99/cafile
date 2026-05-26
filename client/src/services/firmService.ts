import api from './api';

export interface IPartner {
    _id?: string;
    name: string;
    designation: string;
    icaiMembershipNo?: string;
    joiningDate?: string;
    status: boolean;
    signatureImageUrl?: string;
}

export interface IAdditionalBank {
    _id?: string;
    bankName: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber: string;
    ifscCode?: string;
    ibanNo?: string;
    swiftCode?: string;
    micrCode?: string;
}

export interface FirmMasterData {
    _id?: string;
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
    membershipDate?: string;
    frnNo?: string;
    frnDate?: string;
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
    partners?: IPartner[];

    // Additional Banks
    additionalBanks?: IAdditionalBank[];

    updatedAt?: string;
    invoiceTerms?: string;
    invoiceTemplate?: string;
    extraFieldLabels?: string[];
    showLogo?: boolean;
}

export interface IFirmDocument {
    _id?: string;
    documentName: string;
    documentNumber?: string;
    description?: string;
    fileUrl?: string;
    fileId?: string;
    fileName?: string;
    fileSize?: number;
    createdAt?: string;
}

export interface ICurrencyData {
    _id?: string;
    currencyCode: string;
    currencyName: string;
    rate: number;
    isDefault: boolean;
    status: boolean;
    createdAt?: string;
}

export interface ITaxDetailData {
    _id?: string;
    name: string;
    percentageType: 'Percentage' | 'Fixed';
    percentageValue: number;
    isDefault: boolean;
    status: boolean;
    createdAt?: string;
}

export interface IMultiFirmData {
    _id?: string;
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
    bankName?: string;
    bankBranch?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    ibanNo?: string;
    swiftCode?: string;
    micrCode?: string;
    panNumber?: string;
    gstin?: string;
    licenceNo?: string;
    licenceAuthority?: string;
    invoicePrefix?: string;
    status?: boolean;
    extraField1?: string;
    extraField2?: string;
    extraField3?: string;
    extraField4?: string;
    extraField5?: string;
    extraField6?: string;
    extraField7?: string;
    supportEmails?: string;
    supportMobile?: string;
    logoUrl?: string;
    signImageUrl?: string;
    showLogo?: boolean;
    createdAt?: string;
    partners?: IPartner[];
    additionalBanks?: IAdditionalBank[];
    invoiceTerms?: string;
    invoiceTemplate?: string;
    extraFieldLabels?: string[];
}

const firmService = {
    getFirm: async (): Promise<FirmMasterData> => {
        const { data } = await api.get('/firm');
        return data;
    },
    updateFirm: async (updates: Partial<FirmMasterData>): Promise<FirmMasterData> => {
        const { data } = await api.put('/firm', updates);
        return data;
    },
    uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
        const formData = new FormData();
        formData.append('logo', file);
        const { data } = await api.post('/firm/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    uploadSignature: async (file: File): Promise<{ stampImageUrl: string }> => {
        const formData = new FormData();
        formData.append('stamp', file);
        const { data } = await api.post('/firm/stamp', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    uploadAsset: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/firm/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    // Documents
    getDocuments: async (branchFirmId?: string): Promise<IFirmDocument[]> => {
        const { data } = await api.get('/firm/documents', { params: { branchFirmId } });
        return data;
    },
    addDocument: async (payload: { documentName: string; documentNumber?: string; description?: string; file?: File; branchFirmId?: string }): Promise<IFirmDocument> => {
        const formData = new FormData();
        formData.append('documentName', payload.documentName);
        if (payload.documentNumber) formData.append('documentNumber', payload.documentNumber);
        if (payload.description) formData.append('description', payload.description);
        if (payload.file) formData.append('file', payload.file);
        if (payload.branchFirmId) formData.append('branchFirmId', payload.branchFirmId);
        const { data } = await api.post('/firm/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    deleteDocument: async (id: string): Promise<void> => {
        await api.delete(`/firm/documents/${id}`);
    },

    // Multi Firm
    getMultiFirms: async (): Promise<IMultiFirmData[]> => {
        const { data } = await api.get('/firm/multi');
        return data;
    },
    createMultiFirm: async (payload: Partial<IMultiFirmData>): Promise<IMultiFirmData> => {
        const { data } = await api.post('/firm/multi', payload);
        return data;
    },
    updateMultiFirm: async (id: string, payload: Partial<IMultiFirmData>): Promise<IMultiFirmData> => {
        const { data } = await api.put(`/firm/multi/${id}`, payload);
        return data;
    },
    deleteMultiFirm: async (id: string): Promise<void> => {
        await api.delete(`/firm/multi/${id}`);
    },
    uploadMultiFirmLogo: async (id: string, file: File): Promise<{ logoUrl: string }> => {
        const formData = new FormData(); formData.append('logo', file);
        const { data } = await api.post(`/firm/multi/${id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return data;
    },
    uploadMultiFirmSign: async (id: string, file: File): Promise<{ signImageUrl: string }> => {
        const formData = new FormData(); formData.append('sign', file);
        const { data } = await api.post(`/firm/multi/${id}/sign`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return data;
    },

    // Tax Detail
    getTaxDetails: async (branchFirmId?: string): Promise<ITaxDetailData[]> => {
        const { data } = await api.get('/firm/tax', { params: { branchFirmId } });
        return data;
    },
    createTaxDetail: async (payload: Partial<ITaxDetailData> & { branchFirmId?: string }): Promise<ITaxDetailData> => {
        const { data } = await api.post('/firm/tax', payload);
        return data;
    },
    updateTaxDetail: async (id: string, payload: Partial<ITaxDetailData> & { branchFirmId?: string }): Promise<ITaxDetailData> => {
        const { data } = await api.put(`/firm/tax/${id}`, payload);
        return data;
    },
    deleteTaxDetail: async (id: string): Promise<void> => {
        await api.delete(`/firm/tax/${id}`);
    },

    // Currency
    getCurrencies: async (branchFirmId?: string): Promise<ICurrencyData[]> => {
        const { data } = await api.get('/firm/currency', { params: { branchFirmId } });
        return data;
    },
    createCurrency: async (payload: Partial<ICurrencyData> & { branchFirmId?: string }): Promise<ICurrencyData> => {
        const { data } = await api.post('/firm/currency', payload);
        return data;
    },
    updateCurrency: async (id: string, payload: Partial<ICurrencyData> & { branchFirmId?: string }): Promise<ICurrencyData> => {
        const { data } = await api.put(`/firm/currency/${id}`, payload);
        return data;
    },
    deleteCurrency: async (id: string): Promise<void> => {
        await api.delete(`/firm/currency/${id}`);
    },
};

export default firmService;
