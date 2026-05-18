import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../bookingService";
import { paymentService } from "../paymentService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { queryKeys } from "../../../services/queryKeys";
import { useApiMutation } from "../../../hooks/useApiMutation";

const STATUS_LABELS = {
  HOLD:            { label: "Đang giữ phòng",  color: "#7c3aed", bg: "#ede9fe" },
  PENDING_PAYMENT: { label: "Chờ thanh toán",  color: "#ea580c", bg: "#ffedd5" },
  CONFIRMED:       { label: "Đã xác nhận",     color: "#16a34a", bg: "#dcfce7" },
  CHECKED_IN:      { label: "Đang lưu trú",    color: "#0284c7", bg: "#e0f2fe" },
  CHECKED_OUT:     { label: "Đã trả phòng",    color: "#64748b", bg: "#f1f5f9" },
  CANCELLED:       { label: "Đã hủy",          color: "#dc2626", bg: "#fee2e2" },
  EXPIRED:         { label: "Hết hạn giữ",     color: "#9ca3af", bg: "#f3f4f6" },
};

const FILTER_OPTIONS = [
  { value: "all",     label: "Tất cả" },
  { value: "active",  label: "Đang hoạt động" },
  { value: "done",    label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy / Hết hạn" },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Mới nhất trước" },
  { value: "oldest",     label: "Cũ nhất trước" },
  { value: "price-desc", label: "Giá cao nhất" },
  { value: "price-asc",  label: "Giá thấp nhất" },
];

