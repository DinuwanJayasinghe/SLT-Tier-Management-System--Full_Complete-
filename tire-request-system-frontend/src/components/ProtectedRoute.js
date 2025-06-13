import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Typography, Container, Box, Alert } from '@mui/material';

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = currentUser?.roles || []; // Assuming roles are stored in currentUser.roles as an array

  // If allowedRoles is not provided, just being authenticated is enough
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  const hasRequiredRole = userRoles.some(role => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    // User is authenticated but does not have the required role
    return (
      <Container>
        <Box sx={{ mt: 4, p: 2, textAlign: 'center' }}>
          <Alert severity="error" sx={{ justifyContent: 'center' }}>
            <Typography variant="h5">Access Denied</Typography>
            <Typography>You do not have the necessary permissions to view this page.</Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return <Outlet />; // User is authenticated and has at least one of the allowed roles
};

export default ProtectedRoute;
