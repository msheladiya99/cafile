import api from './api';
import type { FileData, Reminder } from '../types';

export interface FileStats {
    _id: string;
    count: number;
}

export const clientService = {
    getReminders: async (): Promise<Reminder[]> => {
        const response = await api.get('/reminders');
        return response.data;
    },

    getFiles: async (year?: string, category?: string): Promise<FileData[]> => {
        const params = new URLSearchParams();
        if (year) params.append('year', year);
        if (category) params.append('category', category);

        const response = await api.get(`/client/files?${params.toString()}`);
        return response.data;
    },

    getYears: async (): Promise<string[]> => {
        const response = await api.get('/client/years');
        return response.data;
    },

    downloadFile: async (fileId: string, fileName: string): Promise<void> => {
        const response = await api.get(`/client/download/${fileId}`, {
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

    getStats: async (): Promise<FileStats[]> => {
        const response = await api.get('/client/stats');
        return response.data;
    },
};
