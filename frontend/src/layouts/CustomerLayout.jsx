import { Outlet } from "react-router-dom";
import AuthGuard from "../routes/guards/AuthGuard";
import RoleGuard from "../routes/guards/RoleGuard";
import PublicLayout from "./PublicLayout";

export default function CustomerLayout() {
  return (
    <AuthGuard>
      <RoleGuard roles={["CUSTOMER"]}>
        <PublicLayout>
          <Outlet />
        </PublicLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
