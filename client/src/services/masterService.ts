import api from './api';

export interface ITStatus {
    _id?: string;
    name: string;
    description?: string;
    status: boolean;
}

export interface SubMaster {
    _id?: string;
    name: string;
    description?: string;
    status: boolean;
}

export const masterService = {
    // IT Status
    createITStatus: async (data: ITStatus) => {
        const response = await api.post('/admin/it-status', data);
        return response.data;
    },
    getITStatuses: async () => {
        const response = await api.get('/admin/it-status');
        return response.data;
    },
    updateITStatus: async (id: string, data: ITStatus) => {
        const response = await api.patch(`/admin/it-status/${id}`, data);
        return response.data;
    },
    deleteITStatus: async (id: string) => {
        const response = await api.delete(`/admin/it-status/${id}`);
        return response.data;
    },

    // Sub Master
    createSubMaster: async (data: SubMaster) => {
        const response = await api.post('/admin/sub-master', data);
        return response.data;
    },
    getSubMasters: async () => {
        const response = await api.get('/admin/sub-master');
        return response.data;
    },
    updateSubMaster: async (id: string, data: SubMaster) => {
        const response = await api.patch(`/admin/sub-master/${id}`, data);
        return response.data;
    },
    deleteSubMaster: async (id: string) => {
        const response = await api.delete(`/admin/sub-master/${id}`);
        return response.data;
    },
};
