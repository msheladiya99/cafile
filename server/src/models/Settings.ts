import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    companyName: string;
    address: string;
    email: string;
    phone: string;
    logoUrl?: string; // Optional for future
    updatedAt: Date;
}

const SettingsSchema = new Schema({
    companyName: { type: String, default: 'My Company' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    logoUrl: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

// Ensure only one settings document exists logically (handled by controller usually, or singleton pattern)
export default mongoose.model<ISettings>('Settings', SettingsSchema);
