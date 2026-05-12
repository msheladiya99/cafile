import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TDSEntryRecord {
    _id: string;
    firmId: string;
    clientId: { _id: string; name: string; email: string; panNumber?: string } | string;
    deducteeName: string;
    deducteePAN: string;
    deducteeType: 'individual' | 'company' | 'firm' | 'huf' | 'other';
    section: string;
    sectionLabel: string;
    nature: 'salary' | 'non_salary' | 'tcs';
    formType: '24Q' | '26Q' | '27Q' | '27EQ';
    grossAmount: number;
    tdsRate: number;
    tdsAmount: number;
    surcharge: number;
    educationCess: number;
    totalTax: number;
    deductionDate: string;
    paymentDate?: string;
    challanNo?: string;
    bsrCode?: string;
    challanDate?: string;
    challanStatus: 'pending' | 'paid' | 'overdue';
    financialYear: string;
    assessmentYear: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    month: number;
    certificateNo?: string;
    certificateDate?: string;
    certificateIssued: boolean;
    remarks?: string;
    createdBy?: { name: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface TDSReturnRecord {
    _id: string;
    firmId: string;
    clientId: { _id: string; name: string; email: string; panNumber?: string } | string;
    formType: '24Q' | '26Q' | '27Q' | '27EQ';
    financialYear: string;
    assessmentYear: string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    status: 'not_filed' | 'filed' | 'revised' | 'processed' | 'correction_filed';
    filingDate?: string;
    acknowledgementNo?: string;
    tokenNo?: string;
    provisionalReceiptNo?: string;
    isRevised: boolean;
    revisionNo: number;
    totalDeductions: number;
    totalTDSAmount: number;
    totalChallanAmount: number;
    totalEntries: number;
    dueDate: string;
    isOverdue: boolean;
    lateFilingFee: number;
    interest234A: number;
    remarks?: string;
    createdBy?: { name: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface TDSDashboard {
    financialYear: string;
    counts: {
        totalEntries: number;
        pendingChallans: number;
        paidChallans: number;
        overdueChallans: number;
        returnsNotFiled: number;
        returnsFiled: number;
    };
    amounts: {
        totalTDS: number;
        totalGross: number;
        totalPaidChallan: number;
        totalPendingChallan: number;
    };
    sectionBreakdown: { _id: string; sectionLabel: string; count: number; totalTDS: number; totalGross: number }[];
    upcomingReturns: TDSReturnRecord[];
    overdueReturns: TDSReturnRecord[];
    recentEntries: TDSEntryRecord[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const tdsService = {
    // Dashboard
    getDashboard: async (fy?: string): Promise<TDSDashboard> => {
        const query = fy ? `?fy=${fy}` : '';
        const response = await api.get<TDSDashboard>(`/tds/dashboard${query}`);
        return response.data;
    },

    // Entries
    getEntries: async (params?: {
        fy?: string; quarter?: string; clientId?: string;
        section?: string; challanStatus?: string; search?: string; formType?: string;
    }): Promise<TDSEntryRecord[]> => {
        const query = new URLSearchParams();
        if (params?.fy)            query.append('fy', params.fy);
        if (params?.quarter)       query.append('quarter', params.quarter);
        if (params?.clientId)      query.append('clientId', params.clientId);
        if (params?.section)       query.append('section', params.section);
        if (params?.challanStatus) query.append('challanStatus', params.challanStatus);
        if (params?.search)        query.append('search', params.search);
        if (params?.formType)      query.append('formType', params.formType);
        const response = await api.get<TDSEntryRecord[]>(`/tds/entries?${query.toString()}`);
        return response.data;
    },

    createEntry: async (data: Partial<TDSEntryRecord>): Promise<TDSEntryRecord> => {
        const response = await api.post<TDSEntryRecord>('/tds/entries', data);
        return response.data;
    },

    updateEntry: async (id: string, data: Partial<TDSEntryRecord>): Promise<TDSEntryRecord> => {
        const response = await api.put<TDSEntryRecord>(`/tds/entries/${id}`, data);
        return response.data;
    },

    deleteEntry: async (id: string): Promise<void> => {
        await api.delete(`/tds/entries/${id}`);
    },

    // Returns
    getReturns: async (params?: {
        fy?: string; quarter?: string; clientId?: string;
        status?: string; formType?: string;
    }): Promise<TDSReturnRecord[]> => {
        const query = new URLSearchParams();
        if (params?.fy)       query.append('fy', params.fy);
        if (params?.quarter)  query.append('quarter', params.quarter);
        if (params?.clientId) query.append('clientId', params.clientId);
        if (params?.status)   query.append('status', params.status);
        if (params?.formType) query.append('formType', params.formType);
        const response = await api.get<TDSReturnRecord[]>(`/tds/returns?${query.toString()}`);
        return response.data;
    },

    createReturn: async (data: Partial<TDSReturnRecord>): Promise<TDSReturnRecord> => {
        const response = await api.post<TDSReturnRecord>('/tds/returns', data);
        return response.data;
    },

    updateReturn: async (id: string, data: Partial<TDSReturnRecord>): Promise<TDSReturnRecord> => {
        const response = await api.put<TDSReturnRecord>(`/tds/returns/${id}`, data);
        return response.data;
    },

    deleteReturn: async (id: string): Promise<void> => {
        await api.delete(`/tds/returns/${id}`);
    },

    // Export
    exportCSV: async (fy?: string): Promise<void> => {
        const query = fy ? `?fy=${fy}` : '';
        const response = await api.get(`/tds/export/csv${query}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tds-report-${fy || 'all'}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Sections reference
    getSections: async (): Promise<Record<string, string>> => {
        const response = await api.get<Record<string, string>>('/tds/sections');
        return response.data;
    },
};
