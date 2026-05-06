import { trackEvent } from "./tracking";

export const BOOKING_STEPS = {
  PREVIEW: "preview",
  REVIEW: "review",
  PAYMENT: "payment",
  RETURN: "return",
  SUCCESS: "success",
  FAILED: "failed"
};

export function trackBookingStep(event, payload = {}) {
  return trackEvent(`booking_funnel_${event}`, payload);
}

export function normalizeBookingError(error) {
  if (!error) return "unknown";
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  return "unknown";
}
