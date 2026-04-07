import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { isSuperAdminDomain } from './utils/subdomain';

import { ProtectedRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';

// Lazy load core pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(module => ({ default: module.AdminDashboard })));

// Lazy load other layouts and secondary pages
// Lazy load other layouts and secondary pages
const ClientLayout = lazy(() => import('./layouts/ClientLayout').then(module => ({ default: module.ClientLayout })));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard').then(module => ({ default: module.ClientDashboard })));
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout').then(module => ({ default: module.SuperAdminLayout })));

// Lazy load route pages
const MonthlyReports = lazy(() => import('./pages/admin/MonthlyReports').then(module => ({ default: module.MonthlyReports })));
const Clients = lazy(() => import('./pages/admin/Clients').then(module => ({ default: module.Clients })));
const AddGroupList = lazy(() => import('./pages/admin/client_process/AddGroupList').then(module => ({ default: module.AddGroupList })));
const ClientMaster = lazy(() => import('./pages/admin/client_process/ClientMaster').then(module => ({ default: module.ClientMaster })));
const ClientList = lazy(() => import('./pages/admin/client_process/ClientList').then(module => ({ default: module.ClientList })));
const ClientContactDetail = lazy(() => import('./pages/admin/client_process/ClientContactDetail').then(module => ({ default: module.ClientContactDetail })));
const TaskDashboard = lazy(() => import('./pages/admin/task/TaskDashboard').then(module => ({ default: module.TaskDashboard })));
const TaskMasterPage = lazy(() => import('./pages/admin/task/TaskMaster').then(module => ({ default: module.TaskMaster })));
const TaskApplicability = lazy(() => import('./pages/admin/task/TaskApplicability').then(module => ({ default: module.TaskApplicability })));
const TaskApproval = lazy(() => import('./pages/admin/task/TaskApproval').then(module => ({ default: module.TaskApproval })));
const TaskCategoryPage = lazy(() => import('./pages/admin/task/TaskCategoryPage').then(module => ({ default: module.TaskCategoryPage })));
const ApprovedTaskList = lazy(() => import('./pages/admin/task/ApprovedTaskList').then(module => ({ default: module.ApprovedTaskList })));
const UpdateApprovedTask = lazy(() => import('./pages/admin/task/UpdateApprovedTask').then(module => ({ default: module.UpdateApprovedTask })));
const TransferTask = lazy(() => import('./pages/admin/task/TransferTask').then(module => ({ default: module.TransferTask })));
const TransferAllTask = lazy(() => import('./pages/admin/task/TransferAllTask').then(module => ({ default: module.TransferAllTask })));
const TaskCycleDetail = lazy(() => import('./pages/admin/task/TaskCycleDetail').then(module => ({ default: module.TaskCycleDetail })));
const TaskInformation = lazy(() => import('./pages/admin/task/TaskInformation').then(module => ({ default: module.TaskInformation })));
const AllTaskUpdate = lazy(() => import('./pages/admin/task/AllTaskUpdate').then(module => ({ default: module.AllTaskUpdate })));
const OngoingTask = lazy(() => import('./pages/admin/task/OngoingTask').then(module => ({ default: module.OngoingTask })));
const UDINList = lazy(() => import('./pages/admin/task/UDINList').then(module => ({ default: module.UDINList })));
const FreeClientList = lazy(() => import('./pages/admin/task/FreeClientList').then(module => ({ default: module.FreeClientList })));
const UploadFile = lazy(() => import('./pages/admin/UploadFile').then(module => ({ default: module.UploadFile })));
const ManageFiles = lazy(() => import('./pages/admin/ManageFiles').then(module => ({ default: module.ManageFiles })));
const Reminders = lazy(() => import('./pages/admin/Reminders').then(module => ({ default: module.Reminders })));
const Billing = lazy(() => import('./pages/admin/Billing').then(module => ({ default: module.Billing })));
const ClientLedger = lazy(() => import('./pages/admin/ClientLedger').then(module => ({ default: module.ClientLedger })));
const FileRegister = lazy(() => import('./pages/admin/FileRegister').then(module => ({ default: module.FileRegister })));
const FirmMasterPage = lazy(() => import('./pages/admin/FirmMaster').then(module => ({ default: module.FirmMasterPage })));
const EmployeeMaster = lazy(() => import('./pages/admin/employee/EmployeeMaster').then(module => ({ default: module.EmployeeMaster })));
const EmployeeList = lazy(() => import('./pages/admin/employee/EmployeeList').then(module => ({ default: module.EmployeeList })));
const EmpTaskSchedule = lazy(() => import('./pages/admin/employee/EmpTaskSchedule').then(module => ({ default: module.EmpTaskSchedule })));
const EmployeeLoginDetail = lazy(() => import('./pages/admin/employee/EmployeeLoginDetail').then(module => ({ default: module.EmployeeLoginDetail })));
const FreeEmployeeList = lazy(() => import('./pages/admin/employee/FreeEmployeeList').then(module => ({ default: module.FreeEmployeeList })));
const EntryWiseTimesheet = lazy(() => import('./pages/admin/employee/timesheet/EntryWiseTimesheet').then(module => ({ default: module.EntryWiseTimesheet })));
const SubtaskWiseTimesheet = lazy(() => import('./pages/admin/employee/timesheet/SubtaskWiseTimesheet').then(module => ({ default: module.SubtaskWiseTimesheet })));
const TaskWiseTimesheet = lazy(() => import('./pages/admin/employee/timesheet/TaskWiseTimesheet').then(module => ({ default: module.TaskWiseTimesheet })));
const AddAttendance = lazy(() => import('./pages/admin/employee/attendance/AddAttendance').then(module => ({ default: module.AddAttendance })));
const AttendanceList = lazy(() => import('./pages/admin/employee/attendance/AttendanceList').then(module => ({ default: module.AttendanceList })));
const Form108 = lazy(() => import('./pages/admin/employee/Form108').then(module => ({ default: module.Form108 })));
const StaffPermissions = lazy(() => import('./pages/admin/employee/StaffPermissions').then(module => ({ default: module.StaffPermissions })));
const ClientInvoices = lazy(() => import('./pages/client/Invoices').then(module => ({ default: module.ClientInvoices })));
const ProfileSettings = lazy(() => import('./pages/client/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const MyFiles = lazy(() => import('./pages/client/MyFiles').then(module => ({ default: module.MyFiles })));
const DSCManagement = lazy(() => import('./pages/admin/DSCManagement').then(module => ({ default: module.DSCManagement })));

// Main Entry Pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const GSTSoftwarePage = lazy(() => import('./pages/seo/GSTSoftwarePage'));
const ITRSoftwarePage = lazy(() => import('./pages/seo/ITRSoftwarePage'));
const CAPracticeManagementPage = lazy(() => import('./pages/seo/CAPracticeManagementPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));

// Super Admin & Company Pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/Dashboard'));
const FirmManagement = lazy(() => import('./pages/super-admin/FirmManagement'));
const CreateFirm = lazy(() => import('./pages/super-admin/CreateFirm'));
const FirmDetails = lazy(() => import('./pages/super-admin/FirmDetails'));
const Subscriptions = lazy(() => import('./pages/super-admin/Subscriptions'));
const Addons = lazy(() => import('./pages/super-admin/Addons'));
const Analytics = lazy(() => import('./pages/super-admin/Analytics'));
const SystemHealth = lazy(() => import('./pages/super-admin/SystemHealth'));
const SecurityLogs = lazy(() => import('./pages/super-admin/Security'));
const SuperAdminLogin = lazy(() => import('./pages/super-admin/Login'));
const AboutPage = lazy(() => import('./pages/company/AboutPage'));
const CareersPage = lazy(() => import('./pages/company/CareersPage'));
const ContactPage = lazy(() => import('./pages/company/ContactPage'));
const PressPage = lazy(() => import('./pages/company/PressPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/company/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/company/TermsOfServicePage'));


const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
    <div className="spinner"></div>
    <style>{` .spinner { width: 40px; height: 40px; border: 3px solid rgba(102, 126, 234, 0.1); border-radius: 50%; border-top-color: #667eea; animation: spin 1s ease-in-out infinite; } @keyframes spin { to { transform: rotate(360deg); } } `}</style>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000,    // 2 min: serve cached data without re-fetching
      gcTime: 10 * 60 * 1000,      // 10 min: keep unused data in memory
    }
  },
});

const theme = createTheme({
  palette: { primary: { main: '#667eea' }, secondary: { main: '#764ba2' } },
  typography: { fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', h4: { fontWeight: 700 }, h6: { fontWeight: 600 } },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' } } },
  },
});

