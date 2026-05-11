import { AppRoutes } from "../routes";
import { useCustomerSettings } from "../hooks/useCustomerSettings";

export default function App() {
  // Load customer settings on app startup
  useCustomerSettings();
  
  return <AppRoutes />;
}
