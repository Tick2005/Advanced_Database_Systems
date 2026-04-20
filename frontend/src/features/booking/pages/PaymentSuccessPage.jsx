import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PATHS } from "../../../routes/pathConstants";
import { clearPaymentResult, loadPaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { BOOKING_STEPS, trackBookingStep } from "../../../services/bookingFunnel";

export default function PaymentSuccessPage() {
  const location = useLocation();
  const result = location.state?.result || loadPaymentResult() || {};
  useBookingFunnelStep(BOOKING_STEPS.SUCCESS, { responseCode: result.responseCode || "00" });

  useEffect(() => {
    trackBookingStep("funnel_completed", {
      status: "success",
      responseCode: result.responseCode || "00",
      transactionRef: result.transactionRef || null
    });

    return () => {
      clearPaymentResult();
    };
  }, [result.responseCode, result.transactionRef]);

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Thanh toan thanh cong</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
        <div>Ma giao dich: <span className="mono">{result.transactionRef || "-"}</span></div>
        <div>Trang thai: {result.paymentStatus || "PAID"}</div>
        <div>Thong diep: {result.message || "Giao dich da duoc xac nhan boi VNPay"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKINGS}>Xem booking cua toi</Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.CUSTOMER_HOME}>Ve trang chu</Link>
        </div>
      </div>
    </section>
  );
}
