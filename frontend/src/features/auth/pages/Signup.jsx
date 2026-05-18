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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.register({ fullName, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="container auth-shell page-shell">
        <div className="auth-visual card">
          <div className="auth-visual-content">
            <span className="hero-badge">Gần xong rồi!</span>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.98 }}>
              Kiểm tra hộp thư của bạn
            </h1>
            <p style={{ maxWidth: 520, margin: 0, color: "rgba(255,255,255,0.8)" }}>
              Chúng tôi đã gửi email xác minh đến <strong>{email}</strong>. Nhấn vào link trong email để kích hoạt tài khoản.
            </p>
          </div>
        </div>
        <div className="auth-card">
          <div className="card card-elevated" style={{ display: "grid", gap: 20, textAlign: "center", padding: "40px 28px" }}>
            <div style={{ fontSize: 64 }}>📧</div>
            <div>
              <h2 style={{ margin: "0 0 12px", fontSize: 22, color: "#0d2238" }}>Email xác minh đã được gửi!</h2>
              <p style={{ color: "#64748b", margin: "0 0 8px", lineHeight: 1.7 }}>
                Vui lòng kiểm tra hộp thư <strong>{email}</strong> và nhấn vào link kích hoạt tài khoản.
              </p>
              <p style={{ color: "#d97706", fontSize: 13, margin: "0 0 24px", fontWeight: 600 }}>
                ⚠️ Link có hiệu lực trong <strong>24 giờ</strong>. Nếu không kích hoạt, tài khoản sẽ tự động bị xóa.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  to={PATHS.LOGIN}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, textDecoration: "none" }}
                >
                  Đến trang đăng nhập →
                </Link>
              </div>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13, color: "#0369a1", textAlign: "left" }}>
              <strong>Không nhận được email?</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Kiểm tra thư mục Spam / Junk</li>
                <li>Đảm bảo địa chỉ email <strong>{email}</strong> là chính xác</li>
                <li>Thử đăng ký lại nếu email sai</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container auth-shell page-shell">
      <div className="auth-visual card">
        <div className="auth-visual-content">
          <span className="hero-badge">Join LuxStay</span>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 0.98 }}>
            Tạo tài khoản để bắt đầu trải nghiệm khách sạn liền mạch
          </h1>
          <p style={{ maxWidth: 520, margin: 0, color: "rgba(255,255,255,0.8)" }}>
            Một tài khoản dùng chung cho đặt phòng, theo dõi booking và nhận thông báo từ hệ thống.
          </p>
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
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Sau khi đăng ký, bạn sẽ nhận email xác minh để kích hoạt tài khoản.
            </p>
          </div>
          <div className="field">
            <label>Họ tên</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="field">
            <label>Mật khẩu</label>
            <input
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
              required
            />
            <small style={{ color: "#64748b" }}>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và chữ số.</small>
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 14 }}>
              ❌ {error}
            </div>
          )}
          <button className="btn btn-gold" disabled={loading}>
            {loading ? "⏳ Đang xử lý..." : "Đăng ký"}
          </button>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Đã có tài khoản?{" "}
            <Link to={PATHS.LOGIN} style={{ color: "#c9a84c", fontWeight: 600, textDecoration: "none" }}>
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
