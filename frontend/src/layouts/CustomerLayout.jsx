import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { PATHS } from "../routes/pathConstants";
import PublicLayout from "./PublicLayout";

export default function CustomerLayout() {
  const { role } = useAuth();

  if (role !== "CUSTOMER") {
    return <Navigate to={PATHS.FORBIDDEN} replace />;
  }

  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}
