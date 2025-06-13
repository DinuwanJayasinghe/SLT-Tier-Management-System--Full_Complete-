import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext'; // Assuming register function is added to AuthContext
import AuthService from '../services/AuthService'; // Or call AuthService directly
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Container, Typography, Box, Alert, Link as MuiLink, Avatar, Grid, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const navigate = useNavigate();
  // const { register } = useAuth(); // Use this if register is added to context and manages state update

  const initialValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ['ROLE_USER'], // Default role as an array for multiselect or single select
  };

  const validationSchema = Yup.object({
    username: Yup.string().min(3, 'Must be at least 3 characters').max(20, 'Must be 20 characters or less').required('Username is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
    role: Yup.array().min(1, 'At least one role must be selected').required('Role is required'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      // Direct service call for simplicity, or use context's register method
      await AuthService.register(values.username, values.email, values.password, values.role);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Registration failed.';
      setFieldError('general', errorMsg); // Show general error on form
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}><HowToRegOutlinedIcon /></Avatar>
        <Typography component="h1" variant="h5">Sign Up</Typography>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ errors, touched, isSubmitting, values, setFieldValue }) => (
               <Form sx={{ width: '100%', mt: 1 }}> {/* Changed style to sx and marginTop to mt */}
              <Field as={TextField} name="username" label="Username" variant="outlined" margin="normal" fullWidth required error={touched.username && Boolean(errors.username)} helperText={<ErrorMessage name="username" />} />
              <Field as={TextField} name="email" label="Email Address" type="email" variant="outlined" margin="normal" fullWidth required error={touched.email && Boolean(errors.email)} helperText={<ErrorMessage name="email" />} />
              <Field as={TextField} name="password" label="Password" type="password" variant="outlined" margin="normal" fullWidth required error={touched.password && Boolean(errors.password)} helperText={<ErrorMessage name="password" />} />
              <Field as={TextField} name="confirmPassword" label="Confirm Password" type="password" variant="outlined" margin="normal" fullWidth required error={touched.confirmPassword && Boolean(errors.confirmPassword)} helperText={<ErrorMessage name="confirmPassword" />} />

              <FormControl fullWidth margin="normal" error={touched.role && Boolean(errors.role)}>
                 <InputLabel id="role-select-label">Role</InputLabel>
                 <Field
                     as={Select}
                     labelId="role-select-label"
                     name="role"
                     label="Role"
                     multiple={false} // Backend expects a Set<String> but usually one primary role is chosen at signup
                     value={values.role[0] || ''} // Assuming single role selection for simplicity, first element
                     onChange={(event) => setFieldValue("role", [event.target.value])}
                 >
                     <MenuItem value="ROLE_USER">User</MenuItem>
                     <MenuItem value="ROLE_MANAGER">Manager</MenuItem>
                     <MenuItem value="ROLE_TRANSPORT_OFFICER">Transport Officer</MenuItem>
                     {/* <MenuItem value="ROLE_ADMIN">Admin</MenuItem> */}
                 </Field>
                 {touched.role && errors.role && <Typography color="error" variant="caption">{errors.role}</Typography>}
              </FormControl>

              {errors.general && (
                <Alert severity="error" sx={{ width: '100%', mt: 1 }}>{errors.general}</Alert>
              )}
              <Button type="submit" fullWidth variant="contained" disabled={isSubmitting} sx={{ mt: 3, mb: 2 }}>
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </Button>
              <MuiLink component={RouterLink} to="/login" variant="body2" sx={{display: 'block', textAlign: 'center'}}>
                {"Already have an account? Sign In"}
              </MuiLink>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};
export default RegisterPage;
