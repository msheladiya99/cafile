import api from './api';

export interface CompanySettings {
    _id?: string;
    companyName: string;
    address: string;
    email: string;
    phone: string;
    logoUrl?: string;
    employeeExtraFields?: {
        field1: string;
        field2: string;
        field3: string;
        field4: string;
        field5: string;
        field6: string;
        field7: string;
    };
    clientExtraFields?: {
        field1: string;
        field2: string;
        field3: string;
        field4: string;
        field5: string;
        field6: string;
        field7: string;
    };
    updatedAt?: Date;
}

class SettingsService {
    async getSettings(): Promise<CompanySettings> {
        const response = await api.get('/settings');
        return response.data;
    }

    async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
        const response = await api.put('/settings', settings);
        return response.data;
    }
}

export default new SettingsService();
