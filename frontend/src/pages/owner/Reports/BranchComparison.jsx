import React, { useEffect, useState } from 'react';
import reportService from '../../../services/reportService';
import { formatVND } from '../../../utils/currency';
import PageHeader from '../../../components/common/PageHeader';

const BranchComparison = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ reportService.getOwnerDashboard().then(setSummary).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  return (
    <div>
      <PageHeader title="So sánh chi nhánh" subtitle="Hiệu suất theo chi nhánh" />
      {loading ? <p>Đang tải...</p> : !summary ? <p style={{color:'var(--color-muted)'}}>Không có dữ liệu</p> : (
        <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:20}}>
            {[['Tổng doanh thu',formatVND(summary.totalRevenue),'💰'],['Tổng đặt phòng',summary.totalBookings,'📋'],['Tổng chi nhánh',summary.totalBranches,'🏢'],['Tổng phòng',summary.totalRooms,'🏠']].map(([l,v,ic])=>(
              <div key={l} style={{textAlign:'center',padding:16}}>
                <div style={{fontSize:32,marginBottom:8}}>{ic}</div>
                <div style={{fontSize:22,fontWeight:700,color:'var(--color-accent)'}}>{v||'—'}</div>
                <div style={{fontSize:13,color:'var(--color-muted)',marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default BranchComparison;
