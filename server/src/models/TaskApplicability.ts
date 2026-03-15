import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskApplicability extends Document {
    taskMasterId: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    clientGroupId?: mongoose.Types.ObjectId;
    startDate: Date;
    infinite: boolean;
    frequency: string;
    firmId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: 'Active' | 'Inactive';
    lastGeneratedDate?: Date;
    itStatus?: mongoose.Types.ObjectId;
    subMaster?: mongoose.Types.ObjectId;
    department?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TaskApplicabilitySchema = new Schema<ITaskApplicability>({
    taskMasterId: { type: Schema.Types.ObjectId, ref: 'TaskMaster', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientGroupId: { type: Schema.Types.ObjectId, ref: 'ClientGroup' },
    startDate: { type: Date, required: true },
    infinite: { type: Boolean, default: true },
    frequency: { type: String, required: true },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    lastGeneratedDate: { type: Date },
    itStatus: { type: Schema.Types.ObjectId, ref: 'ITStatus' },
    subMaster: { type: Schema.Types.ObjectId, ref: 'SubMaster' },
    department: { type: String }
}, {
    timestamps: true
});

// Ensure a task is applied only once per client/group unless it's a different frequency (though usually one master is applied once)
TaskApplicabilitySchema.index({ taskMasterId: 1, clientId: 1, clientGroupId: 1 }, { unique: true });

export const TaskApplicability = mongoose.model<ITaskApplicability>('TaskApplicability', TaskApplicabilitySchema);
