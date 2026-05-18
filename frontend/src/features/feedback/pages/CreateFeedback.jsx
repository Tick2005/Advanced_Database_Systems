import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { feedbackService } from "../feedbackService";
import { bookingService } from "../../booking/bookingService";
import { PATHS } from "../../../routes/pathConstants";

export default function CreateFeedback() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingFromState = location.state?.booking;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    bookingId: bookingFromState?.id || "",
    roomId: bookingFromState?.roomId || "",
    rating: 5,
    content: "",
  });

  useEffect(() => {
    if (bookingFromState?.id) {
      setForm((prev) => ({
        ...prev,
        bookingId: bookingFromState.id,
        roomId: bookingFromState.roomId || prev.roomId,
      }));
    }
  }, [bookingFromState]);

  useEffect(() => {
    setLoading(true);
    setError("");
    bookingService
      .getBookings()
      .then((data) => {
        setBookings((data || []).filter((b) => b.status === "CHECKED_OUT"));
      })
      .catch((err) => setError(err.message || "Không thể tải danh sách booking"))
      .finally(() => setLoading(false));
  }, []);

  // Merge bookings from API with the one passed via state (may not be in list yet)
  const bookingMap = useMemo(() => {
    const map = new Map();
    for (const b of bookings) map.set(b.id, b);
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
      roomId: booking?.roomId || "",
    }));
    setFieldErrors((prev) => ({ ...prev, bookingId: "", roomId: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.bookingId) errs.bookingId = "Vui lòng chọn booking";
    if (!form.roomId)    errs.roomId    = "Không tìm thấy roomId cho booking này";
    if (form.rating < 1 || form.rating > 5) errs.rating = "Đánh giá từ 1 đến 5 sao";
    if (!form.content || form.content.trim().length < 20)
      errs.content = "Nội dung đánh giá tối thiểu 20 ký tự";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      // Backend lấy userId từ JWT — không cần gửi từ frontend
      await feedbackService.createFeedback({
        bookingId: form.bookingId,
        roomId: form.roomId,
        rating: Number(form.rating),
        content: form.content.trim(),
      });
      navigate(PATHS.CUSTOMER_BOOKINGS, { replace: true });
    } catch (err) {
      setError(err.message || "Không thể gửi đánh giá");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Viết đánh giá</h1>
        <div className="card" style={{ padding: 16, color: "#64748b" }}>Đang tải danh sách booking...</div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 600 }}>
      <h1 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800, color: "#0d2238" }}>⭐ Viết đánh giá</h1>

      {/* Booking context banner */}
      {bookingFromState?.id && (
        <div className="card-elevated" style={{ padding: 14, marginBottom: 16, background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>Đánh giá lưu trú</div>
          <div style={{ fontWeight: 700, color: "#0d2238" }}>
            {bookingFromState.roomTypeName || "Phòng"}
            {bookingFromState.roomNumber ? ` · Phòng ${bookingFromState.roomNumber}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
            {bookingFromState.branchName || "Chi nhánh"} ·{" "}
            {bookingFromState.checkInDate ? new Date(bookingFromState.checkInDate).toLocaleDateString("vi-VN") : "—"}
            {" → "}
            {bookingFromState.checkOutDate ? new Date(bookingFromState.checkOutDate).toLocaleDateString("vi-VN") : "—"}
          </div>
        </div>
      )}

      <form className="card card-elevated" style={{ padding: 20, display: "grid", gap: 16 }} onSubmit={submit}>
        {/* Booking selector */}
        <div className="field">
          <label style={{ fontSize: 14, fontWeight: 600 }}>Booking đã hoàn tất</label>
          <select
            value={form.bookingId}
            onChange={(e) => onBookingChange(e.target.value)}
            style={{ padding: "10px 12px" }}
          >
            <option value="">-- Chọn booking --</option>
            {Array.from(bookingMap.values()).map((b) => {
              const roomInfo   = b.roomNumber || b.roomTypeName || "Phòng";
              const branchInfo = b.branchName || "Chi nhánh";
              const date       = b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("vi-VN") : "";
              return (
                <option key={b.id} value={b.id}>
                  {roomInfo} — {branchInfo} ({date})
                </option>
              );
            })}
          </select>
          {fieldErrors.bookingId && <small style={{ color: "#b91c1c" }}>{fieldErrors.bookingId}</small>}
          {fieldErrors.roomId    && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomId}</small>}
        </div>

        {/* Star rating */}
        <div className="field">
          <label style={{ fontSize: 14, fontWeight: 600 }}>Đánh giá (1–5 sao)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange("rating", star)}
                style={{
                  fontSize: 32, background: "none", border: "none", cursor: "pointer",
                  opacity: star <= form.rating ? 1 : 0.3,
                  transform: star <= form.rating ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                }}
              >
                ⭐
              </button>
            ))}
            <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 16, color: "#9a7d24" }}>
              {form.rating}/5 sao
            </span>
          </div>
          {fieldErrors.rating && <small style={{ color: "#b91c1c" }}>{fieldErrors.rating}</small>}
        </div>

        {/* Content */}
        <div className="field">
          <label style={{ fontSize: 14, fontWeight: 600 }}>Nội dung đánh giá</label>
          <textarea
            rows={5}
            value={form.content}
            onChange={(e) => onChange("content", e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về phòng, dịch vụ, nhân viên... (tối thiểu 20 ký tự)"
            style={{ resize: "vertical" }}
          />
          <small style={{ color: form.content.length < 20 ? "#d97706" : "#16a34a" }}>
            {form.content.length}/20 ký tự tối thiểu
          </small>
          {fieldErrors.content && <small style={{ color: "#b91c1c" }}>{fieldErrors.content}</small>}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" style={{ border: "1px solid #dbe5ef" }} to={PATHS.CUSTOMER_BOOKINGS}>
            Hủy
          </Link>
          <button className="btn btn-gold" disabled={saving} style={{ flex: 1 }}>
            {saving ? "⏳ Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </form>
    </section>
  );
}
