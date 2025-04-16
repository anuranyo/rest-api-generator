import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { user } = await auth.getUser();
      setCurrentUser(user);
    } catch (err) {
      localStorage.removeItem('token');
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const data = await auth.login(email, password);
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (nickname, email, password) => {
    try {
      setError(null);
      const data = await auth.register(nickname, email, password);
      localStorage.setItem('token', data.token);
      setCurrentUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      return await auth.forgotPassword(email);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setError(null);
      return await auth.resetPassword(token, password);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;