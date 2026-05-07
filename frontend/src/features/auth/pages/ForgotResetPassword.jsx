import { useState } from "react";
import { authService } from "../authService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await authService.forgotPassword(email);
      setMessage("Yeu cau dat lai mat khau da duoc gui. Vui long kiem tra email.");
    } catch (err) {
      setError(err.message || "Khong the gui yeu cau reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)" }}>
      <form className="card" style={{ width: "min(420px,100%)", padding: 20, display: "grid", gap: 12 }} onSubmit={onSubmit}>
        <h1 style={{ margin: 0 }}>Quen mat khau</h1>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {message && <div style={{ color: "#166534" }}>{message}</div>}
        <button className="btn btn-primary" disabled={loading}>{loading ? "Dang gui..." : "Gui yeu cau"}</button>
      </form>
    </section>
  );
}

export function ResetPasswordPage() {
  const [form, setForm] = useState({ email: "", token: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await authService.resetPassword(form);
      setMessage("Dat lai mat khau thanh cong. Ban co the dang nhap lai.");
    } catch (err) {
      setError(err.message || "Dat lai mat khau that bai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 160px)" }}>
      <form className="card" style={{ width: "min(460px,100%)", padding: 20, display: "grid", gap: 12 }} onSubmit={onSubmit}>
        <h1 style={{ margin: 0 }}>Dat lai mat khau</h1>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} required />
        </div>
        <div className="field">
          <label>Token</label>
          <input value={form.token} onChange={(event) => onChange("token", event.target.value)} required />
        </div>
        <div className="field">
          <label>Mat khau moi</label>
          <input type="password" minLength={6} value={form.newPassword} onChange={(event) => onChange("newPassword", event.target.value)} required />
        </div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        {message && <div style={{ color: "#166534" }}>{message}</div>}
        <button className="btn btn-gold" disabled={loading}>{loading ? "Dang cap nhat..." : "Dat lai mat khau"}</button>
      </form>
    </section>
  );
}
