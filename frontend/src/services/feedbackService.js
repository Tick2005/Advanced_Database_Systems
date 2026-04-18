import apiClient from './apiClient';
const feedbackService = {
  getByRoom: (roomId) => apiClient.get(`/api/public/feedbacks/${roomId}`, { withAuth: false }),
  // Customer
  createFeedback: (payload) => apiClient.post('/api/customer/feedbacks', payload),
  getMyFeedbacks: () => apiClient.get('/api/customer/feedbacks/my'),
  // Manager
  getManagerFeedbacks: (roomId) => apiClient.get(`/api/manager/feedbacks?roomId=${roomId}`),
  replyFeedback: (payload) => apiClient.post('/api/manager/feedbacks/reply', payload),
};
export default feedbackService;
