const PAYMENT_RESULT_KEY = "booking_vnpay_result";

export function savePaymentResult(result) {
  try {
    sessionStorage.setItem(PAYMENT_RESULT_KEY, JSON.stringify(result || {}));
  } catch {
    // Ignore storage write failures to keep payment flow usable.
  }
}

export function loadPaymentResult() {
  try {
    const raw = sessionStorage.getItem(PAYMENT_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPaymentResult() {
  try {
    sessionStorage.removeItem(PAYMENT_RESULT_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}