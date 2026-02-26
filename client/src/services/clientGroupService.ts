import api from './api';

export interface ClientGroup {
    _id?: string;
    groupName: string;
    address?: string;
    description?: string;
    status: boolean;
    email: string;
    mobileNumber: string;
    gstin?: string;
}

export const clientGroupService = {
    createGroup: async (data: ClientGroup) => {
        const response = await api.post('/admin/client-groups', data);
        return response.data;
    },

    getGroups: async () => {
        const response = await api.get('/admin/client-groups');
        return response.data;
    },
};
