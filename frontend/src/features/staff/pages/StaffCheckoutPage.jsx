/**
 * StaffCheckoutPage.jsx
 * Commit: feat(staff): StaffCheckoutPage – load booking detail trước check-out, hiển thị tổng chi phí, confirm dialog
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function StaffCheckoutPage() {
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
      await dashboardService.checkOutBooking(id);
      setMessage("Check-out thành công! Đang chuyển trang...");
      setTimeout(() => navigate(PATHS.STAFF_BOOKINGS_TODAY), 1200);
    } catch (err) {
      setError(err?.message || "Không thể thực hiện check-out. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, maxWidth: 640, margin: "0 auto", padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg, #854d0e 0%, #b45309 100%)", color: "white" }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Thao tác Staff</div>
        <div style={{ fontWeight: 800, fontSize: 20 }}>🏁 Xác nhận Check-out</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Khách trả phòng – kết thúc lưu trú và cập nhật trạng thái</div>
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
              { label: "Khách hàng",  value: booking.customerName || booking.guestName || "—" },
              { label: "Số phòng",    value: booking.roomNumber   || booking.roomId?.slice(0,8) || "—" },
              { label: "Ngày nhận",   value: booking.checkInDate  || "—" },
              { label: "Ngày trả",    value: booking.checkOutDate || "—" },
            ].map((f) => (
              <div key={f.label} style={{ display: "grid", gap: 3 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0d2238" }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Tổng tiền */}
          {booking.totalPrice && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef9c3", border: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#854d0e" }}>💰 Tổng chi phí lưu trú:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#9a7d24" }}>{formatCurrencyVnd(booking.totalPrice)}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Trạng thái hiện tại:</span>
            <StatusBadge value={booking.status} />
          </div>

          {/* Booking ID */}
          <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fef3c7", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, marginBottom: 4 }}>BOOKING ID</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#9a7d24", wordBreak: "break-all" }}>{id}</div>
          </div>

          {/* Xác nhận */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>Tôi xác nhận khách hàng đã trả phòng và hoàn tất thủ tục.</span>
          </label>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_BOOKINGS_TODAY}>Quay lại</Link>
            <button className="btn btn-gold" onClick={submit} disabled={loading || !confirmed || message}>
              {loading ? "⏳ Đang xử lý..." : "🏁 Xác nhận Check-out"}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
