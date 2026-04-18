import apiClient from './apiClient';
const roomService = {
  getPublicRooms: () => apiClient.get('/api/public/rooms', { withAuth: false }),
  getPublicRoomDetail: (id) => apiClient.get(`/api/public/rooms/${id}`, { withAuth: false }),
  // Manager
  createRoom: (payload) => apiClient.post('/api/manager/rooms', payload),
  updateRoom: (id, payload) => apiClient.put(`/api/manager/rooms/${id}`, payload),
  deleteRoom: (id) => apiClient.delete(`/api/manager/rooms/${id}`),
  // Staff
  getRoomStatus: () => apiClient.get('/api/staff/rooms/status'),
  updateRoomStatus: (id, status) => apiClient.put(`/api/staff/rooms/${id}/update-status`, { status }),
};
export default roomService;
