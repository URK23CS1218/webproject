import api from './api';

const authService = {
  signup: (userData) => api.post('/api/auth/signup', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  changePassword: (passwordData) => api.post('/api/auth/change-password', passwordData),
  getCurrentUser: () => api.get('/api/auth/me')
};

export default authService;