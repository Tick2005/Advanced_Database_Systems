import { Navigate } from "react-router-dom";
import { PATHS } from "../pathConstants";
import { useAuthStore } from "../../store/authStore";
import { hasRequiredRole } from "../../services/rbac";

export default function RoleGuard({ roles, allowHierarchy = false, children }) {
  const { role } = useAuthStore();

  if (!hasRequiredRole(role, roles, { allowHierarchy })) {
    return <Navigate to={PATHS.FORBIDDEN} replace />;
  }

  return children;
}
