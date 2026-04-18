import React, { useEffect, useState } from 'react';
import feedbackService from '../../../services/feedbackService';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';
import FormField, { Input } from '../../../components/ui/FormField';

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const search = () => { if(!roomId) return; setLoading(true); feedbackService.getManagerFeedbacks(roomId).then(d=>setFeedbacks(d||[])).finally(()=>setLoading(false)); };
  return (
    <div>
      <PageHeader title="Phản hồi khách hàng" />
      <div style={{display:'flex',gap:12,marginBottom:20}}>
        <FormField style={{flex:1}}><Input value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Nhập ID phòng..." /></FormField>
        <Button variant="primary" onClick={search}>Tìm</Button>
      </div>
      {loading ? <p>Đang tải...</p> : !feedbacks.length ? <p style={{color:'var(--color-muted)'}}>Chưa tìm thấy phản hồi nào</p> : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {feedbacks.map((f,i) => (
            <div key={i} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 20px',boxShadow:'var(--shadow-soft)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <strong>{f.customerName||f.userId}</strong>
                <span>{'⭐'.repeat(f.rating||5)}</span>
              </div>
              <p style={{color:'var(--color-muted)',fontSize:14,marginBottom:f.replyMessage?10:0}}>{f.comment}</p>
              {f.replyMessage && <div style={{background:'var(--color-accent-light)',padding:'8px 12px',borderLeft:'3px solid var(--color-accent)',borderRadius:'0 var(--radius-sm) var(--radius-sm) 0',fontSize:13}}>💬 Phản hồi: {f.replyMessage}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default FeedbackList;
