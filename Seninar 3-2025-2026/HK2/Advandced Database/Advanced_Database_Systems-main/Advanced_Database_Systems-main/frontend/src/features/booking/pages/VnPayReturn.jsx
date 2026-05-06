// commit: fix(vnpay-return): sửa encoding tiếng Việt
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../paymentService";
import { PATHS } from "../../../routes/pathConstants";
import { savePaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";

const PAYMENT_LOCK_KEY = "booking_vnpay_pending";

export default function VnPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useBookingFunnelStep("return", { queryLength: location.search.length });

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
          trackEvent("booking_step_failed", { step: "return", reason: "missing_query" });
          navigate(PATHS.CUSTOMER_BOOKING_FAILED, {
            replace: true,
            state: { result: fallbackResult }
          });
          return;
        }

        const data = await paymentService.verifyVnPayReturn(query);
        const success = data.responseCode === "00";
        trackEvent(success ? "booking_payment_verified_success" : "booking_payment_verified_failed", {
          step: "return",
          responseCode: data.responseCode || "UNKNOWN"
        });
        savePaymentResult(data);
        navigate(success ? PATHS.CUSTOMER_BOOKING_SUCCESS : PATHS.CUSTOMER_BOOKING_FAILED, {
          replace: true,
          state: { result: data }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Không thể xác thực kết quả VNPay";
        setError(errorMessage);
        trackEvent("booking_step_failed", { step: "return", reason: errorMessage || "unknown_error" });
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
