/**
 * StaffCheckinPage.jsx
 * Commit: feat(staff): StaffCheckinPage – load booking detail trước check-in, hiển thị thông tin đầy đủ, confirm dialog
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffCheckinPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    dashboardService.getStaffBookingDetail(id)
      .then((data) => { setBooking(data); setFetchError(""); })
      .catch((err) => setFetchError(err?.message || "Không thể tải thông tin booking."))
      .finally(() => setFetchLoading(false));
  }, [id]);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await dashboardService.checkInBooking(id);
      setMessage("Check-in thành công! Đang chuyển trang...");
      setTimeout(() => navigate(PATHS.STAFF_BOOKINGS_TODAY), 1200);
    } catch (err) {
      setError(err?.message || "Không thể thực hiện check-in. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, maxWidth: 640, margin: "0 auto", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg, #166534 0%, #15803d 100%)", color: "white" }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Thao tác Staff</div>
        <div style={{ fontWeight: 800, fontSize: 20 }}>✅ Xác nhận Check-in</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Khách đã đến – nhận phòng và chuyển trạng thái CHECKED_IN</div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error"   message={error}   onClose={() => setError("")}   />

      {fetchLoading && (
        <div className="card" style={{ padding: 20, color: "#64748b" }}>Đang tải thông tin booking...</div>
      )}

      {fetchError && (
        <div style={{ padding: "14px 16px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 12, color: "#b91c1c", fontSize: 14 }}>
          ❌ {fetchError}
        </div>
      )}

      {booking && !fetchLoading && (
        <article className="card" style={{ padding: 20, display: "grid", gap: 16 }}>
          {/* Booking Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Khách hàng",   value: booking.customerName  || booking.guestName || "—" },
              { label: "Số phòng",     value: booking.roomNumber    || booking.roomId?.slice(0,8) || "—" },
              { label: "Ngày nhận",    value: booking.checkInDate   || "—" },
              { label: "Ngày trả",     value: booking.checkOutDate  || "—" },
              { label: "Số người lớn", value: booking.adults ?? "—" },
              { label: "Trẻ em",       value: booking.children ?? "—" },
            ].map((f) => (
              <div key={f.label} style={{ display: "grid", gap: 3 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0d2238" }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Trạng thái hiện tại:</span>
            <StatusBadge value={booking.status} />
          </div>

          {/* Booking ID */}
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, color: "#166534", fontWeight: 700, marginBottom: 4 }}>BOOKING ID</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#15803d", wordBreak: "break-all" }}>{id}</div>
          </div>

          {/* Xác nhận checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>Tôi xác nhận khách hàng đã đến và đủ điều kiện nhận phòng.</span>
          </label>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_BOOKINGS_TODAY}>Quay lại</Link>
            <button className="btn btn-primary" onClick={submit} disabled={loading || !confirmed || message}>
              {loading ? "⏳ Đang xử lý..." : "✅ Xác nhận Check-in"}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
