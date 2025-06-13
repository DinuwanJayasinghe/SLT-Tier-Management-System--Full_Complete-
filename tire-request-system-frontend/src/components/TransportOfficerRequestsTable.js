import React, { useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button,
    IconButton, Typography, Box, TextField, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, TablePagination, Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import RequestDetailsModal from './RequestDetailsModal'; // Reuse the modal
import { toast } from 'react-toastify';
import TireRequestService from '../services/TireRequestService';

const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'PENDING') color = 'warning';
    else if (status === 'MANAGER_APPROVED') color = 'info';
    else if (status === 'FINAL_APPROVED') color = 'success';
    else if (status === 'REJECTED') color = 'error';
    return <Chip label={status} color={color} size="small" />;
};

const TransportOfficerRequestsTable = ({ requests, setRequests, filterStatus }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [actionRequestId, setActionRequestId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const openRejectDialog = (requestId) => {
    setActionRequestId(requestId);
    setIsRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setIsRejectDialogOpen(false);
    setRejectionRemarks('');
    setActionRequestId(null);
  };

  const handleFinalApprove = async (requestId) => {
    if (!window.confirm("Are you sure you want to finally approve this request?")) return;
    try {
      await TireRequestService.approveRequest(requestId, "Finally Approved by Transport Officer", 'transport-approve');
      toast.success('Request finally approved successfully!');
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, status: 'FINAL_APPROVED', transportOfficerApproved: true } : req
        )
      );
    } catch (error) {
      console.error("Error finally approving request:", error);
      toast.error(error.response?.data?.message || 'Failed to finally approve request.');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionRemarks) {
      toast.error("Rejection remarks are required.");
      return;
    }
    try {
      await TireRequestService.rejectRequest(actionRequestId, rejectionRemarks, 'transport-reject');
      toast.success('Request rejected successfully by Transport Officer!');
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === actionRequestId ? { ...req, status: 'REJECTED', transportOfficerRemarks: rejectionRemarks } : req
        )
      );
      closeRejectDialog();
    } catch (error) {
      console.error("Error rejecting request by TO:", error);
      toast.error(error.response?.data?.message || 'Failed to reject request.');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRequests = filterStatus
    ? requests.filter(req => req.status === filterStatus)
    : requests;

  const paginatedRequests = filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  if (!requests || requests.length === 0) {
    return <Typography sx={{mt:2}}>No tire requests found matching criteria.</Typography>;
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{mt: 2}}>
        <Table sx={{ minWidth: 650 }} aria-label="transport officer tire requests table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.200' }}> {/* Changed to shorthand */}
              <TableCell>Vehicle No</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>Manager Approved On</TableCell>
              <TableCell>Tires Req.</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRequests.map((request) => (
              <TableRow key={request.id} hover>
                <TableCell>{request.vehicleNo}</TableCell>
                <TableCell>{request.requestedByUsername || 'N/A'}</TableCell>
                <TableCell>{request.managerApprovalDate ? new Date(request.managerApprovalDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{request.noOfTiresRequired}</TableCell>
                <TableCell>{getStatusChip(request.status)}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleViewDetails(request)} color="primary" size="small" title="View Details">
                    <VisibilityIcon />
                  </IconButton>
                  {/* Transport Officer acts on MANAGER_APPROVED requests */}
                  {request.status === 'MANAGER_APPROVED' && (
                    <>
                      <IconButton onClick={() => handleFinalApprove(request.id)} color="success" size="small" title="Final Approve">
                        <CheckCircleOutlineIcon />
                      </IconButton>
                      <IconButton onClick={() => openRejectDialog(request.id)} color="error" size="small" title="Reject">
                        <HighlightOffIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredRequests.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      <Dialog open={isRejectDialogOpen} onClose={closeRejectDialog}>
        <DialogTitle>Reject Tire Request (Transport Officer)</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide remarks for rejecting this request (Vehicle: {requests.find(r=>r.id === actionRequestId)?.vehicleNo}). This request was previously approved by a manager.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="remarks"
            label="Rejection Remarks"
            type="text"
            fullWidth
            variant="standard"
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Cancel</Button>
          <Button onClick={handleRejectSubmit} color="error">Submit Rejection</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportOfficerRequestsTable;
