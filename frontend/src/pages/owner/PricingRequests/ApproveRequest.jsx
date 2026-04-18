import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import Button from '../../../components/ui/Button';
import FormField, { Textarea } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ApproveRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const handleApprove = async () => {
    setLoading(true);
    try { await pricingService.approvePricingRequest(id, { note }); alert('Đã duyệt yêu cầu!'); navigate('/owner/pricing-requests'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Duyệt yêu cầu điều chỉnh giá" />
      <div style={{maxWidth:440,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <p style={{color:'var(--color-muted)',marginBottom:16,fontSize:14}}>Mã yêu cầu: <strong>{id}</strong></p>
        <FormField label="Ghi chú (tuỳ chọn)" style={{marginBottom:16}}><Textarea value={note} onChange={e=>setNote(e.target.value)} /></FormField>
        <div style={{display:'flex',gap:10}}>
          <Button variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
          <Button variant="success" loading={loading} onClick={handleApprove} style={{flex:1}}>✅ Duyệt yêu cầu</Button>
        </div>
      </div>
    </div>
  );
};
export default ApproveRequest;