const SuperAdminRedirect: React.FC = () => {
  const { pathname, search } = useLocation();
  const newPath = pathname.replace(/^\/super_admin/, '/super-admin');
  return <Navigate to={newPath + search} replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isStaff, isSuperAdmin } = useAuth();

  const getHomePath = () => {
    if (isSuperAdmin) return '/super-admin/dashboard';
    if (isStaff) return '/admin/dashboard';
    return '/client/dashboard';
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={getHomePath()} replace />
            : isSuperAdminDomain()
              ? <Navigate to="/superadmin" replace />
              : <Login />
        } />
        
        {/* Super Admin login — only accessible on main domain; firm subdomains redirected to their own login */}
        <Route path="/superadmin" element={isSuperAdminDomain() ? <SuperAdminLogin /> : <Navigate to="/login" replace />} />
        
        {/* Redirect underscored super_admin to hyphenated super-admin */}
        <Route path="/super_admin" element={<SuperAdminRedirect />} />
        <Route path="/super_admin/*" element={<SuperAdminRedirect />} />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute>
              {isSuperAdmin ? <SuperAdminLayout /> : <Navigate to={getHomePath()} replace />}
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="firms" element={<FirmManagement />} />
          <Route path="create-firm" element={<CreateFirm />} />
          <Route path="firms/:id" element={<FirmDetails />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="addons" element={<Addons />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="security" element={<SecurityLogs />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Admin/Staff Routes */}
        <Route path="/admin" element={<ProtectedRoute requireStaff><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="reports" element={<MonthlyReports />} />
          <Route path="clients" element={<Clients />} />
          <Route path="client">
            <Route path="add-group" element={<AddGroupList />} />
            <Route path="master" element={<ClientMaster />} />
            <Route path="master/:id" element={<ClientMaster />} />
            <Route path="list" element={<ClientList />} />
            <Route path="contact-detail" element={<ClientContactDetail />} />
          </Route>
          <Route path="tasks">
            <Route index element={<TaskDashboard />} />
            <Route path="approval" element={<TaskApproval />} />
            <Route path="approved-list" element={<ApprovedTaskList />} />
            <Route path="update-approved" element={<UpdateApprovedTask />} />
            <Route path="transfer-single" element={<TransferTask />} />
            <Route path="transfer-all" element={<TransferAllTask />} />
            <Route path="cycle-detail" element={<TaskCycleDetail />} />
            <Route path="information" element={<TaskInformation />} />
            <Route path="all-update" element={<AllTaskUpdate />} />
            <Route path="ongoing" element={<OngoingTask />} />
            <Route path="udin-list" element={<UDINList />} />
            <Route path="free-client-list" element={<FreeClientList />} />
          </Route>
          <Route path="task-master">
            <Route path="add" element={<TaskMasterPage />} />
            <Route path="list" element={<TaskMasterPage />} />
            <Route index element={<Navigate to="list" replace />} />
          </Route>
          <Route path="task-category" element={<TaskCategoryPage />} />
          <Route path="task-applicability" element={<TaskApplicability />} />
          <Route path="upload" element={<UploadFile />} />
          <Route path="files" element={<ManageFiles />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="billing" element={<Billing />} />
          <Route path="client-ledger" element={<ProtectedRoute requireAdmin><ClientLedger /></ProtectedRoute>} />
          <Route path="fileregister" element={<FileRegister />} />
          <Route path="firm-master" element={<ProtectedRoute requireAdmin><FirmMasterPage /></ProtectedRoute>} />
          <Route path="employee">
            <Route path="master" element={<EmployeeMaster />} />
            <Route path="master/:id" element={<EmployeeMaster />} />
            <Route path="list" element={<EmployeeList />} />
            <Route path="tasks" element={<EmpTaskSchedule />} />
            <Route path="timesheet">
              <Route path="entry" element={<EntryWiseTimesheet />} />
              <Route path="subtask" element={<SubtaskWiseTimesheet />} />
              <Route path="task" element={<TaskWiseTimesheet />} />
            </Route>
            <Route path="attendance">
              <Route path="add" element={<AddAttendance />} />
              <Route path="list" element={<AttendanceList />} />
            </Route>
            <Route path="login-detail" element={<EmployeeLoginDetail />} />
            <Route path="free-list" element={<FreeEmployeeList />} />
            <Route path="form108" element={<Form108 />} />
            <Route path="permissions" element={<ProtectedRoute requireAdmin><StaffPermissions /></ProtectedRoute>} />
          </Route>
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="dsc" element={<DSCManagement />} />
        </Route>

        {/* Client Routes */}
        <Route path="/client" element={<ProtectedRoute requireClient><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="files" element={<MyFiles />} />
        </Route>

        <Route path="/gst-software-india" element={<GSTSoftwarePage />} />
        <Route path="/itr-filing-software" element={<ITRSoftwarePage />} />
        <Route path="/ca-practice-management" element={<CAPracticeManagementPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />

        <Route path="/" element={isAuthenticated ? <Navigate to={getHomePath()} replace /> : (isSuperAdminDomain() ? <LandingPage /> : <Navigate to="/login" replace />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense >
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <HelmetProvider>
          <CssBaseline />
          <BrowserRouter>
            <ScrollToTop />
            <WhatsAppButton />
            <AuthProvider>
              <Toaster position="top-right" />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
