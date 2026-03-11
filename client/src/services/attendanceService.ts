import api from './api';

export interface AttendanceData {
    _id?: string;
    employee: string;
    date: string;
    inTime?: string;
    outTime?: string;
    description?: string;
    status?: string;
}

export const attendanceService = {
    createAttendance: async (data: AttendanceData) => {
        const response = await api.post('/attendance', data);
        return response.data;
    },

    getAttendance: async (filters?: { employee?: string; startDate?: string; endDate?: string }) => {
        let query = '';
        if (filters) {
            const params = new URLSearchParams();
            if (filters.employee) params.append('employee', filters.employee);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            const queryString = params.toString();
            if (queryString) query = `?${queryString}`;
        }
        const response = await api.get(`/attendance${query}`);
        return response.data;
    },

    updateAttendance: async (id: string, data: Omit<AttendanceData, '_id'>) => {
        const response = await api.put(`/attendance/${id}`, data);
        return response.data;
    },

    getForm108: async (employee: string, year: string) => {
        const response = await api.get(`/attendance/form108?employee=${employee}&year=${year}`);
        return response.data;
    },

    deleteAttendance: async (id: string) => {
        const response = await api.delete(`/attendance/${id}`);
        return response.data;
    }
};
