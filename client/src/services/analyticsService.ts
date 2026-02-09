import api from './api';

export interface DashboardAnalytics {
    summary: {
        totalClients: number;
        totalFiles: number;
        totalUsers: number;
        recentFiles: number;
    };
    categoryDistribution: Array<{
        category: string;
        count: number;
    }>;
    storageByClient: Array<{
        clientId: string;
        clientName: string;
        totalSize: number;
        fileCount: number;
    }>;
    uploadTrends: Array<{
        year: number;
        month: number;
        count: number;
    }>;
    clientActivity: Array<{
        userId: string;
        username: string;
        clientName: string;
        lastLogin: Date | null;
        email: string;
    }>;
    mostActiveClients: Array<{
        clientId: string;
        clientName: string;
        uploadCount: number;
    }>;
}

export interface MonthlyReport {
    period: {
        year: number;
        month: number;
        monthName: string;
    };
    summary: {
        filesUploaded: number;
        newClients: number;
    };

}

export const analyticsService = {
    getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    getMonthlyReport: async (year?: number, month?: number): Promise<MonthlyReport> => {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());

        const response = await api.get(`/analytics/monthly-report?${params.toString()}`);
        return response.data;
    },
};
