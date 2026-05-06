import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PATHS } from "../../../routes/pathConstants";
import { clearPaymentResult, loadPaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { BOOKING_STEPS, trackBookingStep } from "../../../services/bookingFunnel";

export default function PaymentFailedPage() {
  const location = useLocation();
  const result = location.state?.result || loadPaymentResult() || {};
  useBookingFunnelStep(BOOKING_STEPS.FAILED, { responseCode: result.responseCode || "UNKNOWN" });

  useEffect(() => {
    trackBookingStep("funnel_completed", {
      status: "failed",
      responseCode: result.responseCode || "UNKNOWN",
      message: result.message || null
    });

    return () => {
      clearPaymentResult();
    };
  }, [result.responseCode, result.message]);

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Thanh toan that bai</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
        <div>Ma loi: <span className="mono">{result.responseCode || "UNKNOWN"}</span></div>
        <div>Thong diep: {result.message || "Giao dich chua duoc xac nhan"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="btn btn-primary" to={PATHS.CUSTOMER_BOOKINGS}>Quay lai lich su booking</Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.CUSTOMER_BOOKING_PAYMENT}>Thu thanh toan lai</Link>
        </div>
      </div>
    </section>
  );
}
