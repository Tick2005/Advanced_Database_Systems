import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { bookingService } from "../bookingService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";

const STATUS_LABELS = {
  CONFIRMED: { label: "Đã xác nhận", color: "#16a34a", bg: "#dcfce7" },
  CHECKED_IN: { label: "Đang lưu trú", color: "#0284c7", bg: "#e0f2fe" },
  CHECKED_OUT: { label: "Đã trả phòng", color: "#64748b", bg: "#f1f5f9" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#ea580c", bg: "#ffedd5" },
  HOLD: { label: "Tạm giữ", color: "#7c3aed", bg: "#ede9fe" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      setBooking(await bookingService.getBookingDetail(id));
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <LoadingState text="Đang tải chi tiết booking..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!booking) return <ErrorState message="Không tìm thấy booking" />;

  const onCancel = async () => {
    setUpdating(true);
    setError("");
    try {
      await bookingService.cancelBooking(booking.id, "Customer cancelled from detail");
      await fetchData();
    } catch (err) {
      setError(err.message || "Không thể hủy booking");
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#64748b", bg: "#f1f5f9" };
  const checkInDate = booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("vi-VN") : "—";
  const checkOutDate = booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("vi-VN") : "—";

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 800 }}>
      <Link className="btn" style={{ border: "1px solid #e2e8f0", marginBottom: 20 }} to={PATHS.CUSTOMER_BOOKINGS}>← Quay lại</Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0d2238" }}>Chi tiết đặt phòng</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Mã booking: {booking.id}</p>
        </div>
        <span style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: statusInfo.bg, color: statusInfo.color, whiteSpace: "nowrap" }}>
          {statusInfo.label}
        </span>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Room Info */}
      <div className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>🏨 Thông tin phòng</div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Loại phòng:</span>
            <span style={{ fontWeight: 600, color: "#0d2238" }}>{booking.roomTypeName || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Số phòng:</span>
            <span style={{ fontWeight: 600, color: "#0d2238" }}>{booking.roomNumber || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Chi nhánh:</span>
            <span style={{ fontWeight: 600, color: "#0d2238" }}>{booking.branchName || "—"}</span>
          </div>
        </div>
      </div>

      {/* Dates & Guests */}
      <div className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>📅 Thời gian lưu trú</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Nhận phòng</div>
            <div style={{ fontWeight: 700, color: "#0d2238" }}>{checkInDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Trả phòng</div>
            <div style={{ fontWeight: 700, color: "#0d2238" }}>{checkOutDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Khách</div>
            <div style={{ fontWeight: 700, color: "#0d2238" }}>{booking.adults || 0} người lớn, {booking.children || 0} trẻ em</div>
          </div>
        </div>
      </div>

      {/* Services */}
      {Array.isArray(booking.services) && booking.services.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>🛎️ Dịch vụ đã chọn</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {booking.services.map((svc, i) => (
              <span key={i} style={{ padding: "6px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 12, color: "#0284c7" }}>
                {svc.name || svc.serviceName || `Dịch vụ ${i + 1}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="card" style={{ padding: 20, marginBottom: 16, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f0f4ff" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>💰 Chi tiết thanh toán</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>Giá phòng:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrencyVnd(booking.totalPrice || 0)}</span>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#0d2238" }}>Tổng cộng (gồm VAT 8%):</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#9a7d24" }}>{formatCurrencyVnd(Math.round((booking.totalPrice || 0) * 1.08))}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && (
          <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff" }} onClick={onCancel} disabled={updating}>
            {updating ? "Đang hủy..." : "Hủy booking"}
          </button>
        )}
        {booking.status === "PENDING_PAYMENT" && (
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKING_PAYMENT} state={{ booking }}>💳 Thanh toán ngay</Link>
        )}
        {booking.status === "CHECKED_OUT" && (
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE} state={{ booking }}>⭐ Đánh giá phòng</Link>
        )}
      </div>
    </section>
  );
}
