import api from './api';

export interface IFile {
    _id: string;
    clientId: string;
    year: string;
    category: 'ITR' | 'GST' | 'ACCOUNTING' | 'USER_DOCS';
    fileName: string;
    originalFileName: string;
    fileSize: number;
    uploadedBy: {
        _id: string;
        username: string;
    };
    uploadedAt: string;
    storedIn: 'local' | 'drive';
    isStarred: boolean;
    notes?: string;
    tags?: string[];
    month?: string;
    docType?: string;
    driveWebViewLink?: string;
}

export const fileService = {
    // Get files with filters
    getFiles: async (clientId: string, params: { year?: string; category?: string; search?: string; favorites?: boolean }) => {
        const response = await api.get(`/files/client/${clientId}`, { params });
        return response.data;
    },

    // Toggle star
    toggleStar: async (fileId: string) => {
        const response = await api.patch(`/files/${fileId}/star`);
        return response.data;
    },

    // Update notes
    updateNotes: async (fileId: string, notes: string) => {
        const response = await api.patch(`/files/${fileId}/notes`, { notes });
        return response.data;
    },

    // Download single file
    downloadFile: async (fileId: string, fileName: string) => {
        const response = await api.get(`/files/${fileId}/download`, {
            responseType: 'blob'
        });

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Preview URL
    getPreviewUrl: (fileId: string) => {
        return `${api.defaults.baseURL}/files/${fileId}/preview?token=${localStorage.getItem('token')}`;
    },

    // Bulk Download ZIP
    downloadZip: async (fileIds: string[]) => {
        const response = await api.post('/files/download-zip', { fileIds }, {
            responseType: 'blob'
        });

        // Download ZIP
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'documents.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
