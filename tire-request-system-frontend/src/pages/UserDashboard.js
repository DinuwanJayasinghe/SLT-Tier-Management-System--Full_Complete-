import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography, Container, Box, Paper, Button, List, ListItem, ListItemText,
    Divider, CircularProgress, Alert, Chip, Grid, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TireRequestForm from '../components/TireRequestForm';
import RequestDetailsModal from '../components/RequestDetailsModal'; // For viewing details
import TireRequestService from '../services/TireRequestService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'PENDING') color = 'warning';
    else if (status === 'MANAGER_APPROVED') color = 'info';
    else if (status === 'FINAL_APPROVED') color = 'success';
    else if (status === 'REJECTED') color = 'error';
    return <Chip label={status} color={color} size="small" />;
};

const UserDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [viewingRequest, setViewingRequest] = useState(null); // For details modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRequests, setUserRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUserRequests = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await TireRequestService.getRequestsByUserId(currentUser.id);
      setUserRequests(response.data || []);
    } catch (err) {
      console.error("Error fetching user requests:", err);
      setError('Failed to fetch your requests. Please try again.');
      toast.error('Failed to fetch your requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
        fetchUserRequests();
    }
  }, [currentUser]);

  const handleFormSubmitSuccess = (submittedRequest) => {
    fetchUserRequests(); // Re-fetch or update list locally
    setShowForm(false);
    setEditingRequest(null);
  };

  const handleAddNewRequestClick = () => {
    setEditingRequest(null);
    setShowForm(true);
  };

  const handleEditRequestClick = (request) => {
    if (request.status === 'PENDING') {
      setEditingRequest(request);
      setShowForm(true);
    } else {
      toast.info("Only PENDING requests can be edited.");
    }
  };

  const handleDeleteRequestClick = async (requestId, status) => {
    if (status === 'PENDING' || status === 'REJECTED') {
      if (window.confirm("Are you sure you want to delete this request?")) {
        try {
          await TireRequestService.deleteTireRequest(requestId);
          toast.success("Request deleted successfully.");
          fetchUserRequests(); // Refresh list
        } catch (err) {
          console.error("Error deleting request:", err);
          toast.error(err.response?.data?.message || "Failed to delete request.");
        }
      }
    } else {
      toast.info("Only PENDING or REJECTED requests can be deleted.");
    }
  };

  const handleViewDetailsClick = (request) => {
    setViewingRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewingRequest(null);
  };

  const filteredRequests = useMemo(() => {
    return userRequests.filter(request => {
        const statusMatch = filterStatus ? request.status === filterStatus : true;
        const termMatch = searchTerm ?
            (request.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             request.tireSizeRequired?.toLowerCase().includes(searchTerm.toLowerCase()))
            : true;
        return statusMatch && termMatch;
    });
  }, [userRequests, filterStatus, searchTerm]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Tire Requests
        </Typography>

        {!showForm ? (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNewRequestClick}
              sx={{ mb: 3 }}
            >
              Create New Tire Request
            </Button>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Search by Vehicle No or Tire Size"
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                label="Status"
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value=""><em>All Statuses</em></MenuItem>
                                <MenuItem value="PENDING">Pending</MenuItem>
                                <MenuItem value="MANAGER_APPROVED">Manager Approved</MenuItem>
                                <MenuItem value="FINAL_APPROVED">Final Approved</MenuItem>
                                <MenuItem value="REJECTED">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button fullWidth onClick={() => {setFilterStatus(''); setSearchTerm('');}} variant="outlined">Clear Filters</Button>
                    </Grid>
                </Grid>
            </Paper>

            {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />} {/* Added my: 2 */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!isLoading && !error && filteredRequests.length === 0 && (
              <Typography>
                {userRequests.length === 0 ? "You have not submitted any tire requests yet." : "No requests match your filters."}
              </Typography>
            )}
            {!isLoading && !error && filteredRequests.length > 0 && (
              <Paper elevation={3}>
                <List>
                  {filteredRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Button variant="outlined" size="small" onClick={() => handleViewDetailsClick(request)} sx={{ mr: 1 }}>View</Button>
                            <Button
                                variant="outlined" size="small" startIcon={<EditIcon />}
                                onClick={() => handleEditRequestClick(request)} sx={{mr:1}}
                                disabled={request.status !== 'PENDING'}
                                title={request.status !== 'PENDING' ? "Can only edit PENDING requests" : "Edit Request"}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined" size="small" color="error" startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteRequestClick(request.id, request.status)}
                                disabled={request.status !== 'PENDING' && request.status !== 'REJECTED'}
                                title={(request.status !== 'PENDING' && request.status !== 'REJECTED') ? "Can only delete PENDING or REJECTED requests" : "Delete Request"}
                            >
                                Delete
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText
                          primaryTypographyProps={{variant: 'subtitle1'}}
                          primary={`Vehicle: ${request.vehicleNo} (Tires: ${request.noOfTiresRequired} x ${request.tireSizeRequired})`}
                          secondary={
                            <>
                              Submitted: {new Date(request.requestDate).toLocaleDateString()} | Status: {getStatusChip(request.status)}
                              {request.managerRemarks && <Typography variant="caption" display="block" sx={{mt:0.5}}>Manager: {request.managerRemarks}</Typography>}
                              {request.transportOfficerRemarks && <Typography variant="caption" display="block">TO: {request.transportOfficerRemarks}</Typography>}
                            </>
                          }
                        />
                      </ListItem>
                      {index < filteredRequests.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </>
        ) : (
          <Paper sx={{ p: 3, mb: 3 }}>
            <TireRequestForm
              existingRequest={editingRequest}
              onFormSubmit={handleFormSubmitSuccess}
            />
            <Button onClick={() => { setShowForm(false); setEditingRequest(null); }} sx={{ mt: 2 }}>
              Cancel
            </Button>
          </Paper>
        )}
      </Box>
      {viewingRequest && (
        <RequestDetailsModal
            request={viewingRequest}
            open={isModalOpen}
            onClose={handleCloseModal}
        />
      )}
    </Container>
  );
};

export default UserDashboard;
