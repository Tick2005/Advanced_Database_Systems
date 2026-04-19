import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { PATHS } from "../../../routes/pathConstants";
import { ProfitByBranchChart, OccupancyRateChart } from "../../../components/common/ChartWidgets";

export default function OwnerHomePage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    dashboardService.getOwnerDashboard().then((data) => {
      setSummary(data || null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonBlock rows={6} />;

  const branchBars = [
    { label: "Da Nang Center", value: Number(summary?.conversion?.confirmRate || 0) },
    { label: "HCM Riverside", value: Number(summary?.conversion?.holdRate || 0) }
  ];
  const maxBar = Math.max(1, ...branchBars.map((item) => item.value));

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Owner Dashboard</h1>
      <div className="stats-grid">
        <SummaryCard label="Chi nhanh hoat dong" value={summary?.activeBranchCount || 0} />
        <SummaryCard label="Ti le hold" value={`${summary?.conversion?.holdRate || 0}%`} />
        <SummaryCard label="Ti le confirm" value={`${summary?.conversion?.confirmRate || 0}%`} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(480px,1fr))" }}>
        <ProfitByBranchChart />
        <OccupancyRateChart />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
        <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Tổng quan vận hành</h3>
          <div style={{ color: "#475569" }}>Active branches: <strong>{summary?.activeBranchCount || 0}</strong></div>
          <div style={{ color: "#475569" }}>Hold rate: <strong>{summary?.conversion?.holdRate || 0}%</strong></div>
          <div style={{ color: "#475569" }}>Confirm rate: <strong>{summary?.conversion?.confirmRate || 0}%</strong></div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Bạn có thể xem report chi tiết để xem theo thời gian và theo từng chi nhánh.</p>
        </article>
      </div>

      <div className="card" style={{ padding: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to={PATHS.OWNER_BRANCHES}>Quan ly chi nhanh</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.OWNER_PRICING_REQUESTS}>Duyet pricing requests</Link>
        <Link className="btn btn-gold" to={PATHS.OWNER_REPORT_REVENUE}>Xem bao cao</Link>
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
