import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '../../../services/staffService';
import settingsService from '../../../services/settingsService';
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
    IconButton,
    Divider,
    Checkbox,
    Dialog,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Snackbar,
    Alert,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Stack,
    Chip,
    alpha
} from '@mui/material';
import {
    GridView as GridViewIcon,
    Image as ImageIcon,
    ContactEmergency as EmergencyIcon,
    Work as WorkIcon,
    Login as LoginIcon,
    PhotoCamera as PhotoCameraIcon,
    MoreHoriz as MoreHorizIcon,
    FormatListBulleted as FormatListBulletedIcon,
    AccountBalance as AccountBalanceIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    GetApp as GetAppIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';

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
            id={`employee-tabpanel-${index}`}
            aria-labelledby={`employee-tab-${index}`}
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
    <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: '#f5f7fa', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {React.cloneElement(icon, { sx: { width: 20, height: 20, color: 'text.secondary' } })}
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            {children}
        </Box>
    </Paper>
);

const initialFormData = {
    firstName: '',
    lastName: '',
    employeeCode: '',
    address: '',
    country: '',
    state: '',
    city: '',
    postalCode: '',
    mobileNumber: '',
    phone: '',
    email: '',
    birthDate: '',

    designation: '',
    joiningDate: '',
    monthlySalary: '',
    ratePerHours: '',
    leavingDate: '',
    reference: '',
    description: '',
    status: true,
    role: 'STAFF',

    emergencyFirstName: '',
    emergencyLastName: '',
    emergencyRelationship: '',
    emergencyPhone: '',

    username: '',
    password: '',
    confirmPassword: '',

    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: '',
    field6: '',
    field7: '',

    // Other Details
    pfNumber: '',
    esiNumber: '',
    aadharNumber: '',
    drivingLicenceNo: '',

    passport: false,
    passportNo: '',
    passportAuthority: '',
    passportDateFrom: '',
    passportDateTo: '',

    visa: false,
    visaNo: '',
    visaAuthority: '',
    visaDateFrom: '',
    visaDateTo: '',

    eid: false,
    eidNo: '',
    eidAuthority: '',
    eidDateFrom: '',
    eidDateTo: '',

    bankName: '',
    bankBranch: '',
    accountNo: '',
    accountHolderName: '',
    ifscCode: '',
    bankAddress: '',
};

