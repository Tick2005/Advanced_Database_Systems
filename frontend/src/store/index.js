import React, { createContext, useContext, useState, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const stored = authService.getStoredAuth();
  const [auth, setAuth] = useState(stored);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    authService.persistAuth(data);
    setAuth(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    return data;
  }, []);

  const logout = useCallback(() => {
    authService.clearAuth();
    setAuth(null);
  }, []);

  const updateAuth = useCallback((data) => {
    authService.persistAuth(data);
    setAuth(data);
  }, []);

  const value = { auth, login, register, logout, updateAuth, isAuthenticated: !!auth };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
