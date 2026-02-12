import api from './api';
import type { Client, CreateClientData, CreateClientResponse, FileData } from '../types';

export type { Client, CreateClientData, CreateClientResponse, FileData };

export const adminService = {
    createClient: async (data: CreateClientData): Promise<CreateClientResponse> => {
        const response = await api.post('/admin/create-client', data);
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

    deleteClient: async (clientId: string): Promise<void> => {
        await api.delete(`/admin/clients/${clientId}`);
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
};
