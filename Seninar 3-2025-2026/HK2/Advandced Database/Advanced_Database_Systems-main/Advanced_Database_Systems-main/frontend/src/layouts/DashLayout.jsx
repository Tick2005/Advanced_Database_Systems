// commit: feat(dash-layout): thêm menu Hồ sơ & Cài đặt cho Staff/Manager/Owner, cải thiện active state
import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { PATHS } from "../routes/pathConstants";

// ─── Menu definitions ─────────────────────────────────────────────────────────

const MENUS_BY_ROLE = {
  STAFF: [
    { group: "Vận hành", to: PATHS.STAFF, label: "Dashboard", icon: "📊", exact: true },
    { group: "Vận hành", to: PATHS.STAFF_BOOKINGS_TODAY, label: "Booking hôm nay", icon: "📅" },
    { group: "Vận hành", to: PATHS.STAFF_ROOMS_STATUS, label: "Trạng thái phòng", icon: "🏨" },
    { group: "Vận hành", to: PATHS.STAFF_SERVICE_USAGE, label: "Dịch vụ booking", icon: "🍽️" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ cá nhân", icon: "👤" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_SETTINGS, label: "Cài đặt", icon: "⚙️" },
  ],
  MANAGER: [
    { group: "Vận hành", to: PATHS.MANAGER, label: "Dashboard", icon: "📊", exact: true },
    { group: "Vận hành", to: PATHS.MANAGER_ROOMS, label: "Quản lý phòng", icon: "🏨" },
    { group: "Vận hành", to: PATHS.MANAGER_BOOKINGS, label: "Booking chi nhánh", icon: "📋" },
    { group: "Vận hành", to: PATHS.MANAGER_STAFF, label: "Nhân sự", icon: "👥" },
    { group: "Vận hành", to: PATHS.MANAGER_FEEDBACKS, label: "Feedback", icon: "💬" },
    { group: "Vận hành", to: PATHS.MANAGER_SERVICES, label: "Dịch vụ", icon: "🍽️" },
    { group: "Giá", to: PATHS.MANAGER_PRICING_REQUESTS, label: "Pricing requests", icon: "💰" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ cá nhân", icon: "👤" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_SETTINGS, label: "Cài đặt", icon: "⚙️" },
  ],
  OWNER: [
    { group: "Điều hành", to: PATHS.OWNER, label: "Dashboard", icon: "📊", exact: true },
    { group: "Điều hành", to: PATHS.OWNER_BRANCHES, label: "Chi nhánh", icon: "🏢" },
    { group: "Điều hành", to: PATHS.OWNER_USERS, label: "Người dùng", icon: "👥" },
    { group: "Tài chính", to: PATHS.OWNER_PRICING, label: "Pricing", icon: "💵" },
    { group: "Tài chính", to: PATHS.OWNER_PRICING_REQUESTS, label: "Duyệt request", icon: "✅" },
    { group: "Báo cáo", to: PATHS.OWNER_LOGS, label: "System logs", icon: "🧾" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ cá nhân", icon: "👤" },
    { group: "Tài khoản", to: PATHS.CUSTOMER_SETTINGS, label: "Cài đặt", icon: "⚙️" },
  ],
};

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLE_MAP = [
  { prefix: PATHS.STAFF_BOOKINGS_TODAY, title: "Booking hôm nay" },
  { prefix: PATHS.STAFF_ROOMS_STATUS, title: "Trạng thái phòng" },
  { prefix: PATHS.STAFF_SERVICE_USAGE, title: "Quản lý dịch vụ booking" },
  { prefix: PATHS.MANAGER_ROOMS, title: "Quản lý phòng" },
  { prefix: PATHS.MANAGER_BOOKINGS, title: "Booking chi nhánh" },
  { prefix: PATHS.MANAGER_STAFF, title: "Quản lý nhân sự" },
  { prefix: PATHS.MANAGER_FEEDBACKS, title: "Feedback khách hàng" },
  { prefix: PATHS.MANAGER_SERVICES, title: "Dịch vụ chi nhánh" },
  { prefix: PATHS.MANAGER_PRICING_REQUESTS, title: "Pricing requests" },
  { prefix: PATHS.OWNER_BRANCHES, title: "Quản lý chi nhánh" },
  { prefix: PATHS.OWNER_PRICING_REQUESTS, title: "Duyệt pricing requests" },
  { prefix: PATHS.OWNER_PRICING, title: "Quản lý pricing" },
  { prefix: PATHS.OWNER_USERS, title: "Quản lý người dùng" },
  { prefix: PATHS.OWNER_LOGS, title: "System logs" },
  { prefix: PATHS.CUSTOMER_SETTINGS, title: "Cài đặt" },
  { prefix: PATHS.CUSTOMER_PROFILE, title: "Hồ sơ cá nhân" },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({ item, location, roleBase }) {
  const isRoot = item.exact || item.to === roleBase;
  const active = isRoot
    ? location.pathname === item.to || location.pathname === item.to + "/"
    : location.pathname === item.to || location.pathname.startsWith(item.to + "/");

  return (
    <Link
      to={item.to}
      className={`dashboard-nav-link${active ? " active" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 10,
        textDecoration: "none",
        fontWeight: active ? 700 : 500,
        fontSize: 14,
        color: active ? "white" : "rgba(255,255,255,0.78)",
        background: active ? "rgba(255,255,255,0.14)" : "transparent",
        transition: "background 0.15s, color 0.15s",
      }}
      aria-current={active ? "page" : undefined}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
      <span>{item.label}</span>
      {active && (
        <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 999, background: "#c9a84c" }} />
      )}
    </Link>
  );
}

// ─── DashLayout ───────────────────────────────────────────────────────────────

export default function DashLayout({ children }) {
  const { role, logout, auth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const roleBase = role === "STAFF" ? PATHS.STAFF : role === "MANAGER" ? PATHS.MANAGER : PATHS.OWNER;
  const displayName = auth?.email ? auth.email.split("@")[0] : "Operator";

  const menus = MENUS_BY_ROLE[role] || [];

  const groupedMenus = useMemo(
    () =>
      menus.reduce((acc, item) => {
        const key = item.group || "Menu";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {}),
    [menus]
  );

  const pageTitle = useMemo(() => {
    const matched = PAGE_TITLE_MAP.find((m) => location.pathname.startsWith(m.prefix));
    return matched ? matched.title : `${role} Dashboard`;
  }, [location.pathname, role]);

  const handleLogout = () => {
    logout();
    navigate(PATHS.LOGIN, { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <div style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>
            LuxStay
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
            {role} workspace
          </div>
          <div
            className="card"
            style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)", padding: 10, color: "#f8fafc", borderRadius: 14 }}
          >
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.72)" }}>Tài khoản đăng nhập</div>
            <div style={{ fontWeight: 700, marginTop: 4, fontSize: 13 }}>{auth?.email || "No account"}</div>
          </div>
        </div>

        <nav style={{ display: "grid", gap: 14 }}>
          {Object.entries(groupedMenus).map(([groupName, items]) => (
            <div key={groupName} style={{ display: "grid", gap: 4 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, paddingLeft: 4, marginBottom: 2 }}>
                {groupName}
              </div>
              {items.map((item) => (
                <NavItem key={item.to} item={item} location={location} roleBase={roleBase} />
              ))}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
          <button
            className="btn btn-gold"
            style={{ width: "100%" }}
            onClick={handleLogout}
            aria-label="Đăng xuất khỏi workspace"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header
          className="surface-panel dashboard-topbar"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <strong style={{ fontSize: 19 }}>{pageTitle}</strong>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              Điều hướng theo vai trò, tập trung vào tác vụ đang xử lý
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className="pill pill-soft">{role}</span>
            <span className="pill pill-soft">{displayName}</span>
            <span style={{ fontSize: 18 }} role="img" aria-label="Thông báo">🔔</span>
          </div>
        </header>
        {children || <Outlet />}
      </main>
    </div>
  );
}
