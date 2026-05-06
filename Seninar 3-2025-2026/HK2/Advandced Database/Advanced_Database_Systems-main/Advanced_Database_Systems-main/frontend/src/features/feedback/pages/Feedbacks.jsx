// commit: fix(feedbacks): sửa encoding tiếng Việt trong error messages
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { feedbackService } from "../feedbackService";
import { bookingService } from "../../booking/bookingService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";

export default function Feedbacks() {
  const feedbacksQuery = useApiQuery({
    queryKey: ["my-feedbacks"],
    queryFn: () => feedbackService.getMyFeedbacks(),
    staleTime: 30 * 1000,
  });
  const bookingsQuery = useApiQuery({
    queryKey: ["my-bookings-for-feedbacks"],
    queryFn: () => bookingService.getBookings(),
    staleTime: 30 * 1000,
  });

  const feedbacks = feedbacksQuery.data || [];
  const bookingById = useMemo(() => {
    return new Map((bookingsQuery.data || []).map((booking) => [booking.id, booking]));
  }, [bookingsQuery.data]);

  if (feedbacksQuery.isLoading || bookingsQuery.isLoading) return <LoadingState text="Đang tải đánh giá của bạn..." />;
  if (feedbacksQuery.error) return <ErrorState message={feedbacksQuery.error.message || "Không thể tải feedbacks"} onRetry={feedbacksQuery.refetch} />;
  if (bookingsQuery.error) return <ErrorState message={bookingsQuery.error.message || "Không thể tải lịch sử booking"} onRetry={bookingsQuery.refetch} />;

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>Đánh giá của tôi</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>Danh sách phản hồi gắn với booking, phòng và chi nhánh cụ thể.</p>
        </div>
        <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKINGS}>Xem booking history</Link>
      </div>

      {feedbacks.length === 0 && (
        <div className="card" style={{ padding: 16 }}>
          Bạn chưa có đánh giá nào. Hãy vào <Link to={PATHS.CUSTOMER_BOOKINGS}>booking history</Link> sau khi check-out để gửi feedback.
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {feedbacks.map((item) => (
          <article className="card" key={item.id} style={{ padding: 16, display: "grid", gap: 10 }}>
            {(() => {
              const booking = bookingById.get(item.bookingId);
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "#0d2238" }}>⭐ {item.rating}/5</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        {booking?.roomTypeName || booking?.roomNumber || item.roomId || "Phòng chưa xác định"} · {booking?.branchName || "Chi nhánh LuxStay"}
                      </div>
                    </div>
                    <Link className="btn pill pill-soft" to={`/customer/bookings/${item.bookingId}`}>Xem booking</Link>
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.7 }}>{item.content}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, fontSize: 13, color: "#64748b" }}>
                    <div><strong>Booking:</strong> {item.bookingId}</div>
                    <div><strong>Phòng:</strong> {booking?.roomNumber || item.roomId || "—"}</div>
                    <div><strong>Chi nhánh:</strong> {booking?.branchName || "—"}</div>
                  </div>
                </>
              );
            })()}
            {item.managerReply && (
              <div style={{ padding: 12, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>Phản hồi từ quản lý</strong>
                {item.managerReply}
              </div>
            )}
            <small style={{ color: "#64748b" }}>{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
