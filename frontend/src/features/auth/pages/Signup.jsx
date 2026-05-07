import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../authService";
import { PATHS } from "../../../routes/pathConstants";

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await authService.register({ fullName, email, password });
      setMessage("Dang ky thanh cong, vui long kiem tra email xac minh tai khoan.");
      setTimeout(() => navigate(PATHS.LOGIN), 1200);
    } catch (err) {
      setError(err.message || "Dang ky that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container auth-shell page-shell">
      <div className="auth-visual card">
        <div className="auth-visual-content">
          <span className="hero-badge">Join LuxStay</span>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.98 }}>Tạo tài khoản để bắt đầu trải nghiệm khách sạn liền mạch</h1>
          <p style={{ maxWidth: 520, margin: 0, color: "rgba(255,255,255,0.8)" }}>Một tài khoản dùng chung cho đặt phòng, theo dõi booking và nhận thông báo từ hệ thống.</p>
          <div className="hero-stats" style={{ maxWidth: 560 }}>
            <div className="hero-stat"><strong>1 account</strong><span>Cho mọi trải nghiệm</span></div>
            <div className="hero-stat"><strong>Verified</strong><span>Kết nối nhanh</span></div>
            <div className="hero-stat"><strong>VIP-ready</strong><span>Dành cho khách lẻ & doanh nghiệp</span></div>
          </div>
        </div>
      </div>
      <div className="auth-card">
        <form className="card card-elevated" onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div className="page-heading" style={{ marginBottom: 4 }}>
            <h1>Đăng ký</h1>
            <p>Tạo hồ sơ khách hàng mới cho LuxStay.</p>
          </div>
          <div className="field">
            <label>Họ tên</label>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
          {message && <div style={{ color: "#166534" }}>{message}</div>}
          <button className="btn btn-gold" disabled={loading}>{loading ? "Đang xử lý..." : "Đăng ký"}</button>
          <div>Đã có tài khoản? <Link to={PATHS.LOGIN}>Đăng nhập</Link></div>
        </form>
      </div>
    </section>
  );
}
