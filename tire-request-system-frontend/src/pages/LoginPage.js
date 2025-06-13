import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { TextField, Button, Container, Typography, Box, Alert, Link as MuiLink, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialValues = {
    username: '',
    password: '',
  };

  const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      await login(values.username, values.password);
      toast.success('Login successful!');
      navigate('/dashboard'); // Navigate to a general dashboard first
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Login failed. Please check credentials.';
      setFieldError('general', errorMsg); // Use this to display a general error on the form
      toast.error(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}><LockOutlinedIcon /></Avatar>
        <Typography component="h1" variant="h5">Sign In</Typography>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ errors, touched, isSubmitting, status }) => (
               <Form sx={{ width: '100%', mt: 1 }}> {/* Changed style to sx and marginTop to mt */}
              <Field
                as={TextField}
                variant="outlined" margin="normal" required fullWidth
                id="username" label="Username" name="username"
                autoComplete="username" autoFocus
                error={touched.username && Boolean(errors.username)}
                helperText={<ErrorMessage name="username" />}
              />
              <Field
                as={TextField}
                variant="outlined" margin="normal" required fullWidth
                name="password" label="Password" type="password" id="password"
                autoComplete="current-password"
                error={touched.password && Boolean(errors.password)}
                helperText={<ErrorMessage name="password" />}
              />
              {errors.general && (
                <Alert severity="error" sx={{ width: '100%', mt: 1 }}>{errors.general}</Alert>
              )}
              <Button type="submit" fullWidth variant="contained" disabled={isSubmitting} sx={{ mt: 3, mb: 2 }}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
              <MuiLink component={RouterLink} to="/register" variant="body2" sx={{display: 'block', textAlign: 'center'}}>
                {"Don't have an account? Sign Up"}
              </MuiLink>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};
export default LoginPage;
