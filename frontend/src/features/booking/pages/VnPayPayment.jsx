import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../paymentService";
import { PATHS } from "../../../routes/pathConstants";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { BOOKING_STEPS, normalizeBookingError, trackBookingStep } from "../../../services/bookingFunnel";

const PAYMENT_LOCK_KEY = "booking_vnpay_pending";

export default function VnPayPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  useBookingFunnelStep(BOOKING_STEPS.PAYMENT, { bookingId: booking?.id || null, amount: booking?.totalPrice || 0 });
  const submittingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startPayment = async () => {
    if (!booking?.id) return;
    if (submittingRef.current) return;

    const existingLock = sessionStorage.getItem(PAYMENT_LOCK_KEY);
    if (existingLock === String(booking.id)) {
      setError("Yeu cau thanh toan dang duoc xu ly, vui long doi trong giay lat.");
      return;
    }

    submittingRef.current = true;
    sessionStorage.setItem(PAYMENT_LOCK_KEY, String(booking.id));
    setLoading(true);
    setError("");
    try {
      trackBookingStep("step_submit", { step: BOOKING_STEPS.PAYMENT, bookingId: booking.id, amount: booking.totalPrice });
      const response = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`
      });
      if (!response.checkoutUrl) {
        throw new Error("Khong nhan duoc checkoutUrl tu backend");
      }
      trackBookingStep("payment_redirect", { bookingId: booking.id, provider: "VNPAY" });
      window.location.href = response.checkoutUrl;
    } catch (err) {
      setError(err.message || "Khong the tao thanh toan VNPay");
      trackBookingStep("step_failed", { step: BOOKING_STEPS.PAYMENT, bookingId: booking.id, reason: normalizeBookingError(err) });
      setLoading(false);
      sessionStorage.removeItem(PAYMENT_LOCK_KEY);
      submittingRef.current = false;
    }
  };

  if (!booking?.id) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <p>Khong co booking de thanh toan.</p>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)} aria-label="Ve lich su booking">Ve lich su booking</button>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Dat phong - Buoc 3 (Thanh toan)</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
        <div>Booking: {booking.id}</div>
        <div className="mono">Tong tien: {booking.totalPrice} VND</div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn btn-gold" onClick={startPayment} disabled={loading} aria-label="Xac nhan va thanh toan qua VNPay">
          {loading ? "Dang chuyen huong..." : "Xac nhan va thanh toan VNPay"}
        </button>
      </div>
    </section>
  );
}
