import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import Button from '../../../components/ui/Button';
import FormField, { Input } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName:'', phoneNumber:'', address:'', dateOfBirth:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userService.getProfile().then(d => d && setForm({ fullName: d.fullName||'', phoneNumber: d.phoneNumber||'', address: d.address||'', dateOfBirth: d.dateOfBirth?.split('T')[0]||'' })).catch(()=>{});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await userService.updateProfile(form);
      alert('Cập nhật thành công!'); navigate('/customer/profile');
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Chỉnh sửa hồ sơ" />
      <form onSubmit={handleSubmit} style={{maxWidth:480,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Họ tên" required><Input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} /></FormField>
          <FormField label="Số điện thoại"><Input value={form.phoneNumber} onChange={e=>setForm({...form,phoneNumber:e.target.value})} /></FormField>
          <FormField label="Địa chỉ"><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></FormField>
          <FormField label="Ngày sinh"><Input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} /></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Lưu thay đổi</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default ProfileEdit;
