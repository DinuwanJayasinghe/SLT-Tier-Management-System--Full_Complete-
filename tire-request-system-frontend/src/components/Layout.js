import React from 'react';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // For New Request
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationBell from './NotificationBell';
import { ToastContainer } from 'react-toastify';

const Layout = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  const userRoles = currentUser?.roles || [];

  // Centralized logic for determining the primary dashboard path
  const getPrimaryDashboardPath = () => {
    if (userRoles.includes('ROLE_ADMIN')) return '/admin/dashboard';
    if (userRoles.includes('ROLE_MANAGER')) return '/manager/dashboard';
    if (userRoles.includes('ROLE_TRANSPORT_OFFICER')) return '/to/dashboard';
    if (userRoles.includes('ROLE_USER')) return '/user/dashboard';
    return '/dashboard'; // Generic fallback
  };

  // Determine if user can create requests (adjust roles as needed)
  const canCreateRequests = isAuthenticated() && userRoles.some(role =>
    ['ROLE_USER', 'ROLE_MANAGER', 'ROLE_ADMIN'].includes(role) // Example: Admins/Managers can also create
  );


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
            Tire Request System
          </Typography>
          <Button color="inherit" component={RouterLink} to="/" startIcon={<HomeIcon />}>Home</Button>
          {isAuthenticated() && (
            <Button color="inherit" component={RouterLink} to={getPrimaryDashboardPath()} startIcon={<DashboardIcon />}>Dashboard</Button>
          )}
          {canCreateRequests && (
             <Button color="inherit" component={RouterLink} to="/requests/new" startIcon={<AddCircleOutlineIcon />}>
               New Request
             </Button>
          )}
          {!isAuthenticated() && (
            <>
              <Button color="inherit" component={RouterLink} to="/login" startIcon={<LoginIcon />}>Login</Button>
              <Button color="inherit" component={RouterLink} to="/register" startIcon={<PersonAddIcon />}>Register</Button>
            </>
          )}
          {isAuthenticated() && (
            <>
              <NotificationBell /> {/* Add NotificationBell here */}
              <div>
                <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>{currentUser?.username?.charAt(0).toUpperCase()}</Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem disabled sx={{opacity: '1 !important'}}> {/* Ensure username is visible */}
                  <Typography variant="subtitle2">{currentUser?.username}</Typography>
                </MenuItem>
                {/* <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>Profile</MenuItem> */}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </div>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet /> {/* This is where the routed page content will be rendered */}
      </Container>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 2, textAlign: 'center', mt: 'auto' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Tire Request System
        </Typography>
      </Box>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Box>
  );
};

export default Layout;
