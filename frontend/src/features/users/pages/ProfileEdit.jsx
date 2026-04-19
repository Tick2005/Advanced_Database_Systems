import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../userService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    avatarUrl: "",
    address: "",
    preferredLanguage: "vi"
  });

  useEffect(() => {
    userService.getProfile().then((profile) => {
      setForm({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        avatarUrl: profile.avatarUrl || "",
        address: profile.address || "",
        preferredLanguage: profile.preferredLanguage || "vi"
      });
    }).catch((err) => {
      setError(err.message || "Khong the tai profile");
    }).finally(() => setLoading(false));
  }, []);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName || form.fullName.trim().length < 2) {
      next.fullName = "Ho ten toi thieu 2 ky tu";
    }
    if (form.phone && !/^[0-9+\s-]{8,15}$/.test(form.phone)) {
      next.phone = "So dien thoai khong hop le";
    }
    if (form.avatarUrl && !/^https?:\/\//.test(form.avatarUrl)) {
      next.avatarUrl = "Avatar URL phai bat dau bang http:// hoac https://";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setMessage("");
    setError("");
    try {
      await userService.updateProfile(form);
      setMessage("Cap nhat ho so thanh cong");
    } catch (err) {
      setError(err.message || "Khong the cap nhat ho so");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="container" style={{ padding: "28px 24px" }}><h1>Dang tai du lieu...</h1></section>;
  }

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Chinh sua ho so</h1>
      <p style={{ marginTop: 0, color: "#64748b" }}>Cap nhat thong tin ca nhan de nhan uu dai va ho tro nhanh hon.</p>
      <form className="card" style={{ padding: 18, display: "grid", gap: 10 }} onSubmit={save}>
        <div className="field">
          <label>Ho ten</label>
          <input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
          {fieldErrors.fullName && <small style={{ color: "#b91c1c" }}>{fieldErrors.fullName}</small>}
        </div>
        <div className="field">
          <label>So dien thoai</label>
          <input value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          {fieldErrors.phone && <small style={{ color: "#b91c1c" }}>{fieldErrors.phone}</small>}
        </div>
        <div className="field">
          <label>Dia chi</label>
          <input value={form.address} onChange={(event) => update("address", event.target.value)} />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input value={form.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} />
          {fieldErrors.avatarUrl && <small style={{ color: "#b91c1c" }}>{fieldErrors.avatarUrl}</small>}
        </div>
        <div className="field">
          <label>Ngon ngu uu tien</label>
          <select value={form.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)}>
            <option value="vi">Vietnamese</option>
            <option value="en">English</option>
          </select>
        </div>
        <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
        <ToastMessage type="error" message={error} onClose={() => setError("")} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary" disabled={saving}>{saving ? "Dang luu..." : "Luu thay doi"}</button>
          <button className="btn" type="button" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => navigate(PATHS.CUSTOMER_PROFILE)}>Huy</button>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.CUSTOMER_SETTINGS_ADVANCED}>Mo cai dat nang cao</Link>
        </div>
      </form>
    </section>
  );
}
