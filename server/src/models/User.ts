import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    passwordHash: string;
    role: 'ADMIN' | 'MANAGER' | 'STAFF' | 'INTERN' | 'CLIENT';
    clientId?: mongoose.Types.ObjectId;
    lastLogin?: Date;
    createdAt: Date;
    permissions: string[];
    name?: string;
    email?: string;
    phone?: string;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'STAFF', 'INTERN', 'CLIENT'],
        required: true
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    permissions: {
        type: [String],
        default: []
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    }
});

export const User = mongoose.model<IUser>('User', userSchema);
