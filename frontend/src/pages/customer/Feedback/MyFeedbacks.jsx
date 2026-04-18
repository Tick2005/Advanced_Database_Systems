import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import feedbackService from '../../../services/feedbackService';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/common/EmptyState';
import { formatDate } from '../../../utils/dateTime';

const MyFeedbacks = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { feedbackService.getMyFeedbacks().then(d=>setFeedbacks(d||[])).finally(()=>setLoading(false)); }, []);
  return (
    <div>
      <PageHeader title="Đánh giá của tôi" actions={<Link to="/customer/feedbacks/create"><Button variant="primary" size="sm">➕ Gửi đánh giá</Button></Link>} />
      {loading ? <p>Đang tải...</p> : !feedbacks.length ? <EmptyState icon="💬" title="Chưa có đánh giá nào" action={<Link to="/customer/feedbacks/create" style={{padding:'10px 20px',background:'var(--color-accent)',color:'#fff',borderRadius:'var(--radius-sm)',fontWeight:600}}>Gửi đánh giá</Link>} /> : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {feedbacks.map((f,i) => (
            <div key={i} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 20px',boxShadow:'var(--shadow-soft)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontWeight:600}}>Phòng: {f.roomId}</span>
                <span>{'⭐'.repeat(f.rating||5)}</span>
              </div>
              <p style={{color:'var(--color-muted)',fontSize:14,marginBottom:f.replyMessage?12:0}}>{f.comment}</p>
              {f.replyMessage && <div style={{background:'var(--color-accent-light)',borderLeft:'3px solid var(--color-accent)',padding:'8px 12px',fontSize:13,borderRadius:'0 var(--radius-sm) var(--radius-sm) 0'}}>💬 Phản hồi: {f.replyMessage}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyFeedbacks;
