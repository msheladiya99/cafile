import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'PENDING' | 'IN_PROCESS' | 'PENDING_FOR_APPROVAL' | 'APPROVED' | 'DONE' | 'CANCELLED' | 'ON_HOLD' | 'PENDING_FROM_CLIENT' | 'PENDING_FROM_DEPARTMENT' | 'REJECTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory = 'CLIENT_WORK' | 'INTERNAL' | 'REVIEW' | 'FOLLOW_UP' | 'FILING' | 'OTHER';

export interface ITimeEntry {
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
}

export interface IChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    completedBy?: mongoose.Types.ObjectId;
    completedAt?: Date;
}

export interface IComment {
    id: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    text: string;
    createdAt: Date;
}

export interface ITask extends Document {
    // Basic Info
    title: string;
    description: string;
    category: TaskCategory;

    // Assignment
    createdBy: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId[];
    clientId?: mongoose.Types.ObjectId;
    clientGroupId?: mongoose.Types.ObjectId;
    billingType?: 'SINGLE_CLIENT' | 'CLIENT_GROUP' | 'GROUP';
    firmId?: mongoose.Types.ObjectId;
    multiFirmId?: mongoose.Types.ObjectId; // Which billing firm/branch generated the invoice
    billingAmount?: number;
    year?: string; // Financial year e.g. "2025-2026"

    // Status & Priority
    status: TaskStatus;
    priority: TaskPriority;

    // Dates
    targetDate: Date;
    startDate?: Date;
    completedAt?: Date;

    // Time Tracking
    estimatedHours: number;
    actualTimeSpent: number; // in minutes
    timeEntries: ITimeEntry[];
    currentTimerStart?: Date; // For active timer

    // Progress
    progressPercentage: number; // 0-100

    // Quality Metrics
    revisionCount: number; // How many times moved from UNDER_REVIEW back to STARTED

    // Collaboration
    comments: IComment[];
    attachments: string[]; // File IDs
    checklist: IChecklistItem[];

    // Metadata
    taskMasterId?: mongoose.Types.ObjectId;
    frequency?: string;
    reportingManager?: mongoose.Types.ObjectId;
    tags: string[];
    isOverdue: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const TimeEntrySchema = new Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number } // in minutes
});

const ChecklistItemSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date }
});

const CommentSchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const taskSchema = new Schema<ITask>({
    // Basic Info
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['CLIENT_WORK', 'INTERNAL', 'REVIEW', 'FOLLOW_UP', 'FILING', 'OTHER'],
        default: 'OTHER'
    },

    // Assignment
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientGroupId: { type: Schema.Types.ObjectId, ref: 'ClientGroup' },
    billingType: { type: String, enum: ['SINGLE_CLIENT', 'CLIENT_GROUP', 'GROUP'], default: 'SINGLE_CLIENT' },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    multiFirmId: { type: Schema.Types.ObjectId, ref: 'MultiFirm', index: true },
    billingAmount: { type: Number, default: 0 },
    year: { type: String },

    // Status & Priority
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROCESS', 'PENDING_FOR_APPROVAL', 'APPROVED', 'DONE', 'CANCELLED', 'ON_HOLD', 'PENDING_FROM_CLIENT', 'PENDING_FROM_DEPARTMENT', 'REJECTED'],
        default: 'PENDING'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },

    // Dates
    targetDate: { type: Date, required: true },
    startDate: { type: Date },
    completedAt: { type: Date },

    // Time Tracking
    estimatedHours: { type: Number, required: true, default: 1 },
    actualTimeSpent: { type: Number, default: 0 }, // in minutes
    timeEntries: [TimeEntrySchema],
    currentTimerStart: { type: Date },

    // Progress
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Quality Metrics
    revisionCount: { type: Number, default: 0 },

    // Collaboration
    comments: [CommentSchema],
    attachments: [{ type: String }],
    checklist: [ChecklistItemSchema],

    // Metadata
    taskMasterId: { type: Schema.Types.ObjectId, ref: 'TaskMaster' },
    frequency: { type: String },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: String }],
    isOverdue: { type: Boolean, default: false }
}, {
    timestamps: true
});

// Indexes for performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedTo: 1, createdAt: -1 }); // Speeds up staff history aggregation
taskSchema.index({ createdBy: 1 });
taskSchema.index({ clientId: 1 });
taskSchema.index({ targetDate: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ createdAt: -1 });

// Middlewares
taskSchema.pre('save', async function (this: ITask) {
    if (this.targetDate && this.status !== 'DONE' && this.status !== 'CANCELLED') {
        this.isOverdue = new Date() > this.targetDate;
    } else {
        this.isOverdue = false;
    }
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
