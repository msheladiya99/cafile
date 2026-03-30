import mongoose, { Schema, Document } from 'mongoose';

export interface ISubtask {
    name: string;
    description?: string;
    designation?: string;
    predefinedEmployee?: mongoose.Types.ObjectId;
    activityOrder: number;
}

export interface ITaskMaster extends Document {
    taskName: string;
    mode: string;
    category?: mongoose.Types.ObjectId; // Link to TaskCategory
    department?: string;
    reportingManager?: mongoose.Types.ObjectId;
    description?: string;
    status: 'Active' | 'Inactive';
    hsnSac?: string;
    udin: boolean;
    billingAmount?: number;
    estimatedHours?: number;
    multiFirmId?: mongoose.Types.ObjectId; // Billing firm/branch for auto-invoice
    frequency?: string;
    typeOfClient?: string[];
    dueDays?: number;
    recurringTask?: boolean;
    recurringDays?: number;
    tags?: string[];
    users?: mongoose.Types.ObjectId[];
    workingUser?: mongoose.Types.ObjectId;
    subtasks: ISubtask[];
    firmId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SubtaskSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    designation: { type: String },
    predefinedEmployee: { type: Schema.Types.ObjectId, ref: 'User' },
    activityOrder: { type: Number, default: 0 }
});

const TaskMasterSchema = new Schema<ITaskMaster>({
    taskName: { type: String, required: true, trim: true },
    mode: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'TaskCategory', default: null },
    department: { type: String },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    hsnSac: { type: String },
    udin: { type: Boolean, default: false },
    billingAmount: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 1 },
    multiFirmId: { type: Schema.Types.ObjectId, ref: 'MultiFirm', default: null },
    frequency: { type: String },
    typeOfClient: [{ type: String }],
    dueDays: { type: Number },
    recurringTask: { type: Boolean, default: false },
    recurringDays: { type: Number },
    tags: [{ type: String }],
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    workingUser: { type: Schema.Types.ObjectId, ref: 'User' },
    subtasks: [SubtaskSchema],
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

export const TaskMaster = mongoose.model<ITaskMaster>('TaskMaster', TaskMasterSchema);
