import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Textarea } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const CreateRequest = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ roomTypeId:'', proposedPrice:0, effectiveFrom:'', reason:'', branchId:'' });
  const [loading, setLoading] = useState(false);
  const f = k => e => setForm({...form,[k]:e.target.value});
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await pricingService.createPricingRequest(form); alert('Gửi yêu cầu thành công!'); navigate('/manager/pricing-requests'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Tạo yêu cầu điều chỉnh giá" />
      <form onSubmit={handleSubmit} style={{maxWidth:520,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="ID Loại phòng" required><Input value={form.roomTypeId} onChange={f('roomTypeId')} required /></FormField>
          <FormField label="Giá đề xuất (VNĐ)" required><Input type="number" min={0} value={form.proposedPrice} onChange={f('proposedPrice')} required /></FormField>
          <FormField label="Hiệu lực từ ngày"><Input type="date" value={form.effectiveFrom} onChange={f('effectiveFrom')} /></FormField>
          <FormField label="Lý do" required><Textarea value={form.reason} onChange={f('reason')} required /></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Gửi yêu cầu</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default CreateRequest;
