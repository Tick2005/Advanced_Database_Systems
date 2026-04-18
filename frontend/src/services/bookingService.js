import apiClient from './apiClient';
const bookingService = {
  // Customer
  createBooking: (payload) => apiClient.post('/api/customer/bookings', payload),
  getMyBookings: () => apiClient.get('/api/customer/bookings'),
  getMyBookingDetail: (id) => apiClient.get(`/api/customer/bookings/${id}`),
  cancelBooking: (id, reason) => apiClient.put(`/api/customer/bookings/${id}/cancel`, { reason }),
  // Staff
  getTodayBookings: () => apiClient.get('/api/staff/bookings/today'),
  checkIn: (id) => apiClient.put(`/api/staff/bookings/${id}/checkin`),
  checkOut: (id) => apiClient.put(`/api/staff/bookings/${id}/checkout`),
  createWalkIn: (payload) => apiClient.post('/api/staff/bookings/walk-in', payload),
  updateBookingServices: (id, payload) => apiClient.put(`/api/staff/bookings/${id}/services`, payload),
  // Manager
  getManagerBookings: () => apiClient.get('/api/manager/bookings'),
};
export default bookingService;
