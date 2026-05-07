import { Navigate, useLocation } from "react-router-dom";
import { PATHS } from "../pathConstants";
import { useAuthStore } from "../../store/authStore";

export default function AuthGuard({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`${PATHS.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
