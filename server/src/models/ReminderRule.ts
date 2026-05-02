import mongoose, { Document, Schema } from 'mongoose';

export type RuleFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
export type DueDateLogicType = 'FIXED_DAY_OF_MONTH' | 'FIXED_DATE' | 'DSC_EXPIRY_DATE' | 'RELATIVE_TO_CLIENT_DATE';
export type ReminderChannel = 'WHATSAPP' | 'EMAIL' | 'SMS';

export interface IReminderRule extends Document {
    firmId: mongoose.Types.ObjectId;
    ruleName: string;
    complianceType: 'ITR' | 'GST' | 'TDS' | 'DSC' | 'ACCOUNTING' | 'OTHER';
    triggerCondition: string;
    frequency: RuleFrequency;
    dueDateLogic: {
        type: DueDateLogicType;
        dayOfMonth?: number;
        month?: number;
        day?: number;
        clientDateField?: string;
        quarterDueDay?: number;
        quarterDueMonthOffset?: number;
    };
    reminderOffsets: number[];
    followUpIntervalDays: number;
    overdueFollowUpIntervalDays: number;
    maxEscalationLevel: number;
    applicableClientsFilter: {
        clientTypes: string[];
        requiresGstin: boolean;
        requiresPan: boolean;
        clientGroupIds: mongoose.Types.ObjectId[];
        includeClientIds: mongoose.Types.ObjectId[];
        excludeClientIds: mongoose.Types.ObjectId[];
        complianceFlags: string[];
    };
    channels: ReminderChannel[];
    templateIds: {
        normal?: mongoose.Types.ObjectId;
        overdue?: mongoose.Types.ObjectId;
        missed?: mongoose.Types.ObjectId;
    };
    automationEnabled: boolean;
    isSystemRule: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ReminderRuleSchema = new Schema<IReminderRule>({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    ruleName: { type: String, required: true, trim: true },
    complianceType: {
        type: String,
        enum: ['ITR', 'GST', 'TDS', 'DSC', 'ACCOUNTING', 'OTHER'],
        required: true,
        index: true
    },
    triggerCondition: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME'], required: true },
    dueDateLogic: {
        type: {
            type: String,
            enum: ['FIXED_DAY_OF_MONTH', 'FIXED_DATE', 'DSC_EXPIRY_DATE', 'RELATIVE_TO_CLIENT_DATE'],
            required: true
        },
        dayOfMonth: { type: Number, min: 1, max: 31 },
        month: { type: Number, min: 1, max: 12 },
        day: { type: Number, min: 1, max: 31 },
        clientDateField: { type: String, trim: true },
        quarterDueDay: { type: Number, min: 1, max: 31 },
        quarterDueMonthOffset: { type: Number, default: 0 }
    },
    reminderOffsets: [{ type: Number, min: 0 }],
    followUpIntervalDays: { type: Number, default: 3, min: 1 },
    overdueFollowUpIntervalDays: { type: Number, default: 1, min: 1 },
    maxEscalationLevel: { type: Number, default: 3, min: 0 },
    applicableClientsFilter: {
        clientTypes: [{ type: String, trim: true }],
        requiresGstin: { type: Boolean, default: false },
        requiresPan: { type: Boolean, default: false },
        clientGroupIds: [{ type: Schema.Types.ObjectId, ref: 'ClientGroup' }],
        includeClientIds: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
        excludeClientIds: [{ type: Schema.Types.ObjectId, ref: 'Client' }],
        complianceFlags: [{ type: String, trim: true }]
    },
    channels: [{ type: String, enum: ['WHATSAPP', 'EMAIL', 'SMS'], default: 'WHATSAPP' }],
    templateIds: {
        normal: { type: Schema.Types.ObjectId, ref: 'MessageTemplate' },
        overdue: { type: Schema.Types.ObjectId, ref: 'MessageTemplate' },
        missed: { type: Schema.Types.ObjectId, ref: 'MessageTemplate' }
    },
    automationEnabled: { type: Boolean, default: true, index: true },
    isSystemRule: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ReminderRuleSchema.index({ firmId: 1, ruleName: 1 }, { unique: true });
ReminderRuleSchema.index({ firmId: 1, automationEnabled: 1, complianceType: 1 });

export default mongoose.model<IReminderRule>('ReminderRule', ReminderRuleSchema);
