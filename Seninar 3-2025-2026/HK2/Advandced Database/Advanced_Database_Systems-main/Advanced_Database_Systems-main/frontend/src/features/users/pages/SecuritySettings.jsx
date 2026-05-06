// commit: fix(security-settings): encode Vietnamese text đúng, kết nối API đổi mật khẩu, cleanup state
import { useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

const PREFERENCE_LABELS = {
  newsletter: "Nhận bản tin hàng tháng",
  promoNotification: "Nhận ưu đãi và mã giảm giá",
  bookingEmail: "Nhận email cập nhật booking",
  loginAlert: "Cảnh báo khi có đăng nhập mới",
};

const DEFAULT_PREFERENCES = {
  newsletter: true,
  promoNotification: true,
  bookingEmail: true,
  loginAlert: true,
};

function loadPreferences() {
  try {
    const raw = localStorage.getItem("luxstay.customer.preferences");
    if (raw) return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFERENCES };
}

export default function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [preferences, setPreferences] = useState(loadPreferences);
  const [prefSaving, setPrefSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ─── Password Change ───────────────────────────────────────────────────────

  const changePassword = async (event) => {
    event.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin đổi mật khẩu.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Mật khẩu mới cần ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Xác nhận mật khẩu không khớp.");
      return;
    }

    setPasswordSaving(true);
    try {
      await userService.updatePassword({ currentPassword, newPassword });
      setSuccessMsg("Đổi mật khẩu thành công.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMsg(err?.message || "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setPasswordSaving(false);
    }
  };

  // ─── Notification Preferences ─────────────────────────────────────────────

  const savePreferences = () => {
    setPrefSaving(true);
    try {
      localStorage.setItem("luxstay.customer.preferences", JSON.stringify(preferences));
      setSuccessMsg("Đã lưu cài đặt thông báo.");
      setErrorMsg("");
    } catch {
      setErrorMsg("Không thể lưu cài đặt.");
    } finally {
      setPrefSaving(false);
    }
  };

  const onPrefChange = (key, checked) =>
    setPreferences((prev) => ({ ...prev, [key]: checked }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 620, display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gap: 6, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Bảo mật & Nâng cao</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Quản lý mật khẩu và cài đặt thông báo tài khoản.</p>
      </div>

      {/* Password */}
      <article className="card" style={{ padding: 20, display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Bảo mật tài khoản</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Đổi mật khẩu định kỳ để bảo vệ tài khoản.
        </p>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 10 }}>
          <div className="field">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="submit" disabled={passwordSaving}>
              {passwordSaving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.FORGOT_PASSWORD}>
              Quên mật khẩu
            </Link>
          </div>
        </form>
      </article>

      {/* Notifications */}
      <article className="card" style={{ padding: 20, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Thông báo & quyền riêng tư</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          Cài đặt lưu trên trình duyệt hiện tại.
        </p>
        {Object.entries(PREFERENCE_LABELS).map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(e) => onPrefChange(key, e.target.checked)}
            />
            <span style={{ fontSize: 14 }}>{label}</span>
          </label>
        ))}
        <div style={{ marginTop: 4 }}>
          <button className="btn btn-gold" onClick={savePreferences} disabled={prefSaving}>
            {prefSaving ? "Đang lưu..." : "Lưu cài đặt thông báo"}
          </button>
        </div>
      </article>

      {/* Nav */}
      <div style={{ display: "flex", gap: 10 }}>
        <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS}>← Về cài đặt</Link>
        <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_PROFILE}>Về profile</Link>
      </div>

      <ToastMessage type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
      <ToastMessage type="error" message={errorMsg} onClose={() => setErrorMsg("")} />
    </section>
  );
}
