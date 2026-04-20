import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { PATHS } from "../routes/pathConstants";

export default function DashLayout({ children }) {
  const { role, logout, auth } = useAuth();
  const location = useLocation();
  const roleBase = role === "STAFF" ? PATHS.STAFF : role === "MANAGER" ? PATHS.MANAGER : PATHS.OWNER;
  const displayName = auth?.email ? auth.email.split("@")[0] : "Operator";

  const menusByRole = {
    STAFF: [
      { group: "Vận hành", to: PATHS.STAFF, label: "Dashboard", icon: "📊" },
      { group: "Vận hành", to: PATHS.STAFF_BOOKINGS_TODAY, label: "Booking hôm nay", icon: "📅" },
      { group: "Vận hành", to: PATHS.STAFF_ROOMS_STATUS, label: "Trạng thái phòng", icon: "🏨" },
      { group: "Vận hành", to: PATHS.STAFF_SERVICE_USAGE, label: "Dịch vụ booking", icon: "🍽️" }
    ],
    MANAGER: [
      { group: "Vận hành", to: PATHS.MANAGER, label: "Dashboard", icon: "📊" },
      { group: "Vận hành", to: PATHS.MANAGER_ROOMS, label: "Quản lý phòng", icon: "🏨" },
      { group: "Vận hành", to: PATHS.MANAGER_BOOKINGS, label: "Booking chi nhánh", icon: "📋" },
      { group: "Vận hành", to: PATHS.MANAGER_FEEDBACKS, label: "Feedback", icon: "💬" },
      { group: "Vận hành", to: PATHS.MANAGER_SERVICES, label: "Dịch vụ", icon: "🍽️" },
      { group: "Giá", to: PATHS.MANAGER_PRICING_REQUESTS, label: "Pricing requests", icon: "💰" }
    ],
    OWNER: [
      { group: "Điều hành", to: PATHS.OWNER, label: "Dashboard", icon: "📊" },
      { group: "Điều hành", to: PATHS.OWNER_BRANCHES, label: "Chi nhánh", icon: "🏢" },
      { group: "Điều hành", to: PATHS.OWNER_USERS, label: "Người dùng", icon: "👥" },
      { group: "Giá và tài chính", to: PATHS.OWNER_PRICING, label: "Pricing", icon: "💵" },
      { group: "Giá và tài chính", to: PATHS.OWNER_PRICING_REQUESTS, label: "Duyệt request", icon: "✅" },
      { group: "Báo cáo hệ thống", to: PATHS.OWNER_LOGS, label: "Logs", icon: "🧾" }
    ]
  };

  const menus = menusByRole[role] || [];
  const groupedMenus = useMemo(() => {
    return menus.reduce((acc, item) => {
      const key = item.group || "Menu";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [menus]);

  const pageTitle = useMemo(() => {
    const titleMappings = [
      { prefix: PATHS.STAFF_BOOKINGS_TODAY.replace(":id", ""), title: "Booking hôm nay" },
      { prefix: PATHS.STAFF_ROOMS_STATUS.replace(":id", ""), title: "Trạng thái phòng" },
      { prefix: PATHS.STAFF_SERVICE_USAGE.replace(":id", ""), title: "Quản lý dịch vụ booking" },
      { prefix: PATHS.MANAGER_ROOMS.replace(":id", ""), title: "Quản lý phòng" },
      { prefix: PATHS.MANAGER_BOOKINGS.replace(":id", ""), title: "Booking chi nhánh" },
      { prefix: PATHS.MANAGER_FEEDBACKS.replace(":id", ""), title: "Feedback khách hàng" },
      { prefix: PATHS.MANAGER_SERVICES.replace(":id", ""), title: "Dịch vụ chi nhánh" },
      { prefix: PATHS.MANAGER_PRICING_REQUESTS.replace(":id", ""), title: "Pricing requests" },
      { prefix: PATHS.OWNER_BRANCHES.replace(":id", ""), title: "Quản lý chi nhánh" },
      { prefix: PATHS.OWNER_PRICING.replace(":id", ""), title: "Quản lý pricing" },
      { prefix: PATHS.OWNER_PRICING_REQUESTS.replace(":id", ""), title: "Duyệt pricing requests" },
      { prefix: PATHS.OWNER_USERS.replace(":id", ""), title: "Quản lý người dùng" },
      { prefix: PATHS.OWNER_LOGS.replace(":id", ""), title: "System logs" }
    ];

    const matched = titleMappings.find((item) => location.pathname.startsWith(item.prefix));
    if (matched) return matched.title;
    return `${role} Dashboard`;
  }, [location.pathname, role]);

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <div style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>LuxStay</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{role} workspace</div>
          <div className="card" style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)", padding: 10, color: "#f8fafc", borderRadius: 14 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)" }}>Tài khoản đăng nhập</div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: 13 }}>{auth?.email || "No account"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {Object.entries(groupedMenus).map(([groupName, items]) => (
            <div key={groupName} style={{ display: "grid", gap: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.62)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{groupName}</div>
              {items.map((item) => {
                const active = item.to === roleBase
                  ? location.pathname === roleBase
                  : (location.pathname === item.to || location.pathname.startsWith(item.to + "/"));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`dashboard-nav-link${active ? " active" : ""}`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <button className="btn btn-gold" style={{ marginTop: 18, width: "100%" }} onClick={logout} aria-label="Dang xuat khoi workspace">Đăng xuất</button>
      </aside>
      <main className="dashboard-main">
        <header className="surface-panel dashboard-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "grid", gap: 2 }}>
            <strong style={{ fontSize: 19 }}>{pageTitle}</strong>
            <span style={{ color: "#64748b", fontSize: 13 }}>Điều hướng theo vai trò, tập trung vào tác vụ đang xử lý</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className="pill pill-soft">{role}</span>
            <span className="pill pill-soft">{displayName}</span>
            <span style={{ fontSize: 18 }} role="img" aria-label="Thong bao">🔔</span>
          </div>
        </header>
        {children || <Outlet />}
      </main>
    </div>
  );
}
