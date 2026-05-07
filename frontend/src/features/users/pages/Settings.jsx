import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import { useCustomerSettings } from "../../../hooks/useCustomerSettings";
import { PATHS } from "../../../routes/pathConstants";

function ToggleRow({ title, description, checked, onToggle }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: "#64748b" }}>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        style={{
          width: 52,
          height: 30,
          borderRadius: 99,
          border: "none",
          background: checked ? "#0d2238" : "#cbd5e1",
          padding: 3,
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s",
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: 99,
            display: "block",
            background: "#fff",
            transform: checked ? "translateX(22px)" : "translateX(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { settings, loading, updateSettings } = useCustomerSettings();
  const [profileLoading, setProfileLoading] = useState(true);
  const [form, setForm] = useState({
    theme: "light",
    fontScale: "normal",
    preferredLanguage: "vi",
    allowLocation: true,
    allowCamera: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load profile and initialize form
  useEffect(() => {
    if (loading) return;
    
    setProfileLoading(true);
    userService
      .getProfile()
      .then((profile) => {
        setForm((prev) => ({
          ...prev,
          theme: settings.theme || "light",
          fontScale: settings.fontScale || "normal",
          preferredLanguage: profile.preferredLanguage || "vi",
          allowLocation: settings.allowLocation !== false,
          allowCamera: settings.allowCamera !== false,
        }));
      })
      .catch(() => {
        setError("Không thể tải dữ liệu profile");
      })
      .finally(() => setProfileLoading(false));
  }, [loading, settings]);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      // Update profile (preferredLanguage)
      await userService.updateProfile({ preferredLanguage: form.preferredLanguage });

      // Update settings (theme, fontScale, permissions)
      await updateSettings({
        theme: form.theme,
        fontScale: form.fontScale,
        allowLocation: form.allowLocation,
        allowCamera: form.allowCamera,
      });

      document.documentElement.dataset.theme = form.theme;
      document.documentElement.dataset.fontScale = form.fontScale;
      
      // Notify other components of settings changes
      try {
        window.dispatchEvent(new CustomEvent('user_settings_updated', { 
          detail: { 
            theme: form.theme, 
            fontScale: form.fontScale, 
            allowLocation: form.allowLocation, 
            allowCamera: form.allowCamera 
          }
        }));
      } catch (e) {}
      
      // Clear location if permission disabled
      if (!form.allowLocation) {
        localStorage.removeItem("user_location");
      }
      
      setMessage("Đã lưu cài đặt giao diện, vị trí và camera");
    } catch (err) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
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
        <h1 style={{ margin: 0 }}>Cài đặt</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Tuỳ chỉnh giao diện sáng tối, quyền vị trí và quyền camera cho khách hàng.</p>
      </div>

      <form className="card-elevated" style={{ padding: 24, display: "grid", gap: 16 }} onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>GIAO DIỆN</div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Chế độ sáng tối</label>
            <select value={form.theme} onChange={(event) => onChange("theme", event.target.value)}>
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
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
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>QUYỀN ỨNG DỤNG</div>
          <ToggleRow
            title="Cho phép lấy địa chỉ"
            description="Dùng vị trí để ưu tiên chi nhánh và phòng phù hợp hơn."
            checked={form.allowLocation}
            onToggle={() => onChange("allowLocation", !form.allowLocation)}
          />
          <ToggleRow
            title="Cho phép truy cập camera"
            description="Dùng camera để chụp ảnh đại diện hoặc xác thực ảnh."
            checked={form.allowCamera}
            onToggle={() => onChange("allowCamera", !form.allowCamera)}
          />
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
