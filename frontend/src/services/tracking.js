const TRACKING_KEY = "hotel_app_frontend_tracking";
const MAX_TRACKING_EVENTS = 200;

export function trackEvent(eventName, payload = {}) {
  const event = {
    id: crypto.randomUUID(),
    eventName,
    payload,
    at: new Date().toISOString()
  };

  try {
    const current = JSON.parse(localStorage.getItem(TRACKING_KEY) || "[]");
    const next = [event, ...current].slice(0, MAX_TRACKING_EVENTS);
    localStorage.setItem(TRACKING_KEY, JSON.stringify(next));
  } catch {
    // Ignore local storage failures for non-critical tracking.
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[tracking]", eventName, payload);
  }

  return event;
}
