import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { PATHS } from "../../../routes/pathConstants";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { RevenueChart, BookingStatusChart } from "../../../components/common/ChartWidgets";

export default function ManagerHomePage() {
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const run = async () => {
      const branchData = await branchService.getBranches();
      const activeBranch = branchData?.[0]?.id || "";
      setBranches(branchData || []);
      setBranchId(activeBranch);
      const [roomData, bookingData, requestData] = await Promise.all([
        activeBranch ? dashboardService.getManagerRoomsByBranch(activeBranch) : [],
        dashboardService.getManagerBookings(),
        dashboardService.getManagerPricingRequests()
      ]);
      setRooms(roomData || []);
      setBookings(bookingData || []);
      setRequests(requestData || []);
      setLoading(false);
    };

    run().catch(() => setLoading(false));
  }, []);

  const summary = useMemo(() => ({
    branches: branches.length,
    rooms: rooms.length,
    openBookings: bookings.filter((item) => ["HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"].includes(item.status)).length,
    pendingPricing: requests.filter((item) => item.status === "PENDING").length
  }), [branches, rooms, bookings, requests]);

  const bookingByStatus = useMemo(() => {
    const map = new Map();
    bookings.forEach((item) => {
      map.set(item.status, (map.get(item.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const roomByStatus = useMemo(() => {
    const map = new Map();
    rooms.forEach((item) => {
      map.set(item.status, (map.get(item.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [rooms]);

  const recentBookings = bookings.slice(0, 5);
  const maxBookingStatus = Math.max(1, ...bookingByStatus.map((item) => item.value));
  const maxRoomStatus = Math.max(1, ...roomByStatus.map((item) => item.value));

  if (loading) return <SkeletonBlock rows={6} />;

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Manager Dashboard</h1>
      <div style={{ color: "#64748b" }}>Chi nhanh mac dinh: {branchId || "Khong xac dinh"}</div>
      <div className="stats-grid">
        <SummaryCard label="So chi nhanh" value={summary.branches} />
        <SummaryCard label="So phong quan ly" value={summary.rooms} />
        <SummaryCard label="Booking dang mo" value={summary.openBookings} />
        <SummaryCard label="Pricing pending" value={summary.pendingPricing} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <RevenueChart />
        <BookingStatusChart data={bookingByStatus.map(item => ({ name: item.label, value: item.value }))} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Phân bố phòng theo trạng thái</h3>
          <div className="chart-bars">
            {roomByStatus.map((item) => (
              <div key={item.label} className="chart-row">
                <span style={{ fontSize: 13, color: "#475569" }}>{item.label}</span>
                <div className="chart-track"><div className="chart-fill" style={{ width: `${(item.value / maxRoomStatus) * 100}%` }} /></div>
                <span className="mono" style={{ textAlign: "right" }}>{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Booking gan day</h3>
        {recentBookings.length === 0 && <span style={{ color: "#64748b" }}>Chua co booking.</span>}
        {recentBookings.map((item) => (
          <div key={item.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>{item.id.slice(0, 8)}... · {item.status}</span>
            <span className="mono">{item.totalPrice || 0}</span>
          </div>
        ))}
      </article>

      <div className="card" style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Link className="btn btn-primary" to={PATHS.MANAGER_ROOMS}>Quan ly phong</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_BOOKINGS}>Quan ly booking</Link>
        <Link className="btn btn-gold" to={PATHS.MANAGER_PRICING_REQUESTS}>Pricing requests</Link>
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
