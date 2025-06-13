import React, { useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Divider, Box, ListItemIcon, ListItemText } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNotifications } from '../context/NotificationsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, refreshNotifications } = useNotifications();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const userRoles = currentUser?.roles || [];
  const isManager = userRoles.includes('ROLE_MANAGER');
  const isTO = userRoles.includes('ROLE_TRANSPORT_OFFICER');

  // Only render the bell for authorized roles
  if (!isManager && !isTO) {
    return null;
  }

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
    markAsRead(); // Mark as read when menu is opened (basic implementation)
    refreshNotifications(); // Refresh when opening
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    handleCloseMenu();
    // Navigate to the relevant dashboard page based on role and notification type
    if (notification.status === 'PENDING' && isManager) {
      navigate('/manager/dashboard'); // Manager dashboard handles PENDING
      toast.info(`Navigating to PENDING request: ${notification.vehicleNo}`);
    } else if (notification.status === 'MANAGER_APPROVED' && isTO) {
      navigate('/to/dashboard'); // TO dashboard handles MANAGER_APPROVED
      toast.info(`Navigating to MANAGER_APPROVED request: ${notification.vehicleNo}`);
    } else {
      // Fallback or general notification view page if implemented
      // For now, just log or navigate to a generic spot
      navigate(isManager ? '/manager/dashboard' : '/to/dashboard');
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="show new notifications"
        aria-controls="notifications-menu"
        aria-haspopup="true"
        onClick={handleOpenMenu}
      >
        <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ style: { maxHeight: 400, width: '350px' } }}
      >
        <Box sx={{ pl: 2, pr: 2, pt:1, pb:1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" component="div">Notifications ({unreadCount})</Typography>
            {/* Add a refresh button here later if needed */}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem onClick={handleCloseMenu} sx={{whiteSpace: 'normal'}}>
            <Typography variant="body2">No new notifications.</Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => ( // Show limited notifications
            <MenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} sx={{whiteSpace: 'normal'}}>
                <ListItemIcon>
                    <VisibilityIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                    primaryTypographyProps={{variant: 'body2'}}
                    primary={`Vehicle: ${notification.vehicleNo}`}
                    secondary={`Status: ${notification.status} - By: ${notification.requestedByUsername}`}
                />
            </MenuItem>
          ))
        )}
        {notifications.length > 10 && (
            <MenuItem disabled>
                <Typography variant="caption">...and {notifications.length - 10} more</Typography>
            </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => {
            handleCloseMenu();
            // Navigate to a full notifications page or relevant dashboard
             navigate(isManager ? '/manager/dashboard' : '/to/dashboard');
        }}>
          <Typography variant="body2" color="primary" align="center" sx={{width: '100%'}}>
            View All Relevant Requests
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;
