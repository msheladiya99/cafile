import api from './api';

export interface ServiceItem {
    _id?: string;
    name: string;
    description: string;
    basePrice: number;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'OTHER';
    isActive: boolean;
}

export interface InvoiceItem {
    serviceId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface Payment {
    _id?: string;
    amount: number;
    date: Date;
    method: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
    transactionId?: string;
    note?: string;
}

export type PopulatedRef<T extends Record<string, unknown>> = string | T;

export interface Invoice {
    _id: string;
    invoiceNumber: string;
    billingType: 'SINGLE_CLIENT' | 'CLIENT_GROUP';
    clientId?: PopulatedRef<{ _id: string; name: string; email: string }>;
    clientGroupId?: PopulatedRef<{ _id: string; groupName: string; email: string }>;
    firmId?: PopulatedRef<{ _id: string; firmName: string }>;
    multiFirmId?: PopulatedRef<{ _id: string; firmName: string; logoUrl?: string; invoiceTemplate?: string; invoiceTerms?: string; gstin?: string; panNumber?: string }>;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
    dueDate: string;
    issueDate: string;
    payments: Payment[];
    notes?: string;
    createdAt: string;
}

export interface PaymentStatus {
    hasFileAccess: boolean;
    totalInvoices: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalOutstanding: number;
    overdueDetails: Array<{
        invoiceNumber: string;
        dueDate: string;
        balanceAmount: number;
    }>;
}

export interface ClientLedger {
    client: { _id: string; name: string; email: string; phone?: string; address?: string };
    summary: {
        totalInvoices: number;
        totalBilled: number;
        totalPaid: number;
        totalDue: number;
        totalOverdue: number;
        paidInvoices: number;
        partialInvoices: number;
        pendingInvoices: number;
        cancelledInvoices: number;
        overdueInvoices: number;
        avgPaymentDays: number;
        lastPaymentDate: string | null;
        lastPaymentAmount: number;
        paymentRate: number;
    };
    ledgerEntries: Array<{
        date: string;
        type: 'INVOICE' | 'PAYMENT';
        description: string;
        invoiceNumber: string;
        invoiceId: string;
        debit: number;
        credit: number;
        balance: number;
        status?: string;
        dueDate?: string;
        method?: string;
    }>;
    invoices: Invoice[];
    paymentHistory: Payment[];
}

export const billingService = {

    // --- Services ---
    getServices: async (): Promise<ServiceItem[]> => {
        const response = await api.get('/billing/services');
        return response.data;
    },

    createService: async (data: Partial<ServiceItem>): Promise<ServiceItem> => {
        const response = await api.post('/billing/services', data);
        return response.data;
    },

    updateService: async (id: string, data: Partial<ServiceItem>): Promise<ServiceItem> => {
        const response = await api.put(`/billing/services/${id}`, data);
        return response.data;
    },

    deleteService: async (id: string): Promise<void> => {
        await api.delete(`/billing/services/${id}`);
    },

    // --- Invoices ---
    getInvoices: async (clientId?: string): Promise<Invoice[]> => {
        const params = clientId ? { clientId } : {};
        const response = await api.get('/billing/invoices', { params });
        return response.data;
    },

    getInvoice: async (id: string): Promise<Invoice> => {
        const response = await api.get(`/billing/invoices/${id}`);
        return response.data;
    },

    createInvoice: async (data: Partial<Invoice>): Promise<Invoice> => {
        const response = await api.post('/billing/invoices', data);
        return response.data;
    },

    addPayment: async (invoiceId: string, paymentData: Partial<Payment>): Promise<Invoice> => {
        const response = await api.post(`/billing/invoices/${invoiceId}/payments`, paymentData);
        return response.data;
    },

    deletePayment: async (invoiceId: string, paymentId: string): Promise<Invoice> => {
        const response = await api.delete(`/billing/invoices/${invoiceId}/payments/${paymentId}`);
        return response.data;
    },

    updateInvoiceStatus: async (id: string, status: string): Promise<Invoice> => {
        const response = await api.patch(`/billing/invoices/${id}/status`, { status });
        return response.data;
    },

    updateInvoice: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
        const response = await api.put(`/billing/invoices/${id}`, data);
        return response.data;
    },

    createGroupBilling: async (invoices: Partial<Invoice>[]): Promise<{ created: number; invoices: Invoice[] }> => {
        const response = await api.post('/billing/invoices/bulk-group', { invoices });
        return response.data;
    },

    deleteInvoice: async (id: string): Promise<void> => {
        await api.delete(`/billing/invoices/${id}`);
    },

    // --- Payment Status ---
    getPaymentStatus: async (clientId: string): Promise<PaymentStatus> => {
        const response = await api.get(`/billing/payment-status/${clientId}`);
        return response.data;
    },

    // --- Client Ledger ---
    getClientLedger: async (filters?: {
        clientId?: string;
        staffId?: string;
        startDate?: string;
        endDate?: string;
        groupId?: string;
        firmId?: string;
        year?: string;
        month?: string;
    }): Promise<{ clientLedgers: ClientLedger[]; overallSummary: Record<string, number>; generatedAt: string }> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
        }
        const response = await api.get(`/billing/client-ledger?${params.toString()}`);
        return response.data;
    },
};

