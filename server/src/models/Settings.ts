import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    companyName: string;
    address: string;
    email: string;
    phone: string;
    logoUrl?: string; // Optional for future
    employeeExtraFields?: {
        field1: string;
        field2: string;
        field3: string;
        field4: string;
        field5: string;
        field6: string;
        field7: string;
    };
    updatedAt: Date;
    firmId: mongoose.Types.ObjectId;
}

const SettingsSchema = new Schema({
    firmId: {
        type: Schema.Types.ObjectId,
        ref: 'Firm',
        required: true,
        index: true,
        unique: true
    },
    companyName: { type: String, default: 'CA OFFICE PORTAL' },
    address: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    logoUrl: { type: String },
    employeeExtraFields: {
        field1: { type: String, default: 'Field 1' },
        field2: { type: String, default: 'Field 2' },
        field3: { type: String, default: 'Field 3' },
        field4: { type: String, default: 'Field 4' },
        field5: { type: String, default: 'Field 5' },
        field6: { type: String, default: 'Field 6' },
        field7: { type: String, default: 'Field 7' }
    },
    updatedAt: { type: Date, default: Date.now }
});

// Ensure only one settings document exists logically (handled by controller usually, or singleton pattern)
export default mongoose.model<ISettings>('Settings', SettingsSchema);
