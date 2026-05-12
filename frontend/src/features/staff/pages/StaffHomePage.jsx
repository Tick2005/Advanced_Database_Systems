import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockRoomData = [
  { name: 'Deluxe', available: 12, occupied: 15 },
  { name: 'Suite', available: 5, occupied: 8 },
  { name: 'Family', available: 3, occupied: 10 },
  { name: 'Standard', available: 20, occupied: 5 },
];

export default function StaffHomePage() {
  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-primary-deep)' }}>Staff Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--color-muted)' }}>Cập nhật tình hình vận hành ca hôm nay</p>
        </div>
        <button className="btn-gold" style={{ 
          padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: 'none', 
          background: 'var(--color-gold)', color: 'var(--color-primary-deep)',
          fontWeight: 'bold', cursor: 'pointer', boxShadow: 'var(--shadow-soft)'
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
          <div key={kpi.title} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
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
        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-deep)' }}>Booking cần xử lý gấp</h3>
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

        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--color-primary-deep)' }}>Phân bố phòng</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockRoomData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
                <Bar dataKey="available" name="Trống" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupied" name="Có khách" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
