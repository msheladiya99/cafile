import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxNotice extends Document {
    firmId: mongoose.Types.ObjectId;
    clientId?: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;

    originalFileName: string;
    mimeType: string;
    fileHash?: string;
    fileUrl?: string;
    driveFileId?: string;
    ocrText: string;

    noticeClassification: {
        type: 'Income Tax' | 'GST' | 'Other';
        section_or_act: string;
        authority: string;
        financial_year: string;
        assessment_year: string;
    };
    issueAnalysis: {
        core_issue: string;
        legal_context: string;
        possible_reason: string;
    };
    replyDraft: {
        subject: string;
        letter_body: string;
        legal_references: string[];
    };
    supportingDocuments: string[];
    complianceStrategy: {
        step_by_step: string[];
        portal_action: string;
    };
    riskAssessment: {
        level: 'Low' | 'Medium' | 'High';
        reason: string;
    };
    deadlineManagement: {
        due_date: string;
        urgency: 'Immediate' | 'Moderate' | 'Low';
    };

    explanationSimple: string;
    replyStyle: 'Auto Reply' | 'Strong Legal Reply';
    aiConfidenceScore: number;
    aiRawResponse?: string;
    status: 'draft' | 'reviewed';
}

export interface ITaxNoticeTemplate extends Document {
    firmId: mongoose.Types.ObjectId;
    name: string;
    noticeType: string;
    sectionOrAct: string;
    subject: string;
    letterBody: string;
    legalReferences: string[];
    createdBy: mongoose.Types.ObjectId;
}

const TaxNoticeSchema = new Schema<ITaxNotice>(
    {
        firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        originalFileName: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileHash: { type: String, index: true },
        fileUrl: { type: String },
        driveFileId: { type: String },
        ocrText: { type: String, default: '' },

        noticeClassification: {
            type: {
                type: String,
                enum: ['Income Tax', 'GST', 'Other'],
                default: 'Other',
            },
            section_or_act: { type: String, default: 'Not clearly specified in notice' },
            authority: { type: String, default: 'Not clearly specified in notice' },
            financial_year: { type: String, default: '' },
            assessment_year: { type: String, default: '' },
        },
        issueAnalysis: {
            core_issue: { type: String, default: '' },
            legal_context: { type: String, default: '' },
            possible_reason: { type: String, default: '' },
        },
        replyDraft: {
            subject: { type: String, default: '' },
            letter_body: { type: String, default: '' },
            legal_references: { type: [String], default: [] },
        },
        supportingDocuments: { type: [String], default: [] },
        complianceStrategy: {
            step_by_step: { type: [String], default: [] },
            portal_action: { type: String, default: '' },
        },
        riskAssessment: {
            level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
            reason: { type: String, default: '' },
        },
        deadlineManagement: {
            due_date: { type: String, default: '' },
            urgency: { type: String, enum: ['Immediate', 'Moderate', 'Low'], default: 'Moderate' },
        },

        explanationSimple: { type: String, default: '' },
        replyStyle: { type: String, enum: ['Auto Reply', 'Strong Legal Reply'], default: 'Auto Reply' },
        aiConfidenceScore: { type: Number, default: 0 },
        aiRawResponse: { type: String },
        status: { type: String, enum: ['draft', 'reviewed'], default: 'draft' },
    },
    { timestamps: true }
);

TaxNoticeSchema.index({ firmId: 1, createdAt: -1 });
TaxNoticeSchema.index({ firmId: 1, fileHash: 1 }, { unique: true, sparse: true });
TaxNoticeSchema.index({ firmId: 1, 'noticeClassification.section_or_act': 1 });

const TaxNoticeTemplateSchema = new Schema<ITaxNoticeTemplate>(
    {
        firmId: { type: Schema.Types.ObjectId, ref: 'Firm', required: true, index: true },
        name: { type: String, required: true },
        noticeType: { type: String, required: true },
        sectionOrAct: { type: String, required: true },
        subject: { type: String, required: true },
        letterBody: { type: String, required: true },
        legalReferences: { type: [String], default: [] },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

TaxNoticeTemplateSchema.index({ firmId: 1, name: 1 }, { unique: true });
TaxNoticeTemplateSchema.index({ firmId: 1, noticeType: 1, sectionOrAct: 1 });

export const TaxNotice = mongoose.model<ITaxNotice>('TaxNotice', TaxNoticeSchema);
export const TaxNoticeTemplate = mongoose.model<ITaxNoticeTemplate>('TaxNoticeTemplate', TaxNoticeTemplateSchema);
