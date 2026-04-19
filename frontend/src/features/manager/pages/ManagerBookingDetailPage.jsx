import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import StatusBadge from "../../../components/common/StatusBadge";

export default function ManagerBookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    dashboardService.getManagerBookings().then((data) => {
      const found = (data || []).find((item) => item.id === id);
      setBooking(found || null);
    });
  }, [id]);

  return (
    <section className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
      <h1 style={{ margin: 0 }}>Chi tiet booking manager</h1>
      {!booking && <div>Khong tim thay booking.</div>}
      {booking && (
        <>
          <div>Booking ID: <span className="mono">{booking.id}</span></div>
          <div>Room ID: {booking.roomId}</div>
          <div>Branch ID: {booking.branchId}</div>
          <div>Khach: {booking.customerId}</div>
          <div>Ngay o: {booking.checkInDate} den {booking.checkOutDate}</div>
          <div>Tong tien: <span className="mono">{booking.totalPrice}</span></div>
          <div>Trang thai: <StatusBadge value={booking.status} /></div>
        </>
      )}
    </section>
  );
}
