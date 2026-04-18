import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import Button from '../../../components/ui/Button';
import FormField, { Textarea } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const RejectRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handleReject = async () => {
    if(!reason.trim()) return alert('Vui lòng nhập lý do từ chối');
    setLoading(true);
    try { await pricingService.rejectPricingRequest(id, { reason }); alert('Đã từ chối yêu cầu!'); navigate('/owner/pricing-requests'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Từ chối yêu cầu điều chỉnh giá" />
      <div style={{maxWidth:440,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <p style={{color:'var(--color-muted)',marginBottom:16,fontSize:14}}>Mã yêu cầu: <strong>{id}</strong></p>
        <FormField label="Lý do từ chối" required style={{marginBottom:16}}><Textarea value={reason} onChange={e=>setReason(e.target.value)} required /></FormField>
        <div style={{display:'flex',gap:10}}>
          <Button variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
          <Button variant="danger" loading={loading} onClick={handleReject} style={{flex:1}}>❌ Từ chối</Button>
        </div>
      </div>
    </div>
  );
};
export default RejectRequest;
