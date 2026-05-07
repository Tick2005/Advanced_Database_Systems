import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../bookingService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { queryKeys } from "../../../services/queryKeys";
import { useApiMutation } from "../../../hooks/useApiMutation";

// Chỉ hiện những status "thành công"
const SUCCESS_STATUSES = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất trước" },
  { value: "oldest", label: "Cũ nhất trước" },
  { value: "price-desc", label: "Giá cao nhất" },
  { value: "price-asc", label: "Giá thấp nhất" },
];

const STATUS_LABELS = {
  CONFIRMED: { label: "Đã xác nhận", color: "#16a34a", bg: "#dcfce7" },
  CHECKED_IN: { label: "Đang lưu trú", color: "#0284c7", bg: "#e0f2fe" },
  CHECKED_OUT: { label: "Đã trả phòng", color: "#64748b", bg: "#f1f5f9" },
};

export default function BookingsPage() {
  const [sortBy, setSortBy] = useState("newest");
  const [cancellingId, setCancellingId] = useState("");

  const bookingsQuery = useApiQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => bookingService.getBookings(),
    staleTime: 30 * 1000
  });

  const feedbacksQuery = useApiQuery({
    queryKey: ["my-feedbacks"],
    queryFn: () => feedbackService.getMyFeedbacks(),
    staleTime: 30 * 1000,
  });

  const cancelBookingMutation = useApiMutation({
    mutationFn: ({ bookingId }) => bookingService.cancelBooking(bookingId, "Customer cancelled from UI"),
    invalidateKeys: [queryKeys.bookings]
  });

  const rawBookings = bookingsQuery.data || [];
  const myFeedbacks = feedbacksQuery.data || [];
  const feedbackByBookingId = useMemo(() => {
    return new Map(myFeedbacks.map((feedback) => [feedback.bookingId, feedback]));
  }, [myFeedbacks]);

  // Chỉ lấy booking thành công, sắp xếp theo sort option, mặc định mới nhất trước
  const bookings = useMemo(() => {
    const filtered = rawBookings.filter((b) => SUCCESS_STATUSES.includes(b.status));
    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.checkInDate || 0) - new Date(a.checkInDate || 0);
      if (sortBy === "oldest") return new Date(a.checkInDate || 0) - new Date(b.checkInDate || 0);
      if (sortBy === "price-desc") return (b.totalPrice || 0) - (a.totalPrice || 0);
      if (sortBy === "price-asc") return (a.totalPrice || 0) - (b.totalPrice || 0);
      return 0;
    });
  }, [rawBookings, sortBy]);

  const cancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    try { await cancelBookingMutation.mutateAsync({ bookingId }); }
    finally { setCancellingId(""); }
  };

  if (bookingsQuery.isLoading || feedbacksQuery.isLoading) return <LoadingState text="Đang tải lịch sử đặt phòng..." />;
  if (bookingsQuery.error) return <ErrorState message={bookingsQuery.error.message || "Không thể tải"} onRetry={bookingsQuery.refetch} />;
  if (feedbacksQuery.error) return <ErrorState message={feedbacksQuery.error.message || "Không thể tải đánh giá"} onRetry={feedbacksQuery.refetch} />;

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0d2238" }}>🧾 Lịch sử đặt phòng</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>{bookings.length} booking thành công</p>
        </div>
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", fontSize: 13, cursor: "pointer" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {bookings.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛏️</div>
          <p style={{ color: "#64748b" }}>Bạn chưa có booking thành công nào.</p>
          <Link className="btn btn-gold" to={PATHS.CUSTOMER_ROOMS} style={{ display: "inline-block", marginTop: 12 }}>Đặt phòng ngay</Link>
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {bookings.map((booking) => {
          const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: "#64748b", bg: "#f1f5f9" };
          const bookingFeedback = feedbackByBookingId.get(booking.id);
          return (
            <article key={booking.id} className="card" style={{ padding: 20, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                {/* Tên phòng — không show ID */}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#0d2238" }}>
                    {booking.roomTypeName || booking.roomNumber || "Phòng đã đặt"}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                    📍 {booking.branchName || "Chi nhánh LuxStay"}
                  </div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: statusInfo.bg, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Thông tin lịch */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
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
                    {formatCurrencyVnd(booking.totalPrice || 0)}
                  </div>
                </div>
              </div>

              {/* Dịch vụ đã chọn — hiện tên, không show ID */}
              {Array.isArray(booking.services) && booking.services.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>🛎️ Dịch vụ đã chọn:</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {booking.services.map((svc, i) => (
                      <span key={i} className="pill pill-soft" style={{ fontSize: 12 }}>
                        {svc.name || svc.serviceName || `Dịch vụ ${i + 1}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {bookingFeedback && (
                <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: "#fffaf0", border: "1px solid #f8dd9a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <strong style={{ color: "#0d2238", fontSize: 13 }}>Đánh giá của bạn</strong>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#9a7d24" }}>⭐ {bookingFeedback.rating}/5</span>
                  </div>
                  <p style={{ margin: 0, color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                    {bookingFeedback.content}
                  </p>
                  {bookingFeedback.managerReply && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #f0d488", color: "#334155", fontSize: 13 }}>
                      <strong>Phản hồi từ quản lý:</strong> {bookingFeedback.managerReply}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <Link className="btn btn-primary" to={`/customer/bookings/${booking.id}`} style={{ fontSize: 13 }}>
                  Xem chi tiết
                </Link>
                {booking.status === "CHECKED_OUT" && !bookingFeedback && (
                  <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE} state={{ booking }} style={{ fontSize: 13 }}>
                    Đánh giá phòng
                  </Link>
                )}
                {bookingFeedback && (
                  <Link className="btn pill pill-soft" to={PATHS.CUSTOMER_FEEDBACKS} state={{ bookingId: booking.id }} style={{ fontSize: 13 }}>
                    Xem chi tiết feedback
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