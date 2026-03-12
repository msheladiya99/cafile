import mongoose, { Document, Schema } from 'mongoose';

export interface ISuperAdmin extends Document {
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    createdAt: Date;
}

const superAdminSchema = new Schema<ISuperAdmin>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'SUPER_ADMIN' },
    createdAt: { type: Date, default: Date.now }
});

export const SuperAdmin = mongoose.model<ISuperAdmin>('SuperAdmin', superAdminSchema);
