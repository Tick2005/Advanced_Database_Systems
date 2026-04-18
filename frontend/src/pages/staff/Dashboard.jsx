import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import roomService from '../../services/roomService';
import PageHeader from '../../components/common/PageHeader';

const Dashboard = () => {
  const [todayBookings, setTodayBookings] = useState([]);
  const [roomStats, setRoomStats] = useState({ available: 0, occupied: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookingService.getTodayBookings().catch(()=>[]),
      roomService.getRoomStatus().catch(()=>[]),
    ]).then(([bookings, rooms]) => {
      setTodayBookings(bookings || []);
      const rms = rooms || [];
      setRoomStats({ total: rms.length, available: rms.filter(r=>r.status==='AVAILABLE').length, occupied: rms.filter(r=>r.status==='OCCUPIED').length });
    }).finally(()=>setLoading(false));
  }, []);

  const stats = [
    { label:'Đặt phòng hôm nay', value: todayBookings.length, icon:'📅', color:'var(--color-accent)', to:'/staff/bookings/today' },
    { label:'Phòng trống', value: roomStats.available, icon:'✅', color:'var(--color-success)', to:'/staff/rooms/status' },
    { label:'Phòng đã đặt', value: roomStats.occupied, icon:'🔴', color:'var(--color-danger)', to:'/staff/rooms/status' },
    { label:'Tổng phòng', value: roomStats.total, icon:'🏠', color:'var(--color-muted)', to:'/staff/rooms/status' },
  ];

  return (
    <div>
      <PageHeader title="Staff Dashboard" subtitle="Quản lý hoạt động hàng ngày" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:28}}>
        {stats.map(s => (
          <Link to={s.to} key={s.label} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'20px',boxShadow:'var(--shadow-soft)',display:'block'}}>
            <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.color}}>{loading ? '...' : s.value}</div>
            <div style={{fontSize:13,color:'var(--color-muted)',marginTop:4}}>{s.label}</div>
          </Link>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
        {[{to:'/staff/checkin',icon:'✅',label:'Check-in'},{to:'/staff/checkout',icon:'🚪',label:'Check-out'},{to:'/staff/bookings/today',icon:'📅',label:'Hôm nay'},{to:'/staff/service-usage',icon:'🍽️',label:'Dịch vụ'}].map(a => (
          <Link key={a.to} to={a.to} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'20px',boxShadow:'var(--shadow-soft)',textAlign:'center',display:'block'}}>
            <div style={{fontSize:36,marginBottom:8}}>{a.icon}</div>
            <div style={{fontWeight:600}}>{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
