import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../authService";
import { PATHS } from "../../../routes/pathConstants";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Không thể gửi yêu cầu đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)", padding: "24px" }}>
        <div className="card card-elevated" style={{ width: "min(480px,100%)", padding: "36px 28px", display: "grid", gap: 20, textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>📬</div>
          <div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, color: "#0d2238" }}>Email đã được gửi!</h2>
            <p style={{ color: "#64748b", margin: "0 0 6px", lineHeight: 1.7 }}>
              Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>.
            </p>
            <p style={{ color: "#d97706", fontSize: 13, fontWeight: 600, margin: "0 0 20px" }}>
              ⏱️ Link có hiệu lực trong <strong>1 giờ</strong>. Sau đó bạn cần yêu cầu lại.
            </p>
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13, color: "#0369a1", textAlign: "left", marginBottom: 20 }}>
              <strong>Không nhận được email?</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Kiểm tra thư mục Spam / Junk</li>
                <li>Đảm bảo địa chỉ email chính xác</li>
              </ul>
            </div>
            <Link
              to={PATHS.LOGIN}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, textDecoration: "none" }}
            >
              Quay lại đăng nhập →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)", padding: "24px" }}>
      <form
        className="card card-elevated"
        style={{ width: "min(440px,100%)", padding: "32px 28px", display: "grid", gap: 16 }}
        onSubmit={onSubmit}
      >
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, color: "#0d2238" }}>Quên mật khẩu?</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
            Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu — link có hiệu lực trong <strong>1 giờ</strong>.
          </p>
        </div>
        <div className="field">
          <label>Email đã đăng ký</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />
        </div>
        {error && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ❌ {error}
          </div>
        )}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "⏳ Đang gửi..." : "Gửi link đặt lại mật khẩu"}
        </button>
        <div style={{ textAlign: "center", fontSize: 13, color: "#64748b" }}>
          <Link to={PATHS.LOGIN} style={{ color: "#c9a84c", fontWeight: 600, textDecoration: "none" }}>
            ← Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </section>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    token: searchParams.get("token") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.email || !form.token) {
      setError("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(form);
      setSuccess(true);
    } catch (err) {
      const raw = err.message || "";
      if (raw.toLowerCase().includes("expired") || raw.toLowerCase().includes("invalid")) {
        setError("Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.");
      } else {
        setError(raw || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)", padding: "24px" }}>
        <div className="card card-elevated" style={{ width: "min(440px,100%)", padding: "36px 28px", display: "grid", gap: 20, textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, color: "#16a34a" }}>Mật khẩu đã được đặt lại!</h2>
            <p style={{ color: "#64748b", margin: "0 0 20px", lineHeight: 1.7 }}>
              Mật khẩu mới của bạn đã được cập nhật thành công. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Link
              to={PATHS.LOGIN}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 99, background: "linear-gradient(135deg,#c9a84c,#9a7d24)", color: "#fff", fontWeight: 700, textDecoration: "none" }}
            >
              Đăng nhập ngay →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)", padding: "24px" }}>
      <form
        className="card card-elevated"
        style={{ width: "min(460px,100%)", padding: "32px 28px", display: "grid", gap: 16 }}
        onSubmit={onSubmit}
      >
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, color: "#0d2238" }}>Đặt lại mật khẩu</h1>
          {form.email && (
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Tài khoản: <strong>{form.email}</strong>
            </p>
          )}
        </div>

        {!form.token && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ⚠️ Link đặt lại mật khẩu không hợp lệ. Vui lòng mở lại email hoặc{" "}
            <Link to={PATHS.FORGOT_PASSWORD} style={{ color: "#b91c1c", fontWeight: 700 }}>yêu cầu link mới</Link>.
          </div>
        )}

        <div className="field">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            minLength={8}
            value={form.newPassword}
            onChange={(e) => onChange("newPassword", e.target.value)}
            placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
            required
          />
        </div>
        <div className="field">
          <label>Xác nhận mật khẩu mới</label>
          <input
            type="password"
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            required
          />
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ❌ {error}
          </div>
        )}

        <button className="btn btn-gold" disabled={loading || !form.token}>
          {loading ? "⏳ Đang cập nhật..." : "Đặt lại mật khẩu"}
        </button>
        <div style={{ textAlign: "center", fontSize: 13, color: "#64748b" }}>
          <Link to={PATHS.FORGOT_PASSWORD} style={{ color: "#c9a84c", fontWeight: 600, textDecoration: "none" }}>
            Yêu cầu link mới
          </Link>
          {" · "}
          <Link to={PATHS.LOGIN} style={{ color: "#c9a84c", fontWeight: 600, textDecoration: "none" }}>
            Đăng nhập
          </Link>
        </div>
      </form>
    </section>
  );
}
