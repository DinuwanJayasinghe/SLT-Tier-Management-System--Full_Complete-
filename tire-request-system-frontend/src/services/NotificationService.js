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

class NotificationService {
  // Fetches requests pending for the current user's role(s)
  // The backend's /api/requests/pending should ideally filter by role based on JWT
  // Or, if it returns all PENDING and MANAGER_APPROVED, frontend can filter.
  // For this phase, we assume backend /pending returns relevant items for Manager/TO.
  getPendingNotifications() {
    const headers = getAuthHeader();
    if (Object.keys(headers).length === 0) {
        return Promise.resolve({ data: [] }); // No auth, no notifications
    }
    return axios.get(`${API_REQUESTS_URL}/pending`, { headers });
  }
}

export default new NotificationService();
