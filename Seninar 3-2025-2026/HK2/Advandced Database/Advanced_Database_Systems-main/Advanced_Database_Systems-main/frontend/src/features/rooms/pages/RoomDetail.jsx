import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { roomService } from "../roomService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import RatingStars from "../../../components/common/RatingStars";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd, formatStatus, getRoomAmenities, getRoomImage, getStatusStyle } from "../../../services/presenters";
import { useAuth } from "../../auth/useAuth";

export default function RoomDetail({ customer = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [room, setRoom] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const detail = await roomService.getRoomDetail(id);
      const feedbackList = await feedbackService.getFeedbackByRoom(id);
      setRoom(detail);
      setFeedbacks(feedbackList || []);
    } catch (err) {
      setError(err.message || "Khong the tai chi tiet phong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const totalPrice = useMemo(() => {
    if (!checkInDate || !checkOutDate || !room?.rate) return 0;
    const from = new Date(checkInDate);
    const to = new Date(checkOutDate);
    const nights = Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
    return nights * Number(room.rate || 0);
  }, [checkInDate, checkOutDate, room]);

  const goCreateBooking = () => {
    setBookingError("");
    if (!checkInDate || !checkOutDate) {
      setBookingError("Vui long chon day du ngay check-in/check-out");
      return;
    }
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setBookingError("Ngay check-out phai sau check-in");
      return;
    }
    if (adults + children > room.maxOccupancy) {
      setBookingError(`Tong so khach khong duoc vuot qua ${room.maxOccupancy}`);
      return;
    }
    if (room.status !== "AVAILABLE") {
      setBookingError("Phong hien tai khong kha dung de dat");
      return;
    }

    navigate(PATHS.CUSTOMER_BOOKING_CREATE, {
      state: {
        roomId: room.id,
        branchId: room.branchId,
        checkInDate,
        checkOutDate,
        adults,
        children,
        totalPrice
      }
    });
  };

  if (loading) return <LoadingState text="Dang tai chi tiet phong..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!room) return <ErrorState message="Khong tim thay phong" />;

  const heroImage = getRoomImage(room);
  const gallery = [heroImage, heroImage, heroImage];
  const statusStyle = getStatusStyle(room.status);
  const amenities = getRoomAmenities(room);
  const visibleFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, showAllFeedbacks ? feedbacks.length : 3);
  const canBookAsCustomer = role === "CUSTOMER" && isAuthenticated;

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 20 }}>
      <Link className="pill pill-soft" to={customer ? PATHS.CUSTOMER_ROOMS : PATHS.ROOMS}>← Quay lai danh sach phong</Link>

      {/* ═══ TOP ROW: Room media/info + booking form ═══ */}
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 1fr)" }}>
        <article className="card card-elevated" style={{ padding: 18, display: "grid", gap: 16 }}>
          <div className="split-panel" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
            <img src={gallery[0]} alt={room.roomTypeName} style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 18 }} />
            <div style={{ display: "grid", gap: 10 }}>
              <img src={gallery[1]} alt={`${room.roomTypeName}-1`} style={{ width: "100%", height: 134, objectFit: "cover", borderRadius: 18 }} />
              <img src={gallery[2]} alt={`${room.roomTypeName}-2`} style={{ width: "100%", height: 134, objectFit: "cover", borderRadius: 18 }} />
            </div>
          </div>

          <div className="room-badges" style={{ marginBottom: 2 }}>
            <span className="pill pill-soft">{room.branchCity}</span>
            <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>{formatStatus(room.status)}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0d2238" }}>{room.roomTypeName}</h3>
          <div style={{ display: "grid", gap: 8, color: "#334155", fontSize: 14 }}>
            <div>Phòng số: <strong>{room.roomNumber}</strong></div>
            <div>📍 {room.branchCity}</div>
            <div>👥 Tối đa {room.maxOccupancy} người</div>
            <div><RatingStars value={room.averageRating} size={14} showValue /></div>
            <div>Trạng thái: <strong>{formatStatus(room.status)}</strong></div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Tiện ích</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {amenities.slice(0, 5).map((item) => (
                <span key={item} className="pill pill-soft" style={{ fontSize: 11 }}>{item}</span>
              ))}
            </div>
          </div>
        </article>

        <aside className="card card-elevated" style={{ padding: 18, height: "fit-content" }}>
          <div className="mono room-price" style={{ marginBottom: 12, fontSize: 18 }}>{formatCurrencyVnd(room.rate)} / đêm</div>
          {canBookAsCustomer ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div className="field">
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Nhận phòng</label>
                <input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} style={{ padding: "8px 10px", fontSize: 12 }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Trả phòng</label>
                <input type="date" value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} style={{ padding: "8px 10px", fontSize: 12 }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Người lớn</label>
                <input type="number" min={1} value={adults} onChange={(event) => setAdults(Number(event.target.value || 1))} style={{ padding: "8px 10px", fontSize: 12 }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Trẻ em</label>
                <input type="number" min={0} value={children} onChange={(event) => setChildren(Number(event.target.value || 0))} style={{ padding: "8px 10px", fontSize: 12 }} />
              </div>
              <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Sức chứa:</span> <strong>{room.maxOccupancy}</strong>
              </div>
              <div style={{ display: "grid", gap: 4, paddingTop: 4, borderTop: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Tổng dự kiến:</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#9a7d24" }}>{formatCurrencyVnd(totalPrice)}</div>
              </div>
              {bookingError && <div style={{ padding: "8px 10px", background: "#fee2e2", color: "#b91c1c", borderRadius: 8, fontSize: 12 }}>{bookingError}</div>}
              <button className="btn btn-gold" onClick={goCreateBooking} disabled={room.status !== "AVAILABLE"} style={{ marginTop: 4, fontSize: 13 }}>Đặt phòng ngay</button>
            </div>
          ) : isAuthenticated ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: "8px 10px", background: "#fff7ed", borderRadius: 8, color: "#9a3412", fontSize: 12 }}>
                Tài khoản hiện tại chỉ có quyền xem.
              </div>
              <Link className="btn btn-primary" to={PATHS.HOME}>Quay về</Link>
            </div>
          ) : (
            <Link className="btn btn-primary" to={`${PATHS.LOGIN}?redirect=/customer/rooms/${room.id}`}>Đăng nhập</Link>
          )}
        </aside>
      </div>

      {/* ═══ BOTTOM ROW: Reviews ═══ */}
      <article className="card card-elevated" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>💬 Đánh giá gần nhất</h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>{feedbacks.length} đánh giá</span>
        </div>

        {feedbacks.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Chưa có đánh giá nào cho phòng này.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {/* Chỉ lấy 3 đánh giá gần nhất */}
            {[...feedbacks]
              .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} style={{
                  padding: "14px 16px", borderRadius: 12,
                  background: "#f8fafc", border: "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <RatingStars value={item.rating} size={14} showValue />
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : ""}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{item.content}</p>
                  {item.managerReply && (
                    <div style={{ marginTop: 8, padding: "8px 12px", background: "#fffbeb", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
                      💼 Phản hồi: {item.managerReply}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {feedbacks.length > 3 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              className="btn"
              style={{ border: "1px solid #c9a84c", color: "#9a7d24", background: "white", padding: "10px 24px", borderRadius: 99 }}
              onClick={() => setShowAllFeedbacks((prev) => !prev)}
            >
              {showAllFeedbacks ? "Thu gọn" : `Xem tất cả ${feedbacks.length} đánh giá →`}
            </button>
            {/* Khi mở full — show hết */}
            {showAllFeedbacks && (
              <div style={{ display: "grid", gap: 12, marginTop: 16, textAlign: "left" }}>
                {[...feedbacks]
                  .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                  .slice(3) // chỉ show phần còn lại
                  .map((item) => (
                    <div key={item.id} style={{ padding: "14px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div style={{ marginBottom: 6 }}>
                        <RatingStars value={item.rating} size={14} showValue />
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>{item.content}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
