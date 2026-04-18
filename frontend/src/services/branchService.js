import apiClient from './apiClient';
const branchService = {
  getPublicBranches: () => apiClient.get('/api/public/branches', { withAuth: false }),
  // Owner
  createBranch: (payload) => apiClient.post('/api/owner/branches', payload),
};
export default branchService;
