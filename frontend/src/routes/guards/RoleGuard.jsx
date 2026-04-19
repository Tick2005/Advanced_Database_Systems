import { Navigate } from "react-router-dom";
import { PATHS } from "../pathConstants";
import { useAuthStore } from "../../store/authStore";

export default function RoleGuard({ roles, children }) {
  const { role } = useAuthStore();

  if (!roles.includes(role)) {
    return <Navigate to={PATHS.FORBIDDEN} replace />;
  }

  return children;
}
