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

// Performance index only (NOT unique — duplicate prevention done in route logic)
TaskApplicabilitySchema.index({ taskMasterId: 1, clientId: 1, firmId: 1 });
TaskApplicabilitySchema.index({ taskMasterId: 1, clientGroupId: 1, firmId: 1 });

export const TaskApplicability = mongoose.model<ITaskApplicability>('TaskApplicability', TaskApplicabilitySchema);

// ── Drop old conflicting unique index on startup (runs once, safe to repeat) ──
// The old index { taskMasterId, clientId, clientGroupId } (without firmId) caused 11000 errors
TaskApplicability.collection.dropIndex('taskMasterId_1_clientId_1_clientGroupId_1')
    .then(() => console.log('[TaskApplicability] Dropped old unique index successfully'))
    .catch(() => { /* Index didn't exist or already dropped — safe to ignore */ });

TaskApplicability.collection.dropIndex('taskMasterId_1_clientId_1_clientGroupId_1_firmId_1')
    .then(() => console.log('[TaskApplicability] Dropped old firmId unique index successfully'))
    .catch(() => { /* Index didn't exist or already dropped — safe to ignore */ });
