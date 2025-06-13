import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, Paper, CircularProgress, Alert, Tabs, Tab, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import TransportOfficerRequestsTable from '../components/TransportOfficerRequestsTable'; // Import the new table component
import TireRequestService from '../services/TireRequestService';
import { useNotifications } from '../context/NotificationsContext'; // Import useNotifications
import { toast } from 'react-toastify';

const TransportOfficerDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const { unreadCount: pendingTONotifications, refreshNotifications } = useNotifications(); // Get notification count for TO
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0); // 0 for Pending Final Approval, 1 for All Processed by TO

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Transport Officers might be interested in all requests, or specifically those manager-approved or already processed by them.
      // Fetching all and filtering might be simpler initially.
      const response = await TireRequestService.getAllTireRequests();
      setAllRequests(response.data || []);
    } catch (err) {
      console.error("Error fetching requests for TO:", err);
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
    if (newValue === 0) { // Assuming tab 0 is 'Pending Final Approval'
        refreshNotifications(); // Refresh count when switching to pending tab
    }
  };

  // This function will be passed to TransportOfficerRequestsTable to update the main list after an action
  // and also refresh notifications as an action might change pending counts
  const handleRequestAction = () => {
    fetchRequests(); // Re-fetch all requests
    refreshNotifications(); // Refresh notification counts
  };

  const pendingFinalApprovalRequests = allRequests.filter(req => req.status === 'MANAGER_APPROVED');
  // Example: Could also show requests already processed by TO (FINAL_APPROVED or REJECTED by TO)
  // const processedByTORequests = allRequests.filter(req => req.status === 'FINAL_APPROVED' || (req.status === 'REJECTED' && req.transportOfficerRemarks));


  return (
    <Container maxWidth="xl"> {/* Using xl for wider tables */}
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Transport Officer Dashboard
        </Typography>

        {pendingTONotifications > 0 && currentTab !== 0 && (
          <Alert severity="info" icon={<NotificationsActiveIcon />} sx={{ mb: 2 }}>
            You have {pendingTONotifications} request(s) pending your final approval.
            <Link component={RouterLink} to="#" onClick={() => setCurrentTab(0)} sx={{ml:1}}>View now</Link>.
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="request status tabs for TO">
                <Tab label={`Pending Final Approval (${pendingFinalApprovalRequests.length})`} />
                {/* Displaying count from allRequests filtered, or could use pendingTONotifications if logic aligns perfectly */}
                <Tab label={`All Processed / Relevant (${allRequests.length})`} />
            </Tabs>
        </Box>

        {isLoading && <CircularProgress />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!isLoading && !error && (
            <>
                {currentTab === 0 && (
                    <TransportOfficerRequestsTable
                        requests={pendingFinalApprovalRequests}
                        setRequests={handleRequestAction} // Use new handler
                        filterStatus="MANAGER_APPROVED"
                    />
                )}
                {currentTab === 1 && (
                     <TransportOfficerRequestsTable
                        requests={allRequests} // Or a more specific list like 'processedByTORequests'
                        setRequests={handleRequestAction} // Use new handler
                    />
                )}
            </>
        )}
      </Box>
    </Container>
  );
};

export default TransportOfficerDashboard;
