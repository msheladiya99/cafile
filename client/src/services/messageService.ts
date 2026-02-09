import api from './api';

export interface IAttachment {
    fileId?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    thumbnailUrl?: string;
}

export interface IMessage {
    _id: string;
    senderId: {
        _id: string;
        username: string;
        role: string;
    };
    receiverId: {
        _id: string;
        username: string;
        role: string;
    };
    clientId?: string;
    subject: string;
    message: string;
    attachments?: IAttachment[];
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

export interface IConversation {
    clientId: string;
    clientName: string;
    clientEmail?: string;
    lastMessage: IMessage;
    unreadCount: number;
}

export interface IUser {
    _id: string;
    username: string;
    role: string;
    clientId?: {
        _id: string;
        name: string;
    };
}

export interface IThread {
    userId: string;
    username: string;
    role: string;
    clientName?: string | null;
    lastMessage?: IMessage;
    unreadCount: number;
    lastMessageDate: string;
}

export const messageService = {
    // Get list of users current user can message
    getAvailableUsers: async (): Promise<IUser[]> => {
        const response = await api.get('/messages/users');
        return response.data;
    },

    // Get all message threads for current user
    getAllThreads: async (): Promise<IThread[]> => {
        const response = await api.get('/messages/threads');
        return response.data;
    },

    // Get message thread with specific user
    getThread: async (userId: string): Promise<IMessage[]> => {
        const response = await api.get(`/messages/threads/${userId}`);
        return response.data;
    },

    // Upload attachment for message
    uploadAttachment: async (file: File): Promise<IAttachment> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/messages/upload-attachment', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.attachment;
    },

    // Send a message to specific user
    sendMessage: async (data: {
        receiverId: string;
        message: string;
        subject?: string;
        attachments?: IAttachment[];
    }): Promise<IMessage> => {
        const response = await api.post('/messages/send', data);
        return response.data;
    },

    // Mark messages from specific user as read
    markThreadAsRead: async (userId: string): Promise<void> => {
        await api.put(`/messages/read/${userId}`);
    },

    // Get unread message count
    getUnreadCount: async (): Promise<{ count: number }> => {
        const response = await api.get('/messages/unread');
        return response.data;
    },

    // Legacy methods for backward compatibility

    // Get all messages for current user (Client) or specific client (Admin)
    getMessages: async (clientId?: string): Promise<IMessage[]> => {
        const params = clientId ? { clientId } : {};
        const response = await api.get('/messages', { params });
        return response.data;
    },

    // Get list of conversations (Admin only)
    getConversations: async (): Promise<IConversation[]> => {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    // Send a message (legacy - for client to admin)
    sendLegacyMessage: async (data: { message: string; subject?: string; clientId?: string }): Promise<IMessage> => {
        const response = await api.post('/messages', data);
        return response.data;
    },

    // Mark messages as read (legacy)
    markAsRead: async (clientId: string): Promise<void> => {
        await api.put(`/messages/read/${clientId}`);
    }
};
