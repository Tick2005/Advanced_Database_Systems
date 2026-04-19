import { useAuth } from "../features/auth/useAuth";
import StaffDashboard from "../features/dashboard/StaffDashboard";
import ManagerDashboard from "../features/dashboard/ManagerDashboard";
import OwnerDashboard from "../features/dashboard/OwnerDashboard";

export default function Dashboard() {
  const { role } = useAuth();

  if (role === "STAFF") return <StaffDashboard />;
  if (role === "MANAGER") return <ManagerDashboard />;
  if (role === "OWNER") return <OwnerDashboard />;

  return <div className="card" style={{ padding: 18 }}>Khong co dashboard cho role hien tai.</div>;
}
