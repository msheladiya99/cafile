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

export interface Invoice {
    _id: string;
    invoiceNumber: string;
    clientId: any; // Populated client object
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

    createInvoice: async (data: any): Promise<Invoice> => {
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

    updateInvoice: async (id: string, data: any): Promise<Invoice> => {
        const response = await api.put(`/billing/invoices/${id}`, data);
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
};

