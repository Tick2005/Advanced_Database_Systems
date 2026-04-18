import apiClient from './apiClient';
const paymentService = {
  createPayment: (payload) => apiClient.post('/api/customer/payments', payload),
  createVNPayCheckout: (payload) => apiClient.post('/api/customer/payments/vnpay/checkout-url', payload),
};
export default paymentService;
