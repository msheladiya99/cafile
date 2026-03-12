import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider, createTheme, CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load layouts and auth pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));
const ClientLayout = lazy(() => import('./layouts/ClientLayout').then(module => ({ default: module.ClientLayout })));
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout').then(module => ({ default: module.SuperAdminLayout })));

// Lazy load route pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(module => ({ default: module.AdminDashboard })));
const MonthlyReports = lazy(() => import('./pages/admin/MonthlyReports').then(module => ({ default: module.MonthlyReports })));
const Clients = lazy(() => import('./pages/admin/Clients').then(module => ({ default: module.Clients })));
const AddGroupList = lazy(() => import('./pages/admin/client_process/AddGroupList').then(module => ({ default: module.AddGroupList })));
const ClientMaster = lazy(() => import('./pages/admin/client_process/ClientMaster').then(module => ({ default: module.ClientMaster })));
const ClientList = lazy(() => import('./pages/admin/client_process/ClientList').then(module => ({ default: module.ClientList })));
const ClientContactDetail = lazy(() => import('./pages/admin/client_process/ClientContactDetail').then(module => ({ default: module.ClientContactDetail })));
const Tasks = lazy(() => import('./pages/admin/Tasks').then(module => ({ default: module.Tasks })));
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
const ClientDashboard = lazy(() => import('./pages/client/Dashboard').then(module => ({ default: module.ClientDashboard })));
const ClientInvoices = lazy(() => import('./pages/client/Invoices').then(module => ({ default: module.ClientInvoices })));
const ProfileSettings = lazy(() => import('./pages/client/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const MyFiles = lazy(() => import('./pages/client/MyFiles').then(module => ({ default: module.MyFiles })));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/Dashboard'));
const FirmManagement = lazy(() => import('./pages/super-admin/FirmManagement'));
const CreateFirm = lazy(() => import('./pages/super-admin/CreateFirm'));
const FirmDetails = lazy(() => import('./pages/super-admin/FirmDetails'));
const Subscriptions = lazy(() => import('./pages/super-admin/Subscriptions'));
const Analytics = lazy(() => import('./pages/super-admin/Analytics'));
const SystemHealth = lazy(() => import('./pages/super-admin/SystemHealth'));
const SecurityLogs = lazy(() => import('./pages/super-admin/Security'));
const SuperAdminLogin = lazy(() => import('./pages/super-admin/Login'));


const LoadingScreen = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

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
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getHomePath()} replace />
            ) : (
              <Login />
            )
          }
        />

        <Route path="/super-admin/login" element={<SuperAdminLogin />} />

        {/* Super Admin Routes */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute>
              {isSuperAdmin ? <SuperAdminLayout /> : <Navigate to={getHomePath()} replace />}
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="firms" element={<FirmManagement />} />
          <Route path="create-firm" element={<CreateFirm />} />
          <Route path="firms/:id" element={<FirmDetails />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="security" element={<SecurityLogs />} />
          <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Route>

        {/* Admin/Staff Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireStaff>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
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
          <Route path="tasks" element={<Tasks />} />
          <Route path="upload" element={<UploadFile />} />
          <Route path="files" element={<ManageFiles />} />
          <Route path="reminders" element={<Reminders />} />

          <Route path="billing" element={<Billing />} />
          <Route
            path="client-ledger"
            element={
              <ProtectedRoute requireAdmin>
                <ClientLedger />
              </ProtectedRoute>
            }
          />
          <Route path="fileregister" element={<FileRegister />} />

          <Route
            path="firm-master"
            element={
              <ProtectedRoute requireAdmin>
                <FirmMasterPage />
              </ProtectedRoute>
            }
          />

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
          </Route>

          <Route path="profile" element={<ProfileSettings />} />
        </Route>


        {/* Client Routes */}
        <Route
          path="/client"
          element={
            <ProtectedRoute requireClient>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="profile" element={<ProfileSettings />} />

          <Route path="files" element={<MyFiles />} />
        </Route>

        {/* Default Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={getHomePath()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
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
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
