import React from 'react';
import { Typography, Container, Box, Paper } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Icon for Admin

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '2.5rem', color: 'primary.main' }}/>
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
        </Box>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">
            Welcome, Admin. Full system oversight and user management capabilities.
          </Typography>
          {/* Placeholder for admin-specific components like: */}
          {/* - User management interface */}
          {/* - System settings or configurations */}
          {/* - Overview of all requests, system logs, etc. */}
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDashboard;
