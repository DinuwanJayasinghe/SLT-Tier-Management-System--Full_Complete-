import React from 'react';
import { Typography, Container, Box, Paper } from '@mui/material';
import TireRequestForm from '../components/TireRequestForm';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const NewTireRequestPage = () => {
  const navigate = useNavigate();

  const handleFormSubmitSuccess = (submittedRequest) => {
    // After successful submission, navigate to user's dashboard or a confirmation page
    // For now, assume UserDashboard is the right place or a generic success view.
    toast.success(`New tire request (ID: ${submittedRequest.id}) submitted successfully!`);
    navigate('/user/dashboard'); // Or a more general /requests/my or similar
  };

  return (
    <Container maxWidth="md"> {/* md might be better for a form page than lg or xl */}
      <Box sx={{ my: 4 }}>
        {/* Paper component was part of TireRequestForm itself, so might not be needed here if form handles its own elevation */}
        {/* <Paper sx={{ p: { xs: 2, sm: 3 } }}>  */}
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Create New Tire Request
          </Typography>
          <TireRequestForm
            onFormSubmit={handleFormSubmitSuccess}
            // No existingRequest prop is passed, so it's in "create" mode
          />
        {/* </Paper> */}
      </Box>
    </Container>
  );
};

export default NewTireRequestPage;
