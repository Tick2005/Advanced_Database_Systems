import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../paymentService";
import { PATHS } from "../../../routes/pathConstants";
import { savePaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { BOOKING_STEPS, normalizeBookingError, trackBookingStep } from "../../../services/bookingFunnel";

const PAYMENT_LOCK_KEY = "booking_vnpay_pending";

export default function VnPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useBookingFunnelStep(BOOKING_STEPS.RETURN, { queryLength: location.search.length });

  useEffect(() => {
    const run = async () => {
      try {
        sessionStorage.removeItem(PAYMENT_LOCK_KEY);
        const query = location.search.startsWith("?") ? location.search.slice(1) : location.search;
        if (!query) {
          const fallbackResult = {
            responseCode: "MISSING_QUERY",
            message: "Thieu thong tin giao dich VNPay tren URL"
          };
          savePaymentResult(fallbackResult);
          trackBookingStep("step_failed", { step: BOOKING_STEPS.RETURN, reason: "missing_query" });
          navigate(PATHS.CUSTOMER_BOOKING_FAILED, {
            replace: true,
            state: { result: fallbackResult }
          });
          return;
        }

        const data = await paymentService.verifyVnPayReturn(query);
        const success = data.responseCode === "00";
        trackBookingStep(success ? "payment_verified_success" : "payment_verified_failed", {
          step: BOOKING_STEPS.RETURN,
          responseCode: data.responseCode || "UNKNOWN"
        });
        savePaymentResult(data);
        navigate(success ? PATHS.CUSTOMER_BOOKING_SUCCESS : PATHS.CUSTOMER_BOOKING_FAILED, {
          replace: true,
          state: { result: data }
        });
      } catch (err) {
        setError(err.message || "Khong the xac thuc ket qua VNPay");
        trackBookingStep("step_failed", { step: BOOKING_STEPS.RETURN, reason: normalizeBookingError(err) });
      }
    };

    run();
  }, [location.search, navigate]);

  if (error) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Thanh toan that bai</h1>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)}>Ve lich su booking</button>
      </section>
    );
  }

  return <section className="container" style={{ padding: "28px 24px" }}><h1>Dang xac nhan giao dich...</h1></section>;
}
