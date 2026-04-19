import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../userService";
import { PATHS } from "../../../routes/pathConstants";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    avatarUrl: "",
    address: "",
    preferredLanguage: "vi"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    userService.getProfile().then((profile) => {
      setForm((prev) => ({
        ...prev,
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        avatarUrl: profile.avatarUrl || "",
        address: profile.address || "",
        preferredLanguage: profile.preferredLanguage || "vi"
      }));
    }).catch(() => {
      setError("Khong the nap du lieu profile");
    }).finally(() => setLoading(false));
  }, []);

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.fullName && form.fullName.trim().length < 2) {
      nextErrors.fullName = "Ho ten toi thieu 2 ky tu";
    }
    if (form.phone && !/^[0-9+\s-]{8,15}$/.test(form.phone)) {
      nextErrors.phone = "So dien thoai khong hop le";
    }
    if (form.avatarUrl && !/^https?:\/\//.test(form.avatarUrl)) {
      nextErrors.avatarUrl = "Avatar URL phai bat dau bang http:// hoac https://";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await userService.updateProfile(form);
      setMessage("Cap nhat profile thanh cong");
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
        <h1 style={{ margin: 0 }}>Cài đặt tài khoản</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Cập nhật thông tin cá nhân và tùy chọn tài khoản</p>
      </div>

      <form className="card-elevated" style={{ padding: 24, display: "grid", gap: 16 }} onSubmit={onSubmit}>
        {/* Personal Info Section */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>THÔNG TIN CÁ NHÂN</div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Họ tên</label>
            <input placeholder="Nhập họ tên" value={form.fullName} onChange={(event) => onChange("fullName", event.target.value)} />
            {fieldErrors.fullName && <small style={{ color: "#b91c1c" }}>{fieldErrors.fullName}</small>}
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Số điện thoại</label>
            <input placeholder="Nhập số điện thoại" value={form.phone} onChange={(event) => onChange("phone", event.target.value)} />
            {fieldErrors.phone && <small style={{ color: "#b91c1c" }}>{fieldErrors.phone}</small>}
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Địa chỉ</label>
            <input placeholder="Nhập địa chỉ" value={form.address} onChange={(event) => onChange("address", event.target.value)} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0" }} />

        {/* Account Settings Section */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>TÙY CHỌN TÀI KHOẢN</div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Avatar URL</label>
            <input placeholder="Nhập URL avatar (http:// hoặc https://)" value={form.avatarUrl} onChange={(event) => onChange("avatarUrl", event.target.value)} />
            {fieldErrors.avatarUrl && <small style={{ color: "#b91c1c" }}>{fieldErrors.avatarUrl}</small>}
          </div>
          <div className="field">
            <label style={{ fontSize: 14, fontWeight: 600 }}>Ngôn ngữ ưu tiên</label>
            <select value={form.preferredLanguage} onChange={(event) => onChange("preferredLanguage", event.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={{ padding: "12px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 14 }}>{error}</div>}
        {message && <div style={{ padding: "12px 14px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>{message}</div>}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          <button className="btn btn-gold" disabled={saving} style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_SETTINGS_ADVANCED}>Cài đặt nâng cao</Link>
        </div>
      </form>
    </section>
  );
}
