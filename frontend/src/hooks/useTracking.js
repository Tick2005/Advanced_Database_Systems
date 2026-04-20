import { useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { trackEvent } from "../services/tracking";

export function useTracking(scope) {
  const { role, auth } = useAuthStore();

  return useCallback((eventName, payload = {}) => {
    return trackEvent(eventName, {
      scope,
      role,
      email: auth?.email || null,
      ...payload
    });
  }, [scope, role, auth?.email]);
}
