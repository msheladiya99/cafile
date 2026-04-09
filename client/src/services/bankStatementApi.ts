import api from './api';

const BASE = '/bank-statement';

export interface TransactionRow {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    category?: string;
    hasError?: boolean;
    errorMessage?: string;
    rowIndex?: number;
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
    processingErrors: string[];
    processingWarnings: string[];
    status: string;
}

export const bankStatementApi = {
    /**
     * Upload + immediately process a bank statement
     */
    uploadAndProcess: async (file: File, clientId: string): Promise<ProcessResponse> => {
        const form = new FormData();
        form.append('file', file);
        form.append('clientId', clientId);

        const { data } = await api.post<ProcessResponse>(`${BASE}/upload-process`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    /**
     * Fetch a single statement (with rows)
     */
    getStatement: async (id: string): Promise<BankStatementRecord> => {
        const { data } = await api.get<BankStatementRecord>(`${BASE}/${id}`);
        return data;
    },

    /**
     * List statements for a client (without rows — lightweight)
     */
    listForClient: async (clientId: string): Promise<BankStatementRecord[]> => {
        const { data } = await api.get<BankStatementRecord[]>(`${BASE}/client/${clientId}`);
        return data;
    },

    /**
     * Save manually corrected rows back to server
     */
    updateRows: async (id: string, rows: TransactionRow[]): Promise<void> => {
        await api.patch(`${BASE}/${id}/rows`, { rows });
    },

    /**
     * Download Excel — triggers browser file download
     */
    downloadExcel: (id: string) => {
        api.get(`${BASE}/${id}/download-excel`, { responseType: 'blob' }).then(res => {
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            const disposition = res.headers['content-disposition'] || '';
            const fileNameMatch = disposition.match(/filename="?([^"]+)"?/);
            a.download = fileNameMatch ? fileNameMatch[1] : 'bank_statement.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(downloadUrl); a.remove(); }, 500);
        });
    },

    /**
     * Delete a statement record
     */
    deleteStatement: async (id: string): Promise<void> => {
        await api.delete(`${BASE}/${id}`);
    },
};
