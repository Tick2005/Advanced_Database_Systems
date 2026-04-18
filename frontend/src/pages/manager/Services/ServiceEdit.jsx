import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import serviceService from '../../../services/serviceService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ServiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', price:0, mode:'ON_REQUEST', available:true });
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm({...form,[k]:e.target.value});
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await serviceService.updateService(id, form); alert('Cập nhật thành công!'); navigate('/manager/services'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Chỉnh sửa dịch vụ" />
      <form onSubmit={handleSubmit} style={{maxWidth:480,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Tên dịch vụ"><Input value={form.name} onChange={f('name')} /></FormField>
          <FormField label="Giá"><Input type="number" min={0} value={form.price} onChange={f('price')} /></FormField>
          <FormField label="Chế độ">
            <Select value={form.mode} onChange={f('mode')}>
              <option value="ON_REQUEST">Theo yêu cầu</option>
              <option value="INCLUSIVE">Bao gồm</option>
            </Select>
          </FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Lưu</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default ServiceEdit;
