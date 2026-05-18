import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../authService";
import { useAuth } from "../useAuth";
import { userService } from "../../users/userService";
import { PATHS } from "../../../routes/pathConstants";

function defaultRedirectByRole(role) {
  if (role === "CUSTOMER") return PATHS.CUSTOMER_HOME;
  if (role === "STAFF") return PATHS.STAFF;
  if (role === "MANAGER") return PATHS.MANAGER;
  if (role === "OWNER") return PATHS.OWNER;
  return PATHS.HOME;
}

function isRedirectAllowedForRole(role, redirectPath) {
  if (!redirectPath || !redirectPath.startsWith("/")) return false;

  if (redirectPath.startsWith(PATHS.CUSTOMER_HOME.split("/home")[0])) {
    return role === "CUSTOMER";
  }
  if (redirectPath.startsWith(PATHS.STAFF)) {
    return role === "STAFF";
  }
  if (redirectPath.startsWith(PATHS.MANAGER)) {
    return role === "MANAGER";
  }
  if (redirectPath.startsWith(PATHS.OWNER)) {
    return role === "OWNER";
  }

  // Public routes are valid for all roles.
  return true;
}

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await authService.login({ email, password });
      login(auth);
      // Load settings from MongoDB immediately after login so the entire
      // customer flow (top rooms, camera, theme) has the correct values.
      // We call userService directly because the hook's isAuthenticated flag
      // may not have updated yet (React state is async).
      if (auth.role === "CUSTOMER") {
        try {
          const settingsData = await userService.getSettings();
          if (settingsData) {
            // Dispatch event so useCustomerSettings picks it up
            window.dispatchEvent(new CustomEvent("user_settings_updated", {
              detail: { settings: settingsData }
            }));
          }
        } catch (_) {
          // Non-fatal — settings will be loaded lazily on next render
        }
      }
      const query = new URLSearchParams(location.search);
      const redirect = query.get("redirect");
      const nextPath = isRedirectAllowedForRole(auth.role, redirect)
        ? redirect
        : defaultRedirectByRole(auth.role);
      navigate(nextPath, { replace: true });
    } catch (err) {
      // Provide a clear message when the account hasn't been activated yet
      const raw = err.message || "";
      if (raw.toLowerCase().includes("inactive") || raw.toLowerCase().includes("not active")) {
        setError("Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và nhấn link xác minh.");
      } else {
        setError(raw || "Email hoặc mật khẩu không đúng");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container auth-shell page-shell">
      <div className="auth-visual card">
        <div className="auth-visual-content">
          <span className="hero-badge">Welcome back</span>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.98 }}>Đăng nhập để quay lại hành trình lưu trú cao cấp</h1>
          <p style={{ maxWidth: 520, margin: 0, color: "rgba(255,255,255,0.8)" }}>Khách hàng, staff, manager và owner đều được dẫn vào đúng workspace với bố cục rõ ràng, gọn và sang.</p>
          <div className="hero-stats" style={{ maxWidth: 560 }}>
            <div className="hero-stat"><strong>Secure</strong><span>JWT + role guard</span></div>
            <div className="hero-stat"><strong>Fast</strong><span>Flow tối giản</span></div>
            <div className="hero-stat"><strong>Hotel OS</strong><span>Quản trị đồng bộ</span></div>
          </div>
        </div>
      </div>
      <div className="auth-card">
        <form className="card card-elevated" onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div className="page-heading" style={{ marginBottom: 4 }}>
            <h1>Đăng nhập</h1>
            <p>Chọn workspace phù hợp với vai trò của bạn.</p>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
            <Link to={PATHS.FORGOT_PASSWORD} style={{ color: "#c9a84c", fontSize: 14, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>🔑 Quên mật khẩu?</Link>
            <span style={{ fontSize: 13, color: "#64748b" }}>Chưa có tài khoản? <Link to={PATHS.REGISTER} style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Đăng ký ngay</Link></span>
          </div>
        </form>
      </div>
    </section>
  );
}
