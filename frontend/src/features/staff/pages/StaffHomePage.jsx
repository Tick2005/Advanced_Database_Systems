import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import { BookingStatusChart } from "../../../components/common/ChartWidgets";

export default function StaffHomePage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      dashboardService.getStaffTodayBookings(),
      dashboardService.getStaffRoomStatus()
    ]).then(([bookingData, roomData]) => {
      setBookings(bookingData || []);
      setRooms(roomData || []);
    }).catch((err) => {
      setError(err.message || "Khong the tai dashboard staff");
    }).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => ({
    totalBookings: bookings.length,
    pendingCheckin: bookings.filter((item) => item.status === "CONFIRMED").length,
    checkedIn: bookings.filter((item) => item.status === "CHECKED_IN").length,
    availableRooms: rooms.filter((item) => item.status === "AVAILABLE").length
  }), [bookings, rooms]);

  const bookingByStatus = useMemo(() => {
    const map = new Map();
    bookings.forEach((item) => {
      map.set(item.status, (map.get(item.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Staff Dashboard</h1>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <SummaryCard label="Booking hom nay" value={summary.totalBookings} />
        <SummaryCard label="Cho check-in" value={summary.pendingCheckin} />
        <SummaryCard label="Dang luu tru" value={summary.checkedIn} />
        <SummaryCard label="Phong trong" value={summary.availableRooms} />
      </div>
      <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Tac vu nhanh</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to={PATHS.STAFF_BOOKINGS_TODAY}>Xu ly booking hom nay</Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_ROOMS_STATUS}>Cap nhat phong</Link>
          <Link className="btn btn-gold" to={PATHS.STAFF_SERVICE_USAGE}>Them dich vu booking</Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <BookingStatusChart data={bookingByStatus} />
        <article className="card" style={{ padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Tinh trang booking hom nay</h3>
          {bookings.length === 0 ? (
            <EmptyState title="Hom nay chua co booking" description="Staff co the tao walk-in booking khi khach den truc tiep." />
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {bookings.slice(0, 5).map((item) => (
                <div key={item.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span>{item.id?.slice(0, 8)}...</span>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="card" style={{ padding: 14 }}>
      <div style={{ color: "#64748b", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </article>
  );
}
