import api from './api';
import type { MessageTemplate, NotificationLog, Reminder, ReminderRule } from '../types';

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
        const response = await api.post<{ message: string; sent?: number; skipped?: number; scanned?: number }>('/reminders/send-notifications');
        return response.data;
    },

    getAutomationSummary: async () => {
        const response = await api.get<{
            rules: number;
            activeRules: number;
            automatedPending: number;
            overdue: number;
            sentToday: number;
            failedToday: number;
            manualWorkReductionTarget: number;
        }>('/reminders/automation/summary');
        return response.data;
    },

    runAutomation: async () => {
        const response = await api.post('/reminders/automation/run');
        return response.data;
    },

    generateAutomatedReminders: async () => {
        const response = await api.post('/reminders/automation/generate');
        return response.data;
    },

    getRules: async () => {
        const response = await api.get<ReminderRule[]>('/reminders/rules');
        return response.data;
    },

    createRule: async (data: Partial<ReminderRule>) => {
        const response = await api.post<ReminderRule>('/reminders/rules', data);
        return response.data;
    },

    updateRule: async (id: string, data: Partial<ReminderRule>) => {
        const response = await api.put<ReminderRule>(`/reminders/rules/${id}`, data);
        return response.data;
    },

    deleteRule: async (id: string) => {
        await api.delete(`/reminders/rules/${id}`);
    },

    seedDefaultRules: async () => {
        const response = await api.post<{ message: string }>('/reminders/rules/seed-defaults');
        return response.data;
    },

    getTemplates: async () => {
        const response = await api.get<MessageTemplate[]>('/reminders/templates');
        return response.data;
    },

    createTemplate: async (data: Partial<MessageTemplate>) => {
        const response = await api.post<MessageTemplate>('/reminders/templates', data);
        return response.data;
    },

    updateTemplate: async (id: string, data: Partial<MessageTemplate>) => {
        const response = await api.put<MessageTemplate>(`/reminders/templates/${id}`, data);
        return response.data;
    },

    getLogs: async () => {
        const response = await api.get<NotificationLog[]>('/reminders/logs');
        return response.data;
    },

    recordAction: async (data: {
        clientId: string;
        reminderId?: string;
        ruleId?: string;
        actionType: 'DOCUMENT_UPLOADED' | 'TASK_COMPLETED' | 'CLIENT_RESPONDED' | 'NO_RESPONSE' | 'MANUAL_OVERRIDE';
        source?: 'CLIENT_PORTAL' | 'ADMIN' | 'SYSTEM';
        notes?: string;
        metadata?: Record<string, unknown>;
    }) => {
        const response = await api.post('/reminders/actions', data);
        return response.data;
    },
};
