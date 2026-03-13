import api from './api';
import type { TaskMasterData } from '../types';

export const taskMasterService = {
    getTaskMasters: async () => {
        const response = await api.get<TaskMasterData[]>('/task-master');
        return response.data;
    },

    createTaskMaster: async (data: Partial<TaskMasterData>) => {
        const response = await api.post<TaskMasterData>('/task-master', data);
        return response.data;
    },

    updateTaskMaster: async (id: string, data: Partial<TaskMasterData>) => {
        const response = await api.put<TaskMasterData>(`/task-master/${id}`, data);
        return response.data;
    },

    deleteTaskMaster: async (id: string) => {
        const response = await api.delete(`/task-master/${id}`);
        return response.data;
    }
};
