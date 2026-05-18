import { useEffect } from "react";
import { AppRoutes } from "../routes";
import { useCustomerSettings } from "../hooks/useCustomerSettings";

/**
 * App root — mounts useCustomerSettings once at the top level so that
 * theme / fontScale are applied to <html> immediately on load,
 * before any child component renders. All customer pages share this
 * single settings instance via the hook's internal event bus.
 */
export default function App() {
  useCustomerSettings();
  return <AppRoutes />;
}
