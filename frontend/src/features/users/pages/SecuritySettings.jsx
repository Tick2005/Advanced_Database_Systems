import { useState } from "react";
import { Link } from "react-router-dom";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

export default function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [preferences, setPreferences] = useState({
    newsletter: true,
    promoNotification: true,
    bookingEmail: true,
    loginAlert: true
  });

  const preferenceLabels = {
    newsletter: "Nhan ban tin hang thang",
    promoNotification: "Nhan uu dai va ma giam gia",
    bookingEmail: "Nhan email cap nhat booking",
    loginAlert: "Canh bao khi co dang nhap moi"
  };
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changePassword = (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("Vui long nhap day du thong tin doi mat khau");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Mat khau moi can it nhat 8 ky tu");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Xac nhan mat khau khong khop");
      return;
    }

    setMessage("Yeu cau doi mat khau da duoc ghi nhan. Vui long dung chuc nang Quen mat khau de cap nhat tren he thong.");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const savePreferences = () => {
    localStorage.setItem("luxstay.customer.preferences", JSON.stringify(preferences));
    setMessage("Da luu cai dat thong bao tren trinh duyet hien tai");
    setError("");
  };

  return (
    <section className="container" style={{ padding: "28px 24px", display: "grid", gap: 14 }}>
      <h1>Cai dat nang cao</h1>

      <article className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Bao mat tai khoan</h3>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 10 }}>
          <div className="field">
            <label>Mat khau hien tai</label>
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))} />
          </div>
          <div className="field">
            <label>Mat khau moi</label>
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
          </div>
          <div className="field">
            <label>Xac nhan mat khau moi</label>
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary">Gui yeu cau doi mat khau</button>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.FORGOT_PASSWORD}>Quen mat khau</Link>
          </div>
        </form>
      </article>

      <article className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Thong bao & quyen rieng tu</h3>
        {Object.entries(preferences).map(([key, value]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(event) => setPreferences((prev) => ({ ...prev, [key]: event.target.checked }))}
            />
            <span>{preferenceLabels[key]}</span>
          </label>
        ))}
        <button className="btn btn-gold" onClick={savePreferences}>Luu cai dat</button>
      </article>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
