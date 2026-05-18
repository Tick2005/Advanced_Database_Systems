import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrencyVnd, formatVndAmount } from '../../../services/presenters';
import { dashboardService } from '../../dashboard/dashboardService';

// Room status colours & labels
const STATUS_COLORS = {
  AVAILABLE:   '#34d399',
  HELD:        '#fbbf24',
  OCCUPIED:    '#60a5fa',
  MAINTENANCE: '#f87171',
};
const STATUS_LABELS = {
  AVAILABLE:   'Trống',
  HELD:        'Tạm giữ',
  OCCUPIED:    'Có khách',
  MAINTENANCE: 'Bảo trì',
};

export default function ManagerHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      dashboardService.getManagerBranchInfo().catch(() => null),
      dashboardService.getManagerBookings().catch(() => []),
      dashboardService.getStaffTodayBookings().catch(() => []),
      dashboardService.getManagerStaff().catch(() => []),
      dashboardService.getStaffRoomStatus().catch(() => []),
    ])
      .then(([branchInfo, bookings, todayBookings, staff, rooms]) => {
        setData({
          branchInfo,
          bookings: bookings || [],
          todayBookings: todayBookings || [],
          staff: staff || [],
          rooms: rooms || [],
        });
      })
      .catch((err) => setError(err?.message || 'Không thể tải dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // ── All hooks before early returns ────────────────────────────────────────

  // Doanh thu theo ngày trong tháng này — biểu đồ CỘT
  const revenueData = useMemo(() => {
    if (!data?.bookings?.length) return [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay = Array.from({ length: daysInMonth }, (_, i) => ({ name: `N${i + 1}`, uv: 0 }));
    (data.bookings || []).forEach((b) => {
      if (!['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status)) return;
      const d = b.checkInDate ? new Date(b.checkInDate) : null;
      if (!d || d.getFullYear() !== year || d.getMonth() !== month) return;
      const idx = d.getDate() - 1;
      if (idx >= 0 && idx < byDay.length) byDay[idx].uv += Number(b.totalPrice || 0);
    });
    // Only return days up to today with at least 1 booking
    const today = now.getDate();
    return byDay.slice(0, today).filter((d) => d.uv > 0);
  }, [data]);

  // Tình trạng phòng — biểu đồ TRÒN (tất cả chi nhánh)
  const roomStatusPie = useMemo(() => {
    const rooms = data?.rooms || [];
    if (rooms.length === 0) return [];
    const map = {};
    rooms.forEach((r) => {
      const s = r.status || 'AVAILABLE';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || '#cbd5e1',
    }));
  }, [data]);

  const activeStaff = useMemo(() => (data?.staff || []).filter((s) => s.active !== false).slice(0, 6), [data]);

  const kpis = useMemo(() => {
    const bookings = data?.bookings || [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalBookings: bookings.length,
      todayCheckins: bookings.filter((b) => b.checkInDate === today && ['CONFIRMED', 'CHECKED_IN'].includes(b.status)).length,
      activeGuests: bookings.filter((b) => b.status === 'CHECKED_IN').length,
      revenue: bookings
        .filter((b) => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.status))
        .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0),
    };
  }, [data]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)' }}>⏳ Đang tải dashboard...</div>;
  }
  if (error) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-danger)' }}>❌ {error}</div>;
  }

  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng booking', value: kpis.totalBookings, icon: '📋', color: '#0284c7' },
          { label: 'Check-in hôm nay', value: kpis.todayCheckins, icon: '📥', color: '#d97706' },
          { label: 'Đang lưu trú', value: kpis.activeGuests, icon: '🛏️', color: '#16a34a' },
          { label: 'Doanh thu (tháng)', value: formatCurrencyVnd(kpis.revenue), icon: '💰', color: '#9a7d24', small: true },
        ].map((k) => (
          <div key={k.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: k.small ? 16 : 26, fontWeight: 800, color: k.color, fontFamily: 'JetBrains Mono, monospace' }}>
                {k.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Doanh thu theo ngày — biểu đồ CỘT */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)', fontSize: 15 }}>
            💰 Doanh thu theo ngày (tháng này)
          </h3>
          {revenueData.length === 0 ? (
            <div style={{ height: 260, display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
              Chưa có dữ liệu doanh thu
            </div>
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatVndAmount(v)} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [formatCurrencyVnd(value), 'Doanh thu']} />
                  <Bar dataKey="uv" name="Doanh thu" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tình trạng phòng — biểu đồ TRÒN tất cả chi nhánh */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)', fontSize: 15 }}>
            🏨 Tình trạng phòng (tất cả chi nhánh)
          </h3>
          {roomStatusPie.length === 0 ? (
            <div style={{ height: 260, display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
              Chưa có dữ liệu phòng
            </div>
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomStatusPie}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {roomStatusPie.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Staff on duty ── */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--color-primary-deep)', fontSize: 15 }}>👥 Nhân sự chi nhánh</h3>
          <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>{activeStaff.length} nhân viên</span>
        </div>
        {activeStaff.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
            Chưa có dữ liệu nhân sự
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {activeStaff.map((s) => (
              <div key={s.id || s.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'var(--color-paper)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#16a34a', fontSize: 10 }}>●</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-ink)' }}>
                    {s.fullName || s.email || 'Nhân viên'}
                  </span>
                  {s.role && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      {s.role}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  {s.branchName || data?.branchInfo?.name || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
