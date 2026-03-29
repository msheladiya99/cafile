import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskCategory extends Document {
    name: string;
    color?: string;
    description?: string;
    firmId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const TaskCategorySchema = new Schema<ITaskCategory>({
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#667eea' },
    description: { type: String, default: '' },
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

// Unique name per firm
TaskCategorySchema.index({ name: 1, firmId: 1 }, { unique: true });

export const TaskCategory = mongoose.model<ITaskCategory>('TaskCategory', TaskCategorySchema);
