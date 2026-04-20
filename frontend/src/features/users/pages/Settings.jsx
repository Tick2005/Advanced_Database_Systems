import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import { PATHS } from "../../../routes/pathConstants";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    theme: "light",
    fontScale: "normal",
    preferredLanguage: "vi"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("ux_theme") || "light";
    const savedFontScale = localStorage.getItem("ux_font_scale") || "normal";
    userService.getProfile().then((profile) => {
      setForm((prev) => ({
        ...prev,
        theme: savedTheme,
        fontScale: savedFontScale,
        preferredLanguage: profile.preferredLanguage || "vi"
      }));
    }).catch(() => {
      setError("Khong the nap du lieu profile");
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await userService.updateProfile({ preferredLanguage: form.preferredLanguage });
      localStorage.setItem("ux_theme", form.theme);
      localStorage.setItem("ux_font_scale", form.fontScale);
      document.documentElement.dataset.theme = form.theme;
      document.documentElement.dataset.fontScale = form.fontScale;
      setMessage("Da luu cài đặt giao diện và ngôn ngữ");
    } catch (err) {
      setError(err.message || "Cap nhat that bai");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="container" style={{ padding: "28px 24px", maxWidth: 600 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Cài đặt tài khoản</h1>
        <div className="card" style={{ padding: 18 }}>Đang tải dữ liệu...</div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 600 }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Tuỳ chỉnh giao diện, cỡ chữ và ngôn ngữ hiển thị.</p>
      </div>

      <form className="card-elevated" style={{ padding: 24, display: "grid", gap: 16 }} onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>GIAO DIEN</div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Theme</label>
            <select value={form.theme} onChange={(event) => onChange("theme", event.target.value)}>
              <option value="light">Sáng</option>
              <option value="warm">Ấm</option>
              <option value="deep">Tương phản cao</option>
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Cỡ chữ</label>
            <select value={form.fontScale} onChange={(event) => onChange("fontScale", event.target.value)}>
              <option value="compact">Nhỏ</option>
              <option value="normal">Vừa</option>
              <option value="large">Lớn</option>
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Ngôn ngữ ưu tiên</label>
            <select value={form.preferredLanguage} onChange={(event) => onChange("preferredLanguage", event.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {error && <div style={{ padding: "12px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 14 }}>{error}</div>}
        {message && <div style={{ padding: "12px 14px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>{message}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button className="btn btn-gold" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? "Đang lưu..." : "Lưu settings"}
          </button>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_PROFILE}>Đi tới profile</Link>
        </div>
      </form>
    </section>
  );
}
