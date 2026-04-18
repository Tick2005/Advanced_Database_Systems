import apiClient from './apiClient';
const BASE = '/api/auth';
const AUTH_KEY = 'hotel_auth';
const persistAuth = (d) => { localStorage.setItem(AUTH_KEY, JSON.stringify(d)); localStorage.setItem('authToken', d?.accessToken || ''); };
const clearAuth = () => { localStorage.removeItem(AUTH_KEY); localStorage.removeItem('authToken'); };
const getStoredAuth = () => { try { const r = localStorage.getItem(AUTH_KEY); return r ? JSON.parse(r) : null; } catch { clearAuth(); return null; } };
const authService = {
  register: (p) => apiClient.post(`${BASE}/register`, p, { withAuth: false }),
  login: (p) => apiClient.post(`${BASE}/login`, p, { withAuth: false }),
  refresh: (refreshToken) => apiClient.post(`${BASE}/refresh-token`, { refreshToken }, { withAuth: false }),
  verifyEmail: ({ email, token }) => apiClient.get(`${BASE}/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`, { withAuth: false }),
  forgotPassword: (email) => apiClient.post(`${BASE}/forgot-password?email=${encodeURIComponent(email)}`, undefined, { withAuth: false }),
  resetPassword: ({ email, token, newPassword }) => apiClient.post(`${BASE}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`, undefined, { withAuth: false }),
  persistAuth, clearAuth, getStoredAuth,
};
export default authService;
