import axios from 'axios';
import AuthService from './AuthService';

const API_REQUESTS_URL = process.env.REACT_APP_API_REQUESTS_URL || 'http://localhost:8080/api/requests';

const getAuthHeader = () => {
  const user = AuthService.getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

class TireRequestService {
  createTireRequest(tireRequestData, images) {
    const formData = new FormData();
    formData.append('tireRequest', new Blob([JSON.stringify(tireRequestData)], { type: 'application/json' }));

    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image.file); // Assuming image object has a 'file' property
      });
    }

    return axios.post(API_REQUESTS_URL, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  updateTireRequest(id, tireRequestData, images) {
    const formData = new FormData();
    formData.append('tireRequest', new Blob([JSON.stringify(tireRequestData)], { type: 'application/json' }));

    if (images && images.length > 0) {
      images.forEach((image) => {
         if (image.file) { // Only append if it's a new file to upload
            formData.append('images', image.file);
         }
      });
    }
     // If images are not changed, imagePaths in tireRequestData (JSON part) will be used by backend.
     // If images are changed and new ones uploaded, backend should handle replacing/updating.

    return axios.put(`${API_REQUESTS_URL}/${id}`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  getAllTireRequests() {
    return axios.get(API_REQUESTS_URL, { headers: getAuthHeader() });
  }

  getTireRequestById(id) {
    return axios.get(`${API_REQUESTS_URL}/${id}`, { headers: getAuthHeader() });
  }

  deleteTireRequest(id) {
    return axios.delete(`${API_REQUESTS_URL}/${id}`, { headers: getAuthHeader() });
  }

  approveRequest(id, remarks, approvalType) { // approvalType: 'manager-approve' or 'transport-approve'
    return axios.put(`${API_REQUESTS_URL}/${id}/${approvalType}`, null, {
        headers: getAuthHeader(),
        params: { remarks }
    });
  }

  rejectRequest(id, remarks, rejectionType) { // rejectionType: 'manager-reject' or 'transport-reject'
    return axios.put(`${API_REQUESTS_URL}/${id}/${rejectionType}`, null, {
        headers: getAuthHeader(),
        params: { remarks }
    });
  }

  getPendingRequests() {
    return axios.get(`${API_REQUESTS_URL}/pending`, { headers: getAuthHeader() });
  }

  getRequestsByUserId(userId) {
    return axios.get(`${API_REQUESTS_URL}/user/${userId}`, { headers: getAuthHeader() });
  }
}

export default new TireRequestService();
