// commit: fix(create-feedback): sửa encoding tiếng Việt
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { feedbackService } from "../feedbackService";
import { bookingService } from "../../booking/bookingService";
import { userService } from "../../users/userService";
import { PATHS } from "../../../routes/pathConstants";

export default function CreateFeedback() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingFromState = location.state?.booking;

  const [bookings, setBookings] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    bookingId: bookingFromState?.id || "",
    roomId: bookingFromState?.roomId || "",
    rating: 5,
    content: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingData, profile] = await Promise.all([
          bookingService.getBookings(),
          userService.getProfile()
        ]);
        setBookings((bookingData || []).filter((booking) => booking.status === "CHECKED_OUT"));
        setUserId(profile?.userId || "");
      } catch (err) {
        setError(err.message || "Không thể tải dữ liệu feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const bookingMap = useMemo(() => {
    const map = new Map();
    for (const booking of bookings) map.set(booking.id, booking);
    if (bookingFromState?.id) map.set(bookingFromState.id, bookingFromState);
    return map;
  }, [bookings, bookingFromState]);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const onBookingChange = (bookingId) => {
    const booking = bookingMap.get(bookingId);
    setForm((prev) => ({
      ...prev,
      bookingId,
      roomId: booking?.roomId || ""
    }));
    setFieldErrors((prev) => ({ ...prev, bookingId: "", roomId: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.bookingId) nextErrors.bookingId = "Vui lòng chọn booking";
    if (!form.roomId) nextErrors.roomId = "Khong tim thay roomId cho booking nay";
    if (form.rating < 1 || form.rating > 5) nextErrors.rating = "Rating chi tu 1 den 5";
    if (!form.content || form.content.trim().length < 20) {
      nextErrors.content = "Noi dung danh gia toi thieu 20 ky tu";
    }
    if (!userId) nextErrors.userId = "Khong tim thay thong tin user dang nhap";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError("");
    try {
      await feedbackService.createFeedback({
        bookingId: form.bookingId,
        roomId: form.roomId,
        userId,
        rating: Number(form.rating),
        content: form.content.trim()
      });
      navigate(PATHS.CUSTOMER_FEEDBACKS, { replace: true });
    } catch (err) {
      setError(err.message || "Không thể gửi feedback");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Viet danh gia</h1>
        <div className="card" style={{ padding: 16 }}>Dang tai danh sach booking...</div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Viet danh gia</h1>
      <form className="card" style={{ padding: 18, display: "grid", gap: 12 }} onSubmit={submit}>
        <div className="field">
          <label>Booking da hoan tat</label>
          <select value={form.bookingId} onChange={(event) => onBookingChange(event.target.value)}>
            <option value="">Chon booking</option>
            {Array.from(bookingMap.values()).map((booking) => (
              <option key={booking.id} value={booking.id}>
                #{booking.id} - Room {booking.roomNumber || booking.roomId} ({booking.checkInDate} - {booking.checkOutDate})
              </option>
            ))}
          </select>
          {fieldErrors.bookingId && <small style={{ color: "#b91c1c" }}>{fieldErrors.bookingId}</small>}
        </div>

        <div className="field">
          <label>Room ID</label>
          <input value={form.roomId} readOnly />
          {fieldErrors.roomId && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomId}</small>}
        </div>

        <div className="field">
          <label>Đánh giá (1-5 sao)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange("rating", star)}
                style={{
                  fontSize: 32,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  opacity: star <= form.rating ? 1 : 0.3,
                  transition: "all 0.2s",
                  transform: star <= form.rating ? "scale(1.15)" : "scale(1)"
                }}
              >
                ⭐
              </button>
            ))}
            <span style={{ marginLeft: 12, fontWeight: 700, fontSize: 18, color: "#9a7d24" }}>
              {form.rating}/5 sao
            </span>
          </div>
          {fieldErrors.rating && <small style={{ color: "#b91c1c" }}>{fieldErrors.rating}</small>}
        </div>

        <div className="field">
          <label>Noi dung danh gia</label>
          <textarea rows={5} value={form.content} onChange={(event) => onChange("content", event.target.value)} placeholder="Chia se trai nghiem cua ban..." />
          {fieldErrors.content && <small style={{ color: "#b91c1c" }}>{fieldErrors.content}</small>}
        </div>

        {fieldErrors.userId && <div style={{ color: "#b91c1c" }}>{fieldErrors.userId}</div>}
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" style={{ border: "1px solid #dbe5ef" }} to={PATHS.CUSTOMER_FEEDBACKS}>Huy</Link>
          <button className="btn btn-gold" disabled={saving}>{saving ? "Dang gui..." : "Gui danh gia"}</button>
        </div>
      </form>
    </section>
  );
}
