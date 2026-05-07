import { useMemo } from "react";
import { useAuthStore } from "../store/authStore";
import { canPerformAction } from "../services/permissions";

export function usePermissions() {
  const { role, auth } = useAuthStore();

  return useMemo(() => ({
    role,
    currentEmail: auth?.email || "",
    can: (action, context = {}) => canPerformAction(role, action, {
      ...context,
      currentEmail: auth?.email || ""
    })
  }), [role, auth?.email]);
}
