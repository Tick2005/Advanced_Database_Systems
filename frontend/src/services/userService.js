import apiClient from './apiClient';
const userService = {
  getProfile: () => apiClient.get('/api/customer/profile'),
  updateProfile: (payload) => apiClient.put('/api/customer/profile', payload),
  // Owner
  getUsers: () => apiClient.get('/api/owner/users'),
  updateRole: (id, role) => apiClient.put(`/api/owner/users/${id}/role`, { role }),
};
export default userService;
