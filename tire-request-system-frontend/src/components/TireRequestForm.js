import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import *. // (All other imports as in the prompt)
import {
    TextField, Button, Container, Typography, Box, Grid, Paper,
    InputAdornment, IconButton, FormHelperText, CircularProgress, Alert
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import TireRequestService from '../services/TireRequestService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


// Validation Schema using Yup
const validationSchema = Yup.object().shape({
    vehicleNo: Yup.string().required('Vehicle number is required'),
    vehicleType: Yup.string(),
    vehicleBrand: Yup.string(),
    vehicleModel: Yup.string(),
    userSection: Yup.string(),
    lastTireReplacementDate: Yup.date().nullable().max(new Date(), "Date cannot be in the future"),
    makeOfExistingTire: Yup.string(),
    tireSizeRequired: Yup.string().required('Tire size is required'),
    noOfTiresRequired: Yup.number().min(1, 'At least one tire must be requested').required('Number of tires is required').integer("Must be an integer"),
    noOfTubesRequired: Yup.number().min(0, 'Cannot be negative').nullable().integer("Must be an integer"),
    costCenter: Yup.string(),
    presentKmReading: Yup.number().min(0, 'Cannot be negative').nullable(),
    kmReadingAtPreviousTireReplacement: Yup.number().min(0, 'Cannot be negative').nullable()
        .test('less-than-present', 'Previous KM must be less than present KM', function (value) {
            const { presentKmReading } = this.parent;
            if (presentKmReading && value) {
                return value < presentKmReading;
            }
            return true;
        }),
    approvingOfficerServiceNo: Yup.string(), // Could be linked to a user search later
    tireWearIndicatorAppeared: Yup.boolean(),
    tireWearPattern: Yup.string(),
    comments: Yup.string().max(500, 'Comments too long'),
    // imagePaths: Yup.array().of(Yup.string()) // Not directly validated here, files are handled separately
});

const TireRequestForm = ({ existingRequest, onFormSubmit }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [imagePreviews, setImagePreviews] = useState([]);
    const [initialImagePaths, setInitialImagePaths] = useState([]); // For edit mode

    const initialValues = {
        vehicleNo: '',
        vehicleType: '',
        vehicleBrand: '',
        vehicleModel: '',
        userSection: '',
        lastTireReplacementDate: null,
        makeOfExistingTire: '',
        tireSizeRequired: '',
        noOfTiresRequired: 1,
        noOfTubesRequired: 0,
        costCenter: '',
        presentKmReading: '',
        kmReadingAtPreviousTireReplacement: '',
        approvingOfficerServiceNo: '',
        tireWearIndicatorAppeared: false,
        tireWearPattern: '',
        comments: '',
        imagePaths: [], // Will hold URLs of existing images in edit mode, or names of new files
        // files: null, // This will be handled by Formik's setFieldValue for actual file objects
    };

    // Populate form if existingRequest is provided (for editing)
    const formInitialValues = existingRequest
        ? {
            ...initialValues, ...existingRequest,
            lastTireReplacementDate: existingRequest.lastTireReplacementDate ? new Date(existingRequest.lastTireReplacementDate).toISOString().split('T')[0] : null,
            // imagePaths are already part of existingRequest if editing
          }
        : initialValues;

    useEffect(() => {
        if (existingRequest && existingRequest.imagePaths) {
            // Assuming imagePaths are relative paths or identifiers to be resolved to full URLs
            // For simplicity, if they are full URLs, they can be used directly.
            // Here we assume they are identifiers that need prefixing for display
            const previews = existingRequest.imagePaths.map(path =>
                path.startsWith('http') ? path : `${process.env.REACT_APP_API_BASE_URL}/images/${path}`
            );
            setImagePreviews(previews);
            setInitialImagePaths(existingRequest.imagePaths); // Store original paths for comparison or deletion logic
        }
    }, [existingRequest]);


    const handleImageChange = (event, setFieldValue) => {
        const files = Array.from(event.currentTarget.files);
        const currentImageFiles = []; // For storing File objects
        const currentPreviews = []; // For storing data URLs

        files.forEach(file => {
            currentImageFiles.push({ file, name: file.name }); // Store the file object
            const reader = new FileReader();
            reader.onloadend = () => {
                currentPreviews.push(reader.result);
                // Update previews after all files are read - this might need adjustment for multiple files
                // For simplicity, let's combine with existing previews if any or set anew
                if (files.length === currentPreviews.length) {
                     setImagePreviews(prev => [...prev.filter(p => initialImagePaths.some(ip => p.includes(ip))), ...currentPreviews]);
                     setFieldValue("files", currentImageFiles); // Store the actual File objects in Formik
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (indexToRemove, setFieldValue, currentFiles, currentImagePaths) => {
        const newPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
        setImagePreviews(newPreviews);

        // If the removed image was an existing one (from initialImagePaths)
        if (indexToRemove < initialImagePaths.length) {
            const removedPath = initialImagePaths[indexToRemove];
            const updatedInitialPaths = initialImagePaths.filter((_, i) => i !== indexToRemove);
            setInitialImagePaths(updatedInitialPaths);

            // Update formik's imagePaths to reflect removal of an existing image
            const finalImagePaths = currentImagePaths.filter(p => p !== removedPath);
            setFieldValue("imagePaths", finalImagePaths);
        }

        // If removing a newly added file (not yet saved)
        if (currentFiles && currentFiles.length > 0) {
             // This logic needs to be more robust if mixing removals of old and new.
             // This simple version assumes removal of newly added files if index is beyond initial paths.
            if (indexToRemove >= initialImagePaths.length) {
                const newFiles = currentFiles.filter((_, i) => (i + initialImagePaths.length) !== indexToRemove);
                setFieldValue("files", newFiles);
            }
        }
    };


    const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
        setSubmitting(true);
        const { files, ...tireRequestData } = values;

        // If editing, ensure imagePaths includes only those initial images that weren't removed,
        // and exclude any new file data URLs that might have sneaked in.
        if(existingRequest) {
            tireRequestData.imagePaths = initialImagePaths;
        } else {
            tireRequestData.imagePaths = []; // For new requests, backend generates paths from uploaded files
        }

        // If current user info is needed but not part of form (e.g. taken from context)
        if (!existingRequest && currentUser) { // Only for new requests
            tireRequestData.requestedByUserId = currentUser.id;
            tireRequestData.requestedByUsername = currentUser.username;
        }

        const newImageFilesToUpload = values.files || []; // files from Formik values

        try {
            let response;
            if (existingRequest && existingRequest.id) {
                response = await TireRequestService.updateTireRequest(existingRequest.id, tireRequestData, newImageFilesToUpload);
                toast.success('Tire request updated successfully!');
            } else {
                response = await TireRequestService.createTireRequest(tireRequestData, newImageFilesToUpload);
                toast.success('Tire request submitted successfully!');
            }

            if(onFormSubmit) { // Callback after submission
                onFormSubmit(response.data);
            } else {
                navigate('/user/dashboard'); // Or appropriate redirect
            }
            resetForm();
            setImagePreviews([]);
            setInitialImagePaths([]);

        } catch (error) {
            console.error("Error submitting tire request:", error.response || error);
            const errorMsg = error.response?.data?.message || "Failed to submit tire request. Please try again.";
            setFieldError("general", errorMsg);
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <Container component={Paper} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h5" gutterBottom component="div">
                {existingRequest ? 'Edit Tire Request' : 'New Tire Request'}
            </Typography>
            <Formik
                initialValues={formInitialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize // Important for edit mode to reinitialize form with existingRequest
            >
                {({ isSubmitting, setFieldValue, values, touched, errors }) => (
                    <Form>
                        <Grid container spacing={3}>
                            {/* General Error Display */}
                            {errors.general && (
                                <Grid item xs={12}>
                                    <Alert severity="error">{errors.general}</Alert>
                                </Grid>
                            )}

                            {/* Vehicle Information */}
                            <Grid item xs={12} sm={6}><Field as={TextField} name="vehicleNo" label="Vehicle Number" fullWidth required error={touched.vehicleNo && Boolean(errors.vehicleNo)} helperText={<ErrorMessage name="vehicleNo" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="vehicleType" label="Vehicle Type" fullWidth error={touched.vehicleType && Boolean(errors.vehicleType)} helperText={<ErrorMessage name="vehicleType" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="vehicleBrand" label="Vehicle Brand" fullWidth error={touched.vehicleBrand && Boolean(errors.vehicleBrand)} helperText={<ErrorMessage name="vehicleBrand" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="vehicleModel" label="Vehicle Model" fullWidth error={touched.vehicleModel && Boolean(errors.vehicleModel)} helperText={<ErrorMessage name="vehicleModel" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="userSection" label="User Section/Department" fullWidth error={touched.userSection && Boolean(errors.userSection)} helperText={<ErrorMessage name="userSection" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="costCenter" label="Cost Center" fullWidth error={touched.costCenter && Boolean(errors.costCenter)} helperText={<ErrorMessage name="costCenter" />} /></Grid>

                            {/* Tire Information */}
                            <Grid item xs={12} sm={6}><Field as={TextField} name="tireSizeRequired" label="Tire Size Required" fullWidth required error={touched.tireSizeRequired && Boolean(errors.tireSizeRequired)} helperText={<ErrorMessage name="tireSizeRequired" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="noOfTiresRequired" label="Number of Tires Required" type="number" fullWidth required error={touched.noOfTiresRequired && Boolean(errors.noOfTiresRequired)} helperText={<ErrorMessage name="noOfTiresRequired" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="noOfTubesRequired" label="Number of Tubes Required" type="number" fullWidth error={touched.noOfTubesRequired && Boolean(errors.noOfTubesRequired)} helperText={<ErrorMessage name="noOfTubesRequired" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="makeOfExistingTire" label="Make of Existing Tire" fullWidth error={touched.makeOfExistingTire && Boolean(errors.makeOfExistingTire)} helperText={<ErrorMessage name="makeOfExistingTire" />} /></Grid>

                            {/* KM Reading & Dates */}
                            <Grid item xs={12} sm={6}><Field as={TextField} name="presentKmReading" label="Present KM Reading" type="number" fullWidth error={touched.presentKmReading && Boolean(errors.presentKmReading)} helperText={<ErrorMessage name="presentKmReading" />} /></Grid>
                            <Grid item xs={12} sm={6}><Field as={TextField} name="kmReadingAtPreviousTireReplacement" label="KM at Previous Tire Replacement" type="number" fullWidth error={touched.kmReadingAtPreviousTireReplacement && Boolean(errors.kmReadingAtPreviousTireReplacement)} helperText={<ErrorMessage name="kmReadingAtPreviousTireReplacement" />} /></Grid>
                            <Grid item xs={12} sm={6}>
                                <Field as={TextField} name="lastTireReplacementDate" label="Last Tire Replacement Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={touched.lastTireReplacementDate && Boolean(errors.lastTireReplacementDate)} helperText={<ErrorMessage name="lastTireReplacementDate" />} />
                            </Grid>

                            {/* Approval & Condition */}
                            <Grid item xs={12} sm={6}><Field as={TextField} name="approvingOfficerServiceNo" label="Approving Officer Service No" fullWidth error={touched.approvingOfficerServiceNo && Boolean(errors.approvingOfficerServiceNo)} helperText={<ErrorMessage name="approvingOfficerServiceNo" />} /></Grid>
                            <Grid item xs={12} sm={6}>
                                <label htmlFor="tireWearIndicatorAppeared">Tire Wear Indicator Appeared?</label>
                                <Field type="checkbox" name="tireWearIndicatorAppeared" />
                                <FormHelperText><ErrorMessage name="tireWearIndicatorAppeared" /></FormHelperText>
                            </Grid>
                            <Grid item xs={12}><Field as={TextField} name="tireWearPattern" label="Tire Wear Pattern" fullWidth multiline rows={2} error={touched.tireWearPattern && Boolean(errors.tireWearPattern)} helperText={<ErrorMessage name="tireWearPattern" />} /></Grid>
                            <Grid item xs={12}><Field as={TextField} name="comments" label="Comments/Justification" fullWidth multiline rows={4} error={touched.comments && Boolean(errors.comments)} helperText={<ErrorMessage name="comments" />} /></Grid>

                            {/* Image Upload Section */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>Upload Images (Max 5)</Typography>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="raised-button-file"
                                    multiple
                                    type="file"
                                    onChange={(event) => handleImageChange(event, setFieldValue)}
                                    disabled={imagePreviews.length >= 5}
                                />
                                <label htmlFor="raised-button-file">
                                    <Button variant="contained" component="span" startIcon={<PhotoCamera />} disabled={imagePreviews.length >= 5}>
                                        Select Images
                                    </Button>
                                </label>
                                {imagePreviews.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                                        {imagePreviews.map((previewUrl, index) => (
                                            <Paper
                                                key={index}
                                                elevation={2}
                                                sx={{
                                                    p: 0.5,
                                                    position: 'relative',
                                                    width: { xs: 'calc(50% - 16px)', sm: 120 }, // Responsive width
                                                    height: { xs: 100, sm: 120 }, // Responsive height
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <img
                                                    src={previewUrl}
                                                    alt={`Preview ${index + 1}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeImage(index, setFieldValue, values.files, values.imagePaths)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 2, right: 2,
                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                        '&:hover': { backgroundColor: 'rgba(255,255,255,1)'}
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" color="error"/>
                                                </IconButton>
                                            </Paper>
                                        ))}
                                    </Box>
                                )}
                                {touched.files && errors.files && <FormHelperText error>{errors.files}</FormHelperText>}
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
                                <Button type="submit" variant="contained" color="primary" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? <CircularProgress size={24} /> : (existingRequest ? 'Update Request' : 'Submit Request')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Container>
    );
};

export default TireRequestForm;
