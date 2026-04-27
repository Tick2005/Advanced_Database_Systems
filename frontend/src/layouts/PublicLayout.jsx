import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { PATHS } from "../routes/pathConstants";
import { useAuth } from "../features/auth/useAuth";

const CUSTOMER_MENU = [
  { to: PATHS.CUSTOMER_ROOMS, label: "Tìm phòng", icon: "🛏️" },
  { to: PATHS.CUSTOMER_BOOKINGS, label: "Booking của tôi", icon: "🧾" },
  { to: PATHS.CUSTOMER_FEEDBACKS, label: "Đánh giá", icon: "💬" },
  { to: PATHS.CUSTOMER_PROFILE, label: "Hồ sơ", icon: "👤" },
  { to: PATHS.BRANCHES, label: "Chi nhánh", icon: "🏢" },
];

// Uniform pill style for all nav/auth buttons
const PILL = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: 40,
  padding: "0 18px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  border: "1px solid #dbe4ee",
  background: "rgba(255,255,255,0.7)",
  color: "#17314d",
  textDecoration: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const PILL_GOLD = {
  ...PILL,
  background: "linear-gradient(135deg,#c9a84c,#9a7d24)",
  color: "#fff",
  border: "none",
  boxShadow: "0 2px 10px rgba(180,130,20,0.28)",
};

export default function PublicLayout() {
  const { isAuthenticated, role, auth, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  const roleHome =
    role === "CUSTOMER" ? PATHS.CUSTOMER_HOME
    : role === "STAFF" ? PATHS.STAFF
    : role === "MANAGER" ? PATHS.MANAGER
    : role === "OWNER" ? PATHS.OWNER
    : PATHS.HOME;

  const displayName = auth?.email ? auth.email.split("@")[0] : "Guest";
  const initials = displayName.slice(0, 1).toUpperCase();

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Skip nav */}
      <a
        href="#main-content"
        style={{ position: "absolute", left: -9999, top: 8, padding: "8px 14px", background: "#0d2238", color: "#fff", borderRadius: 8, zIndex: 999, fontSize: 13 }}
        onFocus={(e) => (e.currentTarget.style.left = "12px")}
        onBlur={(e) => (e.currentTarget.style.left = "-9999px")}
      >
        Bỏ qua menu
      </a>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        transition: "box-shadow 0.2s",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.10)" : "none"
      }}>
        <div style={{
          margin: "8px 12px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.6)",
        }}>
          <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 68 }}>

            {/* Logo */}
            <Link to={PATHS.HOME} style={{ textDecoration: "none", flexShrink: 0 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 26, color: "#0d2238", lineHeight: 1 }}>
                LuxStay
              </div>
              <div style={{ fontSize: 10, color: "#9a7d24", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginTop: 1 }}>
                Luxury Hotel Platform
              </div>
            </Link>

            {/* Right section */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

              {/* ── GUEST (not logged in) ── */}
              {!isAuthenticated && (
                <>
                  <Link to={PATHS.ROOMS} style={PILL}>🛏️ List room</Link>
                  <Link to={PATHS.BRANCHES} style={PILL}>🏢 Chi nhánh</Link>
                  <Link to={PATHS.LOGIN} style={PILL}>🔐 Đăng nhập</Link>
                  <Link to={PATHS.REGISTER} style={PILL_GOLD}>✨ Đăng ký</Link>
                </>
              )}

              {/* ── STAFF / MANAGER / OWNER ── */}
              {isAuthenticated && role !== "CUSTOMER" && (
                <>
                  <Link to={roleHome} style={PILL_GOLD}>🧭 Workspace</Link>
                  <button type="button" style={{ ...PILL, border: "1px solid #fecaca", color: "#b91c1c", background: "#fff5f5" }} onClick={logout}>
                    🚪 Đăng xuất
                  </button>
                </>
              )}

              {/* ── CUSTOMER (logged in) — avatar + dropdown ── */}
              {isAuthenticated && role === "CUSTOMER" && (
                <div ref={menuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      height: 40, padding: "0 14px", borderRadius: 999,
                      border: "1px solid #dbe4ee", background: "rgba(255,255,255,0.85)",
                      cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#17314d",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: "linear-gradient(135deg,#0d2238,#1e3a5f)",
                      color: "#c9a84c", display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 800, flexShrink: 0
                    }}>{initials}</span>
                    <span>{displayName}</span>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>{menuOpen ? "▲" : "▼"}</span>
                  </button>

                  {menuOpen && (
                    <div
                      style={{
                        position: "absolute", right: 0, top: "calc(100% + 8px)",
                        minWidth: 240, borderRadius: 16,
                        background: "#fff", border: "1px solid #e2e8f0",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                        overflow: "hidden", zIndex: 100
                      }}
                    >
                      {/* Header */}
                      <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "#0d2238" }}>{auth?.fullName || displayName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{auth?.email}</div>
                      </div>
                      {/* Links */}
                      <div style={{ padding: "8px" }}>
                        {CUSTOMER_MENU.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                              fontSize: 13, fontWeight: 600, color: "#0d2238",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      {/* Logout */}
                      <div style={{ padding: "8px", borderTop: "1px solid #f1f5f9" }}>
                        <button
                          type="button"
                          onClick={logout}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 12px", borderRadius: 10, border: "none",
                            background: "transparent", cursor: "pointer",
                            fontSize: 13, fontWeight: 700, color: "#b91c1c",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span>🚪</span> Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main id="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0d2238", color: "#f8fafc", marginTop: 60, padding: "48px 0 28px" }}>
        <div className="container" style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 28, color: "#c9a84c" }}>LuxStay</div>
            <div style={{ color: "#94a3b8", lineHeight: 1.6, fontSize: 14, maxWidth: 300 }}>
              Nền tảng vận hành khách sạn hiện đại — kết nối trải nghiệm lưu trú sang trọng với quản trị thông minh.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {["Facebook", "Instagram", "Zalo"].map((s) => (
                <span key={s} style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", cursor: "pointer" }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
            <div style={{ fontWeight: 700, color: "#c9a84c", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Khám phá</div>
            {[
              { to: PATHS.ROOMS, label: "Tìm phòng" },
              { to: PATHS.BRANCHES, label: "Chi nhánh" },
              { to: PATHS.CUSTOMER_BOOKINGS, label: "Booking của tôi" },
              { to: PATHS.CUSTOMER_FEEDBACKS, label: "Đánh giá" },
            ].map((l) => (
              <Link key={l.to} to={l.to} style={{ color: "#94a3b8", fontSize: 14, textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >{l.label}</Link>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
            <div style={{ fontWeight: 700, color: "#c9a84c", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Liên hệ</div>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>📞 1900 6868</span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>✉️ support@luxstay.local</span>
            <span style={{ color: "#94a3b8", fontSize: 14 }}>📍 01 Trần Phú, Đà Nẵng</span>
          </div>
        </div>
        <div className="container" style={{ marginTop: 28, borderTop: "1px solid rgba(148,163,184,0.15)", paddingTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ color: "#475569", fontSize: 13 }}>© 2026 LuxStay. All rights reserved.</span>
          <span style={{ color: "#475569", fontSize: 12 }}>Powered by LuxStay Technology</span>
        </div>
      </footer>
    </div>
  );
}
