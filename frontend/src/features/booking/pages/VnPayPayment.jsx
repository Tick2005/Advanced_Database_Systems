import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "../paymentService";
import { PATHS } from "../../../routes/pathConstants";

export default function VnPayPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startPayment = async () => {
    if (!booking?.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await paymentService.createVnPayPayment({
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: "VND",
        orderInfo: `BOOKING ${booking.id}`
      });
      if (!response.checkoutUrl) {
        throw new Error("Khong nhan duoc checkoutUrl tu backend");
      }
      window.location.href = response.checkoutUrl;
    } catch (err) {
      setError(err.message || "Khong the tao thanh toan VNPay");
      setLoading(false);
    }
  };

  if (!booking?.id) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <p>Khong co booking de thanh toan.</p>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKINGS)}>Ve lich su booking</button>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Dat phong - Buoc 3 (Thanh toan)</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
        <div>Booking: {booking.id}</div>
        <div className="mono">Tong tien: {booking.totalPrice} VND</div>
        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn btn-gold" onClick={startPayment} disabled={loading}>
          {loading ? "Dang chuyen huong..." : "Xac nhan va thanh toan VNPay"}
        </button>
      </div>
    </section>
  );
}
