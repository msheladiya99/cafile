export interface Client {
    _id: string;
    name?: string;
    proprietorName?: string;
    email?: string;
    username?: string;
    phone?: string;
    phone2?: string;
    createdAt: string;
    panNumber?: string;
    aadharNumber?: string;
    gstNumber?: string;
    clientType?: string;
    dscExpiry?: string;
    complianceFlags?: string[];
    physicalFileNumber?: string;
    fileNo?: string;
    tradeName?: string;
    rackLocation?: string;
    clientCode?: string;
    profileImageUrl?: string;
    groupName?: { _id: string; groupName: string } | string;
    status?: boolean;
    masterType?: string;
    subMaster?: { _id: string; name: string } | string;
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
    supportEmployee?: { _id: string; username: string } | string;
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
    multipleContacts?: {
        name: string;
        designation: string;
        mobile: string;
        email: string;
        description: string;
        status: boolean;
    }[];
    legalDocuments?: {
        documentName: string;
        description: string;
        fileName: string;
    }[];
    updatedAt?: string;
}

export interface ClientGroup {
    _id: string;
    groupName: string;
    description?: string;
    groupOwnByFirm?: string | { _id: string; firmName: string };
}

export interface CreateClientData {
    name?: string;
    proprietorName?: string;
    email?: string;
    phone?: string;
    phone2?: string;
    panNumber?: string;
    fileNo?: string;
    tradeName?: string;
    aadharNumber?: string;
    gstNumber?: string;
    username?: string;
    clientCode?: string;
    profileImageUrl?: string;
    groupName?: string;
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
    multipleContacts?: {
        name: string;
        designation: string;
        mobile: string;
        email: string;
        description: string;
        status: boolean;
    }[];
    legalDocuments?: {
        documentName: string;
        description: string;
        fileName: string;
    }[];
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

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT' | 'SUPER_ADMIN';

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

    status?: boolean;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    mobileNumber?: string;
    birthDate?: string;
    aadharNumber?: string;
    panNumber?: string;
    designation?: string;
    joiningDate?: string;
    monthlySalary?: string;
    ratePerHours?: string;
    leavingDate?: string;
    reference?: string;
    description?: string;
    emergencyFirstName?: string;
    emergencyLastName?: string;
    emergencyRelationship?: string;
    emergencyPhone?: string;
    field1?: string;
    field2?: string;
    field3?: string;
    field4?: string;
    field5?: string;
    field6?: string;
    field7?: string;
    documents?: Record<string, unknown>[];
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
    ruleId?: string | ReminderRule;
    cycleKey?: string;
    title: string;
    description?: string;
    dueDate: string;
    reminderType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
    notifyBefore: number;
    notificationSent: boolean;
    lastSentAt?: string;
    nextReminderAt?: string;
    escalationLevel?: number;
    generatedBy?: 'MANUAL' | 'RULE_ENGINE' | 'DSC_CRON';
    createdAt: string;
}

export interface ReminderRule {
    _id: string;
    ruleName: string;
    complianceType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    triggerCondition: string;
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
    dueDateLogic: {
        type: 'FIXED_DAY_OF_MONTH' | 'FIXED_DATE' | 'DSC_EXPIRY_DATE' | 'RELATIVE_TO_CLIENT_DATE';
        dayOfMonth?: number;
        month?: number;
        day?: number;
        clientDateField?: string;
        quarterDueDay?: number;
        quarterDueMonthOffset?: number;
    };
    reminderOffsets: number[];
    followUpIntervalDays: number;
    overdueFollowUpIntervalDays: number;
    maxEscalationLevel: number;
    applicableClientsFilter: {
        clientTypes?: string[];
        requiresGstin?: boolean;
        requiresPan?: boolean;
        clientGroupIds?: string[];
        includeClientIds?: string[];
        excludeClientIds?: string[];
        complianceFlags?: string[];
    };
    channels: ('WHATSAPP' | 'EMAIL' | 'SMS')[];
    automationEnabled: boolean;
    isSystemRule: boolean;
    createdAt: string;
}

export interface MessageTemplate {
    _id: string;
    name: string;
    complianceType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
    tone: 'NORMAL' | 'OVERDUE' | 'MISSED';
    subject?: string;
    body: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface NotificationLog {
    _id: string;
    reminderId: string | Reminder;
    clientId: string | Client;
    ruleId?: string | ReminderRule;
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
    recipient: string;
    subject?: string;
    message: string;
    status: 'QUEUED' | 'SENT' | 'FAILED' | 'SKIPPED';
    provider?: string;
    error?: string;
    sentAt?: string;
    createdAt: string;
}

// Task Management Types
export type TaskStatus = 'PENDING' | 'IN_PROCESS' | 'PENDING_FOR_APPROVAL' | 'APPROVED' | 'DONE' | 'CANCELLED' | 'ON_HOLD' | 'PENDING_FROM_CLIENT' | 'PENDING_FROM_DEPARTMENT' | 'REJECTED';
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
    clientGroupId?: string | { _id: string; groupName: string };
    billingType?: 'SINGLE_CLIENT' | 'CLIENT_GROUP';
    firmId?: string | { _id: string; firmName: string };
    billingAmount?: number;

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
    reportingManager?: string | User;
    taskMasterId?: string;
    frequency?: string;
    department?: string;
    year?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    category?: TaskCategory;
    assignedTo?: string[];
    billingType?: 'SINGLE_CLIENT' | 'CLIENT_GROUP';
    clientId?: string;
    clientGroupId?: string;
    firmId?: string;
    billingAmount?: number;
    priority?: TaskPriority;
    targetDate: string;
    estimatedHours: number;
    tags?: string[];
    checklist?: string[];
    reportingManager?: string;
    frequency?: string;
    taskMasterId?: string;
    year?: string;
    department?: string;
    status?: TaskStatus;
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

export interface Subtask {
    _id?: string;
    name: string;
    description?: string;
    designation?: string;
    predefinedEmployee?: string | User;
    activityOrder?: number;
}

export interface TaskMasterData {
    _id?: string;
    taskName: string;
    mode: string;
    department?: string;
    category?: string | { _id: string; name: string; color: string };
    reportingManager?: string | User;
    description?: string;
    status: 'Active' | 'Inactive';
    hsnSac?: string;
    udin: boolean;
    billingAmount?: number;
    estimatedHours?: number;
    multiFirmId?: string | { _id: string; firmName: string; invoicePrefix?: string };
    frequency?: string;
    subtasks: Subtask[];
    typeOfClient?: string[];
    dueDays?: number;
    recurringTask?: boolean;
    recurringDays?: number;
    tags?: string[];
    users?: (string | User)[];
    workingUser?: string | User;
    createdAt?: string;
    updatedAt?: string;
}

export interface TaskApplicability {
    _id?: string;
    taskMasterId: string | TaskMasterData;
    clientId?: string | Client;
    clientGroupId?: string | { _id: string; groupName: string };
    startDate: string;
    infinite: boolean;
    frequency: string;
    status: 'Active' | 'Inactive';
    department?: string;
    createdAt?: string;
    updatedAt?: string;
}

