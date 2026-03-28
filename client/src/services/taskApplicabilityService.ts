import api from './api';
import type { TaskApplicability } from '../types';

export const taskApplicabilityService = {
    getApplicabilities: async (params?: { taskMasterId?: string; clientId?: string; clientGroupId?: string }) => {
        const response = await api.get<TaskApplicability[]>('/task-applicability', { params });
        return response.data;
    },

    applyTask: async (data: {
        taskMasterId: string;
        clientIds?: string[];
        groupIds?: string[];
        startDate: string;
        infinite: boolean;
        department?: string;
        itStatus?: string;
        subMaster?: string;
        assignedTo?: string[];
    }): Promise<{ message: string; count: number; errors?: { id: string; error: string }[] }> => {
        const response = await api.post('/task-applicability/apply', data);
        return response.data;
    },

    removeApplicability: async (id: string) => {
        const response = await api.delete(`/task-applicability/${id}`);
        return response.data;
    }
};
