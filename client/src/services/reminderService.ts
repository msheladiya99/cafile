import api from './api';
import type { Reminder } from '../types';

export const reminderService = {
    // Get all reminders (admin)
    getAllReminders: async (params?: { status?: string; clientId?: string; reminderType?: string }) => {
        const response = await api.get<Reminder[]>('/reminders', { params });
        return response.data;
    },

    // Get upcoming reminders
    getUpcomingReminders: async () => {
        const response = await api.get<Reminder[]>('/reminders/upcoming');
        return response.data;
    },

    // Get overdue reminders
    getOverdueReminders: async () => {
        const response = await api.get<Reminder[]>('/reminders/overdue');
        return response.data;
    },

    // Get client reminders
    getClientReminders: async (clientId: string) => {
        const response = await api.get<Reminder[]>(`/reminders/client/${clientId}`);
        return response.data;
    },

    // Create reminder
    createReminder: async (data: Partial<Reminder>) => {
        const response = await api.post<Reminder>('/reminders', data);
        return response.data;
    },

    // Update reminder
    updateReminder: async (id: string, data: Partial<Reminder>) => {
        const response = await api.put<Reminder>(`/reminders/${id}`, data);
        return response.data;
    },

    // Mark as completed
    completeReminder: async (id: string) => {
        const response = await api.patch<Reminder>(`/reminders/${id}/complete`);
        return response.data;
    },

    // Delete reminder
    deleteReminder: async (id: string) => {
        await api.delete(`/reminders/${id}`);
    },

    // Trigger reminder notifications manually
    sendNotifications: async () => {
        const response = await api.post<{ message: string }>('/reminders/send-notifications');
        return response.data;
    }
};
