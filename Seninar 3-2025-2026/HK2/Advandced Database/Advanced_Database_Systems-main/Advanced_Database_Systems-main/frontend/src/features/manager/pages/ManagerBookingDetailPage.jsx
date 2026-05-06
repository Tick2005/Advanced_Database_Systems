import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function ManagerBookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getManagerBookingDetail(id)
      .then((data) => setBooking(data || null))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 14, maxWidth: 800 }}>
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>📋 Chi tiết booking</h1>
          <p>Xem toàn bộ thông tin đặt phòng, khách hàng, và tình trạng thanh toán.</p>
        </div>
      </div>
      
      {loading ? (
        <article className="card" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Đang tải...</article>
      ) : !booking ? (
        <article className="card" style={{ padding: 18, display: "grid", gap: 10, background: "#fee2e2", border: "1px solid #fecaca" }}>
          <div style={{ color: "#b91c1c", fontWeight: 700 }}>❌ Không tìm thấy booking</div>
          <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>Booking ID: {id}</p>
          <Link className="btn btn-primary" style={{ fontSize: 13, padding: "8px 14px" }} to={PATHS.MANAGER_BOOKINGS}>Quay lại danh sách</Link>
        </article>
      ) : (
        <>
          <article className="card" style={{ padding: "14px 16px", display: "grid", gap: 12, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: "#0c4a6e", fontWeight: 700 }}>BOOKING ID</div>
                <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#0d2238" }}>{id}</div>
              </div>
              <StatusBadge value={booking.status} />
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: 12, color: "#0c4a6e", fontWeight: 700 }}>TỔNG TIỀN</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#9a7d24" }}>{formatCurrencyVnd(booking.totalPrice || 0)}</div>
              </div>
            </div>
          </article>

          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            {/* Booking Info */}
            <article className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📅 Thông tin đặt phòng</h3>
              <DetailGrid>
                <DetailItem label="Phòng" value={`Phòng ${booking.roomNumber || booking.roomId?.slice(0, 8) || "?"}`} />
                <DetailItem label="Loại phòng" value={booking.roomTypeName || "—"} />
                <DetailItem label="Check-in" value={booking.checkInDate || "—"} />
                <DetailItem label="Check-out" value={booking.checkOutDate || "—"} />
                <DetailItem label="Tổng tiền" value={formatCurrencyVnd(booking.totalPrice || 0)} bold />
                <DetailItem label="Thanh toán" value={booking.paymentStatus || "—"} />
                {booking.notes && <DetailItem label="Ghi chú" value={booking.notes} fullWidth />}
              </DetailGrid>
            </article>

            {/* Customer Info */}
            <article className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>👤 Thông tin khách hàng</h3>
              <DetailGrid>
                <DetailItem label="Họ tên" value={booking.customerName || booking.guestName || "—"} bold />
                <DetailItem label="Email" value={booking.customerEmail || "—"} />
                <DetailItem label="SĐT" value={booking.customerPhone || booking.guestPhone || "—"} />
                <DetailItem label="Mã khách" value={booking.customerId?.slice(0, 12) || "Khách vãng lai"} mono />
                {booking.specialRequests && <DetailItem label="Yêu cầu đặc biệt" value={booking.specialRequests} fullWidth />}
              </DetailGrid>
            </article>
          </div>

          <Link className="btn btn-primary" style={{ justifySelf: "start" }} to={PATHS.MANAGER_BOOKINGS}>← Quay lại danh sách</Link>
        </>
      )}
    </section>
  );
}

function DetailGrid({ children }) {
  return <div style={{ display: "grid", gap: 10 }}>{children}</div>;
}

function DetailItem({ label, value, mono, bold, fullWidth }) {
  return (
    <div style={{ display: fullWidth ? "grid" : "flex", gap: 8, ...(!fullWidth && { alignItems: "flex-start" }) }}>
      <span style={{ color: "#64748b", minWidth: 100, flexShrink: 0, fontWeight: 700, fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all", color: "#0f172a" }}>{value}</span>
    </div>
  );
}
