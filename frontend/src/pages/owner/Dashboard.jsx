import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reportService from '../../services/reportService';
import branchService from '../../services/branchService';
import userService from '../../services/userService';
import { formatVND } from '../../utils/currency';
import PageHeader from '../../components/common/PageHeader';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportService.getOwnerDashboard().catch(()=>null),
      userService.getUsers().catch(()=>[]),
    ]).then(([s, u]) => { setSummary(s); setUsers(u||[]); }).finally(()=>setLoading(false));
  }, []);

  const cards = [
    { label:'Tổng người dùng', value: users.length, icon:'👥', color:'var(--color-accent)', to:'/owner/users' },
    { label:'Tổng đặt phòng', value: summary?.totalBookings||'—', icon:'📋', color:'var(--color-info)', to:'/owner/reports/revenue' },
    { label:'Doanh thu', value: summary?.totalRevenue ? formatVND(summary.totalRevenue) : '—', icon:'💰', color:'var(--color-success)', to:'/owner/reports/revenue' },
    { label:'Chi nhánh', value: summary?.totalBranches||'—', icon:'🏢', color:'var(--color-warning)', to:'/owner/branches' },
  ];

  return (
    <div>
      <PageHeader title="Owner Dashboard" subtitle="Tổng quan toàn hệ thống" />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:28}}>
        {cards.map(c=>(
          <Link key={c.label} to={c.to} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:20,boxShadow:'var(--shadow-soft)',display:'block'}}>
            <div style={{fontSize:28,marginBottom:8}}>{c.icon}</div>
            <div style={{fontSize:loading?14:24,fontWeight:700,color:c.color}}>{loading?'Đang tải...':c.value}</div>
            <div style={{fontSize:13,color:'var(--color-muted)',marginTop:4}}>{c.label}</div>
          </Link>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
        {[{to:'/owner/branches/create',icon:'🏢',label:'Thêm chi nhánh'},{to:'/owner/pricing/create',icon:'💰',label:'Tạo giá mới'},{to:'/owner/pricing-requests',icon:'📝',label:'Yêu cầu giá'},{to:'/owner/reports/revenue',icon:'📈',label:'Xem báo cáo'}].map(a=>(
          <Link key={a.to} to={a.to} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:20,boxShadow:'var(--shadow-soft)',textAlign:'center',display:'block'}}>
            <div style={{fontSize:32,marginBottom:8}}>{a.icon}</div><div style={{fontWeight:600,fontSize:14}}>{a.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
