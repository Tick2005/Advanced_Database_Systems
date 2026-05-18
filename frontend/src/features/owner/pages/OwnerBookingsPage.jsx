import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";

export default function OwnerBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      dashboardService.getOwnerDashboard().catch(() => null),
      dashboardService.getOwnerReports().catch(() => [])
    ])
      .then(([dash, rep]) => {
        if (cancelled) return;
        setDashboard(dash);
        setReports(rep || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Booking analytics derived from dashboard data ──────────────────────
  const stats = useMemo(() => {
    const conv = dashboard?.conversion;
    const total = conv?.total ?? 0;
    const confirmed = conv?.confirmed ?? 0;
    const cancelled = total - confirmed;
    const rate = conv?.conversionRate != null ? Math.round(conv.conversionRate * 100) / 100 : 0;
    return {
      totalBookings: total,
      confirmed,
      cancelled: Math.max(0, cancelled),
      conversionPct: rate,
      activeBranches: dashboard?.activeBranchCount ?? 0,
    };
  }, [dashboard]);

  // ── Booking count by branch (from reports — each row is a room type per branch) ──
  const bookingsByBranch = useMemo(() => {
    const map = {};
    (reports || []).forEach((row) => {
      const key = row.branchId || "unknown";
      if (!map[key]) {
        map[key] = { branchName: row.branchName || key, bookings: 0 };
      }
      // profit_rank is a proxy for booking volume — use it as relative count
      // total_revenue > 0 means there were bookings in that quarter
      if (row.totalRevenue > 0) map[key].bookings += 1;
    });
    return Object.values(map).sort((a, b) => b.bookings - a.bookings);
  }, [reports]);

  // ── Booking heatmap from dashboard (monthly trend) ──────────────────────
  const heatmapData = useMemo(() => {
    const raw = dashboard?.bookingHeatmap;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((d) => ({ day: `N${d.day}`, count: d.count || 0 }));
  }, [dashboard]);

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
        <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 14 }}>
          Tổng quan chuyển đổi và xu hướng đặt phòng toàn hệ thống
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <StatCard icon="📋" label="Tổng booking" value={stats.totalBookings} />
        <StatCard icon="✅" label="Đã xác nhận" value={stats.confirmed} color="#16a34a" />
        <StatCard icon="❌" label="Đã hủy" value={stats.cancelled} color="#b91c1c" />
        <StatCard icon="📈" label="Tỷ lệ chuyển đổi" value={`${stats.conversionPct}%`} color="#9a7d24" />
        <StatCard icon="🏢" label="Chi nhánh hoạt động" value={stats.activeBranches} />
      </div>

      {/* Booking heatmap (daily this month) */}
      {heatmapData.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
            🗓️ Lượt đặt phòng theo ngày (tháng này)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={heatmapData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" name="Lượt đặt" fill="#0d2238" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Booking count by branch */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
          🏢 Lượt đặt phòng theo chi nhánh
        </h3>
        {bookingsByBranch.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có dữ liệu booking theo chi nhánh.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {bookingsByBranch.map((branch, i) => {
              const maxCount = bookingsByBranch[0]?.bookings || 1;
              const pct = Math.round((branch.bookings / maxCount) * 100);
              return (
                <div key={branch.branchName} style={{ display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "#0d2238" }}>#{i + 1} {branch.branchName}</span>
                    <span style={{ fontWeight: 700, color: "#9a7d24" }}>{branch.bookings} loại phòng có booking</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${pct}%`, borderRadius: 99,
                      background: i === 0
                        ? "linear-gradient(90deg,#c9a84c,#9a7d24)"
                        : "linear-gradient(90deg,#0d2238,#1e3a5f)",
                      transition: "width 0.4s"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top room types by booking activity */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
          🛏️ Loại phòng có hoạt động booking (theo quý)
        </h3>
        <div style={{ display: "grid", gap: 8 }}>
          {reports.length > 0 ? (
            reports.slice(0, 8).map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0d2238" }}>
                    {row.roomTypeName || "Loại phòng"}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                    {row.branchName || ""} · Q{row.revenueQuarter ? new Date(row.revenueQuarter).getMonth() < 3 ? 1 : new Date(row.revenueQuarter).getMonth() < 6 ? 2 : new Date(row.revenueQuarter).getMonth() < 9 ? 3 : 4 : "?"}
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: "#0d2238", background: "#f1f5f9", padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>
                  Hạng #{row.profitRank || i + 1}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có dữ liệu báo cáo loại phòng.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="card" style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to={PATHS.OWNER}>🏠 Quay lại Dashboard</Link>
        <Link className="btn btn-gold" to={PATHS.OWNER_PRICING_REQUESTS}>✅ Duyệt pricing requests</Link>
        <Link className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} to={PATHS.OWNER_BRANCHES}>🏢 Quản lý chi nhánh</Link>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value, color = "#0d2238" }) {
  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
