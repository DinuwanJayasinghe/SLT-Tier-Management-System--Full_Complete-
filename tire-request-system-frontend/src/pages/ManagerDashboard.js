import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, Paper, CircularProgress, Alert, Tabs, Tab, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PendingActionsIcon from '@mui/icons-material/PendingActions'; // Icon for Pending
import ListAltIcon from '@mui/icons-material/ListAlt'; // Icon for All Requests
import ManagerRequestsTable from '../components/ManagerRequestsTable'; // Import the table component
import TireRequestService from '../services/TireRequestService';
import { useNotifications } from '../context/NotificationsContext'; // Import useNotifications
import { toast } from 'react-toastify';

const ManagerDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const { unreadCount: pendingManagerNotifications, refreshNotifications } = useNotifications(); // Get notification count for manager
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0); // 0 for Pending, 1 for All

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      // For manager, fetch all requests. They can then filter by status PENDING.
      // Or, make two separate calls: one for PENDING, one for others if performance is an issue.
      // For now, fetch all and let the table component filter if needed, or manager can see all types.
      const response = await TireRequestService.getAllTireRequests();
      setAllRequests(response.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError('Failed to fetch requests. Please try again.');
      toast.error('Failed to fetch requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    refreshNotifications(); // Also refresh notifications context when dashboard loads
  }, [refreshNotifications]); // Added refreshNotifications to dependency array

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 0) { // Assuming tab 0 is 'Pending Your Approval'
        refreshNotifications(); // Refresh count when switching to pending tab
    }
  };

  // This function will be passed to ManagerRequestsTable to update the main list after an action
  // and also refresh notifications as an action might change pending counts
  const handleRequestAction = () => {
    fetchRequests(); // Re-fetch all requests
    refreshNotifications(); // Refresh notification counts
  };


  const pendingRequests = allRequests.filter(req => req.status === 'PENDING');

  return (
    <Container maxWidth="xl"> {/* Using xl for wider tables */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manager Dashboard
        </Typography>

        {pendingManagerNotifications > 0 && currentTab !== 0 && (
          <Alert severity="info" icon={<NotificationsActiveIcon />} sx={{ mb: 2 }}>
            You have {pendingManagerNotifications} request(s) pending your approval.
            <Link component={RouterLink} to="#" onClick={() => setCurrentTab(0)} sx={{ml:1}}>View now</Link>.
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="request status tabs" centered>
                <Tab
                    icon={<PendingActionsIcon />}
                    iconPosition="start"
                    label={`Pending Your Approval (${pendingRequests.length})`}
                />
                <Tab
                    icon={<ListAltIcon />}
                    iconPosition="start"
                    label={`All Requests (${allRequests.length})`}
                />
            </Tabs>
        </Box>

        {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!isLoading && !error && (
            <>
                {currentTab === 0 && (
                    <ManagerRequestsTable
                        requests={pendingRequests}
                        setRequests={handleRequestAction} // Use new handler
                        filterStatus="PENDING"
                    />
                )}
                {currentTab === 1 && (
                     <ManagerRequestsTable
                        requests={allRequests}
                        setRequests={handleRequestAction} // Use new handler
                    />
                )}
            </>
        )}
      </Box>
    </Container>
  );
};

export default ManagerDashboard;
