import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import feedbackService from '../../../services/feedbackService';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import FormField, { Input, Textarea, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const CreateFeedback = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [form, setForm] = useState({ roomId:'', bookingId:'', rating:5, comment:'', userId: auth?.userId||auth?.id||'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await feedbackService.createFeedback(form); alert('Gửi đánh giá thành công!'); navigate('/customer/feedbacks'); }
    catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Gửi đánh giá" />
      <form onSubmit={handleSubmit} style={{maxWidth:520,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Mã phòng" required><Input value={form.roomId} onChange={e=>setForm({...form,roomId:e.target.value})} placeholder="Nhập ID phòng" required /></FormField>
          <FormField label="Mã đặt phòng"><Input value={form.bookingId} onChange={e=>setForm({...form,bookingId:e.target.value})} placeholder="(Tuỳ chọn)" /></FormField>
          <FormField label="Đánh giá">
            <Select value={form.rating} onChange={e=>setForm({...form,rating:+e.target.value})}>
              {[5,4,3,2,1].map(n=><option key={n} value={n}>{'⭐'.repeat(n)} ({n} sao)</option>)}
            </Select>
          </FormField>
          <FormField label="Nội dung" required><Textarea value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} placeholder="Chia sẻ trải nghiệm của bạn..." required /></FormField>
          <div style={{display:'flex',gap:10}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Gửi đánh giá</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default CreateFeedback;
