import api from './api';

const BASE = '/bank-statement';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TransactionRow {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    category?: string;
    subcategory?: string;
    gstApplicable?: boolean;
    isTaxDeductible?: boolean;
    hasError?: boolean;
    errorMessage?: string;
    autoFixed?: boolean;
    suspicious?: boolean;
    confidence?: number;
    rowIndex?: number;
}

export interface AutoFixSuggestion {
    rowIndex: number;
    field: 'debit' | 'credit' | 'balance';
    currentValue: number;
    suggestedValue: number;
    reason: string;
    confidence: number;
}

export interface BankStatementRecord {
    _id: string;
    originalFileName: string;
    bankName: string;
    accountNumber?: string;
    statementPeriod?: string;
    extractedRows: TransactionRow[];
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    processingErrors: string[];
    processingWarnings: string[];
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
    confidence: number;
    ocrUsed: boolean;
    autoFixApplied: boolean;
    suspiciousRowCount: number;
    missingRowCount: number;
    processingMethod: 'pdf-parse' | 'ocr' | 'manual' | 'ai';
    createdAt: string;
}

export interface ProcessResponse {
    id: string;
    bankName: string;
    accountNumber?: string;
    statementPeriod?: string;
    transactionCount: number;
    totalDebit: number;
    totalCredit: number;
    rows: TransactionRow[];
    extractedRows: TransactionRow[];
    processingErrors: string[];
    processingWarnings: string[];
    processingMethod: 'pdf-parse' | 'ocr' | 'manual' | 'ai';
    confidence: number;
    ocrUsed: boolean;
    suspiciousRowCount: number;
    status: string;
}

export interface CreditBalance {
    planType: 'free' | 'pro' | 'enterprise';
    monthlyLimit: number;
    usedThisMonth: number;
    remaining: number;
    resetsOn: string;
}

// ─── Progress Event ───────────────────────────────────────────────────────────

export interface ProgressEvent {
    step:      string;
    label:     string;
    progress:  number;   // 0–100
    timestamp: number;
}

// ─── API Client ───────────────────────────────────────────────────────────────

export const bankStatementApi = {

    uploadAndProcess: async (file: File, clientId: string): Promise<ProcessResponse> => {
        const form = new FormData();
        form.append('file', file);
        form.append('clientId', clientId);
        const { data } = await api.post<ProcessResponse>(`${BASE}/upload-process`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    getStatement: async (id: string): Promise<BankStatementRecord> => {
        const { data } = await api.get<BankStatementRecord>(`${BASE}/${id}`);
        return data;
    },

    listAll: async (params?: {
        clientId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: BankStatementRecord[]; total: number; page: number }> => {
        const q = new URLSearchParams();
        if (params?.clientId) q.set('clientId', params.clientId);
        if (params?.status)   q.set('status',   params.status);
        if (params?.page)     q.set('page',      String(params.page));
        if (params?.limit)    q.set('limit',     String(params.limit));
        const { data } = await api.get(`${BASE}?${q}`);
        return data;
    },

    listForClient: async (clientId: string): Promise<BankStatementRecord[]> => {
        const { data } = await api.get<BankStatementRecord[]>(`${BASE}/client/${clientId}`);
        return data;
    },

    updateRows: async (id: string, rows: TransactionRow[]): Promise<void> => {
        await api.patch(`${BASE}/${id}/rows`, { rows });
    },

    reprocess: async (id: string): Promise<void> => {
        await api.post(`${BASE}/${id}/reprocess`);
    },

    remapColumns: async (
        id: string,
        columnMapping: Record<string, number>,
        rawText: string
    ): Promise<{ rows: TransactionRow[]; errors: number; suggestions: number }> => {
        const { data } = await api.post(`${BASE}/${id}/remap`, { columnMapping, rawText });
        return data;
    },

    applyFixes: async (id: string, suggestions: AutoFixSuggestion[]): Promise<{ rows: TransactionRow[] }> => {
        const { data } = await api.post(`${BASE}/${id}/apply-fixes`, { suggestions });
        return data;
    },

    getCreditBalance: async (): Promise<CreditBalance> => {
        const { data } = await api.get<CreditBalance>(`${BASE}/credits/balance`);
        return data;
    },

    downloadExcel: (id: string) => {
        api.get(`${BASE}/${id}/download-excel`, { responseType: 'blob' }).then(res => {
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            const disp = res.headers['content-disposition'] || '';
            const match = disp.match(/filename="?([^"]+)"?/);
            a.download = match ? match[1] : 'bank_statement.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
        });
    },

    deleteStatement: async (id: string): Promise<void> => {
        await api.delete(`${BASE}/${id}`);
    },

    /**
     * Subscribe to SSE progress events for a statement being processed.
     * Returns an EventSource. Caller must close it when done.
     */
    subscribeProgress: (id: string, token: string, onEvent: (evt: ProgressEvent) => void): EventSource => {
        const base = (api.defaults.baseURL || '').replace(/\/$/, '');
        const es   = new EventSource(`${base}${BASE}/progress/${id}?token=${encodeURIComponent(token)}`);
        es.onmessage = (e) => {
            try { onEvent(JSON.parse(e.data)); } catch { /* ignore */ }
        };
        return es;
    },
};