export default function BookingsPage() {
  const [sortBy, setSortBy]       = useState("newest");
  const [filterGroup, setFilterGroup] = useState("all");
  const [cancellingId, setCancellingId] = useState("");
  const [payingId, setPayingId]   = useState("");
  const [payError, setPayError]   = useState("");

  const bookingsQuery = useApiQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => bookingService.getBookings(),
    staleTime: 30 * 1000,
  });

  const feedbacksQuery = useApiQuery({
    queryKey: ["my-feedbacks"],
    queryFn: () => feedbackService.getMyFeedbacks(),
    staleTime: 30 * 1000,
  });

  const cancelMutation = useApiMutation({
    mutationFn: ({ bookingId }) =>
      bookingService.cancelBooking(bookingId, "Khách hàng hủy từ giao diện"),
    invalidateKeys: [queryKeys.bookings],
  });

  const rawBookings = bookingsQuery.data || [];
  const myFeedbacks = feedbacksQuery.isError ? [] : (feedbacksQuery.data || []);

  const feedbackByBookingId = useMemo(
    () =>
      new Map(
        myFeedbacks
          .filter((f) => !f.isReported)
          .map((f) => [f.bookingId, f])
      ),
    [myFeedbacks]
  );

  const bookings = useMemo(() => {
    let list = [...rawBookings];

    // Group filter
    if (filterGroup === "active") {
      list = list.filter((b) => ["HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"].includes(b.status));
    } else if (filterGroup === "done") {
      list = list.filter((b) => b.status === "CHECKED_OUT");
    } else if (filterGroup === "cancelled") {
      list = list.filter((b) => ["CANCELLED", "EXPIRED"].includes(b.status));
    }

    // Sort
    return list.sort((a, b) => {
      if (sortBy === "newest")     return new Date(b.createdAt || b.checkInDate || 0) - new Date(a.createdAt || a.checkInDate || 0);
      if (sortBy === "oldest")     return new Date(a.createdAt || a.checkInDate || 0) - new Date(b.createdAt || b.checkInDate || 0);
      if (sortBy === "price-desc") return ((b.grandTotalPrice || b.totalPrice) || 0) - ((a.grandTotalPrice || a.totalPrice) || 0);
      if (sortBy === "price-asc")  return ((a.grandTotalPrice || a.totalPrice) || 0) - ((b.grandTotalPrice || b.totalPrice) || 0);
      return 0;
    });
  }, [rawBookings, filterGroup, sortBy]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn hủy booking này không? Hành động này không thể hoàn tác.")) return;
    setCancellingId(bookingId);
    try { await cancelMutation.mutateAsync({ bookingId }); }
    finally { setCancellingId(""); }
  };

  const handlePay = async (booking) => {
    setPayingId(booking.id);
    setPayError("");
    try {
      const res = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: Math.round((booking.totalPrice || 0) * 1.08),
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`,
      });
      if (res?.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán");
      }
    } catch (err) {
      setPayError(err.message || "Không thể khởi tạo thanh toán");
      setPayingId("");
    }
  };

  if (bookingsQuery.isLoading) return <LoadingState text="Đang tải lịch sử đặt phòng..." />;
  if (bookingsQuery.error)
    return <ErrorState message={bookingsQuery.error.message || "Không thể tải"} onRetry={bookingsQuery.refetch} />;

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0d2238" }}>🧾 Lịch sử đặt phòng</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            {rawBookings.length} booking · hiển thị {bookings.length}
          </p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 13 }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTER_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setFilterGroup(o.value)}
            style={{
              padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filterGroup === o.value ? "2px solid #0d2238" : "1px solid #e2e8f0",
              background: filterGroup === o.value ? "#0d2238" : "white",
              color: filterGroup === o.value ? "white" : "#475569",
              transition: "all 0.15s",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {payError && (
        <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          ❌ {payError}
        </div>
      )}

      {bookings.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛏️</div>
          <p style={{ color: "#64748b" }}>Không có booking nào trong nhóm này.</p>
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_ROOMS} style={{ display: "inline-block", marginTop: 12 }}>
            Đặt phòng ngay
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {bookings.map((booking) => {
          const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#64748b", bg: "#f1f5f9" };
          const bookingFeedback = feedbackByBookingId.get(booking.id);
          const canPay = ["HOLD", "PENDING_PAYMENT"].includes(booking.status);
          const canCancel = ["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status);

          return (
            <article key={booking.id} className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0d2238" }}>
                    {booking.roomTypeName || booking.roomNumber || "Phòng đã đặt"}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    📍 {booking.branchName || "Chi nhánh LuxStay"}
                  </div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: statusInfo.bg, color: statusInfo.color, whiteSpace: "nowrap" }}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Dates + price */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Nhận phòng</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0d2238", marginTop: 2 }}>
                    {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString("vi-VN") : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Trả phòng</div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0d2238", marginTop: 2 }}>
                    {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString("vi-VN") : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>Tổng tiền</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#9a7d24", marginTop: 2 }}>
                    {formatCurrencyVnd(booking.grandTotalPrice || booking.totalPrice || 0)}
                  </div>
                  {booking.servicesTotalPrice > 0 && (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                      (gồm {formatCurrencyVnd(booking.servicesTotalPrice)} dịch vụ)
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              {Array.isArray(booking.services) && booking.services.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>🛎️ Dịch vụ:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {booking.services.map((svc, i) => (
                      <span key={i} className="pill pill-soft" style={{ fontSize: 12 }}>
                        {svc.name || svc.serviceName || `Dịch vụ ${i + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {bookingFeedback && (
                <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: "#fffaf0", border: "1px solid #f8dd9a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                    <strong style={{ color: "#0d2238", fontSize: 13 }}>Đánh giá của bạn</strong>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24" }}>⭐ {bookingFeedback.rating}/5</span>
                  </div>
                  <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>{bookingFeedback.content}</p>
                  {bookingFeedback.managerReply && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px dashed #f0d488", color: "#334155", fontSize: 13 }}>
                      <strong>Phản hồi quản lý:</strong> {bookingFeedback.managerReply}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="btn btn-primary" to={`/customer/bookings/${booking.id}`} style={{ fontSize: 13 }}>
                  Xem chi tiết
                </Link>
                {canPay && (
                  <button
                    className="btn btn-gold"
                    style={{ fontSize: 13 }}
                    disabled={payingId === booking.id}
                    onClick={() => handlePay(booking)}
                  >
                    {payingId === booking.id ? "⏳ Đang xử lý..." : "💳 Thanh toán ngay"}
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn"
                    style={{ fontSize: 13, border: "1px solid #fecaca", color: "#b91c1c", background: "#fff" }}
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                  >
                    {cancellingId === booking.id ? "Đang hủy..." : "Hủy booking"}
                  </button>
                )}
                {booking.status === "CHECKED_OUT" && !bookingFeedback && (
                  <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE} state={{ booking }} style={{ fontSize: 13 }}>
                    ⭐ Đánh giá phòng
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
