import api from './api';

export interface DSCRecord {
    _id: string;
    clientId: { _id: string; name: string; email: string; phone: string; panNumber?: string } | string;
    firmId: string;
    dscNumber: string;
    holderName: string;
    issueDate: string;
    expiryDate: string;
    dscClass?: string;
    dscType?: string;
    issuingAuthority?: string;
    purpose?: string;
    dscStatus: 'active' | 'expiring_soon' | 'expired';
    reminderSent30: boolean;
    reminderSent7: boolean;
    reminderSentExpiry: boolean;
    createdBy?: { name: string; email: string };
    createdAt: string;
    updatedAt: string;
}

export interface DSCDashboard {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    upcoming: DSCRecord[];
}

export const dscService = {
    getAll: async (params?: { status?: string; clientId?: string; search?: string }): Promise<DSCRecord[]> => {
        const query = new URLSearchParams();
        if (params?.status)   query.append('status', params.status);
        if (params?.clientId) query.append('clientId', params.clientId);
        if (params?.search)   query.append('search', params.search);
        const response = await api.get<DSCRecord[]>(`/dsc?${query.toString()}`);
        return response.data;
    },

    getDashboard: async (): Promise<DSCDashboard> => {
        const response = await api.get<DSCDashboard>('/dsc/dashboard');
        return response.data;
    },

    create: async (data: Partial<DSCRecord> & { dscPassword?: string }): Promise<DSCRecord> => {
        const response = await api.post<DSCRecord>('/dsc', data);
        return response.data;
    },

    update: async (id: string, data: Partial<DSCRecord> & { dscPassword?: string }): Promise<DSCRecord> => {
        const response = await api.put<DSCRecord>(`/dsc/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/dsc/${id}`);
    },

    viewPassword: async (id: string): Promise<{ password: string }> => {
        const response = await api.post<{ password: string }>(`/dsc/${id}/view-password`, {});
        return response.data;
    },

    getAuditLog: async (id: string): Promise<{ auditLog: { action: string; accessedBy?: { name?: string; email?: string }; accessedAt: string; ipAddress: string }[] }> => {
        const response = await api.get(`/dsc/${id}/audit-log`);
        return response.data;
    },

    exportCSV: async (): Promise<void> => {
        const response = await api.get('/dsc/export/csv', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `dsc-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
