import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import ServiceSelector from "../ServiceSelector";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { BOOKING_STEPS, trackBookingStep, normalizeBookingError } from "../../../services/bookingFunnel";
import { formatCurrencyVnd } from "../../../services/presenters";
import { paymentService } from "../paymentService";


export default function ReviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const payload = location.state?.payload;
  const room = location.state?.room;
  const [agreed, setAgreed] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  useBookingFunnelStep(BOOKING_STEPS.REVIEW, { bookingId: booking?.id || null });
  const bookingBranchId = booking?.branchId || payload?.branchId || room?.branchId;
  const [paying, setPaying] = useState(false);
const [payError, setPayError] = useState("");
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const finalTotal = (Number(booking?.totalPrice || 0) + servicesTotal);
  const finalTotalWithVat = Math.round(finalTotal * 1.08);
  if (!booking) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Không có booking để review</h1>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKING_CREATE)}>
          Quay lại tạo booking
        </button>
      </section>
    );
  }
  const handlePayNow = async () => {
  if (!agreed || !booking?.id) return;
    setPaying(true);
    setPayError("");
    try {
      trackBookingStep("step_submit", { step: BOOKING_STEPS.REVIEW, bookingId: booking.id, finalTotal: finalTotalWithVat });
      const response = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: finalTotalWithVat,
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`
      });
      if (!response.checkoutUrl) throw new Error("Không nhận được URL thanh toán");
      window.location.href = response.checkoutUrl;
    } catch (err) {
      setPayError(err.message || "Không thể tạo thanh toán VNPay");
      trackBookingStep("step_failed", { step: BOOKING_STEPS.REVIEW, bookingId: booking.id, reason: normalizeBookingError(err) });
      setPaying(false);
    }
  };
  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 640 }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Xác nhận đặt phòng</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Kiểm tra thông tin và chọn dịch vụ bổ sung</p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Booking Summary */}
        <div className="card-elevated" style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>THÔNG TIN BOOKING</div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Phòng:</span>
              <span style={{ fontWeight: 500 }}>{room ? `${room.roomTypeName} - ${room.roomNumber}` : booking.roomId}</span>
            </div>
          {/* Booking ID bị ẩn — không hiển thị ra UI */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Chi nhánh:</span>
            <span style={{ fontWeight: 500 }}>
              {booking.branchName || room?.branchName || booking.branchId}
            </span>
          </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Thời gian lưu:</span>
              <span style={{ fontWeight: 500 }}>{payload?.checkInDate} → {payload?.checkOutDate}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Khách:</span>
              <span style={{ fontWeight: 500 }}>{payload?.adults || 0} người lớn, {payload?.children || 0} trẻ em</span>
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Giá phòng:</span>
              <span className="mono" style={{ fontWeight: 700, color: "#9a7d24" }}>{formatCurrencyVnd(booking.totalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Service Selector */}
        <ServiceSelector branchId={bookingBranchId} onServicesChange={setSelectedServices} />

        {/* Total */}
        <div className="card-elevated" style={{ padding: 18, background: "#f0f4ff", display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
            <span>Giá phòng</span>
            <span>{formatCurrencyVnd(booking.totalPrice)}</span>
          </div>
          {servicesTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
              <span>Dịch vụ thêm ({selectedServices.length})</span>
              <span>{formatCurrencyVnd(servicesTotal)}</span>
            </div>
          )}
          {/* VAT */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
          <span>VAT (8%)</span>
          <span>+{formatCurrencyVnd(Math.round(finalTotal * 0.08))}</span>
        </div>
        <div style={{ borderTop: "1px solid #c9a84c", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#9a7d24" }}>
          <span>Tổng cộng (đã VAT)</span>
          <span>{formatCurrencyVnd(Math.round(finalTotal * 1.08))}</span>
        </div>
        </div>

        {/* Agreement & Actions */}
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} style={{ marginTop: 4, accentColor: "#9a7d24" }} />
          <span style={{ fontSize: 13, color: "#475569" }}>Tôi đồng ý với chính sách hủy phòng. Nếu hủy trước 24h được hoàn 100%, sau 24h mất 20%.</span>
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn pill pill-soft" onClick={() => {
            trackBookingStep("step_back", { step: BOOKING_STEPS.REVIEW, bookingId: booking?.id || null });
            navigate(PATHS.CUSTOMER_BOOKING_CREATE, { state: payload });
          }} aria-label="Quay lai buoc tao booking">Quay lại</button>
          {payError && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
              {payError}
            </div>
          )}
          <button
            className="btn btn-gold"
            disabled={!agreed || paying}
            onClick={handlePayNow}
            style={{ opacity: agreed && !paying ? 1 : 0.5 }}
          >
            {paying ? "⏳ Đang chuyển đến VNPay..." : `Xác nhận & Thanh toán — ${formatCurrencyVnd(finalTotalWithVat)}`}
          </button>
        </div>
    </section>
  );
}
