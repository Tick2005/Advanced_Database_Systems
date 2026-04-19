import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffHomePage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    Promise.all([
      dashboardService.getStaffTodayBookings(),
      dashboardService.getStaffRoomStatus()
    ]).then(([bookingData, roomData]) => {
      setBookings(bookingData || []);
      setRooms(roomData || []);
    }).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => ({
    totalBookings: bookings.length,
    pendingCheckin: bookings.filter((item) => item.status === "CONFIRMED").length,
    checkedIn: bookings.filter((item) => item.status === "CHECKED_IN").length,
    availableRooms: rooms.filter((item) => item.status === "AVAILABLE").length
  }), [bookings, rooms]);

  if (loading) return <SkeletonBlock rows={6} />;

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
