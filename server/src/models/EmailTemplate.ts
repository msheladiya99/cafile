import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
    firmId: mongoose.Types.ObjectId;
    name: string;            // e.g. "Client Welcome", "Task Reminder"
    slug: string;            // e.g. "client_welcome", "task_reminder" — unique per firm
    subject: string;         // e.g. "Welcome to {{companyName}}"
    body: string;            // HTML body with {{variable}} placeholders
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EmailTemplateSchema = new Schema({
    firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
    name:    { type: String, required: true },
    slug:    { type: String, required: true }, // unique per firm (enforced in code)
    subject: { type: String, required: true },
    body:    { type: String, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

EmailTemplateSchema.index({ firmId: 1, slug: 1 }, { unique: true });
export default mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
