import { httpClient } from "../../services/httpClient";

export const dashboardService = {
  getStaffTodayBookings: () => httpClient.get("/api/staff/bookings/today"),
  checkInBooking: (id) => httpClient.put(`/api/staff/bookings/${id}/checkin`),
  checkOutBooking: (id) => httpClient.put(`/api/staff/bookings/${id}/checkout`),
  createWalkInBooking: (payload) => httpClient.post("/api/staff/bookings/walk-in", payload),
  getStaffRoomStatus: () => httpClient.get("/api/staff/rooms/status"),
  updateRoomStatus: (id, status) => httpClient.put(`/api/staff/rooms/${id}/update-status`, { status }),
  updateBookingServices: (id, payload) => httpClient.put(`/api/staff/bookings/${id}/services`, payload),

  getManagerPricingRequests: () => httpClient.get("/api/manager/pricing-requests"),
  createManagerPricingRequest: (payload) => httpClient.post("/api/manager/pricing-requests", payload),
  getManagerRoomsByBranch: (branchId) => httpClient.get(`/api/public/rooms?branchId=${encodeURIComponent(branchId)}`),
  createManagerRoom: (payload) => httpClient.post("/api/manager/rooms", payload),
  updateManagerRoom: (id, payload) => httpClient.put(`/api/manager/rooms/${id}`, payload),
  getManagerBookings: () => httpClient.get("/api/manager/bookings"),
  getManagerFeedbackByRoom: (roomId) => httpClient.get(`/api/manager/feedbacks?roomId=${encodeURIComponent(roomId)}`),
  replyManagerFeedback: (payload) => httpClient.post("/api/manager/feedbacks/reply", payload),
  getManagerServicesByBranch: (branchId) => httpClient.get(`/api/manager/services?branchId=${encodeURIComponent(branchId)}`),
  createManagerService: (payload) => httpClient.post("/api/manager/services", payload),
  updateManagerService: (id, payload) => httpClient.put(`/api/manager/services/${id}`, payload),

  getOwnerPricing: () => httpClient.get("/api/owner/pricing"),
  createOwnerPricing: (payload) => httpClient.post("/api/owner/pricing", payload),
  updateOwnerPricing: (id, payload) => httpClient.put(`/api/owner/pricing/${id}`, payload),
  getOwnerPricingRequests: () => httpClient.get("/api/owner/pricing-requests"),
  approveOwnerPricingRequest: (id, reviewNote = "Approved") =>
    httpClient.put(`/api/owner/pricing-requests/${id}/approve`, { reviewNote }),
  rejectOwnerPricingRequest: (id, reason = "Need adjustment") =>
    httpClient.put(`/api/owner/pricing-requests/${id}/reject`, { reason }),
  createOwnerBranch: (payload) => httpClient.post("/api/owner/branches", payload),
  getOwnerUsers: () => httpClient.get("/api/owner/users"),
  updateOwnerUserRole: (id, role) => httpClient.put(`/api/owner/users/${id}/role`, { role }),
  getOwnerDashboard: () => httpClient.get("/api/owner/dashboard"),
  getOwnerReports: () => httpClient.get("/api/owner/reports"),
  getOwnerLogs: () => httpClient.get("/api/owner/logs")
};
