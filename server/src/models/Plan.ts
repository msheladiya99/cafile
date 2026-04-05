import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
    name: 'Starter' | 'Professional' | 'Enterprise' | 'Pro Cloud' | 'Enterprise Cloud' | 'Custom';
    yearlyPrice: number;
    limits: {
        clients: number;
        staff: number;
        storageGB: number;
    };
    features: {
        clientManagement: boolean;
        manualTask: boolean;
        autoTask: boolean;
        advancedAutoTask: boolean;
        billing: boolean;
        advancedBilling: boolean;
        cloudStorage: boolean;
        dscTracking: boolean;
        autoDscTracking: boolean;
        reminderAutomation: boolean;
        whatsappAPI: boolean;
        smsReminder: boolean;
        clientPortal: boolean;
        roleBasedAccess: boolean;
        dedicatedDatabase: boolean;
        prioritySupport: boolean;
    };
    isCustom: boolean;
    customFirmId?: mongoose.Types.ObjectId; // If custom plan, assigned to which firm
    isActive: boolean;
}

const planSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            required: true,
            enum: ['Starter', 'Professional', 'Enterprise', 'Pro Cloud', 'Enterprise Cloud', 'Custom'],
        },
        yearlyPrice: { type: Number, required: true },
        limits: {
            clients: { type: Number, required: true },
            staff: { type: Number, required: true },
            storageGB: { type: Number, required: true },
        },
        features: {
            clientManagement: { type: Boolean, default: false },
            manualTask: { type: Boolean, default: false },
            autoTask: { type: Boolean, default: false },
            advancedAutoTask: { type: Boolean, default: false },
            billing: { type: Boolean, default: false },
            advancedBilling: { type: Boolean, default: false },
            cloudStorage: { type: Boolean, default: false },
            dscTracking: { type: Boolean, default: false },
            autoDscTracking: { type: Boolean, default: false },
            reminderAutomation: { type: Boolean, default: false },
            whatsappAPI: { type: Boolean, default: false },
            smsReminder: { type: Boolean, default: false },
            clientPortal: { type: Boolean, default: false },
            roleBasedAccess: { type: Boolean, default: false },
            dedicatedDatabase: { type: Boolean, default: false },
            prioritySupport: { type: Boolean, default: false },
        },
        isCustom: { type: Boolean, default: false },
        customFirmId: { type: Schema.Types.ObjectId, ref: 'Firm', default: null },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Plan = mongoose.model<IPlan>('Plan', planSchema);
