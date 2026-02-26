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

    // Sub Master
    createSubMaster: async (data: SubMaster) => {
        const response = await api.post('/admin/sub-master', data);
        return response.data;
    },
    getSubMasters: async () => {
        const response = await api.get('/admin/sub-master');
        return response.data;
    },
};