export const EmployeeMaster: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
    const isEditMode = !!id;
    const [tabValue, setTabValue] = useState(0);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const [openDesignationDialog, setOpenDesignationDialog] = useState(false);
    const [designations, setDesignations] = useState([
        { id: 1, name: 'Staff', description: '', status: true }
    ]);
    const [editingDesignationId, setEditingDesignationId] = useState<number | null>(null);
    const [openFieldMasterDialog, setOpenFieldMasterDialog] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [extraFieldLabels, setExtraFieldLabels] = useState({
        field1: 'Field 1',
        field2: 'Field 2',
        field3: 'Field 3',
        field4: 'Field 4',
        field5: 'Field 5',
        field6: 'Field 6',
        field7: 'Field 7'
    });
    const [tempFieldLabels, setTempFieldLabels] = useState({ ...extraFieldLabels });
    const [designationForm, setDesignationForm] = useState({
        name: '',
        description: '',
        status: true
    });

    interface EmployeeDocument {
        id?: number;
        _id?: string;
        documentType: string;
        date: string;
        documentFormat: string;
        fileLocation: string;
        fileLabel: string;
        description: string;
        returnable: boolean;
        fileName?: string;
        driveFileId?: string;
        driveWebViewLink?: string;
    }

    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [editingDocumentId, setEditingDocumentId] = useState<string | number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [documentForm, setDocumentForm] = useState<EmployeeDocument>({
        documentType: '',
        date: new Date().toISOString().split('T')[0],
        documentFormat: 'Original Hard Copy',
        fileLocation: '',
        fileLabel: '',
        description: '',
        returnable: true
    });

    const [formData, setFormData] = useState(initialFormData);

    const queryClient = useQueryClient();

    const { data: staffData } = useQuery({
        queryKey: ['staff', id],
        queryFn: () => staffService.getStaffById(id!),
        enabled: isEditMode
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await settingsService.getSettings();
                if (settings.employeeExtraFields) {
                    setExtraFieldLabels(settings.employeeExtraFields);
                    setTempFieldLabels(settings.employeeExtraFields);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (staffData && isEditMode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => ({
                ...prev,
                ...staffData,
                firstName: staffData.firstName || staffData.name?.split(' ')[0] || '',
                lastName: staffData.lastName || staffData.name?.split(' ').slice(1).join(' ') || '',
                password: '',
                confirmPassword: ''
            }));

            // Only set documents if they actually exist and changed
            if (staffData.documents && staffData.documents.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setDocuments(staffData.documents as any);
            }
            
            if (staffData.role) {
                setFormData(prev => ({ ...prev, role: staffData.role }));
            }
        } else if (!isEditMode) {
            setFormData(initialFormData);
            setDocuments([]);
            setTabValue(0);
        }
    }, [staffData, isEditMode]);

    const saveMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (data: any): Promise<any> => isEditMode ? staffService.updateStaff(id!, data) : staffService.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            showSnackbar(`Employee data ${isEditMode ? 'updated' : 'saved'} successfully!`, 'success');
            navigate('/admin/employee/list');
        },
        onError: (error: Error | unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showSnackbar((error as any)?.response?.data?.message || 'Error saving employee', 'error');
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: () => staffService.resetPassword(id!),
        onSuccess: () => {
            showSnackbar(`Password reset successfully! Login credentials sent to ${formData.email}.`, 'success');
        },
        onError: (error: Error | unknown) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            showSnackbar((error as any).response?.data?.message || 'Error resetting password', 'error');
        }
    });

    const handleResetPassword = () => {
        if (window.confirm('Are you sure you want to reset this employee\'s password? A new password will be generated and emailed to them.')) {
            resetPasswordMutation.mutate();
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSaveDocument = async () => {
        if (!documentForm.documentType) {
            showSnackbar('Please select a document type', 'error');
            return;
        }

        let finalDoc = { ...documentForm };

        if (selectedFile) {
            setIsUploading(true);
            try {
                const employeeName = `${formData.firstName} ${formData.lastName}`.trim() || 'Staff';
                const uploadRes = await staffService.uploadDocument(selectedFile, employeeName);
                finalDoc = {
                    ...finalDoc,
                    fileName: uploadRes.fileName,
                    driveFileId: uploadRes.driveFileId,
                    driveWebViewLink: uploadRes.driveWebViewLink,
                    documentFormat: 'Soft Copy'
                };
                setSelectedFile(null);
            } catch (error: Error | unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                showSnackbar((error as any)?.response?.data?.message || 'Error uploading file to Drive', 'error');
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        if (editingDocumentId) {
            setDocuments(prev => prev.map(doc => {
                const docUniqueId = doc._id || doc.id;
                return docUniqueId === editingDocumentId ? { ...doc, ...finalDoc } : doc;
            }));
            showSnackbar('Document updated successfully', 'success');
            setEditingDocumentId(null);
        } else {
            setDocuments(prev => [
                ...prev,
                { id: Date.now(), ...finalDoc }
            ]);
            showSnackbar('Document added successfully', 'success');
        }

        setDocumentForm({
            documentType: '',
            date: new Date().toISOString().split('T')[0],
            documentFormat: 'Original Hard Copy',
            fileLocation: '',
            fileLabel: '',
            description: '',
            returnable: true
        });
    };

    const handleEditDocument = (doc: EmployeeDocument) => {
        setDocumentForm({
            ...doc
        });
        setSelectedFile(null);
        setEditingDocumentId(doc._id || doc.id || null);
    };

    const handleDeleteDocument = async (uniqueId: string | number) => {
        const docToDelete = documents.find(doc => (doc._id || doc.id) === uniqueId);

        if (docToDelete?.driveFileId) {
            try {
                await staffService.deleteDocument(docToDelete.driveFileId);
                showSnackbar('File deleted from Google Drive', 'info');
            } catch (error) {
                console.error('Error deleting from Drive:', error);
                showSnackbar('Warning: Could not delete file from Google Drive', 'error');
            }
        }

        setDocuments(prev => prev.filter(doc => (doc._id || doc.id) !== uniqueId));
        showSnackbar('Document entry removed', 'info');
    };

    const handleSaveDesignation = () => {
        if (!designationForm.name.trim()) return;

        if (editingDesignationId) {
            setDesignations(prev => prev.map(d =>
                d.id === editingDesignationId ? { ...d, ...designationForm } : d
            ));
            setEditingDesignationId(null);
        } else {
            setDesignations(prev => [
                ...prev,
                { id: Date.now(), ...designationForm }
            ]);
        }

        setDesignationForm({ name: '', description: '', status: true });
    };

    const handleEditDesignation = (id: number) => {
        const designation = designations.find(d => d.id === id);
        if (designation) {
            setDesignationForm({
                name: designation.name,
                description: designation.description,
                status: designation.status
            });
            setEditingDesignationId(id);
        }
    };

    const handleDeleteDesignation = (id: number) => {
        setDesignations(prev => prev.filter(d => d.id !== id));
        if (editingDesignationId === id) {
            setDesignationForm({ name: '', description: '', status: true });
            setEditingDesignationId(null);
        }
    };

    const handleAddNewDesignation = () => {
        setDesignationForm({ name: '', description: '', status: true });
        setEditingDesignationId(null);
    };

    const handleSaveFieldLabels = async () => {
        try {
            await settingsService.updateSettings({
                employeeExtraFields: tempFieldLabels
            });
            setExtraFieldLabels(tempFieldLabels);
            setOpenFieldMasterDialog(false);
            showSnackbar('Field labels updated successfully');
        } catch (error) {
            console.error('Error saving field labels:', error);
            showSnackbar('Error updating field labels', 'error');
        }
    };

    const handleSaveEmployee = () => {
        // Basic validation for the first tab
        const requiredFields = ['firstName', 'lastName', 'address', 'country', 'state', 'city', 'email'];
        const missingFields = requiredFields.filter(f => !formData[f as keyof typeof formData]);

        if (missingFields.length > 0) {
            showSnackbar('Please fill in all required fields marked with *', 'error');
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            showSnackbar('Passwords do not match!', 'error');
            return;
        }

        const payload = {
            ...formData,
            documents
        };

        saveMutation.mutate(payload);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: { xs: 2.5, sm: 3 }, py: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                    <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, letterSpacing: '-0.01em' }}>{isEditMode ? 'Edit Employee' : 'Employee Master'}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
                        <Button variant="contained" size="small" fullWidth={isMobile} onClick={() => navigate('/admin/employee/master')} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, py: 0.8, boxShadow: 'none', fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 600, flex: { xs: 1, sm: 'none' }, minWidth: isTablet ? '100px' : 'fit-content' }}>
                            Add New
                        </Button>
                        <Button variant="contained" size="small" fullWidth={isMobile} onClick={() => setOpenDesignationDialog(true)} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, py: 0.8, boxShadow: 'none', fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 600, flex: { xs: 1, sm: 'none' }, minWidth: isTablet ? '100px' : 'fit-content' }}>
                            Designation
                        </Button>
                        <Button variant="contained" size="small" fullWidth={isMobile} onClick={() => navigate('/admin/employee/list')} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, py: 0.8, boxShadow: 'none', fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 600, flex: { xs: 1, sm: 'none' }, minWidth: isTablet ? '100px' : 'fit-content' }}>
                            List
                        </Button>
                        <Button variant="contained" size="small" fullWidth={isMobile} onClick={() => setOpenFieldMasterDialog(true)} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, py: 0.8, boxShadow: 'none', fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 600, flex: { xs: 1, sm: 'none' }, minWidth: isTablet ? '100px' : 'fit-content' }}>
                            Field Master
                        </Button>
                    </Box>
                </Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff', px: 1 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary', minHeight: 48 },
                            '& .Mui-selected': { color: 'primary.main' },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                        }}
                    >
                        <Tab label="Information" />
                        <Tab label="Document" />
                        <Tab label="Other Detail" />
                        <Tab label="Rule" />
                    </Tabs>
                </Box>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', overflow: 'hidden', mb: 3 }}>
                <CustomTabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, px: 3, pb: 0, pt: 2 }}>

                        {/* LEFT COLUMN */}
                        <Box sx={{ flex: 15 }}>
                            <Section title="Basic Form" icon={<GridViewIcon />}>
                                <FormRow label="First Name" required>
                                    <TextField name="firstName" value={formData.firstName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Last Name" required>
                                    <TextField name="lastName" value={formData.lastName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Employee ID / Code">
                                    <TextField name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} placeholder="System ID will be used if blank" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value as string }))}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value as string }))}
                                        sx={{ borderRadius: 1.5, color: formData.state ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a State...</MenuItem>
                                        <MenuItem value="Gujarat">Gujarat</MenuItem>
                                        <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="City" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value as string }))}
                                        sx={{ borderRadius: 1.5, color: formData.city ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a City...</MenuItem>
                                        <MenuItem value="Surat">Surat</MenuItem>
                                        <MenuItem value="Ahmedabad">Ahmedabad</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="Postal Code" required>
                                    <TextField name="postalCode" value={formData.postalCode} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Mobile Number" required>
                                    <TextField name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Phone">
                                    <TextField name="phone" value={formData.phone} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Email" required helperText='Separate multiple Email with "," (Comma).'>
                                    <TextField name="email" value={formData.email} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Birth Date" required>
                                    <TextField name="birthDate" value={formData.birthDate} onChange={handleInputChange} type="date" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                </FormRow>
                            </Section>

                            <Section title="Joining Information" icon={<WorkIcon />}>
                                <FormRow label="Designation" required>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        name="designation"
                                        value={formData.designation}
                                        onChange={(e) => {
                                            const val = e.target.value as string;
                                            const roleMap: Record<string, string> = {
                                                'Admin': 'ADMIN',
                                                'Manager': 'MANAGER',
                                                'Staff': 'STAFF',
                                                'Intern': 'INTERN'
                                            };
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                designation: val,
                                                role: roleMap[val] || 'STAFF'
                                            }));
                                        }}
                                        sx={{ borderRadius: 1.5, color: formData.designation ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a Designation</MenuItem>
                                        <MenuItem value="Admin">Admin</MenuItem>
                                        <MenuItem value="Manager">Manager</MenuItem>
                                        <MenuItem value="Staff">Staff</MenuItem>
                                        <MenuItem value="Intern">Intern</MenuItem>
                                    </Select>
                                </FormRow>
                                <FormRow label="Joining Date" required>
                                    <TextField name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} type="date" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                </FormRow>
                                <FormRow label="Monthly Salary">
                                    <TextField name="monthlySalary" value={formData.monthlySalary} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Rate Per Hours">
                                    <TextField name="ratePerHours" value={formData.ratePerHours} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Leaving Date">
                                    <TextField name="leavingDate" value={formData.leavingDate} onChange={handleInputChange} type="date" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} InputLabelProps={{ shrink: true }} />
                                </FormRow>
                                <FormRow label="Reference">
                                    <TextField name="reference" value={formData.reference} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Description">
                                    <TextField name="description" value={formData.description} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ width: 150, height: 150, border: '1px solid #e2e8f0', borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f8fafc', overflow: 'hidden' }}>
                                        <PhotoCameraIcon sx={{ color: '#cbd5e1', fontSize: 40 }} />
                                    </Box>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                                            <Button component="label" size="small" sx={{ bgcolor: '#f1f5f9', color: '#333', borderRadius: 0, textTransform: 'none', px: 2, borderRight: '1px solid #ccc', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                Choose File
                                                <input type="file" hidden accept="image/jpeg,image/png" />
                                            </Button>
                                            <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', flex: 1 }}>No file chosen</Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ mt: 1, bgcolor: '#fee2e2', color: '#ef4444', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' }}>
                                            <strong style={{ marginRight: '4px' }}>NOTE!</strong> JPEG or PNG Image Format only
                                        </Typography>
                                    </Box>
                                </Box>
                            </Section>

                            <Section title="Emergency Contact Detail" icon={<EmergencyIcon />}>
                                <FormRow label="First Name">
                                    <TextField name="emergencyFirstName" value={formData.emergencyFirstName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Last Name">
                                    <TextField name="emergencyLastName" value={formData.emergencyLastName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Relationship">
                                    <TextField name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Phone">
                                    <TextField name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                            </Section>

                            <Section title="Login Information" icon={<LoginIcon />}>
                                <FormRow label="Username" required>
                                    <TextField name="username" value={formData.username} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Password" required>
                                    <TextField
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </FormRow>
                                <FormRow label="Confirm Password" required={!isEditMode}>
                                    <TextField
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        fullWidth
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                        error={formData.password !== formData.confirmPassword && !!formData.confirmPassword}
                                        helperText={formData.password !== formData.confirmPassword && !!formData.confirmPassword ? 'Passwords do not match' : ''}
                                    />
                                </FormRow>

                                {isEditMode && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            size="small"
                                            onClick={handleResetPassword}
                                            disabled={resetPasswordMutation.isPending}
                                            sx={{ textTransform: 'none', borderRadius: 1.5 }}
                                        >
                                            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password & Send Email'}
                                        </Button>
                                    </Box>
                                )}
                            </Section>

                            {Object.values(extraFieldLabels).some(label => !!label.trim()) && (
                                <Section title="Extra Fields" icon={<MoreHorizIcon />}>
                                    {([1, 2, 3, 4, 5, 6, 7] as const).map(num => {
                                        const label = extraFieldLabels[`field${num}` as keyof typeof extraFieldLabels];
                                        if (!label || !label.trim()) return null;
                                        return (
                                            <FormRow key={num} label={label}>
                                                <TextField name={`field${num}`} value={formData[`field${num}` as keyof typeof formData] as string} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                            </FormRow>
                                        );
                                    })}
                                </Section>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 2, mt: 3, pb: 3, px: isMobile ? 3 : 0 }}>
                        <Button variant="contained" fullWidth={isMobile} onClick={handleSaveEmployee} sx={{ px: 4, bgcolor: '#667eea', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#5a6fd6' }, height: 44 }}>
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                        <Button variant="contained" fullWidth={isMobile} onClick={() => navigate('/admin/employee/list')} sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' }, height: 44 }}>
                            Cancel
                        </Button>
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ px: 3, pb: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                            {/* Row 1: Employee */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Employee">
                                        <Typography sx={{ color: 'text.primary', fontSize: '0.85rem', pt: { xs: 0, sm: 0.8 } }}>
                                            {formData.firstName || 'Employee Name'} {formData.lastName || ''} - {isEditMode ? (formData.employeeCode || id) : 'New'}
                                        </Typography>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }} />
                            </Box>

                            <Divider sx={{ mb: 1, mt: -1 }} />

                            {/* Row 2: Document Type & Date */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Document Type" required>
                                        <Select
                                            fullWidth
                                            size="small"
                                            displayEmpty
                                            value={documentForm.documentType}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, documentType: e.target.value }))}
                                            sx={{ borderRadius: 1.5, bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}
                                        >
                                            <MenuItem value="" disabled>Choose a Document...</MenuItem>
                                            <MenuItem value="PAN Card">PAN Card</MenuItem>
                                            <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                                            <MenuItem value="Voter ID">Voter ID Card</MenuItem>
                                            <MenuItem value="Driving License">Driving License</MenuItem>
                                            <MenuItem value="Passport">Passport</MenuItem>
                                            <MenuItem value="Bank Passbook">Bank Passbook/Statement</MenuItem>
                                            <MenuItem value="10th Marksheet">10th Marksheet</MenuItem>
                                            <MenuItem value="12th Marksheet">12th Marksheet</MenuItem>
                                            <MenuItem value="Degree Certificate">Degree Certificate</MenuItem>
                                            <MenuItem value="Experience Letter">Experience Letter</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Date" required>
                                        <TextField
                                            type="date"
                                            value={documentForm.date}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, date: e.target.value }))}
                                            fullWidth size="small"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                        />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 3: Document Formate */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Document Formate" required>
                                        <Select
                                            fullWidth
                                            size="small"
                                            displayEmpty
                                            value={documentForm.documentFormat}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, documentFormat: e.target.value }))}
                                            sx={{ borderRadius: 1.5, bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}
                                        >
                                            <MenuItem value="Original Hard Copy">Original Hard Copy</MenuItem>
                                            <MenuItem value="Xerox Hard Copy">Xerox Hard Copy</MenuItem>
                                            <MenuItem value="Soft Copy">Soft Copy</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Upload to Drive">
                                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#fff' }}>
                                            <Button component="label" size="small" sx={{ bgcolor: '#f1f5f9', color: '#333', borderRadius: 0, textTransform: 'none', px: 2, borderRight: '1px solid #ccc', fontSize: '0.8rem', whiteSpace: 'nowrap', height: '36px' }}>
                                                {documentForm.driveFileId ? 'Change File' : 'Choose File'}
                                                <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                            </Button>
                                            <Typography variant="caption" sx={{ px: 2, color: selectedFile ? 'text.primary' : 'text.secondary', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {selectedFile ? selectedFile.name : (documentForm.fileName || 'No file chosen')}
                                            </Typography>
                                            {selectedFile && (
                                                <IconButton size="small" onClick={() => setSelectedFile(null)} sx={{ mr: 0.5 }}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                        {documentForm.driveWebViewLink && !selectedFile && (
                                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                                <a href={documentForm.driveWebViewLink} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                                                    View Current File
                                                </a>
                                            </Typography>
                                        )}
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 4: File Location & File Label */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="File Location" required>
                                        <Select
                                            fullWidth
                                            size="small"
                                            displayEmpty
                                            value={documentForm.fileLocation}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, fileLocation: e.target.value }))}
                                            sx={{ borderRadius: 1.5, color: documentForm.fileLocation ? 'inherit' : '#aaa', bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}
                                        >
                                            <MenuItem value="" disabled>Choose a File Location...</MenuItem>
                                            <MenuItem value="Office Cabin 1">Office Cabin 1</MenuItem>
                                            <MenuItem value="Office Cabin 2">Office Cabin 2</MenuItem>
                                            <MenuItem value="Google Drive">Google Drive</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="File Label">
                                        <Select
                                            fullWidth
                                            size="small"
                                            displayEmpty
                                            value={documentForm.fileLabel}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, fileLabel: e.target.value }))}
                                            sx={{ borderRadius: 1.5, color: documentForm.fileLabel ? 'inherit' : '#aaa', bgcolor: '#f8fafc', '& .MuiSelect-select': { py: 1 } }}
                                        >
                                            <MenuItem value="" disabled>Select an Option</MenuItem>
                                            <MenuItem value="A">A</MenuItem>
                                            <MenuItem value="B">B</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 5: Description & Returnable */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Description">
                                        <TextField
                                            fullWidth multiline rows={2}
                                            size="small"
                                            value={documentForm.description}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, description: e.target.value }))}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }}
                                        />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                                        <Typography sx={{ width: { xs: '100%', sm: '160px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>
                                            Returnable
                                        </Typography>
                                        <Switch
                                            size="small"
                                            checked={documentForm.returnable}
                                            onChange={(e) => setDocumentForm(prev => ({ ...prev, returnable: e.target.checked }))}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' }
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleSaveDocument}
                                disabled={isUploading}
                                fullWidth={isMobile}
                                sx={{ px: 4, bgcolor: '#667eea', borderRadius: 1, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#5a6fd6' } }}
                            >
                                {isUploading ? 'Uploading...' : (editingDocumentId ? 'Update Document' : 'Add Document')}
                            </Button>
                            <Button 
                                variant="contained" 
                                fullWidth={isMobile}
                                onClick={() => {
                                    setDocumentForm({ documentType: '', date: new Date().toISOString().split('T')[0], documentFormat: 'Original Hard Copy', fileLocation: '', fileLabel: '', description: '', returnable: true });
                                    setSelectedFile(null);
                                    setEditingDocumentId(null);
                                }} 
                                sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}
                            >
                                Cancel
                            </Button>
                        </Box>

                        {/* Document List Table */}
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ bgcolor: '#667eea', color: 'white', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '4px 4px 0 0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FormatListBulletedIcon fontSize="small" />
                                    <Typography variant="body2" fontWeight={600}>Document List</Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                                    <GetAppIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            {documents.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                    <Typography variant="body2" color="text.secondary">No documents added yet</Typography>
                                </Box>
                            ) : isMobile ? (
                                <Stack spacing={2} sx={{ p: 2, border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                    {documents.map((doc) => (
                                        <Paper key={doc.id || doc._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{doc.documentType}</Typography>
                                                <Chip label={doc.documentFormat} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Date</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{doc.date}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{doc.fileLocation}</Typography>
                                                </Box>
                                            </Box>
                                            <Divider sx={{ mb: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {doc.driveWebViewLink && (
                                                        <Button size="small" variant="outlined" component="a" href={doc.driveWebViewLink} target="_blank" startIcon={<Visibility sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', height: 28, fontSize: '0.75rem' }}>
                                                            View
                                                        </Button>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton size="small" onClick={() => handleEditDocument(doc)} sx={{ color: '#667eea', bgcolor: alpha('#667eea', 0.1) }}>
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteDocument(doc._id || doc.id!)} sx={{ color: '#ff6c60', bgcolor: alpha('#ff6c60', 0.1) }}>
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <TableContainer sx={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Document Type</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Date</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Format</TableCell>
                                                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Location</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {documents.map((doc) => (
                                                <TableRow key={doc.id || doc._id} sx={{ '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>{doc.documentType}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>{doc.date}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>{doc.documentFormat}</TableCell>
                                                    <TableCell sx={{ fontSize: '0.85rem' }}>{doc.fileLocation}</TableCell>
                                                    <TableCell align="center">
                                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                            {doc.driveWebViewLink && (
                                                                <IconButton size="small" component="a" href={doc.driveWebViewLink} target="_blank" sx={{ color: '#4caf50', p: 0.5 }}>
                                                                    <Visibility fontSize="inherit" />
                                                                </IconButton>
                                                            )}
                                                            <IconButton size="small" onClick={() => handleEditDocument(doc)} sx={{ color: '#667eea', p: 0.5 }}>
                                                                <EditIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={() => handleDeleteDocument(doc._id || doc.id!)} sx={{ color: '#ff6c60', p: 0.5 }}>
                                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    </Box>

                    {/* Tab Footer Actions */}
                    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 2, mt: 3, pb: 3, px: isMobile ? 3 : 0 }}>
                        <Button variant="contained" fullWidth={isMobile} onClick={handleSaveEmployee} sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', height: 44 }}>
                            {isEditMode ? 'Update' : 'Save'}
                        </Button>
                        <Button variant="contained" fullWidth={isMobile} onClick={() => navigate('/admin/employee/list')} sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' }, height: 44 }}>
                            Cancel
                        </Button>
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={2}>
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Row 1: Employee */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Employee">
                                        <Typography sx={{ color: 'text.primary', fontSize: '0.85rem', pt: { xs: 0, sm: 0.8 }, minHeight: '24px' }}>
                                        </Typography>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }} />
                            </Box>

                            {/* Row 2 */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="PF Number">
                                        <TextField fullWidth size="small" name="pfNumber" value={formData.pfNumber || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="ESI Number">
                                        <TextField fullWidth size="small" name="esiNumber" value={formData.esiNumber || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 3 */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Aadhar Number">
                                        <TextField fullWidth size="small" name="aadharNumber" value={formData.aadharNumber || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Driving Licence No">
                                        <TextField fullWidth size="small" name="drivingLicenceNo" value={formData.drivingLicenceNo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 4: Passport */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Checkbox size="small" checked={!!formData.passport} onChange={(e) => handleSwitchChange('passport', e.target.checked)} sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" name="passportNo" value={formData.passportNo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 5: Passport Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport Authority">
                                        <TextField fullWidth size="small" name="passportAuthority" value={formData.passportAuthority || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField type="date" fullWidth size="small" name="passportDateFrom" value={formData.passportDateFrom || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField type="date" fullWidth size="small" name="passportDateTo" value={formData.passportDateTo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 6: Visa */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Visa">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Checkbox size="small" checked={!!formData.visa} onChange={(e) => handleSwitchChange('visa', e.target.checked)} sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" name="visaNo" value={formData.visaNo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 7: Visa Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Visa Authority">
                                        <TextField fullWidth size="small" name="visaAuthority" value={formData.visaAuthority || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Visa Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField type="date" fullWidth size="small" name="visaDateFrom" value={formData.visaDateFrom || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField type="date" fullWidth size="small" name="visaDateTo" value={formData.visaDateTo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 8: EID */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="EID">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Checkbox size="small" checked={!!formData.eid} onChange={(e) => handleSwitchChange('eid', e.target.checked)} sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" name="eidNo" value={formData.eidNo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 9: EID Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="EID Authority">
                                        <TextField fullWidth size="small" name="eidAuthority" value={formData.eidAuthority || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="EID Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField type="date" fullWidth size="small" name="eidDateFrom" value={formData.eidDateFrom || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField type="date" fullWidth size="small" name="eidDateTo" value={formData.eidDateTo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Bank Detail Section */}
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <AccountBalanceIcon sx={{ color: '#4b5563' }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151', fontSize: '1.05rem' }}>Bank Detail</Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Bank Row 1 */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank Name">
                                                <TextField fullWidth size="small" name="bankName" value={formData.bankName || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank Branch">
                                                <TextField fullWidth size="small" name="bankBranch" value={formData.bankBranch || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                    </Box>

                                    {/* Bank Row 2 */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Account Holder Name" helperText=""> {/* Just to keep the height matched if needed, but not showing it here */}
                                                <TextField fullWidth size="small" name="accountHolderName" value={formData.accountHolderName || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank A/C No">
                                                <TextField fullWidth size="small" name="accountNo" value={formData.accountNo || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                    </Box>

                                    {/* Bank Row 3 */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank IFS Code">
                                                <TextField fullWidth size="small" name="ifscCode" value={formData.ifscCode || ''} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 2, mt: 4, pb: 2, px: isMobile ? 3 : 0 }}>
                            <Button variant="contained" fullWidth={isMobile} onClick={handleSaveEmployee} sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', height: 44 }}>
                                {isEditMode ? 'Update' : 'Save'}
                            </Button>
                            <Button variant="contained" fullWidth={isMobile} onClick={() => navigate('/admin/employee/list')} sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' }, height: 44 }}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={3}>
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                            {/* Row 1: Employee */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Employee">
                                        <Typography sx={{ color: 'text.primary', fontSize: '0.85rem', pt: { xs: 0, sm: 0.8 } }}>
                                            meet sheladiya - 1
                                        </Typography>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            <Divider sx={{ mb: 1, mt: -1 }} />

                            {/* Row 2: Checkbox */}
                            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
                                <Typography sx={{ width: { xs: '100%', sm: '300px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
                                    Start Single Task Approval Allow Popup Access
                                </Typography>
                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: 28, height: 28, bgcolor: '#667eea', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)' }}>
                                        <Box component="svg" viewBox="0 0 24 24" fill="white" sx={{ width: 18, height: 18 }}>
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" sx={{ ml: 1.5, color: '#667eea', fontWeight: 700 }}>Enabled</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ mt: 1 }} />

                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 2, mt: 4, pb: 2, px: isMobile ? 3 : 0 }}>
                            <Button variant="contained" fullWidth={isMobile} onClick={handleSaveEmployee} sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', height: 44 }}>
                                {isEditMode ? 'Update' : 'Save'}
                            </Button>
                            <Button variant="contained" fullWidth={isMobile} onClick={() => navigate('/admin/employee/list')} sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1.5, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' }, height: 44 }}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </CustomTabPanel>
            </Paper>

            {/* Add Designation Dialog */}
            <Dialog
                open={openDesignationDialog}
                onClose={() => setOpenDesignationDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box sx={{ bgcolor: '#667eea', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {editingDesignationId ? 'Edit Designation' : 'Add Designation'}
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenDesignationDialog(false)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.85rem', pt: 1 }}>
                                Designation <span style={{ color: 'red' }}>*</span>
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                value={designationForm.name}
                                onChange={(e) => setDesignationForm(prev => ({ ...prev, name: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.85rem', pt: 1 }}>
                                Description
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                size="small"
                                value={designationForm.description}
                                onChange={(e) => setDesignationForm(prev => ({ ...prev, description: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography sx={{ width: '120px', color: 'text.secondary', fontSize: '0.85rem' }}>
                                Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: designationForm.status ? '#f5f7ff' : '#ffebee', borderRadius: 4, px: 2, py: 0.5 }}>
                                <Typography variant="body2" sx={{ color: designationForm.status ? '#667eea' : 'error.main', mr: 1, fontWeight: 600, fontSize: '0.8rem' }}>
                                    {designationForm.status ? 'Active' : 'Inactive'}
                                </Typography>
                                <Switch
                                    size="small"
                                    checked={designationForm.status}
                                    onChange={(e) => setDesignationForm(prev => ({ ...prev, status: e.target.checked }))}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' }
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Button variant="contained" onClick={handleSaveDesignation} sx={{ bgcolor: '#667eea', color: 'white', textTransform: 'none', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#5a6fd6' } }}>
                                {editingDesignationId ? 'Update' : 'Save'}
                            </Button>
                            <Button variant="contained" sx={{ bgcolor: '#ff6c60', color: 'white', textTransform: 'none', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#e56156' } }} onClick={() => { setOpenDesignationDialog(false); handleAddNewDesignation(); }}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>

                    {/* List Section */}
                    <Box>
                        <Box sx={{ bgcolor: '#667eea', color: 'white', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FormatListBulletedIcon fontSize="small" />
                                <Typography variant="body2" fontWeight={600}>List</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Button size="small" onClick={handleAddNewDesignation} sx={{ color: 'white', textTransform: 'none', fontSize: '0.8rem', minWidth: 'auto', p: 0 }}>
                                    ADD NEW
                                </Button>
                                <IconButton size="small" sx={{ bgcolor: 'white', color: '#667eea', p: 0.3, borderRadius: 1, '&:hover': { bgcolor: '#f1f5f9' } }}>
                                    <GetAppIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        </Box>

                        <TableContainer sx={{ maxHeight: 200 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Designation Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Description</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: '#64748b', py: 1.5, borderBottom: '1px solid #e2e8f0' }}>Status</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#64748b', py: 1.5, borderBottom: '1px solid #e2e8f0' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {designations.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell sx={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{row.name}</TableCell>
                                            <TableCell sx={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{row.description}</TableCell>
                                            <TableCell sx={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                                                {row.status ? 'Active' : 'Inactive'}
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderBottom: '1px solid #e2e8f0', p: 0.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                                                    <IconButton size="small" onClick={() => handleEditDesignation(row.id)} sx={{ bgcolor: '#667eea', color: 'white', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#5568d3' } }}>
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteDesignation(row.id)} sx={{ bgcolor: '#ff6c60', color: 'white', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#e56156' } }}>
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Employee Extra Fields Dialog */}
            <Dialog
                open={openFieldMasterDialog}
                onClose={() => setOpenFieldMasterDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}
            >
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Employee Extra Fields
                    </Typography>
                    <IconButton size="small" onClick={() => setOpenFieldMasterDialog(false)} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <DialogContent sx={{ p: 2 }}>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', mb: 3 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: '#64748b', width: '30%' }}>Fields</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Label Name</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                    <TableRow key={num}>
                                        <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>Field {num}</TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={tempFieldLabels[`field${num}` as keyof typeof tempFieldLabels]}
                                                onChange={(e) => setTempFieldLabels(prev => ({ ...prev, [`field${num}`]: e.target.value }))}
                                                placeholder={`Enter label for Field ${num}`}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveFieldLabels}
                            sx={{ bgcolor: '#667eea', color: 'white', textTransform: 'none', px: 4, boxShadow: 'none', '&:hover': { bgcolor: '#5a6fd6' } }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setOpenFieldMasterDialog(false)}
                            sx={{ bgcolor: '#ff6c60', color: 'white', textTransform: 'none', px: 4, boxShadow: 'none', '&:hover': { bgcolor: '#e56156' } }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
