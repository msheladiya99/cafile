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
    IconButton,
    Divider,
    Checkbox,
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

export const EmployeeMaster: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const [formData, setFormData] = useState({
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
    });

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name as string]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header Section */}
            <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" fontWeight="600">Employee Master</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Add New
                        </Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
                            Designation
                        </Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none' }}>
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
                            '& .Mui-selected': { color: '#667eea', bgcolor: 'rgba(102, 126, 234, 0.08)' },
                            '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: '#667eea' }
                        }}
                    >
                        <Tab label="Employee Information" sx={{ bgcolor: tabValue === 0 ? '#667eea !important' : 'inherit', color: tabValue === 0 ? 'white !important' : 'inherit' }} />
                        <Tab label="Employee Document" />
                        <Tab label="Employee Other Detail" />
                        <Tab label="Employee Rule" />
                    </Tabs>
                </Box>

                <CustomTabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, px: 3, pb: 0 }}>

                        {/* LEFT COLUMN */}
                        <Box sx={{ flex: 15 }}>
                            <Section title="Basic Form" icon={<GridViewIcon />}>
                                <FormRow label="First Name" required>
                                    <TextField name="firstName" value={formData.firstName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Last Name" required>
                                    <TextField name="lastName" value={formData.lastName} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Employee Code">
                                    <TextField name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value as string }))}
                                        sx={{ borderRadius: 1.5, color: formData.designation ? 'text.primary' : 'text.secondary' }}
                                    >
                                        <MenuItem value="" disabled>Choose a Designation</MenuItem>
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
                                    <TextField name="password" type="password" value={formData.password} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                                <FormRow label="Confirm Password" required>
                                    <TextField name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                </FormRow>
                            </Section>

                            <Section title="Extra Fields" icon={<MoreHorizIcon />}>
                                {([1, 2, 3, 4, 5, 6, 7] as const).map(num => (
                                    <FormRow key={num} label={`Field ${num}`}>
                                        <TextField name={`field${num}`} value={formData[`field${num}` as keyof typeof formData] as string} onChange={handleInputChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                    </FormRow>
                                ))}
                            </Section>
                        </Box>
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={tabValue} index={1}>
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
                                <Box sx={{ flex: 1 }} />
                            </Box>

                            <Divider sx={{ mb: 1, mt: -1 }} />

                            {/* Row 2: Document Type & Date */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Document Type" required>
                                        <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: '#aaa', bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}>
                                            <MenuItem value="" disabled>Choose a Document...</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Date" required>
                                        <TextField type="text" value="01-Mar-2026" fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 3: Document Formate */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Document Formate" required>
                                        <Select fullWidth size="small" displayEmpty value="Original Hard Copy" sx={{ borderRadius: 1.5, bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}>
                                            <MenuItem value="Original Hard Copy">Original Hard Copy</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 4: File Location & File Label */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="File Location" required>
                                        <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: '#aaa', bgcolor: '#fafafa', '& .MuiSelect-select': { py: 1 } }}>
                                            <MenuItem value="" disabled>Choose a File Location...</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="File Label">
                                        <Select fullWidth size="small" displayEmpty value="" sx={{ borderRadius: 1.5, color: '#aaa', bgcolor: '#f8fafc', '& .MuiSelect-select': { py: 1 } }}>
                                            <MenuItem value="" disabled>Select an Option</MenuItem>
                                        </Select>
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 5: Description & Returnable */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Description">
                                        <TextField fullWidth multiline rows={2} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', pt: 1 }}>
                                        <Typography sx={{ width: { xs: '100%', sm: '160px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>
                                            Returnable
                                        </Typography>
                                        <Box sx={{ width: 22, height: 22, bgcolor: '#667eea', borderRadius: 1, cursor: 'pointer' }}></Box>
                                    </Box>
                                </Box>
                            </Box>

                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1, textTransform: 'none', boxShadow: 'none' }}>
                                Save
                            </Button>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}>
                                Cancel
                            </Button>
                        </Box>

                    </Box>
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Paper sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: 'none', border: 'none' }}>
                            <Box sx={{ background: '#667eea', color: 'white', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FormatListBulletedIcon fontSize="small" />
                                    <Typography fontWeight={600} fontSize="0.95rem">Employee Document List</Typography>
                                </Box>
                                <IconButton size="small" disableRipple sx={{ color: 'white', p: 0 }}>
                                    <Box component="svg" viewBox="0 0 24 24" fill="currentColor" sx={{ width: 24, height: 24 }}>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 16h8v1H8v-1zm0-2h8v1H8v-1zm0-2h5v1H8v-1z" />
                                    </Box>
                                </IconButton>
                            </Box>
                        </Paper>
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
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="ESI Number">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 3 */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Aadhar Number">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Driving Licence No">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                            </Box>

                            {/* Row 4: Passport */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Checkbox size="small" sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 5: Passport Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport Authority">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Passport Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
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
                                                <Checkbox size="small" sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 7: Visa Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Visa Authority">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="Visa Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
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
                                                <Checkbox size="small" sx={{ p: 0.5, color: '#94a3b8' }} />
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                        </Box>
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                            </Box>

                            {/* Row 9: EID Authority */}
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="EID Authority">
                                        <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                    </FormRow>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormRow label="EID Date">
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            <Box sx={{ px: 1.5, py: 0.8, bgcolor: '#e2e8f0', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                                                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem' }}>To</Typography>
                                            </Box>
                                            <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderRadius: 1.5, bgcolor: '#fff' } }} />
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
                                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank Branch">
                                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                    </Box>

                                    {/* Bank Row 2 */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Account Holder Name" helperText=""> {/* Just to keep the height matched if needed, but not showing it here */}
                                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank A/C No">
                                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                    </Box>

                                    {/* Bank Row 3 */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 4 } }}>
                                        <Box sx={{ flex: 1 }}>
                                            <FormRow label="Bank IFS Code">
                                                <TextField fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff' } }} />
                                            </FormRow>
                                        </Box>
                                        <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1, textTransform: 'none', boxShadow: 'none' }}>
                                Save
                            </Button>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography sx={{ width: { xs: '100%', sm: '300px' }, color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
                                    Start Single Task Approval Allow Popup Access
                                </Typography>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ width: 22, height: 22, bgcolor: '#667eea', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Box component="svg" viewBox="0 0 24 24" fill="white" sx={{ width: 16, height: 16 }}>
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <Divider sx={{ mt: 1 }} />

                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#56b6ed', borderRadius: 1, textTransform: 'none', boxShadow: 'none' }}>
                                Save
                            </Button>
                            <Button variant="contained" sx={{ px: 4, bgcolor: '#ff6c60', borderRadius: 1, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e55a4f' } }}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </CustomTabPanel>
            </Paper>

        </Box>
    );
};
