import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { bookingService } from "../bookingService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      setBooking(await bookingService.getBookingDetail(id));
    } catch (err) {
      setError(err.message || "Khong the tai chi tiet booking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <LoadingState text="Dang tai booking detail..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!booking) return <ErrorState message="Khong tim thay booking" />;

  const onCancel = async () => {
    setUpdating(true);
    setError("");
    try {
      await bookingService.cancelBooking(booking.id, "Customer cancelled from detail");
      await fetchData();
    } catch (err) {
      setError(err.message || "Khong the huy booking");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Chi tiet booking</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
        <div className="mono">Booking ID: {booking.id}</div>
        <div>Room: {booking.roomId}</div>
        <div>Branch: {booking.branchId}</div>
        <div>Ngay o: {booking.checkInDate} - {booking.checkOutDate}</div>
        <div>Trang thai: {booking.status}</div>
        <div className="mono">Tong tien: {booking.totalPrice} VND</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="btn" style={{ border: "1px solid #dbe5ef" }} to={PATHS.CUSTOMER_BOOKINGS}>Quay lai danh sach</Link>
          {["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && (
            <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff" }} onClick={onCancel} disabled={updating}>
              {updating ? "Dang huy..." : "Huy booking"}
            </button>
          )}
          {booking.status === "PENDING_PAYMENT" && (
            <Link className="btn btn-gold" to={PATHS.CUSTOMER_BOOKING_PAYMENT} state={{ booking }}>Thanh toan ngay</Link>
          )}
          {booking.status === "CHECKED_OUT" && (
            <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE} state={{ booking }}>Danh gia phong</Link>
          )}
        </div>
      </div>
    </section>
  );
}
