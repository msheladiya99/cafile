import mongoose, { Schema, Document } from 'mongoose';

export interface ISubtask {
    name: string;
    description?: string;
}

export interface ITaskMaster extends Document {
    taskName: string;
    mode: string;
    department?: string;
    reportingManager?: mongoose.Types.ObjectId;
    description?: string;
    status: 'Active' | 'Inactive';
    hsnSac?: string;
    udin: boolean;
    subtasks: ISubtask[];
    firmId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SubtaskSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String }
});

const TaskMasterSchema = new Schema<ITaskMaster>({
    taskName: { type: String, required: true, trim: true },
    mode: { type: String, required: true },
    department: { type: String },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    hsnSac: { type: String },
    udin: { type: Boolean, default: false },
    subtasks: [SubtaskSchema],
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

export const TaskMaster = mongoose.model<ITaskMaster>('TaskMaster', TaskMasterSchema);
