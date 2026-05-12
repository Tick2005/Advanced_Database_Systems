import React from 'react';
import { AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dataYoY = [
  { name: 'T1', year2025: 4000, year2026: 2400 },
  { name: 'T2', year2025: 3000, year2026: 1398 },
  { name: 'T3', year2025: 2000, year2026: 9800 },
  { name: 'T4', year2025: 2780, year2026: 3908 },
  { name: 'T5', year2025: 1890, year2026: 4800 },
  { name: 'T6', year2025: 2390, year2026: 3800 },
];

const dataRadar = [
  { subject: 'Doanh thu', A: 120, B: 110, fullMark: 150 },
  { subject: 'CSKH', A: 98, B: 130, fullMark: 150 },
  { subject: 'Lấp đầy', A: 86, B: 130, fullMark: 150 },
  { subject: 'Chi phí', A: 99, B: 100, fullMark: 150 },
  { subject: 'Nhân sự', A: 85, B: 90, fullMark: 150 },
];

// Mock for heatmap
const generateHeatmapDays = () => {
  let days = [];
  for(let i=0; i<30; i++) {
    days.push(Math.floor(Math.random() * 100));
  }
  return days;
};

export default function OwnerDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F7F6' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px', backgroundColor: 'var(--color-primary)', color: 'white',
        display: 'flex', flexDirection: 'column', padding: '20px 0'
      }}>
        <div style={{ padding: '0 20px', marginBottom: '30px', fontSize: '24px', fontWeight: 'bold' }}>
          <span style={{ color: 'var(--color-gold)' }}>Lux</span>Stay Owner
        </div>
        <nav style={{ flex: 1 }}>
          {['Tài chính', 'Phân tích', 'KPI', 'Chi nhánh'].map((item, idx) => (
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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Tổng quan Tài chính & Chiến lược</h1>
          <div>
            <button style={{ background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' }}>Quản lý chi nhánh</button>
            <button className="btn-gold" style={{ background: 'var(--color-gold)', color: 'var(--color-primary)', padding: '10px 20px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Xuất Dữ Liệu</button>
          </div>
        </header>

        {/* Big Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '25px' }}>
            <div style={{ color: 'var(--color-muted)', marginBottom: '10px', fontSize: '16px' }}>Tổng Doanh Thu (YTD)</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--color-ink)' }}>$2.4M</div>
            <div style={{ color: 'green', fontSize: '14px', marginTop: '10px' }}>+12% so với năm ngoái</div>
          </div>
          <div className="card" style={{ padding: '25px' }}>
            <div style={{ color: 'var(--color-muted)', marginBottom: '10px', fontSize: '16px' }}>Tổng Chi Phí (YTD)</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--color-ink)' }}>$1.1M</div>
            <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>+4% so với năm ngoái</div>
          </div>
          <div className="card" style={{ padding: '25px', border: '2px solid var(--color-gold)', background: 'linear-gradient(135deg, #fff, #fdfaf0)' }}>
            <div style={{ color: 'var(--color-muted)', marginBottom: '10px', fontSize: '16px' }}>Lợi Nhuận Ròng (Net Profit)</div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--color-gold-deep)' }}>$1.3M</div>
            <div style={{ color: 'green', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>Biên lợi nhuận 54%</div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3>So sánh Doanh thu (YoY)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataYoY}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="year2025" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="year2026" stackId="1" stroke="var(--color-gold)" fill="var(--color-gold)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ textAlign: 'center' }}>KPI Chi nhánh (Đà Nẵng vs HCM)</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Đà Nẵng" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.6} />
                  <Radar name="HCM" dataKey="B" stroke="var(--color-gold)" fill="var(--color-gold)" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Heatmap Area */}
        <div className="card" style={{ padding: '20px' }}>
          <h3>Phân tích xu hướng Đặt phòng (Tháng này)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '15px' }}>
            {generateHeatmapDays().map((val, idx) => (
              <div key={idx} style={{
                width: '30px', height: '30px', borderRadius: '4px',
                backgroundColor: val > 80 ? 'var(--color-gold)' : val > 50 ? 'var(--color-primary)' : 'var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: val > 50 ? 'white' : 'transparent', fontSize: '10px'
              }}>
                {idx + 1}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px', fontSize: '14px', color: 'var(--color-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'15px', height:'15px', background:'var(--color-border)'}}></div> Thấp</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'15px', height:'15px', background:'var(--color-primary)'}}></div> Trung bình</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{width:'15px', height:'15px', background:'var(--color-gold)'}}></div> Cao (Full)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
