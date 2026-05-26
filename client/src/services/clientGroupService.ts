import api from './api';

export interface ClientGroup {
    _id?: string;
    groupName: string;
    address?: string;
    description?: string;
    status: boolean;
    email: string;
    mobileNumber: string;
    groupPersonName?: string;
    groupOwnByFirm?: string;
    firmId?: string;
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

    deleteGroup: async (id: string) => {
        const response = await api.delete(`/admin/client-groups/${id}`);
        return response.data;
    },

    updateGroup: async (id: string, data: Partial<ClientGroup>) => {
        const response = await api.patch(`/admin/client-groups/${id}`, data);
        return response.data;
    },

    bulkCreateGroups: async (data: { groups: Partial<ClientGroup>[] }): Promise<{ successful: number; failed: number; errors: string[] }> => {
        const response = await api.post('/admin/bulk-create-client-groups', data);
        return response.data;
    },

    bulkDeleteGroups: async (groupIds: string[]): Promise<{ message: string }> => {
        const response = await api.post('/admin/client-groups/bulk-delete', { groupIds });
        return response.data;
    },
};
