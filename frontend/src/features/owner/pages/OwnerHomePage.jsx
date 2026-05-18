import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrencyVnd, formatVndAmount } from '../../../services/presenters';
import { dashboardService } from '../../dashboard/dashboardService';
import { branchService } from '../../branches/branchService';

const BRANCH_COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

// Label tùy chỉnh cho PieChart
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function OwnerHomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.getOwnerDashboard().catch(() => null),
      branchService.getBranches().catch(() => []),
    ])
      .then(([summary, branchList]) => {
        setDashboard(summary || null);
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch((err) => setLoadError(err?.message || 'Không thể tải dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // ── Dữ liệu biểu đồ cột doanh thu 6 tháng theo chi nhánh ─────────────
  const { branchRevenueData, branchNames } = useMemo(() => {
    const raw = dashboard?.branchRevenueSeries;
    if (!Array.isArray(raw) || raw.length === 0) {
      return { branchRevenueData: [], branchNames: [] };
    }
    const nameSet = new Set();
    raw.forEach((row) => {
      Object.keys(row).forEach((k) => { if (k !== 'period') nameSet.add(k); });
    });
    return { branchRevenueData: raw, branchNames: Array.from(nameSet) };
  }, [dashboard]);

  // ── Dữ liệu PieChart lợi nhuận ròng theo chi nhánh ───────────────────
  // Lợi nhuận ròng = 30% tổng doanh thu của từng chi nhánh
  // Lấy trực tiếp từ branchRevenueSeries (tổng 6 tháng × 30%)
  const profitPieData = useMemo(() => {
    // Ưu tiên 1: tính từ branchRevenueSeries — nguồn dữ liệu chính xác nhất
    if (branchNames.length > 0 && branchRevenueData.length > 0) {
      return branchNames.map((name) => {
        const total = branchRevenueData.reduce((sum, row) => sum + (Number(row[name]) || 0), 0);
        return { name, value: Math.round(total * 0.3) };
      }).filter((d) => d.value > 0);
    }
    // Ưu tiên 2: kpiMetrics nếu có
    const kpiBranches = dashboard?.kpiMetrics?.branches;
    if (Array.isArray(kpiBranches) && kpiBranches.length > 0) {
      return kpiBranches.map((b) => ({
        name: b.branchName,
        value: Math.round((b.revenue || 0) * 0.3),
      })).filter((d) => d.value > 0);
    }
    // Fallback cuối: dùng profitYtd chia đều theo số chi nhánh
    const totalProfit = dashboard?.profitYtd ?? Math.round((dashboard?.revenueYtd ?? 0) * 0.3);
    if (totalProfit > 0 && branches.length > 0) {
      return branches.map((b) => ({
        name: b.name,
        value: Math.round(totalProfit / branches.length),
      }));
    }
    return [];
  }, [dashboard, branchNames, branchRevenueData, branches]);

  // ── Heatmap booking tháng này ─────────────────────────────────────────
  const heatmapDays = useMemo(() => {
    const raw = dashboard?.bookingHeatmap;
    if (Array.isArray(raw) && raw.length > 0) {
      const maxCount = Math.max(...raw.map((d) => d.count || 0), 1);
      return raw.map((d) => ({ day: d.day, value: Math.round(((d.count || 0) / maxCount) * 100), count: d.count || 0 }));
    }
    return Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 0, count: 0 }));
  }, [dashboard]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>⏳ Đang tải dashboard owner...</div>;
  }
  if (loadError) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-danger)' }}>❌ {loadError}</div>;
  }

  const hasBranchRevenueData = branchRevenueData.length > 0;
  const hasProfitData = profitPieData.length > 0;
  const hasHeatmapData = heatmapDays.some((d) => d.value > 0);
  // Tổng lợi nhuận ròng = tổng của profitPieData (đã tính 30% từ branchRevenueSeries)
  const totalNetProfit = profitPieData.reduce((s, d) => s + d.value, 0);
  // Tổng doanh thu từ branchRevenueSeries (6 tháng)
  const totalRevenue6M = branchNames.length > 0 && branchRevenueData.length > 0
    ? branchNames.reduce((sum, name) =>
        sum + branchRevenueData.reduce((s, row) => s + (Number(row[name]) || 0), 0), 0)
    : (dashboard?.revenueYtd ?? 0);

  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary-deep)' }}>
            Tổng quan Tài chính & Chiến lược
          </h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--color-muted)' }}>
            Phân tích hiệu suất kinh doanh toàn hệ thống · {branches.length} chi nhánh
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: '1px solid var(--color-gold)',
          color: 'var(--color-gold-deep)', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
        }}>
          🏢 {branches.length} chi nhánh
        </span>
      </header>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--color-muted)', marginBottom: 8, fontSize: 14 }}>Tổng Doanh Thu (YTD)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatCurrencyVnd(dashboard?.revenueYtd ?? 0)}
          </div>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--color-muted)', marginBottom: 8, fontSize: 14 }}>Tổng Chi Phí (YTD)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-ink)', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatCurrencyVnd(dashboard?.costYtd ?? 0)}
          </div>
        </div>
        <div className="card" style={{ padding: '24px', border: '2px solid var(--color-gold)', background: 'linear-gradient(135deg, var(--color-surface), var(--color-gold-light))' }}>
          <div style={{ color: 'var(--color-muted)', marginBottom: 8, fontSize: 14 }}>Lợi Nhuận Ròng (30%)</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-gold-deep)', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatCurrencyVnd(dashboard?.profitYtd ?? Math.round((dashboard?.revenueYtd ?? 0) * 0.3))}
          </div>
          {dashboard?.profitMargin != null && (
            <div style={{ color: '#16a34a', fontSize: 13, marginTop: 8, fontWeight: 700 }}>
              Biên lợi nhuận {dashboard.profitMargin}%
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Biểu đồ cột doanh thu + Pie lợi nhuận ròng ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>

        {/* Biểu đồ CỘT doanh thu từng chi nhánh 6 tháng */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>
            📊 So sánh Doanh thu theo Chi nhánh (6 tháng gần nhất)
          </h3>
          {!hasBranchRevenueData ? (
            <div style={{ height: 300, display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
              Chưa có dữ liệu doanh thu
            </div>
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchRevenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatVndAmount(v)} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatCurrencyVnd(value)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  {branchNames.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      name={name}
                      fill={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={40}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Biểu đồ TRÒN lợi nhuận ròng theo chi nhánh (30% doanh thu) */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, textAlign: 'center', color: 'var(--color-primary-deep)', fontSize: 14 }}>
            💰 Lợi nhuận ròng theo Chi nhánh
            <span style={{ fontSize: 11, color: 'var(--color-muted)', display: 'block', marginTop: 2 }}>
              Tổng DT 6 tháng: {formatCurrencyVnd(totalRevenue6M)} → Lãi ròng (30%): {formatCurrencyVnd(totalNetProfit)}
            </span>
          </h3>
          {!hasProfitData ? (
            <div style={{ height: 280, display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
              Chưa có dữ liệu lợi nhuận
            </div>
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profitPieData}
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    dataKey="value"
                    labelLine={false}
                    label={PieLabel}
                  >
                    {profitPieData.map((entry, i) => (
                      <Cell key={entry.name} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyVnd(value)} />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(value, entry) => (
                      <span style={{ color: '#334155' }}>
                        {value} — {formatCurrencyVnd(entry.payload.value)}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Heatmap booking tháng này ── */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>
          🗓️ Lượt đặt phòng theo ngày (tháng này)
        </h3>
        {!hasHeatmapData ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
            Chưa có dữ liệu đặt phòng trong tháng này
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
              {heatmapDays.map(({ day, value, count }) => (
                <div
                  key={day}
                  title={`Ngày ${day}: ${count} booking`}
                  style={{
                    width: '30px', height: '30px', borderRadius: '4px',
                    backgroundColor:
                      value > 80 ? 'var(--color-gold)' :
                      value > 50 ? 'var(--color-primary)' :
                      value > 20 ? '#93c5fd' :
                      'var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: value > 50 ? 'white' : 'var(--color-muted)',
                    fontSize: '10px', fontWeight: 600, cursor: 'default',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '13px', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
              {[
                { bg: 'var(--color-border)', label: 'Thấp' },
                { bg: '#93c5fd', label: 'Trung bình thấp' },
                { bg: 'var(--color-primary)', label: 'Trung bình' },
                { bg: 'var(--color-gold)', label: 'Cao' },
              ].map(({ bg, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 14, height: 14, background: bg, borderRadius: 2 }} /> {label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
