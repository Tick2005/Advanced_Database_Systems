import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";
import { ProfitByBranchChart, OccupancyRateChart } from "../../../components/common/ChartWidgets";
import ErrorState from "../../../components/common/ErrorState";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function OwnerHomePage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      dashboardService.getOwnerDashboard(),
      branchService.getBranches(),
      dashboardService.getOwnerBranchRevenue().catch(() => [])
    ]).then(([data, branchData, revenueData]) => {
      setSummary(data || null);
      setBranches(branchData || []);
      // Map real revenue data
      const mapped = (branchData || []).map((b) => {
        const rev = (revenueData || []).find((r) => r.branchId === b.id || r.branchCode === b.code) || {};
        return {
          branch: b.name,
          revenue: Number(rev.totalRevenue || rev.revenue || 0),
          profit: Number(rev.profit || rev.netProfit || 0)
        };
      });
      setBranchRevenue(mapped);
    }).catch((err) => {
      setError(err.message || "Không thể tải owner dashboard");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const totalRevenue = branchRevenue.reduce((s, b) => s + b.revenue, 0);
  const totalProfit = branchRevenue.reduce((s, b) => s + b.profit, 0);

  return (
    <section style={{ display: "grid", gap: 18 }}>
      {/* Header */}
      <div style={{
        padding: "18px 22px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1a3a5c 100%)",
        color: "white"
      }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Owner Dashboard</div>
        <div style={{ fontWeight: 800, fontSize: 22 }}>LuxStay — Tổng quan toàn hệ thống</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
          {branches.length} chi nhánh đang vận hành
        </div>
      </div>

      {/* KPI */}
      <div className="stats-grid">
        <SummaryCard icon="🏢" label="Chi nhánh hoạt động" value={summary?.activeBranchCount || branches.length} color="#3b82f6" />
        <SummaryCard icon="📈" label="Tỉ lệ hold" value={`${summary?.conversion?.holdRate || 0}%`} color="#f59e0b" />
        <SummaryCard icon="✅" label="Tỉ lệ confirm" value={`${summary?.conversion?.confirmRate || 0}%`} color="#10b981" />
        <SummaryCard icon="💰" label="Tổng doanh thu" value={formatCurrencyVnd(totalRevenue)} color="#8b5cf6" />
      </div>

      {/* Quick links */}
      <div className="card" style={{ padding: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to={PATHS.OWNER_BRANCHES}>🏢 Quản lý chi nhánh</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.OWNER_PRICING_REQUESTS}>✅ Duyệt pricing requests</Link>
        <Link className="btn btn-gold" to={PATHS.OWNER_PRICING}>💵 Quản lý pricing</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.OWNER_USERS}>👥 Quản lý người dùng</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.OWNER_LOGS}>🧾 Logs</Link>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))" }}>
        <ProfitByBranchChart data={branchRevenue.length > 0 ? branchRevenue : undefined} />
        <OccupancyRateChart />
      </div>

      {/* Branch performance table */}
      <article className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>🏢 Lợi nhuận theo chi nhánh</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Chi nhánh", "Thành phố", "Doanh thu", "Lợi nhuận", "Tỉ lệ"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => {
                const rev = branchRevenue[i] || { revenue: 0, profit: 0 };
                const rate = rev.revenue > 0 ? ((rev.profit / rev.revenue) * 100).toFixed(1) : "—";
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{b.name}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{b.city}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#0d2238" }}>{formatCurrencyVnd(rev.revenue)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#16a34a" }}>{formatCurrencyVnd(rev.profit)}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b" }}>{rate !== "—" ? `${rate}%` : "—"}</td>
                  </tr>
                );
              })}
              {branches.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
          <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
        </div>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
    </article>
  );
}
