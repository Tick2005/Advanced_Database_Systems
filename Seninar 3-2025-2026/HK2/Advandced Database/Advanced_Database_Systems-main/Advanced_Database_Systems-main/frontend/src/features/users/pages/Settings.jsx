// commit: fix(settings): hoàn thiện logic Settings — fallback localStorage, camera profile link, cleanup UI
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import { PATHS } from "../../../routes/pathConstants";
import ToastMessage from "../../../components/common/ToastMessage";
import SkeletonBlock from "../../../components/common/SkeletonBlock";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applySettingsToDOM(theme, fontScale) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.fontScale = fontScale;
}

function persistSettingsLocally(settings) {
  localStorage.setItem("ux_theme", settings.theme);
  localStorage.setItem("ux_font_scale", settings.fontScale);
  localStorage.setItem("ux_allow_location", String(settings.allowLocation));
  localStorage.setItem("ux_allow_camera", String(settings.allowCamera));
  if (!settings.allowLocation) {
    localStorage.removeItem("user_location");
  }
}

function loadLocalSettings() {
  return {
    theme: localStorage.getItem("ux_theme") || "light",
    fontScale: localStorage.getItem("ux_font_scale") || "normal",
    allowLocation: localStorage.getItem("ux_allow_location") !== "false",
    allowCamera: localStorage.getItem("ux_allow_camera") !== "false",
  };
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({ title, description, checked, onToggle, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "12px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: "#64748b" }}>{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        disabled={disabled}
        style={{
          width: 52,
          height: 30,
          borderRadius: 99,
          border: "none",
          background: checked ? "#0d2238" : "#cbd5e1",
          padding: 3,
          cursor: disabled ? "not-allowed" : "pointer",
          position: "relative",
          transition: "background 0.2s",
          flexShrink: 0,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  const [loadingState, setLoadingState] = useState("loading");
  const [form, setForm] = useState({
    theme: "light",
    fontScale: "normal",
    preferredLanguage: "vi",
    allowLocation: true,
    allowCamera: true,
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [settingsSource, setSettingsSource] = useState("remote");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    Promise.all([
      userService.getProfile().catch(() => null),
      userService.getSettings().catch(() => null),
    ]).then(([profile, settings]) => {
      if (!mountedRef.current) return;
      const local = loadLocalSettings();

      if (!settings && !profile) {
        setForm((prev) => ({ ...prev, ...local }));
        setSettingsSource("local");
        setProfileLoadError(true);
      } else {
        setForm({
          theme: settings?.theme || local.theme,
          fontScale: settings?.fontScale || local.fontScale,
          preferredLanguage: profile?.preferredLanguage || "vi",
          allowLocation:
            settings?.allowLocation !== undefined ? settings.allowLocation : local.allowLocation,
          allowCamera:
            settings?.allowCamera !== undefined ? settings.allowCamera : local.allowCamera,
        });
        setSettingsSource(settings ? "remote" : "local");
        if (!profile) setProfileLoadError(true);
      }
      setLoadingState("ready");
    });

    return () => { mountedRef.current = false; };
  }, []);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    const errors = [];

    if (!profileLoadError) {
      try {
        await userService.updateProfile({ preferredLanguage: form.preferredLanguage });
      } catch {
        errors.push("Không thể cập nhật ngôn ngữ profile.");
      }
    }

    try {
      await userService.updateSettings({
        theme: form.theme,
        fontScale: form.fontScale,
        allowLocation: form.allowLocation,
        allowCamera: form.allowCamera,
      });
    } catch {
      errors.push("Không thể lưu lên máy chủ — đã lưu cục bộ.");
    }

    persistSettingsLocally(form);
    applySettingsToDOM(form.theme, form.fontScale);

    try {
      window.dispatchEvent(
        new CustomEvent("user_settings_updated", {
          detail: {
            theme: form.theme,
            fontScale: form.fontScale,
            allowLocation: form.allowLocation,
            allowCamera: form.allowCamera,
          },
        })
      );
    } catch { /* non-critical */ }

    if (errors.length > 0) setErrorMsg(errors.join(" "));
    else setSuccessMsg("Đã lưu cài đặt thành công.");
    setSaving(false);
  };

  if (loadingState === "loading") {
    return (
      <section className="container" style={{ padding: "28px 24px", maxWidth: 620 }}>
        <h1 style={{ margin: 0, marginBottom: 16 }}>Cài đặt tài khoản</h1>
        <SkeletonBlock rows={6} />
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 620 }}>
      <div style={{ display: "grid", gap: 6, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Cài đặt</h1>
        <p style={{ margin: 0, color: "#64748b" }}>
          Tuỳ chỉnh giao diện, ngôn ngữ và quyền thiết bị.
        </p>
        {settingsSource === "local" && (
          <div style={{ padding: "8px 12px", background: "#fef9c3", color: "#854d0e", borderRadius: 8, fontSize: 13 }}>
            ⚠️ Đang dùng cài đặt cục bộ — kết nối máy chủ gặp sự cố.
          </div>
        )}
      </div>

      <form className="card-elevated" style={{ padding: 24, display: "grid", gap: 20 }} onSubmit={onSubmit}>
        {/* Giao diện */}
        <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
          <legend style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Giao diện
          </legend>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Chế độ sáng / tối</label>
            <select value={form.theme} onChange={(e) => onChange("theme", e.target.value)}>
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Cỡ chữ</label>
            <select value={form.fontScale} onChange={(e) => onChange("fontScale", e.target.value)}>
              <option value="compact">Nhỏ (compact)</option>
              <option value="normal">Vừa (normal)</option>
              <option value="large">Lớn (large)</option>
            </select>
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>
              Ngôn ngữ ưu tiên
              {profileLoadError && (
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400, marginLeft: 8 }}>(chỉ lưu cục bộ)</span>
              )}
            </label>
            <select
              value={form.preferredLanguage}
              onChange={(e) => onChange("preferredLanguage", e.target.value)}
              disabled={profileLoadError}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </fieldset>

        {/* Quyền thiết bị */}
        <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          <legend style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Quyền ứng dụng
          </legend>
          <ToggleRow
            title="Cho phép lấy vị trí"
            description="Ưu tiên chi nhánh và phòng gần bạn nhất."
            checked={form.allowLocation}
            onToggle={() => onChange("allowLocation", !form.allowLocation)}
          />
          <div>
            <ToggleRow
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Cho phép camera
                  <span style={{ fontSize: 12, background: form.allowCamera ? "#dcfce7" : "#fee2e2", color: form.allowCamera ? "#166534" : "#b91c1c", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>
                    {form.allowCamera ? "Đã bật" : "Đã tắt"}
                  </span>
                </span>
              }
              description="Dùng camera để chụp ảnh đại diện hoặc xác thực khuôn mặt."
              checked={form.allowCamera}
              onToggle={() => onChange("allowCamera", !form.allowCamera)}
            />
            {form.allowCamera && (
              <div style={{ marginTop: 8, paddingLeft: 2 }}>
                <Link
                  to={PATHS.CUSTOMER_CAMERA_PROFILE}
                  style={{ fontSize: 13, color: "#0d2238", display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "underline" }}
                >
                  Quản lý cấu hình camera &rarr;
                </Link>
              </div>
            )}
          </div>
        </fieldset>

        <ToastMessage type="error" message={errorMsg} onClose={() => setErrorMsg("")} />
        <ToastMessage type="success" message={successMsg} onClose={() => setSuccessMsg("")} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-gold" type="submit" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_PROFILE}>← Về profile</Link>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS_ADVANCED}>Bảo mật &rarr;</Link>
        </div>
      </form>
    </section>
  );
}
