import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { roomService } from "../roomService";
import { bookingService } from "../../booking/bookingService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import RatingStars from "../../../components/common/RatingStars";
import { PATHS } from "../../../routes/pathConstants";
import {
  formatCurrencyVnd,
  formatCurrencyVndPerNight,
  formatStatus,
  getRoomAmenities,
  getRoomImage,
  getStatusStyle,
} from "../../../services/presenters";
import { useAuth } from "../../auth/useAuth";

// Quick-select stay duration options (mirrors PreviewBooking)
const STAY_NIGHT_OPTIONS = [1, 2, 3, 5, 7, 14];

// Minimum check-in date = today
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RoomDetail({ customer = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [room, setRoom] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [stayNights, setStayNights] = useState(1);
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
      const [detail, feedbackList] = await Promise.all([
        roomService.getRoomDetail(id),
        feedbackService.getFeedbackByRoom(id).catch(() => []),
      ]);
      setRoom(detail);
      setFeedbacks(feedbackList || []);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết phòng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // Compute checkout date from checkInDate + stayNights
  const checkOutDate = useMemo(() => {
    if (!checkInDate || stayNights < 1) return "";
    const d = new Date(`${checkInDate}T00:00:00`);
    d.setDate(d.getDate() + stayNights);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [checkInDate, stayNights]);

  const totalPrice = useMemo(() => {
    // Dùng effectiveRate nếu có (đã áp pricing_season), fallback về rate gốc
    const pricePerNight = room?.effectiveRate != null ? Number(room.effectiveRate) : Number(room?.rate || 0);
    if (!pricePerNight || stayNights < 1) return 0;
    return stayNights * pricePerNight;
  }, [stayNights, room]);

  const feedbackStats = useMemo(() => {
    const validRatings = feedbacks
      .map((item) => Number(item.rating || 0))
      .filter((v) => Number.isFinite(v) && v > 0);
    return {
      averageRating:
        validRatings.length > 0
          ? validRatings.reduce((s, v) => s + v, 0) / validRatings.length
          : Number(room?.averageRating || 0),
      reviewCount: feedbacks.length,
    };
  }, [feedbacks, room?.averageRating]);

  const goCreateBooking = () => {
    setBookingError("");
    if (!checkInDate) { setBookingError("Vui lòng chọn ngày nhận phòng"); return; }
    if (stayNights < 1) { setBookingError("Số đêm phải ít nhất là 1"); return; }
    if (adults + children > (room?.maxOccupancy || 99)) {
      setBookingError(`Tổng số khách không được vượt quá ${room.maxOccupancy}`);
      return;
    }
    if (room?.status !== "AVAILABLE") {
      setBookingError("Phòng hiện tại không khả dụng để đặt");
      return;
    }
    navigate(PATHS.CUSTOMER_BOOKING_CREATE, {
      state: { roomId: room.id, branchId: room.branchId, checkInDate, checkInTime, stayNights, adults, children },
    });
  };

  if (loading) return <LoadingState text="Đang tải chi tiết phòng..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!room) return <ErrorState message="Không tìm thấy phòng" />;

  const heroImage = getRoomImage(room);
  const statusStyle = getStatusStyle(room.status);
  const amenities = getRoomAmenities(room);
  const sortedFeedbacks = [...feedbacks].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const visibleFeedbacks = sortedFeedbacks.slice(0, showAllFeedbacks ? sortedFeedbacks.length : 3);
  const hiddenFeedbacks = sortedFeedbacks.slice(3);
  const canBook = role === "CUSTOMER" && isAuthenticated;

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 20 }}>
      <Link className="pill pill-soft" to={customer ? PATHS.CUSTOMER_ROOMS : PATHS.ROOMS}>
        ← Quay lại danh sách phòng
      </Link>

      {/* ═══ TOP ROW ═══ */}
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 1fr)" }}>
        {/* Room info */}
        <article className="card card-elevated" style={{ padding: 18, display: "grid", gap: 16 }}>
          <div className="split-panel" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
            <img src={heroImage} alt={room.roomTypeName} style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 18 }} />
            <div style={{ display: "grid", gap: 10 }}>
              <img src={heroImage} alt={`${room.roomTypeName}-1`} style={{ width: "100%", height: 134, objectFit: "cover", borderRadius: 18 }} />
              <img src={heroImage} alt={`${room.roomTypeName}-2`} style={{ width: "100%", height: 134, objectFit: "cover", borderRadius: 18 }} />
            </div>
          </div>

          <div className="room-badges" style={{ marginBottom: 2 }}>
            <span className="pill pill-soft">{room.branchCity}</span>
            <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {formatStatus(room.status)}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0d2238" }}>{room.roomTypeName}</h3>
          <div style={{ display: "grid", gap: 8, color: "#334155", fontSize: 14 }}>
            <div>Phòng số: <strong>{room.roomNumber}</strong></div>
            <div>📍 {room.branchCity}</div>
            <div>👥 Tối đa {room.maxOccupancy} người</div>
            <div><RatingStars value={feedbackStats.averageRating} size={14} showValue count={feedbackStats.reviewCount} /></div>
            <div>Trạng thái: <strong>{formatStatus(room.status)}</strong></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Tiện ích</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {amenities.slice(0, 6).map((item) => (
                <span key={item} className="pill pill-soft" style={{ fontSize: 11 }}>{item}</span>
              ))}
            </div>
          </div>
        </article>

        {/* Booking sidebar */}
        <aside className="card card-elevated" style={{ padding: 18, height: "fit-content", display: "grid", gap: 12 }}>
          {/* Hiển thị giá hiệu lực (sau season), gạch giá gốc nếu có season */}
          <div>
            <div className="mono room-price" style={{ fontSize: 18 }}>
              {formatCurrencyVndPerNight(room.effectiveRate != null ? room.effectiveRate : room.rate)}
            </div>
            {room.effectiveRate != null && Math.abs(Number(room.effectiveRate) - Number(room.rate)) > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "#94a3b8", textDecoration: "line-through" }}>
                  {formatCurrencyVndPerNight(room.rate)}
                </span>
                {room.activeSeasonName && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: Number(room.effectiveRate) > Number(room.rate) ? "#fee2e2" : "#dcfce7",
                    color: Number(room.effectiveRate) > Number(room.rate) ? "#b91c1c" : "#16a34a",
                  }}>
                    {room.activeSeasonName}
                  </span>
                )}
              </div>
            )}
          </div>

          {canBook ? (
            <>
              {/* Check-in date */}
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>📅 Ngày nhận phòng</label>
                <input
                  type="date"
                  min={getTodayStr()}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13 }}
                />
              </div>

              {/* Check-in time */}
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>🕐 Giờ nhận phòng</label>
                <select
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  style={{ padding: "8px 10px", fontSize: 13 }}
                >
                  {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Stay nights quick-select */}
              <div>
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "block", marginBottom: 6 }}>🌙 Số đêm lưu trú</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {STAY_NIGHT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStayNights(n)}
                      style={{
                        padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        border: stayNights === n ? "2px solid #c9a84c" : "1px solid #e2e8f0",
                        background: stayNights === n ? "#fffbeb" : "white",
                        color: stayNights === n ? "#9a7d24" : "#475569",
                      }}
                    >
                      {n}đ
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={stayNights}
                  onChange={(e) => setStayNights(Math.max(1, Number(e.target.value || 1)))}
                  style={{ padding: "7px 10px", fontSize: 13, width: "100%" }}
                />
              </div>

              {/* Checkout date display */}
              {checkInDate && checkOutDate && (
                <div style={{ padding: "8px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
                  Trả phòng: <strong style={{ color: "#0d2238" }}>{checkOutDate}</strong>
                </div>
              )}

              {/* Guests */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div className="field">
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Người lớn</label>
                  <input type="number" min={1} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))} style={{ padding: "7px 10px", fontSize: 13 }} />
                </div>
                <div className="field">
                  <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Trẻ em</label>
                  <input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))} style={{ padding: "7px 10px", fontSize: 13 }} />
                </div>
              </div>

              {/* Price preview */}
              <div style={{ padding: "10px 12px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Tổng dự kiến ({stayNights} đêm)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#9a7d24" }}>{formatCurrencyVnd(totalPrice)}</div>
                <div style={{ fontSize: 11, color: "#d97706", marginTop: 4, fontWeight: 600 }}>
                  ⏱️ Phòng giữ 15 phút sau khi đặt
                </div>
              </div>

              {bookingError && (
                <div style={{ padding: "8px 10px", background: "#fee2e2", color: "#b91c1c", borderRadius: 8, fontSize: 12 }}>
                  {bookingError}
                </div>
              )}

              <button
                className="btn btn-gold"
                onClick={goCreateBooking}
                disabled={room.status !== "AVAILABLE"}
                style={{ fontSize: 14, fontWeight: 700, padding: "12px" }}
              >
                {room.status === "AVAILABLE" ? "🛏️ Đặt phòng ngay" : "Phòng không khả dụng"}
              </button>
            </>
          ) : isAuthenticated ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ padding: "8px 10px", background: "#fff7ed", borderRadius: 8, color: "#9a3412", fontSize: 12 }}>
                Tài khoản hiện tại chỉ có quyền xem.
              </div>
              <Link className="btn btn-primary" to={PATHS.HOME}>Quay về trang chủ</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Đăng nhập để đặt phòng này.</p>
              <Link className="btn btn-primary" to={`${PATHS.LOGIN}?redirect=/customer/rooms/${room.id}`}>
                Đăng nhập để đặt phòng
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* ═══ REVIEWS ═══ */}
      <article className="card card-elevated" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>💬 Đánh giá ({feedbackStats.reviewCount})</h3>
          <RatingStars value={feedbackStats.averageRating} size={14} showValue />
        </div>

        {feedbacks.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Chưa có đánh giá nào cho phòng này.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleFeedbacks.map((item) => (
              <div key={item.id} style={{ padding: "14px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
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
            ))}
          </div>
        )}

        {sortedFeedbacks.length > 3 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              className="btn"
              style={{ border: "1px solid #c9a84c", color: "#9a7d24", background: "white", padding: "10px 24px", borderRadius: 99 }}
              onClick={() => setShowAllFeedbacks((prev) => !prev)}
            >
              {showAllFeedbacks ? "Thu gọn" : `Xem tất cả ${sortedFeedbacks.length} đánh giá →`}
            </button>
            {showAllFeedbacks && (
              <div style={{ display: "grid", gap: 12, marginTop: 16, textAlign: "left" }}>
                {hiddenFeedbacks.map((item) => (
                  <div key={item.id} style={{ padding: "14px 16px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ marginBottom: 6 }}><RatingStars value={item.rating} size={14} showValue /></div>
                    <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  );
}
