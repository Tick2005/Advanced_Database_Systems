import { httpClient } from "../../services/httpClient";

export const paymentService = {
  createVnPayPayment: (payload) => httpClient.post("/api/customer/payments/vnpay/checkout-url", payload),
  verifyVnPayReturn: (queryString) => httpClient.get(`/api/internal/payments/vnpay-return?${queryString}`)
};
