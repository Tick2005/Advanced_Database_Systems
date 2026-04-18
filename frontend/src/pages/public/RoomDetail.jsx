import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomService from '../../services/roomService';
import feedbackService from '../../services/feedbackService';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/dateTime';
import useAuth from '../../hooks/useAuth';
import './RoomDetail.css';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [room, setRoom] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      roomService.getPublicRoomDetail(id),
      feedbackService.getByRoom(id).catch(() => []),
    ]).then(([r, f]) => { setRoom(r); setFeedbacks(f || []); }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{textAlign:'center',padding:80}}>Đang tải...</div>;
  if (!room) return <div style={{textAlign:'center',padding:80}}>Không tìm thấy phòng</div>;

  return (
    <div className="rd-page">
      <div className="rd-inner">
        <button className="rd-back" onClick={() => navigate(-1)}>← Quay lại</button>
        <div className="rd-layout">
          <div className="rd-left">
            <div className="rd-img-main">
              <img src={room.imageUrls?.[0]} alt={room.roomNumber} onError={e => e.target.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'} />
            </div>
            {room.imageUrls?.length > 1 && (
              <div className="rd-img-thumbs">
                {room.imageUrls.slice(1,4).map((u,i) => <img key={i} src={u} alt="" />)}
              </div>
            )}
            <div className="rd-feedbacks">
              <h3>Đánh giá ({feedbacks.length})</h3>
              {!feedbacks.length ? <p style={{color:'var(--color-muted)'}}>Chưa có đánh giá nào</p> :
                feedbacks.map((f, i) => (
                  <div key={i} className="rd-fb-item">
                    <div className="rd-fb-header">
                      <strong>{f.customerName || f.userId}</strong>
                      <span>{'⭐'.repeat(f.rating || 5)}</span>
                    </div>
                    <p>{f.comment}</p>
                    {f.replyMessage && <div className="rd-fb-reply">💬 Phản hồi: {f.replyMessage}</div>}
                  </div>
                ))
              }
            </div>
          </div>
          <div className="rd-right">
            <h1>Phòng {room.roomNumber}</h1>
            <p className="rd-type">{room.roomType?.name} · Tầng {room.floor}</p>
            <div className="rd-price">{formatVND(room.currentPrice)}<span>/đêm</span></div>
            <div className="rd-badges">
              <span className={`badge badge-${room.status?.toLowerCase()}`}>{room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đặt'}</span>
              <span className="badge badge-info">{room.capacity} người</span>
            </div>
            <div className="rd-details">
              <div className="rd-detail-row"><span>Diện tích:</span><strong>{room.area ? `${room.area} m²` : 'N/A'}</strong></div>
              <div className="rd-detail-row"><span>Tầng:</span><strong>{room.floor}</strong></div>
              <div className="rd-detail-row"><span>Sức chứa:</span><strong>{room.capacity} người</strong></div>
              {room.description && <div className="rd-desc"><p>{room.description}</p></div>}
            </div>
            {room.amenities?.length > 0 && (
              <div className="rd-amenities">
                <h4>Tiện nghi</h4>
                <div className="amenities-list">{room.amenities.map(a => <span key={a}>{a}</span>)}</div>
              </div>
            )}
            <button className="rd-book-btn" disabled={room.status !== 'AVAILABLE'}
              onClick={() => isAuthenticated ? navigate('/customer/booking/create', { state: { room } }) : navigate('/login')}>
              {room.status === 'AVAILABLE' ? '🛎️ Đặt phòng ngay' : 'Phòng không khả dụng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RoomDetail;
