import api from './api';

export interface TaxNoticeRecord {
    _id: string;
    originalFileName: string;
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
    status: 'draft' | 'reviewed';
    createdAt: string;
}

export interface TaxNoticeTemplate {
    _id: string;
    name: string;
    noticeType: string;
    sectionOrAct: string;
    subject: string;
    letterBody: string;
    legalReferences: string[];
    createdAt: string;
}

export const taxNoticeService = {
    async uploadAnalyze(
        file: File,
        params: { clientId?: string; replyStyle: 'Auto Reply' | 'Strong Legal Reply'; includeSimpleExplanation: boolean }
    ): Promise<{ duplicate: boolean; notice: TaxNoticeRecord; similarCases: any[] }> {
        const form = new FormData();
        form.append('file', file);
        if (params.clientId) form.append('clientId', params.clientId);
        form.append('replyStyle', params.replyStyle);
        form.append('includeSimpleExplanation', String(params.includeSimpleExplanation));

        const { data } = await api.post('/tax-notice/upload-analyze', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    async getDetail(id: string): Promise<TaxNoticeRecord> {
        const { data } = await api.get(`/tax-notice/detail/${id}`);
        return data;
    },

    async saveDraft(
        id: string,
        payload: {
            status: 'draft' | 'reviewed';
            replyDraft: TaxNoticeRecord['replyDraft'];
            supportingDocuments: string[];
            complianceStrategy: TaxNoticeRecord['complianceStrategy'];
        }
    ): Promise<TaxNoticeRecord> {
        const { data } = await api.patch(`/tax-notice/draft/${id}`, payload);
        return data.notice;
    },

    async getHistory(): Promise<TaxNoticeRecord[]> {
        const { data } = await api.get('/tax-notice/history');
        return data.data || [];
    },

    async comparePrevious(id: string): Promise<any[]> {
        const { data } = await api.get(`/tax-notice/compare/${id}`);
        return data.data || [];
    },

    async getTemplates(): Promise<TaxNoticeTemplate[]> {
        const { data } = await api.get('/tax-notice/templates/list');
        return data.data || [];
    },

    async createTemplate(noticeId: string, name: string): Promise<TaxNoticeTemplate> {
        const { data } = await api.post('/tax-notice/templates', { noticeId, name });
        return data.template;
    },
};
