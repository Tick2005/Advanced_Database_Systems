import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { PATHS } from "../../../routes/pathConstants";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { RevenueChart, RoomStatusGroupBarChart, BookingStatusChart } from "../../../components/common/ChartWidgets";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function ManagerHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        // Lấy chi nhánh của manager hiện tại
        const branchData = await branchService.getBranches();
        const activeBranch = branchData?.[0] || null;
        setBranch(activeBranch);
        const activeBranchId = activeBranch?.id || "";
        const [roomData, bookingData, requestData] = await Promise.all([
          activeBranchId ? dashboardService.getManagerRoomsByBranch(activeBranchId) : Promise.resolve([]),
          dashboardService.getManagerBookings(),
          dashboardService.getManagerPricingRequests()
        ]);
        setRooms(roomData || []);
        setBookings(bookingData || []);
        setRequests(requestData || []);
      } catch (err) {
        setError(err.message || "Không thể tải manager dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const summary = useMemo(() => ({
    rooms: rooms.length,
    openBookings: bookings.filter((b) => ["HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"].includes(b.status)).length,
    pendingPricing: requests.filter((r) => r.status === "PENDING").length,
    availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length
  }), [rooms, bookings, requests]);

  const bookingByStatus = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const recentBookings = bookings.slice(0, 5);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {/* Branch header */}
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Chi nhánh quản lý</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{branch?.name || "Chưa xác định"}</div>
          {branch && (
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
              📍 {branch.address}, {branch.city} · 📞 {branch.phone || "Chưa có SĐT"}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: 13, opacity: 0.8 }}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <SummaryCard icon="🏨" label="Tổng số phòng" value={summary.rooms} color="#3b82f6" />
        <SummaryCard icon="✅" label="Phòng trống" value={summary.availableRooms} color="#10b981" />
        <SummaryCard icon="📋" label="Booking đang mở" value={summary.openBookings} color="#f59e0b" />
        <SummaryCard icon="💰" label="Pricing pending" value={summary.pendingPricing} color="#8b5cf6" />
      </div>

      {/* Quick links */}
      <div className="card" style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link className="btn btn-primary" to={PATHS.MANAGER_ROOMS}>🏨 Quản lý phòng</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_BOOKINGS}>📋 Xem tất cả booking</Link>
        <Link className="btn btn-gold" to={PATHS.MANAGER_PRICING_REQUESTS}>💰 Pricing requests</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_FEEDBACKS}>💬 Feedback khách</Link>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
        <RoomStatusGroupBarChart rooms={rooms} />
        <BookingStatusChart data={bookingByStatus} />
      </div>

      {/* Recent bookings top 5 */}
      <article className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>📅 Tình trạng booking hôm nay (Top 5)</h3>
          <Link className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }} to={PATHS.MANAGER_BOOKINGS}>
            Xem chi tiết →
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <EmptyState title="Chưa có booking" description="Booking sẽ hiển thị tại đây khi có khách đặt phòng." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {recentBookings.map((item) => (
              <div key={item.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0"
              }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {item.customerName || item.guestName || "Khách"} · Phòng {item.roomNumber || item.roomId?.slice(0, 6) || "?"}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.checkInDate} → {item.checkOutDate}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "#9a7d24", fontSize: 13 }}>{formatCurrencyVnd(item.totalPrice || 0)}</span>
                  <StatusBadge value={item.status} />
                </div>
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{value}</div>
        </div>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
    </article>
  );
}
