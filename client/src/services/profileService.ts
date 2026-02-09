import api from './api';

export interface UserProfile {
    _id: string;
    username: string;
    role: string;
    name?: string;
    email?: string;
    phone?: string;
    clientId?: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    lastLogin?: Date;
    createdAt: Date;
}

export interface ActivityLogEntry {
    _id: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    details?: string;
}

export interface ActivityLogResponse {
    activities: ActivityLogEntry[];
    total: number;
    limit: number;
    skip: number;
}

export const profileService = {
    // Get current user profile
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get('/profile/profile');
        return response.data;
    },

    // Update profile
    updateProfile: async (data: { name?: string; email?: string; phone?: string; username?: string }) => {
        const response = await api.put('/profile/profile', data);
        return response.data;
    },

    // Change password
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.post('/profile/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    // Get activity log
    getActivityLog: async (limit = 50, skip = 0): Promise<ActivityLogResponse> => {
        const response = await api.get('/profile/activity-log', {
            params: { limit, skip }
        });
        return response.data;
    }
};
