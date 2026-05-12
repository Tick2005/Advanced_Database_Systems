import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: '1', uv: 4000 }, { name: '5', uv: 3000 }, { name: '10', uv: 2000 },
  { name: '15', uv: 2780 }, { name: '20', uv: 1890 }, { name: '25', uv: 2390 },
  { name: '30', uv: 3490 },
];

const occupancyData = [
  { name: 'T2', pct: 60 }, { name: 'T3', pct: 55 }, { name: 'T4', pct: 70 },
  { name: 'T5', pct: 85 }, { name: 'T6', pct: 95 }, { name: 'T7', pct: 100 }, { name: 'CN', pct: 80 }
];

export default function ManagerDashboard() {
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
        <div style={{ padding: '0 20px', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
          <span style={{ color: 'var(--color-gold)' }}>Lux</span>Stay Manager
        </div>
        <nav style={{ flex: 1 }}>
          {['Báo cáo doanh thu', 'Nhân sự', 'Đánh giá khách hàng', 'Tồn kho'].map((item, idx) => (
            <div key={item} style={{
              padding: '15px 20px', cursor: 'pointer',
              borderLeft: idx === 0 ? '4px solid var(--color-gold)' : '4px solid transparent',
              backgroundColor: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              color: idx === 0 ? 'var(--color-gold)' : 'white',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ color: 'var(--color-gold)' }}>■</span> {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        {/* Filters */}
        <div className="card" style={{ padding: '15px 20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <option>Tất cả chi nhánh</option>
            <option>Da Nang Center Hotel</option>
          </select>
          <input type="month" style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
          <button style={{ marginLeft: 'auto', background: 'var(--color-gold)', color: 'var(--color-primary)', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            Xuất báo cáo
          </button>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3>Doanh thu 30 ngày (VND)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="uv" stroke="var(--color-gold)" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card" style={{ padding: '20px' }}>
            <h3>Tỷ lệ lấp đầy tuần (%)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <Tooltip cursor={{fill: 'transparent'}}/>
                  <Bar dataKey="pct" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>Nhân sự đang trực</h3>
              <button style={{ background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', borderRadius: '4px', cursor: 'pointer' }}>Phân công ca</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <tbody>
                {['Trần Thị B (Lễ tân)', 'Lê Văn C (Dọn phòng)', 'Phạm Thị D (Nhà hàng)'].map(staff => (
                  <tr key={staff} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 0' }}><span style={{ color: 'green', marginRight: '8px' }}>●</span> {staff}</td>
                    <td style={{ textAlign: 'right' }}>Ca Sáng (06:00 - 14:00)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>Cảnh báo Tồn kho</h3>
              <button style={{ background: 'var(--color-gold)', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>+ Cập nhật</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <tbody>
                {[
                  { item: 'Nước suối Dasani', q: 12, unit: 'chai' },
                  { item: 'Sữa tắm', q: 5, unit: 'lít' },
                  { item: 'Cafe hòa tan', q: 20, unit: 'gói' }
                ].map(row => (
                  <tr key={row.item} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 0' }}>{row.item}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 'bold' }}>{row.q} {row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
