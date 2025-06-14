import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext'; // Import NotificationsProvider
import Layout from './components/Layout'; // Import the Layout component
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Dashboards (already created in previous steps)
import UserDashboard from './pages/UserDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TransportOfficerDashboard from './pages/TransportOfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewTireRequestPage from './pages/NewTireRequestPage'; // Import NewTireRequestPage

import { Typography, Container, Box } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';

// Generic Dashboard or Home for authenticated users without specific roles,
// or as a fallback if role-based routing needs a default.
const GenericDashboard = () => {
  const { currentUser } = useAuth();
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Welcome, {currentUser?.username || 'User'}!
        </Typography>
        <Typography variant="body1">
          This is your central dashboard. Specific features based on your role will be available.
          If you don't see role-specific options, please contact an administrator.
        </Typography>
      </Box>
    </Container>
  );
};

// A simple landing page for unauthenticated users or root path
const HomePage = () => (
  <Container>
    <Box sx={{ my: 4, textAlign: 'center' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Tire Request Management System
      </Typography>
      <Typography variant="body1">
        Please login or register to continue.
      </Typography>
    </Box>
  </Container>
);


function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuth();

  // Helper to determine the primary dashboard path for redirection
  const getPrimaryDashboardPathForRedirect = () => {
    const userRoles = currentUser?.roles || [];
    if (userRoles.includes('ROLE_ADMIN')) return '/admin/dashboard';
    if (userRoles.includes('ROLE_MANAGER')) return '/manager/dashboard';
    if (userRoles.includes('ROLE_TRANSPORT_OFFICER')) return '/to/dashboard';
    if (userRoles.includes('ROLE_USER')) return '/user/dashboard';
    return '/dashboard'; // Fallback to generic dashboard (which itself might be a landing/info page)
  };

  const getHomeElement = () => {
    if (!isAuthenticated()) {
      return <HomePage />;
    }
    return <Navigate to={getPrimaryDashboardPathForRedirect()} replace />;
  };

  return (
    <Routes>
      <Route element={<Layout />}> {/* Layout wraps all routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Root path handling */}
        <Route path="/" element={getHomeElement()} />

        {/* Generic dashboard path - redirects to role-specific if possible, otherwise shows GenericDashboard */}
        <Route
            path="/dashboard"
            element={
                <ProtectedRoute>
                    {currentUser?.roles?.length > 0 ? <Navigate to={getPrimaryDashboardPathForRedirect()} replace /> : <GenericDashboard />}
                </ProtectedRoute>
            }
        />

        {/* New Tire Request Page */}
        <Route
            path="/requests/new"
            element={
                <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_MANAGER', 'ROLE_ADMIN']}> {/* Adjust roles as needed */}
                    <NewTireRequestPage />
                </ProtectedRoute>
            }
        />

        {/* Role-specific dashboards */}
        <Route
          path="/user/dashboard"
          element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']}><UserDashboard /></ProtectedRoute>}
        />
        <Route
          path="/manager/dashboard"
          element={<ProtectedRoute allowedRoles={['ROLE_MANAGER', 'ROLE_ADMIN']}><ManagerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/to/dashboard"
          element={<ProtectedRoute allowedRoles={['ROLE_TRANSPORT_OFFICER', 'ROLE_ADMIN']}><TransportOfficerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']}><AdminDashboard /></ProtectedRoute>}
        />

        {/* Add other application routes here, e.g., /requests/:id (view specific request) */}

        <Route path="*" element={
          <Container><Box sx={{my:4}}><Typography variant="h4">404 Not Found</Typography></Box></Container>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider> {/* Wrap AppRoutes with NotificationsProvider */}
        <Router> {/* Router should be at the top level */}
          <AppRoutes />
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
