// commit: feat(staff-checkin): hiển thị thông tin booking, nút xác nhận rõ ràng hơn
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";

function BookingInfoCard({ booking }) {
  if (!booking) return null;
  const rows = [
    { label: "Booking ID", value: booking.id || booking.bookingId || "—" },
    { label: "Khách hàng", value: booking.guestName || booking.customerName || "—" },
    { label: "Phòng", value: booking.roomNumber || booking.roomName || "—" },
    { label: "Check-in", value: booking.checkInDate || booking.startDate || "—" },
    { label: "Check-out", value: booking.checkOutDate || booking.endDate || "—" },
    { label: "Trạng thái", value: booking.status || "—" },
  ];
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {rows.map(({ label, value }) => (
        <div
          key={label}
          style={{ display: "flex", gap: 8, justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}
        >
          <span style={{ color: "#64748b", fontWeight: 500 }}>{label}</span>
          <span style={{ fontWeight: 600, textAlign: "right", wordBreak: "break-all", maxWidth: "60%" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StaffCheckinPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoadingBooking(true);
    dashboardService
      .getManagerBookingDetail(id)
      .then((data) => setBooking(data))
      .catch(() => setBooking(null))
      .finally(() => setLoadingBooking(false));
  }, [id]);

  const handleCheckin = async () => {
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await dashboardService.checkInBooking(id);
      setSuccessMsg("Check-in thành công! Đang chuyển hướng...");
      setTimeout(() => navigate(PATHS.STAFF_BOOKINGS_TODAY), 1200);
    } catch (err) {
      setErrorMsg(err?.message || "Không thể check-in. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 16, maxWidth: 620 }}>
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>✅ Check-in booking</h1>
          <p style={{ color: "#64748b", marginTop: 4 }}>
            Xác nhận khách đã đến và nhận phòng. Booking sẽ chuyển sang trạng thái{" "}
            <strong>CHECKED_IN</strong>.
          </p>
        </div>
      </div>

      {/* Booking info */}
      <article className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: 0, marginBottom: 14, fontSize: 15 }}>Thông tin booking</h3>
        {loadingBooking ? (
          <SkeletonBlock rows={4} />
        ) : booking ? (
          <BookingInfoCard booking={booking} />
        ) : (
          <div
            style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 4 }}>
              Booking ID
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#15803d", wordBreak: "break-all" }}>
              {id}
            </div>
          </div>
        )}
      </article>

      {/* Actions */}
      <article className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link
            className="btn"
            style={{ border: "1px solid #cbd5e1", background: "white" }}
            to={PATHS.STAFF_BOOKINGS_TODAY}
          >
            Quay lại
          </Link>
          <button
            className="btn btn-primary"
            onClick={handleCheckin}
            disabled={submitting}
          >
            {submitting ? "Đang xử lý..." : "✓ Xác nhận Check-in"}
          </button>
        </div>
      </article>

      <ToastMessage type="success" message={successMsg} onClose={() => setSuccessMsg("")} />
      <ToastMessage type="error" message={errorMsg} onClose={() => setErrorMsg("")} />
    </section>
  );
}
