import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PATHS } from "../../../routes/pathConstants";
import { clearPaymentResult, loadPaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";

export default function PaymentFailedPage() {
  const location = useLocation();
  const result = location.state?.result || loadPaymentResult() || {};
  useBookingFunnelStep("failed", { responseCode: result.responseCode || "UNKNOWN" });

  useEffect(() => {
    trackEvent("booking_funnel_completed", {
      status: "failed",
      responseCode: result.responseCode || "UNKNOWN",
      message: result.message || null
    });

    return () => {
      clearPaymentResult();
    };
  }, [result.responseCode, result.message]);

  return (
    <section className="container" style={{ padding: "28px 24px", minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ padding: "40px 28px", textAlign: "center", display: "grid", gap: 24, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        {/* Error Icon */}
        <div style={{ fontSize: 72, lineHeight: 1 }}>❌</div>

        {/* Heading */}
        <div style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#b91c1c" }}>Thanh toán thất bại</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 16 }}>Giao dịch thanh toán của bạn không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
        </div>

        {/* Error Details */}
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: 12,
          padding: 18,
          display: "grid",
          gap: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Mã lỗi</span>
            <span className="mono" style={{ fontWeight: 700, color: "#b91c1c", fontSize: 14 }}>{result.responseCode || "UNKNOWN"}</span>
          </div>
          <div style={{ height: 1, background: "#fecaca" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Thông điệp</span>
            <span style={{ fontSize: 13, color: "#0d2238", fontWeight: 600, maxWidth: 280, textAlign: "right" }}>
              {result.message || "Giao dịch chưa được xác nhận"}
            </span>
          </div>
        </div>

        {/* Troubleshooting */}
        <div style={{
          padding: 16,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          textAlign: "left"
        }}>
          <div style={{ fontWeight: 700, color: "#0d2238", marginBottom: 8, fontSize: 13 }}>🔧 Khắc phục sự cố:</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
            <li>Kiểm tra số tiền và thông tin tài khoản</li>
            <li>Đảm bảo kết nối internet ổn định</li>
            <li>Thử lại sau vài phút</li>
            <li>Nếu vẫn có vấn đề, hãy liên hệ hỗ trợ</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to={PATHS.CUSTOMER_BOOKINGS}>
            📋 Quay lại lịch sử booking
          </Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white", color: "#0d2238" }} to={PATHS.CUSTOMER_BOOKING_PAYMENT}>
            🔄 Thử thanh toán lại
          </Link>
        </div>

        {/* Help */}
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
          Cần hỗ trợ? <a href="#" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }} onClick={(e) => e.preventDefault()}>Liên hệ hỗ trợ</a>
        </div>
      </div>
    </section>
  );
}
