import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth.service';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      // Don't blindly restore the stored user without verifying the token with the server.
      // This prevents the app from immediately showing an authenticated user (e.g., demo user)
      // if the token is expired, invalid, or absent.
      if (storedToken) {
        try {
          const resp = await authService.getCurrentUser();
          const serverUser = resp.data?.user;
          if (serverUser) {
            setToken(storedToken);
            setUser(serverUser);
            localStorage.setItem('user', JSON.stringify(serverUser));
          } else {
            // invalid token or malformed response
            logout();
          }
        } catch (error) {
          // Token invalid or server unreachable — ensure we don't leave a stale session
          logout();
        }
      } else {
        // No token available — ensure any stale stored user info is removed
        localStorage.removeItem('user');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', email);
      const response = await authService.login({ email, password });
      console.log('✅ Login response:', response.data);
      
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      console.error('❌ Login error details:', error);
      console.error('📡 Error response:', error.response);
      console.error('🚨 Error message:', error.message);
      throw error.response?.data || { message: 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      console.log('👤 Attempting signup with:', userData.email);
      const response = await authService.signup(userData);
      console.log('✅ Signup response:', response.data);
      
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);

      return response.data;
    } catch (error) {
      console.error('❌ Signup error details:', error);
      console.error('📡 Error response:', error.response);
      throw error.response?.data || { message: 'Signup failed' };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    authService.logout().catch(console.error);
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    changePassword,
    loading,
    // Consider user authenticated only when both token and user are present
    isAuthenticated: !!token && !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};