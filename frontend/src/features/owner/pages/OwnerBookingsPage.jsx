import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { formatCurrencyVnd } from "../../../services/presenters";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";

export default function OwnerBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    avgOccupancy: 0,
    topRooms: [],
    topBranches: [],
    bookingsByService: []
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      dashboardService.getOwnerBookings?.() || Promise.resolve([])
    ]).then(([data]) => {
      const allBookings = data || [];
      setBookings(allBookings);
      
      // Calculate stats
      const totalRev = allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const branchGroups = {};
      const roomGroups = {};
      
      allBookings.forEach(b => {
        branchGroups[b.branchName] = (branchGroups[b.branchName] || 0) + 1;
        roomGroups[b.roomTypeName] = (roomGroups[b.roomTypeName] || 0) + 1;
      });
      
      setStats({
        totalBookings: allBookings.length,
        totalRevenue: totalRev,
        avgOccupancy: Math.round((allBookings.length / Math.max(1, allBookings.length)) * 100),
        topRooms: Object.entries(roomGroups)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topBranches: Object.entries(branchGroups)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        bookingsByService: []
      });
    }).catch((err) => {
      setError(err.message || "Không thể tải booking data");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white"
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>📊 Phân tích Booking</h1>
        <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 14 }}>Thống kê phòng, chi nhánh và doanh thu từ booking</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <StatCard icon="📋" label="Tổng booking" value={stats.totalBookings} />
        <StatCard icon="💰" label="Tổng doanh thu" value={formatCurrencyVnd(stats.totalRevenue)} />
        <StatCard icon="📈" label="Tỉ lệ occupancy" value={`${stats.avgOccupancy}%`} />
        <StatCard icon="🎯" label="Chi nhánh hoạt động" value={stats.topBranches.length} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {/* Top Rooms */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 700 }}>🛏️ Top phòng được đặt</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {stats.topRooms.length > 0 ? (
              stats.topRooms.map((room, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{room.name}</span>
                  <span style={{ fontWeight: 700, color: "#0d2238", background: "#f1f5f9", padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>{room.count} lần</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có booking</p>
            )}
          </div>
        </div>

        {/* Top Branches */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 700 }}>🏢 Chi nhánh có booking nhiều</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {stats.topBranches.length > 0 ? (
              stats.topBranches.map((branch, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{branch.name}</span>
                  <span style={{ fontWeight: 700, color: "#0d2238", background: "#f1f5f9", padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>{branch.count} booking</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có booking</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to={PATHS.OWNER}>🏠 Quay lại Dashboard</Link>
        <Link className="btn btn-gold" to={PATHS.OWNER_PRICING_REQUESTS}>✅ Duyệt pricing requests</Link>
      </div>

      {/* Booking Table */}
      <div className="card" style={{ padding: 16, overflowX: "auto" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 700 }}>📋 Danh sách booking gần đây</h3>
        {bookings.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Booking ID", "Chi nhánh", "Phòng", "Khách", "Ngày vào", "Ngày ra", "Giá", "Trạng thái"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 12px", color: "#0d2238", fontWeight: 600 }}>{b.id?.slice(-6) || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{b.branchName || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{b.roomTypeName || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{b.guestName || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{b.checkInDate || "-"}</td>
                  <td style={{ padding: "8px 12px" }}>{b.checkOutDate || "-"}</td>
                  <td style={{ padding: "8px 12px", fontWeight: 700 }}>{formatCurrencyVnd(b.totalPrice || 0)}</td>
                  <td style={{ padding: "8px 12px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: "#f0fdf4", color: "#166534", borderRadius: 999 }}>{b.status || "PENDING"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có booking</p>
        )}
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0d2238" }}>{value}</div>
    </div>
  );
}
