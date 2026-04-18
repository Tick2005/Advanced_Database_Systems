import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import serviceService from '../../../services/serviceService';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ServiceCreate = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [form, setForm] = useState({ name:'', category:'', price:0, mode:'ON_REQUEST', branchId: auth?.branchId||'', available:true, description:'' });
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm({...form,[k]:e.target.value});
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await serviceService.createService(form); alert('Tạo dịch vụ thành công!'); navigate('/manager/services'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Thêm dịch vụ mới" />
      <form onSubmit={handleSubmit} style={{maxWidth:520,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Tên dịch vụ" required><Input value={form.name} onChange={f('name')} required /></FormField>
          <FormField label="Danh mục"><Input value={form.category} onChange={f('category')} placeholder="VD: Ăn uống, Spa, Giặt ủi..." /></FormField>
          <FormField label="Giá (VNĐ)" required><Input type="number" min={0} value={form.price} onChange={f('price')} required /></FormField>
          <FormField label="Chế độ">
            <Select value={form.mode} onChange={f('mode')}>
              <option value="ON_REQUEST">Theo yêu cầu</option>
              <option value="INCLUSIVE">Bao gồm</option>
            </Select>
          </FormField>
          <FormField label="Mô tả"><Input value={form.description} onChange={f('description')} /></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Tạo dịch vụ</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default ServiceCreate;
