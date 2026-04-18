import apiClient from './apiClient';
const pricingService = {
  // Owner - Pricing
  getPricing: () => apiClient.get('/api/owner/pricing'),
  createPricing: (payload) => apiClient.post('/api/owner/pricing', payload),
  updatePricing: (id, payload) => apiClient.put(`/api/owner/pricing/${id}`, payload),
  // Pricing Requests (Manager creates, Owner approves)
  getPricingRequests: (role) => apiClient.get(`/api/${role}/pricing-requests`),
  createPricingRequest: (payload) => apiClient.post('/api/manager/pricing-requests', payload),
  getPricingRequestDetail: (id) => apiClient.get(`/api/manager/pricing-requests/${id}`),
  approvePricingRequest: (id, payload) => apiClient.put(`/api/owner/pricing-requests/${id}/approve`, payload),
  rejectPricingRequest: (id, payload) => apiClient.put(`/api/owner/pricing-requests/${id}/reject`, payload),
};
export default pricingService;
