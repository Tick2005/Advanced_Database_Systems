import apiClient from './apiClient';
const serviceService = {
  getByBranch: (branchId) => apiClient.get(`/api/manager/services?branchId=${branchId}`),
  createService: (payload) => apiClient.post('/api/manager/services', payload),
  updateService: (id, payload) => apiClient.put(`/api/manager/services/${id}`, payload),
};
export default serviceService;
