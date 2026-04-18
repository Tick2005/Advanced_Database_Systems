import apiClient from './apiClient';
const reportService = {
  getTopRoomTypes: () => apiClient.get('/api/public/top-room-types', { withAuth: false }),
  getOwnerReports: () => apiClient.get('/api/owner/reports'),
  getOwnerDashboard: () => apiClient.get('/api/owner/dashboard'),
};
export default reportService;
