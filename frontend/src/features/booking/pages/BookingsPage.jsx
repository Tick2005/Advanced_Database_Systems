import { useState } from "react";
import { Link } from "react-router-dom";
import { bookingService } from "../bookingService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { queryKeys } from "../../../services/queryKeys";

const STATUS_OPTIONS = ["ALL", "HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "EXPIRED"];

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cancellingId, setCancellingId] = useState("");

  const bookingsQuery = useApiQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => bookingService.getBookings(),
    staleTime: 30 * 1000
  });

  const cancelBookingMutation = useApiMutation({
    mutationFn: ({ bookingId }) => bookingService.cancelBooking(bookingId, "Customer cancelled from UI"),
    invalidateKeys: [queryKeys.bookings]
  });

  const bookings = bookingsQuery.data || [];

  const filtered = statusFilter === "ALL"
    ? bookings
    : bookings.filter((booking) => booking.status === statusFilter);

  const cancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await cancelBookingMutation.mutateAsync({ bookingId });
    } finally {
      setCancellingId("");
    }
  };

  if (bookingsQuery.isLoading) return <LoadingState text="Dang tai bookings..." />;
  if (bookingsQuery.error) {
    return <ErrorState message={bookingsQuery.error.message || "Khong the tai danh sach booking"} onRetry={bookingsQuery.refetch} />;
  }

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Lich su dat phong</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 16px" }}>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className="btn"
            style={{
              border: "1px solid #dbe5ef",
              background: statusFilter === status ? "#e8f0f8" : "#fff"
            }}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {cancelBookingMutation.error && (
        <ErrorState message={cancelBookingMutation.error.message || "Khong the huy booking"} onRetry={() => cancelBookingMutation.reset()} />
      )}

      {filtered.length === 0 && (
        <div className="card" style={{ padding: 18 }}>
          Khong co booking nao theo bo loc hien tai.
          <div style={{ marginTop: 10 }}>
            <Link className="btn btn-gold" to={PATHS.CUSTOMER_ROOMS}>Dat phong ngay</Link>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((booking) => (
          <article key={booking.id} className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
            <strong className="mono">#{booking.id}</strong>
            <div>{booking.checkInDate} - {booking.checkOutDate}</div>
            <div>Trang thai: {booking.status}</div>
            <div className="mono">Tong tien: {booking.totalPrice} VND</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn btn-primary" to={`/customer/bookings/${booking.id}`}>Xem chi tiet</Link>
              {["HOLD", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status) && (
                <button
                  className="btn"
                  style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff" }}
                  disabled={cancellingId === booking.id}
                  onClick={() => cancelBooking(booking.id)}
                >
                  {cancellingId === booking.id ? "Dang huy..." : "Huy booking"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
