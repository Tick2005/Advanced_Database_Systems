import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { bookingService } from "../bookingService";
import { paymentService } from "../paymentService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";
import { useApiQuery } from "../../../hooks/useApiQuery";

const STATUS_LABELS = {
  CONFIRMED: { label: "Đã xác nhận", color: "#16a34a", bg: "#dcfce7" },
  CHECKED_IN: { label: "Đang lưu trú", color: "#0284c7", bg: "#e0f2fe" },
  CHECKED_OUT: { label: "Đã trả phòng", color: "#64748b", bg: "#f1f5f9" },
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "#ea580c", bg: "#ffedd5" },
  HOLD: { label: "Tạm giữ", color: "#7c3aed", bg: "#ede9fe" },
  CANCELLED: { label: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const feedbackQuery = useApiQuery({
    queryKey: ["my-feedbacks"],
    queryFn: () => feedbackService.getMyFeedbacks(),
    staleTime: 30 * 1000,
  });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      setBooking(await bookingService.getBookingDetail(id));
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <LoadingState text="Đang tải chi tiết booking..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!booking) return <ErrorState message="Không tìm thấy booking" />;

  const onCancel = async () => {
    if (!window.confirm("Bạn có chắc muốn hủy booking này không? Hành động này không thể hoàn tác.")) return;
    setUpdating(true);
    setError("");
    try {
      await bookingService.cancelBooking(booking.id, "Customer cancelled from detail");
      // Reload để hiển thị trạng thái CANCELLED mới
      await fetchData();
    } catch (err) {
      setError(err.message || "Không thể hủy booking");
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#64748b", bg: "#f1f5f9" };
  const checkInDate = booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("vi-VN") : "—";
  const checkOutDate = booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("vi-VN") : "—";
  const stayNights = booking.checkInDate && booking.checkOutDate
    ? Math.max(0, Math.round((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)))
    : 0;
  const bookingFeedback = (feedbackQuery.data || []).find(
    (item) => item.bookingId === booking.id && !item.isReported
  );

  return (
    <section className="container page-shell" style={{ padding: "28px 24px", maxWidth: 980 }}>
      <Link className="btn" style={{ border: "1px solid #e2e8f0", marginBottom: 20 }} to={PATHS.CUSTOMER_BOOKINGS}>← Quay lại</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0d2238" }}>Chi tiết đặt phòng</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>Thông tin lưu trú và thanh toán của bạn</p>
        </div>
        <span style={{ padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: statusInfo.bg, color: statusInfo.color, whiteSpace: "nowrap" }}>
          {statusInfo.label}
        </span>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#b91c1c", borderRadius: 12, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 0.8fr)" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>🏨 Phòng đã đặt</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "#64748b" }}>Loại phòng</span>
                <span style={{ fontWeight: 600, color: "#0d2238", textAlign: "right" }}>{booking.roomTypeName || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "#64748b" }}>Số phòng</span>
                <span style={{ fontWeight: 600, color: "#0d2238", textAlign: "right" }}>{booking.roomNumber || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ color: "#64748b" }}>Chi nhánh</span>
                <span style={{ fontWeight: 600, color: "#0d2238", textAlign: "right" }}>{booking.branchName || "—"}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>📅 Lịch lưu trú</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Nhận phòng</div>
                <div style={{ fontWeight: 700, color: "#0d2238" }}>{checkInDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Trả phòng</div>
                <div style={{ fontWeight: 700, color: "#0d2238" }}>{checkOutDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Số đêm</div>
                <div style={{ fontWeight: 700, color: "#0d2238" }}>{stayNights}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Khách</div>
                <div style={{ fontWeight: 700, color: "#0d2238" }}>{booking.adults || 0} người lớn, {booking.children || 0} trẻ em</div>
              </div>
            </div>
          </div>

          {Array.isArray(booking.services) && booking.services.length > 0 && (
            <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>🛎️ Dịch vụ đã chọn</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {booking.services.map((svc, i) => (
                  <span key={i} style={{ padding: "6px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 999, fontSize: 12, color: "#0284c7" }}>
                    {svc.name || svc.serviceName || `Dịch vụ ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", background: "#f0f4ff" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>💰 Chi phí</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Tiền phòng</span>
                <span style={{ fontWeight: 600 }}>{formatCurrencyVnd(booking.totalPrice || 0)}</span>
              </div>
              {Array.isArray(booking.services) && booking.services.length > 0 && (
                <>
                  {booking.services.map((svc, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>
                        {svc.serviceName || svc.name || `Dịch vụ ${i + 1}`}
                        {svc.quantity > 1 ? ` ×${svc.quantity}` : ""}
                      </span>
                      <span style={{ fontWeight: 600 }}>{formatCurrencyVnd(svc.actualPrice || 0)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ color: "#64748b" }}>Tổng dịch vụ</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrencyVnd(booking.servicesTotalPrice || 0)}</span>
                  </div>
                </>
              )}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontWeight: 700, color: "#0d2238" }}>Tổng cộng (gồm VAT 8%)</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#9a7d24" }}>
                  {formatCurrencyVnd(Math.round((booking.grandTotalPrice || booking.totalPrice || 0) * 1.08))}
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>⚙️ Hành động</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                "HOLD",
                "PENDING_PAYMENT",
                "CONFIRMED"
              ].includes(booking.status) && (
                <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff" }} onClick={onCancel} disabled={updating}>
                  {updating ? "Đang hủy..." : "Hủy booking"}
                </button>
              )}
              {["HOLD", "PENDING_PAYMENT"].includes(booking.status) && (
                <button
                  className="btn btn-gold"
                  disabled={updating}
                  onClick={async () => {
                    setUpdating(true);
                    try {
                      const response = await paymentService.createVnPayPayment({
                        bookingId: booking.id,
                        amount: Math.round(booking.totalPrice * 1.08),
                        currency: "VND",
                        orderInfo: `BOOKING ${booking.id}`
                      });
                      if (response.checkoutUrl) {
                        window.location.href = response.checkoutUrl;
                      } else {
                        throw new Error("Không nhận được URL thanh toán");
                      }
                    } catch (err) {
                      setError(err.message || "Không thể khởi tạo thanh toán");
                      setUpdating(false);
                    }
                  }}
                >
                  {updating ? "⏳ Đang xử lý..." : "💳 Thanh toán ngay"}
                </button>
              )}
              {booking.status === "CHECKED_OUT" && !bookingFeedback && (
                <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE} state={{ booking }}>⭐ Đánh giá phòng</Link>
              )}
              {booking.status === "CHECKED_OUT" && bookingFeedback && (
                <div style={{ padding: "8px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  ✅ Đã đánh giá — {bookingFeedback.rating}/5 sao
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0", marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>💬 Đánh giá của bạn</div>
          {feedbackQuery.isLoading ? (
            <div style={{ color: "#64748b", fontSize: 13 }}>Đang tải đánh giá...</div>
          ) : bookingFeedback ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong style={{ color: "#0d2238" }}>Phòng {booking.roomNumber || booking.roomTypeName || "—"}</strong>
                <span style={{ color: "#9a7d24", fontWeight: 700 }}>⭐ {bookingFeedback.rating}/5</span>
              </div>
              <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.7 }}>{bookingFeedback.content}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontSize: 13, color: "#64748b" }}>
                <div><strong>Chi nhánh:</strong> {booking.branchName || "—"}</div>
                <div><strong>Phòng:</strong> {booking.roomNumber || "—"}</div>
                <div><strong>Ngày gửi:</strong> {bookingFeedback.createdAt ? new Date(bookingFeedback.createdAt).toLocaleString("vi-VN") : "—"}</div>
              </div>
              {bookingFeedback.managerReply && (
                <div style={{ marginTop: 4, padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155" }}>
                  <strong style={{ display: "block", marginBottom: 4 }}>Phản hồi từ quản lý</strong>
                  {bookingFeedback.managerReply}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Booking này chưa có đánh giá. Khi trả phòng xong, bạn có thể mở nút Đánh giá phòng ở phần Hành động.
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
