import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatVND = (value) => {
  return value.toLocaleString('vi-VN') + ' VNĐ';
};

const revenueData = [
  { name: '1', uv: 40000000 }, { name: '5', uv: 30000000 }, { name: '10', uv: 20000000 },
  { name: '15', uv: 27800000 }, { name: '20', uv: 18900000 }, { name: '25', uv: 23900000 },
  { name: '30', uv: 34900000 },
];

const occupancyData = [
  { name: 'T2', pct: 60 }, { name: 'T3', pct: 55 }, { name: 'T4', pct: 70 },
  { name: 'T5', pct: 85 }, { name: 'T6', pct: 95 }, { name: 'T7', pct: 100 }, { name: 'CN', pct: 80 }
];

export default function ManagerHomePage() {
  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
      {/* Filters */}
      <div className="card" style={{ padding: '15px 20px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
        <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
          <option>Tất cả chi nhánh</option>
          <option>Da Nang Center Hotel</option>
        </select>
        <input type="month" style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
        <button style={{ marginLeft: 'auto', background: 'var(--color-gold)', color: 'var(--color-primary-deep)', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          Xuất báo cáo
        </button>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>Doanh thu 30 ngày (VNĐ)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatVND} width={130} />
                <Tooltip formatter={(value) => value.toLocaleString('vi-VN') + ' VNĐ'} />
                <Line type="monotone" dataKey="uv" stroke="var(--color-gold)" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>Tỷ lệ lấp đầy tuần (%)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
                <Bar dataKey="pct" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>Nhân sự đang trực</h3>
            <button style={{ background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold-deep)', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px' }}>Phân công ca</button>
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

        <div className="card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ marginTop: 0, color: 'var(--color-primary-deep)' }}>Cảnh báo Tồn kho</h3>
            <button style={{ background: 'var(--color-gold)', border: 'none', color: 'var(--color-primary-deep)', fontWeight: 'bold', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>+ Cập nhật</button>
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
    </div>
  );
}
