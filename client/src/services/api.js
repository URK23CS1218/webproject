import axios from 'axios';

// Auto-detect API URL based on environment
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production on Render
  if (import.meta.env.MODE === 'production') {
    return 'https://server.onrender.com';
  }
  
  // Development
  return 'http://localhost:7000';
};

const API_BASE_URL = getApiBaseURL();
console.log('🔧 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log outgoing requests (only in development)
  if (import.meta.env.MODE === 'development') {
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    }
    return response;
  },
  (error) => {
    console.error(`❌ [API] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
