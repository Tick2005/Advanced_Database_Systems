import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import roomService from '../../services/roomService';
import PageHeader from '../../components/common/PageHeader';

const Dashboard = () => {
  const [stats, setStats] = useState({ bookings:0, rooms:0, available:0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([bookingService.getManagerBookings().catch(()=>[]), roomService.getPublicRooms().catch(()=>[])]).then(([b,r]) => {
      setStats({ bookings:(b||[]).length, rooms:(r||[]).length, available:(r||[]).filter(x=>x.status==='AVAILABLE').length });
    }).finally(()=>setLoading(false));
  }, []);
  const cards = [
    {to:'/manager/bookings',icon:'📋',label:'Tổng đặt phòng',value:stats.bookings,color:'var(--color-accent)'},
    {to:'/manager/rooms',icon:'🏠',label:'Tổng phòng',value:stats.rooms,color:'var(--color-info)'},
    {to:'/manager/rooms',icon:'✅',label:'Phòng trống',value:stats.available,color:'var(--color-success)'},
    {to:'/manager/pricing-requests',icon:'💰',label:'Yêu cầu giá',value:'→',color:'var(--color-warning)'},
  ];
  return (
    <div>
      <PageHeader title="Manager Dashboard" subtitle="Tổng quan hoạt động chi nhánh" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:28}}>
        {cards.map(c=>(
          <Link key={c.label} to={c.to} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:20,boxShadow:'var(--shadow-soft)',display:'block'}}>
            <div style={{fontSize:28,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:28,fontWeight:700,color:c.color}}>{loading?'...':c.value}</div>
            <div style={{fontSize:13,color:'var(--color-muted)',marginTop:4}}>{c.label}</div>
          </Link>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
        {[{to:'/manager/rooms/create',icon:'➕',label:'Thêm phòng'},{to:'/manager/services/create',icon:'🍽️',label:'Thêm dịch vụ'},{to:'/manager/feedbacks',icon:'💬',label:'Phản hồi'},{to:'/manager/reports/revenue',icon:'📈',label:'Doanh thu'}].map(a=>(
          <Link key={a.to} to={a.to} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:20,boxShadow:'var(--shadow-soft)',textAlign:'center',display:'block'}}>
            <div style={{fontSize:32,marginBottom:8}}>{a.icon}</div><div style={{fontWeight:600,fontSize:14}}>{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
