/**
 * ReviewBooking.jsx — Bước 2: Xác nhận & Thanh toán
 *
 * Nhận booking đã được tạo từ PreviewBooking qua location.state.booking.
 * Không tự tạo booking ở đây để tránh tạo trùng.
 *
 * Price Alert Logic:
 *   - Khi booking.priceAlertMessage != null → có thay đổi giá
 *   - INCREASE: giá tăng → cảnh báo đỏ, yêu cầu user xác nhận lại
 *   - DECREASE: giá giảm → thông báo xanh, tự động dùng giá mới
 *   - COMBINED: cả 2 loại pricing cùng tồn tại → thông báo chi tiết
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import ServiceSelector from "../ServiceSelector";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { formatCurrencyVnd } from "../../../services/presenters";
import { paymentService } from "../paymentService";
import { bookingService } from "../bookingService";
import { trackEvent } from "../../../services/tracking";

export default function ReviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();

  // booking = đã được tạo ở PreviewBooking (status HOLD)
  const [booking, setBooking] = useState(location.state?.booking || null);
  const payload  = location.state?.payload;
  const room     = location.state?.room;

  const [agreed, setAgreed]               = useState(false);
  const [priceAlertAcknowledged, setPriceAlertAcknowledged] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [paying, setPaying]               = useState(false);
  const [payError, setPayError]           = useState("");
  const [paymentMethod, setPaymentMethod] = useState("vnpay");
  const [now, setNow]                     = useState(Date.now());
  const [refreshingPrice, setRefreshingPrice] = useState(false);

  useBookingFunnelStep("review", { bookingId: booking?.id || null });

  // Countdown timer cho hold expiry
  const holdExpiresAt = booking?.holdExpiresAt
    ? new Date(booking.holdExpiresAt).getTime()
    : 0;

  useEffect(() => {
    if (!holdExpiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [holdExpiresAt]);

  const holdSecondsLeft = Math.max(0, Math.ceil((holdExpiresAt - now) / 1000));

  const holdLabel = useMemo(() => {
    if (!holdExpiresAt) return "";
    if (holdSecondsLeft <= 0) return "Hết thời gian giữ phòng";
    const m = Math.floor(holdSecondsLeft / 60);
    const s = String(holdSecondsLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [holdExpiresAt, holdSecondsLeft]);

  // Giá phòng: dùng effectiveRate nếu có (giá sau pricing season), ngược lại dùng totalPrice
  const hasAlert = Boolean(booking?.priceAlertMessage);
  const alertType = booking?.priceAlertType; // "INCREASE" | "DECREASE"

  // Nếu có giá mới (effectiveRate), tính lại roomPrice theo đó
  const nights = useMemo(() => {
    if (!payload?.checkInDate || !payload?.checkOutDate) return 1;
    const from = new Date(payload.checkInDate);
    const to   = new Date(payload.checkOutDate);
    return Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)));
  }, [payload]);

  const roomPrice = useMemo(() => {
    if (hasAlert && booking?.effectiveRate) {
      return Number(booking.effectiveRate) * nights;
    }
    return Number(booking?.totalPrice || payload?.totalPrice || 0);
  }, [booking, hasAlert, nights, payload]);

  const servicesTotal   = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const finalTotal      = roomPrice + servicesTotal;
  const finalTotalVat   = Math.round(finalTotal * 1.08);

  // Reload booking để lấy giá mới nhất từ server
  const refreshBookingPrice = async () => {
    if (!booking?.id) return;
    setRefreshingPrice(true);
    try {
      const updated = await bookingService.getBookingDetail(booking.id);
      setBooking(updated);
      setPriceAlertAcknowledged(false);
      trackEvent("booking_price_refreshed", { bookingId: booking.id });
    } catch (err) {
      console.warn("[ReviewBooking] Failed to refresh booking:", err?.message);
    } finally {
      setRefreshingPrice(false);
    }
  };

  /**
   * Khi user nhấn "← Quay lại" từ ReviewBooking:
   * Booking đang ở trạng thái HOLD → cần cancel để giải phóng phòng ngay,
   * không chờ scheduler expire sau 15 phút.
   */
  const handleGoBack = async () => {
    if (booking?.id && ["HOLD", "PENDING_PAYMENT"].includes(booking.status)) {
      try {
        await bookingService.cancelBooking(booking.id, "Khách hàng quay lại từ trang xác nhận");
        trackEvent("booking_cancelled_on_back", { bookingId: booking.id });
      } catch (err) {
        // Nếu cancel lỗi (đã expire, đã cancel...) vẫn cho navigate về
        console.warn("[ReviewBooking] Cancel on back failed:", err?.message);
      }
    }
    navigate(-1);
  };

  // Guard: nếu không có booking thì quay lại chọn phòng
  if (!booking) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1 style={{ margin: "0 0 16px" }}>Không có booking để xác nhận</h1>
        <p style={{ color: "#64748b", marginBottom: 16 }}>
          Vui lòng quay lại trang phòng để tạo booking mới.
        </p>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_ROOMS)}>
          ← Quay lại chọn phòng
        </button>
      </section>
    );
  }

  const bookingBranchId = booking?.branchId || payload?.branchId || room?.branchId;

  const handlePayNow = async () => {
    if (!agreed || !booking.id) return;
    // Nếu có cảnh báo tăng giá, user phải xác nhận trước
    if (hasAlert && alertType === "INCREASE" && !priceAlertAcknowledged) return;
    setPaying(true);
    setPayError("");

    try {
      trackEvent("booking_step_submit", {
        step: "review",
        bookingId: booking.id,
        finalTotal: finalTotalVat,
        paymentMethod,
        hadPriceAlert: hasAlert,
        alertType: alertType || null,
      });

      if (paymentMethod === "direct") {
        // Thanh toán tại quầy: tạo payment với provider DIRECT → booking chuyển CONFIRMED
        // Staff sẽ thu tiền khi khách check-in tại lễ tân
        const directPayment = await paymentService.createDirectPayment({
          bookingId: booking.id,
          amount: finalTotalVat,
          currency: "VND",
        });
        trackEvent("booking_payment_direct", { bookingId: booking.id, paymentId: directPayment?.id });
        navigate(PATHS.CUSTOMER_BOOKINGS, { replace: true });
        return;
      }

      const response = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: finalTotalVat,
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`,
      });

      if (!response?.checkoutUrl) {
        throw new Error("Không nhận được URL thanh toán từ VNPay");
      }

      window.location.href = response.checkoutUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tạo thanh toán VNPay";
      setPayError(msg);
      trackEvent("booking_step_failed", { step: "review", bookingId: booking.id, reason: msg });
      setPaying(false);
    }
  };

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg,#0d2238,#1e3a5f)", color: "#c9a84c", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>2</span>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0d2238" }}>Xác nhận & Thanh toán</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Kiểm tra thông tin và chọn dịch vụ bổ sung</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>

        {/* ── PRICE ALERT BANNER ── */}
        {hasAlert && (
          <PriceAlertBanner
            alertType={alertType}
            message={booking.priceAlertMessage}
            originalRate={booking.originalRate}
            effectiveRate={booking.effectiveRate}
            nights={nights}
            acknowledged={priceAlertAcknowledged}
            onAcknowledge={() => setPriceAlertAcknowledged(true)}
            onRefresh={refreshBookingPrice}
            refreshing={refreshingPrice}
          />
        )}

        {/* Booking summary */}
        <div className="card-elevated" style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Thông tin đặt phòng</div>

          {/* Hold countdown */}
          {holdExpiresAt > 0 && (
            <div style={{
              padding: "10px 14px", borderRadius: 12, fontWeight: 600, fontSize: 13,
              background: holdSecondsLeft > 60 ? "#fff7ed" : "#fee2e2",
              color: holdSecondsLeft > 60 ? "#9a7d24" : "#b91c1c",
            }}>
              {holdSecondsLeft > 0
                ? `⏱️ Phòng đang được giữ — còn ${holdLabel}`
                : "❌ Hết thời gian giữ phòng. Vui lòng tạo booking mới."}
            </div>
          )}

          {[
            ["Phòng", room ? `${room.roomTypeName} — Phòng ${room.roomNumber}` : (booking.roomTypeName || booking.roomNumber || "—")],
            ["Chi nhánh", booking.branchName || room?.branchName || "—"],
            ["Nhận phòng", `${payload?.checkInDate || "—"} lúc ${payload?.checkInTime || "14:00"}`],
            ["Trả phòng", payload?.checkOutDate || "—"],
            ["Khách", `${payload?.adults || 0} người lớn, ${payload?.children || 0} trẻ em`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
              <span style={{ color: "#64748b" }}>{label}:</span>
              <span style={{ fontWeight: 500, textAlign: "right" }}>{value}</span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Giá phòng:</span>
            <div style={{ textAlign: "right" }}>
              {hasAlert && booking?.originalRate && (
                <div style={{ fontSize: 11, color: "#94a3b8", textDecoration: "line-through" }}>
                  {formatCurrencyVnd(Number(booking.originalRate) * nights)}
                </div>
              )}
              <span style={{ fontWeight: 800, color: alertType === "INCREASE" ? "#b91c1c" : "#9a7d24" }}>
                {formatCurrencyVnd(roomPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Service selector */}
        <ServiceSelector branchId={bookingBranchId} onServicesChange={setSelectedServices} />

        {/* Price breakdown */}
        <div className="card-elevated" style={{ padding: 18, background: "#f0f4ff", display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Chi phí</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
            <span>Giá phòng ({nights} đêm)</span>
            <span>{formatCurrencyVnd(roomPrice)}</span>
          </div>
          {servicesTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
              <span>Dịch vụ ({selectedServices.length})</span>
              <span>{formatCurrencyVnd(servicesTotal)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
            <span>VAT (8%)</span>
            <span>+{formatCurrencyVnd(Math.round(finalTotal * 0.08))}</span>
          </div>
          <div style={{ borderTop: "1px solid #c9a84c", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: "#9a7d24" }}>
            <span>Tổng cộng</span>
            <span>{formatCurrencyVnd(finalTotalVat)}</span>
          </div>
        </div>

        {/* Terms */}
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#f8fafc", borderRadius: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 3, accentColor: "#9a7d24" }}
          />
          <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
            Tôi đồng ý với chính sách hủy phòng. Hủy trước 24h được hoàn 100%, sau 24h mất 20%.
          </span>
        </label>

        {/* Payment method */}
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0d2238" }}>💳 Hình thức thanh toán</div>
          {[
            { value: "vnpay",  icon: "💰", title: "Thanh toán ngay (VNPay)",    desc: "Thanh toán toàn bộ ngay bây giờ, xác nhận booking tức thì" },
            { value: "direct", icon: "🏨", title: "Thanh toán tại quầy",        desc: "Đặt phòng trước, thanh toán khi nhận phòng tại lễ tân" },
          ].map((opt) => (
            <label key={opt.value} style={{
              display: "flex", gap: 10, alignItems: "center", padding: "12px 14px", cursor: "pointer",
              border: paymentMethod === opt.value ? "2px solid #c9a84c" : "1px solid #e2e8f0",
              borderRadius: 12,
              background: paymentMethod === opt.value ? "#fffaf0" : "#f8fafc",
              transition: "all 0.15s",
            }}>
              <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={(e) => setPaymentMethod(e.target.value)} style={{ accentColor: "#c9a84c" }} />
              <div>
                <div style={{ fontWeight: 700, color: "#0d2238", fontSize: 14 }}>{opt.icon} {opt.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Error */}
        {payError && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ❌ {payError}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn pill pill-soft" onClick={handleGoBack}>
            ← Quay lại
          </button>
          <button
            className="btn btn-gold"
            disabled={
              !agreed ||
              paying ||
              holdSecondsLeft <= 0 ||
              (hasAlert && alertType === "INCREASE" && !priceAlertAcknowledged)
            }
            onClick={handlePayNow}
            style={{
              flex: 1, minWidth: 200,
              opacity: (agreed && !paying && holdSecondsLeft > 0 &&
                !(hasAlert && alertType === "INCREASE" && !priceAlertAcknowledged)) ? 1 : 0.5
            }}
          >
            {paying
              ? "⏳ Đang xử lý..."
              : paymentMethod === "vnpay"
                ? `💳 Thanh toán VNPay — ${formatCurrencyVnd(finalTotalVat)}`
                : `🏨 Đặt phòng & Thanh toán sau`}
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Price Alert Banner Component ──────────────────────────────────────────────
function PriceAlertBanner({
  alertType, message, originalRate, effectiveRate,
  nights, acknowledged, onAcknowledge, onRefresh, refreshing
}) {
  const isIncrease = alertType === "INCREASE";
  const isDecrease = alertType === "DECREASE";

  const bg     = isIncrease ? "#fef2f2" : "#f0fdf4";
  const border = isIncrease ? "#fecaca" : "#bbf7d0";
  const color  = isIncrease ? "#b91c1c" : "#15803d";
  const icon   = isIncrease ? "⚠️" : "✅";

  return (
    <div style={{
      padding: "16px 18px", borderRadius: 14, background: bg,
      border: `1.5px solid ${border}`, display: "grid", gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 20, lineHeight: 1.2 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color, marginBottom: 4 }}>
            {isIncrease ? "Giá phòng đã tăng" : "Giá phòng đã giảm"}
          </div>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {message}
          </div>
        </div>
      </div>

      {/* So sánh giá */}
      {originalRate && effectiveRate && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8,
          alignItems: "center", padding: "10px 14px",
          background: "rgba(255,255,255,0.7)", borderRadius: 10,
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Giá lúc đặt</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#64748b", textDecoration: "line-through" }}>
              {formatCurrencyVnd(Number(originalRate) * nights)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatCurrencyVnd(originalRate)}/đêm</div>
          </div>
          <div style={{ fontSize: 20, color }}>→</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Giá mới</div>
            <div style={{ fontWeight: 800, fontSize: 16, color }}>
              {formatCurrencyVnd(Number(effectiveRate) * nights)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatCurrencyVnd(effectiveRate)}/đêm</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={onRefresh}
          disabled={refreshing}
          style={{ fontSize: 12, padding: "6px 14px", border: `1px solid ${border}`, background: "white", color }}
        >
          {refreshing ? "⏳ Đang tải..." : "🔄 Tải lại giá mới nhất"}
        </button>

        {isIncrease && !acknowledged && (
          <button
            type="button"
            className="btn"
            onClick={onAcknowledge}
            style={{ fontSize: 12, padding: "6px 14px", background: color, color: "white", border: "none", fontWeight: 700 }}
          >
            ✓ Tôi đã hiểu, tiếp tục với giá mới
          </button>
        )}

        {isIncrease && acknowledged && (
          <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            ✓ Đã xác nhận giá mới
          </span>
        )}

        {isDecrease && (
          <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            ✓ Giá mới đã được áp dụng tự động
          </span>
        )}
      </div>
    </div>
  );
}
