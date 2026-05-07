import { useEffect, useState } from "react";
import { dashboardService } from "./dashboardService";
import { formatCurrencyVnd, formatDate, formatStatus } from "../../services/presenters";

export default function StaffDashboard() {
  const [todayBookings, setTodayBookings] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [walkIn, setWalkIn] = useState({
    customerId: "44444444-4444-4444-4444-444444444444",
    roomId: "",
    branchId: "",
    checkInDate: "",
    checkOutDate: "",
    adults: 2,
    children: 0,
    totalPrice: 0
  });

  const [serviceUpdate, setServiceUpdate] = useState({
    bookingId: "",
    serviceCode: "BF-SET",
    quantity: 1,
    actualPrice: 150000
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookings, rooms] = await Promise.all([
        dashboardService.getStaffTodayBookings(),
        dashboardService.getStaffRoomStatus()
      ]);
      setTodayBookings(bookings || []);
      setRoomStatus(rooms || []);
    } catch (err) {
      setError(err.message || "Khong the tai du lieu staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const callAction = async (fn) => {
    setMessage("");
    setError("");
    try {
      await fn();
      setMessage("Da cap nhat thanh cong");
      await loadData();
    } catch (err) {
      setError(err.message || "Thao tac that bai");
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: 18 }}>Dang tai dashboard staff...</div>;
  }

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div className="page-heading">
        <h1>Staff Dashboard</h1>
        <p>Điều phối vận hành tại quầy theo bố cục nhẹ, rõ và dễ thao tác.</p>
      </div>
      {message && <div style={{ color: "#166534" }}>{message}</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      <article className="promo-banner">
        <div className="section-title" style={{ color: "white" }}>
          <h2 style={{ margin: 0 }}>Hôm nay tại quầy</h2>
          <small style={{ color: "rgba(255,255,255,0.78)" }}>{todayBookings.length} booking</small>
        </div>
        <div className="hero-stats" style={{ marginTop: 14 }}>
          <div className="hero-stat"><strong>{todayBookings.length}</strong><span>Booking trong ngày</span></div>
          <div className="hero-stat"><strong>{roomStatus.length}</strong><span>Phòng đang theo dõi</span></div>
          <div className="hero-stat"><strong>Desk</strong><span>Quản lý thao tác nhanh</span></div>
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Booking hom nay</h3>
        {todayBookings.length === 0 && <p>Khong co booking hom nay.</p>}
        {todayBookings.map((booking) => (
          <div key={booking.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, marginTop: 10, display: "grid", gap: 6 }}>
            <div><strong>{booking.id}</strong> · {formatStatus(booking.status)}</div>
            <div>Phong: {booking.roomId} · Tu {formatDate(booking.checkInDate)} den {formatDate(booking.checkOutDate)}</div>
            <div className="mono">{formatCurrencyVnd(booking.totalPrice)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={() => callAction(() => dashboardService.checkInBooking(booking.id))}>Check-in</button>
              <button className="btn btn-gold" onClick={() => callAction(() => dashboardService.checkOutBooking(booking.id))}>Check-out</button>
            </div>
          </div>
        ))}
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Room status</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {roomStatus.map((room) => (
            <div key={room.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, display: "grid", gap: 8 }}>
              <div><strong>{room.roomNumber}</strong> · {room.roomTypeName}</div>
              <div>{room.branchCity} · {formatStatus(room.status)}</div>
              <select value={room.status} onChange={(event) => callAction(() => dashboardService.updateRoomStatus(room.id, event.target.value))}>
                <option value="AVAILABLE">Con phong</option>
                <option value="HELD">Tam giu</option>
                <option value="OCCUPIED">Dang co khach</option>
                <option value="MAINTENANCE">Bao tri</option>
              </select>
            </div>
          ))}
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Tao walk-in booking</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Customer ID" value={walkIn.customerId} onChange={(event) => setWalkIn((prev) => ({ ...prev, customerId: event.target.value }))} />
          <input placeholder="Room ID" value={walkIn.roomId} onChange={(event) => setWalkIn((prev) => ({ ...prev, roomId: event.target.value }))} />
          <input placeholder="Branch ID" value={walkIn.branchId} onChange={(event) => setWalkIn((prev) => ({ ...prev, branchId: event.target.value }))} />
          <input type="date" value={walkIn.checkInDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkInDate: event.target.value }))} />
          <input type="date" value={walkIn.checkOutDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkOutDate: event.target.value }))} />
          <input type="number" min={1} placeholder="Adults" value={walkIn.adults} onChange={(event) => setWalkIn((prev) => ({ ...prev, adults: Number(event.target.value || 1) }))} />
          <input type="number" min={0} placeholder="Children" value={walkIn.children} onChange={(event) => setWalkIn((prev) => ({ ...prev, children: Number(event.target.value || 0) }))} />
          <input type="number" min={0} placeholder="Total price" value={walkIn.totalPrice} onChange={(event) => setWalkIn((prev) => ({ ...prev, totalPrice: Number(event.target.value || 0) }))} />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createWalkInBooking(walkIn))}
        >
          Tao booking walk-in
        </button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Cap nhat dich vu booking</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Booking ID" value={serviceUpdate.bookingId} onChange={(event) => setServiceUpdate((prev) => ({ ...prev, bookingId: event.target.value }))} />
          <input placeholder="Service code" value={serviceUpdate.serviceCode} onChange={(event) => setServiceUpdate((prev) => ({ ...prev, serviceCode: event.target.value }))} />
          <input type="number" min={1} placeholder="Quantity" value={serviceUpdate.quantity} onChange={(event) => setServiceUpdate((prev) => ({ ...prev, quantity: Number(event.target.value || 1) }))} />
          <input type="number" min={0} placeholder="Actual price" value={serviceUpdate.actualPrice} onChange={(event) => setServiceUpdate((prev) => ({ ...prev, actualPrice: Number(event.target.value || 0) }))} />
        </div>
        <button
          className="btn btn-gold"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.updateBookingServices(serviceUpdate.bookingId, {
            serviceCode: serviceUpdate.serviceCode,
            quantity: serviceUpdate.quantity,
            actualPrice: serviceUpdate.actualPrice
          }))}
          disabled={!serviceUpdate.bookingId}
        >
          Cap nhat service cho booking
        </button>
      </article>
    </section>
  );
}
