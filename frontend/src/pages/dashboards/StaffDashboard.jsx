import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockRoomData = [
  { name: 'Deluxe', available: 12, occupied: 15 },
  { name: 'Suite', available: 5, occupied: 8 },
  { name: 'Family', available: 3, occupied: 10 },
  { name: 'Standard', available: 20, occupied: 5 },
];

export default function StaffDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F7F6' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0'
      }}>
        <div style={{ padding: '0 20px', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
          <span style={{ color: 'var(--color-gold)' }}>Lux</span>Stay Staff
        </div>
        <nav style={{ flex: 1 }}>
          {['Dashboard', 'Booking hôm nay', 'Trạng thái phòng', 'Dịch vụ booking'].map((item, idx) => (
            <div key={item} style={{
              padding: '15px 20px',
              cursor: 'pointer',
              borderLeft: idx === 0 ? '4px solid var(--color-gold)' : '4px solid transparent',
              backgroundColor: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              color: idx === 0 ? 'var(--color-gold)' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ color: 'var(--color-gold)' }}>■</span> {item}
            </div>
          ))}
        </nav>
        <div style={{ padding: '15px 20px', cursor: 'pointer', color: '#ff6b6b' }}>Đăng xuất</div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Staff Dashboard</h1>
          <button className="btn-gold" style={{ 
            padding: '12px 24px', 
            borderRadius: 'var(--radius-sm)', 
            border: 'none', 
            background: 'var(--color-gold)', 
            color: 'var(--color-primary)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>+ Nhanh: Check-in / Đặt phòng</button>
        </header>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {[
            { title: 'Nhận phòng h.nay', value: '24', color: '#f39c12', icon: '📥' },
            { title: 'Đang lưu trú', value: '142', color: '#3498db', icon: '🛏️' },
            { title: 'Chờ dọn dẹp', value: '18', color: '#e74c3c', icon: '🧹' },
            { title: 'Phòng trống', value: '40', color: '#2ecc71', icon: '✅' },
          ].map(kpi => (
            <div key={kpi.title} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '32px' }}>{kpi.icon}</div>
              <div>
                <div style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '5px' }}>{kpi.title}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: kpi.color }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tables & Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Booking cần xử lý gấp</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                  <th style={{ padding: '10px' }}>Khách hàng</th>
                  <th style={{ padding: '10px' }}>Phòng</th>
                  <th style={{ padding: '10px' }}>Thời gian</th>
                  <th style={{ padding: '10px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map(i => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: '500' }}>Nguyễn Văn Khách {i}</td>
                    <td style={{ padding: '12px 10px' }}>{100 + i}</td>
                    <td style={{ padding: '12px 10px', color: '#e74c3c' }}>Quá hạn 15p</td>
                    <td style={{ padding: '12px 10px' }}>
                      <button style={{ background: 'var(--color-gold)', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Check-in</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Phân bố phòng</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRoomData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}}/>
                  <Bar dataKey="available" name="Trống" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="occupied" name="Có khách" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
