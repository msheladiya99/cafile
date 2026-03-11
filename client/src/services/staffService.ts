import api from './api';
import type { User, UserRole } from '../types';

export interface CreateStaffData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    permissions?: string[];
}

export interface UpdateStaffData {
    role?: UserRole;
    permissions?: string[];
}

export interface CreateStaffResponse {
    user: User;
    credentials: {
        username: string;
        password: string;
    };
}

export const staffService = {
    getStaff: async (): Promise<User[]> => {
        const response = await api.get('/staff');
        return response.data;
    },

    getStaffById: async (id: string): Promise<User> => {
        const response = await api.get(`/staff/${id}`);
        return response.data;
    },

    createStaff: async (data: Record<string, unknown>): Promise<CreateStaffResponse> => {
        const response = await api.post('/staff', data);
        return response.data;
    },

    updateStaff: async (staffId: string, data: Record<string, unknown>): Promise<{ user: User; message: string }> => {
        const response = await api.patch(`/staff/${staffId}`, data);
        return response.data;
    },

    resetPassword: async (staffId: string): Promise<{ username: string; password: string; message: string }> => {
        const response = await api.post(`/staff/${staffId}/reset-password`);
        return response.data;
    },

    deleteStaff: async (staffId: string): Promise<void> => {
        await api.delete(`/staff/${staffId}`);
    },

    uploadDocument: async (file: File, employeeName: string): Promise<{
        fileName: string;
        driveFileId: string;
        driveWebViewLink: string;
    }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('employeeName', employeeName);

        const response = await api.post('/staff/upload-document', formData);
        return response.data;
    },

    deleteDocument: async (fileId: string): Promise<void> => {
        await api.delete(`/staff/delete-document/${fileId}`);
    },
};
