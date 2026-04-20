import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { PATHS } from "../routes/pathConstants";
import { useAuth } from "../features/auth/useAuth";

export default function PublicLayout() {
  const { isAuthenticated, role, auth, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const roleHome = role === "CUSTOMER"
    ? PATHS.CUSTOMER_HOME
    : role === "STAFF"
      ? PATHS.STAFF
      : role === "MANAGER"
        ? PATHS.MANAGER
        : role === "OWNER"
          ? PATHS.OWNER
          : PATHS.HOME;

  const displayName = auth?.email ? auth.email.split("@")[0] : "Guest";
  const roleLabel = role === "CUSTOMER" ? "Khách hàng" : role === "STAFF" ? "Staff" : role === "MANAGER" ? "Manager" : role === "OWNER" ? "Owner" : "Khách";

  const publicNavLinks = useMemo(() => {
    if (isAuthenticated && role === "CUSTOMER") {
      return [
        { to: PATHS.CUSTOMER_ROOMS, label: "List room", icon: "🛏️" },
        { to: PATHS.BRANCHES, label: "Chi nhánh", icon: "🏢" },
        { to: PATHS.CUSTOMER_BOOKINGS, label: "Lịch sử", icon: "🧾" }
      ];
    }

    return [
      { to: PATHS.ROOMS, label: "List room", icon: "🛏️" },
      { to: PATHS.BRANCHES, label: "Chi nhánh", icon: "🏢" }
    ];
  }, [isAuthenticated, role]);

  const accountLinks = useMemo(() => {
    if (!isAuthenticated) return [];
    if (role === "CUSTOMER") {
      return [
        { to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ", icon: "👤" },
        { to: PATHS.CUSTOMER_SETTINGS, label: "Settings", icon: "🎛️" },
        { to: PATHS.CUSTOMER_BOOKINGS, label: "History", icon: "🧾" },
        { to: PATHS.CUSTOMER_ROOMS, label: "List room", icon: "🛏️" },
        { to: PATHS.BRANCHES, label: "Danh sách chi nhánh", icon: "🏢" }
      ];
    }

    return [
      { to: roleHome, label: "Đi tới workspace", icon: "🧭" }
    ];
  }, [isAuthenticated, role, roleHome]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <a href="#main-content" style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }} onFocus={(e) => {
        e.currentTarget.style.left = "16px";
        e.currentTarget.style.top = "12px";
        e.currentTarget.style.width = "auto";
        e.currentTarget.style.height = "auto";
        e.currentTarget.style.padding = "8px 12px";
        e.currentTarget.style.background = "#0d2238";
        e.currentTarget.style.color = "#fff";
        e.currentTarget.style.borderRadius = "10px";
        e.currentTarget.style.zIndex = 999;
      }} onBlur={(e) => {
        e.currentTarget.style.left = "-10000px";
        e.currentTarget.style.top = "auto";
        e.currentTarget.style.width = "1px";
        e.currentTarget.style.height = "1px";
        e.currentTarget.style.overflow = "hidden";
      }}>
        Bỏ qua menu, đến nội dung chính
      </a>
      <header style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <div className="surface-panel" style={{ margin: 12, borderRadius: 999, backdropFilter: "blur(16px)", position: "relative" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, minHeight: 76 }}>
            <Link to={PATHS.HOME} style={{ display: "grid", gap: 2, flex: "0 0 auto" }}>
              <span style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>LuxStay</span>
              <span style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Luxury Hotel Platform</span>
            </Link>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", position: "relative" }}>
              {publicNavLinks.length > 0 && (
                <nav aria-label="Dieu huong chinh" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {publicNavLinks.map((item) => (
                    <Link
                      key={item.to}
                      className="pill pill-soft"
                      to={item.to}
                      aria-label={`Di den ${item.label}`}
                      title={item.label}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 112, justifyContent: "center" }}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              )}

              {!isAuthenticated && (
                <>
                  <Link className="btn pill pill-soft" to={PATHS.LOGIN} aria-label="Dang nhap" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span aria-hidden="true">🔐</span><span>Đăng nhập</span></Link>
                  <Link className="btn btn-gold" to={PATHS.REGISTER} aria-label="Dang ky" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span aria-hidden="true">✨</span><span>Đăng ký</span></Link>
                </>
              )}

              {isAuthenticated && role !== "CUSTOMER" && (
                <Link className="btn btn-gold" to={roleHome} aria-label="Vao khu dieu khien">Vào workspace</Link>
              )}

              {isAuthenticated && (
                <div ref={accountMenuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Mo menu tai khoan"
                    style={{
                      background: "rgba(23,49,77,0.08)",
                      border: "1px solid #dbe4ee",
                      color: "#17314d",
                      boxShadow: "none",
                      gap: 10,
                      padding: "8px 12px"
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 15 }}>👤</span>
                    <span style={{ width: 28, height: 28, borderRadius: 999, background: "#17314d", color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span style={{ display: "grid", textAlign: "left", lineHeight: 1.2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{roleLabel}</span>
                    </span>
                  </button>

                  {menuOpen && (
                    <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 230, padding: 8, display: "grid", gap: 4, zIndex: 50 }}>
                      {accountLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          style={{ padding: "9px 10px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#17314d", display: "inline-flex", alignItems: "center", gap: 8 }}
                        >
                          <span aria-hidden="true">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={logout}
                        style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid #fee2e2", background: "#fff5f5", color: "#b91c1c", textAlign: "left", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
                      >
                        <span aria-hidden="true">🚪</span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main id="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ background: "#0d2238", color: "#f8fafc", marginTop: 40, padding: "42px 0 28px" }}>
        <div className="container" style={{ display: "grid", gap: 18, gridTemplateColumns: "1.2fr 1fr 1fr" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 30 }}>LuxStay</div>
            <div style={{ color: "#cbd5e1", maxWidth: 420 }}>Nền tảng vận hành khách sạn hiện đại, kết nối trải nghiệm đặt phòng sang trọng với quản trị chi nhánh, phòng và dịch vụ.</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <strong>Thông tin liên hệ</strong>
            <span style={{ color: "#cbd5e1" }}>Hotline: 1900 6868</span>
            <span style={{ color: "#cbd5e1" }}>Email: support@luxstay.local</span>
            <span style={{ color: "#cbd5e1" }}>01 Trần Phú, Hải Châu, Đà Nẵng</span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <strong>Kết nối nhanh</strong>
            <Link to={PATHS.ROOMS} style={{ color: "#cbd5e1" }}>Tìm phòng</Link>
            <Link to={PATHS.BRANCHES} style={{ color: "#cbd5e1" }}>Danh sách chi nhánh</Link>
            <Link to={role === "CUSTOMER" ? PATHS.CUSTOMER_BOOKINGS : roleHome} style={{ color: "#cbd5e1" }}>{role === "CUSTOMER" ? "Booking của tôi" : "Khu điều khiển"}</Link>
          </div>
        </div>
        <div className="container" style={{ marginTop: 20, color: "#94a3b8", borderTop: "1px solid rgba(148,163,184,0.18)", paddingTop: 14 }}>
          © 2026 LuxStay. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
