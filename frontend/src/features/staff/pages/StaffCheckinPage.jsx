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
    <section className="container page-shell" style={{ display: "grid", gap: 14, maxWidth: 600 }}>
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>✅ Check-in booking</h1>
          <p>Xác nhận khách đã đến và nhận phòng. Thao tác này sẽ chuyển booking sang trạng thái CHECKED_IN.</p>
        </div>
      </div>
      <article className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>📋 Booking ID</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#15803d", wordBreak: "break-all" }}>{id}</div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_BOOKINGS_TODAY}>Quay lại</Link>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Đang xử lý..." : "✓ Xác nhận check-in"}
          </button>
        </div>
      </article>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
