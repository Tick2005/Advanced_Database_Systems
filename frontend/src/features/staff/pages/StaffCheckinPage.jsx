import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffCheckinPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await dashboardService.checkInBooking(id);
      setMessage("Check-in thanh cong");
      setTimeout(() => navigate(PATHS.STAFF_BOOKINGS_TODAY), 600);
    } catch (err) {
      setError(err.message || "Khong the check-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0 }}>Check-in booking</h1>
      <div>Booking ID: <span className="mono">{id}</span></div>
      <p style={{ margin: 0, color: "#64748b" }}>Xac nhan khach da den nhan phong.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? "Dang xu ly..." : "Xac nhan check-in"}</button>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_BOOKINGS_TODAY}>Quay lai</Link>
      </div>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
