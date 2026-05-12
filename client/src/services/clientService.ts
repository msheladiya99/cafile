import api from './api';
import type { FileData, Reminder } from '../types';

export interface FileStats {
    _id: string;
    count: number;
}

export interface ClientTask {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: 'PENDING' | 'IN_PROCESS' | 'PENDING_FOR_APPROVAL' | 'APPROVED' | 'DONE' | 'CANCELLED' | 'ON_HOLD' | 'PENDING_FROM_CLIENT' | 'PENDING_FROM_DEPARTMENT' | 'REJECTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    targetDate: string;
    progressPercentage: number;
    year?: string;
    isOverdue: boolean;
    createdAt: string;
    updatedAt: string;
}

export type TaskSummary = Record<string, number>;

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

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

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

    getTasks: async (): Promise<ClientTask[]> => {
        const response = await api.get('/client/tasks');
        return response.data;
    },

    getTaskSummary: async (): Promise<TaskSummary> => {
        const response = await api.get('/client/task-summary');
        return response.data;
    }
};
