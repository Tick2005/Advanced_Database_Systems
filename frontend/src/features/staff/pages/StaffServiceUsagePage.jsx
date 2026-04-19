import { useState } from "react";
import ToastMessage from "../../../components/common/ToastMessage";
import { dashboardService } from "../../dashboard/dashboardService";

export default function StaffServiceUsagePage() {
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
  const [service, setService] = useState({ bookingId: "", serviceCode: "BF-SET", quantity: 1, actualPrice: 120000 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const callAction = async (fn, text) => {
    setMessage("");
    setError("");
    try {
      await fn();
      setMessage(text);
    } catch (err) {
      setError(err.message || "Khong the thuc hien thao tac");
    }
  };

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Dich vu booking va walk-in</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Tao walk-in booking</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Customer ID" value={walkIn.customerId} onChange={(event) => setWalkIn((prev) => ({ ...prev, customerId: event.target.value }))} />
          <input placeholder="Room ID" value={walkIn.roomId} onChange={(event) => setWalkIn((prev) => ({ ...prev, roomId: event.target.value }))} />
          <input placeholder="Branch ID" value={walkIn.branchId} onChange={(event) => setWalkIn((prev) => ({ ...prev, branchId: event.target.value }))} />
          <input type="date" value={walkIn.checkInDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkInDate: event.target.value }))} />
          <input type="date" value={walkIn.checkOutDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkOutDate: event.target.value }))} />
          <input type="number" min={1} value={walkIn.adults} onChange={(event) => setWalkIn((prev) => ({ ...prev, adults: Number(event.target.value || 1) }))} />
          <input type="number" min={0} value={walkIn.children} onChange={(event) => setWalkIn((prev) => ({ ...prev, children: Number(event.target.value || 0) }))} />
          <input type="number" min={0} value={walkIn.totalPrice} onChange={(event) => setWalkIn((prev) => ({ ...prev, totalPrice: Number(event.target.value || 0) }))} />
        </div>
        <button className="btn btn-primary" onClick={() => callAction(() => dashboardService.createWalkInBooking(walkIn), "Tao walk-in thanh cong")}>Tao walk-in</button>
      </article>

      <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Cap nhat dich vu su dung</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Booking ID" value={service.bookingId} onChange={(event) => setService((prev) => ({ ...prev, bookingId: event.target.value }))} />
          <input placeholder="Service code" value={service.serviceCode} onChange={(event) => setService((prev) => ({ ...prev, serviceCode: event.target.value }))} />
          <input type="number" min={1} value={service.quantity} onChange={(event) => setService((prev) => ({ ...prev, quantity: Number(event.target.value || 1) }))} />
          <input type="number" min={0} value={service.actualPrice} onChange={(event) => setService((prev) => ({ ...prev, actualPrice: Number(event.target.value || 0) }))} />
        </div>
        <button
          className="btn btn-gold"
          disabled={!service.bookingId}
          onClick={() => callAction(() => dashboardService.updateBookingServices(service.bookingId, {
            serviceCode: service.serviceCode,
            quantity: service.quantity,
            actualPrice: service.actualPrice
          }), "Cap nhat dich vu thanh cong")}
        >
          Cap nhat dich vu
        </button>
      </article>
    </section>
  );
}
