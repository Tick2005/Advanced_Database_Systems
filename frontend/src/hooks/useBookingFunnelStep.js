import { useEffect } from "react";
import { trackEvent } from "../services/tracking";

export function useBookingFunnelStep(step, payload = {}) {
  useEffect(() => {
    trackEvent("booking_step_view", { step, ...payload });

    return () => {
      trackEvent("booking_step_leave", { step, ...payload });
    };
  }, [step, payload]);
}
