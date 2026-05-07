import { httpClient } from "../../services/httpClient";

export const bookingService = {
  createBooking: (payload) => httpClient.post("/api/customer/bookings", payload),
  getBookings: () => httpClient.get("/api/customer/bookings"),
  getBookingDetail: (id) => httpClient.get(`/api/customer/bookings/${id}`),
  cancelBooking: (id, reason) => httpClient.put(`/api/customer/bookings/${id}/cancel`, { reason })
};
