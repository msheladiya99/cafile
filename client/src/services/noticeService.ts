import api from './api';

export interface Notice {
    _id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

export const noticeService = {
    getActiveNotices: async (): Promise<Notice[]> => {
        const response = await api.get('/notices/active');
        return response.data;
    },

    getAllNotices: async (): Promise<Notice[]> => {
        const response = await api.get('/notices');
        return response.data;
    },

    createNotice: async (data: { title: string; message: string; type: string; expiresAt?: string }) => {
        const response = await api.post('/notices', data);
        return response.data;
    },

    updateNotice: async (id: string, data: any) => {
        const response = await api.put(`/notices/${id}`, data);
        return response.data;
    },

    deleteNotice: async (id: string) => {
        const response = await api.delete(`/notices/${id}`);
        return response.data;
    }
};
