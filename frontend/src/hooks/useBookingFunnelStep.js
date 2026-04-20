import { useEffect } from "react";
import { trackBookingStep } from "../services/bookingFunnel";

export function useBookingFunnelStep(step, payload = {}) {
  useEffect(() => {
    trackBookingStep("step_view", { step, ...payload });

    return () => {
      trackBookingStep("step_leave", { step, ...payload });
    };
  }, [step, payload]);
}
