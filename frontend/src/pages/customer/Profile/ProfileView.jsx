import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../../services/userService';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';
import { formatDate } from '../../../utils/dateTime';

const ProfileView = () => {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { userService.getProfile().then(setProfile).finally(() => setLoading(false)); }, []);
  if (loading) return <p>Đang tải...</p>;
  const data = profile || auth;
  return (
    <div>
      <PageHeader title="Hồ sơ cá nhân" actions={<Link to="/customer/profile/edit"><Button variant="ghost" size="sm">✏️ Chỉnh sửa</Button></Link>} />
      <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)',maxWidth:560}}>
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24}}>
          <div style={{width:72,height:72,background:'var(--color-accent)',color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700}}>
            {(data?.fullName || data?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{fontFamily:'var(--font-display)'}}>{data?.fullName || '-'}</h2>
            <p style={{color:'var(--color-muted)',fontSize:14}}>{data?.role || 'CUSTOMER'}</p>
          </div>
        </div>
        {[['📧 Email',data?.email],['📞 Điện thoại',data?.phoneNumber],['🎂 Ngày sinh',formatDate(data?.dateOfBirth)],['🏠 Địa chỉ',data?.address]].map(([l,v]) => (
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--color-border)',fontSize:14}}>
            <span style={{color:'var(--color-muted)'}}>{l}</span><strong>{v || '-'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ProfileView;
