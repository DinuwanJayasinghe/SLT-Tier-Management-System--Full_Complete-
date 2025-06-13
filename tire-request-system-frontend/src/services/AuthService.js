import axios from 'axios';
const API_AUTH_URL = process.env.REACT_APP_API_AUTH_URL || 'http://localhost:8080/api/auth/';

class AuthService {
  login(username, password) {
    console.log("AuthService.login called");
    // Placeholder: return Promise.resolve({ data: { token: 'fake-token', username: username, roles: ['ROLE_USER'] } });
    return axios.post(API_AUTH_URL + 'login', { username, password }).then(res => {
         if(res.data.token) localStorage.setItem('user', JSON.stringify(res.data));
         return res.data;
    });
  }
  logout() {
    localStorage.removeItem('user');
    console.log("AuthService.logout called");
  }
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

   register(username, email, password, roles) {
    console.log("AuthService.register called");
    return axios.post(API_AUTH_URL + 'register', {
      username,
      email,
      password,
      role: roles // Ensure this matches backend DTO (Set<String> for roles)
    });
  }
  // getUserRoles() can be added later
}
export default new AuthService();
