/**
 * Settings.jsx
 * Commit: feat(settings): hoàn thiện logic, thêm camera profile status, đồng bộ settings ổn định
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import { useCustomerSettings } from "../../../hooks/useCustomerSettings";
import { PATHS } from "../../../routes/pathConstants";

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", paddingBottom: 4, borderBottom: "1px solid #f1f5f9" }}>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="field">
      <label style={{ fontSize: 14, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ title, description, checked, onToggle, badge }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 12, background: checked ? "#f8fafc" : "white", transition: "background 0.2s" }}>
      <div style={{ display: "grid", gap: 3, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{description}</span>
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={onToggle}
        style={{ flexShrink: 0, width: 52, height: 30, borderRadius: 99, border: "none", background: checked ? "#0d2238" : "#cbd5e1", padding: 3, cursor: "pointer", transition: "background 0.2s" }}>
        <span style={{ width: 24, height: 24, borderRadius: 99, display: "block", background: "#fff", transform: checked ? "translateX(22px)" : "translateX(0)", transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
      </button>
    </div>
  );
}

function CameraStatusCard({ browserStatus }) {
  const MAP = {
    granted: { icon: "✅", label: "Đã cấp quyền",  bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    denied:  { icon: "❌", label: "Đã từ chối",     bg: "#fee2e2", color: "#b91c1c", border: "#fecaca" },
    prompt:  { icon: "⏳", label: "Chưa được hỏi",  bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    unknown: { icon: "❓", label: "Không xác định", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  };
  const s = MAP[browserStatus] || MAP.unknown;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span>{s.icon}</span>
      <span>
        Trạng thái camera (trình duyệt): <strong>{s.label}</strong>
        {browserStatus === "denied" && (
          <span style={{ display: "block", fontSize: 11, marginTop: 2, opacity: 0.85 }}>
            Để cấp lại quyền, vào cài đặt trình duyệt → Site settings → Camera.
          </span>
        )}
      </span>
    </div>
  );
}

export default function Settings() {
  const { settings, loading: settingsLoading, updateSettings } = useCustomerSettings();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLanguage, setProfileLanguage] = useState("vi");
  const [form, setForm] = useState({ theme: "light", fontScale: "normal", preferredLanguage: "vi", allowLocation: true, allowCamera: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [browserCameraStatus, setBrowserCameraStatus] = useState("unknown");
  const [dirty, setDirty] = useState(false);

  // Lắng nghe trạng thái quyền camera từ trình duyệt
  useEffect(() => {
    if (!navigator?.permissions) return;
    let permResult = null;
    navigator.permissions.query({ name: "camera" })
      .then((result) => {
        permResult = result;
        setBrowserCameraStatus(result.state);
        result.onchange = () => setBrowserCameraStatus(result.state);
      })
      .catch(() => setBrowserCameraStatus("unknown"));
    return () => { if (permResult) permResult.onchange = null; };
  }, []);

  // Load profile + merge với settings
  useEffect(() => {
    if (settingsLoading) return;
    setProfileLoading(true);
    userService.getProfile()
      .then((profile) => {
        const nextLanguage = profile?.preferredLanguage || "vi";
        setProfileLanguage(nextLanguage);
        setForm({
          theme: settings.theme || "light",
          fontScale: settings.fontScale || "normal",
          preferredLanguage: nextLanguage,
          allowLocation: settings.allowLocation !== false,
          allowCamera: settings.allowCamera !== false,
        });
        setDirty(false);
      })
      .catch(() => setError("Không thể tải dữ liệu profile. Vui lòng thử lại."))
      .finally(() => setProfileLoading(false));
  }, [settingsLoading, settings]);

  const onChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "preferredLanguage") {
      setDirty(value !== profileLanguage);
    }
    setMessage("");
  }, [profileLanguage]);

  const updateDeviceSetting = useCallback(async (field, value) => {
    const previousValue = form[field];
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    try {
      const updated = await updateSettings({ [field]: value });
      if (field === "allowLocation" && !updated.allowLocation) {
        localStorage.removeItem("user_location");
        try {
          window.dispatchEvent(new CustomEvent("user_location_updated", { detail: null }));
        } catch (eventError) {
          // Ignore cross-component event issues.
        }
      }
      setMessage("Đã cập nhật cài đặt.");
      return updated;
    } catch (err) {
      setForm((prev) => ({ ...prev, [field]: previousValue }));
      setError(err?.message || "Không thể cập nhật cài đặt.");
      throw err;
    }
  }, [form, updateSettings]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      theme: settings.theme || "light",
      fontScale: settings.fontScale || "normal",
      allowLocation: settings.allowLocation !== false,
      allowCamera: settings.allowCamera !== false,
    }));
  }, [settings.theme, settings.fontScale, settings.allowLocation, settings.allowCamera]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await userService.updateProfile({ preferredLanguage: form.preferredLanguage });
      setProfileLanguage(form.preferredLanguage);updateDeviceSetting
      setDirty(false);
      setMessage("Đã lưu ngôn ngữ hiển thị.");
    } catch (err) {
      setError(err?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading || profileLoading) {
    return (
      <section className="container" style={{ padding: "28px 24px", maxWidth: 620 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Cài đặt tài khoản</h1>
        <div className="card" style={{ padding: 24, color: "#64748b" }}>Đang tải cài đặt...</div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 620 }}>
      <div style={{ display: "grid", gap: 6, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0d2238" }}>⚙️ Cài đặt tài khoản</h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Tuỳ chỉnh giao diện, ngôn ngữ và quyền thiết bị.
          {dirty && <span style={{ marginLeft: 10, color: "#d97706", fontWeight: 600, fontSize: 12 }}>● Có thay đổi chưa lưu</span>}
        </p>
      </div>

      <form className="card-elevated" style={{ padding: 24, display: "grid", gap: 20 }} onSubmit={onSubmit}>
        {/* GIAO DIỆN */}
        <div style={{ display: "grid", gap: 12 }}>
          <SectionLabel>Giao diện</SectionLabel>
          <FieldRow label="Chế độ hiển thị">
            <select value={form.theme} onChange={(e) => onChange("theme", e.target.value)}>
              <option value="light">☀️ Sáng</option>
              <option value="dark">🌙 Tối</option>
            </select>
          </FieldRow>
          <FieldRow label="Cỡ chữ">
            <select value={form.fontScale} onChange={(e) => updateDeviceSetting("fontScale", e.target.value)}>
              <option value="compact">Nhỏ</option>
              <option value="normal">Vừa (mặc định)</option>
              <option value="large">Lớn</option>
            </select>
          </FieldRow>
          <FieldRow label="Ngôn ngữ ưu tiên">
            <select value={form.preferredLanguage} onChange={(e) => onChange("preferredLanguage", e.target.value)}>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </FieldRow>
        </div>

        {/* QUYỀN THIẾT BỊ */}
        <div style={{ display: "grid", gap: 12 }}>
          <SectionLabel>Quyền thiết bị</SectionLabel>
          <ToggleRow
            title="Cho phép lấy vị trí"
            description="Dùng GPS để gợi ý chi nhánh gần nhất và phòng phù hợp."
            checked={form.allowLocation}
            onToggle={() => updateDeviceSetting("allowLocation", !form.allowLocation)}
            badge={form.allowLocation ? { label: "Bật", bg: "#dcfce7", color: "#166534" } : { label: "Tắt", bg: "#f1f5f9", color: "#64748b" }}
          />
          <ToggleRow
            title="Cho phép truy cập camera"
            description="Dùng camera để chụp ảnh đại diện hoặc xác thực hình ảnh."
            checked={form.allowCamera}
            onToggle={() => updateDeviceSetting("allowCamera", !form.allowCamera)}
            badge={form.allowCamera ? { label: "Bật", bg: "#dcfce7", color: "#166534" } : { label: "Tắt", bg: "#f1f5f9", color: "#64748b" }}
          />
          {form.allowCamera && <CameraStatusCard browserStatus={browserCameraStatus} />}
          {!form.allowCamera && browserCameraStatus === "granted" && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", fontSize: 12 }}>
              ⚠️ Trình duyệt đang cấp quyền camera nhưng ứng dụng sẽ không sử dụng vì bạn đã tắt trong cài đặt này.
            </div>
          )}
        </div>

        {error && <div style={{ padding: "12px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 14 }}>❌ {error}</div>}
        {message && <div style={{ padding: "12px 14px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>✅ {message}</div>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button className="btn btn-gold" disabled={saving || !dirty} style={{ opacity: saving || !dirty ? 0.6 : 1, cursor: saving || !dirty ? "not-allowed" : "pointer" }}>
            {saving ? "⏳ Đang lưu..." : "💾 Lưu ngôn ngữ"}
          </button>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_PROFILE}>👤 Hồ sơ cá nhân</Link>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS_ADVANCED}>🔐 Bảo mật</Link>
        </div>
      </form>

      <p style={{ margin: "16px 0 0", fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        💡 Cài đặt giao diện được áp dụng ngay và lưu vào tài khoản. Quyền camera / vị trí chỉ có hiệu lực trong ứng dụng; trình duyệt vẫn quản lý quyền thực tế độc lập.
      </p>
    </section>
  );
}
