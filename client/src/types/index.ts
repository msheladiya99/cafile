export interface Client {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
}

export interface CreateClientData {
    name: string;
    email: string;
    phone: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
}

export interface CreateClientResponse {
    client: Client;
    credentials: {
        username: string;
        password: string;
    };
}

export interface FileData {
    _id: string;
    clientId: string;
    year: string;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS';
    fileName: string;
    originalFileName: string;
    fileSize: number;
    uploadedAt: string;
    uploadedBy?: {
        username: string;
    };
    // Smart Organization fields
    tags?: string[];
    isStarred?: boolean;
    isArchived?: boolean;
    notes?: string;
    lastModified?: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';

export interface User {
    _id: string;
    username: string;
    name?: string;
    email?: string;
    phone?: string;
    role: UserRole;
    clientId?: string;
    permissions?: string[];
    createdAt?: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface Reminder {
    _id: string;
    clientId: string | Client;
    title: string;
    description?: string;
    dueDate: string;
    reminderType: 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
    notifyBefore: number;
    notificationSent: boolean;
    createdAt: string;
}
