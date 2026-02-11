import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminLayout } from './layouts/AdminLayout';
import { ClientLayout } from './layouts/ClientLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
// AnalyticsDashboard removed
import { MonthlyReports } from './pages/admin/MonthlyReports';
import { Clients } from './pages/admin/Clients';
import { Staff } from './pages/admin/Staff';
import { UploadFile } from './pages/admin/UploadFile';
import { ManageFiles } from './pages/admin/ManageFiles';
import { Reminders } from './pages/admin/Reminders';
import { Billing } from './pages/admin/Billing';
import { CompanySettingsPage } from './pages/admin/CompanySettings';
import { ClientDashboard } from './pages/client/Dashboard';
import { ClientInvoices } from './pages/client/Invoices';
import { ProfileSettings } from './pages/client/ProfileSettings';
import { MyFiles } from './pages/client/MyFiles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
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
  const { isAuthenticated, isStaff } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isStaff ? '/admin/dashboard' : '/client/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

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
        {/* Analytics route removed */}
        <Route path="reports" element={<MonthlyReports />} />
        <Route path="clients" element={<Clients />} />
        <Route
          path="staff"
          element={
            <ProtectedRoute requireAdmin>
              <Staff />
            </ProtectedRoute>
          }
        />
        <Route path="upload" element={<UploadFile />} />
        <Route path="files" element={<ManageFiles />} />
        <Route path="reminders" element={<Reminders />} />

        <Route path="billing" element={<Billing />} />

        <Route
          path="settings"
          element={
            <ProtectedRoute requireAdmin>
              <CompanySettingsPage />
            </ProtectedRoute>
          }
        />
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
            <Navigate to={isStaff ? '/admin/dashboard' : '/client/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
