import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { BookingStatusChart, RoomStatusGroupBarChart } from "../../../components/common/ChartWidgets";

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
      setError(err.message || "Không thể tải dashboard staff");
    }).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => ({
    totalBookings: bookings.length,
    pendingCheckin: bookings.filter((b) => b.status === "CONFIRMED").length,
    checkedIn: bookings.filter((b) => b.status === "CHECKED_IN").length,
    availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length
  }), [bookings, rooms]);

  const bookingByStatus = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const top5Rooms = useMemo(() => {
    const active = bookings.filter((b) => ["CONFIRMED", "CHECKED_IN", "HOLD"].includes(b.status));
    const roomCount = new Map();
    active.forEach((b) => {
      const key = b.roomId || b.roomNumber || b.id;
      const label = b.roomNumber || b.roomId?.slice(0, 8) || "?";
      if (!roomCount.has(key)) roomCount.set(key, { roomId: key, roomNumber: label, count: 0, status: b.status });
      roomCount.get(key).count += 1;
    });
    return Array.from(roomCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings]);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Staff Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Tổng quan vận hành ca hôm nay</p>
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <SummaryCard icon="📅" label="Booking hôm nay" value={summary.totalBookings} color="#3b82f6" />
        <SummaryCard icon="🔑" label="Chờ check-in" value={summary.pendingCheckin} color="#f59e0b" />
        <SummaryCard icon="🛏️" label="Đang lưu trú" value={summary.checkedIn} color="#10b981" />
        <SummaryCard icon="✅" label="Phòng trống" value={summary.availableRooms} color="#6366f1" />
      </div>

      <div className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>⚡ Tác vụ nhanh</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to={PATHS.STAFF_BOOKINGS_TODAY}>📋 Xử lý booking hôm nay</Link>
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.STAFF_ROOMS_STATUS}>🏨 Cập nhật trạng thái phòng</Link>
          <Link className="btn btn-gold" to={PATHS.STAFF_SERVICE_USAGE}>🍽️ Dịch vụ booking</Link>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}>
        <RoomStatusGroupBarChart rooms={rooms} />
        <BookingStatusChart data={bookingByStatus} />
      </div>

      <article className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>🏆 Top 5 phòng đang được đặt hôm nay</h3>
          <Link className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }} to={PATHS.STAFF_BOOKINGS_TODAY}>
            Xem chi tiết →
          </Link>
        </div>
        {top5Rooms.length === 0 ? (
          <EmptyState title="Hôm nay chưa có phòng được đặt" description="Booking sẽ hiển thị tại đây khi khách đặt phòng." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {top5Rooms.map((item, idx) => (
              <div key={item.roomId} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10,
                background: idx === 0 ? "#fffbeb" : "#f8fafc",
                border: `1px solid ${idx === 0 ? "#fde68a" : "#e2e8f0"}`
              }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: idx === 0 ? "#d97706" : "#94a3b8", minWidth: 28 }}>
                  #{idx + 1}
                </span>
                <div style={{ flex: 1, display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Phòng {item.roomNumber}</span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{item.count} booking active</span>
                </div>
                <StatusBadge value={item.status} />
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>📋 Tình trạng booking hôm nay</h3>
        {bookings.length === 0 ? (
          <EmptyState title="Hôm nay chưa có booking" description="Staff có thể tạo walk-in booking khi khách đến trực tiếp." />
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {bookings.slice(0, 8).map((item) => (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                borderBottom: "1px solid #f1f5f9", paddingBottom: 8
              }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>
                    {item.customerName || item.guestName || "Khách"} · Phòng {item.roomNumber || item.roomId?.slice(0, 6) || "?"}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    {item.checkInDate} → {item.checkOutDate}
                  </span>
                </div>
                <StatusBadge value={item.status} />
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <article className="card" style={{ padding: 16, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>{value}</div>
        </div>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
    </article>
  );
}
