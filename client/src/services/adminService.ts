import api from './api';
import type { Client, CreateClientData, CreateClientResponse, FileData, User } from '../types';

export type { Client, CreateClientData, CreateClientResponse, FileData };

export interface DashboardStats {
    clientCount: number;
    staffCount?: number;
    storageUsedGB?: number;
    reminders: unknown[];
    firmSubscription?: any;
    firmPlan?: string;
    planLimits?: { clients: number; storageGB: number; staff: number };
    [key: string]: unknown;
}

export const adminService = {
    createClient: async (data: CreateClientData): Promise<CreateClientResponse> => {
        const response = await api.post('/admin/create-client', data);
        return response.data;
    },

    bulkCreateClients: async (data: { clients: Partial<Client>[] }): Promise<{ successful: number, failed: number, errors: string[] }> => {
        const response = await api.post('/admin/bulk-create-clients', data);
        return response.data;
    },

    getClients: async (): Promise<Client[]> => {
        const response = await api.get('/admin/clients');
        return response.data;
    },

    getClient: async (id: string): Promise<Client> => {
        const response = await api.get(`/admin/clients/${id}`);
        return response.data;
    },

    updateClient: async (id: string, data: Partial<Client>): Promise<Client> => {
        const response = await api.patch(`/admin/clients/${id}`, data);
        return response.data;
    },

    uploadFile: async (formData: FormData): Promise<FileData> => {
        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.file; // Return the file object from the response
    },

    uploadProfileImage: async (clientId: string, file: File): Promise<{ profileImageUrl: string }> => {
        const formData = new FormData();
        formData.append('profileImage', file);
        const response = await api.post(`/admin/clients/${clientId}/profile-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    deleteProfileImage: async (clientId: string): Promise<void> => {
        await api.delete(`/admin/clients/${clientId}/profile-image`);
    },

    getClientFiles: async (clientId: string, year?: string, category?: string): Promise<FileData[]> => {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (category) params.append('category', category);

        const response = await api.get(`/admin/files/${clientId}?${params.toString()}`);
        return response.data;
    },

    getClientYears: async (clientId: string): Promise<string[]> => {
        const response = await api.get(`/admin/clients/${clientId}/years`);
        return response.data;
    },

    updateFileName: async (fileId: string, fileName: string): Promise<FileData> => {
        const response = await api.patch(`/admin/files/${fileId}`, { fileName });
        return response.data;
    },

    deleteFile: async (fileId: string): Promise<void> => {
        await api.delete(`/files/${fileId}`);
    },

    deleteFiles: async (fileIds: string[]): Promise<{ message: string; deletedCount: number; errors?: string[] }> => {
        const response = await api.post('/files/bulk-delete', { fileIds });
        return response.data;
    },

    getClientCredentials: async (clientId: string): Promise<{ username: string; note: string }> => {
        const response = await api.get(`/admin/clients/${clientId}/credentials`);
        return response.data;
    },

    resetClientPassword: async (clientId: string): Promise<{ username: string; password: string; message: string }> => {
        const response = await api.post(`/admin/clients/${clientId}/reset-password`);
        return response.data;
    },

    resendCredentials: async (clientId: string, password: string): Promise<{ message: string }> => {
        const response = await api.post(`/admin/clients/${clientId}/send-credentials`, { password });
        return response.data;
    },

    deleteClient: async (clientId: string): Promise<void> => {
        await api.delete(`/admin/clients/${clientId}`);
    },

    bulkDeleteClients: async (clientIds: string[]): Promise<{ message: string }> => {
        const response = await api.post('/admin/clients/bulk-delete', { clientIds });
        return response.data;
    },

    downloadFile: async (fileId: string, fileName: string): Promise<void> => {
        const response = await api.get(`/files/${fileId}/download`, {
            responseType: 'blob',
        });

        // Get content type from response headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';

        // Create blob with correct content type
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Smart Organization features
    toggleStar: async (fileId: string): Promise<{ isStarred: boolean }> => {
        const response = await api.patch(`/files/${fileId}/star`);
        return response.data;
    },

    toggleArchive: async (fileId: string): Promise<{ isArchived: boolean }> => {
        const response = await api.patch(`/files/${fileId}/archive`);
        return response.data;
    },

    updateTags: async (fileId: string, tags: string[]): Promise<{ tags: string[] }> => {
        const response = await api.patch(`/files/${fileId}/tags`, { tags });
        return response.data;
    },

    updateNotes: async (fileId: string, notes: string): Promise<{ notes: string }> => {
        const response = await api.patch(`/files/${fileId}/notes`, { notes });
        return response.data;
    },

    checkDuplicate: async (clientId: string, fileName: string, year: string, category: string): Promise<{ isDuplicate: boolean; existingFile?: FileData }> => {
        const response = await api.post('/files/check-duplicate', { clientId, fileName, year, category });
        return response.data;
    },

    getTags: async (clientId: string): Promise<string[]> => {
        const response = await api.get(`/files/client/${clientId}/tags`);
        return response.data;
    },
    getStaffUsers: async (): Promise<User[]> => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    getLoginLogs: async (userId?: string, startDate?: string, endDate?: string, page = 1, limit = 50): Promise<{ logs: any[], total: number, page: number, totalPages: number }> => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        const response = await api.get(`/admin/employee/login-logs?${params.toString()}`);
        return response.data;
    },

    getFreeEmployees: async (): Promise<{ _id: string, name: string, username: string, email: string, phone: string, role: string }[]> => {
        const response = await api.get('/admin/employee/free-list');
        return response.data;
    },
    getITStatus: async (): Promise<{ _id: string; name: string }[]> => {
        const response = await api.get('/admin/it-status');
        return response.data;
    },
    getSubMasters: async (): Promise<{ _id: string; name: string }[]> => {
        const response = await api.get('/admin/sub-master');
        return response.data;
    },
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },
};
