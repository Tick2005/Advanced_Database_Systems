import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import Button from '../../../components/ui/Button';
import FormField, { Input } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const PricingCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ roomTypeId:'', branchId:'', basePrice:0, weekendMultiplier:1.2, effectiveFrom:'', effectiveTo:'' });
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm({...form,[k]:e.target.value});
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await pricingService.createPricing(form); alert('Tạo giá thành công!'); navigate('/owner/pricing'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Tạo chính sách giá mới" />
      <form onSubmit={handleSubmit} style={{maxWidth:520,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="ID Loại phòng" required><Input value={form.roomTypeId} onChange={f('roomTypeId')} required /></FormField>
          <FormField label="ID Chi nhánh"><Input value={form.branchId} onChange={f('branchId')} /></FormField>
          <FormField label="Giá cơ bản (VNĐ)" required><Input type="number" min={0} value={form.basePrice} onChange={f('basePrice')} required /></FormField>
          <FormField label="Hệ số cuối tuần"><Input type="number" step="0.1" min={1} value={form.weekendMultiplier} onChange={f('weekendMultiplier')} /></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FormField label="Hiệu lực từ"><Input type="date" value={form.effectiveFrom} onChange={f('effectiveFrom')} /></FormField>
            <FormField label="Hiệu lực đến"><Input type="date" value={form.effectiveTo} onChange={f('effectiveTo')} /></FormField>
          </div>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Tạo chính sách giá</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default PricingCreate;
