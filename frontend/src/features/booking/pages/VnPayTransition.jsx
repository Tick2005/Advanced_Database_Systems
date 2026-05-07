import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";

export default function VnPayTransition() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const checkoutUrl = location.state?.checkoutUrl;
  const [countdown, setCountdown] = useState(5);
  useBookingFunnelStep("vnpay_redirect", { bookingId: booking?.id || null });

  useEffect(() => {
    trackEvent("vnpay_transition_page_loaded", {
      bookingId: booking?.id || null,
      hasCheckoutUrl: !!checkoutUrl
    });

    if (!checkoutUrl) {
      const timer = setTimeout(() => {
        navigate(PATHS.CUSTOMER_BOOKINGS, { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Redirect to VNPay after countdown
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.location.href = checkoutUrl;
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkoutUrl, booking?.id, navigate]);

  if (!booking?.id) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Không có booking để thanh toán</h1>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)}>
          Quay lại booking của tôi
        </button>
      </section>
    );
  }

  if (!checkoutUrl) {
    return (
      <section className="container" style={{ padding: "28px 24px", maxWidth: 640 }}>
        <div className="card" style={{ padding: "32px 24px", textAlign: "center", display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0, color: "#b91c1c" }}>⚠️ Lỗi thanh toán</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              🔄 Thử lại
            </button>
            <button
              className="btn"
              style={{ border: "1px solid #cbd5e1", background: "white", color: "#0d2238" }}
              onClick={() => navigate(PATHS.CUSTOMER_BOOKING_REVIEW, { state: location.state })}
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 640, minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ padding: "40px 28px", textAlign: "center", display: "grid", gap: 24, width: "100%" }}>
        {/* Loading Animation */}
        <div style={{ display: "grid", gap: 8, alignItems: "center" }}>
          <div style={{
            margin: "0 auto",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#c9a84c,#9a7d24)",
            display: "grid",
            placeItems: "center",
            fontSize: 32,
            animation: "spin 2s linear infinite"
          }}>
            💳
          </div>
          <h2 style={{ margin: "12px 0 0", fontSize: 24, fontWeight: 700, color: "#0d2238" }}>
            Chuyển hướng thanh toán VNPay
          </h2>
        </div>

        {/* Booking Info */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
          textAlign: "left"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#64748b" }}>
            <span>Mã booking</span>
            <span className="mono" style={{ fontWeight: 700, color: "#0d2238" }}>{booking.id}</span>
          </div>
          <div style={{ height: 1, background: "#e2e8f0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
            <span style={{ fontWeight: 600, color: "#0d2238" }}>Tổng tiền</span>
            <span className="mono" style={{ fontWeight: 700, color: "#c9a84c", fontSize: 18 }}>
              {formatCurrencyVnd(booking.totalPrice || 0)}
            </span>
          </div>
        </div>

        {/* VNPay Badge */}
        <div style={{
          display: "inline-flex",
          gap: 6,
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 14px",
          borderRadius: 999,
          background: "#f0f9ff",
          border: "1px solid #93c5fd",
          color: "#0369a1",
          fontSize: 13,
          fontWeight: 600,
          margin: "0 auto"
        }}>
          🏦 Thanh toán bởi VNPay Sandbox
        </div>

        {/* Instructions */}
        <div style={{
          padding: 14,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          color: "#166534",
          fontSize: 13,
          lineHeight: 1.5
        }}>
          <strong>ℹ️ Hướng dẫn:</strong><br />
          Bạn sẽ được chuyển đến trang thanh toán VNPay Sandbox trong <strong>{countdown} giây</strong>. <br />
          Nếu không tự động chuyển, hãy nhấn nút bên dưới.
        </div>

        {/* Manual Button */}
        <button
          className="btn btn-gold"
          onClick={() => (window.location.href = checkoutUrl)}
          style={{ fontWeight: 700, fontSize: 15 }}
        >
          💳 Chuyển sang VNPay ngay ({countdown}s)
        </button>

        {/* Help Text */}
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
          Vui lòng không tắt trình duyệt. Nếu bạn gặp sự cố, <a href="#" style={{ color: "#c9a84c", textDecoration: "none", fontWeight: 600 }} onClick={(e) => { e.preventDefault(); navigate(PATHS.CUSTOMER_BOOKING_REVIEW, { state: location.state }); }}>quay lại</a>.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
