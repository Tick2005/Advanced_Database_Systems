import React from 'react';
import { useApiQuery } from '../../hooks/useApiQuery';
import { feedbackService } from '../../features/feedback/feedbackService';
import { queryKeys } from '../../services/queryKeys';
import LoadingState from './LoadingState';

export default function TopFeedbacks() {
  const feedbacksQuery = useApiQuery({
    queryKey: queryKeys.topFeedbacks,
    queryFn: () => feedbackService.getTopFeedbacks(6),
    staleTime: 5 * 60 * 1000
  });

  const feedbacks = feedbacksQuery.data || [];

  if (feedbacksQuery.isLoading) {
    return <LoadingState />;
  }
  return (
    <section style={{ backgroundColor: 'var(--color-primary-deep)', padding: '60px 20px', color: 'white' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: 'var(--color-gold)', margin: 0, fontSize: '32px' }}>Khách hàng nói gì</h2>
            <p style={{ color: 'var(--color-muted)', marginTop: '10px' }}>Top phản hồi nổi bật từ những vị khách tuyệt vời của chúng tôi.</p>
          </div>
          <button style={{ background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 24px', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s' }}>
            Xem lịch sử đánh giá →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {feedbacks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>Chưa có đánh giá nào</p>
          ) : (
            feedbacks.map(fb => (
              <div key={fb.id} className="card" style={{ 
                backgroundColor: 'white', color: 'var(--color-ink)', padding: '30px', 
                borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'transform 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <img src={`https://i.pravatar.cc/150?u=${fb.id}`} alt={fb.customerName} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px' }}>{fb.customerName}</h4>
                    <div style={{ color: 'var(--color-muted)', fontSize: '14px' }}>
                      {new Date(fb.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>
                <div style={{ color: 'var(--color-gold)', marginBottom: '15px', fontSize: '20px' }}>
                  {"★".repeat(Math.round(fb.rating))}{"☆".repeat(5 - Math.round(fb.rating))}
                </div>
                <p style={{ fontStyle: 'italic', margin: 0, flex: 1, color: 'var(--color-primary)', lineHeight: 1.6 }}>
                  "{fb.content}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
