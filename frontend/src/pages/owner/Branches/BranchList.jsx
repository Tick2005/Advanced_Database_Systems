import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import branchService from '../../../services/branchService';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/common/EmptyState';

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ branchService.getPublicBranches().then(d=>setBranches(d||[])).finally(()=>setLoading(false)); },[]);
  return (
    <div>
      <PageHeader title="Quản lý chi nhánh" subtitle={`${branches.length} chi nhánh`} actions={<Link to="/owner/branches/create"><Button variant="primary" size="sm">➕ Thêm chi nhánh</Button></Link>} />
      {loading ? <p>Đang tải...</p> : !branches.length ? <EmptyState icon="🏢" title="Chưa có chi nhánh nào" /> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {branches.map(b => (
            <div key={b.id} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'20px',boxShadow:'var(--shadow-soft)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <h3 style={{fontWeight:700,marginBottom:4}}>{b.name}</h3>
                  <p style={{fontSize:13,color:'var(--color-muted)'}}>{b.address}</p>
                </div>
                <span style={{fontSize:12,padding:'3px 8px',borderRadius:99,background:b.active?'var(--color-success-light)':'var(--color-danger-light)',color:b.active?'var(--color-success)':'var(--color-danger)',fontWeight:600}}>
                  {b.active?'Hoạt động':'Ngừng'}
                </span>
              </div>
              {b.phone && <p style={{fontSize:13,color:'var(--color-muted)'}}>📞 {b.phone}</p>}
              {b.email && <p style={{fontSize:13,color:'var(--color-muted)'}}>📧 {b.email}</p>}
              <div style={{display:'flex',gap:8,marginTop:14}}>
                <Link to={`/owner/branches/${b.id}/edit`}><Button variant="ghost" size="sm">✏️ Sửa</Button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default BranchList;
