import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ROLES = ['CUSTOMER','STAFF','MANAGER','OWNER'];
const RoleManagement = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(params.get('userId')||'');
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); if(!userId) return; setLoading(true);
    try { await userService.updateRole(userId, role); alert('Cập nhật vai trò thành công!'); navigate('/owner/users'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Phân quyền người dùng" />
      <form onSubmit={handleSubmit} style={{maxWidth:440,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="User ID" required><Input value={userId} onChange={e=>setUserId(e.target.value)} required /></FormField>
          <FormField label="Vai trò">
            <Select value={role} onChange={e=>setRole(e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </Select>
          </FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Cập nhật vai trò</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default RoleManagement;
