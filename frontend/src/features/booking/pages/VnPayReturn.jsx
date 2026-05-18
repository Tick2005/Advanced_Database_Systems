/**
 * VnPayReturn.jsx
 *
 * VNPay redirect browser về trang này sau khi thanh toán với query params:
 *   vnp_ResponseCode, vnp_TransactionStatus, vnp_TxnRef, vnp_Amount, ...
 *
 * Flow:
 * 1. Parse VNPay query params từ URL.
 * 2. Gọi backend IPN (/api/public/payments/vnpay-ipn) với cùng params —
 *    cần thiết trên localhost vì VNPay không thể tự gọi server local.
 *    Gọi cả khi success lẫn failed để backend luôn cập nhật trạng thái đúng.
 * 3. Navigate đến PaymentSuccessPage hoặc PaymentFailedPage với result state.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import { savePaymentResult } from "../paymentResultStore";
import { trackEvent } from "../../../services/tracking";
import { httpClient } from "../../../services/httpClient";

export default function VnPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  // Guard: chỉ chạy 1 lần dù React StrictMode mount 2 lần
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const processReturn = async () => {
      try {
        sessionStorage.removeItem("booking_vnpay_pending");

        const raw = location.search.startsWith("?")
          ? location.search.slice(1)
          : location.search;

        // Không có query params → lỗi rõ ràng
        if (!raw) {
          const fallback = {
            responseCode: "MISSING_QUERY",
            message: "Thiếu thông tin giao dịch VNPay trên URL",
          };
          savePaymentResult(fallback);
          trackEvent("booking_payment_return", { status: "missing_query" });
          navigate(PATHS.PAYMENT_FAILED, { replace: true, state: { result: fallback } });
          return;
        }

        const params = Object.fromEntries(new URLSearchParams(raw));
        const responseCode      = params.vnp_ResponseCode      || "";
        const transactionStatus = params.vnp_TransactionStatus || "";
        const transactionRef    = params.vnp_TxnRef            || "";
        // VNPay trả amount đơn vị xu (×100), chia lại để hiển thị VND
        const amount = params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0;

        const success = responseCode === "00" && transactionStatus === "00";

        // Gọi backend IPN để cập nhật booking & payment.
        // Gọi cả success lẫn failed — backend cần biết để:
        //   success → CONFIRMED booking, OCCUPIED room, SUCCESS payment
        //   failed  → CANCELLED booking, AVAILABLE room, FAILED payment
        if (transactionRef) {
          try {
            const ipnQuery = new URLSearchParams(params).toString();
            await httpClient.post(`/api/public/payments/vnpay-ipn?${ipnQuery}`, {});
          } catch (ipnErr) {
            // IPN lỗi không chặn flow — backend scheduler sẽ expire booking sau 15 phút
            console.warn("[VnPayReturn] IPN call failed:", ipnErr?.message || ipnErr);
          }
        }

        const result = {
          responseCode,
          transactionStatus,
          transactionRef,
          amount,
          paymentStatus: success ? "PAID" : "FAILED",
          message: success
            ? "Giao dịch thanh toán thành công"
            : vnpayErrorMessage(responseCode),
          rawParams: params,
        };

        // Lưu vào sessionStorage để PaymentSuccessPage/FailedPage đọc được
        // ngay cả khi navigate bị reload (hiếm nhưng có thể xảy ra)
        savePaymentResult(result);

        trackEvent(
          success ? "booking_payment_return_success" : "booking_payment_return_failed",
          { responseCode, transactionRef }
        );

        // Navigate đến đúng trang kết quả, truyền result qua state
        navigate(
          success ? PATHS.PAYMENT_SUCCESS : PATHS.PAYMENT_FAILED,
          { replace: true, state: { result } }
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Không thể xử lý kết quả thanh toán";
        setError(msg);
        trackEvent("booking_payment_return_error", { reason: msg });
      }
    };

    processReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hiển thị lỗi nếu processReturn throw
  if (error) {
    return (
      <section
        className="container"
        style={{
          padding: "28px 24px",
          minHeight: "60vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="card"
          style={{
            padding: "32px 24px",
            textAlign: "center",
            display: "grid",
            gap: 16,
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 48 }}>❌</div>
          <h1 style={{ fontSize: 20, margin: 0, color: "#0d2238" }}>
            Xử lý kết quả thất bại
          </h1>
          <div
            style={{
              color: "#b91c1c",
              fontSize: 14,
              background: "#fee2e2",
              padding: "10px 14px",
              borderRadius: 10,
            }}
          >
            {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)}
          >
            Về lịch sử đặt phòng
          </button>
        </div>
      </section>
    );
  }

  // Loading spinner trong khi đang xử lý
  return (
    <section
      className="container"
      style={{
        padding: "28px 24px",
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="card"
        style={{
          padding: "32px 24px",
          textAlign: "center",
          display: "grid",
          gap: 16,
          maxWidth: 400,
          width: "100%",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "4px solid #f3f4f6",
            borderTopColor: "#c9a84c",
            margin: "0 auto",
            animation: "spin 1s linear infinite",
          }}
        />
        <h1 style={{ fontSize: 18, margin: 0, color: "#0d2238" }}>
          Đang xử lý kết quả thanh toán...
        </h1>
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Vui lòng không đóng trình duyệt
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </section>
  );
}

/** Map VNPay response codes → thông báo tiếng Việt */
function vnpayErrorMessage(code) {
  const MAP = {
    "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ (liên hệ VNPay)",
    "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
    "10": "Xác thực thông tin thẻ/tài khoản quá 3 lần",
    "11": "Đã hết hạn chờ thanh toán",
    "12": "Thẻ/Tài khoản bị khóa",
    "13": "Sai mật khẩu OTP",
    "24": "Khách hàng hủy giao dịch",
    "51": "Tài khoản không đủ số dư",
    "65": "Tài khoản vượt hạn mức giao dịch trong ngày",
    "75": "Ngân hàng thanh toán đang bảo trì",
    "79": "Sai mật khẩu thanh toán quá số lần quy định",
    "99": "Lỗi không xác định",
  };
  return MAP[code] || `Giao dịch thất bại (mã: ${code || "UNKNOWN"})`;
}
