import api from './api';
import type { Task, CreateTaskData, TaskStatus, TaskAnalytics } from '../types';

export const taskService = {
    // Get all tasks with optional filters
    getTasks: async (filters?: {
        status?: TaskStatus;
        priority?: string;
        assignedTo?: string;
        clientId?: string;
        clientGroupId?: string;
        overdue?: boolean;
        myTasks?: boolean;
    }): Promise<Task[]> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const response = await api.get(`/tasks?${params.toString()}`);
        return response.data;
    },

    // Get single task by ID
    getTask: async (taskId: string): Promise<Task> => {
        const response = await api.get(`/tasks/${taskId}`);
        return response.data;
    },

    // Create new task
    createTask: async (data: CreateTaskData): Promise<{ task: Task; message: string }> => {
        const response = await api.post('/tasks', data);
        return response.data;
    },

    // Update task (Admin/Manager only)
    updateTask: async (taskId: string, data: Partial<CreateTaskData>): Promise<{ task: Task; message: string }> => {
        const response = await api.patch(`/tasks/${taskId}`, data);
        return response.data;
    },

    // Update task status
    updateStatus: async (taskId: string, status: TaskStatus): Promise<{ task: Task; message: string }> => {
        const response = await api.patch(`/tasks/${taskId}/status`, { status });
        return response.data;
    },

    // Start timer
    startTimer: async (taskId: string): Promise<{ task: Partial<Task>; message: string }> => {
        const response = await api.post(`/tasks/${taskId}/timer/start`);
        return response.data;
    },

    // Stop timer
    stopTimer: async (taskId: string): Promise<{ task: Partial<Task>; message: string }> => {
        const response = await api.post(`/tasks/${taskId}/timer/stop`);
        return response.data;
    },

    // Update progress percentage
    updateProgress: async (taskId: string, progressPercentage: number): Promise<{ task: Partial<Task>; message: string }> => {
        const response = await api.patch(`/tasks/${taskId}/progress`, { progressPercentage });
        return response.data;
    },

    // Add comment
    addComment: async (taskId: string, text: string): Promise<{ task: Task; message: string }> => {
        const response = await api.post(`/tasks/${taskId}/comments`, { text });
        return response.data;
    },

    // Update checklist item
    updateChecklistItem: async (taskId: string, itemId: string, completed: boolean): Promise<{ task: Partial<Task>; message: string }> => {
        const response = await api.patch(`/tasks/${taskId}/checklist/${itemId}`, { completed });
        return response.data;
    },

    // Delete task
    deleteTask: async (taskId: string): Promise<void> => {
        await api.delete(`/tasks/${taskId}`);
    },

    // Get analytics
    getAnalytics: async (filters?: { startDate?: string; endDate?: string }): Promise<TaskAnalytics> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get(`/tasks/analytics/dashboard?${params.toString()}`);
        return response.data;
    },

    // Get staff-wise task history (Ledger)
    getStaffHistory: async (filters?: {
        staffId?: string;
        startDate?: string;
        endDate?: string;
        status?: TaskStatus;
    }): Promise<unknown> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get(`/tasks/staff-history?${params.toString()}`);
        return response.data;
    },

    // Recurrence Tasks
    getRecurrenceTasks: async (): Promise<Task[]> => {
        const response = await api.get('/tasks/recurrence');
        return response.data;
    },

    createRecurrenceTask: async (data: Partial<Task>): Promise<{ task: Task; message: string }> => {
        const response = await api.post('/tasks/recurrence', data);
        return response.data;
    },
};
