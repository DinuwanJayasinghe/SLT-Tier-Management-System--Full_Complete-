import React from 'react';
import {
    Modal, Box, Typography, Button, Grid, Paper, IconButton,
    Table, TableBody, TableCell, TableContainer, TableRow, Divider, ListItemIcon, ListItemText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description'; // For Request Details
import ImageIcon from '@mui/icons-material/Image'; // For Images section

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
};

const RequestDetailsModal = ({ request, open, onClose }) => {
  if (!request) return null;

  const detailItem = (label, value) => (
    <TableRow>
      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', width: '30%' }}>{label}</TableCell>
      <TableCell>{value || 'N/A'}</TableCell>
    </TableRow>
  );

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="request-details-title">
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DescriptionIcon sx={{ mr: 1, fontSize: '2rem', color: 'primary.main' }} />
            <Typography id="request-details-title" variant="h5" component="h2">
              Request Details: Vehicle {request.vehicleNo}
            </Typography>
        </Box>
        {/* <Divider sx={{ my: 1 }} /> */}

        <Grid container spacing={3}> {/* Increased spacing slightly */}
          <Grid item xs={12} md={request.imagePaths && request.imagePaths.length > 0 ? 7 : 12}>
            <TableContainer component={Paper} elevation={2} sx={{p:1}}> {/* Added some padding */}
              <Table size="small">
                <TableBody>
                  {/* No specific title for table needed if main title is clear */}
                  {detailItem("Status", request.status)}
                  {detailItem("Requested By", request.requestedByUsername)}
                  {detailItem("Request Date", new Date(request.requestDate).toLocaleString())}
                  {detailItem("Vehicle Number", request.vehicleNo)}
                  {detailItem("Vehicle Type", request.vehicleType)}
                  {detailItem("Vehicle Brand", request.vehicleBrand)}
                  {detailItem("Vehicle Model", request.vehicleModel)}
                  {detailItem("User Section", request.userSection)}
                  {detailItem("Tire Size Required", request.tireSizeRequired)}
                  {detailItem("No. of Tires Required", request.noOfTiresRequired)}
                  {detailItem("No. of Tubes Required", request.noOfTubesRequired)}
                  {detailItem("Cost Center", request.costCenter)}
                  {detailItem("Present KM Reading", request.presentKmReading)}
                  {detailItem("KM at Previous Replacement", request.kmReadingAtPreviousTireReplacement)}
                  {detailItem("Last Replacement Date", request.lastTireReplacementDate ? new Date(request.lastTireReplacementDate).toLocaleDateString() : 'N/A')}
                  {detailItem("Make of Existing Tire", request.makeOfExistingTire)}
                  {detailItem("Approving Officer Service No", request.approvingOfficerServiceNo)}
                  {detailItem("Tire Wear Indicator Appeared", request.tireWearIndicatorAppeared ? 'Yes' : 'No')}
                  {detailItem("Tire Wear Pattern", request.tireWearPattern)}
                  {detailItem("Comments", request.comments)}
                  {request.managerRemarks && detailItem("Manager Remarks", request.managerRemarks)}
                  {request.transportOfficerRemarks && detailItem("Transport Officer Remarks", request.transportOfficerRemarks)}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {request.imagePaths && request.imagePaths.length > 0 && (
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ImageIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Images</Typography>
              </Box>
              <Paper elevation={2} sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: 400, overflowY: 'auto' }}>
                {request.imagePaths.map((path, index) => (
                  <Box key={index} sx={{ width: 'calc(50% - 5px)', mb: '10px', '&:hover': { boxShadow: 3 } }}> {/* Added hover effect */}
                    <img
                      src={path.startsWith('http') ? path : `${process.env.REACT_APP_API_BASE_URL}/images/${path}`}
                      alt={`Request ${index + 1}`}
                      style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button onClick={onClose} variant="outlined">Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default RequestDetailsModal;
