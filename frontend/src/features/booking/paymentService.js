import { httpClient } from "../../services/httpClient";

export const paymentService = {
  /**
   * Create a VNPay checkout URL for a booking.
   * Returns { checkoutUrl, paymentId, transactionRef, ... }
   */
  createVnPayPayment: (payload) =>
    httpClient.post("/api/customer/payments/vnpay/checkout-url", payload),

  /**
   * Thanh toán tại quầy (DIRECT):
   * Tạo payment với provider=DIRECT, status=SUCCESS ngay lập tức.
   * Booking chuyển sang CONFIRMED, phòng chuyển sang OCCUPIED.
   * Staff sẽ thu tiền mặt khi khách check-in tại lễ tân.
   */
  createDirectPayment: (payload) =>
    httpClient.post("/api/customer/payments", {
      ...payload,
      provider: "DIRECT",
    }),
};
