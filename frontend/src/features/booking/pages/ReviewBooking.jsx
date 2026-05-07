import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import ServiceSelector from "../ServiceSelector";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { formatCurrencyVnd } from "../../../services/presenters";
import { paymentService } from "../paymentService";
import { trackEvent } from "../../../services/tracking";

export default function ReviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const payload = location.state?.payload;
  const room = location.state?.room;
  const [agreed, setAgreed] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("vnpay");

  useBookingFunnelStep("review", { bookingId: booking?.id || null });

  const bookingBranchId = booking?.branchId || payload?.branchId || room?.branchId;
  const servicesTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const finalTotal = Number(booking?.totalPrice || 0) + servicesTotal;
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
    if (!agreed || !booking.id) return;

    setPaying(true);
    setPayError("");

    try {
      trackEvent("booking_step_submit", {
        step: "review",
        bookingId: booking.id,
        finalTotal: finalTotalWithVat,
        paymentMethod
      });

      if (paymentMethod === "direct") {
        navigate(PATHS.CUSTOMER_BOOKINGS, { replace: true });
        return;
      }

      const response = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: finalTotalWithVat,
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`
      });

      if (!response.checkoutUrl) {
        throw new Error("Không nhận được URL thanh toán");
      }

      navigate("/customer/booking/vnpay-transition", {
        state: {
          booking: { ...booking, totalPrice: finalTotalWithVat },
          checkoutUrl: response.checkoutUrl
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tạo thanh toán VNPay";
      setPayError(errorMessage);
      trackEvent("booking_step_failed", {
        step: "review",
        bookingId: booking.id,
        reason: errorMessage || "unknown_error"
      });
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
        <div className="card-elevated" style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>THÔNG TIN BOOKING</div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Phòng:</span>
            <span style={{ fontWeight: 500 }}>{room ? `${room.roomTypeName} - ${room.roomNumber}` : booking.roomId}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Chi nhánh:</span>
            <span style={{ fontWeight: 500 }}>{booking.branchName || room?.branchName || booking.branchId}</span>
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

        <ServiceSelector branchId={bookingBranchId} onServicesChange={setSelectedServices} />

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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
            <span>VAT (8%)</span>
            <span>+{formatCurrencyVnd(Math.round(finalTotal * 0.08))}</span>
          </div>
          <div style={{ borderTop: "1px solid #c9a84c", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#9a7d24" }}>
            <span>Tổng cộng (đã VAT)</span>
            <span>{formatCurrencyVnd(finalTotalWithVat)}</span>
          </div>
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            style={{ marginTop: 4, accentColor: "#9a7d24" }}
          />
          <span style={{ fontSize: 13, color: "#475569" }}>Tôi đồng ý với chính sách hủy phòng. Nếu hủy trước 24h được hoàn 100%, sau 24h mất 20%.</span>
        </label>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0d2238" }}>💳 Chọn hình thức thanh toán</div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", border: paymentMethod === "vnpay" ? "2px solid #c9a84c" : "1px solid #e2e8f0", borderRadius: 12, background: paymentMethod === "vnpay" ? "#fffaf0" : "#f8fafc", cursor: "pointer", transition: "all 0.2s" }}>
            <input
              type="radio"
              name="payment"
              value="vnpay"
              checked={paymentMethod === "vnpay"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ accentColor: "#c9a84c" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#0d2238", fontSize: 14 }}>💰 Thanh toán ngay (VNPay)</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Thanh toán toàn bộ tiền ngay bây giờ, xác nhận booking ngay</div>
            </div>
          </label>

          <label style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", border: paymentMethod === "direct" ? "2px solid #c9a84c" : "1px solid #e2e8f0", borderRadius: 12, background: paymentMethod === "direct" ? "#fffaf0" : "#f8fafc", cursor: "pointer", transition: "all 0.2s" }}>
            <input
              type="radio"
              name="payment"
              value="direct"
              checked={paymentMethod === "direct"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ accentColor: "#c9a84c" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#0d2238", fontSize: 14 }}>🏨 Thanh toán tại quầy</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Đặt phòng trước, thanh toán khi nhận phòng tại lễ tân</div>
            </div>
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn pill pill-soft"
            onClick={() => {
              trackEvent("booking_step_back", { step: "review", bookingId: booking?.id || null });
              navigate(PATHS.CUSTOMER_BOOKING_CREATE, { state: payload });
            }}
            aria-label="Quay lai buoc tao booking"
          >
            Quay lại
          </button>

          {payError && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
              {payError}
            </div>
          )}

          <button
            className="btn btn-gold"
            disabled={!agreed || paying}
            onClick={handlePayNow}
            style={{ opacity: agreed && !paying ? 1 : 0.5, flex: 1, minWidth: 200 }}
          >
            {paying ? "⏳ Đang xử lý..." : paymentMethod === "vnpay" ? `💳 Thanh toán VNPay — ${formatCurrencyVnd(finalTotalWithVat)}` : `🏨 Đặt phòng & Thanh toán sau — ${formatCurrencyVnd(finalTotalWithVat)}`}
          </button>
        </div>
      </div>
    </section>
  );
}
