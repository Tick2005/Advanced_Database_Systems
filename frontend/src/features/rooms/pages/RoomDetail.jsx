import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { roomService } from "../roomService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd, formatStatus, getRoomAmenities, getRoomImage, getStatusStyle } from "../../../services/presenters";

export default function RoomDetail({ customer = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");

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

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 20 }}>
      <Link className="pill pill-soft" to={customer ? PATHS.CUSTOMER_ROOMS : PATHS.ROOMS}>← Quay lai danh sach phong</Link>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "minmax(0,1.35fr) minmax(300px,0.95fr)" }}>
        <article className="card card-elevated" style={{ padding: 18 }}>
          <div className="split-panel" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: 14 }}>
            <img src={gallery[0]} alt={room.roomTypeName} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 18 }} />
            <div style={{ display: "grid", gap: 10 }}>
              <img src={gallery[1]} alt={`${room.roomTypeName}-1`} style={{ width: "100%", height: 154, objectFit: "cover", borderRadius: 18 }} />
              <img src={gallery[2]} alt={`${room.roomTypeName}-2`} style={{ width: "100%", height: 154, objectFit: "cover", borderRadius: 18 }} />
            </div>
          </div>
          <div className="room-badges" style={{ marginBottom: 10 }}>
            <span className="pill pill-soft">{room.branchCity}</span>
            <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>{formatStatus(room.status)}</span>
          </div>
          <h1 style={{ marginTop: 0 }}>{room.roomTypeName} · {room.roomNumber}</h1>
          <p>{room.branchCity} · sức chứa tối đa {room.maxOccupancy} người</p>
          <p>Đánh giá trung bình: {room.averageRating?.toFixed?.(1) || room.averageRating || 0} / 5</p>
          <p>
            Trạng thái hiện tại: <strong>{formatStatus(room.status)}</strong>
          </p>
          <h3>Tiện ích</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {amenities.map((item) => (
              <span key={item} className="pill pill-soft">
                {item}
              </span>
            ))}
          </div>
          <h3>Danh gia khach hang</h3>
          {feedbacks.length === 0 ? <p>Chưa có phản hồi</p> : feedbacks.slice(0, 5).map((item) => (
            <div key={item.id} className="list-item" style={{ marginTop: 10 }}>
              <div>⭐ {item.rating}/5</div>
              <div>{item.content}</div>
            </div>
          ))}
        </article>

        <aside className="card surface-panel" style={{ padding: 18, height: "fit-content", position: "sticky", top: 90 }}>
          <div className="mono room-price" style={{ marginBottom: 12, fontSize: 18 }}>{formatCurrencyVnd(room.rate)} / đêm</div>
          {customer ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Ngày nhận phòng</label>
                <input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} style={{ padding: "10px 12px" }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Ngày trả phòng</label>
                <input type="date" value={checkOutDate} onChange={(event) => setCheckOutDate(event.target.value)} style={{ padding: "10px 12px" }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Người lớn</label>
                <input type="number" min={1} value={adults} onChange={(event) => setAdults(Number(event.target.value || 1))} style={{ padding: "10px 12px" }} />
              </div>
              <div className="field">
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Trẻ em</label>
                <input type="number" min={0} value={children} onChange={(event) => setChildren(Number(event.target.value || 0))} style={{ padding: "10px 12px" }} />
              </div>
              <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10, fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>Sức chứa tối đa:</span> <strong>{room.maxOccupancy} người</strong>
              </div>
              <div style={{ display: "grid", gap: 6, paddingTop: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Tổng dự kiến:</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#9a7d24" }}>{formatCurrencyVnd(totalPrice)}</div>
              </div>
              {bookingError && <div style={{ padding: "10px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>{bookingError}</div>}
              <button className="btn btn-gold" onClick={goCreateBooking} disabled={room.status !== "AVAILABLE"} style={{ marginTop: 4 }}>Đặt phòng ngay</button>
            </div>
          ) : (
            <Link className="btn btn-primary" to={`${PATHS.LOGIN}?redirect=/customer/rooms/${room.id}`}>Dang nhap de dat phong</Link>
          )}
        </aside>
      </div>
    </section>
  );
}
