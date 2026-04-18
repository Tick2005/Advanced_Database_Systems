import React, { useState } from 'react';
import feedbackService from '../../../services/feedbackService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Textarea } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ReplyFeedback = () => {
  const [form, setForm] = useState({ feedbackId:'', replyMessage:'' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await feedbackService.replyFeedback(form); alert('Phản hồi thành công!'); setForm({feedbackId:'',replyMessage:''}); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <PageHeader title="Phản hồi đánh giá" />
      <form onSubmit={handleSubmit} style={{maxWidth:480,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Mã phản hồi" required><Input value={form.feedbackId} onChange={e=>setForm({...form,feedbackId:e.target.value})} required /></FormField>
          <FormField label="Nội dung phản hồi" required><Textarea value={form.replyMessage} onChange={e=>setForm({...form,replyMessage:e.target.value})} required /></FormField>
          <Button type="submit" variant="primary" loading={loading}>Gửi phản hồi</Button>
        </div>
      </form>
    </div>
  );
};
export default ReplyFeedback;
