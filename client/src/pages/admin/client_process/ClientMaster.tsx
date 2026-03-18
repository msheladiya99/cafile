import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Switch,
    Tabs,
    Tab,
    Select,
    MenuItem,
    Divider,
    IconButton,
    Dialog,
    DialogContent,
    Snackbar,
    Alert,
    Autocomplete,
} from '@mui/material';
import {
    GridView as GridViewIcon,
    ContactPhone as ContactPhoneIcon,
    MoreHoriz as MoreHorizIcon,
    Image as ImageIcon,
    CalendarToday as CalendarTodayIcon,
    ContactMail as ContactMailIcon,
    AddBox as AddBoxIcon,
    PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientGroupService, type ClientGroup } from '../../../services/clientGroupService';
import { masterService, type ITStatus, type SubMaster } from '../../../services/masterService';
import { adminService } from '../../../services/adminService';
import { API_URL } from '../../../services/api';
import type { CreateClientData, User, CreateClientResponse } from '../../../types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

interface FormRowProps {
    label: string;
    required?: boolean;
    children?: React.ReactNode;
    helperText?: string;
}

const FormRow = ({ label, required, children, helperText }: FormRowProps) => {
    // Type checking for child element to safely access props
    const childIsElement = React.isValidElement(children);
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
                <Typography sx={{ width: { xs: '100%', sm: '160px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, pt: { xs: 0, sm: childIsElement && (children as React.ReactElement<{ multiline?: boolean }>).props.multiline ? 1 : 0 }, flexShrink: 0 }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <Box sx={{ flex: 1, width: '100%' }}>
                    {children}
                </Box>
            </Box>
            {helperText && (
                <Box sx={{ display: 'flex', mt: 0.5 }}>
                    <Box sx={{ width: { xs: 0, sm: '160px' }, display: { xs: 'none', sm: 'block' }, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block', fontSize: '0.75rem' }}>
                        <strong style={{ marginRight: '4px' }}>NOTE!</strong> {helperText}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

interface SectionProps {
    title: string;
    icon: React.ReactElement<{ sx?: Record<string, unknown> }>;
    children?: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
    <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {React.cloneElement(icon, { sx: { width: 20, height: 20, color: 'text.secondary' } })}
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            {children}
        </Box>
    </Paper>
);

interface MasterModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    itemName: string;
    onSave: (data: { name: string; description: string; status: boolean }) => void;
    isSaving: boolean;
    dataList: { _id?: string; name: string; status?: boolean }[];
    showSnackbar: (message: string, severity?: 'success' | 'error') => void;
}

const MasterModal = ({ open, onClose, title, itemName, onSave, isSaving, dataList, showSnackbar }: MasterModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true);
    const handleSave = () => {
        if (!name.trim()) {
            showSnackbar('Name is required', 'error');
            return;
        }
        onSave({ name, description, status });
        setName('');
        setDescription('');
        setStatus(true);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1.1rem' }}>{title}</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }} disabled={isSaving}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, mb: 2 }}>
                        <Typography sx={{ width: { xs: '100%', sm: '120px' }, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
                            Name <span style={{ color: 'red' }}>*</span>
                        </Typography>
                        <TextField fullWidth size="small" value={name} onChange={e => setName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, mb: 3 }}>
                        <Typography sx={{ width: { xs: '100%', sm: '120px' }, color: 'text.secondary', fontSize: '0.9rem', pt: 1, fontWeight: 500 }}>
                            Description
                        </Typography>
                        <TextField fullWidth size="small" multiline rows={3} value={description} onChange={e => setDescription(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, mb: 3 }}>
                        <Typography sx={{ width: { xs: '100%', sm: '120px' }, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
                            Status
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: status ? '#e8f5e9' : '#ffebee', borderRadius: 4, px: 2, height: 32, width: 'fit-content' }}>
                            <Switch size="small" color="primary" sx={{ ml: -1 }} checked={status} onChange={e => setStatus(e.target.checked)} />
                            <Typography variant="body2" sx={{ color: status ? 'success.main' : 'error.main', ml: 0.5, fontWeight: 600 }}>{status ? 'Active' : 'Inactive'}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        <Button variant="contained" onClick={handleSave} disabled={isSaving} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 3, py: 0.5, textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="contained" onClick={onClose} disabled={isSaving} sx={{ bgcolor: '#fb7165', '&:hover': { bgcolor: '#eb6155' }, px: 3, py: 0.5, textTransform: 'none', borderRadius: 2, boxShadow: 'none', fontWeight: 600 }}>
                            Cancel
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormatListBulletedIcon fontSize="small" />
                    <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '1rem' }}>List</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    {dataList.length === 0 ? (
                        <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                            <Typography variant="body2" color="text.secondary">{itemName} Not Found</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '200px', overflowY: 'auto' }}>
                            {dataList.map(item => (
                                <Box key={item._id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" fontWeight="500">{item.name}</Typography>
                                    <Typography variant="caption" sx={{ color: item.status ? 'success.main' : 'error.main', fontWeight: 600 }}>{item.status ? 'Active' : 'Inactive'}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export const ClientMaster: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const [tabValue, setTabValue] = useState(0);
    const [itStatusModalOpen, setItStatusModalOpen] = useState(false);
    const [subMasterModalOpen, setSubMasterModalOpen] = useState(false);
    const [profileImage, setProfileImage] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateClientData>({
        name: '',
        clientCode: '',
        groupName: '',
        itStatus: '',
        masterType: '',
        subMaster: '',
        birthDate: '',
        address: '',
        country: '',
        state: '',
        city: '',
        postalCode: '',
        phone: '', // Mapped to Mobile Number
        email: '',
        currency: '',
        panNumber: '',
        gstNumber: '',
        aadharNumber: '',
        incorporationDateFrom: '',
        incorporationDateTo: '',
        licenceNo: '',
        licenceAuthority: '',
        trnNo: '',
        description: '',
        supportEmployee: '',
        status: true,
        financialYear: 'april-march',
        altAddress: '',
        altPhoneM: '',
        altPhoneL: '',
        altFax: '',
        extraField1: '',
        extraField2: '',
        extraField3: '',
        extraField4: '',
        extraField5: '',
        extraField6: '',
        extraField7: '',
        multipleContacts: [],
        legalDocuments: [],
    });

    // Multiple Contact Form State
    const [contactForm, setContactForm] = useState({
        name: '',
        designation: '',
        mobile: '',
        email: '',
        description: '',
        status: true
    });

    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContactForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddContactForm = () => {
        if (!contactForm.name || !contactForm.designation || !contactForm.mobile || !contactForm.email) {
            showSnackbar('Name, Designation, Mobile and Email are required', 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            multipleContacts: [...(prev.multipleContacts || []), contactForm]
        }));
        setContactForm({
            name: '',
            designation: '',
            mobile: '',
            email: '',
            description: '',
            status: true
        });
        showSnackbar('Contact added temporarily. Client must be saved.', 'info');
    };

    // Edit Client Data Fetching
    const { data: clientToEdit } = useQuery({
        queryKey: ['client', id],
        queryFn: () => adminService.getClient(id!),
        enabled: !!id
    });

    React.useEffect(() => {
        if (clientToEdit) {
            setFormData({
                name: clientToEdit.name || '',
                clientCode: clientToEdit.clientCode || '',
                groupName: (typeof clientToEdit.groupName === 'object' ? clientToEdit.groupName._id : clientToEdit.groupName) || '',
                itStatus: (typeof clientToEdit.itStatus === 'object' ? clientToEdit.itStatus._id : clientToEdit.itStatus) || '',
                masterType: clientToEdit.masterType || '',
                subMaster: (typeof clientToEdit.subMaster === 'object' ? clientToEdit.subMaster._id : clientToEdit.subMaster) || '',
                birthDate: clientToEdit.birthDate ? clientToEdit.birthDate.split('T')[0] : '',
                address: clientToEdit.address || '',
                country: clientToEdit.country || '',
                state: clientToEdit.state || '',
                city: clientToEdit.city || '',
                postalCode: clientToEdit.postalCode || '',
                phone: clientToEdit.phone || '', // Mapped to Mobile Number
                email: clientToEdit.email || '',
                currency: clientToEdit.currency || '',
                panNumber: clientToEdit.panNumber || '',
                gstNumber: clientToEdit.gstNumber || '',
                aadharNumber: clientToEdit.aadharNumber || '',
                incorporationDateFrom: clientToEdit.incorporationDateFrom ? clientToEdit.incorporationDateFrom.split('T')[0] : '',
                incorporationDateTo: clientToEdit.incorporationDateTo ? clientToEdit.incorporationDateTo.split('T')[0] : '',
                licenceNo: clientToEdit.licenceNo || '',
                licenceAuthority: clientToEdit.licenceAuthority || '',
                trnNo: clientToEdit.trnNo || '',
                description: clientToEdit.description || '',
                supportEmployee: (typeof clientToEdit.supportEmployee === 'object' && clientToEdit.supportEmployee !== null && '_id' in clientToEdit.supportEmployee ? clientToEdit.supportEmployee._id : clientToEdit.supportEmployee) || '',
                status: clientToEdit.status !== false,
                financialYear: clientToEdit.financialYear || 'april-march',
                altAddress: clientToEdit.altAddress || '',
                altPhoneM: clientToEdit.altPhoneM || '',
                altPhoneL: clientToEdit.altPhoneL || '',
                altFax: clientToEdit.altFax || '',
                extraField1: clientToEdit.extraField1 || '',
                extraField2: clientToEdit.extraField2 || '',
                extraField3: clientToEdit.extraField3 || '',
                extraField4: clientToEdit.extraField4 || '',
                extraField5: clientToEdit.extraField5 || '',
                extraField6: clientToEdit.extraField6 || '',
                extraField7: clientToEdit.extraField7 || '',
                profileImageUrl: clientToEdit.profileImageUrl || '',
                multipleContacts: clientToEdit.multipleContacts || [],
                legalDocuments: clientToEdit.legalDocuments || [],
            });
        }
    }, [clientToEdit]);

    const handleCancelContactForm = () => {
        setContactForm({
            name: '',
            designation: '',
            mobile: '',
            email: '',
            description: '',
            status: true
        });
    };

    // Legal Document Form State
    const [legalForm, setLegalForm] = useState<{
        documentName: string;
        description: string;
        file: File | null;
    }>({
        documentName: '',
        description: '',
        file: null
    });

    const [pendingLegalFiles, setPendingLegalFiles] = useState<{ fileName: string; file: File }[]>([]);

    const handleLegalFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLegalForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAddLegalForm = () => {
        if (!legalForm.documentName || !legalForm.file) {
            showSnackbar('Document name and Browse Document are required', 'error');
            return;
        }
        setFormData(prev => ({
            ...prev,
            legalDocuments: [...(prev.legalDocuments || []), {
                documentName: legalForm.documentName,
                description: legalForm.description,
                fileName: legalForm.file!.name
            }]
        }));
        setPendingLegalFiles(prev => [...prev, { fileName: legalForm.file!.name, file: legalForm.file! }]);
        setLegalForm({
            documentName: '',
            description: '',
            file: null
        });
        showSnackbar('Document added temporarily. Client must be saved.', 'info');
    };

    const handleCancelLegalForm = () => {
        setLegalForm({
            documentName: '',
            description: '',
            file: null
        });
    };

    const handleRemoveLegalForm = async (index: number) => {
        const docToRemove = formData.legalDocuments?.[index];
        if (!docToRemove) return;

        const isPending = pendingLegalFiles.some(p => p.fileName === docToRemove.fileName);

        // If it's not pending and the client has an ID, attempt to delete it from the server/Drive
        if (!isPending && id) {
            try {
                const clientFiles = await adminService.getClientFiles(id, undefined, 'USER_DOCS');
                const serverFile = clientFiles.find(f => f.fileName === docToRemove.fileName || f.originalFileName === docToRemove.fileName);
                if (serverFile) {
                    await adminService.deleteFile(serverFile._id);
                    showSnackbar('Record and file deleted from Google Drive automatically.', 'success');
                }
            } catch (err) {
                console.error('Failed to delete file from server:', err);
            }
        }

        setFormData(prev => ({
            ...prev,
            legalDocuments: prev.legalDocuments?.filter((_, i) => i !== index)
        }));

        // Remove from pending list as well
        if (isPending) {
            setPendingLegalFiles(prev => prev.filter(p => p.fileName !== docToRemove.fileName));
        }
    };

    const handleDownloadLegalDoc = async (fileName: string) => {
        // Find if it's a pending file (local)
        const pendingFile = pendingLegalFiles.find(p => p.fileName === fileName);

        if (pendingFile) {
            // Download local file
            const url = URL.createObjectURL(pendingFile.file);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else if (id) {
            // Fetch from server
            try {
                showSnackbar('Connecting to Google Drive to download file...', 'info');
                const clientFiles = await adminService.getClientFiles(id, undefined, 'USER_DOCS');
                const serverFile = clientFiles.find(f => f.fileName === fileName || f.originalFileName === fileName);

                if (serverFile) {
                    await adminService.downloadFile(serverFile._id, fileName);
                    showSnackbar('File downloaded successfully', 'success');
                } else {
                    showSnackbar(`File "${fileName}" not found in Google Drive.`, 'error');
                }
            } catch (err) {
                console.error('Failed to download from drive:', err);
                showSnackbar('Failed to download file from Google Drive.', 'error');
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name as string]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Fetch lists
    const { data: groups = [] } = useQuery<ClientGroup[]>({
        queryKey: ['clientGroups'],
        queryFn: clientGroupService.getGroups
    });
    const { data: itStatuses = [] } = useQuery<ITStatus[]>({
        queryKey: ['itStatus'],
        queryFn: masterService.getITStatuses
    });
    const { data: subMasters = [] } = useQuery<SubMaster[]>({
        queryKey: ['subMaster'],
        queryFn: masterService.getSubMasters
    });
    const { data: staffList = [] } = useQuery<User[]>({
        queryKey: ['staffUsers'],
        queryFn: adminService.getStaffUsers
    });

    // Mutations
    const itStatusMutation = useMutation({
        mutationFn: masterService.createITStatus,
        onSuccess: () => {
            showSnackbar('IT Status created successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['itStatus'] });
            setItStatusModalOpen(false);
        },
        onError: (err: AxiosError<{ message: string }>) => {
            showSnackbar(err.response?.data?.message || 'Failed to create IT Status', 'error');
        }
    });

    const subMasterMutation = useMutation({
        mutationFn: masterService.createSubMaster,
        onSuccess: () => {
            showSnackbar('Sub Master created successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['subMaster'] });
            setSubMasterModalOpen(false);
        },
        onError: (err: AxiosError<{ message: string }>) => {
            showSnackbar(err.response?.data?.message || 'Failed to create Sub Master', 'error');
        }
    });

    const createClientMutation = useMutation({
        mutationFn: adminService.createClient,
        onSuccess: async (data: CreateClientResponse) => {
            try {
                if (profileImage && data?.client?._id) {
                    await adminService.uploadProfileImage(data.client._id, profileImage);
                }

                if (data?.client?._id && pendingLegalFiles.length > 0) {
                    for (const pendingFile of pendingLegalFiles) {
                        const uploadData = new FormData();
                        uploadData.append('file', pendingFile.file);
                        uploadData.append('clientId', data.client._id);
                        uploadData.append('category', 'USER_DOCS');
                        uploadData.append('fileName', pendingFile.fileName);
                        try {
                            await adminService.uploadFile(uploadData);
                        } catch (e) {
                            console.error('Failed to upload legal file:', e);
                        }
                    }
                }

                showSnackbar('Client saved successfully', 'success');
                navigate('/admin/client/list');
            } catch {
                showSnackbar('Client saved, but failed to upload profile image or legal documents', 'error');
                navigate('/admin/client/list');
            }
        },
        onError: (err: AxiosError<{ message: string }>) => {
            showSnackbar(err.response?.data?.message || 'Failed to save client', 'error');
        }
    });

    const updateClientMutation = useMutation({
        mutationFn: (data: Partial<CreateClientData>) => adminService.updateClient(id!, data),
        onSuccess: async () => {
            try {
                if (profileImage && id) {
                    await adminService.uploadProfileImage(id, profileImage);
                }

                if (id && pendingLegalFiles.length > 0) {
                    for (const pendingFile of pendingLegalFiles) {
                        const uploadData = new FormData();
                        uploadData.append('file', pendingFile.file);
                        uploadData.append('clientId', id);
                        uploadData.append('category', 'USER_DOCS');
                        uploadData.append('fileName', pendingFile.fileName);
                        try {
                            await adminService.uploadFile(uploadData);
                        } catch (e) {
                            console.error('Failed to upload legal file:', e);
                        }
                    }
                }

                showSnackbar('Client updated successfully', 'success');
                navigate('/admin/client/list');
            } catch {
                showSnackbar('Client updated, but failed to upload profile image or legal documents', 'error');
                navigate('/admin/client/list');
            }
        },
        onError: (err: AxiosError<{ message: string }>) => {
            showSnackbar(err.response?.data?.message || 'Failed to update client', 'error');
        }
    });

    const resetClientPasswordMutation = useMutation({
        mutationFn: () => adminService.resetClientPassword(id!),
        onSuccess: () => {
            showSnackbar('New password has been generated and emailed to the client.', 'success');
        },
        onError: (err: AxiosError<{ message: string }>) => {
            showSnackbar(err.response?.data?.message || 'Failed to reset password', 'error');
        }
    });

    const handleSaveClient = () => {
        if (!formData.name || !formData.groupName || !formData.itStatus || !formData.masterType) {
            showSnackbar('Please complete the required Basic Form fields', 'error');
            return;
        }
        if (!formData.address || !formData.country || !formData.state || !formData.city || !formData.phone || !formData.email) {
            showSnackbar('Please complete the required Primary Contact forms', 'error');
            return;
        }

        if (id) {
            updateClientMutation.mutate(formData);
        } else {
            createClientMutation.mutate(formData);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Client Master</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" size="small" onClick={() => setItStatusModalOpen(true)} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Add IT Status
                        </Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Add New
                        </Button>
                        <Button variant="contained" size="small" onClick={() => navigate('/admin/client/list')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            List
                        </Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Field Master
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary', minHeight: 48 },
                            '& .Mui-selected': { color: 'primary.main', bgcolor: 'rgba(102, 126, 234, 0.08)' },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                        }}
                    >
                        <Tab label="Client Information" />
                        <Tab label="Multiple Contact" />
                        <Tab label="Legal Document" />
                        <Tab label="Work Assign" />
                    </Tabs>
                </Box>

                <CustomTabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, px: 3, pb: 3 }}>

                        {/* LEFT COLUMN */}
                        <Box sx={{ flex: 15 }}>
                            <Section title="Basic Form" icon={<GridViewIcon />}>
                                <FormRow label="Client Name" required>
                                    <TextField name="name" value={formData.name} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Client Code">
                                    <TextField name="clientCode" value={formData.clientCode} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Group Name" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="groupName"
                                        value={formData.groupName || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value as string }))}
                                        sx={{ borderRadius: 1.5, color: formData.groupName ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a Group...</MenuItem>
                                        {groups.map((group) => (
                                            <MenuItem key={group._id} value={group._id}>
                                                {group.groupName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormRow>
                                <FormRow label="IT Status" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="itStatus"
                                        value={formData.itStatus || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, itStatus: e.target.value as string }))}
                                        sx={{ borderRadius: 1.5, color: formData.itStatus ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a IT Status...</MenuItem>
                                        {itStatuses.map((it) => (
                                            <MenuItem key={it._id} value={it._id as string}>
                                                {it.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormRow>
                                <FormRow label="Master Type" required>
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        options={['Client', 'Department', 'Follow Up', 'Other']}
                                        value={formData.masterType || null}
                                        onChange={(_, newValue) => {
                                            setFormData(prev => ({ ...prev, masterType: newValue || '' }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Choose a Master type..."
                                                sx={{
                                                    '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                                    '& input::placeholder': { color: 'text.secondary', opacity: 1 }
                                                }}
                                            />
                                        )}
                                    />
                                </FormRow>
                                <FormRow label="Sub Master">
                                    <Autocomplete
                                        fullWidth
                                        size="small"
                                        options={[
                                            'Individual', 'HUF', 'Partnership', 'Company', 'LLP', 'Trust', 'AOP/BOI', 'Local Authority', 'Artificial Juridical Person', 'Firm', 'Co-operative Society', 'Other'
                                        ]}
                                        value={formData.subMaster || null}
                                        onChange={(_, newValue) => {
                                            setFormData(prev => ({ ...prev, subMaster: newValue || '' }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Choose a Sub Master..."
                                                sx={{
                                                    '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                                    '& input::placeholder': { color: 'text.secondary', opacity: 1 }
                                                }}
                                            />
                                        )}
                                    />
                                </FormRow>
                                <FormRow label="Birth Date">
                                    <TextField name="birthDate" value={formData.birthDate} onChange={handleInputChange} type="date" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                </FormRow>
                            </Section>

                            <Section title="Primary Contact Detail" icon={<ContactPhoneIcon />}>
                                <FormRow label="Address" required>
                                    <TextField name="address" value={formData.address} onChange={handleInputChange} fullWidth multiline rows={3} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Country" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                        sx={{ borderRadius: 1.5, color: formData.country ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a Country...</MenuItem>
                                        <MenuItem value="India">India</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="State" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        sx={{ borderRadius: 1.5, color: formData.state ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a State...</MenuItem>
                                        <MenuItem value="Gujarat">Gujarat</MenuItem>
                                        <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                                        <MenuItem value="Delhi">Delhi</MenuItem>
                                        <MenuItem value="Rajasthan">Rajasthan</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="City" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        sx={{ borderRadius: 1.5, color: formData.city ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a City...</MenuItem>
                                        <MenuItem value="Surat">Surat</MenuItem>
                                        <MenuItem value="Ahmedabad">Ahmedabad</MenuItem>
                                        <MenuItem value="Mumbai">Mumbai</MenuItem>
                                        <MenuItem value="Pune">Pune</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="Postal Code">
                                    <TextField name="postalCode" value={formData.postalCode} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Mobile Number" required helperText="Separate multiple Mobile with &quot;,&quot; (Comma).">
                                    <TextField name="phone" value={formData.phone} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Email" required helperText="Separate multiple Email with &quot;,&quot; (Comma).">
                                    <TextField name="email" value={formData.email} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                            </Section>

                            <Section title="Other Details" icon={<MoreHorizIcon />}>
                                <FormRow label="Currency">
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        sx={{ borderRadius: 1.5, color: formData.currency ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a Currency...</MenuItem>
                                        <MenuItem value="INR">Indian Rupee (INR)</MenuItem>
                                        <MenuItem value="USD">US Dollar (USD)</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="PAN No">
                                    <TextField name="panNumber" value={formData.panNumber} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="GSTIN">
                                    <TextField name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Aadhar No.">
                                    <TextField name="aadharNumber" value={formData.aadharNumber} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Incorporation Date">
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <TextField name="incorporationDateFrom" value={formData.incorporationDateFrom} onChange={handleInputChange} type="date" size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                        <Typography color="text.secondary">To</Typography>
                                        <TextField name="incorporationDateTo" value={formData.incorporationDateTo} onChange={handleInputChange} type="date" size="small" sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                    </Box>
                                </FormRow>
                                <FormRow label="Licence No">
                                    <TextField name="licenceNo" value={formData.licenceNo} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Licence Authority">
                                    <TextField name="licenceAuthority" value={formData.licenceAuthority} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="TRN No">
                                    <TextField name="trnNo" value={formData.trnNo} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Description">
                                    <TextField name="description" value={formData.description} onChange={handleInputChange} fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Support Employee">
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="supportEmployee"
                                        value={formData.supportEmployee}
                                        onChange={(e) => setFormData(prev => ({ ...prev, supportEmployee: e.target.value }))}
                                        sx={{ borderRadius: 1.5, color: formData.supportEmployee ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose Employee...</MenuItem>
                                        {staffList.filter(user => user.role !== 'CLIENT').map(user => (
                                            <MenuItem key={user._id} value={user._id}>{user.username} ({user.role})</MenuItem>
                                        ))}
                                    </Select>
                                </FormRow>
                                <FormRow label="Status">
                                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: formData.status ? '#e8f5e9' : '#ffebee', borderRadius: 4, px: 2, height: 32, width: 'fit-content' }}>
                                        <Switch size="small" color="primary" sx={{ ml: -1 }} checked={formData.status} onChange={e => handleSwitchChange('status', e.target.checked)} />
                                        <Typography variant="body2" sx={{ color: formData.status ? 'success.main' : 'error.main', ml: 0.5, fontWeight: 600 }}>{formData.status ? 'Active' : 'Inactive'}</Typography>
                                    </Box>
                                </FormRow>
                            </Section>

                        </Box>

                        {/* RIGHT COLUMN */}
                        <Box sx={{ flex: 10 }}>
                            <Section title="Profile Image" icon={<ImageIcon />}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                                    <Box sx={{ width: 150, height: 150, border: '2px dashed #ccc', borderRadius: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f8fafc', overflow: 'hidden' }}>
                                        {profileImage ? (
                                            <img src={URL.createObjectURL(profileImage)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : formData?.profileImageUrl && clientToEdit?._id ? (
                                            <img src={`${API_URL}/admin/clients/${clientToEdit._id}/profile-image/view?rev=${clientToEdit.updatedAt || '1'}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        ) : (
                                            <PhotoCameraIcon sx={{ fontSize: 40, color: '#ccc' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 1.5, overflow: 'hidden', width: '100%', maxWidth: 300 }}>
                                        <Button component="label" sx={{ bgcolor: '#f1f5f9', color: 'text.primary', borderRadius: 0, textTransform: 'none', px: 2, py: 0.5, borderRight: '1px solid #ccc', fontWeight: 500 }}>
                                            Choose File
                                            <input type="file" hidden accept="image/jpeg, image/png" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
                                        </Button>
                                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {profileImage ? profileImage.name : (formData?.profileImageUrl ? 'Image already set' : 'No file chosen')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.3, borderRadius: 1, fontSize: '0.75rem' }}>
                                        <strong style={{ marginRight: '4px' }}>NOTE!</strong> JPEG or PNG Image Format only
                                    </Typography>
                                </Box>
                            </Section>

                            <Section title="Financial Year" icon={<CalendarTodayIcon />}>
                                <FormRow label="Year" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        name="financialYear"
                                        value={formData.financialYear}
                                        onChange={(e) => setFormData(prev => ({ ...prev, financialYear: e.target.value }))}
                                        sx={{ borderRadius: 1.5 }}
                                    >
                                        <MenuItem value="april-march">April-March</MenuItem>
                                        <MenuItem value="jan-dec">Jan-Dec</MenuItem>
                                    </Select>
                                </FormRow>
                            </Section>

                            <Section title="Alternate Contact" icon={<ContactMailIcon />}>
                                <FormRow label="Address">
                                    <TextField name="altAddress" value={formData.altAddress} onChange={handleInputChange} fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Phone(M)">
                                    <TextField name="altPhoneM" value={formData.altPhoneM} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Phone(L)">
                                    <TextField name="altPhoneL" value={formData.altPhoneL} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="FAX">
                                    <TextField name="altFax" value={formData.altFax} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                            </Section>

                            <Section title="Extra Fields" icon={<AddBoxIcon />}>
                                {([1, 2, 3, 4, 5, 6, 7] as const).map((num) => {
                                    const fieldName = `extraField${num}` as keyof CreateClientData;
                                    return (
                                        <FormRow key={num} label={`Field ${num}`}>
                                            <TextField name={fieldName} value={formData[fieldName]} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                        </FormRow>
                                    );
                                })}
                            </Section>

                            {id && (
                                <Section title="Login Security" icon={<GridViewIcon />}>
                                    <Box sx={{ bgcolor: '#fffbeb', p: 2, borderRadius: 2, border: '1px solid #fef3c7', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 600 }}>Reset Portal Password</Typography>
                                            <Typography sx={{ color: '#b45309', fontSize: '0.75rem' }}>A new secure password will be generated and emailed to the client.</Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            fullWidth
                                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600, boxShadow: 'none' }}
                                            onClick={() => {
                                                if (window.confirm('Reset this client\'s password and send email?')) {
                                                    resetClientPasswordMutation.mutate();
                                                }
                                            }}
                                            disabled={resetClientPasswordMutation.isPending}
                                        >
                                            {resetClientPasswordMutation.isPending ? 'Resetting...' : 'Reset & Send Email'}
                                        </Button>
                                    </Box>
                                </Section>
                            )}
                        </Box>
                    </Box>

                </CustomTabPanel>

                {/* Placeholders for other tabs */}
                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {/* Multiple Contact Form */}
                        <Paper elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <GridViewIcon sx={{ width: 20, height: 20, color: 'text.secondary' }} />
                                <Typography variant="subtitle2" fontWeight="700" color="text.primary">Client Multiple Contact</Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Client</Typography>
                                        <Typography sx={{ flex: 1, color: 'text.primary', fontSize: '0.9rem' }}>{formData.name || 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'none', md: 'block' } }}></Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Name <span style={{ color: 'red' }}>*</span></Typography>
                                        <TextField name="name" value={contactForm.name} onChange={handleContactFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Designation <span style={{ color: 'red' }}>*</span></Typography>
                                        <TextField name="designation" value={contactForm.designation} onChange={handleContactFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Mobile <span style={{ color: 'red' }}>*</span></Typography>
                                        <TextField name="mobile" value={contactForm.mobile} onChange={handleContactFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Email <span style={{ color: 'red' }}>*</span></Typography>
                                        <TextField name="email" value={contactForm.email} onChange={handleContactFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem', pt: 1 }}>Description</Typography>
                                        <TextField name="description" value={contactForm.description} onChange={handleContactFormChange} multiline rows={2} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.9rem' }}>Status</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: contactForm.status ? '#2e3a47' : '#e0e0e0', borderRadius: 4, px: 2, height: 32 }}>
                                            <Typography variant="body2" sx={{ color: contactForm.status ? '#00e5ff' : 'text.secondary', mr: 1, fontWeight: 600, fontSize: '0.75rem' }}>{contactForm.status ? 'Active' : 'Inactive'}</Typography>
                                            <Switch size="small" sx={{ mr: -1, '& .MuiSwitch-switchBase.Mui-checked': { color: '#00e5ff' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#00e5ff' } }} checked={contactForm.status} onChange={e => setContactForm(prev => ({ ...prev, status: e.target.checked }))} />
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Button variant="contained" onClick={handleAddContactForm} sx={{ bgcolor: '#4fc3f7', color: 'white', '&:hover': { bgcolor: '#29b6f6' }, px: 3, py: 0.8, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                                        Save
                                    </Button>
                                    <Button variant="contained" onClick={handleCancelContactForm} sx={{ bgcolor: '#ff5252', color: 'white', '&:hover': { bgcolor: '#ff1744' }, px: 3, py: 0.8, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Contacts List Section */}
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulletedIcon sx={{ width: 22, height: 22 }} />
                                <Typography variant="subtitle1" fontWeight="600">Multiple Contact List</Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                {(!formData.multipleContacts || formData.multipleContacts.length === 0) ? (
                                    <Typography variant="body2" color="text.secondary">Multiple contact Not Found</Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {formData.multipleContacts.map((contact, index) => (
                                            <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="600">{contact.name} <span style={{ fontWeight: 400, color: 'gray' }}>- {contact.designation}</span></Typography>
                                                    <Typography variant="body2" color="text.secondary">{contact.mobile} | {contact.email}</Typography>
                                                    {contact.description && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{contact.description}</Typography>}
                                                </Box>
                                                <Typography variant="caption" sx={{ bgcolor: contact.status ? '#e8f5e9' : '#ffebee', color: contact.status ? 'success.main' : 'error.main', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 600 }}>{contact.status ? 'Active' : 'Inactive'}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={2}>
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                        {/* Legal Document Form */}
                        <Paper elevation={0} sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>📄</span> Legal Document
                                </Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '130px', color: 'text.secondary', fontSize: '0.9rem' }}>Client</Typography>
                                        <Typography sx={{ flex: 1, color: 'text.primary', fontSize: '0.9rem' }}>{formData.name || 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ display: { xs: 'none', md: 'block' } }}></Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '130px', color: 'text.secondary', fontSize: '0.9rem' }}>Document name <span style={{ color: 'red' }}>*</span></Typography>
                                        <Autocomplete
                                            fullWidth
                                            size="small"
                                            options={['PAN', 'Aadhar', 'GST Certificate', 'Incorporation Certificate', 'Other']}
                                            value={legalForm.documentName || null}
                                            onChange={(_, newValue) => {
                                                setLegalForm(prev => ({ ...prev, documentName: newValue || '' }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Choose a Type..."
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                                        '& input::placeholder': { color: 'text.secondary', opacity: 1 }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '130px', color: 'text.secondary', fontSize: '0.9rem' }}>Description</Typography>
                                        <TextField name="description" value={legalForm.description} onChange={handleLegalFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography sx={{ width: '130px', color: 'text.secondary', fontSize: '0.9rem', flexShrink: 0 }}>Browse Document <span style={{ color: 'red' }}>*</span></Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 1.5, overflow: 'hidden', width: '100%' }}>
                                            <Button component="label" sx={{ bgcolor: '#f1f5f9', color: 'text.primary', borderRadius: 0, textTransform: 'none', px: 2, py: 0.5, borderRight: '1px solid #ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                Choose File
                                                <input type="file" hidden onChange={e => setLegalForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))} />
                                            </Button>
                                            <Typography variant="body2" color="text.secondary" sx={{ px: 2, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {legalForm.file ? legalForm.file.name : 'No file chosen'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Button variant="contained" onClick={handleAddLegalForm} sx={{ bgcolor: '#4fc3f7', color: 'white', '&:hover': { bgcolor: '#29b6f6' }, px: 3, py: 0.8, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                                        Save
                                    </Button>
                                    <Button variant="contained" onClick={handleCancelLegalForm} sx={{ bgcolor: '#ff5252', color: 'white', '&:hover': { bgcolor: '#ff1744' }, px: 3, py: 0.8, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600 }}>
                                        Cancel
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Legal Document List Section */}
                        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulletedIcon sx={{ width: 22, height: 22 }} />
                                <Typography variant="subtitle1" fontWeight="600">Legal Document List</Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                {(!formData.legalDocuments || formData.legalDocuments.length === 0) ? (
                                    <Typography variant="body2" color="text.secondary">Client Legal Detail Not Found</Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        {formData.legalDocuments.map((doc: { documentName: string; description?: string; fileName: string }, index: number) => (
                                            <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="600">{doc.documentName}</Typography>
                                                    <Typography variant="body2" color="text.secondary">File: {doc.fileName}</Typography>
                                                    {doc.description && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{doc.description}</Typography>}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleDownloadLegalDoc(doc.fileName)}
                                                        title="Download"
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveLegalForm(index)}
                                                        title="Delete"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={3}>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">Work Assignment Console (Coming Soon)</Typography>
                    </Box>
                </CustomTabPanel>

                <Divider sx={{ mt: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 3, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        variant="contained"
                        onClick={handleSaveClient}
                        disabled={createClientMutation.isPending || updateClientMutation.isPending}
                        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4, py: 1, textTransform: 'none', borderRadius: 2, fontWeight: 600, fontSize: '1.05rem' }}
                    >
                        {createClientMutation.isPending || updateClientMutation.isPending ? 'Saving...' : 'Save Client'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/admin/client/list')}
                        disabled={createClientMutation.isPending || updateClientMutation.isPending}
                        sx={{ px: 4, py: 1, textTransform: 'none', borderRadius: 2, color: 'text.secondary', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' }, fontWeight: 600, fontSize: '1.05rem' }}
                    >
                        Cancel
                    </Button>
                </Box>
            </Paper>

            {/* Modals */}
            <MasterModal
                open={itStatusModalOpen}
                onClose={() => setItStatusModalOpen(false)}
                title="IT Status"
                itemName="It Status"
                onSave={(data) => itStatusMutation.mutate(data)}
                isSaving={itStatusMutation.isPending}
                dataList={itStatuses}
                showSnackbar={showSnackbar}
            />
            <MasterModal
                open={subMasterModalOpen}
                onClose={() => setSubMasterModalOpen(false)}
                title="Sub Master"
                itemName="Sub Master"
                onSave={(data) => subMasterMutation.mutate(data)}
                isSaving={subMasterMutation.isPending}
                dataList={subMasters}
                showSnackbar={showSnackbar}
            />
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};
