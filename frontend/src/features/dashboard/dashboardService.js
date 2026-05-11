import { httpClient } from "../../services/httpClient";

export const dashboardService = {
  // ── STAFF ──────────────────────────────────────────────────────────────
  getStaffTodayBookings: () => httpClient.get("/api/staff/bookings/today"),
  getStaffBookingDetail: (id) => httpClient.get(`/api/staff/bookings/${id}`),
  checkInBooking: (id) => httpClient.put(`/api/staff/bookings/${id}/checkin`),
  checkOutBooking: (id) => httpClient.put(`/api/staff/bookings/${id}/checkout`),
  createWalkInBooking: (payload) => httpClient.post("/api/staff/bookings/walk-in", payload),
  getStaffRoomStatus: () => httpClient.get("/api/staff/rooms/status"),
  updateRoomStatus: (id, status) => httpClient.put(`/api/staff/rooms/${id}/update-status`, { status }),
  updateBookingServices: (id, payload) => httpClient.put(`/api/staff/bookings/${id}/services`, payload),
  getStaffServices: () => httpClient.get("/api/staff/services"),
  addServiceToBooking: (bookingId, serviceId, qty) =>
    httpClient.post(`/api/staff/bookings/${bookingId}/add-service`, { serviceId, quantity: qty }),

  // ── MANAGER ────────────────────────────────────────────────────────────
  getManagerPricingRequests: () => httpClient.get("/api/manager/pricing-requests"),
  createManagerPricingRequest: (payload) => httpClient.post("/api/manager/pricing-requests", payload),
  getManagerRoomsByBranch: (branchId) => httpClient.get(`/api/public/rooms?branchId=${encodeURIComponent(branchId)}`),
  getManagerBranchInfo: () => httpClient.get("/api/manager/branch"),
  createManagerRoom: (payload) => httpClient.post("/api/manager/rooms", payload),
  updateManagerRoom: (id, payload) => httpClient.put(`/api/manager/rooms/${id}`, payload),
  deleteManagerRoom: (id) => httpClient.delete(`/api/manager/rooms/${id}`),
  getManagerBookings: () => httpClient.get("/api/manager/bookings"),
  getManagerBookingDetail: (id) => httpClient.get(`/api/manager/bookings/${id}`),
  getManagerStaff: () => httpClient.get("/api/manager/staff"),
  updateManagerStaffActive: (id, active) => httpClient.put(`/api/manager/staff/${id}/active`, { active }),
  getManagerFeedbackByRoom: (roomId) => httpClient.get(`/api/manager/feedbacks?roomId=${encodeURIComponent(roomId)}`),
  replyManagerFeedback: (payload) => httpClient.post("/api/manager/feedbacks/reply", payload),
  reportManagerFeedback: (feedbackId, reason) =>
    httpClient.post("/api/manager/feedbacks/report", { feedbackId, reason }),
  getManagerServicesByBranch: (branchId) => httpClient.get(`/api/manager/services?branchId=${encodeURIComponent(branchId)}`),
  createManagerService: (payload) => httpClient.post("/api/manager/services", payload),
  updateManagerService: (id, payload) => httpClient.put(`/api/manager/services/${id}`, payload),
  getRoomTypes: () => httpClient.get("/api/public/room-types"),

  // ── OWNER ──────────────────────────────────────────────────────────────
  getOwnerPricing: () => httpClient.get("/api/owner/pricing"),
  getOwnerPricingByBranch: (branchId) => httpClient.get(`/api/owner/pricing?branchId=${encodeURIComponent(branchId)}`),
  createOwnerPricing: (payload) => httpClient.post("/api/owner/pricing", payload),
  updateOwnerPricing: (id, payload) => httpClient.put(`/api/owner/pricing/${id}`, payload),
  getOwnerPricingRequests: () => httpClient.get("/api/owner/pricing-requests"),
  approveOwnerPricingRequest: (id, reviewNote = "Approved") =>
    httpClient.put(`/api/owner/pricing-requests/${id}/approve`, { reviewNote }),
  rejectOwnerPricingRequest: (id, reason = "Need adjustment") =>
    httpClient.put(`/api/owner/pricing-requests/${id}/reject`, { reason }),
  delegatePricingRequest: (id, delegateEmail) =>
    httpClient.put(`/api/owner/pricing-requests/${id}/delegate`, { delegateEmail }),
  createOwnerBranch: (payload) => httpClient.post("/api/owner/branches", payload),
  updateOwnerBranch: (id, payload) => httpClient.put(`/api/owner/branches/${id}`, payload),
  getOwnerBranchRevenue: () => httpClient.get("/api/owner/reports/branch-revenue"),
  getOwnerUsers: () => httpClient.get("/api/owner/users"),
  updateOwnerUserRole: (id, role) => httpClient.put(`/api/owner/users/${id}/role`, { role }),
  updateOwnerUserBranch: (id, branchId) => httpClient.put(`/api/owner/users/${id}/branch`, { branchId }),
  deleteOwnerUser: (id) => httpClient.delete(`/api/owner/users/${id}`),
  getOwnerDashboard: () => httpClient.get("/api/owner/dashboard"),
  getOwnerReports: () => httpClient.get("/api/owner/reports"),
  getOwnerLogs: () => httpClient.get("/api/owner/logs"),
  getRoomTypesByBranch: (branchId) => httpClient.get(`/api/public/room-types?branchId=${encodeURIComponent(branchId)}`)
};
