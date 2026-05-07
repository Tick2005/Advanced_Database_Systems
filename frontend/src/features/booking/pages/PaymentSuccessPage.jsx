import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { PATHS } from "../../../routes/pathConstants";
import { clearPaymentResult, loadPaymentResult } from "../paymentResultStore";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function PaymentSuccessPage() {
  const location = useLocation();
  const result = location.state?.result || loadPaymentResult() || {};
  useBookingFunnelStep("success", { responseCode: result.responseCode || "00" });

  useEffect(() => {
    trackEvent("booking_funnel_completed", {
      status: "success",
      responseCode: result.responseCode || "00",
      transactionRef: result.transactionRef || null
    });

    return () => {
      clearPaymentResult();
    };
  }, [result.responseCode, result.transactionRef]);

  return (
    <section className="container" style={{ padding: "28px 24px", minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ padding: "40px 28px", textAlign: "center", display: "grid", gap: 24, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        {/* Success Icon */}
        <div style={{ fontSize: 72, lineHeight: 1 }}>✅</div>

        {/* Heading */}
        <div style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#059669" }}>Thanh toán thành công!</h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: 16 }}>Booking của bạn đã được xác nhận và thanh toán thành công.</p>
        </div>

        {/* Transaction Details */}
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          padding: 18,
          display: "grid",
          gap: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Mã giao dịch</span>
            <span className="mono" style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>{result.transactionRef || "-"}</span>
          </div>
          <div style={{ height: 1, background: "#bbf7d0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Trạng thái</span>
            <span style={{ fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "#d1fae5", borderRadius: 999, fontSize: 12 }}>
              ✓ {result.paymentStatus || "PAID"}
            </span>
          </div>
          <div style={{ height: 1, background: "#bbf7d0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>Thông điệp</span>
            <span style={{ fontSize: 13, color: "#0d2238", fontWeight: 600 }}>{result.message || "Giao dịch đã được xác nhận bởi VNPay"}</span>
          </div>
        </div>

        {/* Next Steps */}
        <div style={{
          padding: 16,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          textAlign: "left"
        }}>
          <div style={{ fontWeight: 700, color: "#0d2238", marginBottom: 8, fontSize: 13 }}>📋 Bước tiếp theo:</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: "#64748b", fontSize: 13, lineHeight: 1.8 }}>
            <li>Booking của bạn đã được lưu vào lịch sử</li>
            <li>Nhân viên quản lý sẽ xác nhận chi tiết</li>
            <li>Bạn sẽ nhận được email xác nhận từ LuxStay</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKINGS} style={{ flex: 1, minWidth: 140 }}>
            📋 Xem booking của tôi
          </Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white", color: "#0d2238", flex: 1, minWidth: 140 }} to={PATHS.CUSTOMER_HOME}>
            🏠 Về trang chủ
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
