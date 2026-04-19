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
    if (!isAuthenticated) {
      return [
        { to: PATHS.ROOMS, label: "Phòng" },
        { to: PATHS.BRANCHES, label: "Chi nhánh" },
        { href: "#reviews", label: "Đánh giá" }
      ];
    }

    if (role === "CUSTOMER") {
      return [
        { to: PATHS.CUSTOMER_HOME, label: "Trang chủ" },
        { to: PATHS.CUSTOMER_ROOMS, label: "Tìm phòng" },
        { to: PATHS.BRANCHES, label: "Chi nhánh" },
        { to: PATHS.CUSTOMER_FEEDBACKS, label: "Đánh giá" }
      ];
    }

    return [];
  }, [isAuthenticated, role]);

  const accountLinks = useMemo(() => {
    if (!isAuthenticated) return [];
    if (role === "CUSTOMER") {
      return [
        { to: PATHS.CUSTOMER_BOOKINGS, label: "Lịch sử đặt phòng" },
        { to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ" },
        { to: PATHS.CUSTOMER_FEEDBACKS, label: "Đánh giá của tôi" },
        { to: PATHS.CUSTOMER_SETTINGS, label: "Cài đặt" }
      ];
    }

    return [
      { to: roleHome, label: "Đi tới workspace" }
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
      <header style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <div className="surface-panel" style={{ margin: 12, borderRadius: 999, backdropFilter: "blur(16px)", position: "relative" }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, minHeight: 76 }}>
            <Link to={PATHS.HOME} style={{ display: "grid", gap: 2, flex: "0 0 auto" }}>
              <span style={{ fontFamily: "Playfair Display", fontWeight: 800, fontSize: 28, lineHeight: 1 }}>LuxStay</span>
              <span style={{ fontSize: 12, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>Luxury Hotel Platform</span>
            </Link>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end", position: "relative" }}>
              {publicNavLinks.length > 0 && (
                <nav style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {publicNavLinks.map((item) => (
                    item.to ? (
                      <Link key={item.to} className="pill pill-soft" to={item.to}>{item.label}</Link>
                    ) : (
                      <a
                        key={item.href}
                        className="pill pill-soft"
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          document.querySelector('[data-section="reviews"]')?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {item.label}
                      </a>
                    )
                  ))}
                </nav>
              )}

              {!isAuthenticated && (
                <>
                  <Link className="btn pill pill-soft" to={PATHS.LOGIN}>Đăng nhập</Link>
                  <Link className="btn btn-gold" to={PATHS.REGISTER}>Đăng ký</Link>
                </>
              )}

              {isAuthenticated && role === "CUSTOMER" && (
                <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKING_CREATE}>Đặt phòng mới</Link>
              )}

              {isAuthenticated && role !== "CUSTOMER" && (
                <Link className="btn btn-gold" to={roleHome}>Vào workspace</Link>
              )}

              {isAuthenticated && (
                <div ref={accountMenuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    style={{
                      background: "rgba(23,49,77,0.08)",
                      border: "1px solid #dbe4ee",
                      color: "#17314d",
                      boxShadow: "none",
                      gap: 10,
                      padding: "8px 12px"
                    }}
                  >
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
                          style={{ padding: "9px 10px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#17314d" }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={logout}
                        style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid #fee2e2", background: "#fff5f5", color: "#b91c1c", textAlign: "left", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main style={{ flex: 1 }}>
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
