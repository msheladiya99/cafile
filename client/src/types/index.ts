export interface Client {
    _id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    physicalFileNumber?: string;
    rackLocation?: string;
    clientCode?: string;
    groupName?: { _id: string; groupName: string };
    itStatus?: { _id: string; name: string };
    status?: boolean;
    masterType?: string;
    subMaster?: { _id: string; name: string };
}

export interface CreateClientData {
    name: string;
    email: string;
    phone: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    username?: string;
    clientCode?: string;
    groupName?: string;
    itStatus?: string;
    masterType?: string;
    subMaster?: string;
    birthDate?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    currency?: string;
    incorporationDateFrom?: string;
    incorporationDateTo?: string;
    licenceNo?: string;
    licenceAuthority?: string;
    trnNo?: string;
    description?: string;
    supportEmployee?: string;
    status?: boolean;
    financialYear?: string;
    altAddress?: string;
    altPhoneM?: string;
    altPhoneL?: string;
    altFax?: string;
    extraField1?: string;
    extraField2?: string;
    extraField3?: string;
    extraField4?: string;
    extraField5?: string;
    extraField6?: string;
    extraField7?: string;
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

// Task Management Types
export type TaskStatus = 'PENDING' | 'STARTED' | 'UNDER_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'CLIENT_WORK' | 'INTERNAL' | 'REVIEW' | 'FOLLOW_UP' | 'FILING' | 'OTHER';

export interface TimeEntry {
    startTime: string;
    endTime?: string;
    duration?: number; // in minutes
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    completedBy?: string | User;
    completedAt?: string;
}

export interface TaskComment {
    id: string;
    userId: string | User;
    userName: string;
    text: string;
    createdAt: string;
}

export interface Task {
    _id: string;

    // Basic Info
    title: string;
    description: string;
    category: TaskCategory;

    // Assignment
    createdBy: string | User;
    assignedTo: (string | User)[];
    clientId?: string | Client;

    // Status & Priority
    status: TaskStatus;
    priority: TaskPriority;

    // Dates
    targetDate: string;
    startDate?: string;
    completedAt?: string;

    // Time Tracking
    estimatedHours: number;
    actualTimeSpent: number; // in minutes
    timeEntries: TimeEntry[];
    currentTimerStart?: string;

    // Progress
    progressPercentage: number; // 0-100

    // Quality Metrics
    revisionCount: number;

    // Collaboration
    comments: TaskComment[];
    attachments: string[];
    checklist: ChecklistItem[];

    // Metadata
    tags: string[];
    isOverdue: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    category?: TaskCategory;
    assignedTo?: string[];
    clientId?: string;
    priority?: TaskPriority;
    targetDate: string;
    estimatedHours: number;
    tags?: string[];
    checklist?: string[];
}

export interface TaskAnalytics {
    tasksByStatus: { _id: TaskStatus; count: number }[];
    overdueTasks: number;
    completionRate: number;
    avgEfficiency: number;
    workloadByStaff: {
        userId: string;
        userName: string;
        username: string;
        taskCount: number;
        totalEstimatedHours: number;
    }[];
    avgRevisions: number;
    totalTasks: number;
}

