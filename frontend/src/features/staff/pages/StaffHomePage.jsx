import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardService } from '../../dashboard/dashboardService';
import LoadingState from '../../../components/common/LoadingState';

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

export default function StaffHomePage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ checkinsToday: 0, currentStays: 0, cleaningPending: 0, emptyRooms: 0 });
  const [roomStatusPie, setRoomStatusPie] = useState([]);
  const [roomStatusBar, setRoomStatusBar] = useState([]);
  const [urgentBookings, setUrgentBookings] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookings, roomStatus] = await Promise.all([
        dashboardService.getStaffTodayBookings(),
        dashboardService.getStaffRoomStatus(),
      ]);

      const bk = bookings || [];
      // Urgent = CONFIRMED (chờ check-in) hoặc HOLD/PENDING_PAYMENT
      setUrgentBookings(
        bk.filter((b) => ['CONFIRMED', 'HOLD', 'PENDING_PAYMENT'].includes(b.status)).slice(0, 8)
      );

      const rooms = roomStatus || [];

      // Pie: tình trạng phòng chi nhánh
      const statusMap = {};
      rooms.forEach((r) => {
        const s = r.status || 'AVAILABLE';
        statusMap[s] = (statusMap[s] || 0) + 1;
      });
      setRoomStatusPie(
        Object.entries(statusMap).map(([status, value]) => ({
          name: STATUS_LABELS[status] || status,
          value,
          color: STATUS_COLORS[status] || '#cbd5e1',
        }))
      );

      // Bar: phân bố phòng theo loại phòng
      const typeMap = {};
      rooms.forEach((r) => {
        const typeName = r.roomTypeName || r.roomType || 'Không rõ';
        if (!typeMap[typeName]) {
          typeMap[typeName] = { name: typeName, AVAILABLE: 0, HELD: 0, OCCUPIED: 0, MAINTENANCE: 0 };
        }
        const s = r.status || 'AVAILABLE';
        typeMap[typeName][s] = (typeMap[typeName][s] || 0) + 1;
      });
      setRoomStatusBar(Object.values(typeMap));

      const checkinsToday = bk.filter((b) => ['CONFIRMED', 'HOLD'].includes(b.status)).length;
      const currentStays = bk.filter((b) => b.status === 'CHECKED_IN').length;
      const cleaningPending = rooms.filter((r) => r.status === 'MAINTENANCE').length;
      const emptyRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;

      setKpis({ checkinsToday, currentStays, cleaningPending, emptyRooms });
    } catch (err) {
      console.error('Failed to load staff home data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingState text="Đang tải dashboard nhân viên..." />;

  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary-deep)' }}>Staff Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--color-muted)' }}>Cập nhật tình hình vận hành ca hôm nay</p>
        </div>
        <button
          className="btn-gold"
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-gold)', color: 'var(--color-primary-deep)', fontWeight: 700, cursor: 'pointer' }}
          onClick={fetchData}
        >
          🔄 Làm mới
        </button>
      </header>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { title: 'Nhận phòng h.nay', value: kpis.checkinsToday, color: '#f39c12', icon: '📥' },
          { title: 'Đang lưu trú',     value: kpis.currentStays,  color: '#3498db', icon: '🛏️' },
          { title: 'Chờ dọn dẹp',      value: kpis.cleaningPending, color: '#e74c3c', icon: '🧹' },
          { title: 'Phòng trống',       value: kpis.emptyRooms,    color: '#2ecc71', icon: '✅' },
        ].map((kpi) => (
          <div key={kpi.title} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>{kpi.icon}</div>
            <div>
              <div style={{ color: 'var(--color-muted)', fontSize: 13, marginBottom: 4 }}>{kpi.title}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Urgent bookings + Room status pie ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '20px', marginBottom: '20px' }}>
        {/* Booking cần xử lý */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-primary-deep)' }}>
            ⚡ Booking cần xử lý gấp
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                {['Khách hàng', 'Phòng', 'Thời gian', 'Hành động'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {urgentBookings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)' }}>
                    Không có booking đang chờ
                  </td>
                </tr>
              ) : urgentBookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px', fontWeight: 500, color: 'var(--color-ink)', fontSize: 13 }}>
                    {b.customerName || b.customerId?.slice(0, 8) || '—'}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--color-ink)', fontSize: 13 }}>
                    {b.roomNumber || '—'}
                  </td>
                  <td style={{ padding: '10px', fontSize: 12, color: b.status === 'CONFIRMED' ? '#0ea5e9' : '#eab308' }}>
                    {b.checkInDate} → {b.checkOutDate}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button
                      style={{ background: 'var(--color-gold)', border: 'none', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 700, color: '#0d2238', fontSize: 12 }}
                      onClick={() => dashboardService.checkInBooking(b.id).then(fetchData).catch(() => {})}
                    >
                      Check-in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tình trạng phòng chi nhánh — biểu đồ TRÒN */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-primary-deep)' }}>
            🏨 Tình trạng phòng chi nhánh
          </h3>
          {roomStatusPie.length === 0 ? (
            <div style={{ height: 260, display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
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
                    {roomStatusPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* ── Row 2: Phân bố phòng theo loại (bar chart) ── */}
      {roomStatusBar.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)', fontSize: 15 }}>
            📊 Phân bố phòng theo loại
          </h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomStatusBar} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                {Object.keys(STATUS_LABELS).map((status) => (
                  <Bar
                    key={status}
                    dataKey={status}
                    name={STATUS_LABELS[status]}
                    fill={STATUS_COLORS[status]}
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
